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
/**
 * حفظ موقع النافذة في التخزين المحلي
 */
function saveBarPosition(position) {
    try {
        localStorage.setItem(LOCATION_BAR_POSITION_KEY, JSON.stringify(position));
        console.log('✅ تم حفظ موقع النافذة');
    } catch (error) {
        console.error('خطأ في حفظ موقع النافذة:', error);
    }
}

/**
 * جلب موقع النافذة من التخزين المحلي
 */
function getBarPosition() {
    try {
        const saved = localStorage.getItem(LOCATION_BAR_POSITION_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_POSITION;
    } catch (error) {
        console.error('خطأ في جلب موقع النافذة:', error);
        return DEFAULT_POSITION;
    }
}

/**
 * تطبيق موقع النافذة
 */
function applyBarPosition(position) {
    const bar = document.getElementById('locationBar');
    if (!bar) return;
    
    bar.style.top = position.top;
    bar.style.right = position.right;
    bar.style.left = position.left;
    bar.style.bottom = position.bottom;
}

/**
 * إعادة النافذة للموقع الأصلي
 */
function resetBarPosition() {
    applyBarPosition(DEFAULT_POSITION);
    saveBarPosition(DEFAULT_POSITION);
    showNotification('✅ تم إعادة النافذة للموقع الأصلي');
    
    // تأثير بصري
    const bar = document.getElementById('locationBar');
    if (bar) {
        bar.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        setTimeout(() => {
            bar.style.transition = '';
        }, 500);
    }
}

/**
 * تهيئة نظام السحب للنافذة العائمة
 */
function initDraggableBar() {
    const bar = document.getElementById('locationBar');
    if (!bar) return;
    
    // تطبيق الموقع المحفوظ
    const savedPosition = getBarPosition();
    applyBarPosition(savedPosition);
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    
    // ============================================
    // 🖱️ أحداث الماوس (للكمبيوتر)
    // ============================================
    
    bar.addEventListener('mousedown', function(e) {
        // منع السحب إذا كان النقر على الأزرار
        if (e.target.closest('button') || e.target.tagName === 'BUTTON') {
            return;
        }
        
        isDragging = true;
        bar.classList.add('dragging');
        
        const rect = bar.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        
        // منع الخروج من الشاشة
        const barRect = bar.getBoundingClientRect();
        const maxX = window.innerWidth - barRect.width;
        const maxY = window.innerHeight - barRect.height;
        
        newLeft = Math.max(10, Math.min(newLeft, maxX - 10));
        newTop = Math.max(10, Math.min(newTop, maxY - 10));
        
        bar.style.left = newLeft + 'px';
        bar.style.top = newTop + 'px';
        bar.style.right = 'auto';
        bar.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        
        isDragging = false;
        bar.classList.remove('dragging');
        
        // حفظ الموقع الجديد
        const rect = bar.getBoundingClientRect();
        const newPosition = {
            top: rect.top + 'px',
            left: rect.left + 'px',
            right: 'auto',
            bottom: 'auto'
        };
        saveBarPosition(newPosition);
    });
    
    // ============================================
    // 📱 أحداث اللمس (للهاتف)
    // ============================================
    
    bar.addEventListener('touchstart', function(e) {
        // منع السحب إذا كان اللمس على الأزرار
        if (e.target.closest('button') || e.target.tagName === 'BUTTON') {
            return;
        }
        
        isDragging = true;
        bar.classList.add('dragging');
        
        const touch = e.touches[0];
        const rect = bar.getBoundingClientRect();
        startX = touch.clientX;
        startY = touch.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        
        // منع التمرير أثناء السحب
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        
        // منع الخروج من الشاشة
        const barRect = bar.getBoundingClientRect();
        const maxX = window.innerWidth - barRect.width;
        const maxY = window.innerHeight - barRect.height;
        
        newLeft = Math.max(10, Math.min(newLeft, maxX - 10));
        newTop = Math.max(10, Math.min(newTop, maxY - 10));
        
        bar.style.left = newLeft + 'px';
        bar.style.top = newTop + 'px';
        bar.style.right = 'auto';
        bar.style.bottom = 'auto';
        
        // منع التمرير أثناء السحب
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        
        isDragging = false;
        bar.classList.remove('dragging');
        
        // حفظ الموقع الجديد
        const rect = bar.getBoundingClientRect();
        const newPosition = {
            top: rect.top + 'px',
            left: rect.left + 'px',
            right: 'auto',
            bottom: 'auto'
        };
        saveBarPosition(newPosition);
    });
    
    // ============================================
    // 🔄 زر إعادة الموقع الأصلي
    // ============================================
    
    const resetBtn = document.getElementById('resetPositionBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            resetBarPosition();
        });
    }
    
    console.log('✅ تم تهيئة نظام السحب للنافذة العائمة');
}

// ============================================
// 📍 نظام تحديد الموقع الجغرافي (جديد)
// ============================================

