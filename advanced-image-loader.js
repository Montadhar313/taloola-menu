// ============================================
// 🚀 نظام تحميل الصور الذكي - متقدم v2.0
// ============================================

/**
 * معرف المصادر المختلفة وبناء روابط بديلة
 * ترجمة الروابط من مصادر مختلفة إلى صيغ قابلة للتحميل المباشر
 */

class AdvancedImageSourceHandler {
    constructor() {
        this.sourceCache = new Map();      // تخزين المصادر الناجحة
        this.failedAttempts = new Map();   // تتبع المحاولات الفاشلة
        this.sourceTypeCache = new Map();  // تخزين نوع المصدر
        this.maxAttemptsPerSource = 3;
        console.log('✨ Advanced Image Source Handler متهيأ');
    }

    /**
     * 🔍 اكتشاف نوع مصدر الصورة
     * @param {string} url - رابط الصورة
     * @returns {string} - نوع المصدر: 'github' | 'googledrive' | 'imgur' | 'top4top' | 'direct' | 'unknown'
     */
    detectSourceType(url) {
        if (!url || typeof url !== 'string') return 'unknown';

        const lowerUrl = url.toLowerCase();
        
        // التحقق من النوع
        if (lowerUrl.includes('github.com') || lowerUrl.includes('raw.githubusercontent.com')) {
            return 'github';
        }
        if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('uc?id=')) {
            return 'googledrive';
        }
        if (lowerUrl.includes('imgur.com')) {
            return 'imgur';
        }
        if (lowerUrl.includes('top4top.io') || lowerUrl.includes('top4top.net')) {
            return 'top4top';
        }
        if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
            return 'direct';
        }
        if (lowerUrl.startsWith('data:image/')) {
            return 'datauri';
        }

        return 'unknown';
    }

    /**
     * 🔗 بناء روابط بديلة من GitHub
     * تحويل روابط GitHub إلى صيغة Raw القابلة للتحميل المباشر
     */
    buildGithubAlternatives(url) {
        const alternatives = [];

        // إذا كان الرابط بالفعل raw.githubusercontent.com
        if (url.includes('raw.githubusercontent.com')) {
            alternatives.push(url);
            // محاولة بصيغ مختلفة
            alternatives.push(url.replace(/\.jpg$/, '.png'));
            alternatives.push(url.replace(/\.png$/, '.jpg'));
            alternatives.push(url.replace(/\.webp$/, '.jpg'));
            return alternatives;
        }

        // تحويل من github.com/user/repo/blob/branch/file إلى raw.githubusercontent.com
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.*)/i);
        if (match) {
            const [, user, repo, branch, filepath] = match;
            const baseUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filepath}`;
            
            alternatives.push(baseUrl);
            alternatives.push(baseUrl.replace(/\.jpg$/, '.png'));
            alternatives.push(baseUrl.replace(/\.png$/, '.jpg'));
            alternatives.push(baseUrl.replace(/\.webp$/, '.jpg'));

            // محاولة مع فرع main أيضاً إذا كان master
            if (branch.toLowerCase() === 'master') {
                alternatives.push(baseUrl.replace('/master/', '/main/'));
            }

            return alternatives;
        }

        // إذا كان رابط عام من GitHub
        if (url.includes('github.com')) {
            alternatives.push(url);
        }

        return alternatives;
    }

    /**
     * 🔗 بناء روابط بديلة من Google Drive
     * تحويل روابط Google Drive إلى روابط تنزيل مباشر
     */
    buildGoogleDriveAlternatives(url) {
        const alternatives = [];
        
        // استخراج معرف الملف
        let fileId = null;
        
        // صيغة 1: drive.google.com/file/d/FILE_ID/view
        const match1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
        if (match1) {
            fileId = match1[1];
        }
        
        // صيغة 2: drive.google.com/open?id=FILE_ID
        const match2 = url.match(/id=([^&]+)/i);
        if (match2 && !fileId) {
            fileId = match2[1];
        }

        if (fileId) {
            // الرابط الأساسي للتنزيل المباشر
            alternatives.push(`https://drive.google.com/uc?id=${fileId}&export=download`);
            alternatives.push(`https://drive.google.com/uc?id=${fileId}&export=view`);
            alternatives.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`);
            
            // محاولة مع parameters مختلفة
            alternatives.push(`https://drive.google.com/file/d/${fileId}/preview`);
        } else {
            alternatives.push(url);
        }

        return alternatives;
    }

    /**
     * 🔗 بناء روابط بديلة من Imgur
     * محاولة أنواع مختلفة من روابط Imgur
     */
    buildImgurAlternatives(url) {
        const alternatives = [];
        
        // استخراج معرف الصورة
        const match = url.match(/imgur\.com\/(\w+)/i);
        if (match) {
            const imageId = match[1];
            
            // أنواع مختلفة من صيغ Imgur
            alternatives.push(url);
            alternatives.push(`https://i.imgur.com/${imageId}.jpg`);
            alternatives.push(`https://i.imgur.com/${imageId}.png`);
            alternatives.push(`https://i.imgur.com/${imageId}.gif`);
            alternatives.push(`https://imgur.com/${imageId}.jpg`);
            alternatives.push(`https://imgur.com/${imageId}.png`);
            
            // محاولة مع أحجام مختلفة
            alternatives.push(`https://i.imgur.com/${imageId}l.jpg`); // large
            alternatives.push(`https://i.imgur.com/${imageId}m.jpg`); // medium
            alternatives.push(`https://i.imgur.com/${imageId}t.jpg`); // thumb
            
            return alternatives;
        }

        alternatives.push(url);
        return alternatives;
    }

    /**
     * 🔗 بناء روابط بديلة من top4top
     * محاولة أشكال مختلفة من روابط top4top
     */
    buildTop4TopAlternatives(url) {
        const alternatives = [];
        
        // top4top لديه عدة صيغ للروابط
        alternatives.push(url);
        
        // محاولة تحويل من .io إلى .net
        if (url.includes('top4top.io')) {
            alternatives.push(url.replace('top4top.io', 'top4top.net'));
        }
        
        // محاولة صيغ مختلفة من نفس المعرف
        const match = url.match(/top4top\.\w+\/([^/]+)/i);
        if (match) {
            const fileId = match[1];
            alternatives.push(`https://top4top.io/${fileId}`);
            alternatives.push(`https://top4top.net/${fileId}`);
        }

        return alternatives;
    }

    /**
     * 🔗 إنشاء قائمة روابط بديلة حسب نوع المصدر
     * @param {string} url - الرابط الأصلي
     * @returns {array} - مصفوفة من الروابط البديلة
     */
    buildAlternativeUrls(url) {
        if (!url || typeof url !== 'string') return [];

        // التحقق من الكاش أولاً
        if (this.sourceCache.has(url)) {
            return [this.sourceCache.get(url)];
        }

        const sourceType = this.detectSourceType(url);
        let alternatives = [];

        console.log(`🔍 كشف نوع المصدر: ${sourceType} للرابط: ${url.substring(0, 60)}...`);

        switch (sourceType) {
            case 'github':
                alternatives = this.buildGithubAlternatives(url);
                break;
            case 'googledrive':
                alternatives = this.buildGoogleDriveAlternatives(url);
                break;
            case 'imgur':
                alternatives = this.buildImgurAlternatives(url);
                break;
            case 'top4top':
                alternatives = this.buildTop4TopAlternatives(url);
                break;
            case 'direct':
            case 'datauri':
                alternatives = [url];
                break;
            default:
                alternatives = [url];
        }

        // إضافة الرابط الأصلي في البداية إذا لم يكن موجود
        if (!alternatives.includes(url)) {
            alternatives.unshift(url);
        }

        // تصفية الروابط الفارغة
        return alternatives.filter(alt => alt && alt.trim() !== '');
    }

    /**
     * 🏁 تسجيل محاولة ناجحة
     */
    recordSuccessfulSource(originalUrl, workingUrl) {
        this.sourceCache.set(originalUrl, workingUrl);
        this.failedAttempts.delete(originalUrl);
        console.log(`✅ تم تسجيل رابط ناجح: ${workingUrl.substring(0, 50)}...`);
    }

    /**
     * ❌ تسجيل محاولة فاشلة
     */
    recordFailedAttempt(originalUrl, failedUrl) {
        if (!this.failedAttempts.has(originalUrl)) {
            this.failedAttempts.set(originalUrl, []);
        }
        this.failedAttempts.get(originalUrl).push(failedUrl);
    }

    /**
     * 📊 الحصول على إحصائيات
     */
    getStats() {
        return {
            cachedSources: this.sourceCache.size,
            failedTracking: this.failedAttempts.size,
            cachedTypes: this.sourceTypeCache.size
        };
    }

    /**
     * 🧹 تنظيف الكاش
     */
    clearCache() {
        this.sourceCache.clear();
        this.failedAttempts.clear();
        this.sourceTypeCache.clear();
        console.log('🧹 تم تنظيف كاش المصادر');
    }
}

