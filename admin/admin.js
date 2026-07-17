// ============================================
// ⚙️ إعدادات Firebase
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
    authDomain: "talola-food.firebaseapp.com",
    databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
    projectId: "talola-food",
    messagingSenderId: "440585170470",
    appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ============================================
// 🛡️ دوال مساعدة آمنة
// ============================================
function safeGetValue(elementId, defaultValue = '') {
    const el = document.getElementById(elementId);
    return el ? (el.value || defaultValue) : defaultValue;
}

function safeGetChecked(name, defaultValue = '') {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : defaultValue;
}

function safeSetChecked(elementId, shouldBeChecked) {
    const el = document.getElementById(elementId);
    if (el) el.checked = shouldBeChecked;
}

function safeSetValue(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.value = value;
}

// ============================================
// 🔐 نظام المصادقة (تسجيل الدخول والخروج)
// ============================================
const ADMIN_PASSWORD = "TaloolaAdmin@2024";
const SESSION_KEY = 'taloola_admin_logged_in';

function initLoginSystem() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const passwordInput = document.getElementById('adminPassword');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!loginBtn || !passwordInput) {
        console.error("❌ خطأ: عناصر تسجيل الدخول غير موجودة في HTML");
        return;
    }

    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';
        showDashboard();
        return;
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
    }

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        if (passwordInput.value === ADMIN_PASSWORD) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            if (loginError) loginError.style.display = 'none';
            passwordInput.value = '';
            showDashboard();
        } else {
            if (loginError) {
                loginError.textContent = 'كلمة المرور غير صحيحة!';
                loginError.style.display = 'block';
                setTimeout(() => { loginError.style.display = 'none'; }, 3000);
            } else {
                alert('كلمة المرور غير صحيحة!');
            }
        }
    };

    loginBtn.addEventListener('click', handleLogin);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin(e);
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                sessionStorage.removeItem(SESSION_KEY);
                location.reload();
            }
        });
    }
}

// ============================================
// 🚀 لوحة التحكم الرئيسية
// ============================================
function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    
    loadCategories();
    loadMenuItems();
    loadAds();
    loadThemeSettings();
    loadOrderCounter();
    loadBannedPhones();
    loadDeliveryDurationSettings();
    loadDeliveryAreasAdmin(); // تحميل المناطق فور الدخول
    
    window.currentOrdersSource = 'users';
    loadUserOrders();
}

// ============================================
// 🎨 إدارة الثيم والألوان
// ============================================
let currentTheme = {
    mode: 'dark', primaryColor: '#c70301', secondaryColor: '#fedb17',
    textColor: '#ffffff', headingColor: '#ffffff', descriptionColor: '#cccccc',
    priceColor: '#fedb17', fontFamily: "'Cairo', sans-serif", fontSize: 16,
    backgroundType: 'video', videoUrl: 'https://v1.pinimg.com/videos/mc/720p/44/0c/df/440cdf2f4bdc8fe1d314c49d4876570a.mp4',
    imageUrl: '', bgColor: '#1a1a1a', gradientColor1: '#1a1a1a', gradientColor2: '#2c2c2c',
    gradientDirection: '135deg', overlayOpacity: 60, itemImageBg: 'transparent', itemImageBgColor: '#ffffff'
};

function loadThemeSettings() {
    db.ref('theme').once('value').then(snapshot => {
        if (snapshot.val()) {
            currentTheme = { ...currentTheme, ...snapshot.val() };
            applyThemeToUI();
        }
    });
}

function applyThemeToUI() {
    safeSetChecked('themeLight', currentTheme.mode === 'light');
    safeSetChecked('themeDark', currentTheme.mode === 'dark');
    safeSetChecked('themeGray', currentTheme.mode === 'gray');
    safeSetValue('primaryColor', currentTheme.primaryColor);
    safeSetValue('secondaryColor', currentTheme.secondaryColor);
    safeSetValue('textColor', currentTheme.textColor);
    safeSetValue('headingColor', currentTheme.headingColor);
    safeSetValue('descriptionColor', currentTheme.descriptionColor);
    safeSetValue('priceColor', currentTheme.priceColor);
    safeSetValue('fontFamily', currentTheme.fontFamily);
    safeSetValue('fontSize', currentTheme.fontSize);
    
    const fontSizeValueEl = document.getElementById('fontSizeValue');
    if (fontSizeValueEl) fontSizeValueEl.textContent = (currentTheme.fontSize || 16) + 'px';
    
    safeSetChecked('bgVideo', currentTheme.backgroundType === 'video');
    safeSetChecked('bgImage', currentTheme.backgroundType === 'image');
    safeSetChecked('bgColor', currentTheme.backgroundType === 'color');
    safeSetChecked('bgGradient', currentTheme.backgroundType === 'gradient');
    
    safeSetValue('videoUrl', currentTheme.videoUrl || '');
    safeSetValue('imageUrl', currentTheme.imageUrl || '');
    safeSetValue('bgColorPicker', currentTheme.bgColor);
    safeSetValue('gradientColor1', currentTheme.gradientColor1);
    safeSetValue('gradientColor2', currentTheme.gradientColor2);
    safeSetValue('gradientDirection', currentTheme.gradientDirection || '135deg');
    safeSetValue('overlayOpacity', currentTheme.overlayOpacity || 60);
    
    const overlayValueEl = document.getElementById('overlayOpacityValue');
    if (overlayValueEl) overlayValueEl.textContent = (currentTheme.overlayOpacity || 60) + '%';
    
    safeSetChecked('imgBgTransparent', currentTheme.itemImageBg === 'transparent');
    safeSetChecked('imgBgWhite', currentTheme.itemImageBg === 'white');
    safeSetChecked('imgBgPrimary', currentTheme.itemImageBg === 'primary');
    safeSetChecked('imgBgCustom', currentTheme.itemImageBg === 'custom');
    safeSetValue('itemImageBgColor', currentTheme.itemImageBgColor || '#ffffff');
    
    updateBackgroundOptionsVisibility();
    updateImageBgOptionsVisibility();
}

function updateBackgroundOptionsVisibility() {
    const ids = ['videoOptions', 'imageOptions', 'colorOptions', 'gradientOptions'];
    const types = ['video', 'image', 'color', 'gradient'];
    ids.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) el.style.display = currentTheme.backgroundType === types[index] ? 'block' : 'none';
    });
}

function updateImageBgOptionsVisibility() {
    const el = document.getElementById('customImageBgOptions');
    if (el) el.style.display = currentTheme.itemImageBg === 'custom' ? 'block' : 'none';
}

