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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Base URL للصور من GitHub
const GITHUB_IMAGES_BASE = 'https://raw.githubusercontent.com/montadhar313/taloola-menu/main/assets/images/';

// ============================================
// 🔐 نظام المصادقة
// ============================================
const ADMIN_PASSWORD = "TaloolaAdmin@2024";
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    showDashboard();
}

loginBtn.addEventListener('click', () => {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showDashboard();
    } else {
        loginError.textContent = 'كلمة المرور غير صحيحة!';
        setTimeout(() => loginError.textContent = '', 3000);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('isAdminLoggedIn');
        location.reload();
    }
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    loadAds();
    loadMenuItems();
}

// ============================================
// 📑 إدارة التبويبات
// ============================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.disabled) return;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
});

// ============================================
// 📢 إدارة الإعلانات
// ============================================
const adForm = document.getElementById('adForm');
const adsList = document.getElementById('adsList');
const imageUrlInput = document.getElementById('imageUrl');
const previewBtn = document.getElementById('previewBtn');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const totalAdsCount = document.getElementById('totalAdsCount');

previewBtn.addEventListener('click', () => {
    const url = imageUrlInput.value.trim();
    if (!url) return showToast('الرجاء إدخال رابط الصورة أولاً', 'error');
    try { new URL(url); } catch (e) { return showToast('الرابط غير صالح', 'error'); }
    imagePreview.src = url;
    imagePreviewContainer.style.display = 'block';
});

removeImageBtn.addEventListener('click', () => {
    imageUrlInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
});

adForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveAdBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    const title = document.getElementById('adTitle').value.trim();
    const description = document.getElementById('adDescription').value.trim();
    const price = document.getElementById('adPrice').value.trim();
    const imageUrl = imageUrlInput.value.trim();

    if (imageUrl) {
        try { new URL(imageUrl); } catch (e) {
            showToast('رابط الصورة غير صالح', 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
            return;
        }
    }

    try {
        const newAd = {
            title, description,
            price: price || '',
            imageUrl: imageUrl || '',
            template: 'red',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ar-EG')
        };
        await db.ref('ads').push(newAd);
        showToast('تم نشر الإعلان بنجاح!', 'success');
        adForm.reset();
        imagePreviewContainer.style.display = 'none';
    } catch (error) {
        showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
    }
});

adForm.addEventListener('reset', () => {
    setTimeout(() => {
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
    }, 10);
});

function loadAds() {
    db.ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
        adsList.innerHTML = '';
        const ads = snapshot.val();
        if (!ads) {
            adsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-bullhorn fa-3x"></i>
                    <h3>لا توجد إعلانات</h3>
                    <p>أضف أول إعلان لبدء عرض العروض الخاصة</p>
                </div>`;
            totalAdsCount.textContent = '0';
            return;
        }
        const sortedAds = Object.keys(ads).reverse();
        totalAdsCount.textContent = sortedAds.length;
        sortedAds.forEach(key => {
            const ad = ads[key];
            const card = document.createElement('div');
            card.className = 'ad-card';
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteAd('${key}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}" onerror="this.style.display='none'">` : ''}
                <div class="ad-card-content">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<div class="price">${ad.price} د.ع</div>` : ''}
                    <div class="date"><i class="fas fa-calendar"></i> ${ad.date}</div>
                </div>`;
            adsList.appendChild(card);
        });
    });
}

window.deleteAd = async function(key) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
        await db.ref('ads/' + key).remove();
        showToast('تم حذف الإعلان بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف: ' + error.message, 'error');
    }
};

// ============================================
// 🍽️ إدارة المنيو (CRUD)
// ============================================
const menuForm = document.getElementById('menuForm');
const menuList = document.getElementById('menuList');
const totalMenuCount = document.getElementById('totalMenuCount');
const activeMenuCount = document.getElementById('activeMenuCount');
let allMenuItems = [];
let currentFilter = 'all';