// متغيرات الموقع
let userLocation = null;
let locationPermissionGranted = false;

// مفاتيح التخزين المحلي
const LOCATION_STORAGE_KEY = 'taloola_user_location';
const LOCATION_PERMISSION_KEY = 'taloola_location_permission';
// ============================================
// 📝 متغيرات العنوان التفصيلي (جديد)
// ============================================

const LOCATION_TEXT_STORAGE_KEY = 'taloola_saved_address';
let savedAddressText = localStorage.getItem(LOCATION_TEXT_STORAGE_KEY) || '';

// ============================================
// دوال الموقع الجغرافي
// ============================================

/**
 * حفظ الموقع في التخزين المحلي
 */
function saveLocationToStorage(location) {
    try {
        const locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: Date.now(),
            googleMapsUrl: generateGoogleMapsUrl(location.latitude, location.longitude)
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
        console.log('✅ تم حفظ الموقع في التخزين المحلي');
        return locationData;
    } catch (error) {
        console.error('خطأ في حفظ الموقع:', error);
        return null;
    }
}
// ============================================
// 🔄 دوال شريط التنقل القابل للإخفاء (جديد)
// ============================================

/**
 * حفظ حالة شريط التنقل في التخزين المحلي
 */
function saveNavState(collapsed) {
    try {
        localStorage.setItem(NAV_COLLAPSED_KEY, collapsed.toString());
        isNavCollapsed = collapsed;
        console.log(`✅ تم حفظ حالة التنقل: ${collapsed ? 'مخفي' : 'ظاهر'}`);
    } catch (error) {
        console.error('خطأ في حفظ حالة التنقل:', error);
    }
}

/**
 * تطبيق حالة شريط التنقل على العناصر
 */
function applyNavState() {
    const nav = document.getElementById('sectionsNav');
    const toggleBtn = document.getElementById('toggleNavBtn');
    const toggleIcon = document.getElementById('toggleNavIcon');
    const toggleText = document.getElementById('toggleNavText');
    const restoreBtn = document.getElementById('restoreNavBtn');
    
    if (!nav || !toggleBtn) return;
    
    if (isNavCollapsed) {
        // حالة الإخفاء
        nav.classList.add('collapsed');
        toggleBtn.style.display = 'none';
        restoreBtn.style.display = 'flex';
        
        if (toggleIcon) toggleIcon.className = 'fas fa-chevron-down';
        if (toggleText) toggleText.textContent = 'إظهار القائمة';
    } else {
        // حالة الظهور
        nav.classList.remove('collapsed');
        toggleBtn.style.display = 'flex';
        restoreBtn.style.display = 'none';
        
        if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
        if (toggleText) toggleText.textContent = 'تصغير القائمة';
    }
}

/**
 * تبديل حالة شريط التنقل (إخفاء/إظهار)
 */
function toggleNavigation() {
    isNavCollapsed = !isNavCollapsed;
    saveNavState(isNavCollapsed);
    applyNavState();
    
    // إظهار إشعار
    const message = isNavCollapsed 
        ? '✓ تم تصغير قائمة الأصناف' 
        : '✓ تم إظهار قائمة الأصناف';
    showNotification(message);
    
    // تأثير بصري على الزر
    const toggleBtn = document.getElementById('toggleNavBtn');
    if (toggleBtn) {
        toggleBtn.classList.toggle('collapsed', isNavCollapsed);
    }
}

/**
 * تهيئة نظام شريط التنقل القابل للإخفاء
 */
function initToggleNavigation() {
    const toggleBtn = document.getElementById('toggleNavBtn');
    const restoreBtn = document.getElementById('restoreNavBtn');
    
    // تطبيق الحالة المحفوظة
    applyNavState();
    
    // ربط زر التقليص/التوسيع
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleNavigation();
        });
    }
    
    // ربط زر الاستعادة
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleNavigation();
        });
    }
    
    console.log('✅ تم تهيئة نظام شريط التنقل القابل للإخفاء');
}
/**
 * جلب الموقع من التخزين المحلي
 */
function getLocationFromStorage() {
    try {
        const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (storedLocation) {
            const locationData = JSON.parse(storedLocation);
            // التحقق من أن الموقع ليس قديماً جداً (أكثر من 7 أيام)
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - locationData.timestamp < oneWeek) {
                console.log('✅ تم جلب الموقع من التخزين المحلي');
                return locationData;
            } else {
                // حذف الموقع القديم
                localStorage.removeItem(LOCATION_STORAGE_KEY);
            }
        }
        return null;
    } catch (error) {
        console.error('خطأ في جلب الموقع:', error);
        return null;
    }
}

/**
 * حذف الموقع من التخزين المحلي
 */
function clearLocationFromStorage() {
    try {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        console.log('✅ تم حذف الموقع من التخزين المحلي');
    } catch (error) {
        console.error('خطأ في حذف الموقع:', error);
    }
}

