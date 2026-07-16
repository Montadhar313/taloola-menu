/**
 * ============================================
 * ⭐ نظام التقييم المحسّن - تعلولة
 * ============================================
 * الميزات:
 * - نظام نجوم تفاعلي مع تأثيرات بصرية
 * - تحقق من صحة البيانات في الوقت الفعلي
 * - دعم رفع الصور مع المعاينة
 * - إرسال آمن لـ Firebase
 * - تجربة مستخدم سلسة مع إشعارات
 * - إعادة توجيه ذكية بعد التقييم
 */

// ============================================
// 🔧 الثوابت والإعدادات
// ============================================
const CONFIG = {
    MAX_MESSAGE_LENGTH: 300,
    MIN_RATING: 1,
    MAX_RATING: 5,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    TOAST_DURATION: 4000,
    REDIRECT_DELAY: 2000,
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
        authDomain: "talola-food.firebaseapp.com",
        databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
        projectId: "talola-food",
        messagingSenderId: "440585170470",
        appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
    }
};

const RATING_TEXTS = {
    1: { text: "سيء جداً 😞", color: "var(--review-error)" },
    2: { text: "سيء 😐", color: "var(--review-error)" },
    3: { text: "مقبول 🙂", color: "var(--review-secondary)" },
    4: { text: "جيد 😊", color: "var(--review-success)" },
    5: { text: "ممتاز 🎉", color: "var(--review-success)" }
};

// ============================================
// 📦 المتغيرات العامة
// ============================================
let currentRating = 0;
let selectedImage = null;
let firebaseDB = null;
let orderNumber = null;
let isSubmitting = false;

// ============================================
// 🚀 التهيئة عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    await initFirebase();
    initializeApp();
});

/**
 * تهيئة Firebase
 */
async function initFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase === 'undefined') {
            setTimeout(initFirebase, 100);
            return;
        }
        
        if (!firebase.apps.length) {
            firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
        }
        
        firebaseDB = firebase.database();
        resolve();
    });
}

/**
 * تهيئة التطبيق
 */
function initializeApp() {
    // قراءة رقم الطلب من URL أو sessionStorage
    readOrderNumber();
    
    // إعداد معالجات الأحداث
    setupEventListeners();
    
    // تحديث حالة زر الإرسال
    updateSubmitButtonState();
    
    // تحديث زر تتبع الطلب
    updateTrackingButton();
}

/**
 * قراءة رقم الطلب من الرابط أو التخزين
 */
function readOrderNumber() {
    // أولاً: من URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    orderNumber = urlParams.get('order');
    
    // ثانياً: من sessionStorage (إذا جاء من صفحة التتبع)
    if (!orderNumber) {
        orderNumber = sessionStorage.getItem('lastOrderNumber');
    }
    
    // ثالثاً: من localStorage (نسخة احتياطية)
    if (!orderNumber) {
        orderNumber = localStorage.getItem('taloola_last_order');
    }
    
    // عرض رقم الطلب إذا وجد
    if (orderNumber) {
        const orderBadge = document.getElementById('orderBadge');
        const orderDisplay = document.getElementById('orderNumberDisplay');
        
        if (orderBadge && orderDisplay) {
            orderDisplay.textContent = orderNumber.replace('#', '');
            orderBadge.style.display = 'inline-flex';
        }
        
        // إظهار زر تتبع الطلب في شاشة النجاح
        const trackingBtn = document.getElementById('goToTrackingBtn');
        if (trackingBtn) {
            trackingBtn.style.display = 'flex';
            trackingBtn.href = `order-tracking.html?order=${orderNumber}`;
        }
    }
}

// ============================================
// 🎯 إعداد معالجات الأحداث
// ============================================
function setupEventListeners() {
    setupStarRating();
    setupCharCounter();
    setupImageUpload();
    setupFormSubmission();
    setupNavigation();
}

/**
 * إعداد نظام النجوم التفاعلي
 */
function setupStarRating() {
    const starButtons = document.querySelectorAll('.star-btn');
    const feedback = document.getElementById('ratingFeedback');
    
    starButtons.forEach((button) => {
        // حدث النقر - اختيار التقييم
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value);
            setRating(value);
            triggerHapticFeedback();
        });
        
        // حدث التحويم - معاينة التقييم
        button.addEventListener('mouseenter', () => {
            const value = parseInt(button.dataset.value);
            highlightStars(value);
            updateFeedback(value);
        });
        
        // حدث مغادرة الماوس - العودة للتقييم المختار
        button.addEventListener('mouseleave', () => {
            highlightStars(currentRating);
            updateFeedback(currentRating);
        });
        
        // دعم لوحة المفاتيح لإمكانية الوصول
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const value = parseInt(button.dataset.value);
                setRating(value);
            }
        });
    });
}

/**
 * تعيين التقييم وتحديث الواجهة
 */
