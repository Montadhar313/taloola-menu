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

function generateGoogleMapsUrl(lat, lng) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
}

// ============================================
// 🆕 التحقق من حالة إذن الموقع (مهم جداً لأندرويد)
// ============================================
async function checkLocationPermissionStatus() {
    try {
        if (!navigator.permissions || !navigator.permissions.query) {
            return 'unknown';
        }
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state; // 'granted' | 'denied' | 'prompt'
    } catch (error) {
        console.warn('⚠ لا يمكن التحقق من حالة الإذن:', error);
        return 'unknown';
    }
}

// ============================================
// 🆕 عرض رسالة توجيه المستخدم لإعدادات Chrome (أندرويد)
// ============================================
function showAndroidSettingsGuide() {
    const statusDiv = document.getElementById('locationModalStatus');
    const textSpan = document.getElementById('locationModalText');
    
    if (statusDiv && textSpan) {
        statusDiv.className = 'location-modal-status error';
        textSpan.innerHTML = `
            ⚠ تم رفض إذن الموقع سابقاً<br>
            <small style="display:block; margin-top:10px; line-height:1.8; text-align:right;">
                📱 <strong>لتفعيل الموقع في Chrome:</strong><br>
                1️⃣ اضغط على أيقونة القفل 🔒 في شريط العنوان<br>
                2️⃣ اختر "أذونات الموقع" أو "Site settings"<br>
                3️⃣ فعّل "الموقع" أو "Location"<br>
                4️⃣ أعد تحميل الصفحة وحاول مرة أخرى
            </small>
        `;
    }
}

// ============================================
// 📍 طلب إذن الموقع (محسّن لأندرويد و iOS)
// ============================================
function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('المتصفح لا يدعم تحديد الموقع الجغرافي'));
            return;
        }
        
        const os = detectOS();
        console.log('🔍 نظام التشغيل المكتشف:', os);
        
        // 🆕 إعدادات مختلفة لكل نظام
        if (os === 'android') {
            // 🤖 استراتيجية أندرويد: getCurrentPosition (أكثر موثوقية لطلب الإذن)
            const options = {
                enableHighAccuracy: true,
                timeout: 25000,
                maximumAge: 0
            };
            
            console.log('🤖 استخدام getCurrentPosition لأندرويد...');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    console.log('✅ تم تحديد الموقع بنجاح (Android)');
                    resolve(location);
                },
                (error) => {
                    let errorMessage = 'خطأ في تحديد الموقع';
                    let detailedMessage = '';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'تم رفض إذن تحديد الموقع';
                            detailedMessage = 'PERMISSION_DENIED';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'معلومات الموقع غير متوفرة. تأكد من تشغيل GPS';
                            detailedMessage = 'POSITION_UNAVAILABLE';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'انتهت مهلة طلب الموقع. حاول مرة أخرى';
                            detailedMessage = 'TIMEOUT';
                            break;
                    }
                    
                    const fullError = new Error(errorMessage);
                    fullError.detailedMessage = detailedMessage;
                    reject(fullError);
                },
                options
            );
            
        } else if (os === 'ios') {
            // 🍎 استراتيجية iOS: watchPosition (أدق)
            const options = {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            };
            
            let watchId = null;
            let timeoutId = setTimeout(() => {
                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                reject(new Error('انتهت مهلة طلب الموقع'));
            }, options.timeout);
            
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    console.log('✅ تم تحديد الموقع بنجاح (iOS)');
                    resolve(location);
                },
                (error) => {
                    clearTimeout(timeoutId);
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    
                    let errorMessage = 'خطأ في تحديد الموقع';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'تم رفض إذن الموقع. فعّله من: الإعدادات ← الخصوصية ← خدمات الموقع ← Safari';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'معلومات الموقع غير متوفرة';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'انتهت مهلة طلب الموقع';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                options
            );
            
        } else {
            // 💻 الأنظمة الأخرى
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(new Error('خطأ في تحديد الموقع'));
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    });
}

