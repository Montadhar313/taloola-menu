// ============================================
// 🍽️ تحميل المنيو الديناميكي - النسخة المحدثة v2.0
// ============================================

// 🆕 متغيرات عامة
let cachedCategories = [];
let cachedMenuItems = null;
let isMenuInitialized = false;
let smartImageLoader = null;
let firebaseInitialized = false;

// ============================================
// 🚀 نظام تحميل الصور الذكي المتسلسل
// ============================================
class SmartSequentialImageLoader {
    constructor() {
        this.queue = [];
        this.currentlyLoading = new Set();
        this.cache = new Map();
        this.waitingElements = new Map();
        this.visibilityObserver = null;
        this.preloadObserver = null;
        this.config = {
            maxConcurrent: this.detectOptimalConcurrency(),
            preloadDistance: 400,
            highPriorityDistance: 150
        };
        
        console.log(`⚡ Smart Loader جاهز - Concurrent: ${this.config.maxConcurrent}`);
        this.init();
    }
    
    detectOptimalConcurrency() {
        const connection = navigator.connection || 
                          navigator.mozConnection || 
                          navigator.webkitConnection;
        
        if (connection) {
            if (connection.saveData) return 1;
            switch(connection.effectiveType) {
                case '4g': return 4;
                case '3g': return 2;
                case '2g': 
                case 'slow-2g': return 1;
                default: return 3;
            }
        }
        
        return Math.min(navigator.hardwareConcurrency || 3, 4);
    }
    
    init() {
        this.loadFromSessionCache();
        this.setupObservers();
        this.monitorConnectionChanges();
    }
    
