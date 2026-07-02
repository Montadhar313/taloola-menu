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
// 🛡️ دالة مساعدة آمنة لقراءة قيم العناصر
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
    loadOrderCounter();
    loadOrders();
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
// 🎨 إدارة الثيم والألوان - النسخة الآمنة
// ============================================
let currentTheme = {
    mode: 'dark',
    primaryColor: '#c70301',
    secondaryColor: '#fedb17',
    textColor: '#ffffff',
    headingColor: '#ffffff',
    descriptionColor: '#cccccc',
    priceColor: '#fedb17',
    fontFamily: "'Cairo', sans-serif",
    fontSize: 16,
    backgroundType: 'video',
    videoUrl: 'https://v1.pinimg.com/videos/mc/720p/44/0c/df/440cdf2f4bdc8fe1d314c49d4876570a.mp4',
    imageUrl: '',
    bgColor: '#1a1a1a',
    gradientColor1: '#1a1a1a',
    gradientColor2: '#2c2c2c',
    gradientDirection: '135deg',
    overlayOpacity: 60,
    itemImageBg: 'transparent',
    itemImageBgColor: '#ffffff'
};

function loadThemeSettings() {
    db.ref('theme').once('value').then(snapshot => {
        const theme = snapshot.val();
        if (theme) {
            currentTheme = { ...currentTheme, ...theme };
            applyThemeToUI();
            console.log('✅ تم تحميل الثيم:', currentTheme);
        }
    }).catch(error => {
        console.warn('⚠️ لا يمكن تحميل إعدادات الثيم:', error);
    });
}

function applyThemeToUI() {
    // الوضع - بأمان
    safeSetChecked('themeLight', currentTheme.mode === 'light');
    safeSetChecked('themeDark', currentTheme.mode === 'dark');
    safeSetChecked('themeGray', currentTheme.mode === 'gray');
    
    // الألوان الرئيسية
    safeSetValue('primaryColor', currentTheme.primaryColor);
    safeSetValue('primaryColorText', currentTheme.primaryColor);
    safeSetValue('secondaryColor', currentTheme.secondaryColor);
    safeSetValue('secondaryColorText', currentTheme.secondaryColor);
    
    // ألوان النصوص
    safeSetValue('textColor', currentTheme.textColor);
    safeSetValue('textColorText', currentTheme.textColor);
    safeSetValue('headingColor', currentTheme.headingColor);
    safeSetValue('headingColorText', currentTheme.headingColor);
    safeSetValue('descriptionColor', currentTheme.descriptionColor);
    safeSetValue('descriptionColorText', currentTheme.descriptionColor);
    safeSetValue('priceColor', currentTheme.priceColor);
    safeSetValue('priceColorText', currentTheme.priceColor);
    
    // الخط
    safeSetValue('fontFamily', currentTheme.fontFamily);
    safeSetValue('fontSize', currentTheme.fontSize);
    const fontSizeValueEl = document.getElementById('fontSizeValue');
    if (fontSizeValueEl) fontSizeValueEl.textContent = (currentTheme.fontSize || 16) + 'px';
    
    // الخلفية
    safeSetChecked('bgVideo', currentTheme.backgroundType === 'video');
    safeSetChecked('bgImage', currentTheme.backgroundType === 'image');
    safeSetChecked('bgColor', currentTheme.backgroundType === 'color');
    safeSetChecked('bgGradient', currentTheme.backgroundType === 'gradient');
    
    safeSetValue('videoUrl', currentTheme.videoUrl || '');
    safeSetValue('imageUrl', currentTheme.imageUrl || '');
    safeSetValue('bgColorPicker', currentTheme.bgColor);
    safeSetValue('bgColorText', currentTheme.bgColor);
    safeSetValue('gradientColor1', currentTheme.gradientColor1);
    safeSetValue('gradientColor2', currentTheme.gradientColor2);
    safeSetValue('gradientDirection', currentTheme.gradientDirection || '135deg');
    
    safeSetValue('overlayOpacity', currentTheme.overlayOpacity || 60);
    const overlayValueEl = document.getElementById('overlayOpacityValue');
    if (overlayValueEl) overlayValueEl.textContent = (currentTheme.overlayOpacity || 60) + '%';
    
    // خلفية صور العناصر
    safeSetChecked('imgBgTransparent', currentTheme.itemImageBg === 'transparent');
    safeSetChecked('imgBgWhite', currentTheme.itemImageBg === 'white');
    safeSetChecked('imgBgPrimary', currentTheme.itemImageBg === 'primary');
    safeSetChecked('imgBgCustom', currentTheme.itemImageBg === 'custom');
    safeSetValue('itemImageBgColor', currentTheme.itemImageBgColor || '#ffffff');
    safeSetValue('itemImageBgColorText', currentTheme.itemImageBgColor || '#ffffff');
    
    updateBackgroundOptionsVisibility();
    updateImageBgOptionsVisibility();
}