function setRating(value) {
    if (value < CONFIG.MIN_RATING || value > CONFIG.MAX_RATING) return;
    
    currentRating = value;
    highlightStars(value);
    updateFeedback(value);
    updateSubmitButtonState();
    
    // تأثير بصري عند الاختيار
    animateRatingSelection(value);
}

/**
 * تمييز النجوم بناءً على القيمة
 */
function highlightStars(value) {
    const stars = document.querySelectorAll('.star-btn i');
    
    stars.forEach((star, index) => {
        const starValue = index + 1;
        const isActive = starValue <= value;
        
        star.classList.toggle('fas', isActive);
        star.classList.toggle('far', !isActive);
        star.parentElement.classList.toggle('active', isActive);
    });
}

/**
 * تحديث نص التغذية الراجعة
 */
function updateFeedback(value) {
    const feedback = document.getElementById('ratingFeedback');
    if (!feedback) return;
    
    if (value >= CONFIG.MIN_RATING && value <= CONFIG.MAX_RATING) {
        const ratingData = RATING_TEXTS[value];
        feedback.textContent = ratingData.text;
        feedback.style.color = ratingData.color;
        feedback.dataset.rating = value;
    } else {
        feedback.textContent = 'اختر تقييمك';
        feedback.style.color = 'var(--review-text-muted)';
        feedback.dataset.rating = '';
    }
}

/**
 * تأثير حركي عند اختيار التقييم
 */
function animateRatingSelection(value) {
    const selectedStar = document.querySelector(`.star-btn[data-value="${value}"] i`);
    if (selectedStar) {
        selectedStar.style.animation = 'none';
        setTimeout(() => {
            selectedStar.style.animation = 'starGlow 0.3s ease';
        }, 10);
    }
}

/**
 * إعداد عداد الأحرف للملاحظات
 */
function setupCharCounter() {
    const textarea = document.getElementById('reviewMessage');
    const counter = document.getElementById('charCount');
    
    if (!textarea || !counter) return;
    
    textarea.addEventListener('input', function() {
        const length = this.value.length;
        counter.textContent = length;
        
        // تحديث حالة العداد
        counter.classList.remove('warning', 'danger');
        if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
            counter.classList.add('warning');
        }
        if (length >= CONFIG.MAX_MESSAGE_LENGTH) {
            counter.classList.add('danger');
        }
        
        updateSubmitButtonState();
    });
}

/**
 * إعداد رفع الصورة والمعاينة
 */
function setupImageUpload() {
    const fileInput = document.getElementById('reviewImage');
    const preview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');
    
    if (!fileInput || !preview) return;
    
    // معالجة اختيار الملف
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
            showToast('⚠ الرجاء اختيار ملف صورة صالح', 'warning');
            this.value = '';
            return;
        }
        
        // التحقق من الحجم
        if (file.size > CONFIG.MAX_IMAGE_SIZE) {
            showToast('⚠ حجم الصورة كبير جداً (الحد الأقصى 5MB)', 'warning');
            this.value = '';
            return;
        }
        
        // عرض المعاينة
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.querySelector('img').src = event.target.result;
            preview.classList.add('active');
            selectedImage = event.target.result;
            showToast('✅ تم إضافة الصورة بنجاح', 'success');
        };
        reader.readAsDataURL(file);
    });
    
    // إزالة الصورة
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.value = '';
            preview.classList.remove('active');
            preview.querySelector('img').src = '';
            selectedImage = null;
            showToast('🗑️ تم إزالة الصورة', 'info');
        });
    }
}

/**
 * إعداد زر الإرسال والتحقق
 */
function setupFormSubmission() {
    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmitReview);
    }
}

/**
 * تحديث حالة زر الإرسال
 */
function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitReviewBtn');
    if (!submitBtn) return;
    
    const isValid = currentRating >= CONFIG.MIN_RATING && !isSubmitting;
    submitBtn.disabled = !isValid;
}

/**
 * إعداد أزرار التنقل
 */
function setupNavigation() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToMenu();
        });
    }
    
    // دعم زر الرجوع في المتصفح
    window.addEventListener('popstate', () => {
        navigateToMenu();
    });
}

// ============================================
// 📤 معالجة إرسال التقييم
// ============================================
async function handleSubmitReview() {
    // منع الإرسال المتكرر
    if (isSubmitting) return;
    
    // التحقق النهائي من صحة البيانات
    if (currentRating < CONFIG.MIN_RATING) {
        showToast('⚠ الرجاء اختيار تقييم بالنجوم', 'warning');
        return;
    }
    
    const submitBtn = document.getElementById('submitReviewBtn');
    if (!submitBtn) return;
    
    // حالة التحميل
    isSubmitting = true;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جاري الإرسال...</span>';
    
    try {
        // جمع بيانات التقييم
        const reviewData = collectReviewData();
        
        // إرسال إلى Firebase
        await saveReviewToFirebase(reviewData);
        
        // عرض شاشة النجاح
        showSuccessScreen();
        
        // تأثير اهتزاز (لأجهزة الموبايل)
        triggerHapticFeedback([100, 50, 100, 50, 200]);
        
    } catch (error) {
        console.error('❌ خطأ في إرسال التقييم:', error);
        showToast('❌ حدث خطأ، يرجى المحاولة لاحقاً', 'error');
        
        // استعادة زر الإرسال
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
        
    } finally {
        isSubmitting = false;
    }
}

