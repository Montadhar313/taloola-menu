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
    loadCategories();
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
// 📂 إدارة الأقسام (Categories)
// ============================================
let allCategories = [];
let editingCategoryId = null;

const categoryForm = document.getElementById('categoryForm');
const categoriesList = document.getElementById('categoriesList');
const totalCategoriesCount = document.getElementById('totalCategoriesCount');

// البيانات الأولية للأقسام
const SEED_CATEGORIES = [
    { name: 'بركر', icon: '🍔', order: 0 },
    { name: 'زنكر', icon: '🍗', order: 1 },
    { name: 'ريزو', icon: '🌯', order: 2 },
    { name: 'صاج', icon: '🥙', order: 3 },
    { name: 'كنتاكي', icon: '🍗', order: 4 },
    { name: 'ستربس', icon: '🍟', order: 5 },
    { name: 'سندويتشات', icon: '🥪', order: 6 },
    { name: 'اطباق', icon: '🍽️', order: 7 },
    { name: 'دايت', icon: '🥗', order: 8 },
    { name: 'الفنكر', icon: '🤲', order: 9 },
    { name: 'الجكن فرايز', icon: '🍟', order: 10 },
    { name: 'الصوصات', icon: '🌶️', order: 11 },
    { name: 'مشروبات غازية', icon: '🥤', order: 12 },
    { name: 'مقبلات', icon: '🥕', order: 13 }
];

// Seed الأقسام الأولية
async function seedCategories() {
    const snapshot = await db.ref('categories').once('value');
    if (!snapshot.val()) {
        console.log('🌱 Seed: إضافة الأقسام الأولية...');
        for (const cat of SEED_CATEGORIES) {
            await db.ref('categories').push(cat);
        }
        console.log(`✅ تم إضافة ${SEED_CATEGORIES.length} قسم`);
        showToast(`تم إضافة ${SEED_CATEGORIES.length} قسم افتراضي`, 'success');
    }
}

