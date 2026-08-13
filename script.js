// ============================================
// 🍽️ تحميل المنيو الديناميكي - النسخة النهائية المُحسَّنة مع دعم السلتين
// ============================================

// ✅ تصحيح: تعريف المتغيرات مرة واحدة فقط لمنع خطأ SyntaxError
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get('tableId') || urlParams.get('table');
const isTableOrder = !!tableId;

const PROCESSING_KEY = 'taloola_processing_order';
const BAN_KEY = 'taloola_ban_until';
const BAN_DATA_KEY = 'taloola_ban_data';
const ACTIVE_ORDER_KEY = 'taloola_active_order';

// ═══════════════════════════════════════════════════════════
// 🛒 ✅✅✅ متغيرات السلتين المنفصلتين
// ═══════════════════════════════════════════════════════════
const DELIVERY_CART_KEY = 'taloola_cart';           // سلة الدلفري (الأصلية)
const DINEIN_CART_KEY = 'taloola_dinein_cart';      // سلة الصالة (الجديدة)

let processingDurationMs = 5 * 60 * 1000;
let banDurationMs = 5 * 60 * 60 * 1000;

let cachedCategories = [];
let cachedMenuItems = null;
let isMenuInitialized = false;
let activeOrderListener = null;
let processingInterval = null;
let banCountdownInterval = null;

// ═══════════════════════════════════════════════════════════
// 🛒 السلة النشطة (دلفري أو صالة)
// ═══════════════════════════════════════════════════════════
let shoppingCart = [];   // سلة الدلفري
let dineInCart = [];     // سلة الصالة

// ✅ تهيئة السلتين من localStorage
try {
    shoppingCart = safeJsonParse(safeLocalStorageGet(DELIVERY_CART_KEY) || '[]', []);
    if (!Array.isArray(shoppingCart)) shoppingCart = [];
    
    dineInCart = safeJsonParse(safeLocalStorageGet(DINEIN_CART_KEY) || '[]', []);
    if (!Array.isArray(dineInCart)) dineInCart = [];
} catch (e) { 
    shoppingCart = []; 
    dineInCart = []; 
}

if (tableId) {
    window.currentTableId = tableId;
    console.log('🍽️ طلب من الطاولة:', tableId, '- سيتم استخدام سلة الصالة');
} else {
    console.log('🛵 طلب دلفري عادي - سيتم استخدام سلة الدلفري');
}

// إظهار حقل عدد الأشخاص فقط إذا كان الطلب من طاولة
if (isTableOrder) {
    const personCountGroup = document.getElementById('personCountGroup');
    if (personCountGroup) personCountGroup.style.display = 'block';
    console.log(`تم فتح المنيو لـ: طاولة رقم ${tableId}`);
}

// ═══════════════════════════════════════════════════════════
// 🎯 دوال مساعدة للوصول للسلة الصحيحة تلقائياً
// ═══════════════════════════════════════════════════════════
function getActiveCart() {
    return isTableOrder ? dineInCart : shoppingCart;
}

function setActiveCart(newCart) {
    if (isTableOrder) dineInCart = newCart;
    else shoppingCart = newCart;
}

function getActiveCartKey() {
    return isTableOrder ? DINEIN_CART_KEY : DELIVERY_CART_KEY;
}

function getActiveCartName() {
    return isTableOrder ? 'سلة الصالة' : 'سلة الدلفري';
}

// ═══════════════════════════════════════════════════════════
// 🔄 إدارة الطلب النشط - دوال موحدة
// ═══════════════════════════════════════════════════════════
function saveActiveOrder(orderData) {
    try {
        const activeOrder = {
            orderId: orderData.orderId || null,
            orderNumber: orderData.orderNumber || null,
            phone: orderData.phone,
            status: orderData.status || 'pending',
            timestamp: Date.now(),
            lastChecked: Date.now(),
            isTableOrder: isTableOrder,
            tableId: isTableOrder ? tableId : null
        };
        localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(activeOrder));
        console.log('✅ تم حفظ الطلب النشط:', activeOrder);
        return true;
    } catch (e) {
        console.warn('⚠️ فشل حفظ الطلب النشط:', e);
        return false;
    }
}

function getActiveOrder() {
    try {
        const data = localStorage.getItem(ACTIVE_ORDER_KEY);
        if (!data) return null;
        const order = JSON.parse(data);
        
        const expiryTime = 24 * 60 * 60 * 1000;
        if ((Date.now() - order.timestamp) >= expiryTime) {
            clearActiveOrder();
            return null;
        }
        return order;
    } catch (e) {
        return null;
    }
}

function clearActiveOrder() {
    try {
        localStorage.removeItem(ACTIVE_ORDER_KEY);
        sessionStorage.removeItem('active_order_id');
        sessionStorage.removeItem('lastOrderNumber');
        console.log('🗑️ تم مسح الطلب النشط');
        return true;
    } catch (e) {
        console.warn('⚠️ فشل مسح الطلب النشط');
        return false;
    }
}

function isOrderActive(activeOrder = null) {
    const order = activeOrder || getActiveOrder();
    if (!order || !order.orderId) return false;
    
    const finalStatuses = ['completed', 'delivered', 'cancelled', 'rejected'];
    if (finalStatuses.includes(order.status)) return false;
    
    const activeStatuses = ['pending', 'preparing', 'ready', 'on_the_way'];
    return activeStatuses.includes(order.status);
}

async function refreshActiveOrderStatus() {
    const order = getActiveOrder();
    if (!order || !order.phone || !order.orderNumber || typeof firebase === 'undefined' || !firebase.database) {
        updateTrackingButtonVisibility();
        return false;
    }
    
    try {
        const snapshot = await firebase.database()
            .ref(`users/${order.phone}/orders`)
            .orderByChild('orderNumber')
            .equalTo(parseInt(order.orderNumber))
            .limitToLast(1)
            .once('value');
        
        const data = snapshot.val();
        if (!data) {
            clearActiveOrder();
            updateTrackingButtonVisibility();
            return false;
        }
        
        const orderId = Object.keys(data)[0];
        const freshOrder = data[orderId];
        
        if (freshOrder.status !== order.status) {
            order.status = freshOrder.status;
            order.lastChecked = Date.now();
            localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(order));
            console.log(`🔄 تم تحديث حالة الطلب #${order.orderNumber} إلى: ${freshOrder.status}`);
        }
        
        updateTrackingButtonVisibility();
        
        const finalStatuses = ['completed', 'delivered', 'cancelled', 'rejected'];
        if (finalStatuses.includes(freshOrder.status)) {
            setTimeout(() => {
                clearActiveOrder();
                updateTrackingButtonVisibility();
                showNotification('✅ تم تحديث حالة طلبك! يمكنك الآن تقديم طلب جديد.');
            }, 3000);
        }
        
        return true;
    } catch (error) {
        console.warn('⚠️ فشل التحقق من حالة الطلب:', error);
        updateTrackingButtonVisibility();
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 🛡️ دوال مساعدة آمنة
// ═══════════════════════════════════════════════════════════
function safeLocalStorageGet(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.warn(`⚠️ localStorage get: ${key}`);
        return defaultValue;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn(`⚠️ localStorage set: ${key}`);
        return false;
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.warn(`⚠️ localStorage remove: ${key}`);
        return false;
    }
}

function safeJsonParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return defaultValue;
    }
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+TuyDZhNmI2YXYryDYqtmC2LPYqSDYp9mE2YXYutmI2LHYqTwvdGV4dD48L3N2Zz4=';

// ═══════════════════════════════════════════════════════════
// 📥 تحميل المنيو من Firebase
// ═══════════════════════════════════════════════════════════
function loadMenuFromFirebase() {
    if (typeof firebase === 'undefined' || !firebase.database) {
        setTimeout(loadMenuFromFirebase, 500);
        return;
    }
    
    console.log('🔍 بدء تحميل المنيو من Firebase...');
    
    firebase.database().ref('categories').orderByChild('order').on('value', 
        (snapshot) => {
            const categories = snapshot.val();
            if (!categories) {
                console.warn('⚠️ لا توجد أقسام في Firebase');
                return;
            }
            
            cachedCategories = Object.keys(categories).map(key => ({
                id: key,
                ...categories[key]
            })).sort((a, b) => (a.order || 0) - (b.order || 0));
            
            console.log(`✅ تم تحميل ${cachedCategories.length} قسم`);
            
            rebuildMenuSections(cachedCategories);
            updateNavigationButtons(cachedCategories);
            
            if (cachedMenuItems) {
                populateMenuItems(cachedCategories, cachedMenuItems);
                setTimeout(() => {
                    if (smartImageLoader) smartImageLoader.observeAllImages();
                }, 200);
            }
        },
        (error) => {
            console.error('❌ خطأ في تحميل الأقسام:', error);
        }
    );
    
    firebase.database().ref('menu').on('value',
        (snapshot) => {
            cachedMenuItems = snapshot.val();
            if (!cachedMenuItems) {
                console.warn('⚠️ لا توجد أصناف في Firebase');
                return;
            }
            
            console.log(`✅ تم تحميل ${Object.keys(cachedMenuItems).length} صنف`);
            
            if (cachedCategories.length > 0) {
                populateMenuItems(cachedCategories, cachedMenuItems);
                setTimeout(() => {
                    if (smartImageLoader) smartImageLoader.observeAllImages();
                }, 200);
            }
        },
        (error) => {
            console.error('❌ خطأ في تحميل الأصناف:', error);
        }
    );
}

// ═══════════════════════════════════════════════════════════
// 🏗️ بناء أقسام المنيو
// ═══════════════════════════════════════════════════════════
function rebuildMenuSections(categoriesArray) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error('❌ عنصر main غير موجود');
        return;
    }
    
    const oldSections = mainElement.querySelectorAll('.menu-section[data-category]');
    oldSections.forEach(section => section.remove());
    
    const teamSection = mainElement.querySelector('#team');
    const referenceElement = teamSection || mainElement.querySelector('#support') || mainElement.querySelector('#social');
    
    categoriesArray.forEach((category) => {
        const newSection = document.createElement('section');
        newSection.className = 'menu-section animate-in';
        newSection.id = `sec-${category.id}`;
        newSection.setAttribute('data-category', category.name);
        
        newSection.innerHTML = `
            <h3>${category.icon || '📁'} ${category.name}</h3>
            <div class="menu-items"></div>
        `;
        
        if (referenceElement) {
            mainElement.insertBefore(newSection, referenceElement);
        } else {
            mainElement.appendChild(newSection);
        }
    });
    
    console.log(`✨ تم إنشاء ${categoriesArray.length} قسم جديد`);
}

function updateNavigationButtons(categoriesArray) {
    const navElement = document.getElementById('sectionsNav');
    if (!navElement) return;
    
    navElement.innerHTML = '';
    
    categoriesArray.forEach((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-section', `sec-${category.id}`);
        button.textContent = `${category.icon || ''} ${category.name}`;
        
        button.addEventListener('click', function() {
            const targetSection = document.getElementById(`sec-${category.id}`);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                navElement.querySelectorAll('button').forEach(b => {
                    b.style.background = '';
                    b.classList.remove('active-nav-btn');
                });
                this.classList.add('active-nav-btn');
            }
        });
        
        navElement.appendChild(button);
    });
}