/**
 * توليد رابط Google Maps من الإحداثيات
 */
function generateGoogleMapsUrl(lat, lng) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * طلب إذن الموقع من المستخدم
 */
function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('المتصفح لا يدعم تحديد الموقع الجغرافي'));
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                resolve(location);
            },
            (error) => {
                let errorMessage = 'خطأ في تحديد الموقع';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'تم رفض إذن تحديد الموقع';
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
    });
}

/**
 * تحديث واجهة الموقع في الشريط العلوي
 */
function updateLocationBar(status, message) {
    const locationBar = document.getElementById('locationBar');
    const locationStatus = document.getElementById('locationStatus');
    const locationText = document.getElementById('locationText');
    
    if (!locationBar || !locationStatus || !locationText) return;
    
    // إزالة جميع الحالات السابقة
    locationStatus.classList.remove('success', 'error', 'loading');
    
    switch(status) {
        case 'loading':
            locationStatus.classList.add('loading');
            locationText.textContent = message || 'جاري تحديد موقعك...';
            locationBar.style.display = 'flex';
            break;
            
        case 'success':
            locationStatus.classList.add('success');
            locationText.textContent = message || 'تم تحديد موقعك ✓';
            locationBar.style.display = 'flex';
            break;
            
        case 'error':
            locationStatus.classList.add('error');
            locationText.textContent = message || 'فشل تحديد الموقع';
            locationBar.style.display = 'flex';
            break;
            
        case 'hidden':
            locationBar.style.display = 'none';
            break;
    }
}

/**
 * تحديث حالة الموقع في نافذة السلة
 */
function updateLocationInCart() {
    const locationStatusBadge = document.getElementById('locationStatusBadge');
    const locationStatusText = document.getElementById('locationStatusText');
    
    if (!locationStatusBadge || !locationStatusText) return;
    
    // إزالة الحالات السابقة
    locationStatusBadge.classList.remove('success', 'error', 'warning');
    
    if (userLocation) {
        locationStatusBadge.classList.add('success');
        locationStatusText.textContent = '✓ الموقع محدد - سيتم إرساله مع الطلب';
    } else {
        const storedLocation = getLocationFromStorage();
        if (storedLocation) {
            userLocation = storedLocation;
            locationStatusBadge.classList.add('success');
            locationStatusText.textContent = '✓ الموقع محفوظ من زيارة سابقة';
        } else {
            locationStatusBadge.classList.add('warning');
            locationStatusText.textContent = '⚠ الموقع غير محدد - قد يؤثر على التوصيل';
        }
    }
}

/**
 * عرض معلومات الموقع في نافذة المراجعة
 */
function displayLocationInReview() {
    const reviewLocationDetails = document.getElementById('reviewLocationDetails');
    if (!reviewLocationDetails) return;
    
    const location = userLocation || getLocationFromStorage();
    
    if (location) {
        const mapUrl = location.googleMapsUrl || generateGoogleMapsUrl(location.latitude, location.longitude);
        
        reviewLocationDetails.innerHTML = `
            <p><i class="fas fa-check-circle" style="color: #28a745;"></i> <strong>تم تحديد موقعك بنجاح</strong></p>
            <p><i class="fas fa-map-pin"></i> الإحداثيات: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</p>
            <p><i class="fas fa-clock"></i> آخر تحديث: ${new Date(location.timestamp).toLocaleString('ar-EG')}</p>
            <a href="${mapUrl}" target="_blank" class="location-map-link">
                <i class="fas fa-external-link-alt"></i> عرض الموقع على الخريطة
            </a>
        `;
    } else {
        reviewLocationDetails.innerHTML = `
            <p style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> <strong>الموقع غير محدد</strong></p>
            <p>قد يواجه سائق التوصيل صعوبة في الوصول إليك</p>
            <button onclick="requestLocationAndUpdate()" class="location-map-link">
                <i class="fas fa-map-marker-alt"></i> تحديد الموقع الآن
            </button>
        `;
    }
}

/**
 * طلب الموقع وتحديث الواجهة
 */
async function requestLocationAndUpdate() {
    try {
        updateLocationBar('loading', 'جاري تحديد موقعك...');
        
        const location = await requestLocationPermission();
        const savedLocation = saveLocationToStorage(location);
        userLocation = savedLocation;
        locationPermissionGranted = true;
        
        // حفظ حالة الإذن
        localStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
        
        updateLocationBar('success', 'تم تحديد موقعك ✓');
        updateLocationInCart();
        displayLocationInReview();
        
        showNotification('✅ تم تحديد موقعك بنجاح');
        
        return savedLocation;
    } catch (error) {
        console.error('خطأ في تحديد الموقع:', error);
        updateLocationBar('error', 'فشل تحديد الموقع');
        
        // في حالة الرفض، حفظ الحالة
        if (error.message.includes('رفض')) {
            localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
        }
        
        showNotification('⚠ ' + error.message);
        return null;
    }
}