function updateBackgroundOptionsVisibility() {
    const videoOpts = document.getElementById('videoOptions');
    const imageOpts = document.getElementById('imageOptions');
    const colorOpts = document.getElementById('colorOptions');
    const gradientOpts = document.getElementById('gradientOptions');
    
    if (videoOpts) videoOpts.style.display = currentTheme.backgroundType === 'video' ? 'block' : 'none';
    if (imageOpts) imageOpts.style.display = currentTheme.backgroundType === 'image' ? 'block' : 'none';
    if (colorOpts) colorOpts.style.display = currentTheme.backgroundType === 'color' ? 'block' : 'none';
    if (gradientOpts) gradientOpts.style.display = currentTheme.backgroundType === 'gradient' ? 'block' : 'none';
}

function updateImageBgOptionsVisibility() {
    const customOpts = document.getElementById('customImageBgOptions');
    if (customOpts) customOpts.style.display = currentTheme.itemImageBg === 'custom' ? 'block' : 'none';
}

// تهيئة أحداث الثيم
document.addEventListener('DOMContentLoaded', () => {
    const colorPairs = [
        ['primaryColor', 'primaryColorText'],
        ['secondaryColor', 'secondaryColorText'],
        ['textColor', 'textColorText'],
        ['headingColor', 'headingColorText'],
        ['descriptionColor', 'descriptionColorText'],
        ['priceColor', 'priceColorText'],
        ['bgColorPicker', 'bgColorText'],
        ['itemImageBgColor', 'itemImageBgColorText']
    ];
    
    colorPairs.forEach(([colorId, textId]) => {
        const colorEl = document.getElementById(colorId);
        const textEl = document.getElementById(textId);
        
        if (colorEl && textEl) {
            colorEl.addEventListener('input', function() {
                textEl.value = this.value;
            });
            textEl.addEventListener('input', function() {
                if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
                    colorEl.value = this.value;
                }
            });
        }
    });
    
    document.querySelectorAll('input[name="backgroundType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            currentTheme.backgroundType = this.value;
            updateBackgroundOptionsVisibility();
        });
    });
    
    document.querySelectorAll('input[name="itemImageBg"]').forEach(radio => {
        radio.addEventListener('change', function() {
            currentTheme.itemImageBg = this.value;
            updateImageBgOptionsVisibility();
        });
    });
    
    const fontSizeSlider = document.getElementById('fontSize');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            const valueEl = document.getElementById('fontSizeValue');
            if (valueEl) valueEl.textContent = this.value + 'px';
        });
    }
    
    const overlaySlider = document.getElementById('overlayOpacity');
    if (overlaySlider) {
        overlaySlider.addEventListener('input', function() {
            const valueEl = document.getElementById('overlayOpacityValue');
            if (valueEl) valueEl.textContent = this.value + '%';
        });
    }
    
    // ✅ حفظ الإعدادات - النسخة الآمنة
    const saveThemeBtn = document.getElementById('saveThemeBtn');
    if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', async () => {
            saveThemeBtn.disabled = true;
            const originalHTML = saveThemeBtn.innerHTML;
            saveThemeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            
            try {
                // جمع البيانات بطريقة آمنة
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
                
                console.log('💾 جاري حفظ الثيم:', currentTheme);
                
                await db.ref('theme').set(currentTheme);
                showToast('✅ تم حفظ الإعدادات بنجاح', 'success');
                
            } catch (error) {
                showToast('❌ فشل حفظ الإعدادات', 'error');
                console.error('خطأ في حفظ الثيم:', error);
            } finally {
                saveThemeBtn.disabled = false;
                saveThemeBtn.innerHTML = originalHTML;
            }
        });
    }
    
    const previewThemeBtn = document.getElementById('previewThemeBtn');
    if (previewThemeBtn) {
        previewThemeBtn.addEventListener('click', () => {
            showToast('👁️ سيتم تطبيق الثيم على الصفحة الرئيسية فوراً', 'success');
        });
    }
    
    const resetThemeBtn = document.getElementById('resetThemeBtn');
    if (resetThemeBtn) {
        resetThemeBtn.addEventListener('click', () => {
            if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) return;
            
            currentTheme = {
                mode: 'dark',
                primaryColor: '#c70301',
                secondaryColor: '#fedb17',
                textColor: '#ffffff',
                headingColor: '#ffffff',
                descriptionColor: '#cccccc',
                priceColor: '#fedb17',
                fontFamily: "'Cairo', sans-serif",
                fontSize: 16,
                backgroundType: 'video',
                videoUrl: 'https://v1.pinimg.com/videos/mc/720p/44/0c/df/440cdf2f4bdc8fe1d314c49d4876570a.mp4',
                imageUrl: '',
                bgColor: '#1a1a1a',
                gradientColor1: '#1a1a1a',
                gradientColor2: '#2c2c2c',
                gradientDirection: '135deg',
                overlayOpacity: 60,
                itemImageBg: 'transparent',
                itemImageBgColor: '#ffffff'
            };
            applyThemeToUI();
            showToast('✅ تم إعادة تعيين الإعدادات', 'success');
        });
    }
});