    setupObservers() {
        this.visibilityObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const priority = this.calculatePriority(img);
                        this.enqueue(img, priority);
                        this.visibilityObserver.unobserve(img);
                    }
                });
            },
            {
                rootMargin: `${this.config.preloadDistance}px 0px`,
                threshold: 0.01
            }
        );
        
        this.preloadObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.preloadSectionImages(entry.target);
                        this.preloadObserver.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '600px 0px',
                threshold: 0
            }
        );
    }
    
    calculatePriority(img) {
        const rect = img.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        if (!rect || rect.width === 0) return 100;
        
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(imgCenterX - centerX, 2) + 
            Math.pow(imgCenterY - centerY, 2)
        );
        
        if (rect.top < viewportHeight && rect.bottom > 0) {
            return 1 + (distance / 1000);
        }
        
        if (rect.top < viewportHeight + this.config.highPriorityDistance) {
            return 10 + (distance / 500);
        }
        
        return 100 + (distance / 200);
    }
    
    observeAllImages() {
        const lazyImages = document.querySelectorAll('.lazy-image:not(.observed)');
        
        lazyImages.forEach(img => {
            img.classList.add('observed');
            if (this.visibilityObserver) {
                this.visibilityObserver.observe(img);
            }
            
            const section = img.closest('.menu-section');
            if (section && this.preloadObserver) {
                this.preloadObserver.observe(section);
            }
        });
        
        if (lazyImages.length > 0) {
            console.log(`🖼️ مراقبة ${lazyImages.length} صورة جديدة`);
        }
    }
    
    enqueue(img, priority = 50) {
        const src = img.getAttribute('data-src');
        if (!src || src.trim() === '') return;
        
        if (this.cache.has(src)) {
            this.applyImage(img, src);
            return;
        }
        
        if (!this.waitingElements.has(src)) {
            this.waitingElements.set(src, []);
            this.queue.push({ src, priority });
            this.sortQueue();
        }
        
        this.waitingElements.get(src).push(img);
        if (!img.classList.contains('loading')) {
            img.classList.add('loading');
        }
        this.processQueue();
    }
    
    sortQueue() {
        this.queue.sort((a, b) => a.priority - b.priority);
    }
    
    processQueue() {
        while (
            this.currentlyLoading.size < this.config.maxConcurrent && 
            this.queue.length > 0
        ) {
            const next = this.queue.shift();
            if (next) {
                this.loadImage(next.src);
            }
        }
    }
    
    loadImage(src) {
        this.currentlyLoading.add(src);
        
        const img = new Image();
        img.decoding = 'async';
        
        const loadTimeout = setTimeout(() => {
            console.warn(`⏱️ Timeout: ${src}`);
            this.handleImageError(src);
        }, 30000);
        
        img.onload = () => {
            clearTimeout(loadTimeout);
            this.handleImageLoad(src);
        };
        
        img.onerror = () => {
            clearTimeout(loadTimeout);
            this.handleImageError(src);
        };
        
        img.src = src;
    }
    
    handleImageLoad(src) {
        this.currentlyLoading.delete(src);
        this.cache.set(src, true);
        
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => {
            this.applyImage(element, src);
        });
        
        this.waitingElements.delete(src);
        this.saveToSessionCache(src);
        this.processQueue();
    }
    
    handleImageError(src) {
        console.warn(`❌ فشل تحميل: ${src.split('/').pop()}`);
        this.currentlyLoading.delete(src);
        
        const waitingElements = this.waitingElements.get(src) || [];
        const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23eee"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle" dy=".3em">No Image</text></svg>';
        
        waitingElements.forEach(element => {
            element.classList.remove('loading');
            element.classList.add('error');
            if (!element.dataset.fallbackApplied) {
                element.dataset.fallbackApplied = 'true';
                element.src = fallback;
            }
        });
        this.waitingElements.delete(src);
        this.processQueue();
    }
    
    applyImage(img, src) {
        if (img.src && img.src === src) return;
        
        img.src = src;
        img.classList.remove('loading');
        img.classList.add('loaded');
        
        const skeleton = img.parentElement?.querySelector('.image-skeleton');
        if (skeleton) {
            skeleton.style.transition = 'opacity 0.4s ease';
            skeleton.style.opacity = '0';
            setTimeout(() => {
                if (skeleton.parentElement) {
                    skeleton.remove();
                }
            }, 400);
        }
    }
    
    preloadSectionImages(section) {
        const images = section.querySelectorAll('.lazy-image[data-src]:not(.observed)');
        
        images.forEach((img, index) => {
            const src = img.getAttribute('data-src');
            if (src && src.trim() !== '' && !this.cache.has(src) && !this.currentlyLoading.has(src)) {
                img.classList.add('observed');
                this.queue.push({ src, priority: 30 + index });
                
                if (!this.waitingElements.has(src)) {
                    this.waitingElements.set(src, []);
                }
                this.waitingElements.get(src).push(img);
            }
        });
        
        this.sortQueue();
        this.processQueue();
    }
    
    saveToSessionCache(src) {
        try {
            const cached = JSON.parse(sessionStorage.getItem('taloola_image_cache') || '[]');
            if (!cached.includes(src)) {
                cached.push(src);
                if (cached.length > 100) cached.shift();
                sessionStorage.setItem('taloola_image_cache', JSON.stringify(cached));
            }
        } catch (e) {}
    }
    
    loadFromSessionCache() {
        try {
            const cached = JSON.parse(sessionStorage.getItem('taloola_image_cache') || '[]');
            cached.slice(0, 20).forEach(src => {
                this.cache.set(src, true);
            });
            if (cached.length > 0) {
                console.log(`⚡ تم استرجاع ${Math.min(cached.length, 20)} صورة من الكاش`);
            }
        } catch (e) {}
    }
    
    monitorConnectionChanges() {
        const connection = navigator.connection || 
                          navigator.mozConnection || 
                          navigator.webkitConnection;
        
        if (connection) {
            connection.addEventListener('change', () => {
                const newConcurrency = this.detectOptimalConcurrency();
                if (newConcurrency !== this.config.maxConcurrent) {
                    this.config.maxConcurrent = newConcurrency;
                    console.log(`📶 تغيير السرعة - Concurrent: ${newConcurrency}`);
                    this.processQueue();
                }
            });
        }
    }
    
    getStats() {
        return {
            cached: this.cache.size,
            loading: this.currentlyLoading.size,
            queued: this.queue.length,
            waiting: this.waitingElements.size,
            maxConcurrent: this.config.maxConcurrent
        };
    }
}