/**
 * تهيئة نظام الموقع المستخدم عند تحميل الصفحة
 */
async function initializeLocationSystem() {
    console.log('🔍 بدء تهيئة نظام الموقع...');
    
    // التحقق من حالة الإذن المحفوظة
    const savedPermission = localStorage.getItem(LOCATION_PERMISSION_KEY);
    
    // 1. محاولة جلب الموقع من التخزين المحلي أولاً (الأسرع)
    const storedLocation = getLocationFromStorage();
    
    if (storedLocation) {
        userLocation = storedLocation;
        locationPermissionGranted = true;
        updateLocationBar('success', 'تم تحديد موقعك ✓');
        updateLocationInCart();
        console.log('✅ تم استخدام الموقع المحفوظ');
        return;
    }
    
    // 2. إذا لم يكن هناك موقع محفوظ، عرض نافذة الإذن
    if (savedPermission !== 'denied') {
        showLocationPermissionModal();
    } else {
        // إذا كان المستخدم قد رفض سابقاً، عرض شريط تحذيري
        updateLocationBar('error', 'الموقع غير متاح');
        updateLocationInCart();
    }
}

/**
 * عرض نافذة طلب إذن الموقع
 */
function showLocationPermissionModal() {
    const modal = document.getElementById('locationPermissionModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * إخفاء نافذة طلب إذن الموقع
 */
function hideLocationPermissionModal() {
    const modal = document.getElementById('locationPermissionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// 🛒 دوال السلة (مُحدّثة لتشمل الموقع)
// ============================================

// مصفوفة السلة
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
            setTimeout(() => {
                cartCount.style.animation = 'pulse 2s infinite';
            }, 10);
        }
    }
}

function addToCart(name, price, quantity = 1) {
    const existingItem = shoppingCart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        shoppingCart.push({
            name: name,
            price: parseInt(price),
            quantity: quantity
        });
    }
    
    saveCart();
    showNotification(`✓ تم إضافة ${quantity} × ${name} إلى السلة`);
}

function removeFromCart(index) {
    shoppingCart.splice(index, 1);
    saveCart();
    displayCartItems();
}

function changeQuantity(index, change) {
    shoppingCart[index].quantity += change;
    
    if (shoppingCart[index].quantity <= 0) {
        shoppingCart.splice(index, 1);
    }
    
    saveCart();
    displayCartItems();
}