// ============================================
// 🎯 تحديث SmartSequentialImageLoader
// ============================================

/**
 * دالة تحميل الصورة مع محاولات متعددة من مصادر مختلفة
 * هذه الدالة تحل محل loadImage() الحالية
 */
function createEnhancedImageLoader() {
    const sourceHandler = new AdvancedImageSourceHandler();

    return {
        /**
         * تحميل الصورة مع جميع البدائل المتاحة
         */
        async loadImageWithFallbacks(src, imgElement) {
            if (!src || !imgElement) return false;

            // الحصول على قائمة الروابط البديلة
            const alternatives = sourceHandler.buildAlternativeUrls(src);
            
            console.log(`📸 محاولة تحميل صورة من ${alternatives.length} مصدر`);

            for (let i = 0; i < alternatives.length; i++) {
                const url = alternatives[i];
                const attemptNum = i + 1;

                try {
                    const success = await this.tryLoadImage(url, 3000); // timeout: 3 ثواني
                    
                    if (success) {
                        imgElement.src = url;
                        sourceHandler.recordSuccessfulSource(src, url);
                        console.log(`✅ تم التحميل من المحاولة ${attemptNum}: ${url.substring(0, 60)}...`);
                        return true;
                    }
                } catch (error) {
                    sourceHandler.recordFailedAttempt(src, url);
                    console.warn(`❌ محاولة ${attemptNum} فشلت: ${error.message}`);
                }

                // انتظار قصير قبل المحاولة التالية
                if (i < alternatives.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // إذا فشلت جميع المحاولات
            console.error(`❌ فشل تحميل الصورة من جميع المصادر: ${src}`);
            return false;
        },

        /**
         * محاولة تحميل صورة واحدة مع timeout
         */
        tryLoadImage(url, timeout = 3000) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const timer = setTimeout(() => {
                    img.onerror = img.onload = null;
                    reject(new Error(`Timeout بعد ${timeout}ms`));
                }, timeout);

                img.onload = () => {
                    clearTimeout(timer);
                    resolve(true);
                };

                img.onerror = () => {
                    clearTimeout(timer);
                    reject(new Error(`فشل تحميل الصورة: ${url.substring(0, 50)}`));
                };

                img.src = url;
            });
        },

        /**
         * الحصول على المصدر الناجح المخزن مؤقتاً
         */
        getCachedSource(originalUrl) {
            return sourceHandler.sourceCache.get(originalUrl) || null;
        },

        /**
         * الحصول على إحصائيات
         */
        getStats() {
            return sourceHandler.getStats();
        },

        /**
         * تنظيف الكاش
         */
        clearCache() {
            sourceHandler.clearCache();
        }
    };
}

// ============================================
// 📊 تصدير للاستخدام
// ============================================

// إنشاء مثيل العامل المحسّن
const enhancedImageLoader = createEnhancedImageLoader();

console.log(`
╔════════════════════════════════════════╗
║  نظام تحميل الصور المتقدم - v2.0      ║
║  مع دعم مصادر متعددة ومحاولات ذكية    ║
╚════════════════════════════════════════╝
`);