// ═══════════════════════════════════════════════════════════
// 🎯 توزيع الأصناف على الأقسام
// ═══════════════════════════════════════════════════════════
function populateMenuItems(categoriesArray, menuItems) {
    document.querySelectorAll('.menu-section .menu-items').forEach(container => {
        container.innerHTML = '';
    });
    
    const itemsArray = Object.keys(menuItems).map(key => ({
        id: key,
        ...menuItems[key]
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    let itemsAdded = 0;
    
    itemsArray.forEach(item => {
        if (item.available === false) return;
        
        const section = document.querySelector(`.menu-section[data-category="${item.category}"]`);
        if (!section) return;
        
        const itemsContainer = section.querySelector('.menu-items');
        if (!itemsContainer) return;
        
        const rawImage = (item.image || '').trim();
        const hasValidImage = rawImage && (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('data:image/') || rawImage.startsWith('/'));
        
        const menuElement = document.createElement('div');
        menuElement.className = 'menu-item';
        menuElement.setAttribute('data-name', item.name || '');
        menuElement.setAttribute('data-price', String(item.price || 0));
        menuElement.setAttribute('data-image', hasValidImage ? rawImage : '');
        menuElement.setAttribute('data-description', item.description || 'منتج لذيذ من مطعم تعلولة');
        menuElement.setAttribute('data-category', item.category || '');
        
        if (hasValidImage) {
            menuElement.innerHTML = `
                <div class="item-image">
                    <div class="image-skeleton"></div>
                    <img data-src="${rawImage}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f5f5f5'/%3E%3C/svg%3E" alt="${item.name || 'منتج'}" class="lazy-image" decoding="async" loading="lazy" width="400" height="400" onerror="handleImageError(this)">
                </div>
                <h4>${item.name || 'منتج'}</h4>
                <p class="price">${(item.price || 0).toLocaleString('ar-EG')} د.ع</p>
            `;
        } else {
            menuElement.innerHTML = `
                <div class="item-image">
                    <img src="${PLACEHOLDER_IMAGE}" alt="${item.name || 'منتج'}" class="loaded placeholder" decoding="async" width="400" height="400">
                </div>
                <h4>${item.name || 'منتج'}</h4>
                <p class="price">${(item.price || 0).toLocaleString('ar-EG')} د.ع</p>
            `;
        }
        
        itemsContainer.appendChild(menuElement);
        itemsAdded++;
    });
    
    document.querySelectorAll('.menu-section[data-category]').forEach(section => {
        const itemsContainer = section.querySelector('.menu-items');
        if (itemsContainer && itemsContainer.children.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
        }
    });
    
    console.log(`✅ تم توزيع ${itemsAdded} صنف`);
}

function handleImageError(img) {
    if (!img) return;
    img.onerror = null;
    img.src = PLACEHOLDER_IMAGE;
    img.classList.remove('lazy-image', 'loading');
    img.classList.add('loaded', 'error-img');
    const skeleton = img.parentElement?.querySelector('.image-skeleton');
    if (skeleton) skeleton.remove();
}
window.handleImageError = handleImageError;

// ═══════════════════════════════════════════════════════════
// 🚀 نظام تحميل الصور الذكي (بدون تغيير)
// ═══════════════════════════════════════════════════════════
class SmartSequentialImageLoader {
    constructor() {
        this.queue = [];
        this.currentlyLoading = new Set();
        this.cache = new Map();
        this.waitingElements = new Map();
        this.visibilityObserver = null;
        this.preloadObserver = null;
        this.mutationObserver = null;
        this.retryCount = new Map();
        this.maxRetries = 2;
        this.config = {
            maxConcurrent: this.detectOptimalConcurrency(),
            preloadDistance: 400,
            highPriorityDistance: 150,
            useIdleCallback: 'requestIdleCallback' in window
        };
        
        console.log(`⚡ Smart Loader جاهز - Concurrent: ${this.config.maxConcurrent}`);
        this.init();
    }
    
    detectOptimalConcurrency() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            if (connection.saveData) return 1;
            switch(connection.effectiveType) {
                case '4g': return 4;
                case '3g': return 2;
                case '2g': 
                case 'slow-2g': return 1;
                default: return 2;
            }
        }
        return Math.min(navigator.hardwareConcurrency || 4, 4);
    }
    
    init() {
        this.loadFromSessionCache();
        this.setupObservers();
        this.setupMutationObserver();
        this.observeAllImages();
        this.monitorConnectionChanges();
    }
    
    setupMutationObserver() {
        if (!('MutationObserver' in window)) return;
        
        this.mutationObserver = new MutationObserver((mutations) => {
            let hasNewImages = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const images = node.querySelectorAll?.('img.lazy-image:not(.loaded):not(.loading)') || [];
                            if (images.length > 0) hasNewImages = true;
                        }
                    });
                }
            });
            if (hasNewImages) setTimeout(() => this.observeAllImages(), 100);
        });
        
        const mainElement = document.querySelector('main');
        if (mainElement) {
            this.mutationObserver.observe(mainElement, { childList: true, subtree: true });
        }
    }
    
    setupObservers() {
        this.visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (!document.body.contains(img)) {
                        this.visibilityObserver.unobserve(img);
                        return;
                    }
                    const priority = this.calculatePriority(img);
                    this.enqueue(img, priority);
                    this.visibilityObserver.unobserve(img);
                }
            });
        }, { rootMargin: `${this.config.preloadDistance}px 0px`, threshold: 0.01 });
        
        this.preloadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (document.body.contains(entry.target)) this.preloadSectionImages(entry.target);
                    this.preloadObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '500px 0px', threshold: 0 });
    }
    
    calculatePriority(img) {
        const rect = img.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(imgCenterX - centerX, 2) + Math.pow(imgCenterY - centerY, 2));
        if (rect.top < viewportHeight && rect.bottom > 0) return 1 + (distance / 1000);
        if (rect.top < viewportHeight + this.config.highPriorityDistance) return 10 + (distance / 500);
        return 100 + (distance / 200);
    }
    
    observeAllImages() {
        const lazyImages = document.querySelectorAll('img.lazy-image:not(.loaded):not(.loading)');
        lazyImages.forEach(img => {
            if (img.dataset.observed === 'true') return;
            const dataSrc = img.getAttribute('data-src');
            if (!dataSrc || dataSrc.trim() === '') {
                img.classList.remove('lazy-image');
                img.src = PLACEHOLDER_IMAGE;
                img.classList.add('loaded', 'placeholder');
                return;
            }
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                this.loadImageImmediately(img, dataSrc);
            } else if (this.visibilityObserver) {
                this.visibilityObserver.observe(img);
            }
            const section = img.closest('.menu-section');
            if (section && this.preloadObserver) this.preloadObserver.observe(section);
            img.dataset.observed = 'true';
        });
        console.log(`🖼️ مراقبة ${lazyImages.length} صورة للتحميل الذكي`);
    }
    
    loadImageImmediately(img, src) {
        if (this.cache.has(src)) { this.applyImage(img, src); return; }
        if (this.currentlyLoading.has(src)) {
            if (!this.waitingElements.has(src)) this.waitingElements.set(src, []);
            this.waitingElements.get(src).push(img);
            img.classList.add('loading');
            return;
        }
        img.classList.add('loading');
        this.currentlyLoading.add(src);
        const tempImg = new Image();
        tempImg.decoding = 'async';
        tempImg.onload = () => {
            this.currentlyLoading.delete(src);
            this.cache.set(src, src);
            const waiting = this.waitingElements.get(src) || [img];
            waiting.forEach(el => { if (document.body.contains(el)) this.applyImage(el, src); });
            this.waitingElements.delete(src);
            this.processQueue();
        };
        tempImg.onerror = () => {
            this.currentlyLoading.delete(src);
            this.applyFallback(img);
        };
        tempImg.src = src;
    }
    
    enqueue(img, priority = 50) {
        if (!document.body.contains(img)) return;
        const src = img.getAttribute('data-src');
        if (!src || src.trim() === '') { this.applyFallback(img); return; }
        if (this.cache.has(src)) { this.applyImage(img, src); return; }
        if (!this.waitingElements.has(src)) {
            this.waitingElements.set(src, []);
            this.queue.push({ src, priority });
            this.sortQueue();
        }
        this.waitingElements.get(src).push(img);
        img.classList.add('loading');
        this.processQueue();
    }
    
    sortQueue() { this.queue.sort((a, b) => a.priority - b.priority); }
    
    processQueue() {
        while (this.currentlyLoading.size < this.config.maxConcurrent && this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) this.loadImage(next.src);
        }
    }
    
    loadImage(src) {
        this.currentlyLoading.add(src);
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { this.handleImageLoad(src, img); };
        img.onerror = () => { this.handleImageError(src); };
        img.src = src;
    }
    
    handleImageLoad(src, img) {
        this.currentlyLoading.delete(src);
        this.cache.set(src, src);
        this.retryCount.delete(src);
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => { if (document.body.contains(element)) this.applyImage(element, src); });
        this.waitingElements.delete(src);
        this.saveToSessionCache(src);
        this.processQueue();
    }
    
    handleImageError(src) {
        this.currentlyLoading.delete(src);
        const retries = this.retryCount.get(src) || 0;
        if (retries < this.maxRetries) {
            this.retryCount.set(src, retries + 1);
            setTimeout(() => { if (!this.cache.has(src)) this.loadImage(src); }, 1000 * (retries + 1));
            return;
        }
        this.retryCount.delete(src);
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => { if (document.body.contains(element)) this.applyFallback(element); });
        this.waitingElements.delete(src);
        this.processQueue();
    }
    
    applyFallback(img) {
        img.src = PLACEHOLDER_IMAGE;
        img.classList.remove('loading', 'lazy-image');
        img.classList.add('loaded', 'error-img');
        const skeleton = img.parentElement?.querySelector('.image-skeleton');
        if (skeleton) { skeleton.style.opacity = '0'; setTimeout(() => skeleton.remove(), 400); }
    }
    
    applyImage(img, src) {
        img.src = src;
        img.classList.remove('loading');
        img.classList.add('loaded');
        const skeleton = img.parentElement?.querySelector('.image-skeleton');
        if (skeleton) {
            skeleton.style.transition = 'opacity 0.4s ease';
            skeleton.style.opacity = '0';
            setTimeout(() => { if (skeleton.parentElement) skeleton.remove(); }, 400);
        }
    }
    
    preloadSectionImages(section) {
        const images = section.querySelectorAll('img.lazy-image[data-src]');
        images.forEach((img, index) => {
            if (!document.body.contains(img)) return;
            const src = img.getAttribute('data-src');
            if (src && src.trim() !== '' && !this.cache.has(src) && !this.currentlyLoading.has(src)) {
                this.queue.push({ src, priority: 20 + index });
                if (!this.waitingElements.has(src)) this.waitingElements.set(src, []);
                this.waitingElements.get(src).push(img);
            }
        });
        this.sortQueue();
        this.processQueue();
    }
    
    saveToSessionCache(src) {
        try {
            const cached = safeJsonParse(sessionStorage.getItem('taloola_image_cache') || '[]', []);
            if (!cached.includes(src)) {
                cached.unshift(src);
                if (cached.length > 50) cached.pop();
                sessionStorage.setItem('taloola_image_cache', JSON.stringify(cached));
            }
        } catch (e) {}
    }
    
    loadFromSessionCache() {
        try {
            const cached = safeJsonParse(sessionStorage.getItem('taloola_image_cache') || '[]', []);
            cached.slice(0, 15).forEach(src => {
                if (this.cache.has(src)) return;
                const img = new Image();
                img.onload = () => this.cache.set(src, src);
                img.onerror = () => {};
                img.src = src;
            });
        } catch (e) {}
    }
    
    monitorConnectionChanges() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            connection.addEventListener('change', () => {
                const newConcurrency = this.detectOptimalConcurrency();
                if (newConcurrency !== this.config.maxConcurrent) {
                    this.config.maxConcurrent = newConcurrency;
                    this.processQueue();
                }
            });
        }
    }
}

