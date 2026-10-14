// ============================================
// 📦 نظام تتبع حالة الطلب - ملف مستقل
// ============================================

// متغيرات العداد
let countdownInterval = null;
let reviewShown = false; // لمنع عرض التقييم أكثر من مرة

// ============================================
// ⏱️ بدء العداد التنازلي
// ============================================
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    const startTime = parseInt(safeLocalStorageGet(PROCESSING_KEY, '0'));
    const timerElement = document.getElementById('processingTimer');
    
    if (!startTime) return;
    
    // إعادة تعيين متغير عرض التقييم
    reviewShown = false;
    
    countdownInterval = setInterval(() => {
        const now = Date.now();
        const remaining = processingDurationMs - (now - startTime);
        
        if (remaining <= 0) {
            // انتهى الوقت
            clearInterval(countdownInterval);
            
            if (timerElement) timerElement.textContent = "00:00";
            
            safeLocalStorageRemove(PROCESSING_KEY);
            
            // إخفاء نافذة المعالجة
            const modal = document.getElementById('processingModal');
            if (modal) modal.style.display = 'none';
            
            enableOrdering();
            
            showNotification('✅ تم تحضير طلبك! يمكنك الآن تقييم تجربتك.');
            
            // عرض نافذة التقييم تلقائياً (مرة واحدة)
            if (!reviewShown) {
                reviewShown = true;
                setTimeout(() => {
                    if (typeof openReviewModal === 'function') {
                        openReviewModal();
                    }
                }, 1000);
            }
        } else {
            // تحديث العرض
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            if (timerElement) {
                timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }
    }, 1000);
}

// ============================================
// 📦 إظهار نافذة المعالجة
// ============================================
function showProcessingWindow() {
    const modal = document.getElementById('processingModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    if (!safeLocalStorageGet(PROCESSING_KEY)) {
        safeLocalStorageSet(PROCESSING_KEY, Date.now().toString());
    }
    
    disableOrdering();
    startCountdown();
}

// ============================================
// ❌ إغلاق نافذة المعالجة
// ============================================
function closeProcessingWindow() {
    const modal = document.getElementById('processingModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    safeLocalStorageRemove(PROCESSING_KEY);
}

// ============================================
// 🚫 تعطيل إمكانية الطلب
// ============================================
function disableOrdering() {
    const cartBtn = document.getElementById('floatingCartBtn');
    if (cartBtn) {
        cartBtn.style.pointerEvents = 'none';
        cartBtn.style.opacity = '0.5';
        cartBtn.title = 'الحساب معلق مؤقتاً';
    }
}

// ============================================
// ✅ تفعيل إمكانية الطلب
// ============================================
function enableOrdering() {
    const cartBtn = document.getElementById('floatingCartBtn');
    if (cartBtn) {
        cartBtn.style.pointerEvents = '';
        cartBtn.style.opacity = '';
        cartBtn.title = 'عرض السلة وتأكيد الطلب';
    }
}

// ============================================
// 📤 تصدير الدوال
// ============================================
window.startCountdown = startCountdown;
window.showProcessingWindow = showProcessingWindow;
window.closeProcessingWindow = closeProcessingWindow;
window.disableOrdering = disableOrdering;
window.enableOrdering = enableOrdering;
