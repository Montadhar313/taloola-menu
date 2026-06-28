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

document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    if (!loginScreen || !dashboard || !loginBtn) {
        console.error('❌ عناصر صفحة الدخول غير موجودة');
        return;
    }
    
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
    loadAds();
    loadCategories();
    loadMenuItems();
}

// ============================================
// 📑 إدارة التبويبات
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById('tab-' + this.dataset.tab);
            if (targetTab) targetTab.classList.add('active');
        });
    });
});

// ============================================
// 📢 إدارة الإعلانات
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const adForm = document.getElementById('adForm');
    const imageUrlInput = document.getElementById('imageUrl');
    const previewBtn = document.getElementById('previewBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    if (!adForm || !imageUrlInput) return;
    
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const url = imageUrlInput.value.trim();
            if (!url) return showToast('الرجاء إدخال رابط الصورة أولاً', 'error');
            try { new URL(url); } catch (e) { return showToast('الرابط غير صالح', 'error'); }
            if (imagePreview) imagePreview.src = url;
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
        });
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageUrlInput.value = '';
            if (imagePreview) imagePreview.src = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        });
    }
    
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
        const imageUrl = imageUrlInput.value.trim();
        
        if (imageUrl) {
            try { new URL(imageUrl); } catch (e) {
                showToast('رابط الصورة غير صالح', 'error');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
                }
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
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        } catch (error) {
            if (error.code === 'PERMISSION_DENIED') {
                showToast('⚠️ خطأ في الصلاحيات! يرجى تحديث قواعد Firebase', 'error');
            } else {
                showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
            }
        }
    });
    
    if (adForm) {
        adForm.addEventListener('reset', () => {
            setTimeout(() => {
                if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
                if (imagePreview) imagePreview.src = '';
            }, 10);
        });
    }
});

function loadAds() {
    const adsList = document.getElementById('adsList');
    const totalAdsCount = document.getElementById('totalAdsCount');
    
    if (!adsList) return;
    
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
            if (totalAdsCount) totalAdsCount.textContent = '0';
            return;
        }
        const sortedAds = Object.keys(ads).reverse();
        if (totalAdsCount) totalAdsCount.textContent = sortedAds.length;
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
    }, (error) => {
        console.error('خطأ في تحميل الإعلانات:', error);
    });
}

window.deleteAd = async function(key) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
        await db.ref('ads/' + key).remove();
        showToast('تم حذف الإعلان بنجاح', 'success');
    } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
            showToast('⚠️ خطأ في الصلاحيات!', 'error');
        } else {
            showToast('فشل الحذف: ' + error.message, 'error');
        }
    }
};

// ============================================
// 📂 إدارة الأقسام (Categories) - مُصحّح
// ============================================
let allCategories = [];

document.addEventListener('DOMContentLoaded', () => {
    const categoryForm = document.getElementById('categoryForm');
    if (!categoryForm) return;
    
    categoryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveCategoryBtn');
        const saveBtnText = document.getElementById('saveCategoryText');
        
        if (saveBtn) {
            saveBtn.disabled = true;
            if (saveBtnText) saveBtnText.textContent = 'جاري الحفظ...';
        }
        
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || '📁';
        const order = parseInt(document.getElementById('categoryOrder').value) || allCategories.length;
        
        if (!name) {
            showToast('الرجاء إدخال اسم القسم', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveBtnText) saveBtnText.textContent = 'حفظ القسم';
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
            console.error('خطأ في حفظ القسم:', error);
            if (error.code === 'PERMISSION_DENIED') {
                showToast('⚠️ خطأ في الصلاحيات!', 'error');
            } else {
                showToast('حدث خطأ: ' + error.message, 'error');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveBtnText) saveBtnText.textContent = 'حفظ القسم';
            }
        }
    });
});

function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const totalCategoriesCount = document.getElementById('totalCategoriesCount');
    
    if (!categoriesList) {
        console.error('❌ عنصر categoriesList غير موجود');
        return;
    }
    
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
                .then(() => showToast(`تم إضافة ${SEED_CATEGORIES.length} قسم افتراضي`, 'success'))
                .catch(err => console.error('خطأ في Seed:', err));
        }
    });
    
    // الاستماع المستمر للتغييرات
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
        console.error('خطأ في تحميل الأقسام:', error);
    });
}