let smartImageLoader = null;
function initSmartImageLoading() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { smartImageLoader = new SmartSequentialImageLoader(); });
    } else {
        smartImageLoader = new SmartSequentialImageLoader();
    }
}

// ═══════════════════════════════════════════════════════════
// 📍 نظام الموقع الجغرافي (بدون تغيير)
// ═══════════════════════════════════════════════════════════
function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
    return 'other';
}

let userLocation = null;
let locationPermissionGranted = false;
const LOCATION_STORAGE_KEY = 'taloola_user_location';
const LOCATION_PERMISSION_KEY = 'taloola_location_permission';
const LOCATION_TEXT_STORAGE_KEY = 'taloola_saved_address';
let savedAddressText = safeLocalStorageGet(LOCATION_TEXT_STORAGE_KEY) || '';

function saveLocationToStorage(location) {
    try {
        const locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: Date.now(),
            googleMapsUrl: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        };
        safeLocalStorageSet(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
        return locationData;
    } catch (error) { return null; }
}

function getLocationFromStorage() {
    try {
        const storedLocation = safeLocalStorageGet(LOCATION_STORAGE_KEY);
        if (storedLocation) {
            const locationData = safeJsonParse(storedLocation);
            if (!locationData) return null;
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - locationData.timestamp < oneWeek) return locationData;
            else localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
        return null;
    } catch (error) { return null; }
}

async function checkLocationPermissionStatus() {
    try {
        if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
    } catch (error) { return 'unknown'; }
}

function showAndroidSettingsGuide() {
    const statusDiv = document.getElementById('locationModalStatus');
    const textSpan = document.getElementById('locationModalText');
    if (statusDiv && textSpan) {
        statusDiv.className = 'location-modal-status error';
        textSpan.innerHTML = `⚠ تم رفض إذن الموقع سابقاً<br><small style="display:block; margin-top:10px; line-height:1.8; text-align:right;">📱 <strong>لتفعيل الموقع في Chrome:</strong><br>1️⃣ اضغط على أيقونة القفل 🔒<br>2️⃣ اختر "أذونات الموقع"<br>3️⃣ فعّل "الموقع"<br>4️⃣ أعد تحميل الصفحة</small>`;
    }
}

function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('المتصفح لا يدعم تحديد الموقع')); return; }
        const os = detectOS();
        if (os === 'android') {
            navigator.geolocation.getCurrentPosition(
                (position) => { resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }); },
                (error) => {
                    let errorMessage = 'خطأ في تحديد الموقع';
                    let detailedMessage = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED: errorMessage = 'تم رفض إذن الموقع'; detailedMessage = 'PERMISSION_DENIED'; break;
                        case error.POSITION_UNAVAILABLE: errorMessage = 'المعلومات غير متوفرة'; break;
                        case error.TIMEOUT: errorMessage = 'انتهت المهلة'; break;
                    }
                    const fullError = new Error(errorMessage);
                    fullError.detailedMessage = detailedMessage;
                    reject(fullError);
                },
                { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
            );
        } else if (os === 'ios') {
            let watchId = null;
            let timeoutId = setTimeout(() => {
                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                reject(new Error('انتهت مهلة طلب الموقع'));
            }, 20000);
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
                },
                (error) => {
                    clearTimeout(timeoutId);
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    reject(new Error('خطأ في تحديد الموقع'));
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
                () => reject(new Error('خطأ في تحديد الموقع')),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    });
}

async function requestLocationAndUpdate() {
    const statusDiv = document.getElementById('locationModalStatus');
    const textSpan = document.getElementById('locationModalText');
    const os = detectOS();
    if (statusDiv && textSpan) {
        statusDiv.className = 'location-modal-status loading';
        textSpan.textContent = 'جاري تحديد موقعك...';
    }
    try {
        const permissionStatus = await checkLocationPermissionStatus();
        if (os === 'android' && permissionStatus === 'denied') {
            showAndroidSettingsGuide();
            showNotification('⚠ يرجى تفعيل الموقع من إعدادات Chrome');
            return null;
        }
        const location = await requestLocationPermission();
        const savedLocation = saveLocationToStorage(location);
        userLocation = savedLocation;
        locationPermissionGranted = true;
        safeLocalStorageSet(LOCATION_PERMISSION_KEY, 'granted');
        if (statusDiv && textSpan) {
            statusDiv.className = 'location-modal-status success';
            textSpan.textContent = '✓ تم تحديد موقعك بنجاح';
        }
        updateLocationModalStatus();
        updateLocationIconStatus();
        updateLocationInCart();
        showNotification('✅ تم تحديد موقعك بنجاح');
        return savedLocation;
    } catch (error) {
        if (os === 'android' && error.detailedMessage === 'PERMISSION_DENIED') {
            showAndroidSettingsGuide();
            showNotification('⚠ تم رفض الإذن');
        } else {
            if (statusDiv && textSpan) {
                statusDiv.className = 'location-modal-status error';
                textSpan.textContent = '⚠ ' + error.message;
            }
            showNotification('⚠ ' + error.message);
        }
        return null;
    }
}

function initLocationIcon() {
    const locationIconBtn = document.getElementById('locationIconBtn');
    if (!locationIconBtn) return;
    updateLocationIconStatus();
    locationIconBtn.addEventListener('click', function(e) { e.preventDefault(); openLocationModal(); });
}

function updateLocationIconStatus() {
    const locationIconBtn = document.getElementById('locationIconBtn');
    if (!locationIconBtn) return;
    const storedLocation = getLocationFromStorage();
    if (storedLocation || userLocation) locationIconBtn.classList.add('located');
    else locationIconBtn.classList.remove('located');
}

function openLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) { modal.style.display = 'flex'; updateLocationModalStatus(); }
}

function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) modal.style.display = 'none';
}

function updateLocationModalStatus() {
    const statusDiv = document.getElementById('locationModalStatus');
    const textSpan = document.getElementById('locationModalText');
    const infoDiv = document.getElementById('locationModalInfo');
    const coordsP = document.getElementById('locationCoords');
    if (!statusDiv || !textSpan) return;
    const location = userLocation || getLocationFromStorage();
    if (location) {
        statusDiv.className = 'location-modal-status success';
        textSpan.textContent = '✓ تم تحديد موقعك بنجاح';
        if (infoDiv) {
            infoDiv.style.display = 'block';
            if (coordsP) coordsP.textContent = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        }
    } else {
        statusDiv.className = 'location-modal-status';
        textSpan.textContent = 'اضغط على "تحديد الموقع الآن"';
        if (infoDiv) infoDiv.style.display = 'none';
    }
}

function updateLocationInCart() {
    // ✅ في حالة طلب الصالة، الموقع غير مطلوب
    if (isTableOrder) return;
    
    const badge = document.getElementById('locationStatusBadge');
    const text = document.getElementById('locationStatusText');
    if (!badge || !text) return;
    badge.classList.remove('success', 'error', 'warning');
    if (userLocation || getLocationFromStorage()) {
        badge.classList.add('success');
        text.textContent = '✓ الموقع محدد';
    } else {
        badge.classList.add('warning');
        text.textContent = '⚠ الموقع غير محدد';
    }
}

async function initializeLocationSystem() {
    const storedLocation = getLocationFromStorage();
    if (storedLocation) {
        userLocation = storedLocation;
        locationPermissionGranted = true;
        updateLocationIconStatus();
        updateLocationInCart();
        return;
    }
    updateLocationIconStatus();
    updateLocationInCart();
}

// ═══════════════════════════════════════════════════════════
// 🛒 ✅✅✅ نظام السلة العائمة - مُحسَّن للسّلتين
// ═══════════════════════════════════════════════════════════

function saveCart() {
    try {
        const key = getActiveCartKey();
        const cart = getActiveCart();
        safeLocalStorageSet(key, JSON.stringify(cart));
        console.log(`💾 تم حفظ ${getActiveCartName()} (${cart.length} عنصر)`);
    } catch (e) { 
        console.warn('⚠️ فشل حفظ السلة'); 
    }
    updateCartUI();
}

function updateCartUI() {
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const floatingCartCount = document.getElementById('floatingCartCount');
    const cart = getActiveCart();
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    
    if (floatingCartBtn && floatingCartCount) {
        floatingCartCount.textContent = totalItems;
        
        // ✅ تحديث نص الزر حسب نوع الطلب
        const cartIcon = floatingCartBtn.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.textContent = isTableOrder ? '🍽️' : '🛒';
        }
        
        if (totalItems > 0) {
            if (!floatingCartBtn.classList.contains('has-items')) floatingCartBtn.classList.add('has-items');
        } else {
            floatingCartBtn.classList.remove('has-items');
        }
    }
}

function showCartAddEffect() {
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    if (floatingCartBtn && floatingCartBtn.classList.contains('has-items')) {
        floatingCartBtn.classList.remove('item-added');
        void floatingCartBtn.offsetWidth;
        floatingCartBtn.classList.add('item-added');
        setTimeout(() => { floatingCartBtn.classList.remove('item-added'); }, 600);
    }
}

function addToCart(name, price, quantity = 1) {
    if (!name || typeof name !== 'string' || name.trim() === '') { 
        showNotification('⚠ اسم المنتج غير صالح'); 
        return false; 
    }
    
    const numPrice = parseInt(price);
    if (isNaN(numPrice) || numPrice < 0) { 
        showNotification('⚠ سعر المنتج غير صالح'); 
        return false; 
    }
    
    const numQty = parseInt(quantity);
    if (isNaN(numQty) || numQty < 1) { 
        showNotification('⚠ الكمية غير صالحة'); 
        return false; 
    }
    
    const trimmedName = name.trim();
    const cart = getActiveCart();
    const existingItem = cart.find(item => item.name === trimmedName);
    
    if (existingItem) { 
        existingItem.quantity += numQty; 
    } else { 
        // ✅ إضافة الصنف مع الفئة (category) للتوافق مع النظام
        const menuItem = document.querySelector(`.menu-item[data-name="${trimmedName}"]`);
        const category = menuItem ? (menuItem.getAttribute('data-category') || 'غير مصنف') : 'غير مصنف';
        cart.push({ 
            name: trimmedName, 
            price: numPrice, 
            quantity: numQty,
            category: category 
        }); 
    }
    
    saveCart();
    showNotification(`✓ تم إضافة ${numQty} × ${trimmedName} إلى ${getActiveCartName()}`);
    showCartAddEffect();
    
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    return true;
}

function removeFromCart(index) {
    const cart = getActiveCart();
    if (index < 0 || index >= cart.length) return;
    cart.splice(index, 1);
    saveCart();
    displayCartItems();
}

function changeQuantity(index, change) {
    const cart = getActiveCart();
    if (index < 0 || index >= cart.length) return;
    const newQty = (cart[index].quantity || 0) + change;
    if (newQty <= 0) { 
        cart.splice(index, 1); 
    } else { 
        cart[index].quantity = newQty; 
    }
    saveCart();
    displayCartItems();
}

