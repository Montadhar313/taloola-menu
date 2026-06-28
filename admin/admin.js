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

// ============================================
// 🔐 نظام المصادقة
// ============================================
const ADMIN_PASSWORD = "TaloolaAdmin@2024";

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    if (!loginScreen || !dashboard || !loginBtn) return;
    
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showDashboard();
    }
    
    loginBtn.addEventListener('click', () => {
        const password = document.getElementById('adminPassword').value;
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            showDashboard();
        } else {
            if (loginError) loginError.textContent = 'كلمة المرور غير صحيحة!';
            setTimeout(() => { if (loginError) loginError.textContent = ''; }, 3000);
        }
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                sessionStorage.removeItem('isAdminLoggedIn');
                location.reload();
            }
        });
    }
});

function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    loadCategories();
    loadMenuItems();
    loadAds();
    loadThemeSettings();
}

// ============================================
// 📑 إدارة التبويبات
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById('tab-' + this.dataset.tab);
            if (targetTab) targetTab.classList.add('active');
        });
    });
});

// ============================================
// 🎨 إدارة الثيم والألوان
// ============================================
let currentTheme = {
    mode: 'dark',
    primaryColor: '#c70301',
    secondaryColor: '#fedb17',
    backgroundType: 'video',
    videoUrl: 'https://v1.pinimg.com/videos/mc/720p/44/0c/df/440cdf2f4bdc8fe1d314c49d4876570a.mp4',
    bgColor: '#1a1a1a',
    gradientColor1: '#1a1a1a',
    gradientColor2: '#2c2c2c'
};

function loadThemeSettings() {
    db.ref('theme').once('value').then(snapshot => {
        const theme = snapshot.val();
        if (theme) {
            currentTheme = { ...currentTheme, ...theme };
            applyThemeToUI();
        }
    });
}

function applyThemeToUI() {
    // تطبيق وضع العرض
    document.getElementById('themeLight').checked = currentTheme.mode === 'light';
    document.getElementById('themeDark').checked = currentTheme.mode === 'dark';
    
    // تطبيق الألوان
    document.getElementById('primaryColor').value = currentTheme.primaryColor;
    document.getElementById('primaryColorText').value = currentTheme.primaryColor;
    document.getElementById('secondaryColor').value = currentTheme.secondaryColor;
    document.getElementById('secondaryColorText').value = currentTheme.secondaryColor;
    
    // تطبيق الخلفية
    document.getElementById('bgVideo').checked = currentTheme.backgroundType === 'video';
    document.getElementById('bgColor').checked = currentTheme.backgroundType === 'color';
    document.getElementById('bgGradient').checked = currentTheme.backgroundType === 'gradient';
    
    document.getElementById('videoUrl').value = currentTheme.videoUrl;
    document.getElementById('bgColorPicker').value = currentTheme.bgColor;
    document.getElementById('bgColorText').value = currentTheme.bgColor;
    document.getElementById('gradientColor1').value = currentTheme.gradientColor1;
    document.getElementById('gradientColor2').value = currentTheme.gradientColor2;
    
    updateBackgroundOptionsVisibility();
}

function updateBackgroundOptionsVisibility() {
    document.getElementById('videoOptions').style.display = currentTheme.backgroundType === 'video' ? 'block' : 'none';
    document.getElementById('colorOptions').style.display = currentTheme.backgroundType === 'color' ? 'block' : 'none';
    document.getElementById('gradientOptions').style.display = currentTheme.backgroundType === 'gradient' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    // أحداث الألوان
    document.getElementById('primaryColor').addEventListener('input', function() {
        document.getElementById('primaryColorText').value = this.value;
    });
    
    document.getElementById('primaryColorText').addEventListener('input', function() {
        document.getElementById('primaryColor').value = this.value;
    });
    
    document.getElementById('secondaryColor').addEventListener('input', function() {
        document.getElementById('secondaryColorText').value = this.value;
    });
    
    document.getElementById('secondaryColorText').addEventListener('input', function() {
        document.getElementById('secondaryColor').value = this.value;
    });
    
    document.getElementById('bgColorPicker').addEventListener('input', function() {
        document.getElementById('bgColorText').value = this.value;
    });
    
    document.getElementById('bgColorText').addEventListener('input', function() {
        document.getElementById('bgColorPicker').value = this.value;
    });
    
    // أحداث الخلفية
    document.querySelectorAll('input[name="backgroundType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            currentTheme.backgroundType = this.value;
            updateBackgroundOptionsVisibility();
        });
    });
    
    // حفظ الإعدادات
    document.getElementById('saveThemeBtn').addEventListener('click', async () => {
        currentTheme.mode = document.querySelector('input[name="themeMode"]:checked').value;
        currentTheme.primaryColor = document.getElementById('primaryColor').value;
        currentTheme.secondaryColor = document.getElementById('secondaryColor').value;
        currentTheme.videoUrl = document.getElementById('videoUrl').value;
        currentTheme.bgColor = document.getElementById('bgColorPicker').value;
        currentTheme.gradientColor1 = document.getElementById('gradientColor1').value;
        currentTheme.gradientColor2 = document.getElementById('gradientColor2').value;
        
        try {
            await db.ref('theme').set(currentTheme);
            showToast('✅ تم حفظ الإعدادات بنجاح', 'success');
        } catch (error) {
            showToast('❌ فشل حفظ الإعدادات', 'error');
        }
    });
    
    // إعادة تعيين
    document.getElementById('resetThemeBtn').addEventListener('click', () => {
        currentTheme = {
            mode: 'dark',
            primaryColor: '#c70301',
            secondaryColor: '#fedb17',
            backgroundType: 'video',
            videoUrl: 'https://v1.pinimg.com/videos/mc/720p/44/0c/df/440cdf2f4bdc8fe1d314c49d4876570a.mp4',
            bgColor: '#1a1a1a',
            gradientColor1: '#1a1a1a',
            gradientColor2: '#2c2c2c'
        };
        applyThemeToUI();
    });
});

