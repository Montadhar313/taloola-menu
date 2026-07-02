// ============================================
// 🍽️ تحميل المنيو الديناميكي - النسخة المُصلَّحة
// ============================================

// 🆕 متغيرات عامة لتخزين البيانات
let cachedCategories = [];
let cachedMenuItems = null;
let isMenuInitialized = false;

// ============================================
// 🛡️ دوال مساعدة آمنة
// ============================================
function safeLocalStorageGet(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.warn(`⚠️ لا يمكن الوصول إلى localStorage: ${key}`);
        return defaultValue;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn(`⚠️ لا يمكن الكتابة إلى localStorage: ${key}`);
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

// Placeholder للصور الفاشلة
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+TuyDZhNmI2YXYryDYqtmC2LPYqSDYp9mE2YXYutmI2LHYqTwvdGV4dD48L3N2Zz4=';

// ============================================
// 📥 تحميل المنيو من Firebase
// ============================================
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
                if (smartImageLoader) smartImageLoader.observeAllImages();
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
                if (smartImageLoader) smartImageLoader.observeAllImages();
            }
        },
        (error) => {
            console.error('❌ خطأ في تحميل الأصناف:', error);
        }
    );
}

// ============================================
// 🏗️ بناء أقسام المنيو
// ============================================
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