// تحميل الأقسام
function loadCategories() {
    seedCategories();
    
    db.ref('categories').orderByChild('order').on('value', (snapshot) => {
        categoriesList.innerHTML = '';
        allCategories = [];
        const categories = snapshot.val();
        
        if (!categories) {
            categoriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open fa-3x"></i>
                    <h3>لا توجد أقسام</h3>
                    <p>أضف أول قسم للمنيو</p>
                </div>`;
            totalCategoriesCount.textContent = '0';
            updateCategoryDropdown();
            return;
        }
        
        Object.keys(categories).forEach(key => {
            allCategories.push({ id: key, ...categories[key] });
        });
        
        allCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        totalCategoriesCount.textContent = allCategories.length;
        renderCategories();
        updateCategoryDropdown();
    });
}

// عرض الأقسام
function renderCategories() {
    categoriesList.innerHTML = '';
    
    if (allCategories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open fa-3x"></i>
                <h3>لا توجد أقسام</h3>
                <p>أضف أول قسم للمنيو</p>
            </div>`;
        return;
    }
    
    allCategories.forEach((cat, index) => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-id', cat.id);
        item.innerHTML = `
            <div class="category-drag-handle" title="اسحب لإعادة الترتيب">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="category-icon-display">${cat.icon || '📁'}</div>
            <div class="category-info">
                <div class="category-name">${cat.name}</div>
                <div class="category-meta">
                    <span><i class="fas fa-sort-numeric-down"></i> الترتيب: ${cat.order !== undefined ? cat.order : index}</span>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn-edit-category" onclick="editCategory('${cat.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn-delete-category" onclick="deleteCategory('${cat.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        
        // Drag & Drop events
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        
        categoriesList.appendChild(item);
    });
}

// Drag & Drop handlers
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (this === draggedItem) return;
    
    const draggedId = draggedItem.getAttribute('data-id');
    const targetId = this.getAttribute('data-id');
    
    const draggedIndex = allCategories.findIndex(c => c.id === draggedId);
    const targetIndex = allCategories.findIndex(c => c.id === targetId);
    
    // إعادة ترتيب
    const [movedItem] = allCategories.splice(draggedIndex, 1);
    allCategories.splice(targetIndex, 0, movedItem);
    
    // تحديث الترتيب في Firebase
    for (let i = 0; i < allCategories.length; i++) {
        await db.ref('categories/' + allCategories[i].id + '/order').set(i);
    }
    
    showToast('تم تحديث ترتيب الأقسام', 'success');
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// نموذج القسم
categoryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveCategoryBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value.trim() || '📁';
    const order = parseInt(document.getElementById('categoryOrder').value) || allCategories.length;
    
    try {
        const categoryData = { name, icon, order };
        
        if (id) {
            // تعديل
            await db.ref('categories/' + id).update(categoryData);
            showToast('تم تحديث القسم بنجاح', 'success');
        } else {
            // إضافة
            await db.ref('categories').push(categoryData);
            showToast('تم إضافة القسم بنجاح', 'success');
        }
        
        resetCategoryForm();
    } catch (error) {
        showToast('حدث خطأ: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> <span id="saveCategoryText">حفظ القسم</span>';
    }
});

// تعديل قسم
window.editCategory = function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    
    document.getElementById('categoryId').value = cat.id;
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryIcon').value = cat.icon || '';
    document.getElementById('categoryOrder').value = cat.order !== undefined ? cat.order : '';
    
    document.getElementById('categoryFormTitle').textContent = 'تعديل القسم';
    document.getElementById('saveCategoryText').textContent = 'حفظ التعديلات';
    document.getElementById('cancelEditCategoryBtn').style.display = 'inline-flex';
    
    // التمرير لأعلى النموذج
    document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// حذف قسم
window.deleteCategory = async function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    
    // التحقق من وجود أصناف في هذا القسم
    const menuSnapshot = await db.ref('menu').orderByChild('category').equalTo(cat.name).once('value');
    const itemsInCategory = menuSnapshot.val();
    
    let confirmMsg = `هل أنت متأكد من حذف قسم "${cat.name}"؟`;
    if (itemsInCategory) {
        const count = Object.keys(itemsInCategory).length;
        confirmMsg += `\n\n⚠️ تحذير: يوجد ${count} صنف في هذا القسم. سيتم حذفها أيضاً!`;
    }
    
    if (!confirm(confirmMsg)) return;
    
    try {
        // حذف الأصناف في القسم أولاً
        if (itemsInCategory) {
            for (const key of Object.keys(itemsInCategory)) {
                await db.ref('menu/' + key).remove();
            }
        }
        
        // حذف القسم
        await db.ref('categories/' + id).remove();
        showToast('تم حذف القسم بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف: ' + error.message, 'error');
    }
};

function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
    document.getElementById('saveCategoryText').textContent = 'حفظ القسم';
    document.getElementById('cancelEditCategoryBtn').style.display = 'none';
    document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
}

document.getElementById('resetCategoryForm').addEventListener('click', resetCategoryForm);
document.getElementById('cancelEditCategoryBtn').addEventListener('click', resetCategoryForm);

// Icon suggestions
document.querySelectorAll('.icon-suggestion').forEach(suggestion => {
    suggestion.addEventListener('click', function() {
        document.getElementById('categoryIcon').value = this.dataset.icon;
        document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// ============================================
// 🎯 Custom Select (Dropdown محسّن)
// ============================================
const customSelect = document.getElementById('menuItemCategorySelect');
const selectedText = customSelect.querySelector('.selected-text');
const optionsList = document.getElementById('categoryOptionsList');
const searchInput = customSelect.querySelector('.custom-select-search');
const hiddenInput = document.getElementById('menuItemCategory');

// فتح/إغلاق الـ dropdown
customSelect.querySelector('.custom-select-selected').addEventListener('click', (e) => {
    e.stopPropagation();
    customSelect.classList.toggle('open');
    if (customSelect.classList.contains('open')) {
        searchInput.focus();
    }
});

// إغلاق عند النقر خارج الـ dropdown
document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
        customSelect.classList.remove('open');
    }
});

// البحث في الأقسام
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    const options = optionsList.querySelectorAll('.custom-select-option');
    
    options.forEach(option => {
        const name = option.querySelector('.option-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            option.style.display = 'flex';
        } else {
            option.style.display = 'none';
        }
    });
});

// تحديث قائمة الأقسام في الـ dropdown
function updateCategoryDropdown() {
    optionsList.innerHTML = '';
    
    allCategories.forEach(cat => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', cat.name);
        option.innerHTML = `
            <span class="option-icon">${cat.icon || '📁'}</span>
            <span class="option-name">${cat.name}</span>
        `;
        
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            hiddenInput.value = value;
            selectedText.textContent = value;
            
            // تحديث الأيقونة المعروضة
            const icon = this.querySelector('.option-icon').textContent;
            if (!selectedText.querySelector('.selected-icon')) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'selected-icon';
                selectedText.insertBefore(iconSpan, selectedText.firstChild);
            }
            selectedText.querySelector('.selected-icon').textContent = icon;
            
            // تحديد الخيار المحدد
            optionsList.querySelectorAll('.custom-select-option').forEach(o => {
                o.classList.remove('selected');
            });
            this.classList.add('selected');
            
            customSelect.classList.remove('open');
            searchInput.value = '';
            optionsList.querySelectorAll('.custom-select-option').forEach(o => {
                o.style.display = 'flex';
            });
        });
        
        optionsList.appendChild(option);
    });
}

// ============================================
// 🍽️ إدارة المنيو
// ============================================
let allMenuItems = [];
let currentFilter = 'all';
let currentSearch = '';

const menuForm = document.getElementById('menuForm');
const menuList = document.getElementById('menuList');
const totalMenuCount = document.getElementById('totalMenuCount');
const activeMenuCount = document.getElementById('activeMenuCount');
const menuSearch = document.getElementById('menuSearch');

// Seed المنتجات
const SEED_MENU_ITEMS = [
    { name: 'بركر كلاسك', category: 'بركر', price: 3000, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر لحم طازج', available: true, order: 0 },
    { name: 'بركر مدخن', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر مدخن', available: true, order: 1 },
    { name: 'بركر بالجبن', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر بالجبنة', available: true, order: 2 },
    { name: 'بركر سبايسي', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر حار', available: true, order: 3 },
    { name: 'زنكر كلاسك', category: 'زنكر', price: 2500, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر دجاج مقرمش', available: true, order: 0 },
    { name: 'زنكر مكسيكانو', category: 'زنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر مكسيكي', available: true, order: 1 },
    { name: 'زنكر مدخن', category: 'زنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر مدخن', available: true, order: 2 },
    { name: 'ريزو كلاسك', category: 'ريزو', price: 4000, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'شاورما دجاج', available: true, order: 0 },
    { name: 'ريزو بالجبن', category: 'ريزو', price: 4500, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'ريزو بالجبنة', available: true, order: 1 },
    { name: 'ريزو سبايسي', category: 'ريزو', price: 4500, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'ريزو حار', available: true, order: 2 },
    { name: 'ريزو مدخن', category: 'ريزو', price: 4500, image: GITHUB_IMAGES_BASE + 'RIZO.png', description: 'ريزو مدخن', available: true, order: 3 },
    { name: 'صاج كنتاكي', category: 'صاج', price: 2000, image: GITHUB_IMAGES_BASE + 'SAJ_K.png', description: 'صاج دجاج كنتاكي', available: true, order: 0 },
    { name: 'صاج كريل', category: 'صاج', price: 1500, image: GITHUB_IMAGES_BASE + 'SAJ_G.png', description: 'صاج كريل', available: true, order: 1 },
    { name: 'كنتاكي 3 قطع', category: 'كنتاكي', price: 6500, image: GITHUB_IMAGES_BASE + 'KNTAKE.png', description: '3 قطع دجاج', available: true, order: 0 },
    { name: 'كنتاكي 5 قطع', category: 'كنتاكي', price: 10000, image: GITHUB_IMAGES_BASE + 'KNTAKE.png', description: '5 قطع دجاج', available: true, order: 1 },
    { name: 'كنتاكي 10 قطع', category: 'كنتاكي', price: 18000, image: GITHUB_IMAGES_BASE + 'KNTAKE.png', description: '10 قطع دجاج', available: true, order: 2 },
    { name: 'ستربس 4 قطع', category: 'ستربس', price: 6000, image: GITHUB_IMAGES_BASE + 'STRIPS.png', description: '4 قطع ستربس', available: true, order: 0 },
    { name: 'ستربس 6 قطع', category: 'ستربس', price: 8500, image: GITHUB_IMAGES_BASE + 'STRIPS.png', description: '6 قطع ستربس', available: true, order: 1 },
    { name: 'ستربس 12 قطعة', category: 'ستربس', price: 14500, image: GITHUB_IMAGES_BASE + 'STRIPS.png', description: '12 قطعة ستربس', available: true, order: 2 },
    { name: 'سندويتش تعلولة', category: 'سندويتشات', price: 2000, image: GITHUB_IMAGES_BASE + 'S_TALOLA.png', description: 'سندويتش خاص', available: true, order: 0 },
    { name: 'فلر', category: 'سندويتشات', price: 2500, image: GITHUB_IMAGES_BASE + 'FALAR.png', description: 'سندويتش فلر', available: true, order: 1 },
    { name: 'طبق تعلولة', category: 'اطباق', price: 2500, image: GITHUB_IMAGES_BASE + 'T_TALOLA.png', description: 'طبق خاص', available: true, order: 0 },
    { name: 'وجبة دايت', category: 'دايت', price: 4500, image: GITHUB_IMAGES_BASE + 'DAET.png', description: 'وجبة صحية', available: true, order: 0 },
    { name: 'فنكر كلاسك صغير', category: 'الفنكر', price: 1500, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر صغير', available: true, order: 0 },
    { name: 'فنكر بالجبن صغير', category: 'الفنكر', price: 2000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر بالجبنة صغير', available: true, order: 1 },
    { name: 'فنكر سبايسي صغير', category: 'الفنكر', price: 2000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر حار صغير', available: true, order: 2 },
    { name: 'فنكر كلاسك كبير', category: 'الفنكر', price: 2500, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر كبير', available: true, order: 3 },
    { name: 'فنكر بالجبن كبير', category: 'الفنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر بالجبنة كبير', available: true, order: 4 },
    { name: 'فنكر سبايسي كبير', category: 'الفنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'FINGR.png', description: 'فنكر حار كبير', available: true, order: 5 },
    { name: 'جكن فرايز صغير', category: 'الجكن فرايز', price: 2500, image: GITHUB_IMAGES_BASE + 'CHEKEN.png', description: 'بطاطس مع دجاج صغير', available: true, order: 0 },
    { name: 'جكن فرايز كبير', category: 'الجكن فرايز', price: 4000, image: GITHUB_IMAGES_BASE + 'CHEKEN.png', description: 'بطاطس مع دجاج كبير', available: true, order: 1 },
    { name: 'باربيكيو', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'BARBQ.png', description: 'صوص باربيكيو', available: true, order: 0 },
    { name: 'ثومية', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'THOM.png', description: 'صوص ثومية', available: true, order: 1 },
    { name: 'بافلو', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'SPAYSY.png', description: 'صوص بافلو', available: true, order: 2 },
    { name: 'هاني ماستر', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'HANE.png', description: 'صوص هاني ماستر', available: true, order: 3 },
    { name: 'كوكتيل', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'KOKTEL.png', description: 'صوص كوكتيل', available: true, order: 4 },
    { name: 'شيدر', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'SHADER.png', description: 'صوص شيدر', available: true, order: 5 },
    { name: 'روستر', category: 'الصوصات', price: 250, image: GITHUB_IMAGES_BASE + 'ROSTER.png', description: 'صوص روستر', available: true, order: 6 },
    { name: 'كولا', category: 'مشروبات غازية', price: 500, image: GITHUB_IMAGES_BASE + 'COLA.png', description: 'كولا منعشة', available: true, order: 0 },
    { name: 'فانتا', category: 'مشروبات غازية', price: 500, image: GITHUB_IMAGES_BASE + 'FANTA.png', description: 'فانتا برتقال', available: true, order: 1 },
    { name: 'سبرايت', category: 'مشروبات غازية', price: 500, image: GITHUB_IMAGES_BASE + 'SPRITE.png', description: 'سبرايت ليمون', available: true, order: 2 },
    { name: 'ماعون مقبلات صغير', category: 'مقبلات', price: 1500, image: GITHUB_IMAGES_BASE + 'MO_1.png', description: 'ماعون مقبلات صغير', available: true, order: 0 },
    { name: 'ماعون مقبلات كبير', category: 'مقبلات', price: 2000, image: GITHUB_IMAGES_BASE + 'MO_1.png', description: 'ماعون مقبلات كبير', available: true, order: 1 }
];

async function seedMenuItems() {
    const snapshot = await db.ref('menu').once('value');
    if (!snapshot.val()) {
        console.log('🌱 Seed: إضافة المنتجات الأولية...');
        for (const item of SEED_MENU_ITEMS) {
            await db.ref('menu').push(item);
        }
        console.log(`✅ تم إضافة ${SEED_MENU_ITEMS.length} منتج`);
        showToast(`تم إضافة ${SEED_MENU_ITEMS.length} منتج افتراضي`, 'success');
    }
}

function loadMenuItems() {
    seedMenuItems();
    
    db.ref('menu').on('value', (snapshot) => {
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
        
        allMenuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        totalMenuCount.textContent = allMenuItems.length;
        activeMenuCount.textContent = allMenuItems.filter(i => i.available).length;
        
        renderMenuItems();
    });
}

function renderMenuItems() {
    menuList.innerHTML = '';
    
    let filteredItems = allMenuItems;
    
    // تطبيق الفلتر
    if (currentFilter !== 'all') {
        filteredItems = filteredItems.filter(i => i.category === currentFilter);
    }
    
    // تطبيق البحث
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filteredItems = filteredItems.filter(i => 
            i.name.toLowerCase().includes(search) || 
            (i.description && i.description.toLowerCase().includes(search))
        );
    }
    
    if (filteredItems.length === 0) {
        menuList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-search fa-3x"></i>
                <h3>لا توجد نتائج</h3>
                <p>جرب البحث بكلمات مختلفة</p>
            </div>`;
        return;
    }
    
    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `menu-card ${!item.available ? 'unavailable' : ''}`;
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteMenuItem('${item.id}')" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
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
                </div>
            </div>
        `;
        menuList.appendChild(card);
    });
}

// Chips الفلترة
function setupCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    
    // تحديث chips عند تحميل الأقسام
    db.ref('categories').orderByChild('order').on('value', (snapshot) => {
        const categories = snapshot.val();
        if (!categories) return;
        
        // إزالة chips القديمة (عدا "الكل")
        filterContainer.querySelectorAll('.chip:not([data-filter="all"])').forEach(c => c.remove());
        
        Object.keys(categories).forEach(key => {
            const cat = categories[key];
            const chip = document.createElement('button');
            chip.className = 'chip';
            chip.setAttribute('data-filter', cat.name);
            chip.innerHTML = `${cat.icon || '📁'} ${cat.name}`;
            
            chip.addEventListener('click', function() {
                filterContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.getAttribute('data-filter');
                renderMenuItems();
            });
            
            filterContainer.appendChild(chip);
        });
    });
    
    // زر "الكل"
    filterContainer.querySelector('[data-filter="all"]').addEventListener('click', function() {
        filterContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentFilter = 'all';
        renderMenuItems();
    });
}

setupCategoryFilters();

// البحث
menuSearch.addEventListener('input', function() {
    currentSearch = this.value.trim();
    renderMenuItems();
});

// نموذج المنيو
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
    
    if (!category) {
        showToast('الرجاء اختيار القسم', 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>حفظ الصنف</span>';
        return;
    }
    
    if (image) {
        try { new URL(image); } catch (e) {
            showToast('رابط الصورة غير صالح', 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>حفظ الصنف</span>';
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
            await db.ref('menu/' + id).update(itemData);
            showToast('تم تحديث الصنف بنجاح', 'success');
        } else {
            itemData.order = allMenuItems.length;
            itemData.createdAt = Date.now();
            await db.ref('menu').push(itemData);
            showToast('تم إضافة الصنف بنجاح', 'success');
        }
        resetMenuForm();
    } catch (error) {
        showToast('حدث خطأ: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> <span id="saveMenuItemText">حفظ الصنف</span>';
    }
});

window.editMenuItem = function(id) {
    const item = allMenuItems.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('menuItemName').value = item.name;
    document.getElementById('menuItemCategory').value = item.category;
    
    // تحديث الـ dropdown
    const selectedTextEl = customSelect.querySelector('.selected-text');
    selectedTextEl.textContent = item.category;
    const cat = allCategories.find(c => c.name === item.category);
    if (cat) {
        if (!selectedTextEl.querySelector('.selected-icon')) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'selected-icon';
            selectedTextEl.insertBefore(iconSpan, selectedTextEl.firstChild);
        }
        selectedTextEl.querySelector('.selected-icon').textContent = cat.icon || '📁';
    }
    
    document.getElementById('menuItemPrice').value = item.price;
    document.getElementById('menuItemImage').value = item.image || '';
    document.getElementById('menuItemDescription').value = item.description || '';
    document.getElementById('menuItemAvailable').checked = item.available;
    
    document.getElementById('menuFormTitle').textContent = 'تعديل الصنف';
    document.getElementById('saveMenuItemText').textContent = 'حفظ التعديلات';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    
    document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('قم بتعديل البيانات ثم اضغط حفظ', 'success');
};

window.toggleAvailability = async function(id, newValue) {
    try {
        await db.ref('menu/' + id + '/available').set(newValue);
        showToast(newValue ? 'تم إظهار الصنف' : 'تم إخفاء الصنف', 'success');
    } catch (error) {
        showToast('فشل التحديث: ' + error.message, 'error');
    }
};

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

function resetMenuForm() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuFormTitle').textContent = 'إضافة صنف جديد';
    document.getElementById('saveMenuItemText').textContent = 'حفظ الصنف';
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    // إعادة تعيين الـ dropdown
    const selectedTextEl = customSelect.querySelector('.selected-text');
    selectedTextEl.textContent = 'اختر القسم';
    const icon = selectedTextEl.querySelector('.selected-icon');
    if (icon) icon.remove();
}

document.getElementById('resetMenuForm').addEventListener('click', resetMenuForm);
document.getElementById('cancelEditBtn').addEventListener('click', resetMenuForm);

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