// ============================================
// 📂 إدارة الأقسام
// ============================================
let allCategories = [];

function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const totalCategoriesCount = document.getElementById('totalCategoriesCount');
    
    if (!categoriesList) return;
    
    // Seed الأقسام الأولية
    db.ref('categories').once('value').then(snapshot => {
        if (!snapshot.val()) {
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
            
            Promise.all(SEED_CATEGORIES.map(cat => db.ref('categories').push(cat)))
                .then(() => showToast(`تم إضافة ${SEED_CATEGORIES.length} قسم افتراضي`, 'success'));
        }
    });
    
    db.ref('categories').orderByChild('order').on('value', (snapshot) => {
        categoriesList.innerHTML = '';
        allCategories = [];
        const categories = snapshot.val();
        
        if (!categories) {
            if (totalCategoriesCount) totalCategoriesCount.textContent = '0';
            updateCategoryDropdown();
            return;
        }
        
        Object.keys(categories).forEach(key => {
            allCategories.push({ id: key, ...categories[key] });
        });
        
        allCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (totalCategoriesCount) totalCategoriesCount.textContent = allCategories.length;
        renderCategories();
        updateCategoryDropdown();
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
        
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        
        categoriesList.appendChild(item);
    });
}

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
    if (this !== draggedItem) this.classList.add('drag-over');
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
    
    const [movedItem] = allCategories.splice(draggedIndex, 1);
    allCategories.splice(targetIndex, 0, movedItem);
    
    try {
        for (let i = 0; i < allCategories.length; i++) {
            await db.ref('categories/' + allCategories[i].id + '/order').set(i);
        }
        showToast('تم تحديث ترتيب الأقسام', 'success');
    } catch (error) {
        showToast('فشل تحديث الترتيب', 'error');
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

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
    
    document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.deleteCategory = async function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    
    try {
        const menuSnapshot = await db.ref('menu').orderByChild('category').equalTo(cat.name).once('value');
        const itemsInCategory = menuSnapshot.val();
        
        let confirmMsg = `هل أنت متأكد من حذف قسم "${cat.name}"؟`;
        if (itemsInCategory) {
            const count = Object.keys(itemsInCategory).length;
            confirmMsg += `\n\n⚠️ تحذير: يوجد ${count} صنف في هذا القسم!`;
        }
        
        if (!confirm(confirmMsg)) return;
        
        if (itemsInCategory) {
            for (const key of Object.keys(itemsInCategory)) {
                await db.ref('menu/' + key).remove();
            }
        }
        
        await db.ref('categories/' + id).remove();
        showToast('تم حذف القسم بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const categoryForm = document.getElementById('categoryForm');
    if (!categoryForm) return;
    
    categoryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveCategoryBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            document.getElementById('saveCategoryText').textContent = 'جاري الحفظ...';
        }
        
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || '📁';
        const order = parseInt(document.getElementById('categoryOrder').value) || allCategories.length;
        
        if (!name) {
            showToast('الرجاء إدخال اسم القسم', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                document.getElementById('saveCategoryText').textContent = 'حفظ القسم';
            }
            return;
        }
        
        try {
            const categoryData = { name, icon, order };
            
            if (id) {
                await db.ref('categories/' + id).update(categoryData);
                showToast('تم تحديث القسم بنجاح', 'success');
            } else {
                await db.ref('categories').push(categoryData);
                showToast('تم إضافة القسم بنجاح', 'success');
            }
            
            resetCategoryForm();
        } catch (error) {
            showToast('حدث خطأ', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                document.getElementById('saveCategoryText').textContent = 'حفظ القسم';
            }
        }
    });
    
    document.getElementById('resetCategoryForm').addEventListener('click', resetCategoryForm);
    document.getElementById('cancelEditCategoryBtn').addEventListener('click', resetCategoryForm);
    
    document.querySelectorAll('.icon-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', function() {
            document.getElementById('categoryIcon').value = this.dataset.icon;
            document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
});