// ============================================
// 🎯 توزيع الأصناف على الأقسام (محسّن للصور)
// ============================================
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
        const hasValidImage = rawImage && 
            (rawImage.startsWith('http://') || 
             rawImage.startsWith('https://') || 
             rawImage.startsWith('data:image/') ||
             rawImage.startsWith('/'));
        
        const menuElement = document.createElement('div');
        menuElement.className = 'menu-item';
        menuElement.setAttribute('data-name', item.name || '');
        menuElement.setAttribute('data-price', String(item.price || 0));
        menuElement.setAttribute('data-image', hasValidImage ? rawImage : '');
        menuElement.setAttribute('data-description', item.description || 'منتج لذيذ من مطعم تعلولة');
        
        if (hasValidImage) {
            menuElement.innerHTML = `
                <div class="item-image">
                    <div class="image-skeleton"></div>
                    <img data-src="${rawImage}" 
                         src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f5f5f5'/%3E%3C/svg%3E" 
                         alt="${item.name || 'منتج'}" 
                         class="lazy-image" 
                         decoding="async" 
                         loading="lazy"
                         width="400" 
                         height="400"
                         onerror="handleImageError(this)">
                </div>
                <h4>${item.name || 'منتج'}</h4>
                <p class="price">${(item.price || 0).toLocaleString('ar-EG')} د.ع</p>
            `;
        } else {
            menuElement.innerHTML = `
                <div class="item-image">
                    <img src="${PLACEHOLDER_IMAGE}" 
                         alt="${item.name || 'منتج'}" 
                         class="loaded placeholder"
                         decoding="async"
                         width="400" 
                         height="400">
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

// ✅ معالج عام لأخطاء الصور
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

// ============================================
// 🚀 نظام تحميل الصور الذكي (مُحسَّن)
// ============================================
class SmartSequentialImageLoader {
    constructor() {
        this.queue = [];
        this.currentlyLoading = new Set();
        this.cache = new Map();
        this.waitingElements = new Map();
        this.visibilityObserver = null;
        this.preloadObserver = null;
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
        this.observeAllImages();
        this.monitorConnectionChanges();
    }
    
    setupObservers() {
        this.visibilityObserver = new IntersectionObserver(
            (entries) => {
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
                        if (document.body.contains(entry.target)) {
                            this.preloadSectionImages(entry.target);
                        }
                        this.preloadObserver.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '500px 0px',
                threshold: 0
            }
        );
    }
    
    calculatePriority(img) {
        const rect = img.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
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
        const lazyImages = document.querySelectorAll('img.lazy-image:not(.loaded):not(.loading)');
        
        lazyImages.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            if (!dataSrc || dataSrc.trim() === '') {
                img.classList.remove('lazy-image');
                img.src = PLACEHOLDER_IMAGE;
                img.classList.add('loaded', 'placeholder');
                return;
            }
            
            if (this.visibilityObserver) {
                this.visibilityObserver.observe(img);
            }
            
            const section = img.closest('.menu-section');
            if (section && this.preloadObserver) {
                this.preloadObserver.observe(section);
            }
        });
        
        console.log(`🖼️ مراقبة ${lazyImages.length} صورة للتحميل الذكي`);
    }
    
    enqueue(img, priority = 50) {
        if (!document.body.contains(img)) return;
        
        const src = img.getAttribute('data-src');
        if (!src || src.trim() === '') {
            this.applyFallback(img);
            return;
        }
        
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
        img.classList.add('loading');
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
        
        img.onload = () => {
            this.handleImageLoad(src, img);
        };
        
        img.onerror = () => {
            this.handleImageError(src);
        };
        
        img.src = src;
    }
    
    handleImageLoad(src, img) {
        this.currentlyLoading.delete(src);
        this.cache.set(src, src);
        this.retryCount.delete(src);
        
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => {
            if (document.body.contains(element)) {
                this.applyImage(element, src);
            }
        });
        
        this.waitingElements.delete(src);
        this.saveToSessionCache(src);
        this.processQueue();
        
        console.log(`✅ تم تحميل: ${src.split('/').pop().substring(0, 50)}`);
    }
    
    handleImageError(src) {
        console.warn(`❌ فشل تحميل: ${src}`);
        this.currentlyLoading.delete(src);
        
        const retries = this.retryCount.get(src) || 0;
        if (retries < this.maxRetries) {
            this.retryCount.set(src, retries + 1);
            console.log(`🔄 إعادة المحاولة ${retries + 1}/${this.maxRetries} لـ ${src.split('/').pop()}`);
            setTimeout(() => {
                if (!this.cache.has(src)) {
                    this.loadImage(src);
                }
            }, 1000 * (retries + 1));
            return;
        }
        
        this.retryCount.delete(src);
        
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => {
            if (document.body.contains(element)) {
                this.applyFallback(element);
            }
        });
        this.waitingElements.delete(src);
        this.processQueue();
    }
    
    applyFallback(img) {
        img.src = PLACEHOLDER_IMAGE;
        img.classList.remove('loading', 'lazy-image');
        img.classList.add('loaded', 'error-img');
        const skeleton = img.parentElement?.querySelector('.image-skeleton');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 400);
        }
    }
    
    applyImage(img, src) {
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
        const images = section.querySelectorAll('img.lazy-image[data-src]');
        
        images.forEach((img, index) => {
            if (!document.body.contains(img)) return;
            const src = img.getAttribute('data-src');
            if (src && src.trim() !== '' && !this.cache.has(src) && !this.currentlyLoading.has(src)) {
                this.queue.push({ src, priority: 20 + index });
                
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
            
            if (cached.length > 0) {
                console.log(`⚡ تم استرجاع ${Math.min(cached.length, 15)} صورة من الكاش`);
            }
        } catch (e) {}
    }
    
    monitorConnectionChanges() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
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

let smartImageLoader = null;

function initSmartImageLoading() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            smartImageLoader = new SmartSequentialImageLoader();
        });
    } else {
        smartImageLoader = new SmartSequentialImageLoader();
    }
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
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
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
// 🛒 نظام السلة العائمة (مُحسَّن)
// ============================================
let shoppingCart = [];
try {
    shoppingCart = safeJsonParse(safeLocalStorageGet('taloola_cart') || '[]', []);
    if (!Array.isArray(shoppingCart)) shoppingCart = [];
} catch (e) {
    shoppingCart = [];
}

function saveCart() {
    try {
        safeLocalStorageSet('taloola_cart', JSON.stringify(shoppingCart));
    } catch (e) {
        console.warn('⚠️ فشل حفظ السلة');
    }
    updateCartUI();
}

function updateCartUI() {
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const floatingCartCount = document.getElementById('floatingCartCount');
    const totalItems = shoppingCart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    
    if (floatingCartBtn && floatingCartCount) {
        floatingCartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            if (!floatingCartBtn.classList.contains('has-items')) {
                floatingCartBtn.classList.add('has-items');
            }
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
        
        setTimeout(() => {
            floatingCartBtn.classList.remove('item-added');
        }, 600);
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
    const existingItem = shoppingCart.find(item => item.name === trimmedName);
    if (existingItem) {
        existingItem.quantity += numQty;
    } else {
        shoppingCart.push({ name: trimmedName, price: numPrice, quantity: numQty });
    }
    saveCart();
    showNotification(`✓ تم إضافة ${numQty} × ${trimmedName}`);
    
    showCartAddEffect();
    
    if (navigator.vibrate) {
        navigator.vibrate([10, 30, 10]);
    }
    return true;
}

function removeFromCart(index) {
    if (index < 0 || index >= shoppingCart.length) return;
    shoppingCart.splice(index, 1);
    saveCart();
    displayCartItems();
}

function changeQuantity(index, change) {
    if (index < 0 || index >= shoppingCart.length) return;
    const newQty = (shoppingCart[index].quantity || 0) + change;
    if (newQty <= 0) {
        shoppingCart.splice(index, 1);
    } else {
        shoppingCart[index].quantity = newQty;
    }
    saveCart();
    displayCartItems();
}

function clearCart() {
    if (shoppingCart.length === 0) { 
        showNotification('السلة فارغة بالفعل');
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
    
    shoppingCart.forEach((item, index) => {
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
                <button class="cart-item-remove-new" onclick="removeFromCart(${index})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="qty-btn-new" onclick="changeQuantity(${index}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="qty-display-new">${itemQty}</span>
                <button class="qty-btn-new" onclick="changeQuantity(${index}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    if (cartTotalElement) cartTotalElement.textContent = `${total.toLocaleString('ar-EG')} د.ع`;
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
        const savedPhone = safeLocalStorageGet('taloola_saved_phone');
        const savedArea = safeLocalStorageGet('taloola_saved_area');
        
        if (savedPhone && !phoneInput.value) phoneInput.value = savedPhone;
        if (savedArea && !areaSelect.value) {
            const options = Array.from(areaSelect.options).map(o => o.value);
            if (options.includes(savedArea)) areaSelect.value = savedArea;
        }
    } catch (e) {}
}

// ============================================
// 🛍️ نافذة تفاصيل المنتج (🔥 مُصلَّح)
// ============================================
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
    
    if (!name || name.trim() === '') {
        showNotification('⚠ بيانات المنتج غير صالحة');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        showNotification('⚠ سعر المنتج غير صالح');
        return;
    }
    
    currentProduct = { 
        name: name.trim(), 
        price, 
        image: image || PLACEHOLDER_IMAGE, 
        description 
    };
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
        modalImg.onerror = () => {
            modalImg.src = PLACEHOLDER_IMAGE;
            modalImg.classList.add('loaded');
        };
        modalImg.src = currentProduct.image;
        modalImg.alt = currentProduct.name;
    }
    
    const qtyDisplay = document.getElementById('modalQtyDisplay');
    if (qtyDisplay) qtyDisplay.textContent = modalQuantity;
    updateModalTotal();
    
    // 🔥 إعادة تعيين زر الإضافة
    const addBtn = document.getElementById('modalAddToCartBtn');
    if (addBtn) {
        addBtn.classList.remove('added');
        addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> <span>إضافة للسلة</span>';
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
    if (modalQuantity > 99) {
        modalQuantity = 99;
        showNotification('الحد الأقصى 99');
    }
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
    if (!currentProduct) {
        showNotification('⚠ لا يوجد منتج محدد');
        return;
    }
    
    const success = addToCart(currentProduct.name, currentProduct.price, modalQuantity);
    if (!success) return;
    
    const btn = document.getElementById('modalAddToCartBtn');
    if (btn) {
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> <span>تمت الإضافة!</span>';
        
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
        
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = '<i class="fas fa-cart-plus"></i> <span>إضافة للسلة</span>';
            closeProductModal();
        }, 800);
    } else {
        closeProductModal();
    }
}

// ============================================
// 📋 نافذة مراجعة الطلب
// ============================================
function showOrderReview() {
    if (!shoppingCart || shoppingCart.length === 0) { 
        showNotification('السلة فارغة!');
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
    shoppingCart.forEach((item) => {
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
    
    if (reviewItemCount) reviewItemCount.textContent = `${shoppingCart.length} منتج`;
    if (reviewTotalQuantity) reviewTotalQuantity.textContent = `${totalQuantity} قطعة`;
    if (reviewTotalAmount) reviewTotalAmount.textContent = `${totalAmount.toLocaleString('ar-EG')} د.ع`;
}

function closeOrderReview() {
    const m = document.getElementById('orderReviewModal');
    if (m) m.style.display = 'none';
}

// ============================================
// 📱 إرسال الطلب عبر واتساب + حفظ في Firebase
// ============================================
async function confirmAndSendOrder() {
    // 🆕 التحقق من السلة
    if (!shoppingCart || shoppingCart.length === 0) {
        showNotification('السلة فارغة!');
        return;
    }
    
    // 🆕 التحقق من Firebase
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.error('❌ Firebase غير متاح');
        showNotification('⚠ لا يمكن حفظ الطلب حالياً، يرجى إعادة تحميل الصفحة');
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
    
    // 🆕 حفظ بيانات الزبون
    try {
        safeLocalStorageSet('taloola_saved_phone', phone);
        safeLocalStorageSet('taloola_saved_area', area);
    } catch (e) {
        console.warn('⚠️ فشل حفظ بيانات الزبون:', e);
    }
    
    // 🆕 حساب الإجمالي
    let totalAmount = 0;
    shoppingCart.forEach((item) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 0;
        totalAmount += (itemPrice * itemQty);
    });
    
    const gpsLocation = userLocation || getLocationFromStorage();
    
    // 🆕 إظهار شاشة التحميل
    showNotification('⏳ جاري حفظ طلبك...');
    
    try {
        console.log('🔍 بدء حفظ الطلب في Firebase...');
        
        // 🆕 الحصول على رقم الطلب التالي
        let orderNumber = 0;
        const counterRef = firebase.database().ref('orders/counter');
        const ordersRef = firebase.database().ref('orders/list');
        
        // 🆕 محاولة الحصول على رقم الطلب
        try {
            const counterSnapshot = await counterRef.transaction((currentValue) => {
                return (currentValue || 0) + 1;
            });
            
            if (counterSnapshot && counterSnapshot.val() !== null) {
                orderNumber = counterSnapshot.val();
                console.log(`✅ رقم الطلب: ${orderNumber}`);
            } else {
                throw new Error('فشل الحصول على رقم الطلب');
            }
        } catch (transactionError) {
            console.warn('⚠️ فشل transaction، استخدام الطريقة البديلة:', transactionError.message);
            
            // الطريقة البديلة: قراءة آخر طلب
            try {
                const lastOrderSnapshot = await ordersRef
                    .orderByChild('timestamp')
                    .limitToLast(1)
                    .once('value');
                
                const lastOrder = lastOrderSnapshot.val();
                if (lastOrder) {
                    const lastKey = Object.keys(lastOrder)[0];
                    const lastNum = lastOrder[lastKey].orderNumber || 0;
                    orderNumber = lastNum + 1;
                } else {
                    orderNumber = 1;
                }
                
                console.log(`✅ رقم الطلب (بديل): ${orderNumber}`);
                
                // محاولة تحديث العداد
                try {
                    await counterRef.set(orderNumber);
                } catch (e) {
                    console.warn('⚠️ لا يمكن تحديث العداد:', e.message);
                }
            } catch (fallbackError) {
                console.error('❌ فشل الحصول على رقم الطلب:', fallbackError);
                orderNumber = Math.floor(Date.now() / 1000) % 100000;
            }
        }
        
        // 🆕 بناء بيانات الطلب
        const orderData = {
            orderNumber: orderNumber,
            customerName: 'زبون',
            phone: phone,
            area: area,
            detailedAddress: detailed || '',
            items: shoppingCart.map(item => ({
                name: item.name,
                price: parseInt(item.price) || 0,
                quantity: parseInt(item.quantity) || 0,
                total: (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0)
            })),
            total: totalAmount,
            status: 'pending',
            timestamp: Date.now(),
            date: new Date().toLocaleString('ar-EG'),
            time: new Date().toLocaleTimeString('ar-EG', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            location: gpsLocation ? {
                latitude: gpsLocation.latitude,
                longitude: gpsLocation.longitude,
                googleMapsUrl: gpsLocation.googleMapsUrl || 
                    `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`
            } : null,
            notificationSent: false
        };
        
        console.log('📦 بيانات الطلب:', orderData);
        
        // 🆕 حفظ الطلب في Firebase
        const newOrderRef = await ordersRef.push(orderData);
        
        console.log('✅ تم حفظ الطلب في Firebase - Key:', newOrderRef.key);
        console.log('🔗 رابط الطلب:', `orders/list/${newOrderRef.key}`);
        
        // 🆕 بناء رسالة الواتساب
        const phoneNumber = '9647755666073';
        let message = `🛎️ طلب جديد #${orderNumber}\n`;
        message += `━━━━━━━━━━━━━━━\n\n`;
        message += `📞 رقم الهاتف: ${phone}\n`;
        message += `📍 منطقة التوصيل: ${area}\n`;
        if (detailed) message += `🏠 العنوان التفصيلي: ${detailed}\n`;
        
        message += `\n━━━━━━━━━━━━━━━\n`;
        message += `🛒 تفاصيل الطلب:\n\n`;
        
        shoppingCart.forEach((item, index) => {
            const itemPrice = parseInt(item.price) || 0;
            const itemQty = parseInt(item.quantity) || 0;
            const itemTotal = itemPrice * itemQty;
            
            message += `${index + 1}. ${item.name}\n`;
            message += `   الكمية: ${itemQty} | السعر: ${itemPrice.toLocaleString('ar-EG')} د.ع\n`;
            message += `   الإجمالي: ${itemTotal.toLocaleString('ar-EG')} د.ع\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━\n`;
        message += `💰 المجموع النهائي: ${totalAmount.toLocaleString('ar-EG')} د.ع\n`;
        
        if (gpsLocation) {
            const mapUrl = gpsLocation.googleMapsUrl || 
                `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`;
            message += `\n📍 الموقع على الخريطة:\n${mapUrl}\n`;
        }
        
        message += `\n━━━━━━━━━━━━━━━\n`;
        message += `⏰ وقت الطلب: ${new Date().toLocaleTimeString('ar-EG')}\n`;
        message += `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`;
        
        // 🆕 فتح واتساب
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // 🆕 رسالة نجاح
        showNotification(`✅ تم إرسال طلبك بنجاح! رقم الطلب: #${orderNumber}`);
        
        // 🆕 تفريغ السلة والنموذج
        setTimeout(() => {
            shoppingCart = [];
            saveCart();
            if (phoneInput) phoneInput.value = '';
            if (areaSelect) areaSelect.value = '';
            if (detailedInput) detailedInput.value = '';
            closeCartModal();
        }, 500);
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الطلب:', error);
        console.error('📋 تفاصيل الخطأ:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        let errorMessage = '⚠ فشل حفظ الطلب';
        
        if (error.code === 'PERMISSION_DENIED') {
            errorMessage = '⚠ خطأ في الصلاحيات - تحقق من قواعد Firebase';
        } else if (error.code === 'NETWORK_ERROR') {
            errorMessage = '⚠ خطأ في الاتصال بالإنترنت';
        } else if (error.message) {
            errorMessage = `⚠ ${error.message}`;
        }
        
        showNotification(errorMessage);
    }
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
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 500);
    }, 3000);
}