// ============================================
// 📦 تحميل المنيو من Firebase - محسّن
// ============================================
async function loadMenuFromFirebase() {
    if (!firebaseInitialized || typeof firebase === 'undefined' || !firebase.database) {
        setTimeout(loadMenuFromFirebase, 500);
        return;
    }
    
    console.log('🔍 بدء تحميل المنيو من Firebase...');
    
    try {
        // تحميل متوازي للأقسام والأصناف
        const [categoriesSnap, menuSnap] = await Promise.all([
            firebase.database().ref('categories').orderByChild('order').once('value'),
            firebase.database().ref('menu').once('value')
        ]);
        
        const categories = categoriesSnap.val();
        const menuItems = menuSnap.val();
        
        if (!categories) {
            console.warn('⚠️ لا توجد أقسام في Firebase');
            return;
        }
        
        if (!menuItems) {
            console.warn('⚠️ لا توجد أصناف في Firebase');
            return;
        }
        
        cachedCategories = Object.keys(categories).map(key => ({
            id: key,
            ...categories[key]
        })).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        cachedMenuItems = menuItems;
        
        console.log(`✅ تم تحميل ${cachedCategories.length} قسم و ${Object.keys(menuItems).length} صنف`);
        
        if (!isMenuInitialized) {
            isMenuInitialized = true;
            buildCompleteMenu();
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنيو:', error);
        showNotification('⚠ فشل تحميل القائمة، يرجى تحديث الصفحة');
    }
}

function buildCompleteMenu() {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error('❌ عنصر main غير موجود');
        return;
    }
    
    // 1️⃣ حذف الأقسام القديمة
    const oldSections = mainElement.querySelectorAll('.menu-section[data-category]');
    oldSections.forEach(section => section.remove());
    console.log(`🗑️ تم حذف ${oldSections.length} قسم قديم`);
    
    // 2️⃣ الحصول على العنصر المرجعي
    const referenceElement = mainElement.querySelector('#team') || 
                              mainElement.querySelector('#support') || 
                              mainElement.querySelector('#social');
    
    // 3️⃣ بناء الأقسام باستخدام Fragment للأداء
    const fragment = document.createDocumentFragment();
    
    cachedCategories.forEach((category) => {
        const section = document.createElement('section');
        section.className = 'menu-section animate-in';
        section.id = `sec-${category.id}`;
        section.setAttribute('data-category', category.name);
        section.setAttribute('data-cat-id', category.id);
        
        section.innerHTML = `
            <h3>${category.icon || '📁'} ${escapeHtml(category.name)}</h3>
            <div class="menu-items"></div>
        `;
        
        fragment.appendChild(section);
    });
    
    if (referenceElement) {
        mainElement.insertBefore(fragment, referenceElement);
    } else {
        mainElement.appendChild(fragment);
    }
    console.log(`✨ تم إنشاء ${cachedCategories.length} قسم جديد`);
    
    // 4️⃣ تحديث أزرار التنقل
    updateNavigationButtons(cachedCategories);
    
    // 5️⃣ توزيع الأصناف
    populateMenuItems(cachedCategories, cachedMenuItems);
    
    // 6️⃣ تهيئة محمل الصور ومراقبتها
    if (!smartImageLoader) {
        smartImageLoader = new SmartSequentialImageLoader();
    }
    
    // تأخير بسيط لضمان إضافة DOM بالكامل
    requestAnimationFrame(() => {
        if (smartImageLoader) {
            smartImageLoader.observeAllImages();
        }
    });
}

function updateNavigationButtons(categoriesArray) {
    const navElement = document.getElementById('sectionsNav');
    if (!navElement) return;
    
    navElement.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    categoriesArray.forEach((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-section', `sec-${category.id}`);
        button.textContent = `${category.icon || ''} ${category.name}`;
        button.className = 'nav-btn';
        
        button.addEventListener('click', function() {
            const targetSection = document.getElementById(`sec-${category.id}`);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                navElement.querySelectorAll('button').forEach(b => {
                    b.classList.remove('active-nav-btn');
                });
                this.classList.add('active-nav-btn');
            }
        });
        
        fragment.appendChild(button);
    });
    
    navElement.appendChild(fragment);
    console.log(`🔘 تم تحديث ${categoriesArray.length} زر تنقل`);
}