function clearCart() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة بالفعل!');
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
    
    if (!cartItemsContainer) return;
    
    // تحديث حالة الموقع في السلة
    updateLocationInCart();
    
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <h3>السلة فارغة</h3>
                <p>لم تضف أي منتجات بعد</p>
            </div>
        `;
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
                    <button class="qty-btn" onclick="changeQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItemsContainer.appendChild(itemElement);
    });
    
    if (cartTotalElement) {
        cartTotalElement.textContent = total.toLocaleString('ar-EG');
    }
}

function openCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        displayCartItems();
    }
}

function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

// ============================================
// 📋 نافذة مراجعة الطلب (مُحدّثة)
// ============================================

function showOrderReview() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة! الرجاء إضافة منتجات أولاً.');
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
    const locationTextarea = document.getElementById('locationDescription');
    
    if (!reviewItemsContainer) return;
    
    // عرض معلومات الموقع
    displayLocationInReview();
    
    // 🆕 إظهار زر العنوان المحفوظ
    showSavedAddressButton();
    
    // 🆕 تحديث معلومات GPS
    updateGPSInfoInReview();
    
    // 🆕 استرجاع العنوان النصي إذا كان محفوظاً في السلة الحالية
    const currentOrderAddress = sessionStorage.getItem('current_order_address');
    if (locationTextarea) {
        if (currentOrderAddress) {
            locationTextarea.value = currentOrderAddress;
        } else if (savedAddressText && !locationTextarea.value) {
            // لا تملأ تلقائياً، لكن اجعل الزر متاحاً
            locationTextarea.value = '';
        }
        updateCharCounter();
        
        // 🆕 ربط عداد الأحرف
        locationTextarea.oninput = updateCharCounter;
    }
    
    // عرض المنتجات
    reviewItemsContainer.innerHTML = '';
    let totalQuantity = 0;
    let totalAmount = 0;
    
    shoppingCart.forEach((item, index) => {
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
    
    if (reviewItemCount) {
        reviewItemCount.textContent = `${shoppingCart.length} منتج`;
    }
    if (reviewTotalQuantity) {
        reviewTotalQuantity.textContent = `${totalQuantity} قطعة`;
    }
    if (reviewTotalAmount) {
        reviewTotalAmount.textContent = `${totalAmount.toLocaleString('ar-EG')} د.ع`;
    }
}

function closeOrderReview() {
    const reviewModal = document.getElementById('orderReviewModal');
    if (reviewModal) {
        reviewModal.style.display = 'none';
    }
}

// ============================================
// 📱 إرسال الطلب عبر واتساب (مُحدّثة لتشمل الموقع)
// ============================================

function confirmAndSendOrder() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة!');
        return;
    }
    
    // 🆕 جلب العنوان النصي
    const locationTextarea = document.getElementById('locationDescription');
    const addressText = locationTextarea ? locationTextarea.value.trim() : '';
    const saveForFuture = document.getElementById('saveLocationForFuture')?.checked ?? true;
    
    // جلب الموقع الجغرافي
    const gpsLocation = userLocation || getLocationFromStorage();
    
    // 🆕 التحقق: يجب أن يكون إما عنوان نصي أو GPS
    if (!addressText && !gpsLocation) {
        alert('⚠ يجب عليك إما:\n• كتابة عنوانك التفصيلي\n• أو السماح بتحديد موقعك الجغرافي\n\nالرجاء إضافة أحدهما للمتابعة');
        
        // التركيز على حقل العنوان
        if (locationTextarea) {
            locationTextarea.focus();
            locationTextarea.style.borderColor = '#dc3545';
            setTimeout(() => {
                locationTextarea.style.borderColor = '';
            }, 2000);
        }
        return;
    }
    
    // 🆕 حفظ العنوان للنصوص القادمة إذا اختار المستخدم ذلك
    if (addressText && saveForFuture) {
        saveAddressText(addressText);
    }
    
    // 🆕 حفظ العنوان للجلسة الحالية (في حالة العودة للتعديل)
    sessionStorage.setItem('current_order_address', addressText);
    
    const phoneNumber = '9647755666073';
    
    // بناء رسالة الطلب
    let message = 'مرحبا اريد طلب استلام من مطعم تعلولة\n\n';
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
    
    // 🆕 إضافة العنوان التفصيلي (الأهم!)
    if (addressText) {
        message += `\n\n🏠 العنوان التفصيلي:`;
        message += `\n${addressText}`;
    }
    
    // إضافة رابط GPS إذا كان متاحاً
    if (gpsLocation) {
        const mapUrl = gpsLocation.googleMapsUrl || generateGoogleMapsUrl(gpsLocation.latitude, gpsLocation.longitude);
        message += `\n\n📍 الموقع على الخريطة:`;
        message += `\n${mapUrl}`;
    }
    
    // فتح واتساب مع الرسالة
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
    
    closeOrderReview();
    showNotification('✅ تم إرسال طلبك مع العنوان التفصيلي!');
    
    // تفريغ السلة والعنوان المؤقت
    setTimeout(() => {
        shoppingCart = [];
        saveCart();
        sessionStorage.removeItem('current_order_address');
    }, 500);
}

// ============================================
// 📝 دوال العنوان التفصيلي (جديد)
// ============================================

/**
 * حفظ العنوان النصي في التخزين المحلي
 */
function saveAddressText(text) {
    try {
        localStorage.setItem(LOCATION_TEXT_STORAGE_KEY, text);
        savedAddressText = text;
        console.log('✅ تم حفظ العنوان النصي');
    } catch (error) {
        console.error('خطأ في حفظ العنوان:', error);
    }
}

/**
 * استرجاع العنوان المحفوظ
 */
function getSavedAddressText() {
    return localStorage.getItem(LOCATION_TEXT_STORAGE_KEY) || '';
}

/**
 * تحديث عداد الأحرف في حقل العنوان
 */
function updateCharCounter() {
    const textarea = document.getElementById('locationDescription');
    const counter = document.getElementById('charCount');
    
    if (textarea && counter) {
        counter.textContent = textarea.value.length;
        
        // تغيير اللون حسب الطول
        const charCounter = counter.parentElement;
        if (textarea.value.length > 450) {
            charCounter.style.color = '#dc3545';
        } else if (textarea.value.length > 300) {
            charCounter.style.color = '#f39c12';
        } else {
            charCounter.style.color = '#666';
        }
    }
}

/**
 * استخدام العنوان المحفوظ
 */
function useSavedAddress() {
    const textarea = document.getElementById('locationDescription');
    if (textarea && savedAddressText) {
        textarea.value = savedAddressText;
        updateCharCounter();
        showNotification('✓ تم استخدام العنوان المحفوظ');
        
        // تأثير بصري
        textarea.style.background = '#d4edda';
        setTimeout(() => {
            textarea.style.background = 'transparent';
        }, 800);
    }
}

/**
 * إظهار زر العنوان المحفوظ إذا كان موجوداً
 */
function showSavedAddressButton() {
    const btn = document.getElementById('useSavedAddressBtn');
    const preview = document.getElementById('savedAddressPreview');
    
    if (btn && preview && savedAddressText) {
        btn.style.display = 'flex';
        preview.textContent = savedAddressText.substring(0, 50) + 
            (savedAddressText.length > 50 ? '...' : '');
    }
}

/**
 * تحديث معلومات GPS في نافذة المراجعة
 */
function updateGPSInfoInReview() {
    const gpsInfo = document.getElementById('gpsInfoInReview');
    const gpsStatusText = document.getElementById('gpsStatusText');
    
    if (!gpsInfo || !gpsStatusText) return;
    
    const location = userLocation || getLocationFromStorage();
    
    gpsInfo.classList.remove('success', 'error');
    
    if (location) {
        gpsInfo.classList.add('success');
        gpsStatusText.textContent = `✓ الموقع الجغرافي متاح (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;
    } else {
        gpsInfo.classList.add('error');
        gpsStatusText.textContent = '⚠ الموقع الجغرافي غير متاح - يرجى كتابة عنوان تفصيلي';
    }
}

