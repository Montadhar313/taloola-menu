// ============================================
// 🔄 تحسينات معالجة الصور في admin.js
// ============================================

/**
 * تهيئة نظام الصور المحسّن عند تحميل النموذج
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ تهيئة نظام معالجة الصور المتقدم...');
    
    // تهيئة معالج الصور
    if (typeof setupImageInputListener === 'function') {
        setTimeout(() => {
            setupImageInputListener();
            console.log('✅ معالج الصور جاهز');
        }, 500);
    }
    
    // إضافة مستمع لحقل الصورة في النموذج
    const imageInput = document.getElementById('menuItemImage');
    if (imageInput) {
        // معاينة عند تحميل النموذج بقيمة موجودة
        imageInput.addEventListener('change', () => {
            if (imageInput.value.trim()) {
                console.log('🔄 تم تغيير الصورة، جاري المعاينة...');
            }
        });
    }
});

/**
 * تحسين دالة حفظ الصنف لتشمل التحقق من الصورة
 */
const originalMenuFormSubmit = document.getElementById('menuForm')?.addEventListener('submit', async function(e) {
    console.log('💾 جاري حفظ الصنف مع التحقق من الصورة...');
});

/**
 * تحسين دالة التعديل لعرض معاينة الصورة الموجودة
 */
window.enhancedEditMenuItem = function(id) {
    console.log(`📝 جاري تعديل الصنف: ${id}`);
    
    const item = allMenuItems?.find(i => i.id === id);
    if (!item) {
        console.warn('⚠️ لم يتم العثور على الصنف');
        return;
    }
    
    // ملء النموذج بالبيانات
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
    
    // تحديث المعاينة إن وجدت صورة
    if (item.image && typeof handleImageUrlChange === 'function') {
        setTimeout(() => {
            const imageInput = document.getElementById('menuItemImage');
            if (imageInput) {
                handleImageUrlChange(imageInput);
            }
        }, 300);
    }
    
    document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * تحسين عملية الحفظ للتحقق من الصورة بذكاء
 */
window.enhancedSaveMenuItemWithValidation = async function(formElement) {
    const imageUrl = document.getElementById('menuItemImage')?.value?.trim();
    
    if (!imageUrl) {
        console.log('ℹ️ لا توجد صورة - سيتم حفظ الصنف بدون صورة');
        return true;
    }
    
    console.log('🔍 جاري التحقق من صورة الصنف...');
    
    if (typeof validateAndSaveImage === 'function') {
        const result = await validateAndSaveImage(imageUrl);
        
        if (!result.valid) {
            console.warn('⚠️ الصورة قد تكون غير متاحة حالياً، لكن سيتم المحاولة');
            // لا نوقف الحفظ، بل نسمح به
            return true;
        }
        
        console.log('✅ تم التحقق من الصورة بنجاح');
        return true;
    }
    
    return true;
};

/**
 * إضافة تحقق ذكي من الصور عند حفظ الصنف
 */
function setupMenuItemFormEnhancements() {
    const menuForm = document.getElementById('menuForm');
    
    if (!menuForm) return;
    
    // حفظ المستمع الأصلي
    const originalSubmitEvent = menuForm.onsubmit;
    
    // استبدال بمستمع محسّن
    menuForm.addEventListener('submit', async function(e) {
        // تشغيل التحقق من الصورة قبل الحفظ
        const imageUrl = document.getElementById('menuItemImage')?.value?.trim();
        
        if (imageUrl && typeof adminImageHandler !== 'undefined') {
            console.log('🔄 جاري التحقق السريع من الصورة...');
            
            // فحص سريع (بدون انتظار طويل)
            const checkResult = await new Promise((resolve) => {
                // محاولة تحميل الصورة بسرعة
                const img = new Image();
                const timeout = setTimeout(() => {
                    img.onerror = img.onload = null;
                    resolve(false); // إذا استغرقت وقتاً طويلاً، نسمح بالحفظ
                }, 2000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    resolve(true);
                };
                
                img.onerror = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };
                
                img.crossOrigin = 'anonymous';
                img.src = imageUrl;
            });
            
            if (!checkResult) {
                console.warn('⚠️ الصورة قد تكون غير متاحة، لكن سيتم المحاولة من جديد');
            } else {
                console.log('✅ الصورة متاحة وجاهزة');
            }
        }
    });
}

/**
 * تحسين عرض الصور في قوائم الأصناف
 */
function enhanceMenuImageDisplay() {
    // استبدال معالج الخطأ للصور
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('menu-card-image')) {
            console.warn('❌ فشل تحميل صورة الصنف، جاري تجربة بدائل...');
            
            // إذا كانت لدينا نظام تحميل بديل، استخدمه
            if (typeof adminImageHandler !== 'undefined' && e.target.src) {
                const originalSrc = e.target.dataset.originalSrc || e.target.src;
                
                // محاولة الحصول على صورة بديلة
                adminImageHandler.retryWithAlternatives(originalSrc).then(result => {
                    if (result.valid) {
                        e.target.src = result.url;
                        console.log('✅ تم تحميل صورة بديلة');
                    } else {
                        e.target.src = 'https://via.placeholder.com/300x200?text=الصورة+غير+متاحة';
                    }
                });
            }
        }
    }, true);
}

