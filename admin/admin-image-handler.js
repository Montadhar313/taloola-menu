// ============================================
// 🖼️ نظام معالجة الصور المتقدم في لوحة الإدارة
// ============================================
// هذا الملف يحسّن عملية جلب وعرض الصور في نموذج إضافة/تعديل الأصناف

class AdminImageHandler {
    constructor() {
        this.imageCache = new Map();
        this.previewTimeout = null;
        this.maxImageSize = 10 * 1024 * 1024; // 10 MB
        this.allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        console.log('✨ Admin Image Handler متهيأ');
    }

    /**
     * 🔍 التحقق من صحة رابط الصورة
     */
    validateImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 📥 جلب معلومات الصورة من الرابط
     */
    async fetchImageInfo(url) {
        if (!this.validateImageUrl(url)) {
            return {
                valid: false,
                error: 'رابط الصورة غير صحيح'
            };
        }

        // التحقق من الكاش أولاً
        if (this.imageCache.has(url)) {
            console.log('📦 استخدام صورة مخزنة مؤقتاً');
            return this.imageCache.get(url);
        }

        try {
            const img = new Image();
            
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    img.onerror = img.onload = null;
                    resolve({
                        valid: false,
                        error: 'انتهت مهلة التحميل - الخادم بطيء جداً'
                    });
                }, 5000); // 5 ثواني timeout

                img.onload = () => {
                    clearTimeout(timeout);
                    
                    const result = {
                        valid: true,
                        url: url,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
                    };

                    // حفظ في الكاش
                    this.imageCache.set(url, result);
                    console.log(`✅ تم جلب معلومات الصورة: ${img.naturalWidth}x${img.naturalHeight}`);
                    
                    resolve(result);
                };

                img.onerror = () => {
                    clearTimeout(timeout);
                    resolve({
                        valid: false,
                        error: 'لم يتمكن من تحميل الصورة - تحقق من الرابط'
                    });
                };

                // منع CORS من التسبب في مشاكل
                img.crossOrigin = 'anonymous';
                img.src = url;
            });
        } catch (error) {
            return {
                valid: false,
                error: `خطأ: ${error.message}`
            };
        }
    }

    /**
     * 🎨 تحسين عرض الصورة في المعاينة
     */
    createOptimizedPreview(url, containerWidth = 300, containerHeight = 250) {
        return `
            <div class="admin-image-preview">
                <img 
                    src="${url}" 
                    alt="معاينة الصورة"
                    class="admin-preview-img"
                    loading="lazy"
                    decoding="async"
                    onerror="handleAdminImageError(this)"
                    style="
                        max-width: 100%;
                        max-height: 100%;
                        width: auto;
                        height: auto;
                        object-fit: contain;
                        display: block;
                        margin: 0 auto;
                        border-radius: 8px;
                    "
                >
                <div class="image-info-overlay">
                    <span class="info-badge">
                        <i class="fas fa-check-circle"></i>
                        <span id="imageStatus">جاري التحميل...</span>
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * 🔄 إعادة محاولة تحميل الصورة من مصادر بديلة
     */
    async retryWithAlternatives(originalUrl) {
        console.log('🔄 محاولة مصادر بديلة...');
        
        // إذا كان لدينا نظام تحميل الصور المتقدم، استخدمه
        if (typeof enhancedImageLoader !== 'undefined') {
            const alternatives = enhancedImageLoader.sourceHandler?.buildAlternativeUrls(originalUrl) || [];
            
            for (const altUrl of alternatives) {
                const result = await this.fetchImageInfo(altUrl);
                if (result.valid) {
                    console.log(`✅ نجح التحميل من: ${altUrl.substring(0, 60)}...`);
                    return result;
                }
            }
        }

        return {
            valid: false,
            error: 'لم تنجح أي من المحاولات البديلة'
        };
    }

    /**
     * 🧹 تنظيف الكاش
     */
    clearCache() {
        this.imageCache.clear();
        console.log('🧹 تم تنظيف كاش الصور');
    }

    /**
     * 📊 الحصول على إحصائيات
     */
    getStats() {
        return {
            cachedImages: this.imageCache.size,
            cacheSize: this.imageCache.size
        };
    }
}

// إنشاء مثيل عام من معالج الصور
const adminImageHandler = new AdminImageHandler();

// ============================================
// 🖼️ معالجات الأحداث للصور في النموذج
// ============================================

/**
 * معالج حدث تغيير رابط الصورة - معاينة حية
 */
async function handleImageUrlChange(inputElement) {
    const url = inputElement.value.trim();
    const previewContainer = document.getElementById('imagePreviewContainer');
    const statusText = document.getElementById('imageStatus');

    if (!previewContainer) return;

    // مسح المعاينة السابقة
    previewContainer.innerHTML = '';

    if (!url) {
        previewContainer.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-image"></i>
                <p>أدخل رابط صورة لعرض معاينة</p>
            </div>
        `;
        return;
    }

    // عرض حالة التحميل
    previewContainer.innerHTML = `
        <div class="loading-preview">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>جاري فحص الصورة...</p>
        </div>
    `;

    // تأخير قليل لتحسين الأداء
    clearTimeout(adminImageHandler.previewTimeout);
    adminImageHandler.previewTimeout = setTimeout(async () => {
        // محاولة الحصول على معلومات الصورة
        let result = await adminImageHandler.fetchImageInfo(url);

        // إذا فشل، حاول مصادر بديلة
        if (!result.valid && typeof enhancedImageLoader !== 'undefined') {
            console.log('⚠️ الرابط الأساسي فشل، محاولة المصادر البديلة...');
            result = await adminImageHandler.retryWithAlternatives(url);
        }

        // عرض النتيجة
        if (result.valid) {
            const html = adminImageHandler.createOptimizedPreview(result.url);
            previewContainer.innerHTML = html;
            
            // إضافة شريط معلومات
            const infoBar = document.createElement('div');
            infoBar.className = 'image-info-bar';
            infoBar.innerHTML = `
                <div class="info-item">
                    <span class="label">الأبعاد:</span>
                    <span class="value">${result.width} × ${result.height} px</span>
                </div>
                <div class="info-item">
                    <span class="label">النسبة:</span>
                    <span class="value">${result.aspectRatio}:1</span>
                </div>
                <div class="info-item" style="color: #28a745;">
                    <i class="fas fa-check-circle"></i> صورة صحيحة
                </div>
            `;
            previewContainer.appendChild(infoBar);

            if (statusText) {
                statusText.innerHTML = '✅ تم التحميل بنجاح';
                statusText.style.color = '#28a745';
            }
        } else {
            previewContainer.innerHTML = `
                <div class="error-preview">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${result.error}</p>
                    <small>تأكد من صحة الرابط أو جرب مصدراً آخر</small>
                </div>
            `;

            if (statusText) {
                statusText.innerHTML = `❌ ${result.error}`;
                statusText.style.color = '#dc3545';
            }
        }
    }, 1000); // تأخير 1 ثانية من الكتابة الأخيرة
}