// ============================================
// 🔔 دوال عامة
// ============================================

function showNotification(message) {
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.display = 'block';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInDown 0.5s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

function changeItemQuantity(button, change) {
    const menuCard = button.closest('.menu-item');
    const qtyInput = menuCard.querySelector('.qty-input');
    
    if (!qtyInput) return;
    
    let currentQty = parseInt(qtyInput.value) || 1;
    currentQty += change;
    
    if (currentQty < 1) currentQty = 1;
    if (currentQty > 99) {
        currentQty = 99;
        showNotification('الحد الأقصى للكمية هو 99');
    }
    
    qtyInput.value = currentQty;
    
    qtyInput.style.transform = 'scale(1.2)';
    setTimeout(() => {
        qtyInput.style.transform = 'scale(1)';
    }, 200);
}

function openSupport() {
    const phoneNumber = '9647755666073';
    const message = 'أحتاج إلى مساعدة بخصوص...';
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

function closeAuthModal() {
    const adminAuthModal = document.getElementById('adminAuthModal');
    if (adminAuthModal) {
        adminAuthModal.style.display = 'none';
    }
}

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
        }
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<span>معاينة الصورة</span>';
    }
}

// ============================================
// 🚀 التهيئة عند تحميل الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تم تحميل صفحة تعلولة بنجاح');
    
    // إزالة تأخير 300ms للنقر
    document.addEventListener('touchstart', function(){}, {passive: true});
    
    // تهيئة Firebase
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
    
    // عناصر DOM
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const navButtons = document.querySelectorAll('nav.sections-nav button');
    const menuSections = document.querySelectorAll('section.menu-section');
    const menuItems = document.querySelectorAll('.menu-item');
    const cartIcon = document.getElementById('cartIcon');
    
    // ============================================
    // 📍 ربط أزرار الموقع الجغرافي
    // ============================================
    
    const allowLocationBtn = document.getElementById('allowLocationBtn');
    const denyLocationBtn = document.getElementById('denyLocationBtn');
    const refreshLocationBtn = document.getElementById('refreshLocationBtn');
    const updateLocationFromCartBtn = document.getElementById('updateLocationFromCartBtn');
    
    // زر السماح بتحديد الموقع
    if (allowLocationBtn) {
        allowLocationBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            hideLocationPermissionModal();
            await requestLocationAndUpdate();
        });
    }
    
    // زر رفض تحديد الموقع
    if (denyLocationBtn) {
        denyLocationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideLocationPermissionModal();
            localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
            updateLocationBar('error', 'تم رفض الموقع');
            updateLocationInCart();
            showNotification('⚠ تم رفض تحديد الموقع - قد يؤثر على التوصيل');
        });
    }
    
    // زر تحديث الموقع في الشريط العلوي
    if (refreshLocationBtn) {
        refreshLocationBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await requestLocationAndUpdate();
        });
    }
    
    // زر تحديث الموقع من نافذة السلة
    if (updateLocationFromCartBtn) {
        updateLocationFromCartBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await requestLocationAndUpdate();
        });
    }
    
    // زر العودة لأعلى الصفحة
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.style.display = 'flex';
                scrollToTopBtn.style.alignItems = 'center';
                scrollToTopBtn.style.justifyContent = 'center';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        }
    });
    
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // التنقل بين الأقسام
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            const sectionElement = document.getElementById(targetSection);
            
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                menuSections.forEach(section => {
                    section.classList.remove('active');
                });
                sectionElement.classList.add('active');
                
                navButtons.forEach(btn => btn.style.background = 'var(--main-yellow)');
                this.style.background = '#ffffff';
            }
        });
    });
    
    // ============================================
    // 🛒 ربط أزرار الكمية وزر الإضافة للسلة
    // ============================================
    
    function addTouchClickHandler(element, callback) {
        let touchHandled = false;
        
        element.addEventListener('touchstart', function(e) {
            touchHandled = false;
        }, { passive: true });
        
        element.addEventListener('touchend', function(e) {
            if (!touchHandled) {
                touchHandled = true;
                e.preventDefault();
                callback.call(this, e);
            }
        }, { passive: false });
        
        element.addEventListener('click', function(e) {
            if (!touchHandled) {
                callback.call(this, e);
            }
            touchHandled = false;
        });
    }
    
    menuItems.forEach(item => {
        const decreaseBtn = item.querySelector('.qty-decrease');
        const increaseBtn = item.querySelector('.qty-increase');
        const qtyInput = item.querySelector('.qty-input');
        const addToCartBtn = item.querySelector('.add-to-cart-btn');
        
        if (decreaseBtn) {
            addTouchClickHandler(decreaseBtn, function(e) {
                e.preventDefault();
                e.stopPropagation();
                changeItemQuantity(this, -1);
            });
        }
        
        if (increaseBtn) {
            addTouchClickHandler(increaseBtn, function(e) {
                e.preventDefault();
                e.stopPropagation();
                changeItemQuantity(this, 1);
            });
        }
        
        if (addToCartBtn) {
            addTouchClickHandler(addToCartBtn, function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const itemName = item.getAttribute('data-name');
                const itemPrice = item.getAttribute('data-price');
                const quantity = parseInt(qtyInput.value) || 1;
                
                if (itemName && itemPrice) {
                    addToCart(itemName, itemPrice, quantity);
                    
                    this.classList.add('added');
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> تم الإضافة';
                    
                    setTimeout(() => {
                        this.classList.remove('added');
                        this.innerHTML = originalHTML;
                        qtyInput.value = 1;
                    }, 1500);
                }
            });
        }
    });
    
    if (cartIcon) {
        addTouchClickHandler(cartIcon, function(e) {
            e.preventDefault();
            openCartModal();
        });
    }
    
    // تأثيرات التمرير
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    menuSections.forEach(section => {
        observer.observe(section);
    });
    
    document.querySelectorAll('section.info-section').forEach(section => {
        observer.observe(section);
    });
    
    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', function(event) {
        const cartModal = document.getElementById('cartModal');
        const adminPanel = document.getElementById('adminPanel');
        const adminAuthModal = document.getElementById('adminAuthModal');
        const orderReviewModal = document.getElementById('orderReviewModal');
        const locationPermissionModal = document.getElementById('locationPermissionModal');
        
        if (event.target === cartModal) closeCartModal();
        if (event.target === orderReviewModal) closeOrderReview();
        if (event.target === adminPanel) adminPanel.style.display = 'none';
        if (event.target === adminAuthModal) closeAuthModal();
        // لا نغلق نافذة الموقع عند النقر خارجها - يجب على المستخدم الاختيار
    });
    
    updateCartUI();
    
    // ============================================
    // 📍 تهيئة نظام الموقع الجغرافي
    // ============================================
    
    initializeLocationSystem();
    
    // تحميل الإعلانات بعد تحميل Firebase
    firebaseStorageScript.onload = function() {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.initializeApp(firebaseConfig);
                    console.log('✅ تم تهيئة Firebase بنجاح');
                    displayAds();
                } catch (error) {
                    console.error('خطأ في تهيئة Firebase:', error);
                }
            }
        }, 500);
    };
});