function populateMenuItems(categoriesArray, menuItems) {
    // تفريغ الحاويات
    document.querySelectorAll('.menu-section .menu-items').forEach(container => {
        container.innerHTML = '';
    });
    
    // تحويل الأصناف لمصفوفة وتجميعها حسب القسم
    const itemsArray = Object.keys(menuItems || {}).map(key => ({
        id: key,
        ...menuItems[key]
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // تجميع حسب القسم لتحسين الأداء
    const itemsByCategory = {};
    categoriesArray.forEach(cat => {
        itemsByCategory[cat.name] = [];
    });
    
    itemsArray.forEach(item => {
        if (item.available === false) return;
        if (itemsByCategory[item.category]) {
            itemsByCategory[item.category].push(item);
        } else {
            console.warn(`⚠️ القسم "${item.category}" غير موجود للصنف "${item.name}"`);
        }
    });
    
    let itemsAdded = 0;
    
    // بناء DOM لكل قسم
    categoriesArray.forEach(category => {
        const section = document.querySelector(`.menu-section[data-category="${category.name}"]`);
        if (!section) return;
        
        const itemsContainer = section.querySelector('.menu-items');
        if (!itemsContainer) return;
        
        const items = itemsByCategory[category.name] || [];
        
        if (items.length === 0) {
            section.style.display = 'none';
            return;
        } else {
            section.style.display = '';
        }
        
        const itemFragment = document.createDocumentFragment();
        
        items.forEach(item => {
            const menuElement = createMenuItemElement(item);
            itemFragment.appendChild(menuElement);
            itemsAdded++;
        });
        
        itemsContainer.appendChild(itemFragment);
    });
    
    console.log(`✅ تم توزيع ${itemsAdded} صنف على الأقسام`);
}

function createMenuItemElement(item) {
    const menuElement = document.createElement('div');
    menuElement.className = 'menu-item';
    menuElement.setAttribute('data-name', item.name || '');
    menuElement.setAttribute('data-price', item.price || 0);
    menuElement.setAttribute('data-image', item.image || '');
    menuElement.setAttribute('data-description', item.description || 'منتج لذيذ من مطعم تعلولة');
    
    // معالجة الصورة - ضمان وجود رابط صالح
    let imageUrl = '';
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
        imageUrl = item.image.trim();
    } else {
        // صورة بديلة بصيغة SVG مشفرة
        imageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f5f5f5"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle" dy=".3em">🍽️ ' + encodeURIComponent(item.name || 'منتج') + '</text></svg>';
    }
    
    menuElement.innerHTML = `
        <div class="item-image">
            <div class="image-skeleton"></div>
            <img data-src="${escapeHtml(imageUrl)}" 
                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                 alt="${escapeHtml(item.name || '')}" 
                 class="lazy-image" 
                 decoding="async" 
                 loading="lazy"
                 width="400" 
                 height="300">
        </div>
        <h4>${escapeHtml(item.name || '')}</h4>
        <p class="price">${formatPrice(item.price)} د.ع</p>
    `;
    
    return menuElement;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatPrice(price) {
    const num = parseInt(price) || 0;
    return num.toLocaleString('ar-EG');
}

// 🆕 تفويض الأحداث لمعالجة النقر (بدلاً من cloneNode)
function setupMenuClickDelegation() {
    // تفويض على مستوى المستند
    document.addEventListener('click', function(e) {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem && menuItem.closest('.menu-section')) {
            e.preventDefault();
            e.stopPropagation();
            openProductModal(menuItem);
        }
    });
}

// ============================================
// 📍 نظام الموقع الجغرافي
// ============================================
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
let savedAddressText = localStorage.getItem(LOCATION_TEXT_STORAGE_KEY) || '';

function saveLocationToStorage(location) {
    try {
        const locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: Date.now(),
            googleMapsUrl: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
        return locationData;
    } catch (error) { return null; }
}

function getLocationFromStorage() {
    try {
        const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (storedLocation) {
            const locationData = JSON.parse(storedLocation);
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
        textSpan.innerHTML = `
            ⚠ تم رفض إذن الموقع سابقاً<br>
            <small style="display:block; margin-top:10px; line-height:1.8; text-align:right;">
                📱 <strong>لتفعيل الموقع في Chrome:</strong><br>
                1️⃣ اضغط على أيقونة القفل 🔒<br>
                2️⃣ اختر "أذونات الموقع"<br>
                3️⃣ فعّل "الموقع"<br>
                4️⃣ أعد تحميل الصفحة
            </small>
        `;
    }
}

function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('المتصفح لا يدعم تحديد الموقع'));
            return;
        }
        
        const os = detectOS();
        
        if (os === 'android') {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                }),
                (error) => {
                    let errorMessage = 'خطأ في تحديد الموقع';
                    let detailedMessage = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'تم رفض إذن الموقع';
                            detailedMessage = 'PERMISSION_DENIED';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'المعلومات غير متوفرة';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'انتهت المهلة';
                            break;
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
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
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
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                }),
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
        localStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
        
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
    locationIconBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openLocationModal();
    });
}

function updateLocationIconStatus() {
    const locationIconBtn = document.getElementById('locationIconBtn');
    if (!locationIconBtn) return;
    const storedLocation = getLocationFromStorage();
    if (storedLocation || userLocation) {
        locationIconBtn.classList.add('located');
    } else {
        locationIconBtn.classList.remove('located');
    }
}

function openLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) {
        modal.style.display = 'flex';
        updateLocationModalStatus();
    }
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

// ============================================
// 🛒 نظام السلة العائمة - محسّن
// ============================================
let shoppingCart = JSON.parse(localStorage.getItem('taloola_cart')) || [];

function saveCart() {
    try {
        localStorage.setItem('taloola_cart', JSON.stringify(shoppingCart));
    } catch (e) {
        console.warn('⚠️ فشل حفظ السلة');
    }
    updateCartUI();
}