// ============================================
// 🔢 تحميل عداد الطلبات
// ============================================
function loadOrderCounter() {
    const counterEl = document.getElementById('currentOrderNumber');
    if (!counterEl) return;
    db.ref('orders/counter').on('value', (snapshot) => {
        counterEl.textContent = snapshot.val() || 0;
    });
}

// ============================================
// 📂 إدارة الأقسام
// ============================================
let allCategories = [];

function loadCategories() {
    db.ref('categories').orderByChild('order').on('value', (snapshot) => {
        allCategories = [];
        const categories = snapshot.val();
        if (categories) {
            Object.keys(categories).forEach(key => allCategories.push({ id: key, ...categories[key] }));
            allCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
            renderCategories();
        }
    });
}

function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    categoriesList.innerHTML = '';
    
    allCategories.forEach((cat, index) => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-id', cat.id);
        item.innerHTML = `
            <div class="category-drag-handle"><i class="fas fa-grip-vertical"></i></div>
            <div class="category-icon-display">${cat.icon || '📁'}</div>
            <div class="category-info">
                <div class="category-name">${cat.name}</div>
                <div class="category-meta"><span>الترتيب: ${cat.order !== undefined ? cat.order : index}</span></div>
            </div>
            <div class="category-actions">
                <button class="btn-edit-category" onclick="editCategory('${cat.id}')"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn-delete-category" onclick="deleteCategory('${cat.id}')"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        categoriesList.appendChild(item);
    });
}

let draggedItem = null;
function handleDragStart(e) { draggedItem = this; this.classList.add('dragging'); e.dataTransfer.setData('text/plain', this.getAttribute('data-id')); }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function handleDragEnd() { this.classList.remove('dragging'); draggedItem = null; }

async function handleDrop(e) {
    e.preventDefault();
    if (this === draggedItem || !draggedItem) return;
    const draggedId = draggedItem.getAttribute('data-id');
    const targetId = this.getAttribute('data-id');
    const draggedIndex = allCategories.findIndex(c => c.id === draggedId);
    const targetIndex = allCategories.findIndex(c => c.id === targetId);
    
    const [movedItem] = allCategories.splice(draggedIndex, 1);
    allCategories.splice(targetIndex, 0, movedItem);
    renderCategories();
    
    try {
        const updates = {};
        for (let i = 0; i < allCategories.length; i++) {
            updates[`${allCategories[i].id}/order`] = i;
        }
        await db.ref('categories').update(updates);
        showToast('✅ تم تحديث الترتيب', 'success');
    } catch (error) {
        showToast('❌ فشل تحديث الترتيب', 'error');
        loadCategories();
    }
}

window.editCategory = function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    safeSetValue('categoryId', cat.id);
    safeSetValue('categoryName', cat.name);
    safeSetValue('categoryIcon', cat.icon || '');
    safeSetValue('categoryOrder', cat.order !== undefined ? cat.order : '');
    document.getElementById('categoryFormTitle').textContent = 'تعديل القسم';
    document.getElementById('saveCategoryText').textContent = 'حفظ التعديلات';
    document.getElementById('cancelEditCategoryBtn').style.display = 'inline-flex';
};

window.deleteCategory = async function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat || !confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟`)) return;
    try {
        await db.ref('categories/' + id).remove();
        showToast('تم حذف القسم بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف', 'error');
    }
};

// ============================================
// 🍽️ إدارة المنيو
// ============================================
let allMenuItems = [];
let currentFilter = 'all';
let currentSearch = '';

function loadMenuItems() {
    db.ref('menu').on('value', (snapshot) => {
        allMenuItems = [];
        const items = snapshot.val();
        if (items) {
            Object.keys(items).forEach(key => allMenuItems.push({ id: key, ...items[key] }));
            allMenuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
            renderMenuItems();
        }
    });
}