// ============================================
// 🆕 دالة طلب الموقع المحسّنة (مع التحقق من الإذن)
// ============================================
async function requestLocationAndUpdate() {
    const statusDiv = document.getElementById('locationModalStatus');
    const textSpan = document.getElementById('locationModalText');
    const os = detectOS();
    
    if (statusDiv && textSpan) {
        statusDiv.className = 'location-modal-status loading';
        textSpan.textContent = 'جاري تحديد موقعك...';
    }
    
    try {
        // 🆕 التحقق من حالة الإذن أولاً
        const permissionStatus = await checkLocationPermissionStatus();
        console.log('🔍 حالة إذن الموقع:', permissionStatus);
        
        // 🆕 إذا كان الإذن مرفوضاً في أندرويد
        if (os === 'android' && permissionStatus === 'denied') {
            console.warn('⚠ الإذن مرفوض في أندرويد - عرض دليل الإعدادات');
            showAndroidSettingsGuide();
            showNotification('⚠ يرجى تفعيل الموقع من إعدادات Chrome');
            return null;
        }
        
        // 🆕 محاولة الحصول على الموقع
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
        console.error('❌ خطأ في تحديد الموقع:', error);
        
        // 🆕 معالجة خاصة لأندرويد عند الرفض
        if (os === 'android' && error.detailedMessage === 'PERMISSION_DENIED') {
            showAndroidSettingsGuide();
            showNotification('⚠ تم رفض الإذن - راجع إعدادات Chrome');
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

// ============================================
// 📍 نظام أيقونة الموقع في الأسفل
// ============================================
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
        locationIconBtn.title = '✓ تم تحديد موقعك';
    } else {
        locationIconBtn.classList.remove('located');
        locationIconBtn.title = 'تحديد الموقع';
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
    if (modal) {
        modal.style.display = 'none';
    }
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
            if (coordsP) {
                coordsP.textContent = `الإحداثيات: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
            }
        }
    } else {
        statusDiv.className = 'location-modal-status';
        textSpan.textContent = 'اضغط على "تحديد الموقع الآن" للمتابعة';
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

// ============================================
// 🆕 تهيئة نظام الموقع (بدون عرض النافذة تلقائياً)
// ============================================
async function initializeLocationSystem() {
    console.log('🔍 بدء تهيئة نظام الموقع...');
    
    // 1. محاولة جلب الموقع من التخزين المحلي
    const storedLocation = getLocationFromStorage();
    if (storedLocation) {
        userLocation = storedLocation;
        locationPermissionGranted = true;
        updateLocationIconStatus();
        updateLocationInCart();
        console.log('✅ تم استخدام الموقع المحفوظ');
        return;
    }
    
    // 🆕 2. لا تعرض النافذة تلقائياً - المستخدم يضغط على الأيقونة
    // هذا يتجنب مشاكل Android Chrome مع النوافذ المنبثقة التلقائية
    updateLocationIconStatus();
    updateLocationInCart();
}

// ============================================
// 🛒 دوال السلة
// ============================================
let shoppingCart = JSON.parse(localStorage.getItem('taloola_cart')) || [];

function saveCart() { localStorage.setItem('taloola_cart', JSON.stringify(shoppingCart)); updateCartUI(); }
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
        if (totalItems > 0) {
            cartCount.style.animation = 'none';
            setTimeout(() => { cartCount.style.animation = 'pulse 2s infinite'; }, 10);
        }
    }
}
function addToCart(name, price, quantity = 1) {
    const existingItem = shoppingCart.find(item => item.name === name);
    if (existingItem) existingItem.quantity += quantity;
    else shoppingCart.push({ name: name, price: parseInt(price), quantity: quantity });
    saveCart();
    showNotification(`✓ تم إضافة ${quantity} × ${name} إلى السلة`);
}
function removeFromCart(index) { shoppingCart.splice(index, 1); saveCart(); displayCartItems(); }
function changeQuantity(index, change) {
    shoppingCart[index].quantity += change;
    if (shoppingCart[index].quantity <= 0) shoppingCart.splice(index, 1);
    saveCart(); displayCartItems();
}
function clearCart() {
    if (shoppingCart.length === 0) { alert('السلة فارغة بالفعل!'); return; }
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
    if (!cartItemsContainer) return;
    updateLocationInCart();
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="empty-cart-message"><i class="fas fa-shopping-cart"></i><h3>السلة فارغة</h3><p>لم تضف أي منتجات بعد</p></div>`;
        if (cartTotalElement) cartTotalElement.textContent = '0';
        return;
    }
    cartItemsContainer.innerHTML = '';
    let total = 0;
    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price.toLocaleString('ar-EG')} د.ع × ${item.quantity} = ${itemTotal.toLocaleString('ar-EG')} د.ع</div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="changeQuantity(${index}, -1)"><i class="fas fa-minus"></i></button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${index}, 1)"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    if (cartTotalElement) cartTotalElement.textContent = total.toLocaleString('ar-EG');
}
function openCartModal() { const m = document.getElementById('cartModal'); if (m) { m.style.display = 'flex'; displayCartItems(); } }
function closeCartModal() { const m = document.getElementById('cartModal'); if (m) m.style.display = 'none'; }

