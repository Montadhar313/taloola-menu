// ============================================
// 🎯 نظام النافذة العائمة القابلة للسحب (جديد)
// ============================================
const LOCATION_BAR_POSITION_KEY = 'taloola_location_bar_position';
const DEFAULT_POSITION = { top: '70px', right: '20px', left: 'auto', bottom: 'auto' };

// ============================================
// 🔄 متغيرات شريط التنقل القابل للإخفاء (جديد)
// ============================================
const NAV_COLLAPSED_KEY = 'taloola_nav_collapsed';
let isNavCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === 'true';

function saveBarPosition(position) {
    try { localStorage.setItem(LOCATION_BAR_POSITION_KEY, JSON.stringify(position)); } catch (error) {}
}
function getBarPosition() {
    try {
        const saved = localStorage.getItem(LOCATION_BAR_POSITION_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_POSITION;
    } catch (error) { return DEFAULT_POSITION; }
}
function applyBarPosition(position) {
    const bar = document.getElementById('locationBar');
    if (!bar) return;
    bar.style.top = position.top; bar.style.right = position.right;
    bar.style.left = position.left; bar.style.bottom = position.bottom;
}
function resetBarPosition() {
    applyBarPosition(DEFAULT_POSITION); saveBarPosition(DEFAULT_POSITION);
    showNotification('✅ تم إعادة النافذة للموقع الأصلي');
}

function initDraggableBar() {
    const bar = document.getElementById('locationBar');
    if (!bar) return;
    applyBarPosition(getBarPosition());
    let isDragging = false, startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    bar.addEventListener('mousedown', function(e) {
        if (e.target.closest('button') || e.target.tagName === 'BUTTON') return;
        isDragging = true; bar.classList.add('dragging');
        const rect = bar.getBoundingClientRect();
        startX = e.clientX; startY = e.clientY;
        initialLeft = rect.left; initialTop = rect.top;
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        let newLeft = initialLeft + (e.clientX - startX);
        let newTop = initialTop + (e.clientY - startY);
        const barRect = bar.getBoundingClientRect();
        newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - barRect.width - 10));
        newTop = Math.max(10, Math.min(newTop, window.innerHeight - barRect.height - 10));
        bar.style.left = newLeft + 'px'; bar.style.top = newTop + 'px';
        bar.style.right = 'auto'; bar.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false; bar.classList.remove('dragging');
        const rect = bar.getBoundingClientRect();
        saveBarPosition({ top: rect.top + 'px', left: rect.left + 'px', right: 'auto', bottom: 'auto' });
    });

    bar.addEventListener('touchstart', function(e) {
        if (e.target.closest('button') || e.target.tagName === 'BUTTON') return;
        isDragging = true; bar.classList.add('dragging');
        const touch = e.touches[0]; const rect = bar.getBoundingClientRect();
        startX = touch.clientX; startY = touch.clientY;
        initialLeft = rect.left; initialTop = rect.top;
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const touch = e.touches[0];
        let newLeft = initialLeft + (touch.clientX - startX);
        let newTop = initialTop + (touch.clientY - startY);
        const barRect = bar.getBoundingClientRect();
        newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - barRect.width - 10));
        newTop = Math.max(10, Math.min(newTop, window.innerHeight - barRect.height - 10));
        bar.style.left = newLeft + 'px'; bar.style.top = newTop + 'px';
        bar.style.right = 'auto'; bar.style.bottom = 'auto';
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false; bar.classList.remove('dragging');
        const rect = bar.getBoundingClientRect();
        saveBarPosition({ top: rect.top + 'px', left: rect.left + 'px', right: 'auto', bottom: 'auto' });
    });

    const resetBtn = document.getElementById('resetPositionBtn');
    if (resetBtn) resetBtn.addEventListener('click', function(e) { e.preventDefault(); resetBarPosition(); });
}

// ============================================
// 📍 نظام تحديد الموقع الجغرافي
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
            latitude: location.latitude, longitude: location.longitude, timestamp: Date.now(),
            googleMapsUrl: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
        return locationData;
    } catch (error) { return null; }
}

function saveNavState(collapsed) {
    try { localStorage.setItem(NAV_COLLAPSED_KEY, collapsed.toString()); isNavCollapsed = collapsed; } catch (error) {}
}
function applyNavState() {
    const nav = document.getElementById('sectionsNav');
    const toggleBtn = document.getElementById('toggleNavBtn');
    const toggleIcon = document.getElementById('toggleNavIcon');
    const toggleText = document.getElementById('toggleNavText');
    const restoreBtn = document.getElementById('restoreNavBtn');
    if (!nav || !toggleBtn) return;
    if (isNavCollapsed) {
        nav.classList.add('collapsed'); toggleBtn.style.display = 'none'; restoreBtn.style.display = 'flex';
        if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';
        if (toggleText) toggleText.textContent = 'إظهار القائمة';
    } else {
        nav.classList.remove('collapsed'); toggleBtn.style.display = 'flex'; restoreBtn.style.display = 'none';
        if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
        if (toggleText) toggleText.textContent = 'تصغير القائمة';
    }
}
function toggleNavigation() {
    isNavCollapsed = !isNavCollapsed; saveNavState(isNavCollapsed); applyNavState();
    showNotification(isNavCollapsed ? '✓ تم تصغير قائمة الأصناف' : '✓ تم إظهار قائمة الأصناف');
}
function initToggleNavigation() {
    const toggleBtn = document.getElementById('toggleNavBtn');
    const restoreBtn = document.getElementById('restoreNavBtn');
    applyNavState();
    if (toggleBtn) toggleBtn.addEventListener('click', function(e) { e.preventDefault(); toggleNavigation(); });
    if (restoreBtn) restoreBtn.addEventListener('click', function(e) { e.preventDefault(); toggleNavigation(); });
}