function clearCart() {
    const cart = getActiveCart();
    if (cart.length === 0) { 
        showNotification(`${getActiveCartName()} فارغة بالفعل`); 
        return; 
    }
    if (confirm(`هل أنت متأكد من تفريغ ${getActiveCartName()}؟`)) {
        setActiveCart([]);
        saveCart();
        displayCartItems();
        showNotification(`✓ تم تفريغ ${getActiveCartName()}`);
    }
}

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const cartItemsCount = document.getElementById('cartItemsCount');
    const cart = getActiveCart();
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        const emptyIcon = isTableOrder ? '🍽️' : '🛒';
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-new">
                <i class="fas fa-${isTableOrder ? 'utensils' : 'shopping-cart'}"></i>
                <h3>${getActiveCartName()} فارغة</h3>
                <p>لم تضف أي منتجات بعد</p>
                ${isTableOrder ? `<p style="color: #666; margin-top: 8px;">🪑 طاولة رقم: ${tableId}</p>` : ''}
            </div>`;
        if (cartTotalElement) cartTotalElement.textContent = '0 د.ع';
        if (cartItemsCount) cartItemsCount.textContent = '0';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let totalQuantity = 0;
    
    cart.forEach((item, index) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 0;
        const itemTotal = itemPrice * itemQty;
        total += itemTotal;
        totalQuantity += itemQty;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-new';
        itemElement.innerHTML = `
            <div class="cart-item-info-new">
                <div class="cart-item-name-new">${item.name}</div>
                <div class="cart-item-price-new">${itemPrice.toLocaleString('ar-EG')} د.ع × ${itemQty}</div>
                <div class="cart-item-total-new">${itemTotal.toLocaleString('ar-EG')} د.ع</div>
            </div>
            <div class="cart-item-controls-new">
                <button class="cart-item-remove-new" onclick="removeFromCart(${index})" title="حذف"><i class="fas fa-trash"></i></button>
                <button class="qty-btn-new" onclick="changeQuantity(${index}, -1)"><i class="fas fa-minus"></i></button>
                <span class="qty-display-new">${itemQty}</span>
                <button class="qty-btn-new" onclick="changeQuantity(${index}, 1)"><i class="fas fa-plus"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    if (cartTotalElement) cartTotalElement.textContent = `${total.toLocaleString('ar-EG')} د.ع`;
    if (cartItemsCount) cartItemsCount.textContent = totalQuantity;
}

function updateNotesCounter() {
    const textarea = document.getElementById('orderNotes');
    const counter = document.getElementById('notesCharCount');
    if (!textarea || !counter) return;
    const len = textarea.value.length;
    counter.textContent = len + '/80';
    counter.classList.toggle('near-limit', len > 70);
}

function closeCartModal() {
    const m = document.getElementById('cartModal');
    if (m) m.style.display = 'none';
}

function loadSavedCustomerInfo() {
    // ✅ فقط لطلبات الدلفري (لا نحتاج معلومات محفوظة في طلب الصالة)
    if (isTableOrder) return;
    
    const phoneInput = document.getElementById('customerPhone');
    const areaSelect = document.getElementById('deliveryArea');
    if (!phoneInput || !areaSelect) return;
    
    try {
        const savedPhone = safeLocalStorageGet('taloola_saved_phone');
        const savedArea = safeLocalStorageGet('taloola_saved_area');
        if (savedPhone && !phoneInput.value) phoneInput.value = savedPhone;
        if (savedArea && !areaSelect.value) {
            const options = Array.from(areaSelect.options).map(o => o.value);
            if (options.includes(savedArea)) areaSelect.value = savedArea;
        }
    } catch (e) {}
}

// ═══════════════════════════════════════════════════════════
// 🛍️ نافذة تفاصيل المنتج
// ═══════════════════════════════════════════════════════════
let currentProduct = null;
let modalQuantity = 1;

function openProductModal(element) {
    if (!element) return;
    
    const name = element.getAttribute('data-name');
    const priceStr = element.getAttribute('data-price');
    const price = parseInt(priceStr);
    
    const imgElement = element.querySelector('img');
    const image = imgElement ? (imgElement.src || imgElement.getAttribute('data-src') || '') : '';
    const description = element.getAttribute('data-description') || 'منتج لذيذ من مطعم تعلولة';
    
    if (!name || name.trim() === '') { showNotification('⚠ بيانات المنتج غير صالحة'); return; }
    if (isNaN(price) || price <= 0) { showNotification('⚠ سعر المنتج غير صالح'); return; }
    
    currentProduct = { name: name.trim(), price, image: image || PLACEHOLDER_IMAGE, description };
    modalQuantity = 1;
    
    const nameEl = document.getElementById('productModalName');
    const priceEl = document.getElementById('productModalPrice');
    const descEl = document.getElementById('productModalDescription');
    
    if (nameEl) nameEl.textContent = currentProduct.name;
    if (priceEl) priceEl.textContent = currentProduct.price.toLocaleString('ar-EG');
    if (descEl) descEl.textContent = currentProduct.description;
    
    const modalImg = document.getElementById('productModalImage');
    if (modalImg) {
        modalImg.classList.remove('loaded');
        modalImg.onload = () => modalImg.classList.add('loaded');
        modalImg.onerror = () => { modalImg.src = PLACEHOLDER_IMAGE; modalImg.classList.add('loaded'); };
        modalImg.src = currentProduct.image;
        modalImg.alt = currentProduct.name;
    }
    
    const qtyDisplay = document.getElementById('modalQtyDisplay');
    if (qtyDisplay) qtyDisplay.textContent = modalQuantity;
    updateModalTotal();
    
    const addBtn = document.getElementById('modalAddToCartBtn');
    if (addBtn) {
        addBtn.classList.remove('added');
        addBtn.innerHTML = `<i class="fas fa-cart-plus"></i> <span>إضافة إلى ${getActiveCartName()}</span>`;
    }
    
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'flex';
        if (navigator.vibrate) navigator.vibrate(10);
    }
    
    console.log('✅ تم فتح نافذة المنتج:', currentProduct.name);
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
    currentProduct = null;
    modalQuantity = 1;
}

function updateModalTotal() {
    if (!currentProduct) return;
    const total = currentProduct.price * modalQuantity;
    const totalEl = document.getElementById('modalTotalPrice');
    if (totalEl) totalEl.textContent = `${total.toLocaleString('ar-EG')} د.ع`;
}

function changeModalQuantity(change) {
    modalQuantity += change;
    if (modalQuantity < 1) modalQuantity = 1;
    if (modalQuantity > 99) { modalQuantity = 99; showNotification('الحد الأقصى 99'); }
    
    const display = document.getElementById('modalQtyDisplay');
    if (display) {
        display.textContent = modalQuantity;
        display.style.transform = 'scale(1.3)';
        setTimeout(() => { display.style.transform = 'scale(1)'; }, 200);
    }
    updateModalTotal();
    
    if (navigator.vibrate) navigator.vibrate(5);
}

function addCurrentProductToCart() {
    if (!currentProduct) { showNotification('⚠ لا يوجد منتج محدد'); return; }
    
    const success = addToCart(currentProduct.name, currentProduct.price, modalQuantity);
    if (!success) return;
    
    const btn = document.getElementById('modalAddToCartBtn');
    if (btn) {
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> <span>تمت الإضافة!</span>';
        
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
        
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = `<i class="fas fa-cart-plus"></i> <span>إضافة إلى ${getActiveCartName()}</span>`;
            closeProductModal();
        }, 800);
    } else {
        closeProductModal();
    }
}

// ═══════════════════════════════════════════════════════════
// 📋 نافذة مراجعة الطلب
// ═══════════════════════════════════════════════════════════
function showOrderReview() {
    const cart = getActiveCart();
    if (!cart || cart.length === 0) { 
        showNotification(`${getActiveCartName()} فارغة!`); 
        return; 
    }
    closeCartModal();
    const reviewModal = document.getElementById('orderReviewModal');
    if (reviewModal) { reviewModal.style.display = 'flex'; displayOrderReview(); }
}