// ============================================
// 🔢 تحميل عداد الطلبات
// ============================================
function loadOrderCounter() {
    const counterEl = document.getElementById('currentOrderNumber');
    if (!counterEl) return;
    
    db.ref('orders/counter').on('value', (snapshot) => {
        const counter = snapshot.val() || 0;
        counterEl.textContent = counter;
    }, (error) => {
        console.warn('⚠️ لا يمكن تحميل عداد الطلبات:', error);
        counterEl.textContent = '0';
    });
}

// ============================================
// 📂 إدارة الأقسام - مع ترتيب مُحسَّن
// ============================================
let allCategories = [];

function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const totalCategoriesCount = document.getElementById('totalCategoriesCount');
    
    if (!categoriesList) return;
    
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
    }, (error) => {
        console.error('❌ خطأ في تحميل الأقسام:', error);
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
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
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

// ✅ دالة محسّنة لتحديث الترتيب - استخدام batch update
async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (this === draggedItem || !draggedItem) return;
    
    const draggedId = draggedItem.getAttribute('data-id');
    const targetId = this.getAttribute('data-id');
    
    if (!draggedId || !targetId) {
        showToast('❌ خطأ: معرف القسم غير صالح', 'error');
        return;
    }
    
    const draggedIndex = allCategories.findIndex(c => c.id === draggedId);
    const targetIndex = allCategories.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
        showToast('❌ خطأ: لم يتم العثور على القسم', 'error');
        return;
    }
    
    // تحديث المصفوفة محلياً
    const [movedItem] = allCategories.splice(draggedIndex, 1);
    allCategories.splice(targetIndex, 0, movedItem);
    
    // إعادة التصيير فوراً (تحسين تجربة المستخدم)
    renderCategories();
    
    // ✅ استخدام batch update بدلاً من loop
    try {
        console.log('🔄 جاري تحديث الترتيب...');
        
        const updates = {};
        for (let i = 0; i < allCategories.length; i++) {
            updates[`${allCategories[i].id}/order`] = i;
        }
        
        // تنفيذ جميع التحديثات في طلب واحد
        await db.ref('categories').update(updates);
        
        console.log('✅ تم تحديث ترتيب الأقسام بنجاح');
        showToast(`✅ تم تحديث الترتيب (${allCategories.length} قسم)`, 'success');
        
    } catch (error) {
        console.error('❌ فشل تحديث الترتيب:', error);
        
        // رسالة خطأ مفصلة
        let errorMsg = 'فشل تحديث الترتيب';
        if (error.code === 'PERMISSION_DENIED') {
            errorMsg = '⚠️ خطأ في الصلاحيات - تحقق من قواعد Firebase';
        } else if (error.message) {
            errorMsg = `❌ ${error.message}`;
        }
        
        showToast(errorMsg, 'error');
        
        // استعادة الترتيب الأصلي
        loadCategories();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedItem = null;
}

window.editCategory = function(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    
    safeSetValue('categoryId', cat.id);
    safeSetValue('categoryName', cat.name);
    safeSetValue('categoryIcon', cat.icon || '');
    safeSetValue('categoryOrder', cat.order !== undefined ? cat.order : '');
    
    const formTitle = document.getElementById('categoryFormTitle');
    const saveText = document.getElementById('saveCategoryText');
    const cancelBtn = document.getElementById('cancelEditCategoryBtn');
    
    if (formTitle) formTitle.textContent = 'تعديل القسم';
    if (saveText) saveText.textContent = 'حفظ التعديلات';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    
    document.getElementById('categoryForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            const deletePromises = Object.keys(itemsInCategory).map(key => 
                db.ref('menu/' + key).remove()
            );
            await Promise.all(deletePromises);
        }
        
        await db.ref('categories/' + id).remove();
        showToast('تم حذف القسم بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف', 'error');
        console.error('خطأ في الحذف:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const categoryForm = document.getElementById('categoryForm');
    if (!categoryForm) return;
    
    categoryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveCategoryBtn');
        const saveTextEl = document.getElementById('saveCategoryText');
        
        if (saveBtn) {
            saveBtn.disabled = true;
            if (saveTextEl) saveTextEl.textContent = 'جاري الحفظ...';
        }
        
        const id = safeGetValue('categoryId');
        const name = safeGetValue('categoryName').trim();
        const icon = safeGetValue('categoryIcon').trim() || '📁';
        const order = parseInt(safeGetValue('categoryOrder')) || allCategories.length;
        
        if (!name) {
            showToast('الرجاء إدخال اسم القسم', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveTextEl) saveTextEl.textContent = 'حفظ القسم';
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
            console.error('خطأ:', error);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveTextEl) saveTextEl.textContent = 'حفظ القسم';
            }
        }
    });
    
    const resetBtn = document.getElementById('resetCategoryForm');
    if (resetBtn) resetBtn.addEventListener('click', resetCategoryForm);
    
    const cancelBtn = document.getElementById('cancelEditCategoryBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', resetCategoryForm);
    
    document.querySelectorAll('.icon-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', function() {
            safeSetValue('categoryIcon', this.dataset.icon);
            document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
});

function resetCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
    
    safeSetValue('categoryId', '');
    
    const formTitle = document.getElementById('categoryFormTitle');
    const saveText = document.getElementById('saveCategoryText');
    const cancelBtn = document.getElementById('cancelEditCategoryBtn');
    
    if (formTitle) formTitle.textContent = 'إضافة قسم جديد';
    if (saveText) saveText.textContent = 'حفظ القسم';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
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
            safeSetValue('menuItemCategory', this.getAttribute('data-value'));
            const selectedText = document.querySelector('.custom-select-selected .selected-text');
            if (selectedText) selectedText.textContent = this.getAttribute('data-value');
            
            optionsList.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            const select = document.getElementById('menuItemCategorySelect');
            if (select) select.classList.remove('open');
        });
        
        optionsList.appendChild(option);
    });
}

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
            const options = optionsList?.querySelectorAll('.custom-select-option') || [];
            
            options.forEach(option => {
                const nameEl = option.querySelector('.option-name');
                if (nameEl) {
                    const name = nameEl.textContent.toLowerCase();
                    option.style.display = name.includes(searchTerm) ? 'flex' : 'none';
                }
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
    }, (error) => {
        console.error('❌ خطأ في تحميل الأصناف:', error);
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
    
    safeSetValue('menuItemId', item.id);
    safeSetValue('menuItemName', item.name);
    safeSetValue('menuItemCategory', item.category);
    safeSetValue('menuItemPrice', item.price);
    safeSetValue('menuItemImage', item.image || '');
    safeSetValue('menuItemDescription', item.description || '');
    
    const availableEl = document.getElementById('menuItemAvailable');
    if (availableEl) availableEl.checked = item.available;
    
    const formTitle = document.getElementById('menuFormTitle');
    const saveText = document.getElementById('saveMenuItemText');
    const cancelBtn = document.getElementById('cancelEditBtn');
    
    if (formTitle) formTitle.textContent = 'تعديل الصنف';
    if (saveText) saveText.textContent = 'حفظ التعديلات';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    
    document.getElementById('menuForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const saveTextEl = document.getElementById('saveMenuItemText');
        
        if (saveBtn) {
            saveBtn.disabled = true;
            if (saveTextEl) saveTextEl.textContent = 'جاري الحفظ...';
        }
        
        const id = safeGetValue('menuItemId');
        const name = safeGetValue('menuItemName').trim();
        const category = safeGetValue('menuItemCategory');
        const price = parseInt(safeGetValue('menuItemPrice'));
        const image = safeGetValue('menuItemImage').trim();
        const description = safeGetValue('menuItemDescription').trim();
        const availableEl = document.getElementById('menuItemAvailable');
        const available = availableEl ? availableEl.checked : true;
        
        if (!category || !name || !price) {
            showToast('الرجاء ملء الحقول المطلوبة', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveTextEl) saveTextEl.textContent = 'حفظ الصنف';
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
            console.error('خطأ:', error);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveTextEl) saveTextEl.textContent = 'حفظ الصنف';
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
    
    const resetBtn = document.getElementById('resetMenuForm');
    if (resetBtn) resetBtn.addEventListener('click', resetMenuForm);
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', resetMenuForm);
});

function resetMenuForm() {
    const form = document.getElementById('menuForm');
    if (form) form.reset();
    
    safeSetValue('menuItemId', '');
    
    const formTitle = document.getElementById('menuFormTitle');
    const saveText = document.getElementById('saveMenuItemText');
    const cancelBtn = document.getElementById('cancelEditBtn');
    
    if (formTitle) formTitle.textContent = 'إضافة صنف جديد';
    if (saveText) saveText.textContent = 'حفظ الصنف';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    const selectedText = document.querySelector('.custom-select-selected .selected-text');
    if (selectedText) selectedText.textContent = 'اختر القسم';
}

// ============================================
// 📢 إدارة الإعلانات - النسخة المتقدمة (فيديو + صور)
// ============================================

// 🆕 دالة استخراج معرف فيديو يوتيوب من الرابط
function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    
    // دعم جميع صيغ روابط يوتيوب
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/ // معرف مباشر
    ];
    
    for (const pattern of patterns) {
        const match = url.trim().match(pattern);
        if (match && match[1]) return match[1];
    }
    
    return null;
}