// ============================================
// 📋 نافذة مراجعة الطلب
// ============================================
function showOrderReview() {
    if (shoppingCart.length === 0) { alert('السلة فارغة! الرجاء إضافة منتجات أولاً.'); return; }
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
    }

    const currentOrderAddress = sessionStorage.getItem('current_order_address');
    if (locationInput) {
        if (currentOrderAddress) locationInput.value = currentOrderAddress;
        else if (savedAddressText && !locationInput.value) locationInput.value = '';
    }

    reviewItemsContainer.innerHTML = '';
    let totalQuantity = 0; let totalAmount = 0;
    shoppingCart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        totalQuantity += item.quantity; totalAmount += itemTotal;
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

function closeOrderReview() { const m = document.getElementById('orderReviewModal'); if (m) m.style.display = 'none'; }

// ============================================
// 📱 إرسال الطلب عبر واتساب
// ============================================
function confirmAndSendOrder() {
    if (shoppingCart.length === 0) { alert('السلة فارغة!'); return; }
    
    const locationInput = document.getElementById('locationDescription');
    const addressText = locationInput ? locationInput.value.trim() : '';
    const saveForFuture = document.getElementById('saveLocationForFuture')?.checked ?? true;
    const gpsLocation = userLocation || getLocationFromStorage();

    if (!addressText && !gpsLocation) {
        alert('⚠ يجب عليك إما:\n• كتابة رقم القطاع أو اسم الحي\n• أو السماح بتحديد موقعك الجغرافي');
        if (locationInput) {
            locationInput.focus();
            locationInput.style.borderColor = '#dc3545';
            setTimeout(() => { locationInput.style.borderColor = ''; }, 2000);
        }
        return;
    }

    if (addressText && saveForFuture) {
        try { localStorage.setItem(LOCATION_TEXT_STORAGE_KEY, addressText); savedAddressText = addressText; } catch (error) {}
    }
    sessionStorage.setItem('current_order_address', addressText);

    const phoneNumber = '9647755666073';
    let message = 'مرحبا اريد طلب استلام من مطعم تعلولة\n';
    message += 'الطلب :\n';
    let totalAmount = 0;
    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        message += `\n${index + 1}.${item.name}`;
        message += `\nالكمية : ${item.quantity}`;
        message += `\nالسعر :${item.price}`;
        message += `\n`;
    });
    message += `\nالاجمالي : ${totalAmount}`;
    message += `\nالمجموع النهائي ${totalAmount}`;

    if (addressText) {
        message += `\n🏠 منطقة التوصيل (القطاع/الحي):`;
        message += `\n${addressText}`;
    }

    if (gpsLocation) {
        const mapUrl = gpsLocation.googleMapsUrl || `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`;
        message += `\n📍 الموقع على الخريطة:`;
        message += `\n${mapUrl}`;
    }

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    closeOrderReview();
    showNotification('✅ تم إرسال طلبك بنجاح!');

    setTimeout(() => {
        shoppingCart = []; saveCart();
        sessionStorage.removeItem('current_order_address');
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

function changeItemQuantity(button, change) {
    const menuCard = button.closest('.menu-item');
    const qtyInput = menuCard.querySelector('.qty-input');
    if (!qtyInput) return;
    
    let currentQty = parseInt(qtyInput.value) || 0;
    currentQty += change;
    
    if (currentQty < 0) currentQty = 0;
    if (currentQty > 99) {
        currentQty = 99;
        showNotification('الحد الأقصى للكمية هو 99');
    }
    
    qtyInput.value = currentQty;
    qtyInput.style.transform = 'scale(1.2)';
    setTimeout(() => { qtyInput.style.transform = 'scale(1)'; }, 200);
}

function openSupport() {
    window.open(`https://wa.me/9647755666073?text=${encodeURIComponent('أحتاج إلى مساعدة بخصوص...')}`, '_blank');
}
function closeAuthModal() { const m = document.getElementById('adminAuthModal'); if (m) m.style.display = 'none'; }
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

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const navButtons = document.querySelectorAll('nav.sections-nav button');
    const menuSections = document.querySelectorAll('section.menu-section');
    const menuItems = document.querySelectorAll('.menu-item');
    const cartIcon = document.getElementById('cartIcon');

    const getLocationBtn = document.getElementById('getLocationBtn');

    // 🆕 زر "تحديد الموقع الآن" - يطلب الإذن في كل مرة
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await requestLocationAndUpdate();
        });
    }

    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) scrollToTopBtn.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
    });
    if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

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

    function addTouchClickHandler(element, callback) {
        let touchHandled = false;
        element.addEventListener('touchstart', function() { touchHandled = false; }, { passive: true });
        element.addEventListener('touchend', function(e) {
            if (!touchHandled) { touchHandled = true; e.preventDefault(); callback.call(this, e); }
        }, { passive: false });
        element.addEventListener('click', function(e) {
            if (!touchHandled) callback.call(this, e);
            touchHandled = false;
        });
    }

    menuItems.forEach(item => {
        const decreaseBtn = item.querySelector('.qty-decrease');
        const increaseBtn = item.querySelector('.qty-increase');
        const qtyInput = item.querySelector('.qty-input');
        const addToCartBtn = item.querySelector('.add-to-cart-btn');

        if (decreaseBtn) addTouchClickHandler(decreaseBtn, function(e) { e.preventDefault(); e.stopPropagation(); changeItemQuantity(this, -1); });
        if (increaseBtn) addTouchClickHandler(increaseBtn, function(e) { e.preventDefault(); e.stopPropagation(); changeItemQuantity(this, 1); });
        
        if (addToCartBtn) {
            addTouchClickHandler(addToCartBtn, function(e) {
                e.preventDefault();
                e.stopPropagation();
                const itemName = item.getAttribute('data-name');
                const itemPrice = item.getAttribute('data-price');
                const quantity = parseInt(qtyInput.value) || 0;
                
                if (quantity === 0) {
                    showNotification('⚠ الرجاء زيادة الكمية أولاً');
                    return;
                }
                
                if (itemName && itemPrice) {
                    addToCart(itemName, itemPrice, quantity);
                    this.classList.add('added');
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> تم الإضافة';
                    setTimeout(() => {
                        this.classList.remove('added');
                        this.innerHTML = originalHTML;
                        qtyInput.value = 0;
                    }, 1500);
                }
            });
        }
    });

    if (cartIcon) addTouchClickHandler(cartIcon, function(e) { e.preventDefault(); openCartModal(); });

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    menuSections.forEach(s => observer.observe(s));
    document.querySelectorAll('section.info-section').forEach(s => observer.observe(s));

    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('cartModal')) closeCartModal();
        if (event.target === document.getElementById('orderReviewModal')) closeOrderReview();
        if (event.target === document.getElementById('locationModal')) closeLocationModal();
        if (event.target === document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'none';
        if (event.target === document.getElementById('adminAuthModal')) closeAuthModal();
    });

    updateCartUI();
    initLocationIcon();
    initializeLocationSystem();

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
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