function displayOrderReview() {
    const reviewItemsContainer = document.getElementById('orderReviewItems');
    const reviewItemCount = document.getElementById('reviewItemCount');
    const reviewTotalQuantity = document.getElementById('reviewTotalQuantity');
    const reviewTotalAmount = document.getElementById('reviewTotalAmount');
    const locationInput = document.getElementById('locationDescription');
    const cart = getActiveCart();
    
    if (!reviewItemsContainer) return;
    
    // ✅ إظهار معلومات الطلب حسب النوع
    const reviewHeader = document.getElementById('reviewHeader');
    if (reviewHeader) {
        if (isTableOrder) {
            reviewHeader.innerHTML = `
                <h3>🍽️ مراجعة طلب الصالة</h3>
                <p style="color: #666;">🪑 طاولة رقم: <strong>${tableId}</strong></p>
            `;
        } else {
            reviewHeader.innerHTML = `<h3>🛵 مراجعة طلب الدلفري</h3>`;
        }
    }
    
    const btn = document.getElementById('useSavedAddressBtn');
    const preview = document.getElementById('savedAddressPreview');
    
    if (btn && preview && savedAddressText) {
        btn.style.display = isTableOrder ? 'none' : 'flex';
        preview.textContent = savedAddressText.substring(0, 50) + (savedAddressText.length > 50 ? '...' : '');
        btn.onclick = function() { if (locationInput) locationInput.value = savedAddressText; };
    }
    
    const currentOrderAddress = sessionStorage.getItem('current_order_address');
    if (locationInput && currentOrderAddress) locationInput.value = currentOrderAddress;
    
    reviewItemsContainer.innerHTML = '';
    let totalQuantity = 0, totalAmount = 0;
    
    cart.forEach((item) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 0;
        const itemTotal = itemPrice * itemQty;
        totalQuantity += itemQty;
        totalAmount += itemTotal;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-item-info">
                <div class="review-item-name">${item.name}</div>
                <div class="review-item-details">
                    <span><i class="fas fa-box"></i> الكمية: ${itemQty}</span>
                    <span><i class="fas fa-tag"></i> السعر: ${itemPrice.toLocaleString('ar-EG')} د.ع</span>
                </div>
            </div>
            <div class="review-item-total">${itemTotal.toLocaleString('ar-EG')} د.ع</div>
        `;
        reviewItemsContainer.appendChild(reviewItem);
    });
    
    if (reviewItemCount) reviewItemCount.textContent = `${cart.length} منتج`;
    if (reviewTotalQuantity) reviewTotalQuantity.textContent = `${totalQuantity} قطعة`;
    if (reviewTotalAmount) reviewTotalAmount.textContent = `${totalAmount.toLocaleString('ar-EG')} د.ع`;
}

function closeOrderReview() {
    const m = document.getElementById('orderReviewModal');
    if (m) m.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 🚫 نظام حظر الأجهزة (v3) - ديناميكي
// ═══════════════════════════════════════════════════════════
let bannedPhonesRef = null;
let currentBannedPhone = null;
let banCheckInterval = null;

function initBanSystem() {
    if (typeof firebase !== 'undefined' && firebase.database) {
        bannedPhonesRef = firebase.database().ref('banned_phones');
        console.log('✅ نظام الحظر جاهز (Firebase)');
        listenToBanChanges();
        banCheckInterval = setInterval(() => {
            const currentPhone = getCurrentPhoneInput();
            if (currentPhone) checkPhoneBanRealtime(currentPhone);
        }, 30000);
    } else {
        setTimeout(initBanSystem, 1000);
    }
}

function listenToBanChanges() {
    if (!bannedPhonesRef) return;
    bannedPhonesRef.on('value', (snapshot) => {
        const bannedPhones = snapshot.val();
        const currentPhone = getCurrentPhoneInput();
        if (currentPhone && bannedPhones && bannedPhones[currentPhone]) {
            const banInfo = bannedPhones[currentPhone];
            const now = Date.now();
            if (banInfo.permanent === true || (typeof banInfo.banUntil === 'number' && banInfo.banUntil > now)) {
                currentBannedPhone = currentPhone;
                showBanWindowFromFirebase(banInfo);
                disableOrdering();
            } else {
                currentBannedPhone = null;
                enableOrdering();
            }
        } else {
            currentBannedPhone = null;
            enableOrdering();
        }
    }, (error) => { console.warn('⚠️ خطأ في الاستماع لقائمة الحظر:', error.message); });
}

function getCurrentPhoneInput() {
    const phoneInput = document.getElementById('customerPhone');
    if (!phoneInput) return null;
    let phone = phoneInput.value.trim();
    if (phone.startsWith('+964')) phone = '0' + phone.substring(4);
    else if (phone.startsWith('964')) phone = '0' + phone.substring(3);
    if (/^07[0-9]{9}$/.test(phone)) return phone;
    return null;
}

async function checkPhoneBanRealtime(phone) {
    if (!phone || !bannedPhonesRef) return false;
    try {
        const snapshot = await bannedPhonesRef.child(phone).once('value');
        const banInfo = snapshot.val();
        if (!banInfo) { currentBannedPhone = null; enableOrdering(); return false; }
        const now = Date.now();
        if (banInfo.permanent === true) {
            currentBannedPhone = phone;
            showBanWindowFromFirebase(banInfo);
            disableOrdering();
            return true;
        }
        if (typeof banInfo.banUntil === 'number') {
            if (banInfo.banUntil > now) {
                currentBannedPhone = phone;
                showBanWindowFromFirebase(banInfo);
                disableOrdering();
                return true;
            } else {
                await bannedPhonesRef.child(phone).remove();
                currentBannedPhone = null;
                enableOrdering();
                return false;
            }
        }
        return false;
    } catch (error) {
        console.warn('⚠️ فشل فحص الحظر:', error.message);
        return false;
    }
}

function showBanWindowFromFirebase(banInfo) {
    const modal = document.getElementById('banModal');
    const message = document.getElementById('banMessage');
    if (!modal || !message) return;
    let messageHtml = '';
    if (banInfo.reason) messageHtml += `<p class="ban-reason-text"><i class="fas fa-info-circle"></i> <strong>السبب:</strong> ${banInfo.reason}</p>`;
    if (banInfo.phone) messageHtml += `<p class="ban-phone-text"><i class="fas fa-phone"></i> <strong>الرقم:</strong> ${banInfo.phone}</p>`;
    if (banInfo.permanent === true) {
        messageHtml += `<p class="ban-permanent-text"><i class="fas fa-infinity"></i> <strong>حظر دائم</strong></p><p>تم تعليق حسابك بشكل دائم بسبب مخالفة شروط الاستخدام.</p><p>للاستفسار، يرجى التواصل مع الإدارة عبر واتساب.</p>`;
    } else if (typeof banInfo.banUntil === 'number') {
        const now = Date.now();
        const remaining = banInfo.banUntil - now;
        const hours = Math.ceil(remaining / (60 * 60 * 1000));
        const days = Math.floor(hours / 24);
        let timeText = days > 0 ? `${days} يوم و ${hours % 24} ساعة` : `${hours} ساعة`;
        messageHtml += `<p class="ban-temporary-text"><i class="fas fa-clock"></i> <strong>المدة المتبقية:</strong> ${timeText}</p><p>يمكنك الطلب مرة أخرى بعد انتهاء المدة.</p><p class="ban-warning-text"><i class="fas fa-exclamation-triangle"></i> أي محاولة للتلاعب ستؤدي إلى حظر دائم.</p>`;
    }
    message.innerHTML = messageHtml;
    modal.style.display = 'flex';
}

function saveLastOrderPhone(phone) {
    if (!phone) return;
    safeLocalStorageSet('taloola_last_order_phone', phone);
}

function getLastOrderPhone() {
    return safeLocalStorageGet('taloola_last_order_phone');
}

async function banPhone(phone, durationMs = banDurationMs, permanent = false) {
    if (!phone) return false;
    const banUntil = permanent ? 'permanent' : Date.now() + durationMs;
    const banData = { phone: phone, banUntil: banUntil, permanent: permanent, timestamp: Date.now(), reason: 'تم الحظر من لوحة الإدارة' };
    safeLocalStorageSet(BAN_DATA_KEY, JSON.stringify(banData));
    safeLocalStorageSet(BAN_KEY, permanent ? 'permanent' : banUntil.toString());
    if (bannedPhonesRef) {
        try {
            await bannedPhonesRef.child(phone).set(banData);
            console.log(`🚫 تم حظر ${phone} في Firebase حتى ${banUntil}`);
            return true;
        } catch (error) {
            console.error('❌ فشل حفظ الحظر في Firebase:', error);
            return false;
        }
    }
    return false;
}

async function isPhoneBanned(phone) {
    if (!phone) return false;
    if (bannedPhonesRef) {
        try {
            const snapshot = await bannedPhonesRef.child(phone).once('value');
            const banInfo = snapshot.val();
            if (banInfo) {
                const now = Date.now();
                if (banInfo.permanent === true) { currentBannedPhone = phone; return true; }
                if (typeof banInfo.banUntil === 'number' && banInfo.banUntil > now) { currentBannedPhone = phone; return true; }
                if (typeof banInfo.banUntil === 'number' && banInfo.banUntil <= now) {
                    await bannedPhonesRef.child(phone).remove();
                    console.log(`✅ انتهى حظر ${phone} وتم حذفه`);
                    return false;
                }
            }
        } catch (error) { console.warn('⚠ تعذر فحص Firebase:', error.message); }
    }
    const localBanData = safeJsonParse(safeLocalStorageGet(BAN_DATA_KEY));
    if (localBanData && localBanData.phone === phone) {
        if (localBanData.permanent === true) return true;
        if (typeof localBanData.banUntil === 'number' && localBanData.banUntil > Date.now()) return true;
    }
    return false;
}

async function unbanPhone(phone) {
    safeLocalStorageRemove(BAN_DATA_KEY);
    safeLocalStorageRemove(BAN_KEY);
    if (bannedPhonesRef && phone) await bannedPhonesRef.child(phone).remove();
}

// ═══════════════════════════════════════════════════════════
// ⏱️ دوال جلب المدد من Firebase
// ═══════════════════════════════════════════════════════════
function loadProcessingDuration() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    firebase.database().ref('settings/processing_duration').on('value', (snapshot) => {
        const mins = snapshot.val() || 5;
        processingDurationMs = mins * 60 * 1000;
        console.log(`⏱️ مدة الانتظار المحدثة من Firebase: ${mins} دقيقة`);
    });
}

function loadBanDuration() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    firebase.database().ref('settings/ban_duration_hours').on('value', (snapshot) => {
        const hours = snapshot.val() || 5;
        banDurationMs = hours * 60 * 60 * 1000;
        console.log(`⏱️ مدة الحظر المحدثة من Firebase: ${hours} ساعة`);
    });
}

// ═══════════════════════════════════════════════════════════
// 🔄 نافذة معالجة الطلب
// ═══════════════════════════════════════════════════════════
function showProcessingWindow() {
    const modal = document.getElementById('processingModal');
    if (!modal) {
        console.error('❌ عنصر processingModal غير موجود');
        redirectToTrackingPage();
        return;
    }
    if (!safeLocalStorageGet(PROCESSING_KEY)) {
        safeLocalStorageSet(PROCESSING_KEY, Date.now().toString());
    }
    modal.style.display = 'flex';
    disableOrdering();
    startProcessingCountdown();
}

function startProcessingCountdown() {
    const timerElement = document.getElementById('processingTimer');
    if (!timerElement) return;
    const startTime = parseInt(safeLocalStorageGet(PROCESSING_KEY, Date.now().toString()));
    const duration = processingDurationMs || (5 * 60 * 1000);
    if (processingInterval) clearInterval(processingInterval);
    processingInterval = setInterval(() => {
        const now = Date.now();
        const remaining = duration - (now - startTime);
        if (remaining <= 0) {
            clearInterval(processingInterval);
            if (timerElement) timerElement.textContent = "00:00";
            safeLocalStorageRemove(PROCESSING_KEY);
            redirectToTrackingPage();
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            if (timerElement) {
                timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }
    }, 1000);
}

function redirectToTrackingPage(orderNumber = null) {
    const lastOrder = sessionStorage.getItem('lastOrderNumber');
    const targetOrder = orderNumber || lastOrder || '#000';
    sessionStorage.setItem('tracking_order_id', targetOrder);
    setTimeout(() => {
        const currentPath = window.location.pathname;
        const isRoot = currentPath.endsWith('index.html') || currentPath.endsWith('/');
        const basePath = isRoot ? '' : '../';
        window.location.href = `${basePath}tracking/order-tracking.html?order=${encodeURIComponent(targetOrder)}`;
    }, 1500);
}

function disableOrdering() {
    const cartBtn = document.getElementById('floatingCartBtn');
    if (cartBtn) {
        cartBtn.style.pointerEvents = 'none';
        cartBtn.style.opacity = '0.5';
        cartBtn.title = 'الحساب معلق مؤقتاً';
    }
}

function enableOrdering() {
    const cartBtn = document.getElementById('floatingCartBtn');
    if (cartBtn) {
        cartBtn.style.pointerEvents = '';
        cartBtn.style.opacity = '';
        cartBtn.title = `عرض ${getActiveCartName()} وتأكيد الطلب`;
    }
}

// ═══════════════════════════════════════════════════════════
// 🎯 تحديث ظهور أزرار السلة/التتبع
// ═══════════════════════════════════════════════════════════
function updateTrackingButtonVisibility() {
    const trackBtn = document.getElementById('floatingTrackBtn');
    const cartBtn = document.getElementById('floatingCartBtn');
    if (!trackBtn || !cartBtn) return;

    const activeOrder = getActiveOrder();
    const isActive = isOrderActive(activeOrder);

    if (isActive && activeOrder) {
        cartBtn.style.display = 'none';
        trackBtn.style.display = 'flex';
        trackBtn.classList.add('visible');

        const trackText = trackBtn.querySelector('.track-text');
        if (trackText && activeOrder.orderNumber) {
            trackText.textContent = `تتبع #${activeOrder.orderNumber}`;
        }

        // ✅ إصلاح التنقل بشكل صحيح
        trackBtn.onclick = function(e) {
            e.preventDefault();
            const orderNum = activeOrder.orderNumber;
            if (!orderNum) return;

            // حساب المسار الصحيح من الصفحة الحالية
            const path = window.location.pathname;
            const basePath = (path.endsWith('/index.html') || path.endsWith('/') || path.includes('/tracking/'))
                ? ''
                : '../';

            const targetUrl = `${basePath}tracking/order-tracking.html?order=${encodeURIComponent(orderNum)}`;
            console.log(`🔗 الانتقال إلى: ${targetUrl}`);
            window.location.href = targetUrl;
        };
    } else {
        trackBtn.style.display = 'none';
        trackBtn.classList.remove('visible');

        cartBtn.style.display = 'flex';
        cartBtn.onclick = function(e) {
            e.preventDefault();
            openCartModal();
        };
    }
}

