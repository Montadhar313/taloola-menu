// ============================================
// 🚀 نظام تحميل الصور الذكي المتسلسل (الأحدث)
// ============================================

/**
 * SmartSequentialImageLoader
 * نظام ذكي يرتب الصور حسب الأولوية ويحملها بالتسلسل
 * مميزات:
 * - Priority Queue (طابور أولويات)
 * - Concurrency Limit (حد أقصى للتحميل المتوازي)
 * - Image Deduplication (عدم تكرار التحميل)
 * - Connection-Aware (التكيف مع سرعة الإنترنت)
 * - Multi-level Cache (كاش متعدد المستويات)
 */
class SmartSequentialImageLoader {
    constructor() {
        // طابور الصور حسب الأولوية
        this.queue = [];
        // الصور قيد التحميل حالياً
        this.currentlyLoading = new Set();
        // الكاش الذكي (src -> Image src)
        this.cache = new Map();
        // العناصر المنتظرة لكل صورة (deduplication)
        this.waitingElements = new Map();
        // Observers
        this.visibilityObserver = null;
        this.preloadObserver = null;
        // الإعدادات الذكية
        this.config = {
            maxConcurrent: this.detectOptimalConcurrency(),
            preloadDistance: 300,
            highPriorityDistance: 100,
            useIdleCallback: 'requestIdleCallback' in window
        };
        
        console.log(`⚡ Smart Loader جاهز - Concurrent: ${this.config.maxConcurrent}`);
        this.init();
    }
    
    /**
     * 🎯 كشف السرعة المثلى للتحميل المتوازي
     * يتكيف مع سرعة اتصال المستخدم
     */
    detectOptimalConcurrency() {
        const connection = navigator.connection || 
                          navigator.mozConnection || 
                          navigator.webkitConnection;
        
        if (connection) {
            const type = connection.effectiveType;
            const saveData = connection.saveData;
            
            // إذا كان المستخدم في وضع توفير البيانات
            if (saveData) return 1;
            
            switch(type) {
                case '4g': return 3;      // سريع: 3 صور متزامنة
                case '3g': return 2;      // متوسط: صورتان
                case '2g': 
                case 'slow-2g': return 1; // بطيء: صورة واحدة
                default: return 2;
            }
        }
        
        // افتراضي: حسب عدد أنوية المعالج (بحد أقصى 3)
        return Math.min(navigator.hardwareConcurrency || 2, 3);
    }
    
    /**
     * 🚀 تهيئة النظام
     */
    init() {
        // تحميل الصور المحفوظة مسبقاً من SessionStorage
        this.loadFromSessionCache();
        
        // إعداد Observers
        this.setupObservers();
        
        // بدء المراقبة
        this.observeAllImages();
        
        // مراقبة تغييرات الاتصال
        this.monitorConnectionChanges();
    }
    