// البيانات الأولية (Seed) - جميع المنتجات الـ 43
const SEED_MENU_ITEMS = [
    // بركر
    { name: 'بركر كلاسك', category: 'بركر', price: 3000, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر لحم طازج مع خس وطماطم وصوص خاص', available: true },
    { name: 'بركر مدخن', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر مدخن بنكهة مميزة', available: true },
    { name: 'بركر بالجبن', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر مع جبنة ذائبة', available: true },
    { name: 'بركر سبايسي', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر حار مع صلصة سبايسي', available: true },
    
    // زنكر
    { name: 'زنكر كلاسك', category: 'زنكر', price: 2500, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر دجاج مقرمش', available: true },
    { name: 'زنكر مكسيكانو', category: 'زنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر بنكهة مكسيكية حارة', available: true },
    { name: 'زنكر مدخن', category: 'زنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر مدخن بنكهة فريدة', available: true },
    
    // ريزو
    { name: 'ريزو كلاسك', category: 'ريزو', price: 4000, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'شاورما دجاج مع صوص خاص', available: true },
    { name: 'ريزو بالجبن', category: 'ريزو', price: 4500, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'ريزو مع جبنة ذائبة', available: true },
    { name: 'ريزو سبايسي', category: 'ريزو', price: 4500, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'ريزو حار', available: true },
    { name: 'ريزو مدخن', category: 'ريزو', price: 4500, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'ريزو مدخن', available: true },
    
    // صاج
    { name: 'صاج كنتاكي', category: 'صاج', price: 2000, image: GITHUB_IMAGES_BASE + 'SAJ_K.png', description: 'صاج دجاج كنتاكي', available: true },
    { name: 'صاج كريل', category: 'صاج', price: 1500, image: GITHUB_IMAGES_BASE + 'SAJ_G.png', description: 'صاج كريل طازج', available: true },
    
    // كنتاكي
    { name: 'كنتاكي 3 قطع', category: 'كنتاكي', price: 6500, image: GITHUB_IMAGES_BASE + 'KNTAKE.png', description: '3 قطع دجاج مقرمش', available: true },
    { name: 'كنتاكي 5 قطع', category: 'كنتاكي', price: 10000, image: GITHUB_IMAGES_BASE + 'KNTAKE.png', description: '5 قطع دجاج مقرمش', available: true },
    { name: 'كنتاكي 10 قطع', category: 'كنتاكي', price: 18000, image: GITHUB_IMAGES_BASE + 'KNTAKE.png', description: '10 قطع دجاج مقرمش', available: true },
    
    // ستربس
    { name: 'ستربس 4 قطع', category: 'ستربس', price: 6000, image: GITHUB_IMAGES_BASE + 'STRIPS.png', description: '4 قطع ستربس دجاج', available: true },
    { name: 'ستربس 6 قطع', category: 'ستربس', price: 8500, image: GITHUB_IMAGES_BASE + 'STRIPS.png', description: '6 قطع ستربس دجاج', available: true },
    { name: 'ستربس 12 قطعة', category: 'ستربس', price: 14500, image: GITHUB_IMAGES_BASE + 'STRIPS.png', description: '12 قطعة ستربس دجاج', available: true },
    
    // سندويتشات
    { name: 'سندويتش تعلولة', category: 'سندويتشات', price: 2000, image: GITHUB_IMAGES_BASE + 'S_TALOLA.png', description: 'سندويتش خاص من مطعم تعلولة', available: true },
    { name: 'فلر', category: 'سندويتشات', price: 2500, image: GITHUB_IMAGES_BASE + 'FALAR.png', description: 'سندويتش فلر المميز', available: true },
    
    // اطباق
    { name: 'طبق تعلولة', category: 'اطباق', price: 2500, image: GITHUB_IMAGES_BASE + 'T_TALOLA.png', description: 'طبق تعلولة الخاص', available: true },
    
    // دايت
    { name: 'وجبة دايت', category: 'دايت', price: 4500, image: GITHUB_IMAGES_BASE + 'DAET.png', description: 'وجبة صحية خفيفة', available: true },
    
    // الفنكر
    { name: 'فنكر كلاسك صغير', category: 'الفنكر', price: 1500, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر دجاج صغير', available: true },
    { name: 'فنكر بالجبن صغير', category: 'الفنكر', price: 2000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر بالجبن صغير', available: true },
    { name: 'فنكر سبايسي صغير', category: 'الفنكر', price: 2000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر حار صغير', available: true },
    { name: 'فنكر كلاسك كبير', category: 'الفنكر', price: 2500, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر دجاج كبير', available: true },
    { name: 'فنكر بالجبن كبير', category: 'الفنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر بالجبن كبير', available: true },
    { name: 'فنكر سبايسي كبير', category: 'الفنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر حار كبير', available: true },
    
    // الجكن فرايز
    { name: 'جكن فرايز صغير', category: 'الجكن فرايز', price: 2500, image: GITHUB_IMAGES_BASE + 'CHEKEN.png', description: 'بطاطس مقلية مع دجاج صغير', available: true },
    { name: 'جكن فرايز كبير', category: 'الجكن فرايز', price: 4000, image: GITHUB_IMAGES_BASE + 'CHEKEN.png', description: 'بطاطس مقلية مع دجاج كبير', available: true },
    
    // الصوصات
    { name: 'باربيكيو', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'BARBQ.png', description: 'صوص باربيكيو', available: true },
    { name: 'ثومية', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'THOM.png', description: 'صوص ثومية', available: true },
    { name: 'بافلو', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'SPAYSY.png', description: 'صوص بافلو حار', available: true },
    { name: 'هاني ماستر', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'HANE.png', description: 'صوص هاني ماستر', available: true },
    { name: 'كوكتيل', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'KOKTEL.png', description: 'صوص كوكتيل', available: true },
    { name: 'شيدر', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'SHADER.png', description: 'صوص شيدر', available: true },
    { name: 'روستر', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'ROSTER.png', description: 'صوص روستر', available: true },
    
    // مشروبات غازية
    { name: 'كولا', category: 'مشروبات غازية', price: 500, image: GITHUB_IMAGES_BASE + 'COLA.png', description: 'كولا منعشة', available: true },
    { name: 'فانتا', category: 'مشروبات غازية', price: 500, image: GITHUB_IMAGES_BASE + 'FANTA.png', description: 'فانتا برتقال', available: true },
    { name: 'سبرايت', category: 'مشروبات غازية', price: 500, image: GITHUB_IMAGES_BASE + 'SPRITE.png', description: 'سبرايت ليمون', available: true },
    
    // مقبلات
    { name: 'ماعون مقبلات صغير', category: 'مقبلات', price: 1500, image: GITHUB_IMAGES_BASE + 'MO_1.png', description: 'ماعون مقبلات صغير', available: true },
    { name: 'ماعون مقبلات كبير', category: 'مقبلات', price: 2000, image: GITHUB_IMAGES_BASE + 'MO_1.png', description: 'ماعون مقبلات كبير', available: true }
];

// Seed Script - إضافة المنتجات الأولية إذا كانت قاعدة البيانات فارغة
async function seedMenuItems() {
    const snapshot = await db.ref('menu').once('value');
    if (!snapshot.val()) {
        console.log('🌱 Seed: إضافة المنتجات الأولية...');
        for (const item of SEED_MENU_ITEMS) {
            await db.ref('menu').push({
                ...item,
                order: SEED_MENU_ITEMS.indexOf(item),
                createdAt: Date.now()
            });
        }
        console.log(`✅ تم إضافة ${SEED_MENU_ITEMS.length} منتج`);
        showToast(`تم إضافة ${SEED_MENU_ITEMS.length} منتج افتراضي`, 'success');
    }
}

// تحميل الأصناف
function loadMenuItems() {
    // Seed أول مرة
    seedMenuItems();
    
    db.ref('menu').orderByChild('order').on('value', (snapshot) => {
        menuList.innerHTML = '';
        allMenuItems = [];
        const items = snapshot.val();
        
        if (!items) {
            menuList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-utensils fa-3x"></i>
                    <h3>لا توجد أصناف</h3>
                    <p>أضف أول صنف للمنيو</p>
                </div>`;
            totalMenuCount.textContent = '0';
            activeMenuCount.textContent = '0';
            return;
        }
        
        Object.keys(items).forEach(key => {
            allMenuItems.push({ id: key, ...items[key] });
        });
        
        // ترتيب حسب order
        allMenuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        totalMenuCount.textContent = allMenuItems.length;
        activeMenuCount.textContent = allMenuItems.filter(i => i.available).length;
        
        renderMenuItems();
    });
}

// عرض الأصناف مع الفلترة
function renderMenuItems() {
    menuList.innerHTML = '';
    const filteredItems = currentFilter === 'all' 
        ? allMenuItems 
        : allMenuItems.filter(i => i.category === currentFilter);
    
    if (filteredItems.length === 0) {
        menuList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-search fa-3x"></i>
                <h3>لا توجد أصناف</h3>
                <p>لا توجد أصناف في هذا القسم</p>
            </div>`;
        return;
    }
    
    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `menu-card ${!item.available ? 'unavailable' : ''}`;
        card.innerHTML = `
            <div class="menu-card-image">
                ${item.image 
                    ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-utensils placeholder-icon\\'></i>'">`
                    : '<i class="fas fa-utensils placeholder-icon"></i>'}
            </div>
            <div class="menu-card-content">
                <div class="menu-card-header">
                    <h4>${item.name}</h4>
                    <span class="menu-card-category">${item.category}</span>
                </div>
                <p>${item.description || 'لا يوجد وصف'}</p>
                <div class="price">${item.price.toLocaleString('ar-EG')} د.ع</div>
                <div class="menu-card-actions">
                    <button class="btn-edit" onclick="editMenuItem('${item.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn-toggle-availability ${!item.available ? 'unavailable' : ''}" onclick="toggleAvailability('${item.id}', ${!item.available})">
                        <i class="fas fa-${item.available ? 'eye' : 'eye-slash'}"></i>
                        ${item.available ? 'إخفاء' : 'إظهار'}
                    </button>
                    <button class="btn-delete-item" onclick="deleteMenuItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        menuList.appendChild(card);
    });
}

// فلترة الأصناف
document.querySelectorAll('#categoryFilters .chip').forEach(chip => {
    chip.addEventListener('click', function() {
        document.querySelectorAll('#categoryFilters .chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderMenuItems();
    });
});

// حفظ/تعديل صنف
menuForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveMenuItemBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    const id = document.getElementById('menuItemId').value;
    const name = document.getElementById('menuItemName').value.trim();
    const category = document.getElementById('menuItemCategory').value;
    const price = parseInt(document.getElementById('menuItemPrice').value);
    const image = document.getElementById('menuItemImage').value.trim();
    const description = document.getElementById('menuItemDescription').value.trim();
    const available = document.getElementById('menuItemAvailable').checked;

    if (image) {
        try { new URL(image); } catch (e) {
            showToast('رابط الصورة غير صالح', 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الصنف';
            return;
        }
    }

    const itemData = {
        name, category, price,
        image: image || '',
        description: description || '',
        available,
        updatedAt: Date.now()
    };

    try {
        if (id) {
            // تعديل
            await db.ref('menu/' + id).update(itemData);
            showToast('تم تحديث الصنف بنجاح', 'success');
        } else {
            // إضافة
            itemData.order = allMenuItems.length;
            itemData.createdAt = Date.now();
            await db.ref('menu').push(itemData);
            showToast('تم إضافة الصنف بنجاح', 'success');
        }
        menuForm.reset();
        document.getElementById('menuItemId').value = '';
        document.getElementById('menuItemAvailable').checked = true;
    } catch (error) {
        showToast('حدث خطأ: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الصنف';
    }
});

menuForm.addEventListener('reset', () => {
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuItemAvailable').checked = true;
});

// تعديل صنف
window.editMenuItem = function(id) {
    const item = allMenuItems.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('menuItemName').value = item.name;
    document.getElementById('menuItemCategory').value = item.category;
    document.getElementById('menuItemPrice').value = item.price;
    document.getElementById('menuItemImage').value = item.image || '';
    document.getElementById('menuItemDescription').value = item.description || '';
    document.getElementById('menuItemAvailable').checked = item.available;
    
    // التمرير لأعلى النموذج
    document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('قم بتعديل البيانات ثم اضغط حفظ', 'success');
};

// تبديل التوفر
window.toggleAvailability = async function(id, newValue) {
    try {
        await db.ref('menu/' + id + '/available').set(newValue);
        showToast(newValue ? 'تم إظهار الصنف' : 'تم إخفاء الصنف', 'success');
    } catch (error) {
        showToast('فشل التحديث: ' + error.message, 'error');
    }
};

// حذف صنف
window.deleteMenuItem = async function(id) {
    const item = allMenuItems.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) return;
    
    try {
        await db.ref('menu/' + id).remove();
        showToast('تم حذف الصنف بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف: ' + error.message, 'error');
    }
};

// ============================================
// 🔔 Toast
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.4s ease reverse';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