/**
 * معالج خطأ الصور في الإدارة
 */
function handleAdminImageError(img) {
    console.warn('❌ فشل تحميل صورة الإدارة');
    
    const container = img.closest('.admin-image-preview');
    if (container) {
        const statusEl = container.querySelector('#imageStatus');
        if (statusEl) {
            statusEl.textContent = 'فشل التحميل';
            statusEl.style.color = '#dc3545';
        }
    }

    img.style.display = 'none';
}

/**
 * حفظ الصورة بذكاء - التحقق من الصحة قبل الحفظ
 */
async function validateAndSaveImage(imageUrl) {
    if (!imageUrl) return { valid: true }; // الصور اختياري

    const result = await adminImageHandler.fetchImageInfo(imageUrl);
    
    if (!result.valid) {
        console.warn('⚠️ محاولة استخدام مصادر بديلة...');
        return await adminImageHandler.retryWithAlternatives(imageUrl);
    }

    return result;
}

/**
 * تحديث حقل الصورة في النموذج مع المعاينة
 */
function setupImageInputListener() {
    const imageInput = document.getElementById('menuItemImage');
    
    if (imageInput) {
        // عند تغيير الرابط
        imageInput.addEventListener('input', function() {
            handleImageUrlChange(this);
        });

        // عند لصق الرابط
        imageInput.addEventListener('paste', function() {
            setTimeout(() => {
                handleImageUrlChange(this);
            }, 100);
        });

        // عند تحميل النموذج بقيم موجودة
        if (imageInput.value) {
            setTimeout(() => {
                handleImageUrlChange(imageInput);
            }, 500);
        }
    }
}

/**
 * تحسين حفظ الصنف مع التحقق من الصورة
 */
async function enhancedSaveMenuItem(formElement) {
    const imageUrl = document.getElementById('menuItemImage').value.trim();
    
    if (imageUrl) {
        console.log('🔍 جاري التحقق من صورة الصنف...');
        const imageResult = await validateAndSaveImage(imageUrl);
        
        if (!imageResult.valid) {
            console.warn('⚠️ تحذير: الصورة قد لا تكون صحيحة، لكن يمكن حفظ الصنف');
            // لا نوقف الحفظ، فقط تحذير
        } else {
            console.log('✅ تم التحقق من الصورة بنجاح');
        }
    }
    
    return true; // السماح بالحفظ في جميع الحالات
}

// ============================================
// 🎯 التهيئة عند تحميل لوحة الإدارة
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // تهيئة معالج الصور
    setupImageInputListener();
    
    console.log('✨ نظام معالجة الصور في الإدارة جاهز');
    console.log('🖼️ ستظهر معاينة مباشرة عند إدخال رابط صورة');
});

// تصدير للاستخدام
window.adminImageHandler = adminImageHandler;
window.handleImageUrlChange = handleImageUrlChange;
window.handleAdminImageError = handleAdminImageError;
window.validateAndSaveImage = validateAndSaveImage;
window.enhancedSaveMenuItem = enhancedSaveMenuItem;

console.log(`
╔════════════════════════════════════════╗
║  نظام معالجة الصور - لوحة الإدارة   ║
║  معاينة حية + تحقق ذكي + بدائل       ║
╚════════════════════════════════════════╝
`);