function renderMenuItems() {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;
    
    let filtered = allMenuItems;
    if (currentFilter !== 'all') filtered = filtered.filter(i => i.category === currentFilter);
    if (currentSearch) {
        const s = currentSearch.toLowerCase();
        filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || (i.description && i.description.toLowerCase().includes(s)));
    }
    
    if (filtered.length === 0) {
        menuList.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-search fa-3x"></i><h3>لا توجد نتائج</h3></div>';
        return;
    }
    
    menuList.innerHTML = filtered.map(item => `
        <div class="menu-card ${!item.available ? 'unavailable' : ''}">
            <button class="delete-btn" onclick="deleteMenuItem('${item.id}')"><i class="fas fa-trash"></i></button>
            <div class="menu-card-image">
                <img src="${item.image || 'https://placehold.co/300x200/e9ecef/6c757d?text=No+Image'}" alt="${item.name}" onerror="this.src='https://placehold.co/300x200/e9ecef/6c757d?text=No+Image'">
            </div>
            <div class="menu-card-content">
                <div class="menu-card-header"><h4>${item.name}</h4><span class="menu-card-category">${item.category}</span></div>
                <p>${item.description || 'لا يوجد وصف'}</p>
                <div class="price">${item.price.toLocaleString('ar-EG')} د.ع</div>
                <div class="menu-card-actions">
                    <button class="btn-edit" onclick="editMenuItem('${item.id}')"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="btn-toggle-availability ${!item.available ? 'unavailable' : ''}" onclick="toggleAvailability('${item.id}', ${!item.available})">
                        <i class="fas fa-${item.available ? 'eye' : 'eye-slash'}"></i> ${item.available ? 'إخفاء' : 'إظهار'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.editMenuItem = function(id) {
    const item = allMenuItems.find(i => i.id === id);
    if (!item) return;
    safeSetValue('menuItemId', item.id);
    safeSetValue('menuItemName', item.name);
    safeSetValue('menuItemCategory', item.category);
    safeSetValue('menuItemPrice', item.price);
    safeSetValue('menuItemImage', item.image || '');
    safeSetValue('menuItemDescription', item.description || '');
    safeSetChecked('menuItemAvailable', item.available);
    document.getElementById('menuFormTitle').textContent = 'تعديل الصنف';
    document.getElementById('saveMenuItemText').textContent = 'حفظ التعديلات';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
};

window.toggleAvailability = async function(id, newValue) {
    try {
        await db.ref('menu/' + id + '/available').set(newValue);
        showToast(newValue ? 'تم إظهار الصنف' : 'تم إخفاء الصنف', 'success');
    } catch (error) { showToast('فشل التحديث', 'error'); }
};

window.deleteMenuItem = async function(id) {
    const item = allMenuItems.find(i => i.id === id);
    if (!item || !confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) return;
    try {
        await db.ref('menu/' + id).remove();
        showToast('تم حذف الصنف بنجاح', 'success');
    } catch (error) { showToast('فشل الحذف', 'error'); }
};

// ============================================
// 📢 إدارة الإعلانات
// ============================================
function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function loadAds() {
    db.ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
        const adsList = document.getElementById('adsList');
        if (!adsList) return;
        const ads = snapshot.val();
        if (!ads) {
            adsList.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-bullhorn fa-3x"></i><h3>لا توجد إعلانات</h3></div>';
            return;
        }
        adsList.innerHTML = Object.keys(ads).reverse().map(key => {
            const ad = ads[key];
            let mediaHtml = '';
            if (ad.mediaType === 'youtube' && ad.youtubeUrl) {
                const vidId = extractYouTubeId(ad.youtubeUrl);
                if (vidId) mediaHtml = `<div class="ad-video-wrapper"><iframe width="100%" height="200" src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen></iframe></div>`;
            } else if (ad.mediaType === 'image' && ad.imageUrl) {
                mediaHtml = `<div class="ad-image"><img src="${ad.imageUrl}" alt="${ad.title}" style="width:100%; height:200px; object-fit:cover;"></div>`;
            }
            return `
                <div class="ad-card">
                    <button class="delete-btn" onclick="deleteAd('${key}')"><i class="fas fa-trash"></i></button>
                    ${mediaHtml}
                    <div class="ad-card-content">
                        <h4>${ad.title}</h4>
                        <p>${ad.description}</p>
                        ${ad.price ? `<div class="price">${ad.price} د.ع</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    });
}

window.deleteAd = async function(key) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
        await db.ref('ads/' + key).remove();
        showToast('تم حذف الإعلان بنجاح', 'success');
    } catch (error) { showToast('فشل الحذف', 'error'); }
};

// ============================================
// 📋 إدارة الطلبات (الرئيسية والمستخدمين)
// ============================================
let allOrders = [];
let allUserOrders = [];
let currentOrderFilter = 'all';
let currentUserOrdersFilter = 'all';
let currentOrdersSource = 'users';
let unseenOrdersCount = 0;
let seenOrderIds = new Set();
let ordersListener = null;

function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    if (ordersListener) db.ref('orders/list').off('value', ordersListener);
    
    ordersListener = db.ref('orders/list').orderByChild('timestamp').on('value', (snapshot) => {
        allOrders = [];
        const orders = snapshot.val();
        if (!orders) {
            ordersList.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-inbox fa-3x"></i><h3>لا توجد طلبات حالياً</h3></div>';
            return;
        }
        Object.keys(orders).forEach(key => {
            const order = { id: key, ...orders[key] };
            allOrders.push(order);
            if (!seenOrderIds.has(key)) {
                unseenOrdersCount++;
                seenOrderIds.add(key);
            }
        });
        allOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderOrders();
        if (unseenOrdersCount > 0) {
            document.title = `(${unseenOrdersCount}) 🔔 لوحة تحكم تعلولة`;
        }
    });
}

function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    let filtered = allOrders;
    if (currentOrderFilter !== 'all') filtered = filtered.filter(o => (o.status || 'pending') === currentOrderFilter);
    if (filtered.length === 0) {
        ordersList.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-search fa-3x"></i><h3>لا توجد طلبات في هذه الفئة</h3></div>';
        return;
    }
    ordersList.innerHTML = filtered.map(order => {
        const status = order.status || 'pending';
        const statusLabels = {
            'pending': { text: 'معلق', color: '#ffc107' },
            'preparing': { text: 'قيد التحضير', color: '#17a2b8' },
            'ready': { text: 'جاهز', color: '#28a745' },
            'completed': { text: 'مكتمل', color: '#28a745' },
            'cancelled': { text: 'ملغي', color: '#dc3545' }
        };
        const s = statusLabels[status];
        const itemsHtml = (order.items || []).map(item => `
            <div class="order-item-row">
                <span class="item-qty">${item.quantity}×</span>
                <span class="item-name">${item.name}</span>
                <span class="item-price">${((item.price || 0) * (item.quantity || 0)).toLocaleString('ar-EG')} د.ع</span>
            </div>
        `).join('');
        return `
            <div class="order-card status-${status}">
                <div class="order-header">
                    <div class="order-id"><i class="fas fa-receipt"></i><span>طلب #${order.orderNumber || order.id.substring(0, 6).toUpperCase()}</span></div>
                    <div class="order-status-badge" style="background: ${s.color};"><span>${s.text}</span></div>
                </div>
                <div class="order-customer-info">
                    <div class="info-row"><i class="fas fa-phone"></i><a href="tel:${order.phone || ''}">${order.phone || 'غير متوفر'}</a></div>
                    <div class="info-row"><i class="fas fa-map-marker-alt"></i><span>${order.area || 'غير محدد'}</span></div>
                </div>
                <div class="order-items"><h4><i class="fas fa-utensils"></i> الأصناف</h4>${itemsHtml || '<p class="no-items">لا توجد أصناف</p>'}</div>
                <div class="order-footer">
                    <div class="order-total"><span>الإجمالي:</span><strong>${(order.total || 0).toLocaleString('ar-EG')} د.ع</strong></div>
                </div>
                <div class="order-actions">
                    <select class="order-status-select" onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ معلق</option>
                        <option value="preparing" ${status === 'preparing' ? 'selected' : ''}>🔥 قيد التحضير</option>
                        <option value="ready" ${status === 'ready' ? 'selected' : ''}>✓ جاهز</option>
                        <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ مكتمل</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ ملغي</option>
                    </select>
                    <button class="btn-cancel-order" onclick="cancelOrder('${order.id}')"><i class="fas fa-ban"></i></button>
                    <button class="btn-delete-order" onclick="deleteOrder('${order.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

async function loadUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    ordersList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
    try {
        const snapshot = await db.ref('users').once('value');
        const usersData = snapshot.val();
        allUserOrders = [];
        if (usersData) {
            const ordersMap = new Map();
            Object.keys(usersData).forEach(phone => {
                if (usersData[phone]?.orders) {
                    Object.keys(usersData[phone].orders).forEach(orderId => {
                        const order = { id: orderId, userPhone: phone, phone: phone, ...usersData[phone].orders[orderId] };
                        ordersMap.set(order.orderId || `${phone}_${orderId}`, order);
                    });
                }
            });
            allUserOrders = Array.from(ordersMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        renderUserOrders();
    } catch (error) {
        console.error('❌ خطأ في تحميل طلبات المستخدمين:', error);
    }
}

function renderUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    const searchTerm = document.getElementById('userPhoneSearch')?.value.trim().toLowerCase() || '';
    let filtered = allUserOrders.filter(o => 
        (currentUserOrdersFilter === 'all' || o.status === currentUserOrdersFilter) &&
        (!searchTerm || o.phone?.includes(searchTerm) || (o.customerName && o.customerName.toLowerCase().includes(searchTerm)))
    );
    if (filtered.length === 0) {
        ordersList.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>لا توجد نتائج</h3></div>';
        return;
    }
    ordersList.innerHTML = filtered.slice(0, 50).map(order => {
        const status = order.status || 'pending';
        const statusLabels = {
            'pending': { text: 'معلق', color: '#ffc107' },
            'preparing': { text: 'قيد التحضير', color: '#17a2b8' },
            'ready': { text: 'جاهز', color: '#28a745' },
            'completed': { text: 'مكتمل', color: '#28a745' },
            'cancelled': { text: 'ملغي', color: '#dc3545' }
        };
        const s = statusLabels[status];
        const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString('ar-EG') : 'غير معروف';
        const itemsPreview = (order.items || []).slice(0, 3).map(item => `
            <div class="order-item-row">
                <span class="item-qty">${item.quantity}×</span>
                <span class="item-name">${item.name}</span>
                <span class="item-price">${((item.price||0)*(item.quantity||0)).toLocaleString('ar-EG')} د.ع</span>
            </div>
        `).join('') || '<p class="no-items">لا توجد أصناف</p>';

        return `
            <div class="order-card user-order status-${status}">
                <div class="order-header">
                    <div class="order-id"><i class="fas fa-receipt"></i><span>طلب #${order.orderNumber || order.id?.substring(0, 6).toUpperCase() || '؟'}</span></div>
                    <span class="order-status-badge" style="background: ${s.color};">${s.text}</span>
                </div>
                <div class="order-customer-info">
                    <div class="info-row"><i class="fas fa-user"></i><span>${order.customerName || 'زبون'}</span></div>
                    <div class="info-row"><i class="fas fa-phone"></i><a href="tel:${order.phone || order.userPhone || ''}">${order.phone || order.userPhone || 'غير متوفر'}</a></div>
                    <div class="info-row"><i class="fas fa-map-marker-alt"></i><span>${order.area || 'غير محدد'}${order.detailedAddress ? ' - ' + order.detailedAddress : ''}</span></div>
                </div>
                <div class="order-items"><h4><i class="fas fa-utensils"></i> الأصناف</h4>${itemsPreview}</div>
                <div class="order-footer">
                    <div class="order-total"><span>الإجمالي:</span><strong>${(order.total || 0).toLocaleString('ar-EG')} د.ع</strong></div>
                    <div class="order-date"><i class="fas fa-calendar"></i><span>${orderDate}</span></div>
                </div>
                <div class="order-actions">
                    <select class="order-status-select" onchange="updateUserOrderStatus('${order.id}', '${order.userPhone}', this.value)">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ معلق</option>
                        <option value="preparing" ${status === 'preparing' ? 'selected' : ''}>🔥 قيد التحضير</option>
                        <option value="ready" ${status === 'ready' ? 'selected' : ''}>✓ جاهز</option>
                        <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ مكتمل</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ ملغي</option>
                    </select>
                    <button class="btn-cancel-order" onclick="cancelUserOrder('${order.id}', '${order.userPhone}')"><i class="fas fa-ban"></i></button>
                    <button class="btn-delete-order" onclick="deleteUserOrder('${order.id}', '${order.userPhone}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function switchOrdersSource(source) {
    currentOrdersSource = source;
    document.querySelectorAll('.orders-source-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === source);
    });
    const searchBox = document.getElementById('userOrdersSearch');
    if (searchBox) searchBox.style.display = source === 'users' ? 'flex' : 'none';
    if (source === 'users') loadUserOrders();
    else loadOrders();
}

function addUserOrdersControls() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    const existingControls = document.querySelector('.orders-toolbar');
    if (existingControls) existingControls.remove();

    const toolbarDiv = document.createElement('div');
    toolbarDiv.className = 'orders-toolbar';
    toolbarDiv.innerHTML = `
        <div class="orders-source-toggle">
            <button class="orders-source-btn ${currentOrdersSource === 'main' ? 'active' : ''}" data-source="main" onclick="switchOrdersSource('main')">
                <i class="fas fa-list-ul"></i> الطلبات الرئيسية
            </button>
            <button class="orders-source-btn ${currentOrdersSource === 'users' ? 'active' : ''}" data-source="users" onclick="switchOrdersSource('users')">
                <i class="fas fa-users"></i> طلبات المستخدمين
            </button>
        </div>
        <div id="userOrdersSearch" class="user-search-box" style="display: ${currentOrdersSource === 'users' ? 'block' : 'none'};">
            <i class="fas fa-search"></i>
            <input type="text" id="userPhoneSearch" placeholder="ابحث برقم الهاتف أو اسم الزبون...">
        </div>
        <button onclick="manualRefreshOrders()" class="refresh-orders-btn" title="تحديث القائمة">
            <i class="fas fa-sync-alt"></i> <span>تحديث</span>
        </button>
    `;
    ordersList.parentNode.insertBefore(toolbarDiv, ordersList);
    
    const searchInput = document.getElementById('userPhoneSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => { renderUserOrders(); }, 300);
        });
    }
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await db.ref('orders/list/' + orderId + '/status').set(newStatus);
        await db.ref('orders/list/' + orderId + '/updatedAt').set(Date.now());
        showToast('✅ تم تحديث حالة الطلب', 'success');
        renderOrders();
    } catch (error) { showToast('❌ فشل تحديث الحالة', 'error'); }
};

window.cancelOrder = async function(orderId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    try {
        await db.ref('orders/list/' + orderId).update({ status: 'cancelled', cancelledAt: Date.now() });
        showToast('✅ تم إلغاء الطلب', 'success');
        renderOrders();
    } catch (error) { showToast('❌ فشل إلغاء الطلب', 'error'); }
};

window.deleteOrder = async function(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
        await db.ref('orders/list/' + orderId).remove();
        showToast('✅ تم حذف الطلب', 'success');
        renderOrders();
    } catch (error) { showToast('❌ فشل الحذف', 'error'); }
};

window.updateUserOrderStatus = async function(orderId, userPhone, newStatus) {
    try {
        await db.ref(`users/${userPhone}/orders/${orderId}/status`).set(newStatus);
        const orderData = (await db.ref(`users/${userPhone}/orders/${orderId}`).once('value')).val();
        if (orderData?.orderId) {
            await db.ref(`orders/list/${orderData.orderId}/status`).set(newStatus);
        }
        showToast('✅ تم تحديث حالة الطلب', 'success');
        loadUserOrders();
    } catch (error) { showToast('❌ فشل تحديث الحالة', 'error'); }
};

window.cancelUserOrder = async function(orderId, userPhone) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    try {
        const orderData = (await db.ref(`users/${userPhone}/orders/${orderId}`).once('value')).val();
        await db.ref(`users/${userPhone}/orders/${orderId}`).update({ status: 'cancelled', cancelledAt: Date.now() });
        if (orderData?.orderId) {
            await db.ref(`orders/list/${orderData.orderId}`).update({ status: 'cancelled', cancelledAt: Date.now() });
        }
        showToast('✅ تم إلغاء الطلب', 'success');
        loadUserOrders();
    } catch (error) { showToast('❌ فشل إلغاء الطلب', 'error'); }
};

window.deleteUserOrder = async function(orderId, userPhone) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
        const orderData = (await db.ref(`users/${userPhone}/orders/${orderId}`).once('value')).val();
        await db.ref(`users/${userPhone}/orders/${orderId}`).remove();
        if (orderData?.orderId) {
            await db.ref(`orders/list/${orderData.orderId}`).remove();
        }
        showToast('✅ تم حذف الطلب نهائياً', 'success');
        loadUserOrders();
    } catch (error) { showToast('❌ فشل حذف الطلب', 'error'); }
};

// ============================================
// 🚫 نظام الحظر
// ============================================
let allBannedPhones = [];
let banTimerInterval = null;

function loadBannedPhones() {
    db.ref('banned_phones').on('value', (snapshot) => {
        allBannedPhones = [];
        const banned = snapshot.val();
        const now = Date.now();
        if (banned) {
            Object.keys(banned).forEach(key => {
                const banInfo = banned[key];
                const isExpired = !banInfo.permanent && banInfo.banUntil && banInfo.banUntil <= now;
                if (isExpired) {
                    db.ref('banned_phones/' + key).remove();
                } else {
                    allBannedPhones.push({ phone: key, ...banInfo });
                }
            });
        }
        renderBannedPhones();
        startBanTimer();
    });
}

function renderBannedPhones() {
    const bannedList = document.getElementById('bannedList');
    if (!bannedList) return;
    if (allBannedPhones.length === 0) {
        bannedList.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle fa-3x" style="color: #28a745;"></i><h3>لا توجد أرقام محظورة</h3></div>';
        return;
    }
    bannedList.innerHTML = allBannedPhones.map(ban => {
        const timerId = `timer-${ban.phone.replace(/[^0-9]/g, '')}`;
        const timeDisplay = ban.permanent ? '♾️ حظر دائم' : `<span id="${timerId}">⏳ جاري الحساب...</span>`;
        return `
            <div class="banned-card ${ban.permanent ? 'permanent' : 'temporary'}">
                <div class="banned-header">
                    <div class="banned-phone"><i class="fas fa-phone"></i><a href="tel:${ban.phone}">${ban.phone}</a></div>
                    <span class="ban-badge ${ban.permanent ? 'permanent' : 'temporary'}">${ban.permanent ? 'دائم' : 'مؤقت'}</span>
                </div>
                <div class="banned-info">
                    <div class="info-row"><i class="fas fa-clock"></i><span>${timeDisplay}</span></div>
                    ${ban.reason ? `<div class="info-row"><i class="fas fa-comment"></i><span>${ban.reason}</span></div>` : ''}
                </div>
                <div class="banned-actions">
                    <button class="btn-unban" onclick="unbanPhone('${ban.phone}')"><i class="fas fa-unlock"></i> فك الحظر</button>
                    <button class="btn-extend-ban" onclick="extendBan('${ban.phone}')"><i class="fas fa-hourglass-half"></i> تمديد</button>
                    <button class="btn-delete-ban" onclick="deleteBan('${ban.phone}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function startBanTimer() {
    if (banTimerInterval) clearInterval(banTimerInterval);
    banTimerInterval = setInterval(() => {
        const now = Date.now();
        allBannedPhones.forEach(ban => {
            if (ban.permanent) return;
            const remaining = ban.banUntil - now;
            const timerEl = document.getElementById(`timer-${ban.phone.replace(/[^0-9]/g, '')}`);
            if (timerEl) {
                if (remaining <= 0) {
                    timerEl.textContent = 'منتهي';
                    db.ref('banned_phones/' + ban.phone).remove();
                } else {
                    const h = Math.floor(remaining / 3600000);
                    const m = Math.floor((remaining % 3600000) / 60000);
                    const s = Math.floor((remaining % 60000) / 1000);
                    timerEl.textContent = `⏳ ${h}س ${m}د ${s}ث`;
                }
            }
        });
    }, 1000);
}

window.unbanPhone = async function(phone) {
    if (!confirm(`فك الحظر عن ${phone}؟`)) return;
    try { await db.ref('banned_phones/' + phone).remove(); showToast('✅ تم فك الحظر', 'success'); } 
    catch (error) { showToast('❌ فشل فك الحظر', 'error'); }
};

window.extendBan = async function(phone) {
    const hours = prompt('أدخل عدد الساعات الإضافية:', '5');
    if (!hours || isNaN(hours)) return;
    try {
        await db.ref('banned_phones/' + phone).update({ banUntil: Date.now() + (parseInt(hours) * 3600000), permanent: false });
        showToast('✅ تم تمديد الحظر', 'success');
    } catch (error) { showToast('❌ فشل التمديد', 'error'); }
};

window.deleteBan = async function(phone) {
    if (!confirm(`حذف سجل الحظر لـ ${phone} نهائياً؟`)) return;
    try { await db.ref('banned_phones/' + phone).remove(); showToast('✅ تم الحذف', 'success'); } 
    catch (error) { showToast('❌ فشل الحذف', 'error'); }
};

// ============================================
// ⏱️ إعدادات المدة (التوصيل، الانتظار، الحظر)
// ============================================
function loadDeliveryDurationSettings() {
    db.ref('settings/delivery_duration_minutes').once('value').then(s => {
        const el = document.getElementById('deliveryDurationInput');
        if (el) el.value = s.val() || 45;
    });
}

function setupProcessingDuration() {
    const input = document.getElementById('processingDurationInput');
    const btn = document.getElementById('saveProcessingDurationBtn');
    if (!input || !btn) return;
    db.ref('settings/processing_duration').once('value').then(s => { if (input) input.value = s.val() || 5; });
    btn.addEventListener('click', async () => {
        const mins = parseInt(input.value);
        if (mins < 1 || mins > 120) return showToast('⚠️ القيمة بين 1 و 120', 'error');
        btn.disabled = true;
        try {
            await db.ref('settings/processing_duration').set(mins);
            showToast(`✅ تم التحديث إلى ${mins} دقيقة`, 'success');
        } catch (error) { showToast('❌ فشل الحفظ', 'error'); }
        finally { btn.disabled = false; }
    });
}

function setupBanSettings() {
    const input = document.getElementById('defaultBanDuration');
    const btn = document.getElementById('saveBanSettingsBtn');
    if (!input || !btn) return;
    db.ref('settings/ban_duration_hours').once('value').then(s => { if (input) input.value = s.val() || 5; });
    btn.addEventListener('click', async () => {
        const hours = parseInt(input.value);
        if (hours < 1 || hours > 720) return showToast('⚠️ القيمة بين 1 و 720', 'error');
        btn.disabled = true;
        try {
            await db.ref('settings/ban_duration_hours').set(hours);
            showToast(`✅ تم تحديث مدة الحظر الافتراضية إلى ${hours} ساعة`, 'success');
        } catch (error) { showToast('❌ فشل الحفظ', 'error'); }
        finally { btn.disabled = false; }
    });
}

// ============================================
// 🔔 دالة Toast للإشعارات
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// 🗺️ إدارة مناطق التوصيل
// ============================================
let allDeliveryAreas = [];

async function seedInitialDeliveryAreas() {
    const snapshot = await db.ref('delivery_areas').once('value');
    if (snapshot.exists()) return;

    const initialAreas = [
        { name: "تقاطع العورة", category: "التقاطعات", estimatedTime: 20 },
        { name: "تقاطع كسرة وعطش", category: "التقاطعات", estimatedTime: 20 },
        { name: "تقاطع السفارة", category: "التقاطعات", estimatedTime: 20 },
        { name: "قطاع 14", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 15", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 16", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 17", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 18", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 19", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 20", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 21", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 22", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 23", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 24", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 25", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 26", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 27", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 28", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 29", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 30", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 31", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 32", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 33", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 34", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 35", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 36", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 37", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 38", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 39", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 40", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 41", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 42", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 43", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 44", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 45", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 46", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 47", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 48", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 49", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 70", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 71", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 72", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 73", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 74", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 75", category: "القطاعات", estimatedTime: 20 },
        { name: "قطاع 76", category: "القطاعات", estimatedTime: 20 }, { name: "قطاع 77", category: "القطاعات", estimatedTime: 20 },
        { name: "سوق العورة", category: "الأسواق", estimatedTime: 20 }, { name: "سوق سويري", category: "الأسواق", estimatedTime: 20 },
        { name: "سوق مريدي", category: "الأسواق", estimatedTime: 20 }, { name: "سوق الكيارة", category: "الأسواق", estimatedTime: 20 },
        { name: "الاورزدي", category: "المناطق", estimatedTime: 20 }, { name: "الفلاح", category: "المناطق", estimatedTime: 20 },
        { name: "كسرة وعطش", category: "المناطق", estimatedTime: 20 }, { name: "السدة", category: "المناطق", estimatedTime: 20 },
        { name: "الحي الدسيم", category: "الأحياء", estimatedTime: 20 }, { name: "الحي ام الكبر", category: "الأحياء", estimatedTime: 20 },
        { name: "الحي الكوفة", category: "الأحياء", estimatedTime: 20 }, { name: "الحي حميدية", category: "الأحياء", estimatedTime: 20 },
        { name: "مستشفى الجوادر", category: "معالم", estimatedTime: 20 },
        { name: "كوفي الشابندر", category: "الكوفيات", estimatedTime: 20 }, { name: "كوفي المضايف", category: "الكوفيات", estimatedTime: 20 },
        { name: "كوفي شاشات", category: "الكوفيات", estimatedTime: 20 }, { name: "كوفي تعلولة", category: "الكوفيات", estimatedTime: 20 }
    ];

    const updates = {};
    initialAreas.forEach((area, index) => {
        const newKey = db.ref('delivery_areas').push().key;
        updates[`delivery_areas/${newKey}`] = { ...area, order: index };
    });
    await db.ref().update(updates);
}

function loadDeliveryAreasAdmin() {
    db.ref('delivery_areas').orderByChild('order').on('value', (snapshot) => {
        const list = document.getElementById('deliveryAreasList');
        if (!list) return;
        allDeliveryAreas = [];
        const data = snapshot.val();
        if (!data) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-map fa-3x"></i><h3>لا توجد مناطق</h3></div>';
            return;
        }
        Object.keys(data).forEach(key => {
            allDeliveryAreas.push({ id: key, ...data[key] });
        });
        list.innerHTML = allDeliveryAreas.map(area => `
            <div class="menu-card">
                <div class="menu-card-content">
                    <div class="menu-card-header">
                        <h4>${area.name}</h4>
                        <span class="menu-card-category">${area.category}</span>
                    </div>
                    <p><i class="fas fa-clock" style="color: var(--primary);"></i> الوقت المتوقع: <strong>${area.estimatedTime} دقيقة</strong></p>
                    <div class="menu-card-actions">
                        <button class="btn-edit" onclick="editDeliveryArea('${area.id}')"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="btn-toggle-availability" style="background: var(--danger);" onclick="deleteDeliveryArea('${area.id}')"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

window.editDeliveryArea = function(id) {
    const area = allDeliveryAreas.find(a => a.id === id);
    if (!area) return;
    safeSetValue('areaId', area.id);
    safeSetValue('areaName', area.name);
    safeSetValue('areaCategory', area.category);
    safeSetValue('areaTime', area.estimatedTime);
    document.getElementById('saveAreaBtn').innerHTML = '<i class="fas fa-save"></i> تحديث المنطقة';
    document.getElementById('cancelAreaEditBtn').style.display = 'inline-flex';
    document.getElementById('deliveryAreaForm').scrollIntoView({ behavior: 'smooth' });
};

window.deleteDeliveryArea = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    try {
        await db.ref(`delivery_areas/${id}`).remove();
        showToast('✅ تم حذف المنطقة بنجاح', 'success');
    } catch (error) {
        showToast('❌ فشل الحذف', 'error');
    }
};

// ============================================
// 🚀 التهيئة النهائية عند تحميل الصفحة (موحدة)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. تهيئة الأنظمة الأساسية
    initLoginSystem();
    setupProcessingDuration();
    setupBanSettings();
    
    // 2. زر حفظ مدة التوصيل
    const saveDeliveryBtn = document.getElementById('saveDeliveryDurationBtn');
    if (saveDeliveryBtn) {
        saveDeliveryBtn.addEventListener('click', async () => {
            const mins = parseInt(document.getElementById('deliveryDurationInput').value);
            if (mins >= 10 && mins <= 180) {
                saveDeliveryBtn.disabled = true;
                try {
                    await db.ref('settings/delivery_duration_minutes').set(mins);
                    showToast('✅ تم حفظ مدة التوصيل');
                } catch (error) { showToast('❌ فشل الحفظ', 'error'); }
                finally { saveDeliveryBtn.disabled = false; }
            } else {
                showToast('⚠️ القيمة بين 10 و 180 دقيقة', 'error');
            }
        });
    }

    // 3. أحداث نموذج الأقسام
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const saveBtn = document.getElementById('saveCategoryBtn');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = 'جاري الحفظ...'; }
            const id = safeGetValue('categoryId');
            const name = safeGetValue('categoryName').trim();
            const icon = safeGetValue('categoryIcon').trim() || '📁';
            const order = parseInt(safeGetValue('categoryOrder')) || allCategories.length;
            if (!name) { showToast('الرجاء إدخال اسم القسم', 'error'); if(saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'حفظ القسم'; } return; }
            try {
                const data = { name, icon, order };
                if (id) await db.ref('categories/' + id).update(data);
                else await db.ref('categories').push(data);
                showToast('تم الحفظ بنجاح', 'success');
                form = document.getElementById('categoryForm'); if(form) form.reset();
                safeSetValue('categoryId', '');
                document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
                document.getElementById('cancelEditCategoryBtn').style.display = 'none';
            } catch (error) { showToast('حدث خطأ', 'error'); }
            finally { if(saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'حفظ القسم'; } }
        });
        document.getElementById('resetCategoryForm')?.addEventListener('click', () => {
            const form = document.getElementById('categoryForm'); if(form) form.reset();
            safeSetValue('categoryId', '');
            document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
            document.getElementById('cancelEditCategoryBtn').style.display = 'none';
        });
        document.getElementById('cancelEditCategoryBtn')?.addEventListener('click', () => {
            const form = document.getElementById('categoryForm'); if(form) form.reset();
            safeSetValue('categoryId', '');
            document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
            document.getElementById('cancelEditCategoryBtn').style.display = 'none';
        });
        document.querySelectorAll('.icon-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', function() {
                safeSetValue('categoryIcon', this.dataset.icon);
                document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }

    // 4. أحداث نموذج المنيو
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const saveBtn = document.getElementById('saveMenuItemBtn');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = 'جاري الحفظ...'; }
            const id = safeGetValue('menuItemId');
            const name = safeGetValue('menuItemName').trim();
            const category = safeGetValue('menuItemCategory');
            const price = parseInt(safeGetValue('menuItemPrice'));
            if (!name || !category || !price) { showToast('الرجاء ملء الحقول المطلوبة', 'error'); if(saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'حفظ الصنف'; } return; }
            try {
                const data = { name, category, price, image: safeGetValue('menuItemImage').trim(), description: safeGetValue('menuItemDescription').trim(), available: document.getElementById('menuItemAvailable').checked, updatedAt: Date.now() };
                if (id) await db.ref('menu/' + id).update(data);
                else { data.order = allMenuItems.length; data.createdAt = Date.now(); await db.ref('menu').push(data); }
                showToast('تم الحفظ بنجاح', 'success');
                const form = document.getElementById('menuForm'); if(form) form.reset();
                safeSetValue('menuItemId', '');
                document.getElementById('menuFormTitle').textContent = 'إضافة صنف جديد';
                document.getElementById('cancelEditBtn').style.display = 'none';
            } catch (error) { showToast('حدث خطأ', 'error'); }
            finally { if(saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'حفظ الصنف'; } }
        });
        document.getElementById('menuSearch')?.addEventListener('input', function() { currentSearch = this.value.trim(); renderMenuItems(); });
        document.getElementById('resetMenuForm')?.addEventListener('click', () => {
            const form = document.getElementById('menuForm'); if(form) form.reset();
            safeSetValue('menuItemId', '');
            document.getElementById('menuFormTitle').textContent = 'إضافة صنف جديد';
            document.getElementById('cancelEditBtn').style.display = 'none';
        });
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
            const form = document.getElementById('menuForm'); if(form) form.reset();
            safeSetValue('menuItemId', '');
            document.getElementById('menuFormTitle').textContent = 'إضافة صنف جديد';
            document.getElementById('cancelEditBtn').style.display = 'none';
        });
    }

    // 5. أحداث نموذج الإعلانات
    const adForm = document.getElementById('adForm');
    if (adForm) {
        document.querySelectorAll('input[name="adMediaType"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const imageField = document.getElementById('imageField');
                const youtubeField = document.getElementById('youtubeField');
                const videoField = document.getElementById('videoField');
                if (imageField) imageField.style.display = this.value === 'image' ? 'block' : 'none';
                if (youtubeField) youtubeField.style.display = this.value === 'youtube' ? 'block' : 'none';
                if (videoField) videoField.style.display = this.value === 'video' ? 'block' : 'none';
            });
        });
        adForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const saveBtn = document.getElementById('saveAdBtn');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = 'جاري الحفظ...'; }
            const mediaType = safeGetChecked('adMediaType', 'image');
            const data = {
                title: safeGetValue('adTitle').trim(), description: safeGetValue('adDescription').trim(), price: safeGetValue('adPrice').trim(), mediaType: mediaType,
                imageUrl: mediaType === 'image' ? safeGetValue('adImageUrl').trim() : '',
                youtubeUrl: mediaType === 'youtube' ? safeGetValue('adYoutubeUrl').trim() : '',
                videoUrl: mediaType === 'video' ? safeGetValue('adVideoUrl').trim() : '',
                timestamp: Date.now(), date: new Date().toLocaleDateString('ar-EG')
            };
            if (!data.title || !data.description) { showToast('الرجاء ملء الحقول المطلوبة', 'error'); if(saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'حفظ الإعلان'; } return; }
            try {
                await db.ref('ads').push(data);
                showToast('✅ تم نشر الإعلان بنجاح!', 'success');
                adForm.reset();
                document.getElementById('imageField').style.display = 'block';
                document.getElementById('youtubeField').style.display = 'none';
                document.getElementById('videoField').style.display = 'none';
            } catch (error) { showToast('حدث خطأ', 'error'); }
            finally { if(saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'حفظ الإعلان'; } }
        });
    }

    // 6. أحداث نموذج الحظر
    const banForm = document.getElementById('banForm');
    if (banForm) {
        const customDurationGroup = document.getElementById('customBanDurationGroup');
        const banDurationSelect = document.getElementById('banDuration');
        if (banDurationSelect && customDurationGroup) {
            banDurationSelect.addEventListener('change', function() {
                customDurationGroup.style.display = this.value === 'custom' ? 'block' : 'none';
            });
        }
        banForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const saveBtn = document.getElementById('saveBanBtn');
            if (!saveBtn) return;
            saveBtn.disabled = true;
            const originalHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحظر...';
            const phone = safeGetValue('banPhone').trim();
            if (!/^07[0-9]{9}$/.test(phone)) { showToast('⚠ رقم الهاتف غير صحيح', 'error'); saveBtn.disabled = false; saveBtn.innerHTML = originalHTML; return; }
            
            const durationType = safeGetValue('banDuration');
            let banUntil, permanent = false;
            if (durationType === 'permanent') permanent = true;
            else if (durationType === 'custom') {
                const val = parseInt(document.getElementById('customBanDurationValue')?.value || '0');
                const unit = document.getElementById('customBanDurationUnit')?.value || 'hours';
                banUntil = Date.now() + (val * (unit === 'days' ? 86400000 : 3600000));
            } else {
                banUntil = Date.now() + (parseInt(durationType) * 3600000);
            }
            try {
                await db.ref('banned_phones/' + phone).set({ phone, banUntil, permanent, reason: safeGetValue('banReason').trim(), timestamp: Date.now() });
                showToast('✅ تم حظر الرقم بنجاح', 'success');
                banForm.reset();
                if (customDurationGroup) customDurationGroup.style.display = 'none';
            } catch (error) { showToast('❌ فشل الحظر', 'error'); }
            finally { saveBtn.disabled = false; saveBtn.innerHTML = originalHTML; }
        });
    }

    // 7. أحداث نموذج مناطق التوصيل
    const deliveryAreaForm = document.getElementById('deliveryAreaForm');
    if (deliveryAreaForm) {
        deliveryAreaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = safeGetValue('areaId');
            const name = safeGetValue('areaName').trim();
            const category = safeGetValue('areaCategory');
            const estimatedTime = parseInt(safeGetValue('areaTime'));
            if (!name || !category || !estimatedTime) return showToast('الرجاء ملء جميع الحقول', 'error');
            
            const btn = document.getElementById('saveAreaBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            try {
                const data = { name, category, estimatedTime };
                if (id) {
                    await db.ref(`delivery_areas/${id}`).update(data);
                    showToast('✅ تم تحديث المنطقة', 'success');
                } else {
                    data.order = allDeliveryAreas.length;
                    await db.ref('delivery_areas').push(data);
                    showToast('✅ تمت إضافة المنطقة', 'success');
                }
                deliveryAreaForm.reset();
                safeSetValue('areaId', '');
                document.getElementById('saveAreaBtn').innerHTML = '<i class="fas fa-save"></i> حفظ المنطقة';
                document.getElementById('cancelAreaEditBtn').style.display = 'none';
            } catch (error) {
                showToast('❌ حدث خطأ', 'error');
            } finally {
                btn.disabled = false;
            }
        });
        document.getElementById('cancelAreaEditBtn')?.addEventListener('click', () => {
            deliveryAreaForm.reset();
            safeSetValue('areaId', '');
            document.getElementById('saveAreaBtn').innerHTML = '<i class="fas fa-save"></i> حفظ المنطقة';
            document.getElementById('cancelAreaEditBtn').style.display = 'none';
        });
    }

    // 8. إدارة التبويبات
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById('tab-' + this.dataset.tab);
            if (targetTab) targetTab.classList.add('active');
            
            if (this.dataset.tab === 'orders') {
                setTimeout(() => {
                    addUserOrdersControls();
                    if (currentOrdersSource === 'users') loadUserOrders();
                    else loadOrders();
                }, 100);
            } else if (this.dataset.tab === 'delivery-areas') {
                seedInitialDeliveryAreas().then(() => {
                    loadDeliveryAreasAdmin();
                });
            }
        });
    });
    
    // أحداث الثيم
    const saveThemeBtn = document.getElementById('saveThemeBtn');
    if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', async () => {
            saveThemeBtn.disabled = true;
            const originalHTML = saveThemeBtn.innerHTML;
            saveThemeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            try {
                currentTheme.mode = safeGetChecked('themeMode', currentTheme.mode);
                currentTheme.primaryColor = safeGetValue('primaryColor', '#c70301');
                currentTheme.secondaryColor = safeGetValue('secondaryColor', '#fedb17');
                currentTheme.textColor = safeGetValue('textColor', '#ffffff');
                currentTheme.headingColor = safeGetValue('headingColor', '#ffffff');
                currentTheme.descriptionColor = safeGetValue('descriptionColor', '#cccccc');
                currentTheme.priceColor = safeGetValue('priceColor', '#fedb17');
                currentTheme.fontFamily = safeGetValue('fontFamily', "'Cairo', sans-serif");
                currentTheme.fontSize = parseInt(safeGetValue('fontSize', '16')) || 16;
                currentTheme.backgroundType = safeGetChecked('backgroundType', currentTheme.backgroundType);
                currentTheme.videoUrl = safeGetValue('videoUrl', '').trim();
                currentTheme.imageUrl = safeGetValue('imageUrl', '').trim();
                currentTheme.bgColor = safeGetValue('bgColorPicker', '#1a1a1a');
                currentTheme.gradientColor1 = safeGetValue('gradientColor1', '#1a1a1a');
                currentTheme.gradientColor2 = safeGetValue('gradientColor2', '#2c2c2c');
                currentTheme.gradientDirection = safeGetValue('gradientDirection', '135deg');
                currentTheme.overlayOpacity = parseInt(safeGetValue('overlayOpacity', '60')) || 60;
                currentTheme.itemImageBg = safeGetChecked('itemImageBg', 'transparent');
                currentTheme.itemImageBgColor = safeGetValue('itemImageBgColor', '#ffffff');
                await db.ref('theme').set(currentTheme);
                showToast('✅ تم حفظ الإعدادات بنجاح', 'success');
            } catch (error) {
                showToast('❌ فشل حفظ الإعدادات', 'error');
            } finally {
                saveThemeBtn.disabled = false;
                saveThemeBtn.innerHTML = originalHTML;
            }
        });
    }
});

// ============================================
// 📤 تصدير الدوال العالمية (للاستخدام في HTML عبر onclick)
// ============================================
window.showDashboard = showDashboard;
window.switchOrdersSource = switchOrdersSource;
window.loadUserOrders = loadUserOrders;
window.renderUserOrders = renderUserOrders;
window.updateUserOrderStatus = updateUserOrderStatus;
window.cancelUserOrder = cancelUserOrder;
window.deleteUserOrder = deleteUserOrder;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;
window.deleteOrder = deleteOrder;
window.unbanPhone = unbanPhone;
window.extendBan = extendBan;
window.deleteBan = deleteBan;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.editMenuItem = editMenuItem;
window.toggleAvailability = toggleAvailability;
window.deleteMenuItem = deleteMenuItem;
window.deleteAd = deleteAd;
window.editDeliveryArea = editDeliveryArea;
window.deleteDeliveryArea = deleteDeliveryArea;