function updateCartUI() {
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const floatingCartCount = document.getElementById('floatingCartCount');
    if (!floatingCartBtn || !floatingCartCount) return;
    
    const totalItems = shoppingCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    floatingCartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        floatingCartBtn.classList.add('has-items');
    } else {
        floatingCartBtn.classList.remove('has-items');
    }
}

function showCartAddEffect() {
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    if (floatingCartBtn && floatingCartBtn.classList.contains('has-items')) {
        floatingCartBtn.classList.remove('item-added');
        void floatingCartBtn.offsetWidth;
        floatingCartBtn.classList.add('item-added');
        
        setTimeout(() => {
            floatingCartBtn.classList.remove('item-added');
        }, 600);
    }
}

function addToCart(name, price, quantity = 1) {
    if (!name || !price) return;
    
    const existingItem = shoppingCart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        shoppingCart.push({ 
            name: String(name), 
            price: parseInt(price) || 0, 
            quantity: quantity 
        });
    }
    saveCart();
    showNotification(`✓ تم إضافة ${quantity} × ${name}`);
    showCartAddEffect();
    
    if (navigator.vibrate) {
        navigator.vibrate([10, 30, 10]);
    }
}

function removeFromCart(index) {
    if (index < 0 || index >= shoppingCart.length) return;
    shoppingCart.splice(index, 1);
    saveCart();
    displayCartItems();
}

function changeQuantity(index, change) {
    if (index < 0 || index >= shoppingCart.length) return;
    shoppingCart[index].quantity += change;
    if (shoppingCart[index].quantity <= 0) {
        shoppingCart.splice(index, 1);
    }
    saveCart();
    displayCartItems();
}

function clearCart() {
    if (shoppingCart.length === 0) { 
        showNotification('⚠ السلة فارغة بالفعل'); 
        return; 
    }
    if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
        shoppingCart = [];
        saveCart();
        displayCartItems();
        showNotification('✓ تم تفريغ السلة');
    }
}

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const cartItemsCount = document.getElementById('cartItemsCount');
    
    if (!cartItemsContainer) return;
    
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-new">
                <i class="fas fa-shopping-cart"></i>
                <h3>السلة فارغة</h3>
                <p>لم تضف أي منتجات بعد</p>
            </div>
        `;
        if (cartTotalElement) cartTotalElement.textContent = '0 د.ع';
        if (cartItemsCount) cartItemsCount.textContent = '0';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let totalQuantity = 0;
    
    const fragment = document.createDocumentFragment();
    
    shoppingCart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        total += itemTotal;
        totalQuantity += item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-new';
        itemElement.innerHTML = `
            <div class="cart-item-info-new">
                <div class="cart-item-name-new">${escapeHtml(item.name)}</div>
                <div class="cart-item-price-new">${formatPrice(item.price)} د.ع × ${item.quantity}</div>
                <div class="cart-item-total-new">${formatPrice(itemTotal)} د.ع</div>
            </div>
            <div class="cart-item-controls-new">
                <button class="cart-item-remove-new" onclick="removeFromCart(${index})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="qty-btn-new" onclick="changeQuantity(${index}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="qty-display-new">${item.quantity}</span>
                <button class="qty-btn-new" onclick="changeQuantity(${index}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        fragment.appendChild(itemElement);
    });
    
    cartItemsContainer.appendChild(fragment);
    
    if (cartTotalElement) cartTotalElement.textContent = `${formatPrice(total)} د.ع`;
    if (cartItemsCount) cartItemsCount.textContent = totalQuantity;
}

function openCartModal() {
    const m = document.getElementById('cartModal');
    if (m) {
        m.style.display = 'flex';
        displayCartItems();
        loadSavedCustomerInfo();
    }
}

function closeCartModal() {
    const m = document.getElementById('cartModal');
    if (m) m.style.display = 'none';
}

function loadSavedCustomerInfo() {
    const phoneInput = document.getElementById('customerPhone');
    const areaSelect = document.getElementById('deliveryArea');
    
    if (!phoneInput || !areaSelect) return;
    
    try {
        const savedPhone = localStorage.getItem('taloola_saved_phone');
        const savedArea = localStorage.getItem('taloola_saved_area');
        
        if (savedPhone && !phoneInput.value) phoneInput.value = savedPhone;
        if (savedArea && !areaSelect.value) {
            const options = Array.from(areaSelect.options).map(o => o.value);
            if (options.includes(savedArea)) areaSelect.value = savedArea;
        }
    } catch (e) {}
}

// ============================================
// 🛍️ نافذة تفاصيل المنتج
// ============================================
let currentProduct = null;
let modalQuantity = 1;