/**
 * جمع بيانات التقييم من النموذج
 */
function collectReviewData() {
    const reviewType = document.querySelector('input[name="reviewType"]:checked')?.value || 'restaurant';
    const message = document.getElementById('reviewMessage')?.value.trim() || '';
    
    return {
        rating: currentRating,
        type: reviewType,
        message: message,
        image: selectedImage || null,
        orderNumber: orderNumber || null,
        metadata: {
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ar-EG'),
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            userAgent: navigator.userAgent,
            language: navigator.language
        },
        status: {
            approved: false,
            reviewed: false
        }
    };
}

/**
 * حفظ التقييم في Firebase
 */
async function saveReviewToFirebase(reviewData) {
    if (!firebaseDB) {
        throw new Error('Firebase غير مهيأ');
    }
    
    const reviewsRef = firebaseDB.ref('reviews');
    const newReviewRef = reviewsRef.push();
    
    await newReviewRef.set(reviewData);
    
    console.log('✅ تم حفظ التقييم:', newReviewRef.key);
    return newReviewRef.key;
}

/**
 * عرض شاشة النجاح
 */
function showSuccessScreen() {
    // إخفاء نموذج التقييم
    const formSection = document.getElementById('reviewFormSection');
    const successSection = document.getElementById('successSection');
    
    if (formSection) formSection.classList.remove('active');
    if (successSection) {
        successSection.classList.add('active');
        
        // تأثير دخول
        successSection.style.animation = 'cardSlideUp 0.5s ease-out';
    }
    
    // تحديث عنوان الصفحة
    document.title = 'تعلولة - شكراً لتقييمك!';
}

// ============================================
// 🔙 التنقل والعودة
// ============================================

/**
 * العودة للمنيو الإلكتروني
 */
function navigateToMenu() {
    // حفظ وقت العودة للتتبع
    sessionStorage.setItem('review_completed', 'true');
    
    // الانتقال للمنيو
    window.location.href = '../index.html';
}

/**
 * تحديث زر تتبع الطلب في شاشة النجاح
 */
function updateTrackingButton() {
    const trackingBtn = document.getElementById('goToTrackingBtn');
    if (!trackingBtn) return;
    
    if (orderNumber) {
        trackingBtn.style.display = 'flex';
        trackingBtn.href = `order-tracking.html?order=${orderNumber}`;
    } else {
        trackingBtn.style.display = 'none';
    }
}

// ============================================
// 🔔 نظام الإشعارات (Toast)
// ============================================

/**
 * عرض إشعار منبثق
 */
function showToast(message, type = 'info') {
    // إزالة الإشعارات القديمة
    document.querySelectorAll('.review-toast').forEach(toast => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
    
    // إنشاء إشعار جديد
    const toast = document.createElement('div');
    toast.className = `review-toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // إزالة تلقائية بعد مدة
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, CONFIG.TOAST_DURATION);
}

// ============================================
// 📱 تأثيرات اللمس والاهتزاز
// ============================================

/**
 * تشغيل اهتزاز للجهاز (إذا مدعوم)
 */
function triggerHapticFeedback(pattern = [10, 30, 10]) {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // تجاهل الأخطاء في حال عدم الدعم
        }
    }
}

// ============================================
// 🧹 دوال مساعدة
// ============================================

/**
 * إعادة تعيين نموذج التقييم
 */
function resetReviewForm() {
    currentRating = 0;
    selectedImage = null;
    
    // إعادة تعيين النجوم
    highlightStars(0);
    updateFeedback(0);
    
    // إعادة تعيين الحقول
    const messageEl = document.getElementById('reviewMessage');
    if (messageEl) messageEl.value = '';
    
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = '0';
    
    // إزالة الصورة
    const preview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('reviewImage');
    if (preview) preview.classList.remove('active');
    if (fileInput) fileInput.value = '';
    
    updateSubmitButtonState();
}

/**
 * تنسيق التاريخ للعرض
 */
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// 📤 تصدير الدوال العامة
// ============================================
window.TaloolaReview = {
    setRating,
    resetForm: resetReviewForm,
    showToast,
    navigateToMenu
};

// للتوافق مع الكود القديم
window.resetReviewForm = resetReviewForm;
window.setRating = setRating;