function openSupport() {
    try {
        window.open(`https://wa.me/9647755666073?text=${encodeURIComponent('أحتاج إلى مساعدة')}`, '_blank');
    } catch (e) {
        showNotification('⚠ فشل فتح واتساب');
    }
}

// ============================================
// 📢 جلب الإعلانات من Firebase - النسخة المتقدمة (فيديو + صور)
// ============================================

// 🆕 دالة استخراج معرف فيديو يوتيوب
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
            if (typeof firebase !== 'undefined' && firebase.database) {
                listenToAds();
            } else {
                adsContainer.innerHTML = '<div class="no-ads">تعذر تحميل العروض حالياً</div>';
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
                adsContainer.innerHTML = '<div class="no-ads">لا توجد عروض خاصة حالياً</div>';
                return;
            }
            
            const sortedKeys = Object.keys(ads).reverse();
            
            sortedKeys.forEach(key => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = `ad-card ${ad.template || 'red'}`;
                
                // 🆕 تحديد نوع المحتوى
                const mediaType = ad.mediaType || 'image';
                let mediaHtml = '';
                
                if (mediaType === 'youtube' && (ad.youtubeUrl || ad.youtubeId)) {
                    const videoId = ad.youtubeId || extractYouTubeId(ad.youtubeUrl);
                    if (videoId) {
                        mediaHtml = `
                            <div class="ad-video-wrapper youtube">
                                <div class="video-responsive">
                                    <iframe 
                                        src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                        allowfullscreen
                                        loading="lazy"
                                        title="${ad.title || 'فيديو'}">
                                    </iframe>
                                </div>
                                <div class="media-type-badge youtube">
                                    <i class="fab fa-youtube"></i>
                                </div>
                            </div>
                        `;
                    }
                } else if (mediaType === 'video' && ad.videoUrl) {
                    mediaHtml = `
                        <div class="ad-video-wrapper direct">
                            <video 
                                controls 
                                preload="metadata" 
                                playsinline
                                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23000'/%3E%3C/svg%3E"
                                style="width: 100%; border-radius: 10px;">
                                <source src="${ad.videoUrl}" type="video/mp4">
                                المتصفح لا يدعم تشغيل الفيديو
                            </video>
                            <div class="media-type-badge video">
                                <i class="fas fa-video"></i>
                            </div>
                        </div>
                    `;
                } else if (mediaType === 'image' && ad.imageUrl) {
                    const imageUrl = (ad.imageUrl || '').trim();
                    const hasImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'));
                    
                    if (hasImage) {
                        mediaHtml = `
                            <div class="ad-image">
                                <img src="${imageUrl}" alt="${ad.title || ''}" loading="lazy" onerror="handleImageError(this)">
                                <div class="media-type-badge image">
                                    <i class="fas fa-image"></i>
                                </div>
                            </div>
                        `;
                    }
                }
                
                adElement.innerHTML = `
                    ${mediaHtml}
                    <div class="ad-card-content">
                        <h4>${ad.title || 'عرض'}</h4>
                        <p>${ad.description || ''}</p>
                        ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                    </div>
                `;
                adsContainer.appendChild(adElement);
            });
            
            console.log(`✅ تم تحميل ${sortedKeys.length} إعلان`);
            
        }, (error) => {
            console.error('خطأ في جلب الإعلانات:', error);
            adsContainer.innerHTML = '<div class="no-ads">تعذر تحميل العروض حالياً</div>';
        });
    }
}