// ============================================
// نظام الإعلانات (Firebase)
// ============================================

const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

function loadCurrentAds() {
    const currentAds = document.getElementById('currentAds');
    if (!currentAds) return;
    
    currentAds.innerHTML = '<p>جاري تحميل الإعلانات...</p>';
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        currentAds.innerHTML = '<p>Firebase غير متوفر</p>';
        return;
    }
    
    const database = firebase.database();
    
    database.ref('ads/').orderByChild('timestamp').once('value')
        .then((snapshot) => {
            const ads = snapshot.val();
            if (!ads) {
                currentAds.innerHTML = '<p>لا توجد إعلانات حالية</p>';
                return;
            }
            
            currentAds.innerHTML = '';
            const keys = Object.keys(ads).reverse();
            
            keys.forEach((key) => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = 'ad-card';
                adElement.innerHTML = `
                    ${ad.imageUrl ? `
                        <div class="ad-image">
                            <img src="${ad.imageUrl}" alt="${ad.title}">
                        </div>
                    ` : ''}
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                    ${ad.duration ? `<p class="ad-duration">المدة: ${ad.duration}</p>` : ''}
                    <p><small>تم الإنشاء: ${ad.date || new Date(ad.timestamp).toLocaleDateString('ar-EG')}</small></p>
                    <div class="ad-actions">
                        <button onclick="deleteAd('${key}', '${ad.imageUrl}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                `;
                currentAds.appendChild(adElement);
            });
        })
        .catch((error) => {
            console.error('خطأ في تحميل الإعلانات:', error);
            currentAds.innerHTML = '<p>حدث خطأ أثناء تحميل الإعلانات</p>';
        });
}