    /**
     * 👁️ إعداد مراقبي الرؤية
     */
    setupObservers() {
        // مراقب الرؤية الأساسي (Priority-based)
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
        
        // مراقب التحميل المسبق للأقسام (500px قبل الوصول)
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
                rootMargin: '500px 0px',
                threshold: 0
            }
        );
    }
    
    /**
     * 🎯 حساب أولوية الصورة (الرقم الأقل = الأولوية الأعلى)
     */
    calculatePriority(img) {
        const rect = img.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // المسافة من مركز الشاشة
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(imgCenterX - centerX, 2) + 
            Math.pow(imgCenterY - centerY, 2)
        );
        
        // الصور المرئية حالياً: أولوية عالية جداً (1-10)
        if (rect.top < viewportHeight && rect.bottom > 0) {
            return 1 + (distance / 1000);
        }
        
        // الصور القريبة جداً: أولوية عالية (10-20)
        if (rect.top < viewportHeight + this.config.highPriorityDistance) {
            return 10 + (distance / 500);
        }
        
        // الصور البعيدة: أولوية منخفضة (100+)
        return 100 + (distance / 200);
    }
    
    /**
     * 🔍 مراقبة جميع الصور في الصفحة
     */
    observeAllImages() {
        const lazyImages = document.querySelectorAll('.lazy-image');
        
        lazyImages.forEach(img => {
            // إضافة للـ visibility observer
            if (this.visibilityObserver) {
                this.visibilityObserver.observe(img);
            }
            
            // إضافة القسم الأب للـ preload observer
            const section = img.closest('.menu-section');
            if (section && this.preloadObserver) {
                this.preloadObserver.observe(section);
            }
        });
        
        console.log(`🖼️ مراقبة ${lazyImages.length} صورة للتحميل الذكي`);
    }
    
    /**
     * 📥 إضافة صورة للطابور الذكي
     */
    enqueue(img, priority = 50) {
        const src = img.getAttribute('data-src');
        if (!src) return;
        
        // التحقق من الكاش أولاً (فوري!)
        if (this.cache.has(src)) {
            this.applyImage(img, src);
            return;
        }
        
        // تسجيل العنصر في قائمة الانتظار (deduplication)
        if (!this.waitingElements.has(src)) {
            this.waitingElements.set(src, []);
            // إضافة للطابور فقط مرة واحدة
            this.queue.push({ src, priority });
            // إعادة ترتيب الطابور حسب الأولوية
            this.sortQueue();
        }
        
        this.waitingElements.get(src).push(img);
        
        // إضافة تأثير التحميل
        img.classList.add('loading');
        
        // بدء المعالجة
        this.processQueue();
    }
    
    /**
     * 🔄 ترتيب الطابور حسب الأولوية (الأقل = الأعلى أولوية)
     */
    sortQueue() {
        this.queue.sort((a, b) => a.priority - b.priority);
    }
    
    /**
     * ⚙️ معالجة الطابور (التحميل المتسلسل الذكي)
     */
    processQueue() {
        // تحميل حتى الوصول للحد الأقصى المتوازي
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
    
    /**
     * 🖼️ تحميل صورة واحدة
     */
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
        
        // بدء التحميل
        img.src = src;
    }
    
    /**
     * ✅ معالجة نجاح التحميل
     */
    handleImageLoad(src, img) {
        // إزالة من قائمة التحميل
        this.currentlyLoading.delete(src);
        
        // حفظ في الكاش الذكي
        this.cache.set(src, src);
        
        // تطبيق على جميع العناصر المنتظرة (deduplication)
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => {
            this.applyImage(element, src);
        });
        
        // تنظيف قائمة الانتظار
        this.waitingElements.delete(src);
        
        // حفظ في SessionStorage
        this.saveToSessionCache(src);
        
        // معالجة الصورة التالية في الطابور
        this.processQueue();
        
        console.log(`✅ تم تحميل: ${src.split('/').pop()}`);
    }
    
    /**
     * ❌ معالجة فشل التحميل
     */
    handleImageError(src) {
        console.warn(`❌ فشل تحميل: ${src}`);
        this.currentlyLoading.delete(src);
        
        // إزالة العناصر المنتظرة
        const waitingElements = this.waitingElements.get(src) || [];
        waitingElements.forEach(element => {
            element.classList.remove('loading');
            element.classList.add('error');
        });
        this.waitingElements.delete(src);
        
        // متابعة المعالجة
        this.processQueue();
    }
    
    /**
     * 🎨 تطبيق الصورة على عنصر DOM
     */
    applyImage(img, src) {
        img.src = src;
        img.classList.remove('loading');
        img.classList.add('loaded');
        
        // إخفاء الـ skeleton بتأثير سلس
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
    
    /**
     * 🚀 تحميل مسبق لجميع صور القسم
     */
    preloadSectionImages(section) {
        const images = section.querySelectorAll('.lazy-image[data-src]');
        
        images.forEach((img, index) => {
            const src = img.getAttribute('data-src');
            if (src && !this.cache.has(src) && !this.currentlyLoading.has(src)) {
                // إضافة بأولوية متوسطة حسب الموقع
                this.queue.push({ 
                    src, 
                    priority: 20 + index
                });
                
                if (!this.waitingElements.has(src)) {
                    this.waitingElements.set(src, []);
                }
                this.waitingElements.get(src).push(img);
            }
        });
        
        // إعادة ترتيب الطابور
        this.sortQueue();
        this.processQueue();
    }
    
    /**
     * 💾 حفظ في SessionStorage
     */
    saveToSessionCache(src) {
        try {
            const cached = JSON.parse(sessionStorage.getItem('taloola_image_cache') || '[]');
            if (!cached.includes(src)) {
                cached.push(src);
                // الاحتفاظ بآخر 50 صورة فقط
                if (cached.length > 50) cached.shift();
                sessionStorage.setItem('taloola_image_cache', JSON.stringify(cached));
            }
        } catch (e) {
            console.warn('⚠️ فشل حفظ الكاش');
        }
    }
    
    /**
     * 📂 تحميل من SessionStorage عند بدء التشغيل
     */
    loadFromSessionCache() {
        try {
            const cached = JSON.parse(sessionStorage.getItem('taloola_image_cache') || '[]');
            
            // تحميل أول 15 صورة مسبقاً
            cached.slice(0, 15).forEach(src => {
                const img = new Image();
                img.onload = () => {
                    this.cache.set(src, src);
                };
                img.src = src;
            });
            
            if (cached.length > 0) {
                console.log(`⚡ تم استرجاع ${Math.min(cached.length, 15)} صورة من الكاش`);
            }
        } catch (e) {}
    }
    
    /**
     * 📶 مراقبة تغييرات الاتصال
     */
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
    
    /**
     * 📊 إحصائيات الأداء
     */
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

// متغير عام للنظام
let smartImageLoader = null;

/**
 * 🚀 تهيئة نظام تحميل الصور الذكي
 */
function initSmartImageLoading() {
    // انتظار تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            smartImageLoader = new SmartSequentialImageLoader();
            console.log('✅ نظام تحميل الصور الذكي المتسلسل جاهز');
        });
    } else {
        smartImageLoader = new SmartSequentialImageLoader();
        console.log('✅ نظام تحميل الصور الذكي المتسلسل جاهز');
    }
    
    // إحصائيات دورية (في وضع التطوير فقط)
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.includes('github.io')) {
        setInterval(() => {
            if (smartImageLoader) {
                const stats = smartImageLoader.getStats();
                console.log('📊 إحصائيات الصور:', stats);
            }
        }, 10000);
    }
}