function getLocationFromStorage() {
    try {
        const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (storedLocation) {
            const locationData = JSON.parse(storedLocation);
            if (Date.now() - locationData.timestamp < (7 * 24 * 60 * 60 * 1000)) return locationData;
            else localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
        return null;
    } catch (error) { return null; }
}

function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('المتصفح لا يدعم تحديد الموقع'));
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
            (error) => {
                let msg = 'خطأ في تحديد الموقع';
                if (error.code === error.PERMISSION_DENIED) msg = 'تم رفض إذن تحديد الموقع';
                else if (error.code === error.POSITION_UNAVAILABLE) msg = 'معلومات الموقع غير متوفرة';
                else if (error.code === error.TIMEOUT) msg = 'انتهت مهلة طلب الموقع';
                reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    });
}

function updateLocationBar(status, message) {
    const locationBar = document.getElementById('locationBar');
    const locationStatus = document.getElementById('locationStatus');
    const locationText = document.getElementById('locationText');
    if (!locationBar || !locationStatus || !locationText) return;
    locationStatus.classList.remove('success', 'error', 'loading');
    if (status === 'loading') { locationStatus.classList.add('loading'); locationText.textContent = message || 'جاري تحديد موقعك...'; }
    else if (status === 'success') { locationStatus.classList.add('success'); locationText.textContent = message || 'تم تحديد موقعك ✓'; }
    else if (status === 'error') { locationStatus.classList.add('error'); locationText.textContent = message || 'فشل تحديد الموقع'; }
}

function updateLocationInCart() {
    const badge = document.getElementById('locationStatusBadge');
    const text = document.getElementById('locationStatusText');
    if (!badge || !text) return;
    badge.classList.remove('success', 'error', 'warning');
    if (userLocation || getLocationFromStorage()) {
        badge.classList.add('success'); text.textContent = '✓ الموقع محدد';
    } else {
        badge.classList.add('warning'); text.textContent = '⚠ الموقع غير محدد';
    }
}

async function requestLocationAndUpdate() {
    try {
        updateLocationBar('loading', 'جاري تحديد موقعك...');
        const location = await requestLocationPermission();
        userLocation = saveLocationToStorage(location);
        locationPermissionGranted = true;
        localStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
        updateLocationBar('success', 'تم تحديد موقعك ✓');
        updateLocationInCart();
        showNotification('✅ تم تحديد موقعك بنجاح');
    } catch (error) {
        updateLocationBar('error', 'فشل تحديد الموقع');
        if (error.message.includes('رفض')) localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
        showNotification('⚠ ' + error.message);
    }
}

async function initializeLocationSystem() {
    const savedPermission = localStorage.getItem(LOCATION_PERMISSION_KEY);
    const storedLocation = getLocationFromStorage();
    if (storedLocation) {
        userLocation = storedLocation; locationPermissionGranted = true;
        updateLocationBar('success', 'تم تحديد موقعك ✓'); updateLocationInCart();
        return;
    }
    if (savedPermission !== 'denied') {
        const modal = document.getElementById('locationPermissionModal');
        if (modal) modal.style.display = 'flex';
    } else {
        updateLocationBar('error', 'الموقع غير متاح'); updateLocationInCart();
    }
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
        if (totalItems > 0) { cartCount.style.animation = 'none'; setTimeout(() => cartCount.style.animation = 'pulse 2s infinite', 10); }
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
    if (confirm('هل أنت متأكد من تفريغ السلة؟')) { shoppingCart = []; saveCart(); displayCartItems(); showNotification('✓ تم تفريغ السلة'); }
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
        if (locationInput) { locationInput.focus(); locationInput.style.borderColor = '#dc3545'; setTimeout(() => locationInput.style.borderColor = '', 2000); }
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

// 🆕 دالة تعديل الكمية داخل المنتج (تدعم الصفر)
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
        apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU", authDomain: "talola-food.firebaseapp.com",
        databaseURL: "https://talola-food-default-rtdb.firebaseio.com", projectId: "talola-food",
        storageBucket: "talola-food.firebasestorage.app", messagingSenderId: "440585170470",
        appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7", measurementId: "G-L4SLHVVFVR"
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

    const allowLocationBtn = document.getElementById('allowLocationBtn');
    const denyLocationBtn = document.getElementById('denyLocationBtn');
    const refreshLocationBtn = document.getElementById('refreshLocationBtn');
    const updateLocationFromCartBtn = document.getElementById('updateLocationFromCartBtn');

    if (allowLocationBtn) allowLocationBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        document.getElementById('locationPermissionModal').style.display = 'none';
        await requestLocationAndUpdate();
    });
    if (denyLocationBtn) denyLocationBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('locationPermissionModal').style.display = 'none';
        localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
        updateLocationBar('error', 'تم رفض الموقع');
        updateLocationInCart();
        showNotification('⚠ تم رفض تحديد الموقع');
    });
    if (refreshLocationBtn) refreshLocationBtn.addEventListener('click', async function(e) { e.preventDefault(); await requestLocationAndUpdate(); });
    if (updateLocationFromCartBtn) updateLocationFromCartBtn.addEventListener('click', async function(e) { e.preventDefault(); await requestLocationAndUpdate(); });

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
                
                // 🆕 منع الإضافة إذا كانت الكمية 0
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
                        qtyInput.value = 0; // 🆕 إعادة العداد إلى 0 بعد الإضافة
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
        if (event.target === document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'none';
        if (event.target === document.getElementById('adminAuthModal')) closeAuthModal();
    });

    updateCartUI();
    initDraggableBar();
    initToggleNavigation();
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
window.requestLocationAndUpdate = requestLocationAndUpdate; window.toggleNavigation = toggleNavigation;
