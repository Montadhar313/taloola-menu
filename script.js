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
const CUSTOMER_PHONE_KEY = 'taloola_saved_phone';
const DELIVERY_AREA_KEY = 'taloola_saved_area';

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
// 🛒 دوال السلة (مُحدّثة للسلة الجديدة)
// ============================================
let shoppingCart = JSON.parse(localStorage.getItem('taloola_cart')) || [];

function saveCart() {
    localStorage.setItem('taloola_cart', JSON.stringify(shoppingCart));
    updateCartUI();
}

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
    updateCartVisibility();
}

function updateCartVisibility() {
    const cartIcon = document.getElementById('cartIcon');
    if (!cartIcon) return;
    if (shoppingCart.length === 0) cartIcon.classList.add('empty');
    else cartIcon.classList.remove('empty');
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

// ============================================
// 🛒 عرض عناصر السلة (التصميم الجديد)
// ============================================
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
    
    if (cartTotalElement) {
        cartTotalElement.textContent = `${total.toLocaleString('ar-EG')} د.ع`;
    }
    if (cartItemsCount) {
        cartItemsCount.textContent = totalQuantity;
    }
}

// ============================================
// 📞 تحميل البيانات المحفوظة للزبون
// ============================================
function loadSavedCustomerInfo() {
    const phoneInput = document.getElementById('customerPhone');
    const areaSelect = document.getElementById('deliveryArea');
    const detailedInput = document.getElementById('detailedAddress');
    
    try {
        const savedPhone = localStorage.getItem(CUSTOMER_PHONE_KEY);
        const savedArea = localStorage.getItem(DELIVERY_AREA_KEY);
        const savedDetailed = localStorage.getItem('taloola_saved_detailed');
        
        if (savedPhone && phoneInput && !phoneInput.value) {
            phoneInput.value = savedPhone;
        }
        
        if (savedArea && areaSelect && !areaSelect.value) {
            const options = Array.from(areaSelect.options).map(o => o.value);
            if (options.includes(savedArea)) {
                areaSelect.value = savedArea;
            }
        }
        
        if (savedDetailed && detailedInput && !detailedInput.value) {
            detailedInput.value = savedDetailed;
        }
    } catch (e) {
        console.warn('تعذر تحميل البيانات المحفوظة:', e);
    }
}

function openCartModal() {
    const m = document.getElementById('cartModal');
    if (m) {
        m.style.display = 'flex';
        displayCartItems();
        loadSavedCustomerInfo();
        
        // إزالة حالات الخطأ السابقة
        ['customerPhone', 'deliveryArea'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('error');
        });
    }
}