function openProductModal(element) {
    if (!element) return;
    
    const name = element.getAttribute('data-name');
    const price = parseInt(element.getAttribute('data-price')) || 0;
    const image = element.getAttribute('data-image');
    const description = element.getAttribute('data-description') || 'منتج لذيذ من مطعم تعلولة';
    
    currentProduct = { name, price, image, description };
    modalQuantity = 1;
    
    document.getElementById('productModalName').textContent = name || '';
    document.getElementById('productModalPrice').textContent = formatPrice(price);
    document.getElementById('productModalDescription').textContent = description;
    
    const modalImg = document.getElementById('productModalImage');
    modalImg.classList.remove('loaded');
    
    // استخدام placeholder SVG إذا لم تكن الصورة موجودة
    let imgSrc = image && image.trim() !== '' ? image : 
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f5f5f5"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle" dy=".3em">🍽️</text></svg>';
    
    modalImg.src = imgSrc;
    modalImg.alt = name || '';
    modalImg.onload = () => modalImg.classList.add('loaded');
    modalImg.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f5f5f5"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle" dy=".3em">🍽️</text></svg>';
        this.classList.add('loaded');
    };
    
    document.getElementById('modalQtyDisplay').textContent = modalQuantity;
    updateModalTotal();
    
    const modal = document.getElementById('productModal');
    modal.style.display = 'flex';
    
    if (navigator.vibrate) navigator.vibrate(10);
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
    currentProduct = null;
    modalQuantity = 1;
}

function updateModalTotal() {
    if (!currentProduct) return;
    const total = (currentProduct.price || 0) * modalQuantity;
    document.getElementById('modalTotalPrice').textContent = `${formatPrice(total)} د.ع`;
}

function changeModalQuantity(change) {
    modalQuantity += change;
    if (modalQuantity < 1) modalQuantity = 1;
    if (modalQuantity > 99) {
        modalQuantity = 99;
        showNotification('الحد الأقصى 99');
    }
    document.getElementById('modalQtyDisplay').textContent = modalQuantity;
    updateModalTotal();
    
    const display = document.getElementById('modalQtyDisplay');
    display.style.transform = 'scale(1.3)';
    setTimeout(() => { display.style.transform = 'scale(1)'; }, 200);
    
    if (navigator.vibrate) navigator.vibrate(5);
}

function addCurrentProductToCart() {
    if (!currentProduct) return;
    
    addToCart(currentProduct.name, currentProduct.price, modalQuantity);
    
    const btn = document.getElementById('modalAddToCartBtn');
    btn.classList.add('added');
    btn.innerHTML = '<i class="fas fa-check"></i> <span>تمت الإضافة!</span>';
    
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    
    setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fas fa-cart-plus"></i> <span>إضافة للسلة</span>';
        closeProductModal();
    }, 800);
}

// ============================================
// 📋 نافذة مراجعة الطلب
// ============================================
function showOrderReview() {
    if (shoppingCart.length === 0) { 
        showNotification('⚠ السلة فارغة!'); 
        return; 
    }
    closeCartModal();
    const reviewModal = document.getElementById('orderReviewModal');
    if (reviewModal) { 
        reviewModal.style.display = 'flex'; 
        displayOrderReview(); 
    }
}

