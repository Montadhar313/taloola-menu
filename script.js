// ============================================
// 🔧 تهيئة Firebase (مرة واحدة فقط)
// ============================================
function initFirebase() {
    if (firebaseInitialized) return;
    if (typeof firebase === 'undefined' || !firebase.database) {
        //await حتى يتوفر سكربت Firebase
        setTimeout(initFirebase, 200);
        return;
    }
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
            authDomain: "talola-food.firebaseapp.com",
            databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
            projectId: "talola-food",
            messagingSenderId: "440585170470",
            appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
        };
        firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        console.log('✅ تم تهيئة Firebase بنجاح');
    } catch (e) {
        console.error('❌ فشل تهيئة Firebase:', e);
        setTimeout(initFirebase, 1000); // إعادة المحاولة بعد ثانية
    }
}


// ============================================
// 📦 تحميل المنيو من Firebase (مع الانتظار لكلا العقدتين)
// ============================================
function loadMenuFromFirebase() {
    if (!firebaseInitialized) {
        console.warn('⚠️ Firebase غير جاهز بعد … محاولة إعادة التحميل');
        setTimeout(loadMenuFromFirebase, 300);
        return;
    }

    console.log('🔍 بدء تحميل المنيو من Firebase…');

    // نستخدم Promises لتضمن أن كلا العقدتين تم تحميلهما قبل البناء
    const categoriesPromise = new Promise((resolve, reject) => {
        const categoriesRef = firebase.database().ref('categories').orderByChild('order');
        categoriesRef.on('value', snap => {
            const data = snap.val() || {};
            const arr = Object.keys(data).map(k => ({ id: k, ...data[k] }))
                             .sort((a, b) => (a.order || 0) - (b.order || 0));
            cachedCategories = arr;
            console.log(`✅ تم تحميل ${cachedCategories.length} قسم`);
            resolve(arr);
        }, reject);
    });

    const menuPromise = new Promise((resolve, reject) => {
        const menuRef = firebase.database().ref('menu');
        menuRef.on('value', snap => {
            const data = snap.val() || {};
            cachedMenuItems = data;
            console.log(`✅ تم تحميل ${Object.keys(cachedMenuItems).length} صنف`);
            resolve(data);
        }, reject);
    });

    Promise.all([categoriesPromise, menuPromise])
        .then(() => {
            if (isMenuInitialized) return; // تجنّب إعادة البناء إذا تم بالفعل
            isMenuInitialized = true;
            rebuildMenuAndUI();
        })
        .catch(err => {
            console.error('❌ فشل في تحميل المنيو:', err);
            showNotification('⚠ فشل تحميل القائمة، يرجى المحاولة لاحقاً');
        });
}

// ============================================
// 🏗️ بناء الأقسام وربط البيانات (يتم استدعاؤه مرة واحدة بعد توفر البيانات)
// ============================================
function rebuildMenuAndUI() {
    const mainEl = document.querySelector('main');
    if (!mainEl) {
        console.error('❌ عنصر <main> غير موجود في الصفحة');
        return;
    }

    // 1️⃣ مسح الأقسام القديمة
    const oldSections = mainEl.querySelectorAll('.menu-section[data-category]');
    oldSections.forEach(sec => sec.remove());
    console.log(`🗑️ تم حذف ${oldSections.length} قسم قديم`);

    // 2️⃣ الحصول على العنصر المرجعي (قبل فريق تعلولة أو الدعم أو الاجتماعية)
    const referenceEl =
        mainEl.querySelector('#team') ||
        mainEl.querySelector('#support') ||
        mainEl.querySelector('#social') ||
        null;

    // 3️⃣ إنشاء الأقسام الجديدة بالترتيب الصحيح
    cachedCategories.forEach((cat, idx) => {
        const section = document.createElement('section');
        section.className = 'menu-section animate-in';
        section.id = `sec-${cat.id}`;
        section.setAttribute('data-category', cat.name);
        section.innerHTML = `
            <h3>${cat.icon || '📁'} ${cat.name}</h3>
            <div class="menu-items"></div>
        `;
        if (referenceEl) {
            mainEl.insertBefore(section, referenceEl);
        } else {
            mainEl.appendChild(section);
        }
    });
    console.log(`✨ تم إنشاء ${cachedCategories.length} قسم جديد`);

    // 4️⃣ تحديث أزرار التنقل
    updateNavigationButtons(cachedCategories);

    // 5️⃣ توزيع الأصناف على الأقسام
    populateMenuItems(cachedCategories, cachedMenuItems);

    // 6️⃣ تهيئة محمل الصور الذكي (إن لم يكن قد تم)
    if (!smartImageLoader) {
        smartImageLoader = new SmartSequentialImageLoader();
        // مراقبة جميع الصور lazy بعد إضافتها إلى DOM
        smartImageLoader.observeAllImages();
    } else {
        smartImageLoader.observeAllImages(); // إعادة مراقبة إذا تم استدعاء الدالة nuovamente
    }

    // 7️⃣ ربط معالجات النقر على البطاقات (مرة واحدة)
    reattachClickHandlers();
}