function loadCurrentAds() {
    const currentAds = document.getElementById('currentAds');
    if (!currentAds) return;
    currentAds.innerHTML = '<p>جاري تحميل الإعلانات...</p>';
    if (typeof firebase === 'undefined' || !firebase.database) { currentAds.innerHTML = '<p>Firebase غير متوفر</p>'; return; }
    firebase.database().ref('ads/').orderByChild('timestamp').once('value').then((snapshot) => {
        const ads = snapshot.val();
        if (!ads) { currentAds.innerHTML = '<p>لا توجد إعلانات حالية</p>'; return; }
        currentAds.innerHTML = '';
        Object.keys(ads).reverse().forEach((key) => {
            const ad = ads[key];
            const adElement = document.createElement('div');
            adElement.className = 'ad-card';
            adElement.innerHTML = `
                ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}"></div>` : ''}
                <h4>${ad.title}</h4><p>${ad.description}</p>
                ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                ${ad.duration ? `<p class="ad-duration">${ad.duration}</p>` : ''}
                <p><small>تم الإنشاء: ${ad.date || new Date(ad.timestamp).toLocaleDateString('ar-EG')}</small></p>
                <div class="ad-actions"><button onclick="deleteAd('${key}', '${ad.imageUrl}')"><i class="fas fa-trash"></i> حذف</button></div>
            `;
            currentAds.appendChild(adElement);
        });
    }).catch(() => currentAds.innerHTML = '<p>حدث خطأ أثناء تحميل الإعلانات</p>');
}

function displayAds() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    if (typeof firebase === 'undefined' || !firebase.database) { adsContainer.innerHTML = '<p class="no-ads">Firebase غير متوفر</p>'; return; }
    adsContainer.innerHTML = '<p class="no-ads">جاري تحميل العروض...</p>';
    firebase.database().ref('ads/').orderByChild('timestamp').once('value').then((snapshot) => {
        const ads = snapshot.val();
        if (!ads) { adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>'; return; }
        adsContainer.innerHTML = '';
        Object.keys(ads).reverse().forEach((key) => {
            const ad = ads[key];
            const adElement = document.createElement('div');
            adElement.className = `ad-card ${ad.template || 'red'}`;
            adElement.innerHTML = `
                ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}"></div>` : ''}
                <h4>${ad.title}</h4><p>${ad.description}</p>
                ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                ${ad.duration ? `<p class="ad-duration">${ad.duration}</p>` : ''}
            `;
            adsContainer.appendChild(adElement);
        });
    }).catch(() => adsContainer.innerHTML = '<p class="no-ads">حدث خطأ أثناء تحميل الإعلانات</p>');
}

function createAd() {
    const title = document.getElementById('adTitle').value;
    const description = document.getElementById('adDescription').value;
    const price = document.getElementById('adPrice').value;
    const duration = document.getElementById('adDuration').value;
    const template = document.getElementById('adTemplate').value;
    const imageFile = document.getElementById('adImage').files[0];
    if (!title || !description) { alert('الرجاء ملء الحقول الإلزامية'); return; }
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
        alert('تم إنشاء الإعلان بنجاح!');
        clearAdForm(); loadCurrentAds(); displayAds();
    }).catch((error) => alert('حدث خطأ: ' + error.message));
}

function deleteAd(key, imageUrl) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    if (typeof firebase === 'undefined' || !firebase.database) { alert('Firebase غير متوفر'); return; }
    const database = firebase.database();
    const storage = firebase.storage();
    database.ref('ads/' + key).remove().then(() => {
        if (imageUrl) return storage.refFromURL(imageUrl).delete();
        return Promise.resolve();
    }).then(() => { alert('تم حذف الإعلان بنجاح'); loadCurrentAds(); displayAds(); })
    .catch(() => alert('حدث خطأ أثناء حذف الإعلان'));
}

function clearAdForm() {
    ['adTitle', 'adDescription', 'adPrice', 'adDuration'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const adTemplate = document.getElementById('adTemplate'); if (adTemplate) adTemplate.value = 'red';
    const adImage = document.getElementById('adImage'); if (adImage) adImage.value = '';
    const imagePreview = document.getElementById('imagePreview'); if (imagePreview) imagePreview.innerHTML = '<span>معاينة الصورة</span>';
}

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginSubmit = document.getElementById('adminLoginSubmit');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminAuthModal = document.getElementById('adminAuthModal');

    if (adminLoginBtn) adminLoginBtn.addEventListener('click', () => { if (adminAuthModal) adminAuthModal.style.display = 'flex'; });
    if (adminLoginSubmit) adminLoginSubmit.addEventListener('click', () => {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            if (adminAuthModal) adminAuthModal.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'flex';
            loadCurrentAds();
        } else alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    });
    if (closeAdminPanel) closeAdminPanel.addEventListener('click', () => { if (adminPanel) adminPanel.style.display = 'none'; });
});

// تصدير الدوال العامة
window.addToCart = addToCart; window.removeFromCart = removeFromCart; window.changeQuantity = changeQuantity;
window.clearCart = clearCart; window.openCartModal = openCartModal; window.closeCartModal = closeCartModal;
window.showOrderReview = showOrderReview; window.closeOrderReview = closeOrderReview; window.confirmAndSendOrder = confirmAndSendOrder;
window.openSupport = openSupport; window.closeAuthModal = closeAuthModal; window.previewImage = previewImage;
window.createAd = createAd; window.deleteAd = deleteAd; window.loadCurrentAds = loadCurrentAds; window.displayAds = displayAds;
window.requestLocationAndUpdate = requestLocationAndUpdate; window.closeLocationModal = closeLocationModal;