function displayOrderReview() {
    const reviewItemsContainer = document.getElementById('orderReviewItems');
    const reviewItemCount = document.getElementById('reviewItemCount');
    const reviewTotalQuantity = document.getElementById('reviewTotalQuantity');
    const reviewTotalAmount = document.getElementById('reviewTotalAmount');
    const locationInput = document.getElementById('locationDescription');
    if (!reviewItemsContainer) return;

    const btn = document.getElementById('useSavedAddressBtn');
    const preview = document.getElementById('savedAddressPreview');
    if (btn && preview && savedAddressText) {
        btn.style.display = 'flex';
        preview.textContent = savedAddressText.substring(0, 50) + (savedAddressText.length > 50 ? '...' : '');
        btn.onclick = function() {
            if (locationInput) locationInput.value = savedAddressText;
        };
    }

    const currentOrderAddress = sessionStorage.getItem('current_order_address');
    if (locationInput && currentOrderAddress) {
        locationInput.value = currentOrderAddress;
    }

    reviewItemsContainer.innerHTML = '';
    let totalQuantity = 0, totalAmount = 0;
    
    const fragment = document.createDocumentFragment();
    
    shoppingCart.forEach((item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        totalQuantity += item.quantity;
        totalAmount += itemTotal;
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-item-info">
                <div class="review-item-name">${escapeHtml(item.name)}</div>
                <div class="review-item-details">
                    <span><i class="fas fa-box"></i> الكمية: ${item.quantity}</span>
                    <span><i class="fas fa-tag"></i> السعر: ${formatPrice(item.price)} د.ع</span>
                </div>
            </div>
            <div class="review-item-total">${formatPrice(itemTotal)} د.ع</div>
        `;
        fragment.appendChild(reviewItem);
    });
    
    reviewItemsContainer.appendChild(fragment);
    
    if (reviewItemCount) reviewItemCount.textContent = `${shoppingCart.length} منتج`;
    if (reviewTotalQuantity) reviewTotalQuantity.textContent = `${totalQuantity} قطعة`;
    if (reviewTotalAmount) reviewTotalAmount.textContent = `${formatPrice(totalAmount)} د.ع`;
}

function closeOrderReview() {
    const m = document.getElementById('orderReviewModal');
    if (m) m.style.display = 'none';
}

// ============================================
// 📱 إرسال الطلب عبر واتساب - محسّن
// ============================================
function confirmAndSendOrder() {
    if (shoppingCart.length === 0) {
        showNotification('⚠ السلة فارغة!');
        return;
    }
    
    const phoneInput = document.getElementById('customerPhone');
    const areaSelect = document.getElementById('deliveryArea');
    const detailedInput = document.getElementById('detailedAddress');
    
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const area = areaSelect ? areaSelect.value.trim() : '';
    const detailed = detailedInput ? detailedInput.value.trim() : '';
    
    [phoneInput, areaSelect].forEach(el => {
        if (el) el.classList.remove('error');
    });
    
    let hasError = false;
    
    if (!phone) {
        if (phoneInput) {
            phoneInput.classList.add('error');
            phoneInput.focus();
        }
        showNotification('⚠ الرجاء إدخال رقم الهاتف');
        hasError = true;
    } else if (!/^07[0-9]{9}$/.test(phone)) {
        if (phoneInput) phoneInput.classList.add('error');
        showNotification('⚠ رقم الهاتف غير صحيح (يجب أن يبدأ بـ 07)');
        hasError = true;
    }
    
    if (!area) {
        if (areaSelect) {
            areaSelect.classList.add('error');
            if (!hasError && phoneInput) areaSelect.focus();
        }
        showNotification('⚠ الرجاء اختيار منطقة التوصيل');
        hasError = true;
    }
    
    if (hasError) return;
    
    try {
        localStorage.setItem('taloola_saved_phone', phone);
        localStorage.setItem('taloola_saved_area', area);
    } catch (e) {}
    
    const phoneNumber = '9647755666073';
    let message = `*🍽️ طلب جديد من مطعم تعلولة*\n\n`;
    
    message += `📞 *رقم الهاتف:* ${phone}\n`;
    message += `📍 *منطقة التوصيل:* ${area}\n`;
    if (detailed) message += `🏠 *العنوان التفصيلي:* ${detailed}\n`;
    
    message += `\n═══════════════════\n`;
    message += `*📋 الطلب:*\n`;
    
    let totalAmount = 0;
    shoppingCart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        totalAmount += itemTotal;
        
        message += `\n*${index + 1}. ${item.name}*`;
        message += `\n   الكمية: ${item.quantity}`;
        message += `\n   السعر: ${formatPrice(item.price)} د.ع`;
        message += `\n   المجموع: ${formatPrice(itemTotal)} د.ع\n`;
    });
    
    message += `\n═══════════════════\n`;
    message += `💰 *الإجمالي النهائي: ${formatPrice(totalAmount)} د.ع*\n`;
    
    const gpsLocation = userLocation || getLocationFromStorage();
    if (gpsLocation) {
        const mapUrl = gpsLocation.googleMapsUrl || 
            `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`;
        message += `\n📍 *الموقع على الخريطة:*\n${mapUrl}`;
    }
    
    // حفظ عنوان الطلب الحالي
    if (detailed) {
        try { sessionStorage.setItem('current_order_address', detailed); } catch(e) {}
    }
    
    // فتح واتساب
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    try {
        window.open(whatsappUrl, '_blank');
    } catch (e) {
        console.error('فشل فتح واتساب:', e);
        showNotification('⚠ فشل فتح واتساب');
        return;
    }
    
    closeCartModal();
    closeOrderReview();
    showNotification('✅ تم إرسال طلبك بنجاح!');
    
    // تفريغ السلة بعد إرسال ناجح
    setTimeout(() => {
        shoppingCart = [];
        saveCart();
        if (phoneInput) phoneInput.value = '';
        if (areaSelect) areaSelect.value = '';
        if (detailedInput) detailedInput.value = '';
        try { sessionStorage.removeItem('current_order_address'); } catch(e) {}
    }, 1000);
}

// ============================================
// 🔔 دوال عامة
// ============================================
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
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function openSupport() {
    window.open(`https://wa.me/9647755666073?text=${encodeURIComponent('أحتاج إلى مساعدة')}`, '_blank');
}

// ============================================
// 📢 جلب الإعلانات من Firebase
// ============================================
function displayAds() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    
    adsContainer.innerHTML = '<p class="loading-text" style="color: #fff; text-align: center; grid-column: 1/-1;">جاري تحميل العروض...</p>';
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.database) {
                listenToAds();
            } else {
                adsContainer.innerHTML = '<p class="no-ads">تعذر تحميل العروض حالياً</p>';
            }
        }, 1000);
        return;
    }
    
    listenToAds();
    
    function listenToAds() {
        firebase.database().ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
            adsContainer.innerHTML = '';
            const ads = snapshot.val();
            
            if (!ads) {
                adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
                return;
            }
            
            const sortedKeys = Object.keys(ads).reverse();
            const fragment = document.createDocumentFragment();
            
            sortedKeys.forEach(key => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = `ad-card ${ad.template || 'red'}`;
                
                let imgUrl = ad.imageUrl && ad.imageUrl.trim() !== '' ? ad.imageUrl : '';
                
                adElement.innerHTML = `
                    ${imgUrl ? `<div class="ad-image"><img data-src="${escapeHtml(imgUrl)}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" alt="${escapeHtml(ad.title || '')}" class="lazy-image" decoding="async" loading="lazy"></div>` : ''}
                    <h4>${escapeHtml(ad.title || '')}</h4>
                    <p>${escapeHtml(ad.description || '')}</p>
                    ${ad.price ? `<p class="ad-price">السعر: ${formatPrice(ad.price)} د.ع</p>` : ''}
                `;
                fragment.appendChild(adElement);
            });
            
            adsContainer.appendChild(fragment);
            
            if (smartImageLoader) {
                smartImageLoader.observeAllImages();
            }
        }, (error) => {
            console.error('خطأ في جلب الإعلانات:', error);
            adsContainer.innerHTML = '<p class="no-ads">تعذر تحميل العروض حالياً</p>';
        });
    }
}