function startListeningToActiveOrder() {
    const activeOrder = getActiveOrder();
    if (!activeOrder || !activeOrder.phone || !activeOrder.orderNumber || typeof firebase === 'undefined' || !firebase.database) {
        updateTrackingButtonVisibility();
        return;
    }
    if (activeOrderListener) {
        try {
            firebase.database().ref(`users/${activeOrder.phone}/orders`).off('value');
        } catch (e) {}
        activeOrderListener = null;
    }
    const phone = activeOrder.phone;
    const orderNumber = parseInt(activeOrder.orderNumber);
    const ordersRef = firebase.database().ref(`users/${phone}/orders`);
    activeOrderListener = ordersRef.orderByChild('orderNumber').equalTo(orderNumber);
    activeOrderListener.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            clearActiveOrder();
            updateTrackingButtonVisibility();
            return;
        }
        const orderId = Object.keys(data)[0];
        const updatedOrder = data[orderId];
        const currentActive = getActiveOrder();
        if (currentActive && updatedOrder.status !== currentActive.status) {
            currentActive.status = updatedOrder.status;
            currentActive.lastChecked = Date.now();
            localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(currentActive));
            console.log(`🔄 حالة الطلب #${currentActive.orderNumber} تغيرت إلى: ${updatedOrder.status}`);
            updateTrackingButtonVisibility();
            const finalStatuses = ['completed', 'delivered', 'cancelled', 'rejected'];
            if (finalStatuses.includes(updatedOrder.status)) {
                showNotification(`✅ ${getStatusMessage(updatedOrder.status)}`);
                setTimeout(() => {
                    clearActiveOrder();
                    updateTrackingButtonVisibility();
                }, 3000);
            }
        }
    }, (error) => {
        console.warn('⚠️ خطأ في مراقبة حالة الطلب:', error);
        updateTrackingButtonVisibility();
    });
}

function getStatusMessage(status) {
    const messages = {
        'completed': 'تم إكمال طلبك بنجاح!',
        'delivered': 'تم توصيل طلبك! 🎉',
        'cancelled': 'تم إلغاء طلبك',
        'rejected': 'عذراً، لم نتمكن من قبول طلبك'
    };
    return messages[status] || 'تم تحديث حالة طلبك';
}

// ═══════════════════════════════════════════════════════════
// ✅✅✅ تأكيد وإرسال الطلب - مُحسَّن للسّلتين
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// ✅✅✅ تأكيد وإرسال الطلب - مُحسَّن مع تدقيق الملاحظات
// ═══════════════════════════════════════════════════════════
async function confirmAndSendOrder() {

    if (isOrderActive()) {
        showNotification('⚠️ لديك طلب قيد المعالجة حالياً، يرجى الانتظار حتى اكتماله');
        return;
    }
    if (safeLocalStorageGet(PROCESSING_KEY)) {
        showNotification('لديك طلب قيد التحضير بالفعل');
        return;
    }
    
    // ✅ استخدام السلة الصحيحة
    const cart = getActiveCart();
    if (!cart || cart.length === 0) {
        showNotification(`${getActiveCartName()} فارغة!`);
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.error('❌ Firebase غير متاح');
        showNotification('⚠ لا يمكن حفظ الطلب حالياً، يرجى إعادة تحميل الصفحة');
        return;
    }

    // ✅ جلب جميع عناصر النموذج
    const phoneInput = document.getElementById('customerPhone');
    const areaSelect = document.getElementById('deliveryArea');
    const detailedInput = document.getElementById('detailedAddress');
    const notesInput = document.getElementById('orderNotes');
    const personCountInput = document.getElementById('personCount');
    
    // ✅✅✅ استخراج الملاحظات بشكل آمن (لكلا النوعين)
    const notes = notesInput ? notesInput.value.trim().substring(0, 80) : '';
    
    // ✅ استخراج باقي البيانات
    const personCount = isTableOrder ? (parseInt(personCountInput?.value) || 1) : null;
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const area = areaSelect ? areaSelect.value.trim() : '';
    const detailed = detailedInput ? detailedInput.value.trim() : '';

    let hasError = false;
    
    // ═══════════════════════════════════════════════════════════
    // ✅✅✅ التحقق من البيانات حسب نوع الطلب
    // ═══════════════════════════════════════════════════════════
    if (isTableOrder) {
        // 🍽️ طلب صالة: رقم الهاتف اختياري، عدد الأشخاص مطلوب
        if (!personCount || personCount < 1) {
            showNotification('⚠ الرجاء إدخال عدد الأشخاص');
            if (personCountInput) personCountInput.focus();
            hasError = true;
        }
    } else {
        // 🛵 طلب دلفري: رقم الهاتف والعنوان مطلوبان
        if (!phone) {
            if (phoneInput) { phoneInput.classList.add('error'); phoneInput.focus(); }
            showNotification('⚠ الرجاء إدخال رقم الهاتف');
            hasError = true;
        } else if (!/^07[0-9]{9}$/.test(phone)) {
            if (phoneInput) phoneInput.classList.add('error');
            showNotification('⚠ رقم الهاتف غير صحيح (يجب أن يبدأ بـ 07)');
            hasError = true;
        }
        if (!area) {
            if (areaSelect) { areaSelect.classList.add('error'); if (!hasError) areaSelect.focus(); }
            showNotification('⚠ الرجاء اختيار منطقة التوصيل');
            hasError = true;
        }
    }
    
    if (hasError) return;

    // ✅ فحص الحظر فقط لطلبات الدلفري
    if (!isTableOrder) {
        showNotification('⏳ جاري التحقق من الحساب...');
        const banned = await isPhoneBanned(phone);
        if (banned) {
            showNotification('⛔ رقم الهاتف محظور ولا يمكنه الطلب حالياً');
            disableOrdering();
            return;
        }
    }

    // حفظ البيانات للدلفري فقط
    if (!isTableOrder) {
        saveLastOrderPhone(phone);
        try {
            safeLocalStorageSet('taloola_saved_phone', phone);
            if (area) safeLocalStorageSet('taloola_saved_area', area);
        } catch (e) { console.warn('⚠️ فشل حفظ بيانات الزبون:', e); }
    }

    let totalAmount = 0;
    cart.forEach((item) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 0;
        totalAmount += (itemPrice * itemQty);
    });

    const gpsLocation = isTableOrder ? null : (userLocation || getLocationFromStorage());
    showNotification('⏳ جاري حفظ طلبك...');

    // ✅✅✅ طباعة تشخيصية للملاحظات
    console.log('📝 الملاحظات المدخلة:', notes ? `"${notes}"` : '(فارغة)');
    console.log('🍽️ نوع الطلب:', isTableOrder ? 'صالة' : 'دلفري');

    try {
                let orderNumber = 0;
        const counterRef = firebase.database().ref('orders/counter');
        const ordersRef = firebase.database().ref('orders/list');

        try {
            // ✅✅✅ الإصلاح الجذري: transaction في Firebase JS SDK يُرجع كائن { committed, snapshot }
            // وليس الـ snapshot مباشرة. هذا كان سبب الدخول الدائم للـ catch واستخدام الرقم العشوائي!
            const transactionResult = await counterRef.transaction((currentValue) => { 
                return (currentValue || 0) + 1; 
            });
            
            if (transactionResult && transactionResult.committed && transactionResult.snapshot) {
                orderNumber = transactionResult.snapshot.val();
                console.log(`✅ تم توليد رقم الطلب تسلسلياً من Firebase: ${orderNumber}`);
            } else { 
                throw new Error('فشل الالتزام بالمعاملة (committed = false)'); 
            }
        } catch (transactionError) {
            console.warn('⚠️ فشل transaction، محاولة القراءة والكتابة المباشرة (Fallback):', transactionError);
            try {
                // طريقة بديلة آمنة: قراءة القيمة الحالية، زيادتها، وحفظها
                const snapshot = await counterRef.once('value');
                orderNumber = (snapshot.val() || 0) + 1;
                await counterRef.set(orderNumber);
                console.log(`✅ تم توليد رقم الطلب بالطريقة البديلة: ${orderNumber}`);
            } catch (fallbackError) {
                console.error('❌ فشلت جميع طرق الحصول على رقم الطلب:', fallbackError);
                // ملاذ أخير جداً: استخدام الوقت (فقط في حال انقطاع الإنترنت تماماً)
                orderNumber = Math.floor(Date.now() / 1000) % 100000;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // ✅✅✅ بناء كائن الطلب - مع ضمان وجود الملاحظات دائماً
        // ═══════════════════════════════════════════════════════════
        const orderData = {
            orderNumber: orderNumber,
            customerName: isTableOrder ? `زبون طاولة ${tableId}` : 'زبون',
            phone: isTableOrder ? '' : phone,
            area: isTableOrder ? `طاولة ${tableId}` : area,
            detailedAddress: isTableOrder ? '' : (detailed || ''),
            
            // ✅✅✅ الملاحظات: تُرسل دائماً حتى لو كانت فارغة (نص فارغ بدلاً من null)
            notes: notes || '',
            
            items: cart.map(item => ({
                name: item.name,
                category: item.category || 'غير مصنف',
                price: parseInt(item.price) || 0,
                quantity: parseInt(item.quantity) || 0,
                total: (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0)
            })),
            total: totalAmount,
            status: 'pending',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ar-EG'),
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            location: gpsLocation ? {
                latitude: gpsLocation.latitude,
                longitude: gpsLocation.longitude,
                googleMapsUrl: gpsLocation.googleMapsUrl || `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`
            } : null,
            notificationSent: false,
            
            // ✅ الحقول الخاصة بالطاولات
            tableId: isTableOrder ? parseInt(tableId) : null,
            tableNumber: isTableOrder ? `طاولة ${tableId}` : null,
            numberOfPersons: personCount,
            personCount: personCount,
            orderSource: isTableOrder ? "Table" : "Web",
            orderType: isTableOrder ? 2 : 3  // 2 = DineIn، 3 = Apps
        };

        console.log('📦 بيانات الطلب المُرسلة:', JSON.stringify(orderData, null, 2));

        const newOrderRef = await ordersRef.push(orderData);
        console.log('✅ تم حفظ الطلب في Firebase - Key:', newOrderRef.key);

        // ✅ حفظ الطلب النشط
        saveActiveOrder({
            orderId: newOrderRef.key,
            orderNumber: orderNumber,
            phone: isTableOrder ? '' : phone,
            status: 'pending',
            isTableOrder: isTableOrder,
            tableId: isTableOrder ? tableId : null
        });

        updateTrackingButtonVisibility();
        if (!isTableOrder) startListeningToActiveOrder();

        // ✅ حفظ الطلب في حساب المستخدم فقط للدلفري
        if (!isTableOrder && phone) {
            const userOrdersRef = firebase.database().ref(`users/${phone}/orders`);
            const userOrderData = { ...orderData, orderId: newOrderRef.key };
            await userOrdersRef.push(userOrderData);
        }

        sessionStorage.setItem('lastOrderNumber', String(orderNumber));
        if (!isTableOrder) {
            sessionStorage.setItem('lastOrderPhone', phone);
            localStorage.setItem('taloola_tracking_phone', phone);
        }

        // ═══════════════════════════════════════════════════════════
        // ✅✅✅ بناء رسالة واتساب - مع الملاحظات لكلا النوعين
        // ═══════════════════════════════════════════════════════════
        const whatsappNumber = '9647755666073';
        let message = `🛎️ طلب جديد #${orderNumber}\n━━━━━━━━━━━━━━━\n\n`;
        
        if (isTableOrder) {
            message += `🍽️ نوع الطلب: صالة\n`;
            message += `🪑 رقم الطاولة: ${tableId}\n`;
            message += `👥 عدد الأشخاص: ${personCount}\n`;
        } else {
            message += `🛵 نوع الطلب: دلفري\n`;
            message += `📞 رقم الهاتف: ${phone}\n`;
            message += `📍 منطقة التوصيل: ${area}\n`;
            if (detailed) message += `🏠 العنوان التفصيلي: ${detailed}\n`;
        }
        
        // ✅✅✅ الملاحظات: تظهر دائماً إذا وُجدت (لكلا النوعين)
        if (notes && notes.length > 0) {
            message += `\n📝 ملاحظات الطلب:\n   ${notes}\n`;
        }
        
        message += `\n━━━━━━━━━━━━━━━\n🛒 تفاصيل الطلب:\n\n`;

        cart.forEach((item, index) => {
            const itemPrice = parseInt(item.price) || 0;
            const itemQty = parseInt(item.quantity) || 0;
            const itemTotal = itemPrice * itemQty;
            message += `${index + 1}. ${item.name}\n`;
            message += `   الكمية: ${itemQty} | السعر: ${itemPrice.toLocaleString('ar-EG')} د.ع\n`;
            message += `   الإجمالي: ${itemTotal.toLocaleString('ar-EG')} د.ع\n\n`;
        });

        message += `━━━━━━━━━━━━━━━\n💰 المجموع النهائي: ${totalAmount.toLocaleString('ar-EG')} د.ع\n`;
        
        if (!isTableOrder && gpsLocation) {
            message += `\n📍 الموقع على الخريطة:\n${gpsLocation.googleMapsUrl || `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`}\n`;
        }
        
        message += `\n━━━━━━━━━━━━━━━\n⏰ وقت الطلب: ${new Date().toLocaleTimeString('ar-EG')}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`;

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        const orderTypeName = isTableOrder ? 'طلب الصالة' : 'طلب الدلفري';
        showNotification(`✅ تم إرسال ${orderTypeName} بنجاح! رقم الطلب: #${orderNumber}`);

        // ✅ تفريغ السلة المستخدمة فقط
        setActiveCart([]);
        saveCart();
        displayCartItems();

        // ✅ مسح حقول النموذج
        if (phoneInput) { phoneInput.value = ''; phoneInput.classList.remove('error'); }
        if (areaSelect) { areaSelect.value = ''; areaSelect.classList.remove('error'); }
        if (detailedInput) detailedInput.value = '';
        if (notesInput) notesInput.value = '';
        if (personCountInput) personCountInput.value = '1';
        updateNotesCounter();
        closeCartModal();
        
        updateTrackingButtonVisibility(); 

        // ✅ الانتقال إلى صفحة التتبع فقط للدلفري
        if (!isTableOrder) {
            setTimeout(() => {
                redirectToTrackingPage(orderNumber);
            }, 1500);
        }

    } catch (error) {
        console.error('❌ خطأ في حفظ الطلب:', error);
        let errorMessage = '⚠ فشل حفظ الطلب';
        if (error.code === 'PERMISSION_DENIED') errorMessage = '⚠ خطأ في الصلاحيات';
        else if (error.code === 'NETWORK_ERROR') errorMessage = '⚠ خطأ في الاتصال بالإنترنت';
        else if (error.message) errorMessage = `⚠ ${error.message}`;
        showNotification(errorMessage);
    }
}

// ═══════════════════════════════════════════════════════════
// 🔔 دوال عامة
// ═══════════════════════════════════════════════════════════
function showNotification(message) {
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.display = 'block';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideInDown 0.5s ease reverse';
        setTimeout(() => { if (notification.parentElement) notification.remove(); }, 500);
    }, 3000);
}