// ============================================
// 🔘 تحديث أزرار التنقل حسب الأقسام
// ============================================
function updateNavigationButtons(categoriesArray) {
    const navEl = document.getElementById('sectionsNav');
    if (!navEl) return;

    navEl.innerHTML = ''; // مسح الأزرار القديمة

    categoriesArray.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-section', `sec-${cat.id}`);
        btn.textContent = `${cat.icon || ''} ${cat.name}`;

        btn.addEventListener('click', () => {
            const target = document.getElementById(`sec-${cat.id}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // تمييز الزر النشط
                navEl.querySelectorAll('button').forEach(b => {
                    b.style.background = '';
                    b.classList.remove('active-nav-btn');
                });
                btn.classList.add('active-nav-btn');
            }
        });

        navEl.appendChild(btn);
    });
    console.log(`🔘 تم تحديث ${categoriesArray.length} زر تنقل`);
}

// ============================================
// 📥 توزيع الأصناف على الأقسام مع ضمان وجودة الصورة
// ============================================
function populateMenuItems(categoriesArray, menuItems) {
    // مسح محتويات جميع حاويات menu-items
    document.querySelectorAll('.menu-section .menu-items').forEach(container => {
        container.innerHTML = '';
    });

    // تحويل كائن الأصناف إلى مصفوفة مرتبة
    const itemsArray = Object.keys(menuItems || {}).map(k => ({
        id: k,
        ...menuItems[k]
    })).sort((a, b) => (a.order || 0) - (b.order || 0));

    let addedCount = 0;

    itemsArray.forEach(item => {
        if (item.available === false) return; // تجاهل غير المتوفر

        const section = document.querySelector(`.menu-section[data-category="${item.category}"]`);
        if (!section) {
            console.warn(`⚠️ القسم "${item.category}" غير موجود`);
            return;
        }
        const itemsContainer = section.querySelector('.menu-items');
        if (!itemsContainer) return;

        // إنشاء عنصر الصنف
        const menuEl = document.createElement('div');
        menuEl.className = 'menu-item';
        menuEl.setAttribute('data-name', item.name);
        menuEl.setAttribute('data-price', item.price);
        menuEl.setAttribute('data-image', item.image || '');
        menuEl.setAttribute('data-description', item.description || 'منتج لذيذ من مطعم تعلولة');

        // رابط الصورة مع fallback
        const imgUrl = item.image
            ? item.image.trim()
            : 'https://via.placeholder.com/400x300?text=No+Image';

        menuEl.innerHTML = `
            <div class="item-image">
                <div class="image-skeleton"></div>
                <img data-src="${imgUrl}"
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                     alt="${item.name}"
                     class="lazy-image"
                     decoding="async"
                     width="400"
                     height="300"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=No+Image'">
            </div>
            <h4>${item.name}</h4>
            <p class="price">${item.price.toLocaleString('ar-EG')} د.ع</p>
        `;

        itemsContainer.appendChild(menuEl);
        addedCount++;
    });

    // إظهار/إخفاء الأقسام الفارغة
    document.querySelectorAll('.menu-section[data-category]').forEach(sec => {
        const container = sec.querySelector('.menu-items');
        if (container && container.children.length === 0) {
            sec.style.display = 'none';
        } else {
            sec.style.display = '';
        }
    });

    console.log(`✅ تم توزيع ${addedCount} صنف على الأقسام`);
}

// ============================================
#️⃣ إعادة ربط معالجات النقر على البطاقات (مرة واحدة)
// ============================================
function reattachClickHandlers() {
    // إزالة أي معالجات قديمة (منع التكرار)
    document.querySelectorAll('.menu-item').forEach(el => {
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
    });

    // إضافة المعالج الجديد
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            openProductModal(item);
        });
    });
}

// ============================================
#️⃣ محمل الصور الذكي المتسلسل (بدون تعديل جوهري)
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
            preloadDistance: 300,
            highPriorityDistance: 100,
            useIdleCallback: 'requestIdleCallback' in window
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
            switch (connection.effectiveType) {
                case '4g': return 3;
                case '3g': return 2;
                case '2g':
                case 'slow-2g': return 1;
                default: return 2;
            }
        }
        return Math.min(navigator.hardwareConcurrency || 2, 3);
    }

    init() {
        this.loadFromSessionCache();
        this.setupObservers();
        this.observeAllImages();
        this.monitorConnectionChanges();
    }

    setupObservers() {
        this.visibilityObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const priority = this.calculatePriority(img);
                        this.enqueue(img, priority);
                        this.visibilityObserver.unobserve(img);
                    }
                });
            },
            { rootMargin: `${this.config.preloadDistance}px 0px`, threshold: 0.01 }
        );

        this.preloadObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.preloadSectionImages(entry.target);
                        this.preloadObserver.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: '500px 0px', threshold: 0 }
        );
    }

    calculatePriority(img) {
        const rect = img.getBoundingClientRect();
        const vw = window.innerWidth, vh = window.innerHeight;
        const cx = vw / 2, cy = vh / 2;
        const icx = rect.left + rect.width / 2;
        const icy = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(icx - cx, 2) + Math.pow(icy - cy, 2));

        if (rect.top < vh && rect.bottom > 0) return 1 + dist / 1000;
        if (rect.top < vh + this.config.highPriorityDistance) return 10 + dist / 500;
        return 100 + dist / 200;
    }

    observeAllImages() {
        const imgs = document.querySelectorAll('.lazy-image');
        imgs.forEach(img => {
            if (this.visibilityObserver) this.visibilityObserver.observe(img);
            const sec = img.closest('.menu-section');
            if (sec && this.preloadObserver) this.preloadObserver.observe(sec);
        });
        console.log(`🖼️ مراقبة ${imgs.length} صورة للتحميل الذكي`);
    }

    enqueue(img, priority = 50) {
        const src = img.getAttribute('data-src');
        if (!src) return;
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

    sortQueue() { this.queue.sort((a, b) => a.priority - b.priority); }

    processQueue() {
        while (this.currentlyLoading.size < this.config.maxConcurrent && this.queue.length) {
            const next = this.queue.shift();
            if (next) this.loadImage(next.src);
        }
    }

    loadImage(src) {
        this.currentlyLoading.add(src);
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => this.handleImageLoad(src, img);
        img.onerror = () => this.handleImageError(src);
        img.src = src;
    }

    handleImageLoad(src, img) {
        this.currentlyLoading.delete(src);
        this.cache.set(src, src);
        const wait = this.waitingElements.get(src) || [];
        wait.forEach(el => this.applyImage(el, src));
        this.waitingElements.delete(src);
        this.saveToSessionCache(src);
        this.processQueue();
        console.log(`✅ تم تحميل: ${src.split('/').pop()}`);
    }

    handleImageError(src) {
        console.warn(`❌ فشل تحميل: ${src}`);
        this.currentlyLoading.delete(src);
        const wait = this.waitingElements.get(src) || [];
        wait.forEach(el => {
            el.classList.remove('loading');
            el.classList.add('error');
        });
        this.waitingElements.delete(src);
        this.processQueue();
    }

    applyImage(img, src) {
        img.src = src;
        img.classList.remove('loading');
        img.classList.add('loaded');

        const skel = img.parentElement?.querySelector('.image-skeleton');
        if (skel) {
            skel.style.transition = 'opacity 0.4s ease';
            skel.style.opacity = '0';
            setTimeout(() => { if (skel.parentElement) skel.remove(); }, 400);
        }
    }

    preloadSectionImages(section) {
        const imgs = section.querySelectorAll('.lazy-image[data-src]');
        imgs.forEach((img, idx) => {
            const src = img.getAttribute('data-src');
            if (src && !this.cache.has(src) && !this.currentlyLoading.has(src)) {
                this.queue.push({ src, priority: 20 + idx });
                if (!this.waitingElements.has(src)) this.waitingElements.set(src, []);
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
                if (cached.length > 50) cached.shift();
                sessionStorage.setItem('taloola_image_cache', JSON.stringify(cached));
            }
        } catch (_) {}
    }

    loadFromSessionCache() {
        try {
            const cached = JSON.parse(sessionStorage.getItem('taloola_image_cache') || '[]');
            cached.slice(0, 15).forEach(src => {
                const img = new Image();
                img.onload = () => this.cache.set(src, src);
                img.src = src;
            });
            if (cached.length) console.log(`⚡ استرجعنا ${Math.min(cached.length, 15)} صورة من الكاش`);
        } catch (_) {}
    }

    monitorConnectionChanges() {
        const connection = navigator.connection ||
                           navigator.mozConnection ||
                           navigator.webkitConnection;
        if (connection) {
            connection.addEventListener('change', () => {
                const newC = this.detectOptimalConcurrency();
                if (newC !== this.config.maxConcurrent) {
                    this.config.maxConcurrent = newC;
                    console.log(`📶 تغيير السرعة – Concurrent: ${newC}`);
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
#️⃣ نظام الموقع الجغرافي (بدون تعديل جوهري)
// ============================================
function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    return 'other';
}

let userLocation = null;
let locationPermissionGranted = false;
const LOCATION_STORAGE_KEY = 'taloola_user_location';
const LOCATION_PERMISSION_KEY = 'taloola_location_permission';
const LOCATION_TEXT_STORAGE_KEY = 'taloola_saved_address';
let savedAddressText = localStorage.getItem(LOCATION_TEXT_STORAGE_KEY) || '';

function saveLocationToStorage(loc) {
    try {
        const data = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: Date.now(),
            googleMapsUrl: `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(data));
        return data;
    } catch (_) { return null; }
}

function getLocationFromStorage() {
    try {
        const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (!stored) return null;
        const data = JSON.parse(stored);
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp < oneWeek) return data;
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        return null;
    } catch (_) { return null; }
}