// 🆕 دالة إنشاء رابط مضمن ليوتيوب
function getYouTubeEmbedUrl(videoId, options = {}) {
    const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
        ...options
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

// 🆕 معاينة فيديو يوتيوب عند إدخال الرابط
function previewYouTubeVideo() {
    const urlInput = document.getElementById('adYoutubeUrl');
    const previewContainer = document.getElementById('youtubePreview');
    const previewFrame = document.getElementById('youtubePreviewFrame');
    
    if (!urlInput || !previewContainer || !previewFrame) return;
    
    const url = urlInput.value.trim();
    const videoId = extractYouTubeId(url);
    
    if (videoId) {
        previewContainer.style.display = 'block';
        previewFrame.innerHTML = `
            <iframe 
                width="100%" 
                height="250" 
                src="${getYouTubeEmbedUrl(videoId)}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                style="border-radius: 10px; max-width: 100%;">
            </iframe>
            <div class="video-id-badge">
                <i class="fab fa-youtube"></i> معرف الفيديو: ${videoId}
            </div>
        `;
    } else if (url) {
        previewContainer.style.display = 'block';
        previewFrame.innerHTML = `
            <div class="preview-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>رابط يوتيوب غير صالح</p>
                <small>تأكد من صحة الرابط وجرب مرة أخرى</small>
            </div>
        `;
    } else {
        previewContainer.style.display = 'none';
        previewFrame.innerHTML = '';
    }
}

// 🆕 تبديل حقول الوسائط حسب النوع المختار
function switchMediaFields(mediaType) {
    const imageField = document.getElementById('imageField');
    const youtubeField = document.getElementById('youtubeField');
    const videoField = document.getElementById('videoField');
    
    if (imageField) imageField.style.display = mediaType === 'image' ? 'block' : 'none';
    if (youtubeField) youtubeField.style.display = mediaType === 'youtube' ? 'block' : 'none';
    if (videoField) videoField.style.display = mediaType === 'video' ? 'block' : 'none';
}

function loadAds() {
    const adsList = document.getElementById('adsList');
    const totalAdsCount = document.getElementById('totalAdsCount');
    
    if (!adsList) return;
    
    db.ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
        adsList.innerHTML = '';
        const ads = snapshot.val();
        
        if (!ads) {
            if (totalAdsCount) totalAdsCount.textContent = '0';
            adsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-bullhorn fa-3x"></i>
                    <h3>لا توجد إعلانات</h3>
                    <p>أضف إعلانك الأول من النموذج أعلاه</p>
                </div>
            `;
            return;
        }
        
        const sortedAds = Object.keys(ads).reverse();
        if (totalAdsCount) totalAdsCount.textContent = sortedAds.length;
        
        sortedAds.forEach(key => {
            const ad = ads[key];
            const card = document.createElement('div');
            card.className = 'ad-card';
            
            // 🆕 تحديد نوع المحتوى
            const mediaType = ad.mediaType || 'image';
            let mediaHtml = '';
            
            if (mediaType === 'youtube' && ad.youtubeUrl) {
                const videoId = extractYouTubeId(ad.youtubeUrl);
                if (videoId) {
                    mediaHtml = `
                        <div class="ad-video-wrapper youtube">
                            <iframe 
                                width="100%" 
                                height="200" 
                                src="${getYouTubeEmbedUrl(videoId)}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                            <div class="media-type-badge youtube">
                                <i class="fab fa-youtube"></i> يوتيوب
                            </div>
                        </div>
                    `;
                }
            } else if (mediaType === 'video' && ad.videoUrl) {
                mediaHtml = `
                    <div class="ad-video-wrapper direct">
                        <video controls preload="metadata" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">
                            <source src="${ad.videoUrl}" type="video/mp4">
                            المتصفح لا يدعم تشغيل الفيديو
                        </video>
                        <div class="media-type-badge video">
                            <i class="fas fa-video"></i> فيديو
                        </div>
                    </div>
                `;
            } else if (mediaType === 'image' && ad.imageUrl) {
                mediaHtml = `
                    <div class="ad-image">
                        <img src="${ad.imageUrl}" alt="${ad.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                        <div class="media-type-badge image">
                            <i class="fas fa-image"></i> صورة
                        </div>
                    </div>
                `;
            } else {
                mediaHtml = `
                    <div class="media-type-badge text-only">
                        <i class="fas fa-font"></i> نص فقط
                    </div>
                `;
            }
            
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteAd('${key}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                ${mediaHtml}
                <div class="ad-card-content">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<div class="price">${ad.price} د.ع</div>` : ''}
                    <div class="ad-date">
                        <i class="fas fa-calendar"></i> ${ad.date || ''}
                    </div>
                </div>
            `;
            adsList.appendChild(card);
        });
    }, (error) => {
        console.error('❌ خطأ في تحميل الإعلانات:', error);
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
    
    // 🆕 أحداث تبديل نوع الوسائط
    document.querySelectorAll('input[name="adMediaType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            switchMediaFields(this.value);
        });
    });
    
    // 🆕 معاينة فيديو يوتيوب عند الكتابة
    const youtubeInput = document.getElementById('adYoutubeUrl');
    if (youtubeInput) {
        let previewTimeout;
        youtubeInput.addEventListener('input', function() {
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(previewYouTubeVideo, 800);
        });
    }
    
    // حفظ الإعلان
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
        
        // 🆕 جمع بيانات الوسائط
        const mediaType = document.querySelector('input[name="adMediaType"]:checked')?.value || 'image';
        const imageUrl = document.getElementById('adImageUrl').value.trim();
        const youtubeUrl = document.getElementById('adYoutubeUrl').value.trim();
        const videoUrl = document.getElementById('adVideoUrl').value.trim();
        
        // التحقق من صحة البيانات حسب النوع
        if (mediaType === 'youtube' && !youtubeUrl) {
            showToast('⚠ الرجاء إدخال رابط فيديو يوتيوب', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعلان';
            }
            return;
        }
        
        if (mediaType === 'video' && !videoUrl) {
            showToast('⚠ الرجاء إدخال رابط الفيديو', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعلان';
            }
            return;
        }
        
        if (mediaType === 'image' && !imageUrl) {
            showToast('⚠ الرجاء إدخال رابط الصورة', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعلان';
            }
            return;
        }
        
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
                title,
                description,
                price: price || '',
                mediaType,
                imageUrl: mediaType === 'image' ? imageUrl : '',
                youtubeUrl: mediaType === 'youtube' ? youtubeUrl : '',
                videoUrl: mediaType === 'video' ? videoUrl : '',
                youtubeId: mediaType === 'youtube' ? extractYouTubeId(youtubeUrl) : '',
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('ar-EG')
            };
            
            await db.ref('ads').push(newAd);
            showToast('✅ تم نشر الإعلان بنجاح!', 'success');
            adForm.reset();
            
            // إعادة تعيين الحقول
            switchMediaFields('image');
            document.getElementById('youtubePreview').style.display = 'none';
            
        } catch (error) {
            showToast('حدث خطأ', 'error');
            console.error('خطأ:', error);
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

// ============================================
// 📋 إدارة الطلبات - النسخة المُصلَّحة
// ============================================
let allOrders = [];
let currentOrderFilter = 'all';
let lastKnownOrderTimestamp = 0;
let newOrdersSoundEnabled = true;
let unseenOrdersCount = 0;
let seenOrderIds = new Set();
let ordersListener = null;

function loadSeenOrders() {
    try {
        const saved = localStorage.getItem('taloola_seen_orders');
        if (saved) {
            const ids = JSON.parse(saved);
            seenOrderIds = new Set(ids);
        }
    } catch (e) {
        console.warn('⚠️ لا يمكن تحميل الطلبات المعروضة');
    }
}

function saveSeenOrders() {
    try {
        const ids = Array.from(seenOrderIds);
        const recent = ids.slice(-200);
        localStorage.setItem('taloola_seen_orders', JSON.stringify(recent));
    } catch (e) {
        console.warn('⚠️ لا يمكن حفظ الطلبات المعروضة');
    }
}

function playNewOrderSound() {
    if (!newOrdersSoundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const playTone = (frequency, startTime, duration) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        const now = audioContext.currentTime;
        playTone(880, now, 0.2);
        playTone(1320, now + 0.2, 0.3);
        
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    } catch (e) {
        console.warn('⚠️ لا يمكن تشغيل الصوت:', e);
    }
}

function showNewOrderNotification(order) {
    const notification = document.createElement('div');
    notification.className = 'new-order-notification';
    
    const itemsCount = order.items?.length || 0;
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-bell"></i>
        </div>
        <div class="notification-content">
            <h4>🛎️ طلب جديد #${order.orderNumber || '؟'}</h4>
            <p>📞 ${order.phone || 'زبون جديد'} | 📍 ${order.area || 'غير محدد'}</p>
            <small>💰 ${(order.total || 0).toLocaleString('ar-EG')} د.ع • ${itemsCount} صنف (${totalItems} قطعة)</small>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }
    }, 6000);
}

function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const pendingCount = document.getElementById('pendingOrdersCount');
    const completedCount = document.getElementById('completedOrdersCount');
    const totalCount = document.getElementById('totalOrdersCount');
    const newOrdersBadge = document.getElementById('newOrdersBadge');
    
    if (!ordersList) return;
    
    loadSeenOrders();
    
    if (ordersListener) {
        db.ref('orders/list').off('value', ordersListener);
    }
    
    ordersListener = db.ref('orders/list').orderByChild('timestamp').on('value', (snapshot) => {
        const orders = snapshot.val();
        const newOrders = [];
        
        if (!orders) {
            allOrders = [];
            if (totalCount) totalCount.textContent = '0';
            if (pendingCount) pendingCount.textContent = '0';
            if (completedCount) completedCount.textContent = '0';
            if (newOrdersBadge) newOrdersBadge.style.display = 'none';
            
            ordersList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-inbox fa-3x"></i>
                    <h3>لا توجد طلبات حالياً</h3>
                </div>
            `;
            return;
        }
        
        allOrders = [];
        Object.keys(orders).forEach(key => {
            const order = { id: key, ...orders[key] };
            allOrders.push(order);
            
            if (!seenOrderIds.has(key)) {
                if (lastKnownOrderTimestamp > 0 && (order.timestamp || 0) > lastKnownOrderTimestamp) {
                    newOrders.push(order);
                }
                seenOrderIds.add(key);
            }
        });
        
        allOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        if (allOrders.length > 0) {
            const maxTimestamp = Math.max(...allOrders.map(o => o.timestamp || 0));
            if (maxTimestamp > lastKnownOrderTimestamp) {
                lastKnownOrderTimestamp = maxTimestamp;
            }
        }
        
        saveSeenOrders();
        
        const pending = allOrders.filter(o => o.status === 'pending' || !o.status).length;
        const completed = allOrders.filter(o => o.status === 'completed').length;
        
        if (totalCount) totalCount.textContent = allOrders.length;
        if (pendingCount) pendingCount.textContent = pending;
        if (completedCount) completedCount.textContent = completed;
        
        if (newOrdersBadge) {
            if (pending > 0) {
                newOrdersBadge.textContent = pending > 99 ? '99+' : pending;
                newOrdersBadge.style.display = 'inline-block';
            } else {
                newOrdersBadge.style.display = 'none';
            }
        }
        
        if (newOrders.length > 0) {
            unseenOrdersCount += newOrders.length;
            updateNewOrdersBadge();
            playNewOrderSound();
            newOrders.forEach(order => showNewOrderNotification(order));
            document.title = `(${unseenOrdersCount}) 🔔 لوحة تحكم تعلولة`;
        }
        
        renderOrders();
    }, (error) => {
        console.error('❌ خطأ في تحميل الطلبات:', error);
        ordersList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <h3>حدث خطأ</h3>
                <p>${error.message}</p>
                <button onclick="loadOrders()" style="margin-top:15px; padding:10px 20px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer;">
                    <i class="fas fa-redo"></i> إعادة المحاولة
                </button>
            </div>
        `;
    });
}

function updateNewOrdersBadge() {
    const liveBadge = document.getElementById('newOrdersLiveBadge');
    const liveCount = document.getElementById('newOrdersLiveCount');
    
    if (liveBadge && liveCount) {
        if (unseenOrdersCount > 0) {
            liveCount.textContent = unseenOrdersCount > 99 ? '99+' : unseenOrdersCount;
            liveBadge.style.display = 'inline-flex';
            liveBadge.classList.add('pulse');
        } else {
            liveBadge.style.display = 'none';
            liveBadge.classList.remove('pulse');
        }
    }
}

function manualRefreshOrders() {
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    const refreshIcon = refreshBtn?.querySelector('i');
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        if (refreshIcon) refreshIcon.classList.add('fa-spin');
    }
    
    showToast('🔄 جاري تحديث الطلبات...', 'success');
    
    loadOrders();
    loadOrderCounter();
    
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        }
        showToast('✅ تم تحديث الطلبات', 'success');
    }, 1000);
}

function markAllOrdersAsSeen() {
    unseenOrdersCount = 0;
    updateNewOrdersBadge();
    document.title = 'لوحة تحكم تعلولة';
}

function toggleOrderSound() {
    newOrdersSoundEnabled = !newOrdersSoundEnabled;
    const soundBtn = document.getElementById('toggleSoundBtn');
    const soundIcon = soundBtn?.querySelector('i');
    
    if (soundIcon) {
        soundIcon.className = newOrdersSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
    
    showToast(newOrdersSoundEnabled ? '🔔 تم تفعيل الصوت' : '🔕 تم تعطيل الصوت', 'success');
    
    try {
        localStorage.setItem('taloola_order_sound', newOrdersSoundEnabled);
    } catch (e) {}
}

function loadSoundPreference() {
    try {
        const saved = localStorage.getItem('taloola_order_sound');
        if (saved !== null) {
            newOrdersSoundEnabled = saved === 'true';
            const soundIcon = document.querySelector('#toggleSoundBtn i');
            if (soundIcon) {
                soundIcon.className = newOrdersSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
    } catch (e) {}
}

function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    let filteredOrders = allOrders;
    if (currentOrderFilter !== 'all') {
        filteredOrders = filteredOrders.filter(o => (o.status || 'pending') === currentOrderFilter);
    }
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-search fa-3x"></i>
                <h3>لا توجد طلبات في هذه الفئة</h3>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = '';
    
    const statusLabels = {
        'pending': { text: 'معلق', icon: 'fa-clock', color: '#ffc107' },
        'preparing': { text: 'قيد التحضير', icon: 'fa-fire', color: '#17a2b8' },
        'ready': { text: 'جاهز', icon: 'fa-check-circle', color: '#28a745' },
        'completed': { text: 'مكتمل', icon: 'fa-check-double', color: '#28a745' },
        'cancelled': { text: 'ملغي', icon: 'fa-times-circle', color: '#dc3545' }
    };
    
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card status-${order.status || 'pending'}`;
        
        const status = statusLabels[order.status || 'pending'];
        const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString('ar-EG') : 'غير معروف';
        
        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            itemsHtml = order.items.map(item => `
                <div class="order-item-row">
                    <span class="item-qty">${item.quantity}×</span>
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">${((item.price || 0) * (item.quantity || 0)).toLocaleString('ar-EG')} د.ع</span>
                </div>
            `).join('');
        }
        
        card.innerHTML = `
            <div class="order-header">
                <div class="order-id">
                    <i class="fas fa-receipt"></i>
                    <span>طلب #${order.orderNumber || order.id.substring(0, 6).toUpperCase()}</span>
                </div>
                <div class="order-status-badge" style="background: ${status.color};">
                    <i class="fas ${status.icon}"></i>
                    <span>${status.text}</span>
                </div>
            </div>
            
            <div class="order-customer-info">
                <div class="info-row">
                    <i class="fas fa-phone"></i>
                    <a href="tel:${order.phone || ''}">${order.phone || 'غير متوفر'}</a>
                </div>
                <div class="info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${order.area || 'غير محدد'}${order.detailedAddress ? ' - ' + order.detailedAddress : ''}</span>
                </div>
                ${order.location && order.location.googleMapsUrl ? `
                <div class="info-row">
                    <i class="fas fa-location-arrow"></i>
                    <a href="${order.location.googleMapsUrl}" target="_blank">عرض الموقع</a>
                </div>
                ` : ''}
            </div>
            
            <div class="order-items">
                <h4><i class="fas fa-utensils"></i> الأصناف المطلوبة</h4>
                ${itemsHtml || '<p class="no-items">لا توجد أصناف</p>'}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    <span>الإجمالي:</span>
                    <strong>${(order.total || 0).toLocaleString('ar-EG')} د.ع</strong>
                </div>
                <div class="order-date">
                    <i class="fas fa-calendar"></i>
                    <span>${orderDate}</span>
                </div>
            </div>
            
            <div class="order-actions">
                <select class="order-status-select" onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${(order.status || 'pending') === 'pending' ? 'selected' : ''}>⏳ معلق</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>🔥 قيد التحضير</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>✓ جاهز</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ مكتمل</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ ملغي</option>
                </select>
                <button class="btn-cancel-order" onclick="cancelOrder('${order.id}')" title="إلغاء">
                    <i class="fas fa-ban"></i>
                </button>
                <button class="btn-delete-order" onclick="deleteOrder('${order.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        ordersList.appendChild(card);
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await db.ref('orders/list/' + orderId + '/status').set(newStatus);
        showToast('✅ تم تحديث حالة الطلب', 'success');
    } catch (error) {
        showToast('❌ فشل تحديث الحالة', 'error');
    }
};

window.cancelOrder = async function(orderId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    
    try {
        await db.ref('orders/list/' + orderId + '/status').set('cancelled');
        await db.ref('orders/list/' + orderId + '/cancelledAt').set(Date.now());
        await db.ref('orders/list/' + orderId + '/notificationSent').set(true);
        showToast('✅ تم إلغاء الطلب', 'success');
    } catch (error) {
        showToast('❌ فشل إلغاء الطلب', 'error');
    }
};

window.deleteOrder = async function(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
        await db.ref('orders/list/' + orderId).remove();
        showToast('✅ تم حذف الطلب', 'success');
    } catch (error) {
        showToast('❌ فشل الحذف', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#tab-orders .chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('#tab-orders .chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentOrderFilter = this.dataset.filter;
            renderOrders();
        });
    });
    
    loadSoundPreference();
    
    document.querySelectorAll('.nav-btn[data-tab="orders"]').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(markAllOrdersAsSeen, 500);
        });
    });
    
    const closeBtn = document.getElementById('closeRestaurantBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', async function() {
            if (!confirm('هل أنت متأكد من إغلاق المطعم؟\n\nسيتم إعادة تعيين عداد الطلبات إلى الصفر.')) return;
            
            try {
                await db.ref('orders/counter').set(0);
                showToast('✅ تم إغلاق المطعم وإعادة تعيين العداد', 'success');
            } catch (error) {
                showToast('❌ فشل إغلاق المطعم', 'error');
            }
        });
    }
});

window.manualRefreshOrders = manualRefreshOrders;
window.toggleOrderSound = toggleOrderSound;
window.markAllOrdersAsSeen = markAllOrdersAsSeen;