function openSupport() {
    try { window.open(`https://wa.me/9647755666073?text=${encodeURIComponent('أحتاج إلى مساعدة')}`, '_blank'); }
    catch (e) { showNotification('⚠ فشل فتح واتساب'); }
}

// ═══════════════════════════════════════════════════════════
// 📢 جلب الإعلانات من Firebase
// ═══════════════════════════════════════════════════════════
function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.trim().match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

function displayAds() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    adsContainer.innerHTML = '<div class="loading-text" style="color: #fff; text-align: center; grid-column: 1/-1; padding: 20px;">جاري تحميل العروض...</div>';
    if (typeof firebase === 'undefined' || !firebase.database) {
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.database) listenToAds();
            else adsContainer.innerHTML = '<div class="no-ads">تعذر تحميل العروض حالياً</div>';
        }, 1000);
        return;
    }
    listenToAds();
    function listenToAds() {
        firebase.database().ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
            adsContainer.innerHTML = '';
            const ads = snapshot.val();
            if (!ads) { adsContainer.innerHTML = '<div class="no-ads">لا توجد عروض خاصة حالياً</div>'; return; }
            const sortedKeys = Object.keys(ads).reverse();
            sortedKeys.forEach(key => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = `ad-card ${ad.template || 'red'}`;
                const mediaType = ad.mediaType || 'image';
                let mediaHtml = '';
                if (mediaType === 'youtube' && (ad.youtubeUrl || ad.youtubeId)) {
                    const videoId = ad.youtubeId || extractYouTubeId(ad.youtubeUrl);
                    if (videoId) {
                        mediaHtml = `<div class="ad-video-wrapper youtube"><div class="video-responsive"><iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" title="${ad.title || 'فيديو'}"></iframe></div><div class="media-type-badge youtube"><i class="fab fa-youtube"></i></div></div>`;
                    }
                } else if (mediaType === 'video' && ad.videoUrl) {
                    mediaHtml = `<div class="ad-video-wrapper direct"><video controls preload="metadata" playsinline poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23000'/%3E%3C/svg%3E" style="width: 100%; border-radius: 10px;"><source src="${ad.videoUrl}" type="video/mp4">المتصفح لا يدعم تشغيل الفيديو</video><div class="media-type-badge video"><i class="fas fa-video"></i></div></div>`;
                } else if (mediaType === 'image' && ad.imageUrl) {
                    const imageUrl = (ad.imageUrl || '').trim();
                    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
                        mediaHtml = `<div class="ad-image"><img src="${imageUrl}" alt="${ad.title || ''}" loading="lazy" onerror="handleImageError(this)"><div class="media-type-badge image"><i class="fas fa-image"></i></div></div>`;
                    }
                } else {
                    mediaHtml = `<div class="media-type-badge text-only"><i class="fas fa-font"></i> نص فقط</div>`;
                }
                adElement.innerHTML = `${mediaHtml}<div class="ad-card-content"><h4>${ad.title || 'عرض'}</h4><p>${ad.description || ''}</p>${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}</div>`;
                adsContainer.appendChild(adElement);
            });
        }, (error) => {
            console.error('خطأ في جلب الإعلانات:', error);
            adsContainer.innerHTML = '<div class="no-ads">تعذر تحميل العروض حالياً</div>';
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 🎯 Event Delegation و معالجات النوافذ
// ═══════════════════════════════════════════════════════════
function setupProductClickDelegation() {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    if (mainElement._productClickHandler) mainElement.removeEventListener('click', mainElement._productClickHandler);
    const handler = function(e) {
        if (e.target.closest('button, a, .qty-btn-new')) return;
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            e.preventDefault();
            e.stopPropagation();
            openProductModal(menuItem);
        }
    };
    mainElement.addEventListener('click', handler);
    mainElement._productClickHandler = handler;
}

function setupProductModalHandlers() {
    const decreaseBtn = document.getElementById('modalQtyDecrease');
    const increaseBtn = document.getElementById('modalQtyIncrease');
    const addToCartBtn = document.getElementById('modalAddToCartBtn');
    const closeBtn = document.querySelector('.close-product-modal');
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            changeModalQuantity(-1);
        });
    }
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            changeModalQuantity(1);
        });
    }
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addCurrentProductToCart();
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProductModal();
        });
    }
}

// ═══════════════════════════════════════════════════════════
// ✅✅✅ فتح السلة مع تعديل الحقول ديناميكياً حسب نوع الطلب (نسخة محسّنة)
// ═══════════════════════════════════════════════════════════
function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;

    const phoneGroup = document.getElementById('customerPhone')?.closest('.input-group-new');
    const areaGroup = document.getElementById('deliveryArea')?.closest('.input-group-new');
    const detailedGroup = document.getElementById('detailedAddress')?.closest('.input-group-new');
    const personCountGroup = document.getElementById('personCountGroup');
    const tableInfoBox = document.getElementById('tableInfoBox');
    const cartTitle = document.getElementById('cartModalTitle');
    const cartModeBanner = document.getElementById('cartModeBanner');

    if (isTableOrder) {
        // 🍽️ وضع الصالة: إخفاء حقول الدلفري وإظهار عدد الأشخاص
        if (phoneGroup) phoneGroup.style.display = 'none';
        if (areaGroup) areaGroup.style.display = 'none';
        if (detailedGroup) detailedGroup.style.display = 'none';
        if (personCountGroup) personCountGroup.style.display = 'block';

        // إنشاء/تحديث صندوق معلومات الطاولة
        if (tableInfoBox) {
            tableInfoBox.innerHTML = `
                <div style="font-size: 28px; margin-bottom: 8px;">🍽️</div>
                <div style="font-size: 18px; font-weight: bold; color: #5C4B2E;">طلب صالة</div>
                <div style="font-size: 16px; color: #5C4B2E; margin-top: 8px;">
                    🪑 طاولة رقم: <strong style="color: #D4AF37; font-size: 22px;">${tableId}</strong>
                </div>
            `;
            tableInfoBox.style.display = 'block';
        }

        // تحديث العنوان والشعار
        if (cartTitle) cartTitle.innerHTML = '<i class="fas fa-utensils"></i> طلب صالة';
        if (cartModeBanner) {
            cartModeBanner.textContent = `🪑 أنت تطلب من طاولة رقم ${tableId}`;
            cartModeBanner.style.display = 'block';
            cartModeBanner.style.background = 'linear-gradient(135deg, #FFF8DC, #FFE4B5)';
            cartModeBanner.style.color = '#5C4B2E';
        }
    } else {
        // 🛵 وضع الدلفري: إظهار الحقول العادية
        if (phoneGroup) phoneGroup.style.display = '';
        if (areaGroup) areaGroup.style.display = '';
        if (detailedGroup) detailedGroup.style.display = '';
        if (personCountGroup) personCountGroup.style.display = 'none';
        if (tableInfoBox) tableInfoBox.style.display = 'none';

        // تحديث العنوان والشعار
        if (cartTitle) cartTitle.innerHTML = '<i class="fas fa-shopping-cart"></i> طلب توصيل';
        if (cartModeBanner) {
            cartModeBanner.textContent = '🛵 توصيل إلى عنوانك';
            cartModeBanner.style.display = 'block';
            cartModeBanner.style.background = 'linear-gradient(135deg, #FFE4E1, #FFC0CB)';
            cartModeBanner.style.color = '#8B0000';
        }
    }

    loadSavedCustomerInfo();
    displayCartItems();
    updateNotesCounter();
    modal.style.display = 'flex';

    if (!isTableOrder) {
        updateLocationInCart();
    }
}