// ============================================
// 🎯 Event Delegation للنقر على المنتجات
// ============================================
function setupProductClickDelegation() {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    
    if (mainElement._productClickHandler) {
        mainElement.removeEventListener('click', mainElement._productClickHandler);
    }
    
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
    
    console.log('✅ تم إعداد Event Delegation للمنتجات');
}

// ============================================
// 🔥 إعداد معالجات نافذة المنتج (الحل الأساسي للمشكلة)
// ============================================
function setupProductModalHandlers() {
    // 🔥 أزرار الكمية
    const decreaseBtn = document.getElementById('modalQtyDecrease');
    const increaseBtn = document.getElementById('modalQtyIncrease');
    const addToCartBtn = document.getElementById('modalAddToCartBtn');
    const closeBtn = document.querySelector('.close-product-modal');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔽 تقليل الكمية');
            changeModalQuantity(-1);
        });
    } else {
        console.error('❌ زر تقليل الكمية غير موجود');
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔼 زيادة الكمية');
            changeModalQuantity(1);
        });
    } else {
        console.error('❌ زر زيادة الكمية غير موجود');
    }
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🛒 إضافة للسلة');
            addCurrentProductToCart();
        });
    } else {
        console.error('❌ زر إضافة للسلة غير موجود');
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProductModal();
        });
    }
    
    console.log('✅ تم إعداد معالجات نافذة المنتج بنجاح');
}

// ============================================
// 🚀 التهيئة عند تحميل الصفحة
// ============================================
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
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await requestLocationAndUpdate();
        });
    }

    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }
    });
    
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
    initLocationIcon();
    initializeLocationSystem();
    
    // ✅ إعداد Event Delegation للمنتجات
    setupProductClickDelegation();
    
    // 🔥 إعداد معالجات نافذة المنتج (الحل الأساسي)
    setupProductModalHandlers();
    
    // ✅ تهيئة محمل الصور الذكي
    initSmartImageLoading();

    firebaseDbScript.onload = function() {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.initializeApp(firebaseConfig);
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
window.smartImageLoader = smartImageLoader;
window.handleImageError = handleImageError;