// ============================================
// 📍 كشف نظام التشغيل
// ============================================
function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
    return 'other';
}

// ============================================
// 📍 متغيرات الموقع
// ============================================
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
// 🛒 دوال السلة
// ============================================
let shoppingCart = JSON.parse(localStorage.getItem('taloola_cart')) || [];

function saveCart() {
    localStorage.setItem('taloola_cart', JSON.stringify(shoppingCart));
    updateCartUI();
}

function updateCartUI() {
    const cartCountTop = document.getElementById('cartCount');
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCountTop) {
        cartCountTop.textContent = totalItems;
        if (totalItems > 0) {
            cartCountTop.style.animation = 'none';
            setTimeout(() => { cartCountTop.style.animation = 'pulse 2s infinite'; }, 10);
        }
    }
}

function addToCart(name, price, quantity = 1) {
    const existingItem = shoppingCart.find(item => item.name === name);
    if (existingItem) existingItem.quantity += quantity;
    else shoppingCart.push({ name: name, price: parseInt(price), quantity: quantity });
    saveCart();
    showNotification(`✓ تم إضافة ${quantity} × ${name}`);
}

function removeFromCart(index) {
    shoppingCart.splice(index, 1);
    saveCart();
    displayCartItems();
}

function changeQuantity(index, change) {
    shoppingCart[index].quantity += change;
    if (shoppingCart[index].quantity <= 0) shoppingCart.splice(index, 1);
    saveCart();
    displayCartItems();
}