/**
 * إضافة تحسينات لمعاينة الصور أثناء الكتابة
 */
function setupLiveImagePreview() {
    const imageInput = document.getElementById('menuItemImage');
    
    if (!imageInput) return;
    
    let previewTimeout;
    
    imageInput.addEventListener('input', function() {
        clearTimeout(previewTimeout);
        
        // إذا كان النظام المتقدم متاحاً، استخدمه
        if (typeof handleImageUrlChange === 'function') {
            previewTimeout = setTimeout(() => {
                handleImageUrlChange(this);
            }, 800);
        }
    });
}

/**
 * تحسين حذف الصنف مع تنظيف الكاش
 */
window.deleteMenuItemEnhanced = async function(id) {
    const item = allMenuItems?.find(i => i.id === id);
    
    if (!item) return;
    
    if (!confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) return;
    
    try {
        console.log('🗑️ جاري حذف الصنف...');
        await db.ref('menu/' + id).remove();
        
        // تنظيف الكاش للصورة إن وجدت
        if (item.image && typeof adminImageHandler !== 'undefined') {
            if (adminImageHandler.imageCache) {
                adminImageHandler.imageCache.delete(item.image);
                console.log('🧹 تم تنظيف الصورة من الكاش');
            }
        }
        
        showToast('تم حذف الصنف بنجاح', 'success');
    } catch (error) {
        console.error('❌ فشل الحذف:', error);
        showToast('فشل الحذف', 'error');
    }
};

/**
 * تحسين عملية تحميل الأصناف لعرض الصور بشكل أفضل
 */
window.enhancedLoadMenuItems = function() {
    console.log('📥 جاري تحميل الأصناف مع تحسينات الصور...');
    
    const menuList = document.getElementById('menuList');
    const menuCount = document.getElementById('menuCount');
    
    if (!menuList) return;
    
    db.ref('menu').orderByChild('order').on('value', (snapshot) => {
        menuList.innerHTML = '';
        const items = snapshot.val();
        
        if (!items) {
            if (menuCount) menuCount.textContent = '0';
            return;
        }
        
        allMenuItems = [];
        Object.keys(items).forEach(key => {
            allMenuItems.push({ id: key, ...items[key] });
        });
        
        if (menuCount) menuCount.textContent = allMenuItems.length;
        
        // ترتيب الأصناف
        allMenuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        console.log(`✅ تم تحميل ${allMenuItems.length} صنف`);
        renderMenuItems();
    });
};

/**
 * إعادة تصيير الصور مع معالجة أفضل للأخطاء
 */
window.rerenderMenuImagesWithBetterHandling = function() {
    console.log('🖼️ جاري إعادة معالجة الصور...');
    
    const images = document.querySelectorAll('.menu-card-image img');
    
    images.forEach(img => {
        const originalSrc = img.src;
        
        img.addEventListener('error', function() {
            console.warn(`❌ فشل تحميل: ${originalSrc}`);
            
            // محاولة بدائل إذا كان النظام متاحاً
            if (typeof adminImageHandler !== 'undefined') {
                adminImageHandler.retryWithAlternatives(originalSrc).then(result => {
                    if (result.valid) {
                        img.src = result.url;
                        console.log(`✅ نجح البديل: ${result.url.substring(0, 50)}...`);
                    } else {
                        img.src = 'https://via.placeholder.com/300x200?text=خطأ+في+الصورة';
                    }
                });
            } else {
                img.src = 'https://via.placeholder.com/300x200?text=خطأ+في+الصورة';
            }
        });
    });
};

// ============================================
// 🚀 تهيئة التحسينات
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 تهيئة جميع تحسينات معالجة الصور...');
    
    // تهيئة المعاينة الحية
    setupLiveImagePreview();
    
    // تهيئة تحسينات النموذج
    setupMenuItemFormEnhancements();
    
    // تحسين عرض الصور
    enhanceMenuImageDisplay();
    
    console.log('✨ جميع التحسينات جاهزة');
});

// إعادة تصيير الصور عند تحديث القائمة
const originalRenderMenuItems = window.renderMenuItems;
if (typeof originalRenderMenuItems === 'function') {
    window.renderMenuItems = function() {
        originalRenderMenuItems.apply(this, arguments);
        // تحسين الصور بعد التصيير
        setTimeout(() => {
            rerenderMenuImagesWithBetterHandling();
        }, 100);
    };
}

console.log(`
╔════════════════════════════════════════╗
║  تحسينات معالجة الصور - الملف الثاني ║
║  المعاينة الحية + التحقق الذكي        ║
╚════════════════════════════════════════╝
`);