function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    if (allCategories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open fa-3x"></i>
                <h3>لا توجد أقسام</h3>
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
        showToast('فشل تحديث الترتيب: ' + error.message, 'error');
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
    
    const categoryId = document.getElementById('categoryId');
    const categoryName = document.getElementById('categoryName');
    const categoryIcon = document.getElementById('categoryIcon');
    const categoryOrder = document.getElementById('categoryOrder');
    const categoryFormTitle = document.getElementById('categoryFormTitle');
    const saveCategoryText = document.getElementById('saveCategoryText');
    const cancelEditCategoryBtn = document.getElementById('cancelEditCategoryBtn');
    
    if (categoryId) categoryId.value = cat.id;
    if (categoryName) categoryName.value = cat.name;
    if (categoryIcon) categoryIcon.value = cat.icon || '';
    if (categoryOrder) categoryOrder.value = cat.order !== undefined ? cat.order : '';
    if (categoryFormTitle) categoryFormTitle.textContent = 'تعديل القسم';
    if (saveCategoryText) saveCategoryText.textContent = 'حفظ التعديلات';
    if (cancelEditCategoryBtn) cancelEditCategoryBtn.style.display = 'inline-flex';
    
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) categoryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        showToast('فشل الحذف: ' + error.message, 'error');
    }
};

function resetCategoryForm() {
    const categoryForm = document.getElementById('categoryForm');
    const categoryId = document.getElementById('categoryId');
    const categoryFormTitle = document.getElementById('categoryFormTitle');
    const saveCategoryText = document.getElementById('saveCategoryText');
    const cancelEditCategoryBtn = document.getElementById('cancelEditCategoryBtn');
    
    if (categoryForm) categoryForm.reset();
    if (categoryId) categoryId.value = '';
    if (categoryFormTitle) categoryFormTitle.textContent = 'إضافة قسم جديد';
    if (saveCategoryText) saveCategoryText.textContent = 'حفظ القسم';
    if (cancelEditCategoryBtn) cancelEditCategoryBtn.style.display = 'none';
    document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
}