function displayAds() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        adsContainer.innerHTML = '<p class="no-ads">Firebase غير متوفر</p>';
        return;
    }
    
    const database = firebase.database();
    
    adsContainer.innerHTML = '<p class="no-ads">جاري تحميل العروض...</p>';
    
    database.ref('ads/').orderByChild('timestamp').once('value')
        .then((snapshot) => {
            const ads = snapshot.val();
            if (!ads) {
                adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
                return;
            }
            
            adsContainer.innerHTML = '';
            const keys = Object.keys(ads).reverse();
            
            keys.forEach((key) => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = `ad-card ${ad.template || 'red'}`;
                adElement.innerHTML = `
                    ${ad.imageUrl ? `
                        <div class="ad-image">
                            <img src="${ad.imageUrl}" alt="${ad.title}">
                        </div>
                    ` : ''}
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                    ${ad.duration ? `<p class="ad-duration">${ad.duration}</p>` : ''}
                `;
                adsContainer.appendChild(adElement);
            });
        })
        .catch((error) => {
            console.error('خطأ في تحميل الإعلانات:', error);
            adsContainer.innerHTML = '<p class="no-ads">حدث خطأ أثناء تحميل الإعلانات</p>';
        });
}

function createAd() {
    const title = document.getElementById('adTitle').value;
    const description = document.getElementById('adDescription').value;
    const price = document.getElementById('adPrice').value;
    const duration = document.getElementById('adDuration').value;
    const template = document.getElementById('adTemplate').value;
    const imageFile = document.getElementById('adImage').files[0];
    
    if (!title || !description) {
        alert('الرجاء ملء الحقول الإلزامية (العنوان والوصف)');
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.storage || !firebase.database) {
        alert('Firebase غير متوفر');
        return;
    }
    
    const storage = firebase.storage();
    const database = firebase.database();
    
    let imageUrl = '';
    
    const uploadImage = imageFile ? new Promise((resolve, reject) => {
        const storageRef = storage.ref();
        const imageRef = storageRef.child('ads/' + Date.now() + '_' + imageFile.name.replace(/\s+/g, '_'));
        
        imageRef.put(imageFile).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((url) => {
                resolve(url);
            }).catch(reject);
        }).catch(reject);
    }) : Promise.resolve('');
    
    uploadImage.then((url) => {
        imageUrl = url;
        
        const newAd = {
            title,
            description,
            price,
            duration,
            template,
            imageUrl,
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now()
        };
        
        const newAdRef = database.ref('ads/').push();
        return newAdRef.set(newAd);
    })
    .then(() => {
        alert('تم إنشاء الإعلان بنجاح!');
        clearAdForm();
        loadCurrentAds();
        displayAds();
    })
    .catch((error) => {
        console.error('خطأ في إنشاء الإعلان:', error);
        alert('حدث خطأ أثناء إنشاء الإعلان: ' + error.message);
    });
}

function deleteAd(key, imageUrl) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        alert('Firebase غير متوفر');
        return;
    }
    
    const database = firebase.database();
    const storage = firebase.storage();
    
    database.ref('ads/' + key).remove()
        .then(() => {
            if (imageUrl) {
                const imageRef = storage.refFromURL(imageUrl);
                return imageRef.delete();
            }
            return Promise.resolve();
        })
        .then(() => {
            alert('تم حذف الإعلان بنجاح');
            loadCurrentAds();
            displayAds();
        })
        .catch((error) => {
            console.error('خطأ في حذف الإعلان:', error);
            alert('حدث خطأ أثناء حذف الإعلان');
        });
}

function clearAdForm() {
    const adTitle = document.getElementById('adTitle');
    const adDescription = document.getElementById('adDescription');
    const adPrice = document.getElementById('adPrice');
    const adDuration = document.getElementById('adDuration');
    const adTemplate = document.getElementById('adTemplate');
    const adImage = document.getElementById('adImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (adTitle) adTitle.value = '';
    if (adDescription) adDescription.value = '';
    if (adPrice) adPrice.value = '';
    if (adDuration) adDuration.value = '';
    if (adTemplate) adTemplate.value = 'red';
    if (adImage) adImage.value = '';
    if (imagePreview) imagePreview.innerHTML = '<span>معاينة الصورة</span>';
}

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginSubmit = document.getElementById('adminLoginSubmit');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminAuthModal = document.getElementById('adminAuthModal');
    
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            if (adminAuthModal) adminAuthModal.style.display = 'flex';
        });
    }
    
    if (adminLoginSubmit) {
        adminLoginSubmit.addEventListener('click', () => {
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                if (adminAuthModal) adminAuthModal.style.display = 'none';
                if (adminPanel) adminPanel.style.display = 'flex';
                loadCurrentAds();
            } else {
                alert('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
        });
    }
    
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', () => {
            if (adminPanel) adminPanel.style.display = 'none';
        });
    }
});

// تصدير الدوال العامة
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