// ============================================
// 🚀 التهيئة عند تحميل الصفحة - محسّنة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // تحسين أداء اللمس
    document.addEventListener('touchstart', function(){}, {passive: true});

    // تفويض أحداث النقر على عناصر المنيو (مرة واحدة)
    setupMenuClickDelegation();

    // شريط علوي ثابت
    const topStickyBar = document.getElementById('topStickyBar');
    const mainHeader = document.getElementById('mainHeader');
    
    function getHeaderOffset() {
        return mainHeader ? mainHeader.offsetHeight - 50 : 200;
    }

    let scrollTimeout;
    function handleScroll() {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
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
            
            // زر الصعود
            const scrollToTopBtn = document.getElementById('scrollToTopBtn');
            if (scrollToTopBtn) {
                if (window.pageYOffset > 300) {
                    scrollToTopBtn.classList.add('visible');
                } else {
                    scrollToTopBtn.classList.remove('visible');
                }
            }
        }, 10);
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // أزرار الواجهة
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }
    
    const getLocationBtn = document.getElementById('getLocationBtn');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await requestLocationAndUpdate();
        });
    }
    
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // إغلاق المودالات بالنقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('cartModal')) closeCartModal();
        if (event.target === document.getElementById('orderReviewModal')) closeOrderReview();
        if (event.target === document.getElementById('locationModal')) closeLocationModal();
        if (event.target === document.getElementById('productModal')) closeProductModal();
    });

    // تهيئة الواجهة
    updateCartUI();
    initLocationIcon();
    initializeLocationSystem();

    // تحميل سكربتات Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
        authDomain: "talola-food.firebaseapp.com",
        databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
        projectId: "talola-food",
        messagingSenderId: "440585170470",
        appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
    };
    
    const firebaseAppScript = document.createElement('script');
    firebaseAppScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(firebaseAppScript);
    
    const firebaseDbScript = document.createElement('script');
    firebaseDbScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    document.head.appendChild(firebaseDbScript);

    firebaseDbScript.onload = function() {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.initializeApp(firebaseConfig);
                    firebaseInitialized = true;
                    console.log('✅ تم تهيئة Firebase بنجاح');
                    displayAds();
                    loadMenuFromFirebase();
                } catch (error) {
                    console.error('خطأ في تهيئة Firebase:', error);
                }
            }
        }, 500);
    };
});

// ============================================
// 📤 تصدير الدوال العامة
// ============================================
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