function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryFormTitle').textContent = 'إضافة قسم جديد';
    document.getElementById('saveCategoryText').textContent = 'حفظ القسم';
    document.getElementById('cancelEditCategoryBtn').style.display = 'none';
    document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
}

function updateCategoryDropdown() {
    const optionsList = document.getElementById('categoryOptionsList');
    if (!optionsList) return;
    
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
            document.getElementById('menuItemCategory').value = this.getAttribute('data-value');
            const selectedText = document.querySelector('.custom-select-selected .selected-text');
            if (selectedText) selectedText.textContent = this.getAttribute('data-value');
            
            optionsList.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            document.getElementById('menuItemCategorySelect').classList.remove('open');
        });
        
        optionsList.appendChild(option);
    });
}

// Custom Select
document.addEventListener('DOMContentLoaded', () => {
    const customSelect = document.getElementById('menuItemCategorySelect');
    if (!customSelect) return;
    
    const selectedDiv = customSelect.querySelector('.custom-select-selected');
    const searchInput = customSelect.querySelector('.custom-select-search');
    const optionsList = document.getElementById('categoryOptionsList');
    
    if (selectedDiv) {
        selectedDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('open');
            if (customSelect.classList.contains('open') && searchInput) {
                searchInput.focus();
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const options = optionsList.querySelectorAll('.custom-select-option');
            
            options.forEach(option => {
                const name = option.querySelector('.option-name').textContent.toLowerCase();
                option.style.display = name.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    }
});

// ============================================
// 🍽️ إدارة المنيو
// ============================================
let allMenuItems = [];
let currentFilter = 'all';
let currentSearch = '';

function loadMenuItems() {
    const menuList = document.getElementById('menuList');
    const totalMenuCount = document.getElementById('totalMenuCount');
    const activeMenuCount = document.getElementById('activeMenuCount');
    
    if (!menuList) return;
    
    // Seed المنتجات الأولية
    db.ref('menu').once('value').then(snapshot => {
        if (!snapshot.val()) {
            const SEED_MENU_ITEMS = [
                { name: 'برجر كلاسك', category: 'بركر', price: 3000, image: 'https://i.imgur.com/8KqZQZK.jpg', description: 'برغر لحم طازج', available: true, order: 0 },
                { name: 'بركر مدخن', category: 'بركر', price: 3500, image: 'https://i.imgur.com/8KqZQZK.jpg', description: 'برغر مدخن', available: true, order: 1 },
                { name: 'زنكر كلاسك', category: 'زنكر', price: 2500, image: 'https://i.imgur.com/8KqZQZK.jpg', description: 'زنكر دجاج مقرمش', available: true, order: 0 }
            ];
            
            Promise.all(SEED_MENU_ITEMS.map(item => db.ref('menu').push(item)))
                .then(() => showToast(`تم إضافة ${SEED_MENU_ITEMS.length} منتج افتراضي`, 'success'));
        }
    });
    
    db.ref('menu').on('value', (snapshot) => {
        menuList.innerHTML = '';
        allMenuItems = [];
        const items = snapshot.val();
        
        if (!items) {
            if (totalMenuCount) totalMenuCount.textContent = '0';
            if (activeMenuCount) activeMenuCount.textContent = '0';
            return;
        }
        
        Object.keys(items).forEach(key => {
            allMenuItems.push({ id: key, ...items[key] });
        });
        
        allMenuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (totalMenuCount) totalMenuCount.textContent = allMenuItems.length;
        if (activeMenuCount) activeMenuCount.textContent = allMenuItems.filter(i => i.available).length;
        
        renderMenuItems();
    });
}

function renderMenuItems() {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;
    
    menuList.innerHTML = '';
    
    let filteredItems = allMenuItems;
    
    if (currentFilter !== 'all') {
        filteredItems = filteredItems.filter(i => i.category === currentFilter);
    }
    
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
            </div>`;
        return;
    }
    
    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `menu-card ${!item.available ? 'unavailable' : ''}`;
        
        // 🆕 معالجة الصور - استخدام placeholder إذا كانت الصورة غير موجودة
        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">`
            : `<img src="https://via.placeholder.com/300x200?text=No+Image" alt="${item.name}">`;
        
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteMenuItem('${item.id}')" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
            <div class="menu-card-image">
                ${imageHtml}
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
    document.getElementById('menuFormTitle').textContent = 'تعديل الصنف';
    document.getElementById('saveMenuItemText').textContent = 'حفظ التعديلات';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    
    document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.toggleAvailability = async function(id, newValue) {
    try {
        await db.ref('menu/' + id + '/available').set(newValue);
        showToast(newValue ? 'تم إظهار الصنف' : 'تم إخفاء الصنف', 'success');
    } catch (error) {
        showToast('فشل التحديث', 'error');
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
        showToast('فشل الحذف', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const menuForm = document.getElementById('menuForm');
    if (!menuForm) return;
    
    menuForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveMenuItemBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            document.getElementById('saveMenuItemText').textContent = 'جاري الحفظ...';
        }
        
        const id = document.getElementById('menuItemId').value;
        const name = document.getElementById('menuItemName').value.trim();
        const category = document.getElementById('menuItemCategory').value;
        const price = parseInt(document.getElementById('menuItemPrice').value);
        const image = document.getElementById('menuItemImage').value.trim();
        const description = document.getElementById('menuItemDescription').value.trim();
        const available = document.getElementById('menuItemAvailable').checked;
        
        if (!category || !name || !price) {
            showToast('الرجاء ملء الحقول المطلوبة', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                document.getElementById('saveMenuItemText').textContent = 'حفظ الصنف';
            }
            return;
        }
        
        const itemData = { name, category, price, image, description, available, updatedAt: Date.now() };
        
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
            showToast('حدث خطأ', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                document.getElementById('saveMenuItemText').textContent = 'حفظ الصنف';
            }
        }
    });
    
    const menuSearch = document.getElementById('menuSearch');
    if (menuSearch) {
        menuSearch.addEventListener('input', function() {
            currentSearch = this.value.trim();
            renderMenuItems();
        });
    }
    
    document.getElementById('resetMenuForm').addEventListener('click', resetMenuForm);
    document.getElementById('cancelEditBtn').addEventListener('click', resetMenuForm);
});

function resetMenuForm() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuFormTitle').textContent = 'إضافة صنف جديد';
    document.getElementById('saveMenuItemText').textContent = 'حفظ الصنف';
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    const selectedText = document.querySelector('.custom-select-selected .selected-text');
    if (selectedText) selectedText.textContent = 'اختر القسم';
}