document.addEventListener('DOMContentLoaded', () => {
    const resetCategoryFormBtn = document.getElementById('resetCategoryForm');
    const cancelEditCategoryBtn = document.getElementById('cancelEditCategoryBtn');
    
    if (resetCategoryFormBtn) resetCategoryFormBtn.addEventListener('click', resetCategoryForm);
    if (cancelEditCategoryBtn) cancelEditCategoryBtn.addEventListener('click', resetCategoryForm);
    
    document.querySelectorAll('.icon-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', function() {
            const categoryIcon = document.getElementById('categoryIcon');
            if (categoryIcon) categoryIcon.value = this.dataset.icon;
            document.querySelectorAll('.icon-suggestion').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
});

// ============================================
// 🎯 Custom Select (Dropdown محسّن)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const customSelect = document.getElementById('menuItemCategorySelect');
    if (!customSelect) return;
    
    const selectedText = customSelect.querySelector('.selected-text');
    const optionsList = document.getElementById('categoryOptionsList');
    const searchInput = customSelect.querySelector('.custom-select-search');
    const hiddenInput = document.getElementById('menuItemCategory');
    
    const selectedDiv = customSelect.querySelector('.custom-select-selected');
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

function updateCategoryDropdown() {
    const optionsList = document.getElementById('categoryOptionsList');
    const customSelect = document.getElementById('menuItemCategorySelect');
    const selectedText = customSelect ? customSelect.querySelector('.selected-text') : null;
    const hiddenInput = document.getElementById('menuItemCategory');
    
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
            const value = this.getAttribute('data-value');
            if (hiddenInput) hiddenInput.value = value;
            if (selectedText) {
                selectedText.textContent = value;
                const icon = this.querySelector('.option-icon').textContent;
                let iconSpan = selectedText.querySelector('.selected-icon');
                if (!iconSpan) {
                    iconSpan = document.createElement('span');
                    iconSpan.className = 'selected-icon';
                    selectedText.insertBefore(iconSpan, selectedText.firstChild);
                }
                iconSpan.textContent = icon;
            }
            
            optionsList.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            if (customSelect) customSelect.classList.remove('open');
            const searchInput = document.querySelector('.custom-select-search');
            if (searchInput) searchInput.value = '';
            optionsList.querySelectorAll('.custom-select-option').forEach(o => o.style.display = 'flex');
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

document.addEventListener('DOMContentLoaded', () => {
    const menuForm = document.getElementById('menuForm');
    if (!menuForm) return;
    
    menuForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveMenuItemBtn');
        const saveBtnText = document.getElementById('saveMenuItemText');
        
        if (saveBtn) {
            saveBtn.disabled = true;
            if (saveBtnText) saveBtnText.textContent = 'جاري الحفظ...';
        }
        
        const id = document.getElementById('menuItemId').value;
        const name = document.getElementById('menuItemName').value.trim();
        const category = document.getElementById('menuItemCategory').value;
        const price = parseInt(document.getElementById('menuItemPrice').value);
        const image = document.getElementById('menuItemImage').value.trim();
        const description = document.getElementById('menuItemDescription').value.trim();
        const available = document.getElementById('menuItemAvailable').checked;
        
        if (!category) {
            showToast('الرجاء اختيار القسم', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveBtnText) saveBtnText.textContent = 'حفظ الصنف';
            }
            return;
        }
        
        if (image) {
            try { new URL(image); } catch (e) {
                showToast('رابط الصورة غير صالح', 'error');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    if (saveBtnText) saveBtnText.textContent = 'حفظ الصنف';
                }
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
            if (error.code === 'PERMISSION_DENIED') {
                showToast('⚠️ خطأ في الصلاحيات!', 'error');
            } else {
                showToast('حدث خطأ: ' + error.message, 'error');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                if (saveBtnText) saveBtnText.textContent = 'حفظ الصنف';
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
    
    const resetMenuFormBtn = document.getElementById('resetMenuForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (resetMenuFormBtn) resetMenuFormBtn.addEventListener('click', resetMenuForm);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetMenuForm);
});

function loadMenuItems() {
    const menuList = document.getElementById('menuList');
    const totalMenuCount = document.getElementById('totalMenuCount');
    const activeMenuCount = document.getElementById('activeMenuCount');
    
    if (!menuList) return;
    
    // Seed المنتجات الأولية
    db.ref('menu').once('value').then(snapshot => {
        if (!snapshot.val()) {
            const SEED_MENU_ITEMS = [
                { name: 'بركر كلاسك', category: 'بركر', price: 3000, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر لحم طازج', available: true, order: 0 },
                { name: 'بركر مدخن', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر مدخن', available: true, order: 1 },
                { name: 'بركر بالجبن', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر بالجبنة', available: true, order: 2 },
                { name: 'بركر سبايسي', category: 'بركر', price: 3500, image: GITHUB_IMAGES_BASE + 'BRGER.png', description: 'برغر حار', available: true, order: 3 },
                { name: 'زنكر كلاسك', category: 'زنكر', price: 2500, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر دجاج مقرمش', available: true, order: 0 },
                { name: 'زنكر مكسيكانو', category: 'زنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر مكسيكي', available: true, order: 1 },
                { name: 'زنكر مدخن', category: 'زنكر', price: 3000, image: GITHUB_IMAGES_BASE + 'ZENGER.png', description: 'زنكر مدخن', available: true, order: 2 }
            ];
            
            Promise.all(SEED_MENU_ITEMS.map(item => db.ref('menu').push(item)))
                .then(() => showToast(`تم إضافة ${SEED_MENU_ITEMS.length} منتج افتراضي`, 'success'))
                .catch(err => console.error('خطأ في Seed:', err));
        }
    });
    
    // الاستماع المستمر للتغييرات
    db.ref('menu').on('value', (snapshot) => {
        menuList.innerHTML = '';
        allMenuItems = [];
        const items = snapshot.val();
        
        if (!items) {
            menuList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-utensils fa-3x"></i>
                    <h3>لا توجد أصناف</h3>
                </div>`;
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
        console.error('خطأ في تحميل المنيو:', error);
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

window.editMenuItem = function(id) {
    const item = allMenuItems.find(i => i.id === id);
    if (!item) return;
    
    const menuItemId = document.getElementById('menuItemId');
    const menuItemName = document.getElementById('menuItemName');
    const menuItemCategory = document.getElementById('menuItemCategory');
    const menuItemPrice = document.getElementById('menuItemPrice');
    const menuItemImage = document.getElementById('menuItemImage');
    const menuItemDescription = document.getElementById('menuItemDescription');
    const menuItemAvailable = document.getElementById('menuItemAvailable');
    const menuFormTitle = document.getElementById('menuFormTitle');
    const saveMenuItemText = document.getElementById('saveMenuItemText');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    if (menuItemId) menuItemId.value = item.id;
    if (menuItemName) menuItemName.value = item.name;
    if (menuItemCategory) menuItemCategory.value = item.category;
    if (menuItemPrice) menuItemPrice.value = item.price;
    if (menuItemImage) menuItemImage.value = item.image || '';
    if (menuItemDescription) menuItemDescription.value = item.description || '';
    if (menuItemAvailable) menuItemAvailable.checked = item.available;
    if (menuFormTitle) menuFormTitle.textContent = 'تعديل الصنف';
    if (saveMenuItemText) saveMenuItemText.textContent = 'حفظ التعديلات';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
    
    const menuForm = document.getElementById('menuForm');
    if (menuForm) menuForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const menuForm = document.getElementById('menuForm');
    const menuItemId = document.getElementById('menuItemId');
    const menuFormTitle = document.getElementById('menuFormTitle');
    const saveMenuItemText = document.getElementById('saveMenuItemText');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    if (menuForm) menuForm.reset();
    if (menuItemId) menuItemId.value = '';
    if (menuFormTitle) menuFormTitle.textContent = 'إضافة صنف جديد';
    if (saveMenuItemText) saveMenuItemText.textContent = 'حفظ الصنف';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    
    const customSelect = document.getElementById('menuItemCategorySelect');
    if (customSelect) {
        const selectedText = customSelect.querySelector('.selected-text');
        if (selectedText) selectedText.textContent = 'اختر القسم';
        const icon = selectedText ? selectedText.querySelector('.selected-icon') : null;
        if (icon) icon.remove();
    }
}

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