function clearCart() {
    if (shoppingCart.length === 0) { alert('السلة فارغة!'); return; }
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
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalQuantity += item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-new';
        itemElement.innerHTML = `
            <div class="cart-item-info-new">
                <div class="cart-item-name-new">${item.name}</div>
                <div class="cart-item-price-new">${item.price.toLocaleString('ar-EG')} د.ع × ${item.quantity}</div>
                <div class="cart-item-total-new">${itemTotal.toLocaleString('ar-EG')} د.ع</div>
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
    const name = element.getAttribute('data-name');
    const price = parseInt(element.getAttribute('data-price'));
    const image = element.getAttribute('data-image');
    const description = element.getAttribute('data-description') || 'منتج لذيذ من مطعم تعلولة';
    
    currentProduct = { name, price, image, description };
    modalQuantity = 1;
    
    document.getElementById('productModalName').textContent = name;
    document.getElementById('productModalPrice').textContent = price.toLocaleString('ar-EG');
    document.getElementById('productModalDescription').textContent = description;
    
    const modalImg = document.getElementById('productModalImage');
    modalImg.classList.remove('loaded');
    modalImg.src = image;
    modalImg.alt = name;
    modalImg.onload = () => modalImg.classList.add('loaded');
    
    document.getElementById('modalQtyDisplay').textContent = modalQuantity;
    updateModalTotal();
    
    const modal = document.getElementById('productModal');
    modal.style.display = 'flex';
    
    if (navigator.vibrate) navigator.vibrate(10);
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    currentProduct = null;
    modalQuantity = 1;
}

function updateModalTotal() {
    if (!currentProduct) return;
    const total = currentProduct.price * modalQuantity;
    document.getElementById('modalTotalPrice').textContent = `${total.toLocaleString('ar-EG')} د.ع`;
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
    if (shoppingCart.length === 0) { alert('السلة فارغة!'); return; }
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
    if (locationInput) {
        if (currentOrderAddress) locationInput.value = currentOrderAddress;
    }

    reviewItemsContainer.innerHTML = '';
    let totalQuantity = 0, totalAmount = 0;
    shoppingCart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += itemTotal;
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-item-info">
                <div class="review-item-name">${item.name}</div>
                <div class="review-item-details">
                    <span><i class="fas fa-box"></i> الكمية: ${item.quantity}</span>
                    <span><i class="fas fa-tag"></i> السعر: ${item.price.toLocaleString('ar-EG')} د.ع</span>
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
// 📱 إرسال الطلب عبر واتساب
// ============================================
function confirmAndSendOrder() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة!');
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
    let message = 'مرحبا اريد طلب استلام من مطعم تعلولة\n\n';
    
    message += `📞 رقم الهاتف: ${phone}\n`;
    message += `📍 منطقة التوصيل: ${area}\n`;
    if (detailed) message += `🏠 العنوان التفصيلي: ${detailed}\n`;
    
    message += '\n═══════════════════\n';
    message += 'الطلب :\n';
    
    let totalAmount = 0;
    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        message += `\n${index + 1}. ${item.name}`;
        message += `\nالكمية : ${item.quantity}`;
        message += `\nالسعر : ${item.price}`;
        message += `\n`;
    });
    
    message += '\n═══════════════════\n';
    message += `\nالاجمالي : ${totalAmount}`;
    message += `\nالمجموع النهائي : ${totalAmount}`;
    
    const gpsLocation = userLocation || getLocationFromStorage();
    if (gpsLocation) {
        const mapUrl = gpsLocation.googleMapsUrl || 
            `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`;
        message += `\n\n📍 الموقع على الخريطة:`;
        message += `\n${mapUrl}`;
    }
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    closeCartModal();
    showNotification('✅ تم إرسال طلبك بنجاح!');
    
    setTimeout(() => {
        shoppingCart = [];
        saveCart();
        if (phoneInput) phoneInput.value = '';
        if (areaSelect) areaSelect.value = '';
        if (detailedInput) detailedInput.value = '';
    }, 500);
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

function closeAuthModal() {
    const m = document.getElementById('adminAuthModal');
    if (m) m.style.display = 'none';
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { preview.innerHTML = `<img src="${e.target.result}" alt="معاينة">`; }
        reader.readAsDataURL(file);
    } else { preview.innerHTML = '<span>معاينة الصورة</span>'; }
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
        storageBucket: "talola-food.firebasestorage.app",
        messagingSenderId: "440585170470",
        appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7",
        measurementId: "G-L4SLHVVFVR"
    };
    
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(firebaseScript);
    const firebaseDbScript = document.createElement('script');
    firebaseDbScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    document.head.appendChild(firebaseDbScript);
    const firebaseStorageScript = document.createElement('script');
    firebaseStorageScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js';
    document.head.appendChild(firebaseStorageScript);

    // ============================================
    // ⚡ تهيئة نظام تحميل الصور الذكي المتسلسل
    // ============================================
    initSmartImageLoading();

    // ============================================
    // 📌 الشريط العلوي الثابت
    // ============================================
    const topStickyBar = document.getElementById('topStickyBar');
    const mainHeader = document.getElementById('mainHeader');
    
    function getHeaderOffset() {
        return mainHeader ? mainHeader.offsetHeight - 50 : 200;
    }
    
    function handleScroll() {
        if (!topStickyBar) return;
        
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const headerOffset = getHeaderOffset();
        
        if (scrollY > headerOffset) {
            topStickyBar.classList.add('visible');
        } else {
            topStickyBar.classList.remove('visible');
        }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ============================================
    // 🎯 العناصر الأخرى
    // ============================================
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const navButtons = document.querySelectorAll('nav.sections-nav button');
    const menuSections = document.querySelectorAll('section.menu-section');
    const menuItems = document.querySelectorAll('.menu-item');
    const cartIcon = document.getElementById('cartIcon');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const getLocationBtn = document.getElementById('getLocationBtn');

    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }
    
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const adminAuthModal = document.getElementById('adminAuthModal');
            if (adminAuthModal) adminAuthModal.style.display = 'flex';
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            openProductModal(this);
        });
    });

    const modalQtyDecrease = document.getElementById('modalQtyDecrease');
    const modalQtyIncrease = document.getElementById('modalQtyIncrease');
    const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
    
    if (modalQtyDecrease) {
        modalQtyDecrease.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            changeModalQuantity(-1);
        });
    }
    
    if (modalQtyIncrease) {
        modalQtyIncrease.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            changeModalQuantity(1);
        });
    }
    
    if (modalAddToCartBtn) {
        modalAddToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addCurrentProductToCart();
        });
    }

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

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = document.getElementById(this.getAttribute('data-section'));
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                menuSections.forEach(s => s.classList.remove('active'));
                targetSection.classList.add('active');
                navButtons.forEach(b => b.style.background = 'var(--main-yellow)');
                this.style.background = '#ffffff';
            }
        });
    });

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    menuSections.forEach(s => observer.observe(s));
    document.querySelectorAll('section.info-section').forEach(s => observer.observe(s));

    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('cartModal')) closeCartModal();
        if (event.target === document.getElementById('orderReviewModal')) closeOrderReview();
        if (event.target === document.getElementById('locationModal')) closeLocationModal();
        if (event.target === document.getElementById('productModal')) closeProductModal();
        if (event.target === document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'none';
        if (event.target === document.getElementById('adminAuthModal')) closeAuthModal();
    });

    updateCartUI();
    initLocationIcon();
    initializeLocationSystem();

    const adminLoginSubmit = document.getElementById('adminLoginSubmit');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminAuthModal = document.getElementById('adminAuthModal');
    const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

    if (adminLoginSubmit) {
        adminLoginSubmit.addEventListener('click', () => {
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                if (adminAuthModal) adminAuthModal.style.display = 'none';
                if (adminPanel) adminPanel.style.display = 'flex';
                loadCurrentAds();
            } else alert('بيانات خاطئة');
        });
    }
    
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', () => {
            if (adminPanel) adminPanel.style.display = 'none';
        });
    }

    firebaseStorageScript.onload = function() {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try { firebase.initializeApp(firebaseConfig); displayAds(); } catch (error) {}
            }
        }, 500);
    };
});

// ============================================
// نظام الإعلانات (Firebase)
// ============================================
function loadCurrentAds() {
    const currentAds = document.getElementById('currentAds');
    if (!currentAds) return;
    currentAds.innerHTML = '<p>جاري تحميل الإعلانات...</p>';
    if (typeof firebase === 'undefined' || !firebase.database) { currentAds.innerHTML = '<p>Firebase غير متوفر</p>'; return; }
    firebase.database().ref('ads/').orderByChild('timestamp').once('value').then((snapshot) => {
        const ads = snapshot.val();
        if (!ads) { currentAds.innerHTML = '<p>لا توجد إعلانات</p>'; return; }
        currentAds.innerHTML = '';
        Object.keys(ads).reverse().forEach((key) => {
            const ad = ads[key];
            const adElement = document.createElement('div');
            adElement.className = 'ad-card';
            adElement.innerHTML = `
                ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}" loading="lazy" class="lazy-image">` : ''}
                <h4>${ad.title}</h4><p>${ad.description}</p>
                ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                <div class="ad-actions"><button onclick="deleteAd('${key}', '${ad.imageUrl}')"><i class="fas fa-trash"></i> حذف</button></div>
            `;
            currentAds.appendChild(adElement);
        });
    }).catch(() => currentAds.innerHTML = '<p>حدث خطأ</p>');
}

function displayAds() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    if (typeof firebase === 'undefined' || !firebase.database) { adsContainer.innerHTML = '<p class="no-ads">Firebase غير متوفر</p>'; return; }
    adsContainer.innerHTML = '<p class="no-ads">جاري التحميل...</p>';
    firebase.database().ref('ads/').orderByChild('timestamp').once('value').then((snapshot) => {
        const ads = snapshot.val();
        if (!ads) { adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض</p>'; return; }
        adsContainer.innerHTML = '';
        Object.keys(ads).reverse().forEach((key) => {
            const ad = ads[key];
            const adElement = document.createElement('div');
            adElement.className = `ad-card ${ad.template || 'red'}`;
            adElement.innerHTML = `
                ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}" loading="lazy">` : ''}
                <h4>${ad.title}</h4><p>${ad.description}</p>
                ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
            `;
            adsContainer.appendChild(adElement);
        });
    }).catch(() => adsContainer.innerHTML = '<p class="no-ads">حدث خطأ</p>');
}

function createAd() {
    const title = document.getElementById('adTitle').value;
    const description = document.getElementById('adDescription').value;
    const price = document.getElementById('adPrice').value;
    const duration = document.getElementById('adDuration').value;
    const template = document.getElementById('adTemplate').value;
    const imageFile = document.getElementById('adImage').files[0];
    if (!title || !description) { alert('املأ الحقول الإلزامية'); return; }
    if (typeof firebase === 'undefined' || !firebase.storage || !firebase.database) { alert('Firebase غير متوفر'); return; }
    
    const storage = firebase.storage();
    const database = firebase.database();
    let imageUrl = '';
    const uploadImage = imageFile ? new Promise((resolve, reject) => {
        const imageRef = storage.ref().child('ads/' + Date.now() + '_' + imageFile.name.replace(/\s+/g, '_'));
        imageRef.put(imageFile).then((snapshot) => snapshot.ref.getDownloadURL().then(resolve).catch(reject)).catch(reject);
    }) : Promise.resolve('');

    uploadImage.then((url) => {
        imageUrl = url;
        return database.ref('ads/').push().set({
            title, description, price, duration, template, imageUrl,
            date: new Date().toLocaleDateString('ar-EG'), timestamp: Date.now()
        });
    }).then(() => {
        alert('تم إنشاء الإعلان!');
        clearAdForm(); loadCurrentAds(); displayAds();
    }).catch((error) => alert('خطأ: ' + error.message));
}

function deleteAd(key, imageUrl) {
    if (!confirm('هل أنت متأكد؟')) return;
    if (typeof firebase === 'undefined' || !firebase.database) { alert('Firebase غير متوفر'); return; }
    const database = firebase.database();
    const storage = firebase.storage();
    database.ref('ads/' + key).remove().then(() => {
        if (imageUrl) return storage.refFromURL(imageUrl).delete();
        return Promise.resolve();
    }).then(() => { alert('تم الحذف'); loadCurrentAds(); displayAds(); })
    .catch(() => alert('خطأ'));
}

function clearAdForm() {
    ['adTitle', 'adDescription', 'adPrice', 'adDuration'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const adTemplate = document.getElementById('adTemplate');
    if (adTemplate) adTemplate.value = 'red';
    const adImage = document.getElementById('adImage');
    if (adImage) adImage.value = '';
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) imagePreview.innerHTML = '<span>معاينة الصورة</span>';
}

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
window.closeAuthModal = closeAuthModal;
window.previewImage = previewImage;
window.createAd = createAd;
window.deleteAd = deleteAd;
window.loadCurrentAds = loadCurrentAds;
window.displayAds = displayAds;
window.requestLocationAndUpdate = requestLocationAndUpdate;
window.closeLocationModal = closeLocationModal;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.changeModalQuantity = changeModalQuantity;
window.addCurrentProductToCart = addCurrentProductToCart;
window.smartImageLoader = smartImageLoader;