// ============================================
// 📢 إدارة الإعلانات
// ============================================
function loadAds() {
    const adsList = document.getElementById('adsList');
    const totalAdsCount = document.getElementById('totalAdsCount');
    
    if (!adsList) return;
    
    db.ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
        adsList.innerHTML = '';
        const ads = snapshot.val();
        
        if (!ads) {
            if (totalAdsCount) totalAdsCount.textContent = '0';
            return;
        }
        
        const sortedAds = Object.keys(ads).reverse();
        if (totalAdsCount) totalAdsCount.textContent = sortedAds.length;
        
        sortedAds.forEach(key => {
            const ad = ads[key];
            const card = document.createElement('div');
            card.className = 'ad-card';
            
            const imageHtml = ad.imageUrl 
                ? `<img src="${ad.imageUrl}" alt="${ad.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">`
                : `<img src="https://via.placeholder.com/300x200?text=No+Image" alt="${ad.title}">`;
            
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteAd('${key}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="ad-card-image">${imageHtml}</div>
                <div class="ad-card-content">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<div class="price">${ad.price} د.ع</div>` : ''}
                </div>
            `;
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
        showToast('فشل الحذف', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const adForm = document.getElementById('adForm');
    if (!adForm) return;
    
    adForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveAdBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }
        
        const title = document.getElementById('adTitle').value.trim();
        const description = document.getElementById('adDescription').value.trim();
        const price = document.getElementById('adPrice').value.trim();
        const imageUrl = document.getElementById('adImageUrl').value.trim();
        
        if (!title || !description) {
            showToast('الرجاء ملء الحقول المطلوبة', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعلان';
            }
            return;
        }
        
        try {
            const newAd = {
                title, description,
                price: price || '',
                imageUrl: imageUrl || '',
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('ar-EG')
            };
            await db.ref('ads').push(newAd);
            showToast('تم نشر الإعلان بنجاح!', 'success');
            adForm.reset();
        } catch (error) {
            showToast('حدث خطأ', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعلان';
            }
        }
    });
});

// ============================================
// 🔔 Toast
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
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