function closeCartModal() {
    const m = document.getElementById('cartModal');
    if (m) m.style.display = 'none';
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
    document.getElementById('productModalImage').src = image;
    document.getElementById('productModalImage').alt = name;
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
// 📋 نافذة مراجعة الطلب (اختيارية)
// ============================================
function showOrderReview() {
    if (shoppingCart.length === 0) { alert('السلة فارغة!'); return; }
    // في التصميم الجديد، نرسل الطلب مباشرة من السلة
    confirmAndSendOrder();
}

function closeOrderReview() {
    const m = document.getElementById('orderReviewModal');
    if (m) m.style.display = 'none';
}

// ============================================
// ✅ التحقق من صحة رقم الهاتف العراقي
// ============================================
function validateIraqiPhone(phone) {
    // يقبل الأرقام التي تبدأ بـ 07 وتتكون من 11 رقم
    const phoneRegex = /^07[0-9]{9}$/;
    return phoneRegex.test(phone);
}

// ============================================
// 📱 إرسال الطلب عبر واتساب (مُحدّثة)
// ============================================
function confirmAndSendOrder() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة! الرجاء إضافة منتجات أولاً.');
        return;
    }
    
    // جلب البيانات من الحقول الجديدة
    const phoneInput = document.getElementById('customerPhone');
    const areaSelect = document.getElementById('deliveryArea');
    const detailedInput = document.getElementById('detailedAddress');
    
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const area = areaSelect ? areaSelect.value.trim() : '';
    const detailed = detailedInput ? detailedInput.value.trim() : '';
    
    // إزالة حالات الخطأ السابقة
    [phoneInput, areaSelect].forEach(el => {
        if (el) el.classList.remove('error');
    });
    
    // التحقق من الحقول الإلزامية
    let hasError = false;
    let firstErrorElement = null;
    
    if (!phone) {
        if (phoneInput) {
            phoneInput.classList.add('error');
            firstErrorElement = phoneInput;
        }
        showNotification('⚠ الرجاء إدخال رقم الهاتف');
        hasError = true;
    } else if (!validateIraqiPhone(phone)) {
        if (phoneInput) {
            phoneInput.classList.add('error');
            firstErrorElement = phoneInput;
        }
        showNotification('⚠ رقم الهاتف غير صحيح (يجب أن يبدأ بـ 07 ويتكون من 11 رقم)');
        hasError = true;
    }
    
    if (!area) {
        if (areaSelect) {
            areaSelect.classList.add('error');
            if (!firstErrorElement) firstErrorElement = areaSelect;
        }
        if (!hasError) showNotification('⚠ الرجاء اختيار منطقة التوصيل');
        hasError = true;
    }
    
    if (hasError) {
        if (firstErrorElement) {
            firstErrorElement.focus();
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // حفظ البيانات للطلبات القادمة
    try {
        localStorage.setItem(CUSTOMER_PHONE_KEY, phone);
        localStorage.setItem(DELIVERY_AREA_KEY, area);
        if (detailed) {
            localStorage.setItem('taloola_saved_detailed', detailed);
        }
    } catch (e) {
        console.warn('تعذر حفظ البيانات:', e);
    }
    
    const phoneNumber = '9647755666073';
    let message = 'مرحبا اريد طلب استلام من مطعم تعلولة\n\n';
    
    // معلومات الزبون
    message += `📞 رقم الهاتف: ${phone}\n`;
    message += `📍 منطقة التوصيل: ${area}\n`;
    if (detailed) {
        message += `🏠 العنوان التفصيلي: ${detailed}\n`;
    }
    
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
    
    // إضافة الموقع الجغرافي إذا كان متاحاً
    const gpsLocation = userLocation || getLocationFromStorage();
    if (gpsLocation) {
        const mapUrl = gpsLocation.googleMapsUrl || 
            `https://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`;
        message += `\n\n📍 الموقع على الخريطة:`;
        message += `\n${mapUrl}`;
    }
    
    // إرسال عبر واتساب
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // إغلاق السلة وتنظيف البيانات
    closeCartModal();
    showNotification('✅ تم إرسال طلبك بنجاح!');
    
    setTimeout(() => {
        shoppingCart = [];
        saveCart();
        // تنظيف الحقول بعد الإرسال
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

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const navButtons = document.querySelectorAll('nav.sections-nav button');
    const menuSections = document.querySelectorAll('section.menu-section');
    const menuItems = document.querySelectorAll('.menu-item');
    const cartIcon = document.getElementById('cartIcon');
    const getLocationBtn = document.getElementById('getLocationBtn');

    // 🛍️ ربط النقر على بطاقات المنتجات
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            openProductModal(this);
        });
    });

    // 🛍️ ربط أزرار نافذة المنتج
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

    // 🎯 التحكم بظهور زر الرجوع لأعلى (باستخدام class)
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

    // 🔄 شريط التنقل - التمرير التلقائي للزر النشط
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = document.getElementById(this.getAttribute('data-section'));
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                menuSections.forEach(s => s.classList.remove('active'));
                targetSection.classList.add('active');
                
                // تحديث الأزرار النشطة
                navButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'var(--main-yellow)';
                });
                this.classList.add('active');
                this.style.background = '#ffffff';
                
                // 🔄 التمرير الأفقي التلقائي للزر النشط
                this.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'center'
                });
            }
        });
    });

    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }

    // تأثيرات الظهور عند التمرير
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => { 
            if (entry.isIntersecting) entry.target.classList.add('animate-in'); 
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    menuSections.forEach(s => observer.observe(s));
    document.querySelectorAll('section.info-section').forEach(s => observer.observe(s));

    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('cartModal')) closeCartModal();
        if (event.target === document.getElementById('orderReviewModal')) closeOrderReview();
        if (event.target === document.getElementById('locationModal')) closeLocationModal();
        if (event.target === document.getElementById('productModal')) closeProductModal();
        if (event.target === document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'none';
        if (event.target === document.getElementById('adminAuthModal')) closeAuthModal();
    });

    // 📱 تهيئة حقول الإدخال (منع الأحرف في حقل الرقم)
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // السماح بالأرقام فقط
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        // إزالة حالة الخطأ عند الكتابة
        phoneInput.addEventListener('input', function() {
            this.classList.remove('error');
        });
    }
    
    const areaSelect = document.getElementById('deliveryArea');
    if (areaSelect) {
        areaSelect.addEventListener('change', function() {
            this.classList.remove('error');
        });
    }

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
    if (typeof firebase === 'undefined' || !firebase.database) { 
        currentAds.innerHTML = '<p>Firebase غير متوفر</p>'; 
        return; 
    }
    firebase.database().ref('ads/').orderByChild('timestamp').once('value').then((snapshot) => {
        const ads = snapshot.val();
        if (!ads) { currentAds.innerHTML = '<p>لا توجد إعلانات</p>'; return; }
        currentAds.innerHTML = '';
        Object.keys(ads).reverse().forEach((key) => {
            const ad = ads[key];
            const adElement = document.createElement('div');
            adElement.className = 'ad-card';
            adElement.innerHTML = `
                ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}"></div>` : ''}
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
    if (typeof firebase === 'undefined' || !firebase.database) { 
        adsContainer.innerHTML = '<p class="no-ads">Firebase غير متوفر</p>'; 
        return; 
    }
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
                ${ad.imageUrl ? `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}"></div>` : ''}
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
    if (typeof firebase === 'undefined' || !firebase.storage || !firebase.database) { 
        alert('Firebase غير متوفر'); 
        return; 
    }

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
    if (typeof firebase === 'undefined' || !firebase.database) { 
        alert('Firebase غير متوفر'); 
        return; 
    }
    const database = firebase.database();
    const storage = firebase.storage();
    database.ref('ads/' + key).remove().then(() => {
        if (imageUrl) return storage.refFromURL(imageUrl).delete();
        return Promise.resolve();
    }).then(() => { 
        alert('تم الحذف'); 
        loadCurrentAds(); 
        displayAds(); 
    }).catch(() => alert('خطأ'));
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

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginSubmit = document.getElementById('adminLoginSubmit');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminAuthModal = document.getElementById('adminAuthModal');

    if (adminLoginBtn) adminLoginBtn.addEventListener('click', () => {
        if (adminAuthModal) adminAuthModal.style.display = 'flex';
    });
    if (adminLoginSubmit) adminLoginSubmit.addEventListener('click', () => {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            if (adminAuthModal) adminAuthModal.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'flex';
            loadCurrentAds();
        } else alert('بيانات خاطئة');
    });
    if (closeAdminPanel) closeAdminPanel.addEventListener('click', () => {
        if (adminPanel) adminPanel.style.display = 'none';
    });
});

// ============================================
// تصدير الدوال العامة
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
window.loadSavedCustomerInfo = loadSavedCustomerInfo;
window.validateIraqiPhone = validateIraqiPhone;