async function checkLocationPermissionStatus() {
    try {
        if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
        const res = await navigator.permissions.query({ name: 'geolocation' });
        return res.state;
    } catch (_) { return 'unknown'; }
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
                p => resolve({
                    latitude: p.coords.latitude,
                    longitude: p.coords.longitude,
                    accuracy: p.coords.accuracy
                }),
                e => {
                    let msg = 'خطأ في تحديد الموقع';
                    switch (e.code) {
                        case e.PERMISSION_DENIED: msg = 'تم رفض إذن الموقع'; break;
                        case e.POSITION_UNAVAILABLE: msg = 'المعلومات غير متوفرة'; break;
                        case e.TIMEOUT: msg = 'انتهت المهلة'; break;
                    }
                    const err = new Error(msg);
                    err.detailedMessage = e.code === e.PERMISSION_DENIED ? 'PERMISSION_DENIED' : '';
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
            );
        } else if (os === 'ios') {
            let watchId = null;
            const timeoutId = setTimeout(() => {
                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                reject(new Error('انتهت مهلة طلب الموقع'));
            }, 20000);
            watchId = navigator.geolocation.watchPosition(
                p => {
                    clearTimeout(timeoutId);
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    resolve({
                        latitude: p.coords.latitude,
                        longitude: p.coords.longitude,
                        accuracy: p.coords.accuracy
                    });
                },
                e => {
                    clearTimeout(timeoutId);
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    reject(new Error('خطأ في تحديد الموقع'));
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        } else {
            navigator.geolocation.getCurrentPosition(
                p => resolve({
                    latitude: p.coords.latitude,
                    longitude: p.coords.longitude,
                    accuracy: p.coords.accuracy
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
        const permStatus = await checkLocationPermissionStatus();
        if (os === 'android' && permStatus === 'denied') {
            showAndroidSettingsGuide();
            showNotification('⚠ يرجى تفعيل الموقع من إعدادات Chrome');
            return null;
        }
        const loc = await requestLocationPermission();
        const saved = saveLocationToStorage(loc);
        userLocation = saved;
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
        return saved;
    } catch (err) {
        if (os === 'android' && err.detailedMessage === 'PERMISSION_DENIED') {
            showAndroidSettingsGuide();
            showNotification('⚠ تم رفض الإذن');
        } else {
            if (statusDiv && textSpan) {
                statusDiv.className = 'location-modal-status error';
                textSpan.textContent = '⚠ ' + err.message;
            }
            showNotification('⚠ ' + err.message);
        }
        return null;
    }
}

function initLocationIcon() {
    const btn = document.getElementById('locationIconBtn');
    if (!btn) return;
    updateLocationIconStatus();
    btn.addEventListener('click', e => {
        e.preventDefault();
        openLocationModal();
    });
}

function updateLocationIconStatus() {
    const btn = document.getElementById('locationIconBtn');
    if (!btn) return;
    if (getLocationFromStorage() || userLocation) btn.classList.add('located');
    else btn.classList.remove('located');
}

function openLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) modal.style.display = 'flex';
    updateLocationModalStatus();
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

    const loc = userLocation || getLocationFromStorage();
    if (loc) {
        statusDiv.className = 'location-modal-status success';
        textSpan.textContent = '✓ تم تحديد موقعك بنجاح';
        if (infoDiv) {
            infoDiv.style.display = 'block';
            if (coordsP) coordsP.textContent = `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
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
    const stored = getLocationFromStorage();
    if (stored) {
        userLocation = stored;
        locationPermissionGranted = true;
        updateLocationIconStatus();
        updateLocationInCart();
        return;
    }
    updateLocationIconStatus();
    updateLocationInCart();
}

// ============================================
#️⃣ نظام السلة العائمة
// ============================================
let shoppingCart = JSON.parse(localStorage.getItem('taloola_cart')) || [];

function saveCart() {
    localStorage.setItem('taloola_cart', JSON.stringify(shoppingCart));
    updateCartUI();
}

function updateCartUI() {
    const btn = document.getElementById('floatingCartBtn');
    const count = document.getElementById('floatingCartCount');
    if (!btn || !count) return;
    const totalItems = shoppingCart.reduce((s, i) => s + i.quantity, 0);
    count.textContent = totalItems;
    if (totalItems > 0) {
        if (!btn.classList.contains('has-items')) btn.classList.add('has-items');
    } else {
        btn.classList.remove('has-items');
    }
}

function showCartAddEffect() {
    const btn = document.getElementById('floatingCartBtn');
    if (btn && btn.classList.contains('has-items')) {
        btn.classList.remove('item-added');
        void btn.offsetWidth; // trigger reflow
        btn.classList.add('item-added');
        setTimeout(() => btn.classList.remove('item-added'), 600);
    }
}

function addToCart(name, price, quantity = 1) {
    const existing = shoppingCart.find(i => i.name === name);
    if (existing) existing.quantity += quantity;
    else shoppingCart.push({ name, price: parseInt(price), quantity });
    saveCart();
    showNotification(`✓ تم إضافة ${quantity} × ${name}`);
    showCartAddEffect();
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
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
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartItemsCount');
    if (!container) return;

    if (shoppingCart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-new">
                <i class="fas fa-shopping-cart"></i>
                <h3>السلة فارغة</h3>
                <p>لم تضف أي منتجات بعد</p>
            </div>
        `;
        if (totalEl) totalEl.textContent = '0 د.ع';
        if (countEl) countEl.textContent = '0';
        return;
    }

    container.innerHTML = '';
    let total = 0, totalQty = 0;
    shoppingCart.forEach((item, idx) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalQty += item.quantity;
        const el = document.createElement('div');
        el.className = 'cart-item-new';
        el.innerHTML = `
            <div class="cart-item-info-new">
                <div class="cart-item-name-new">${item.name}</div>
                <div class="cart-item-price-new">${item.price.toLocaleString('ar-EG')} د.ع × ${item.quantity}</div>
                <div class="cart-item-total-new">${itemTotal.toLocaleString('ar-EG')} د.ع</div>
            </div>
            <div class="cart-item-controls-new">
                <button class="cart-item-remove-new" onclick="removeFromCart(${idx})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="qty-btn-new" onclick="changeQuantity(${idx}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="qty-display-new">${item.quantity}</span>
                <button class="qty-btn-new" onclick="changeQuantity(${idx}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        container.appendChild(el);
    });
    if (totalEl) totalEl.textContent = `${total.toLocaleString('ar-EG')} د.ع`;
    if (countEl) countEl.textContent = totalQty;
}

function openCartModal() {
    const m = document.getElementById('cartModal');
    if (m) { m.style.display = 'flex'; displayCartItems(); loadSavedCustomerInfo(); }
}

function closeCartModal() {
    const m = document.getElementById('cartModal');
    if (m) m.style.display = 'none';
}

function loadSavedCustomerInfo() {
    const phone = document.getElementById('customerPhone');
    const area = document.getElementById('deliveryArea');
    if (!phone || !area) return;
    try {
        const savedPhone = localStorage.getItem('taloola_saved_phone');
        const savedArea = localStorage.getItem('taloola_saved_area');
        if (savedPhone && !phone.value) phone.value = savedPhone;
        if (savedArea && !area.value) {
            const opts = Array.from(area.options).map(o => o.value);
            if (opts.includes(savedArea)) area.value = savedArea;
        }
    } catch (_) {}
}

// ============================================
#️⃣ نافذة تفاصيل المنتج
// ============================================
let currentProduct = null;
let modalQuantity = 1;

function openProductModal(el) {
    const name = el.getAttribute('data-name');
    const price = parseInt(el.getAttribute('data-price'));
    const image = el.getAttribute('data-image');
    const desc = el.getAttribute('data-description') || 'منتج لذيذ من مطعم تعلولة';

    currentProduct = { name, price, image, description: desc };
    modalQuantity = 1;

    document.getElementById('productModalName').textContent = name;
    document.getElementById('productModalPrice').textContent = price.toLocaleString('ar-EG');
    document.getElementById('productModalDescription').textContent = desc;

    const img = document.getElementById('productModalImage');
    img.classList.remove('loaded');
    img.src = image;
    img.alt = name;
    img.onload = () => img.classList.add('loaded');

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

    const disp = document.getElementById('modalQtyDisplay');
    disp.style.transform = 'scale(1.3)';
    setTimeout(() => disp.style.transform = 'scale(1)', 200);
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
#️⃣ نافذة مراجعة الطلب
// ============================================
function showOrderReview() {
    if (shoppingCart.length === 0) { alert('السلة فارغة!'); return; }
    closeCartModal();
    const m = document.getElementById('orderReviewModal');
    if (m) { m.style.display = 'flex'; displayOrderReview(); }
}

function displayOrderReview() {
    const container = document.getElementById('orderReviewItems');
    const itemCount = document.getElementById('reviewItemCount');
    const totalQty = document.getElementById('reviewTotalQuantity');
    const totalAmt = document.getElementById('reviewTotalAmount');
    const locInput = document.getElementById('locationDescription');
    if (!container) return;

    const useBtn = document.getElementById('useSavedAddressBtn');
    const preview = document.getElementById('savedAddressPreview');
    if (useBtn && preview && savedAddressText) {
        useBtn.style.display = 'flex';
        preview.textContent = savedAddressText.length > 50
            ? savedAddressText.substring(0, 50) + '...'
            : savedAddressText;
        useBtn.onclick = () => {
            if (locInput) locInput.value = savedAddressText;
        };
    }

    const savedAddr = sessionStorage.getItem('current_order_address');
    if (locInput) {
        if (savedAddr) locInput.value = savedAddr;
    }

    container.innerHTML = '';
    let totQty = 0, totAmt = 0;
    shoppingCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totQty += item.quantity;
        totAmt += itemTotal;
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
            <div class="review-item-info">
                <div class="review-item-name">${item.name}</div>
                <div class="review-item-details">
                    <span><i class="fas fa-box"></i> الكمية: ${item.quantity}</span>
                    <span><i class="fas fa-tag"></i> السعر: ${item.price.toLocaleString('ar-EG')} د.ع</span>
                </div>
            </div>
            <div class="review-item-total">${itemTotal.toLocaleString('ar-EG')} د.ع</div>
        `;
        container.appendChild(div);
    });
    if (itemCount) itemCount.textContent = `${shoppingCart.length} منتج`;
    if (totalQty) totalQty.textContent = `${totQty} قطعة`;
    if (totalAmt) totalAmt.textContent = `${totAmt.toLocaleString('ar-EG')} د.ع`;
}

function closeOrderReview() {
    const m = document.getElementById('orderReviewModal');
    if (m) m.style.display = 'none';
}

// ============================================
#️⃣ إرسال الطلب عبر واتساب
// ============================================
function confirmAndSendOrder() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    const phoneInp = document.getElementById('customerPhone');
    const areaSel = document.getElementById('deliveryArea');
    const detailInp = document.getElementById('detailedAddress');

    const phone = phoneInp ? phoneInp.value.trim() : '';
    const area = areaSel ? areaSel.value.trim() : '';
    const detail = detailInp ? detailInp.value.trim() : '';

    [phoneInp, areaSel].forEach(el => { if (el) el.classList.remove('error'); });

    let hasError = false;
    if (!phone) {
        if (phoneInp) { phoneInp.classList.add('error'); phoneInp.focus(); }
        showNotification('⚠ الرجاء إدخال رقم الهاتف');
        hasError = true;
    } else if (!/^07[0-9]{9}$/.test(phone)) {
        if (phoneInp) phoneInp.classList.add('error');
        showNotification('⚠ رقم الهاتف غير صحيح (يجب أن يبدأ بـ 07)');
        hasError = true;
    }
    if (!area) {
        if (areaSel) {
            areaSel.classList.add('error');
            if (!hasError && phoneInp) areaSel.focus();
        }
        showNotification('⚠ الرجاء اختيار منطقة التوصيل');
        hasError = true;
    }
    if (hasError) return;

    try {
        localStorage.setItem('taloola_saved_phone', phone);
        localStorage.setItem('taloola_saved_area', area);
    } catch (_) {}

    const phoneNumber = '9647755666073';
    let msg = 'مرحبا اريد طلب استلام من مطعم تعلولة\n\n';
    msg += `📞 رقم الهاتف: ${phone}\n`;
    msg += `📍 منطقة التوصيل: ${area}\n`;
    if (detail) msg += `🏠 العنوان التفصيلي: ${detail}\n`;
    msg += '\n═══════════════════\n';
    msg += 'الطلب :\n';

    let total = 0;
    shoppingCart.forEach((it, idx) => {
        const itTotal = it.price * it.quantity;
        total += itTotal;
        msg += `\n${idx + 1}. ${it.name}`;
        msg += `\nالكمية : ${it.quantity}`;
        msg += `\nالسعر : ${it.price}`;
        msg += `\n`;
    });
    msg += '\n═══════════════════\n';
    msg += `\nالاجمالي : ${total}`;
    msg += `\nالمجموع النهائي : ${total}`;

    const gps = userLocation || getLocationFromStorage();
    if (gps) {
        const mapUrl = gps.googleMapsUrl ||
            `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;
        msg += `\n\n📍 الموقع على الخريطة:\n${mapUrl}`;
    }

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    closeCartModal();
    showNotification('✅ تم إرسال طلبك بنجاح!');

    setTimeout(() => {
        shoppingCart = [];
        saveCart();
        if (phoneInp) phoneInp.value = '';
        if (areaSel) areaSel.value = '';
        if (detailInp) detailInp.value = '';
    }, 500);
}

// ============================================
#️⃣ دوال عامة
// ============================================
function showNotification(message) {
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.className = 'cart-notification';
    notif.textContent = message;
    notif.style.display = 'block';
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideInDown 0.5s ease reverse';
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}

function openSupport() {
    window.open(`https://wa.me/9647755666073?text=${encodeURIComponent('أحتاج إلى مساعدة')}`, '_blank');
}

// ============================================
#️⃣ جلب الإعلانات من Firebase
// ============================================
function displayAds() {
    const container = document.getElementById('adsContainer');
    if (!container) return;
    container.innerHTML = '<p class="loading-text" style="color:#fff;text-align:center;grid-column:1/-1;">جاري تحميل العروض...</p>';

    if (typeof firebase === 'undefined' || !firebase.database) {
        setTimeout(() => {
            if (typeof firebase !== 'undefined' && firebase.database) listenToAds();
            else container.innerHTML = '<p class="no-ads">تعذر تحميل العروض حالياً</p>';
        }, 1000);
        return;
    }
    listenToAds();

    function listenToAds() {
        firebase.database().ref('ads').orderByChild('timestamp').on('value', snap => {
            container.innerHTML = '';
            const ads = snap.val() || {};
            if (!Object.keys(ads).length) {
                container.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
                return;
            }
            const keys = Object.keys(ads).reverse();
            keys.forEach(k => {
                const ad = ads[k];
                const el = document.createElement('div');
                el.className = `ad-card ${ad.template || 'red'}`;
                el.innerHTML = `
                    ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}" loading="lazy" class="lazy-image"></div>` : ''}
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                `;
                container.appendChild(el);
            });
            if (smartImageLoader) {
                const newImgs = container.querySelectorAll('.lazy-image:not(.loaded):not(.loading)');
                newImgs.forEach(img => {
                    if (smartImageLoader.visibilityObserver) smartImageLoader.visibilityObserver.observe(img);
                });
            }
        }, err => {
            console.error('خطأ في جلب الإعلانات:', err);
            container.innerHTML = '<p class="no-ads">تعذر تحميل العروض حالياً</p>';
        });
    }
}

// ============================================
#️⃣ التهيئة عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // تحسين تمرير اللمس
    document.addEventListener('touchstart', () => {}, { passive: true });

    // تهيئة Firebase ثم تحميل القائمة
    initFirebase();

    // شريط العلوي الثابت
    const topBar = document.getElementById('topStickyBar');
    const mainHeader = document.getElementById('mainHeader');
    function getHeaderOffset() {
        return mainHeader ? mainHeader.offsetHeight - 50 : 200;
    }
    function handleScroll() {
        if (!topBar) return;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const headerOff = getHeaderOffset();
        const nav = document.getElementById('sectionsNav');
        if (scrollY > headerOff) {
            topBar.classList.add('visible');
            if (nav) nav.classList.add('stuck-under-bar');
        } else {
            topBar.classList.remove('visible');
            if (nav) nav.classList.remove('stuck-under-bar');
        }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // زر الصعود للأعلى
    const topBtn = document.getElementById('scrollToTopBtn');
    if (topBtn) {
        window.addEventListener('scroll', () => {
            topBtn.classList.toggle('visible', window.pageYOffset > 300);
        });
        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // زر السلة العائمة
    const cartBtn = document.getElementById('floatingCartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', e => {
            e.preventDefault();
            openCartModal();
        });
    }

    // أزرار الإغلاق للمودالات
    window.addEventListener('click', ev => {
        const targets = [
            ['cartModal', closeCartModal],
            ['orderReviewModal', closeOrderReview],
            ['locationModal', closeLocationModal],
            ['productModal', closeProductModal]
        ];
        for (const [id, fn] of targets) {
            const el = document.getElementById(id);
            if (el && ev.target === el) fn();
        }
    });

    // تحديث واجهة السلة وأيقونة الموقع
    updateCartUI();
    initLocationIcon();
    initializeLocationSystem();

    // بعد تحميل سكريات Firebase
    const fbAppScr = document.createElement('script');
    fbAppScr.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(fbAppScr);

    const fbDbScr = document.createElement('script');
    fbDbScr.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    document.head.appendChild(fbDbScr);

    fbDbScr.onload = () => {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.initializeApp({
                        apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
                        authDomain: "talola-food.firebaseapp.com",
                        databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
                        projectId: "talola-food",
                        messagingSenderId: "440585170470",
                        appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
                    });
                    firebaseInitialized = true;
                    console.log('✅ تم تهيئة Firebase بنجاح');
                    displayAds();
                    loadMenuFromFirebase(); // سيبدأ تحميل المنيو بعد تهيئة Firebase
                } catch (e) {
                    console.error('خطأ في تهيئة Firebase:', e);
                }
            }
        }, 500);
    };
});

// ============================================
#️⃣ تصدير الدوال العامة للنافذة
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
window.smartImageLoader = smartImageLoader; // سيتعيين بعد التهيئة الأولى