// ═══════════════════════════════════════════════════════════
// 🚀 التهيئة عند تحميل الصفحة
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('touchstart', function(){}, {passive: true});
    
    const firebaseConfig = {
        apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
        authDomain: "talola-food.firebaseapp.com",
        databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
        projectId: "talola-food",
        messagingSenderId: "440585170470",
        appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
    };
    
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(firebaseScript);
    
    const firebaseDbScript = document.createElement('script');
    firebaseDbScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    document.head.appendChild(firebaseDbScript);
    
    const topStickyBar = document.getElementById('topStickyBar');
    const mainHeader = document.getElementById('mainHeader');
    
    function getHeaderOffset() {
        return mainHeader ? mainHeader.offsetHeight - 50 : 200;
    }
    
    function handleScroll() {
        if (!topStickyBar) return;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const headerOffset = getHeaderOffset();
        const sectionsNav = document.getElementById('sectionsNav');
        if (scrollY > headerOffset) {
            topStickyBar.classList.add('visible');
            if (sectionsNav) sectionsNav.classList.add('stuck-under-bar');
        } else {
            topStickyBar.classList.remove('visible');
            if (sectionsNav) sectionsNav.classList.remove('stuck-under-bar');
        }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }
    
    const getLocationBtn = document.getElementById('getLocationBtn');
    if (getLocationBtn && !isTableOrder) {
        getLocationBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await requestLocationAndUpdate();
        });
    }
    
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) {
            if (window.pageYOffset > 300) scrollToTopBtn.classList.add('visible');
            else scrollToTopBtn.classList.remove('visible');
        }
    }, { passive: true });
    
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('cartModal')) closeCartModal();
        if (event.target === document.getElementById('orderReviewModal')) closeOrderReview();
        if (event.target === document.getElementById('locationModal')) closeLocationModal();
        if (event.target === document.getElementById('productModal')) closeProductModal();
    });
    
    updateCartUI();
    if (!isTableOrder) {
        initLocationIcon();
        initializeLocationSystem();
    }
    setupProductClickDelegation();
    setupProductModalHandlers();
    initSmartImageLoading();
    
    const notesTextarea = document.getElementById('orderNotes');
    if (notesTextarea) {
        notesTextarea.addEventListener('input', updateNotesCounter);
        updateNotesCounter();
    }
    
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput && !isTableOrder) {
        let phoneCheckTimeout;
        phoneInput.addEventListener('input', function() {
            clearTimeout(phoneCheckTimeout);
            phoneCheckTimeout = setTimeout(async () => {
                const phone = getCurrentPhoneInput();
                if (phone) await checkPhoneBanRealtime(phone);
                else enableOrdering();
            }, 800);
        });
        phoneInput.addEventListener('blur', async function() {
            const phone = getCurrentPhoneInput();
            if (phone) await checkPhoneBanRealtime(phone);
        });
    }
    
    firebaseDbScript.onload = function() {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.initializeApp(firebaseConfig);
                    console.log('✅ تم تهيئة Firebase بنجاح');
                    loadProcessingDuration();
                    loadBanDuration();
                    displayAds();
                    loadMenuFromFirebase();
                    startListeningToActiveOrder();
                    if (!isTableOrder) {
                        loadDeliveryAreas();
                        setupDeliveryTimeListener();
                    }
                } catch (error) {
                    console.error('خطأ في تهيئة Firebase:', error);
                }
            }
        }, 500);
    };
    
    const processingStart = parseInt(safeLocalStorageGet(PROCESSING_KEY, '0'));
    if (processingStart) {
        const now = Date.now();
        if (now - processingStart < processingDurationMs) showProcessingWindow();
        else {
            safeLocalStorageRemove(PROCESSING_KEY);
            enableOrdering();
        }
    }
    
    if (!isTableOrder) {
        loadDeliveryAreas();
        setupDeliveryTimeListener();
    }

    setTimeout(async () => {
        const currentPhone = getCurrentPhoneInput();
        if (currentPhone) await checkPhoneBanRealtime(currentPhone);
        else checkBanStatus();
        updateTrackingButtonVisibility();
    }, 1000);

    window.addEventListener('pageshow', function(event) {
        if (event.persisted || document.visibilityState === 'visible') {
            setTimeout(updateTrackingButtonVisibility, 500);
        }
    });

    window.addEventListener('focus', function() {
        setTimeout(updateTrackingButtonVisibility, 300);
    });
});

// ═══════════════════════════════════════════════════════════
// ✅ معالج زر إلغاء الطلب
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async function() {
            const confirmCancel = confirm('هل أنت متأكد من إلغاء الطلب؟\n\nسيتم حظر رقم هاتفك مؤقتاً وفقاً لإعدادات المطعم.');
            if (confirmCancel) {
                const lastPhone = getLastOrderPhone();
                if (lastPhone) await banPhone(lastPhone, banDurationMs);
                else {
                    const banUntil = Date.now() + banDurationMs;
                    safeLocalStorageSet(BAN_KEY, banUntil.toString());
                }
                closeProcessingWindow();
                setActiveCart([]);
                saveCart();
                displayCartItems();
                showNotification('تم إلغاء الطلب. تم حظر رقمك مؤقتاً وفقاً لإعدادات المطعم.');
                clearActiveOrder();
                updateTrackingButtonVisibility();
            }
        });
    }
});

// ═══════════════════════════════════════════════════════════
// 🔒 دوال الحظر
// ═══════════════════════════════════════════════════════════
function checkBanStatus() {
    const banUntil = parseInt(safeLocalStorageGet(BAN_KEY, '0'));
    if (!banUntil) return false;
    const now = Date.now();
    if (now < banUntil) {
        showBanWindow(banUntil);
        return true;
    } else {
        safeLocalStorageRemove(BAN_KEY);
        return false;
    }
}

function showBanWindow(banUntil) {
    const modal = document.getElementById('banModal');
    const message = document.getElementById('banMessage');
    if (!modal || !message) return;
    if (banCountdownInterval) {
        clearInterval(banCountdownInterval);
        banCountdownInterval = null;
    }
    const banData = safeJsonParse(safeLocalStorageGet(BAN_DATA_KEY));
    let phoneInfo = '';
    if (banData && banData.phone) phoneInfo = `<p class="ban-phone-text"><i class="fas fa-phone"></i> <strong>الرقم:</strong> ${banData.phone}</p>`;
    let timeInfo = '';
    if (banUntil === 'permanent' || banUntil === 0) timeInfo = '<p class="ban-permanent-text"><i class="fas fa-infinity"></i> <strong>حظر دائم</strong></p>';
    else timeInfo = `<p class="ban-temporary-text"><i class="fas fa-clock"></i> <strong>المدة المتبقية:</strong> <span id="banTimeCountdown">جاري الحساب...</span></p>`;
    message.innerHTML = `${phoneInfo}${timeInfo}<p>تم تعليق حسابك بسبب إلغاء طلب سابق أو مخالفة شروط الاستخدام.</p><p class="ban-warning-text"><i class="fas fa-exclamation-triangle"></i> أي محاولة للتلاعب ستؤدي إلى حظر دائم.</p>`;
    modal.style.display = 'flex';
    disableOrdering();
    if (banUntil !== 'permanent' && banUntil !== 0) {
        const countdownEl = document.getElementById('banTimeCountdown');
        banCountdownInterval = setInterval(() => {
            const now = Date.now();
            const remaining = banUntil - now;
            if (remaining <= 0) {
                clearInterval(banCountdownInterval);
                banCountdownInterval = null;
                if (countdownEl) countdownEl.textContent = "انتهى الحظر!";
                safeLocalStorageRemove(BAN_KEY);
                safeLocalStorageRemove(BAN_DATA_KEY);
                enableOrdering();
                modal.style.display = 'none';
                showNotification('✅ تم رفع الحظر عن حسابك، يمكنك تقديم طلب جديد الآن.');
            } else {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                if (countdownEl) countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }
}

function closeBanModal() {
    const modal = document.getElementById('banModal');
    if (modal) modal.style.display = 'none';
    if (banCountdownInterval) {
        clearInterval(banCountdownInterval);
        banCountdownInterval = null;
    }
}

// ═══════════════════════════════════════════════════════════
// 🗺️ تحميل مناطق التوصيل (فقط للدلفري)
// ═══════════════════════════════════════════════════════════
function loadDeliveryAreas() {
    if (isTableOrder) return; // ✅ لا نحتاج المناطق في طلب الصالة
    
    const select = document.getElementById('deliveryArea');
    if (!select) return;

    const cachedAreas = localStorage.getItem('taloola_delivery_areas');
    if (cachedAreas) {
        try {
            renderAreasToSelect(JSON.parse(cachedAreas), select);
        } catch (e) {
            console.warn('⚠️ خطأ في قراءة المناطق من الذاكرة المحلية');
        }
    } else {
        select.innerHTML = '<option value="">-- جاري تحميل المناطق...</option>';
    }

    if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref('delivery_areas').orderByChild('order').once('value')
            .then((snapshot) => {
                const areas = snapshot.val();
                if (areas) {
                    localStorage.setItem('taloola_delivery_areas', JSON.stringify(areas));
                    renderAreasToSelect(areas, select);
                } else if (!cachedAreas) {
                    select.innerHTML = '<option value="">-- لا توجد مناطق متاحة حالياً --</option>';
                }
            })
            .catch((error) => {
                console.error('❌ خطأ في جلب المناطق من Firebase:', error);
                if (!cachedAreas) {
                    select.innerHTML = '<option value="">-- فشل التحميل، يرجى تحديث الصفحة --</option>';
                }
            });
    }
}

function renderAreasToSelect(areasData, selectElement) {
    selectElement.innerHTML = '<option value="">-- اختر المنطقة --</option>';
    const grouped = {};
    Object.values(areasData).forEach(area => {
        if (!grouped[area.category]) grouped[area.category] = [];
        grouped[area.category].push(area);
    });
    const categoryOrder = ['التقاطعات', 'القطاعات', 'الأسواق', 'المناطق', 'الأحياء', 'معالم', 'الكوفيات'];
    const categoryIcons = { 
        'التقاطعات': '📍', 'القطاعات': '🏘️', 'الأسواق': '🛒', 
        'المناطق': '🏡', 'الأحياء': '🏘️', 'معالم': '🏥', 'الكوفيات': '☕' 
    };
    categoryOrder.forEach(cat => {
        if (grouped[cat]) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${categoryIcons[cat] || ''} ${cat}`;
            grouped[cat].forEach(area => {
                const option = document.createElement('option');
                option.value = area.name;
                option.dataset.time = area.estimatedTime || 20;
                option.textContent = area.name;
                optgroup.appendChild(option);
            });
            selectElement.appendChild(optgroup);
        }
    });
    loadSavedCustomerInfo();
}

function setupDeliveryTimeListener() {
    if (isTableOrder) return;
    const select = document.getElementById('deliveryArea');
    const hint = document.getElementById('deliveryTimeHint');
    const timeDisplay = document.getElementById('estimatedTimeDisplay');
    if (select && hint && timeDisplay) {
        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const estimatedTime = selectedOption.dataset.time || 20;
            if (this.value) {
                timeDisplay.textContent = estimatedTime;
                hint.style.display = 'flex';
            } else {
                hint.style.display = 'none';
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 📤 تصدير الدوال العامة
// ═══════════════════════════════════════════════════════════
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.clearCart = clearCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.showOrderReview = showOrderReview;
window.closeOrderReview = closeOrderReview;
window.confirmAndSendOrder = confirmAndSendOrder;
window.openSupport = openSupport;
window.requestLocationAndUpdate = requestLocationAndUpdate;
window.closeLocationModal = closeLocationModal;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.changeModalQuantity = changeModalQuantity;
window.addCurrentProductToCart = addCurrentProductToCart;
window.showCartAddEffect = showCartAddEffect;
window.smartImageLoader = smartImageLoader;
window.handleImageError = handleImageError;
window.closeBanModal = closeBanModal;
window.updateNotesCounter = updateNotesCounter;
window.showProcessingWindow = showProcessingWindow;
window.startProcessingCountdown = startProcessingCountdown;
window.redirectToTrackingPage = redirectToTrackingPage;
window.disableOrdering = disableOrdering;
window.enableOrdering = enableOrdering;
window.updateTrackingButtonVisibility = updateTrackingButtonVisibility;
window.startListeningToActiveOrder = startListeningToActiveOrder;
window.getActiveOrder = getActiveOrder;
window.saveActiveOrder = saveActiveOrder;
window.clearActiveOrder = clearActiveOrder;
window.isOrderActive = isOrderActive;

// ✅ تصدير الدوال الجديدة للوصول للسلة الصحيحة
window.getActiveCart = getActiveCart;
window.setActiveCart = setActiveCart;
window.getActiveCartKey = getActiveCartKey;
window.getActiveCartName = getActiveCartName;
