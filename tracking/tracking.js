// ============================================
// 🚚 نظام تتبع الطلب - النسخة المحسّنة (User-Centric)
// ============================================

// 🔑 الثوابت
const TRACKING_STORAGE_KEY = 'taloola_tracking_phone';
const AUTO_REFRESH_INTERVAL = 5000;
const REVIEW_PAGE_PATH = '../review/review.html';
const AUTO_REDIRECT_DELAY = 4000;

// 📦 المتغيرات العامة
let trackingInterval = null;
let currentOrderId = null; // canonical key: loading/items/{key} / loading/archive/{key}
let currentOrderPhone = null;
let firebaseDB = null;
let countdownTimer = null;
let hasRedirectedToReview = false;
let reviewRedirectScheduled = false;
let lastKnownStatus = null;
let orderStatusListeners = [];
let lastAppliedStatusVersion = -1;
let lastAppliedSourcePriority = -1;

// ⏱️ متغيرات مدة التوصيل الديناميكية
let deliveryAreasData = []; // لتخزين بيانات المناطق من Firebase
const DEFAULT_DELIVERY_MINUTES = 45; // قيمة افتراضية في حال لم يتم العثور على المنطقة

// 🎯 خريطة حالات الطلب
const ORDER_STATUS_MAP = {
    'pending':    { step: 1, label: 'تم الاستلام', icon: 'fa-receipt', class: 'pending', progress: 0, color: '#ffc107' },
    'preparing':  { step: 2, label: 'قيد التحضير', icon: 'fa-utensils', class: 'preparing', progress: 33, color: '#17a2b8' },
    'in_transit': { step: 3, label: 'في الطريق', icon: 'fa-motorcycle', class: 'ready', progress: 66, color: '#28a745' },
    'ready':      { step: 3, label: 'في الطريق', icon: 'fa-motorcycle', class: 'ready', progress: 66, color: '#28a745' }, // legacy alias
    'delivered':  { step: 4, label: 'تم التوصيل ✅', icon: 'fa-home', class: 'delivered', progress: 100, color: '#28a745' },
    'completed':  { step: 4, label: 'تم التوصيل ✅', icon: 'fa-home', class: 'delivered', progress: 100, color: '#28a745' }, // legacy alias
    'returned':   { step: 0, label: 'تم إرجاع الطلب', icon: 'fa-undo', class: 'returned', progress: 0, color: '#ea580c' },
    'cancelled':  { step: 0, label: 'تم إلغاء الطلب ❌', icon: 'fa-times-circle', class: 'cancelled', progress: 0, color: '#dc3545' }
};

// ============================================
// 🚀 التهيئة عند التحميل
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initFirebase();
        await fetchDeliveryAreasData(); // ✅ جلب بيانات المناطق أولاً
        setupEventListeners();
        await startAutoTracking();
    } catch (error) {
        console.error('❌ خطأ في التهيئة:', error);
        showSection('trackNotFoundSection');
        showNotification('❌ حدث خطأ، يرجى إعادة تحميل الصفحة', 'error');
    }
});


// ============================================
// 🔥 تهيئة Firebase
// ============================================
async function initFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase === 'undefined') {
            setTimeout(initFirebase, 100);
            return;
        }
        const config = {
            apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
            authDomain: "talola-food.firebaseapp.com",
            databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
            projectId: "talola-food",
            messagingSenderId: "440585170470",
            appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
        };
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        firebaseDB = firebase.database();
        console.log('✅ Firebase initialized for tracking');
        resolve();
    });
}

// ============================================
// 🎯 إعداد معالجات الأحداث
// ============================================
function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshTrackingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshTracking);
    }
    
    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', function(e) {
            if (this.classList.contains('disabled')) {
                e.preventDefault();
                showNotification('⏳ سيكون التقييم متاحاً بعد اكتمال التوصيل', 'warning');
                return;
            }
            if (currentOrderId) {
                sessionStorage.setItem('review_order_data', JSON.stringify({
                    orderNumber: document.getElementById('displayOrderNumber')?.textContent,
                    total: document.getElementById('orderTotalAmount')?.textContent,
                    status: document.getElementById('orderStatusBadge')?.dataset.status,
                    orderId: currentOrderId,
                    phone: currentOrderPhone
                }));
            }
            window.location.href = REVIEW_PAGE_PATH;
        });
    }
    updateWhatsappLink();
}

// ============================================
// 🔍 بدء التتبع: loading أولاً مع توافق رجعي آمن
// ============================================
async function startAutoTracking() {
    showSection('trackLoadingSection');

    try {
        let order = null;
        let source = '';
        const urlParams = new URLSearchParams(window.location.search);
        const orderParam = urlParams.get('order');
        const savedPhone = normalizePhone(localStorage.getItem(TRACKING_STORAGE_KEY) || '');

        if (orderParam) {
            order = await findOrderInLoading(orderParam, savedPhone);
            if (order) source = order.source;
            // Support a canonical Firebase key supplied directly in the URL.
            if (!order) {
                order = await findOrderByCanonicalId(orderParam, savedPhone);
                if (order) source = order.source;
            }
        }

        if (!order && savedPhone) {
            if (isLoadingFeatureEnabledForTracking()) {
                order = await findLatestOrderInLoading(savedPhone);
                if (order) source = order.source;
            } else {
                // Kill-switch rollback only: when loading is explicitly disabled, use the legacy main list.
                order = await findLatestOrderInMainListForKillSwitch(savedPhone);
                if (order) source = 'main';
            }
        }

        if (!order) {
            const savedOrder = sessionStorage.getItem('current_tracking_order');
            if (savedOrder) {
                try {
                    const parsed = JSON.parse(savedOrder);
                    const phone = normalizePhone(parsed.phone || savedPhone);
                    if (parsed.orderNumber) {
                        order = await findOrderInLoading(parsed.orderNumber, phone);
                    }
                    if (!order && parsed.id) {
                        order = await findOrderByCanonicalId(parsed.id, phone);
                    }
                    if (order) source = order.source || 'session';
                } catch (error) {
                    console.warn('⚠️ تعذر قراءة بيانات جلسة التتبع السابقة:', error);
                }
            }
        }

        if (order) {
            currentOrderId = order.orderId || order.id;
            currentOrderPhone = normalizePhone(order.phone || savedPhone || '');
            order = { ...order, id: currentOrderId, orderId: currentOrderId, phone: currentOrderPhone };
            console.log(`✅ تم العثور على الطلب عبر المسار الموحد: ${source || order.source || 'unknown'}`);

            lastAppliedStatusVersion = -1;
            lastAppliedSourcePriority = -1;
            applyTrackedSnapshot(order, source || order.source || 'loading');

            sessionStorage.setItem('current_tracking_order', JSON.stringify({
                id: currentOrderId,
                phone: currentOrderPhone,
                orderNumber: order.orderNumber,
                status: normalizeCustomerStatus(order.status, order.stage)
            }));

            showSection('trackResultSection');
            startRealtimeTracking(currentOrderId, currentOrderPhone);
            updateWhatsappLink(order.orderNumber);
            showNotification('✅ تم تحميل حالة طلبك بنجاح', 'success');
        } else {
            console.warn('⚠️ لم يتم العثور على الطلب في loading/items أو loading/archive');
            showSection('trackNotFoundSection');
            showNotification('⚠ لم يتم العثور على طلب لهذا الرقم', 'warning');
        }
    } catch (error) {
        console.error('❌ خطأ في التتبع:', error);
        showSection('trackNotFoundSection');
        showNotification('❌ حدث خطأ أثناء تحميل الطلب', 'error');
    }
}

function isLoadingFeatureEnabledForTracking() {
    try {
        const value = localStorage.getItem('taloola_enable_loading');
        return value === null ? true : value === 'true';
    } catch (_) {
        return true;
    }
}

function parseOrderNumber(orderNumber) {
    const parsed = parseInt(String(orderNumber || '').replace('#', '').replace(/\s/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCustomerStatus(status, stage) {
    const value = String(status || '').trim().toLowerCase();
    const stageValue = String(stage || '').trim().toLowerCase();

    // Final states always win; then translate old aliases and canonical stages.
    if (value === 'cancelled' || stageValue === 'cancelled') return 'cancelled';
    if (value === 'returned' || stageValue === 'returned') return 'returned';
    if (['delivered', 'completed'].includes(value) || stageValue === 'completed') return 'delivered';
    if (['in_transit', 'ready'].includes(value) || stageValue === 'in_transit') return 'in_transit';
    if (value === 'preparing' || value === 'dispatched' || stageValue === 'dispatched') return 'preparing';
    if (value === 'pending') return 'pending';
    return 'pending';
}

function createTrackingOrder(record, firebaseKey, source, phone) {
    if (!record || typeof record !== 'object') return null;
    const canonicalId = String(record.orderId || firebaseKey || '');
    if (!canonicalId) return null;
    return {
        ...record,
        id: canonicalId,
        orderId: canonicalId,
        phone: normalizePhone(record.phone || phone || ''),
        source
    };
}

async function readOrderNumberFromPath(path, orderNumber) {
    if (!firebaseDB) return null;
    const numericOrderNumber = parseOrderNumber(orderNumber);
    if (numericOrderNumber === null) return null;
    const snapshot = await firebaseDB.ref(path)
        .orderByChild('orderNumber')
        .equalTo(numericOrderNumber)
        .once('value');
    return snapshot.val() || null;
}

async function findOrderInLoading(orderNumber, phone) {
    if (!isLoadingFeatureEnabledForTracking() || !firebaseDB || parseOrderNumber(orderNumber) === null) return null;
    const normalizedPhone = normalizePhone(phone || '');
    for (const path of ['loading/items', 'loading/archive']) {
        try {
            const records = await readOrderNumberFromPath(path, orderNumber);
            if (!records) continue;
            const matches = Object.entries(records).filter(([, value]) => {
                const recordPhone = normalizePhone(value?.phone || '');
                return !normalizedPhone || !recordPhone || recordPhone === normalizedPhone;
            });
            if (!matches.length) continue;
            matches.sort((a, b) => Number(b[1]?.statusUpdatedAt || b[1]?.createdAt || b[1]?.timestamp || 0) -
                Number(a[1]?.statusUpdatedAt || a[1]?.createdAt || a[1]?.timestamp || 0));
            const [key, value] = matches[0];
            return createTrackingOrder(value, key, path.endsWith('/archive') ? 'archive' : 'loading', normalizedPhone);
        } catch (error) {
            console.warn(`⚠️ [LOADING] تعذر البحث في ${path}; سيُستخدم المسار الاحتياطي:`, error);
        }
    }
    return null;
}

async function findLatestOrderInLoading(phone) {
    if (!isLoadingFeatureEnabledForTracking() || !firebaseDB || !phone) return null;
    const normalizedPhone = normalizePhone(phone);
    const candidates = [];
    for (const path of ['loading/items', 'loading/archive']) {
        try {
            const snapshot = await firebaseDB.ref(path)
                .orderByChild('phone').equalTo(normalizedPhone).once('value');
            const records = snapshot.val();
            if (!records) continue;
            for (const [key, value] of Object.entries(records)) {
                if (normalizePhone(value?.phone || '') !== normalizedPhone) continue;
                const result = createTrackingOrder(value, key, path.endsWith('/archive') ? 'archive' : 'loading', normalizedPhone);
                if (result) candidates.push(result);
            }
        } catch (error) {
            console.warn(`⚠️ [LOADING] تعذر جلب أحدث طلب من ${path}:`, error);
        }
    }
    return chooseNewestOrderCandidate(candidates);
}

function chooseNewestOrderCandidate(candidates) {
    if (!Array.isArray(candidates) || !candidates.length) return null;
    const tiePriority = { legacy: 4, main: 3, loading: 2, archive: 1 };
    return [...candidates].sort((a, b) => {
        const aTime = Number(a.createdAt || a.timestamp || 0);
        const bTime = Number(b.createdAt || b.timestamp || 0);
        if (aTime !== bTime) return bTime - aTime;
        return (tiePriority[b.source] || 0) - (tiePriority[a.source] || 0);
    })[0];
}

async function findOrderByCanonicalId(orderId, phone) {
    if (!firebaseDB || !orderId) return null;
    const normalizedPhone = normalizePhone(phone || '');
    const paths = isLoadingFeatureEnabledForTracking()
        ? ['loading/items', 'loading/archive']
        : ['orders/list'];
    for (const path of paths) {
        try {
            const snapshot = await firebaseDB.ref(`${path}/${orderId}`).once('value');
            const value = snapshot.val();
            if (value && (!normalizedPhone || !value.phone || normalizePhone(value.phone) === normalizedPhone)) {
                return createTrackingOrder(value, orderId, path === 'orders/list' ? 'main' : (path.endsWith('/archive') ? 'archive' : 'loading'), normalizedPhone);
            }
        } catch (error) {
            console.warn(`⚠️ تعذر قراءة ${path}/${orderId}:`, error);
        }
    }
    return null;
}

// Kill-switch-only lookup: keep rollback usable without reintroducing users/{phone}/orders reads.
async function findLatestOrderInMainListForKillSwitch(phone) {
    if (!firebaseDB || !phone) return null;
    const normalizedPhone = normalizePhone(phone);
    try {
        const snapshot = await firebaseDB.ref('orders/list')
            .orderByChild('phone').equalTo(normalizedPhone).once('value');
        const records = snapshot.val();
        if (!records) return null;
        const candidates = Object.entries(records)
            .sort((a, b) => Number(b[1]?.timestamp || 0) - Number(a[1]?.timestamp || 0));
        if (!candidates.length) return null;
        const [key, record] = candidates[0];
        return createTrackingOrder(record, key, 'main', normalizedPhone);
    } catch (error) {
        console.warn('⚠️ تعذر مسار التراجع إلى orders/list:', error);
        return null;
    }
}

function normalizePhone(phone) {
    if (!phone) return '';
    let p = String(phone).replace(/[^0-9]/g, '');
    if (p.startsWith('964')) p = '0' + p.substring(3);
    if (p.length === 9 && p.startsWith('7')) p = '0' + p;
    return p;
}

// ============================================
// ⏱️ جلب بيانات مناطق التوصيل من Firebase
// ============================================
async function fetchDeliveryAreasData() {
    try {
        const snapshot = await firebaseDB.ref('delivery_areas').once('value');
        const data = snapshot.val();
        if (data) {
            deliveryAreasData = Object.values(data);
            console.log(`✅ تم جلب بيانات ${deliveryAreasData.length} منطقة للتوصيل بنجاح`);
        }
    } catch (error) {
        console.error('❌ خطأ في جلب مناطق التوصيل من Firebase:', error);
    }
}

// ============================================
// 🔍 دالة مساعدة للبحث عن مدة المنطقة المحددة
// ============================================
function getEstimatedTimeForArea(areaName) {
    if (!areaName || !deliveryAreasData.length) {
        return DEFAULT_DELIVERY_MINUTES;
    }
    
    // البحث عن المنطقة التي يطابق اسمها اسم المنطقة في الطلب
    const targetArea = deliveryAreasData.find(area => area.name.trim() === areaName.trim());
    
    if (targetArea && targetArea.estimatedTime) {
        console.log(`⏱️ مدة التوصيل المحددة لمنطقة "${areaName}" هي ${targetArea.estimatedTime} دقيقة`);
        return parseInt(targetArea.estimatedTime);
    }
    
    // إذا لم يتم العثور على تطابق تام، نعود للقيمة الافتراضية
    console.warn(`⚠️ لم يتم العثور على مدة مخصصة لمنطقة "${areaName}"، سيتم استخدام الافتراضي (${DEFAULT_DELIVERY_MINUTES} دقيقة)`);
    return DEFAULT_DELIVERY_MINUTES;
}
// ============================================
// 📊 عرض تفاصيل الطلب
// ============================================
function displayOrderDetails(order) {
    if (!order) return;
    
    const orderNum = order.orderNumber || order.id?.substring(0, 6).toUpperCase() || '000';
    setText('displayOrderNumber', `#${orderNum}`);
    setText('customerName', order.customerName || 'زبون');
    
    const phone = order.phone || '';
    const phoneEl = document.getElementById('customerPhone');
    if (phoneEl) {
        phoneEl.textContent = formatPhone(phone) || 'غير متوفر';
        phoneEl.href = phone ? `tel:${phone}` : '#';
    }
    
    setText('deliveryAddress', [order.area, order.detailedAddress].filter(Boolean).join(' - ') || 'غير محدد');
    
    if (order.timestamp) {
        const date = new Date(order.timestamp);
        setText('orderTime', date.toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        }));
    }
    
    const status = normalizeCustomerStatus(order.status, order.stage);
    const badge = document.getElementById('orderStatusBadge');
    if (badge) badge.dataset.status = status;
    
    updateStatusBadge(status);
    updateProgressTracker(status);
    renderOrderItems(order.items);
    setText('orderTotalAmount', `${(order.total || 0).toLocaleString('ar-EG')} د.ع`);
    
    updateWhatsappLink(order.orderNumber);
    updateReviewButton(status);
    
    if (['pending', 'preparing', 'in_transit'].includes(status)) {
        startCountdown(order.timestamp, order.area); // ✅ تمرير اسم المنطقة هنا
    } else {
        hideCountdown();
    }
    
    handleTerminalStatus(status, order);
    document.title = `${ORDER_STATUS_MAP[status]?.label || 'تتبع الطلب'} - تعلولة`;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
}

function renderOrderItems(items) {
    const list = document.getElementById('orderItemsList');
    if (!list) return;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        list.innerHTML = '<li class="item-row"><span>لا توجد أصناف</span></li>';
        return;
    }
    
    list.innerHTML = items.map(item => `
        <li class="item-row">
            <span class="item-name">${escapeHtml(item.name || 'صنف')}</span>
            <span class="item-qty">×${item.quantity || 1}</span>
            <span class="item-price">${((item.price || 0) * (item.quantity || 1)).toLocaleString('ar-EG')} د.ع</span>
        </li>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// 🎨 تحديث شارة الحالة وشريط التقدم
// ============================================
function updateStatusBadge(status) {
    const badge = document.getElementById('orderStatusBadge');
    if (!badge) return;
    
    const info = ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP['pending'];
    
    if (lastKnownStatus !== status) {
        badge.classList.add('status-change-animation');
        setTimeout(() => badge.classList.remove('status-change-animation'), 500);
        lastKnownStatus = status;
    }
    
    badge.className = `status-badge ${info.class}`;
    badge.innerHTML = `<i class="fas ${info.icon}"></i> <span>${info.label}</span>`;
}

function updateProgressTracker(status) {
    const steps = document.querySelectorAll('.progress-step');
    const info = ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP['pending'];
    const currentStep = info.step;
    const progressPercent = info.progress;
    
    const tracker = document.querySelector('.progress-tracker');
    if (tracker) {
        tracker.style.setProperty('--progress-width', `${progressPercent}%`);
        tracker.setAttribute('aria-valuenow', progressPercent);
        
        if (progressPercent === 100 && !tracker.classList.contains('completed')) {
            tracker.classList.add('completed');
            tracker.animate([
                { boxShadow: '0 0 0 0 rgba(40, 167, 69, 0.4)' },
                { boxShadow: '0 0 20px 5px rgba(40, 167, 69, 0.6)' },
                { boxShadow: '0 0 0 0 rgba(40, 167, 69, 0)' }
            ], { duration: 1000, iterations: 1 });
        }
    }
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed', 'cancelled');
        
        if (status === 'cancelled') {
            if (stepNum === 1) step.classList.add('completed');
            else step.classList.add('cancelled');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep && currentStep > 0) {
            step.classList.add('active');
        }
    });
}

function handleTerminalStatus(status, order = {}) {
    const cancelledSection = document.getElementById('cancelledInfo');
    const returnedSection = document.getElementById('returnedInfo');
    const countdownContainer = document.getElementById('countdownContainer');
    const actionButtons = document.querySelector('.action-buttons');
    const cancelledText = document.getElementById('cancelledReasonText');
    const returnedText = document.getElementById('returnedReasonText');

    const isCancelled = status === 'cancelled';
    const isReturned = status === 'returned';
    if (cancelledSection) cancelledSection.style.display = isCancelled ? 'block' : 'none';
    if (returnedSection) returnedSection.style.display = isReturned ? 'block' : 'none';
    if (countdownContainer && (isCancelled || isReturned || status === 'delivered')) countdownContainer.style.display = 'none';
    if (actionButtons) actionButtons.style.display = (isCancelled || isReturned) ? 'none' : 'flex';
    if (cancelledText) cancelledText.textContent = order.cancelReason || 'عذراً، تم إلغاء طلبك. يرجى التواصل مع الدعم للمزيد من التفاصيل.';
    if (returnedText) returnedText.textContent = order.returnReason || 'تم إرجاع الطلب إلى المطعم. يرجى التواصل مع الدعم لمعرفة التفاصيل.';
    if (isCancelled || isReturned) updateProgressTracker(status);
}

// ============================================
// ⏱️ العداد التنازلي (مُحدّث ليعتمد على مدة المنطقة المحددة)
// ============================================
function startCountdown(orderTimestamp, orderArea) {
    const container = document.getElementById('countdownContainer');
    if (!container) return;
    
    container.style.display = 'block';
    
    // ✅ جلب المدة الخاصة بالمنطقة المختارة
    const deliveryMinutes = getEstimatedTimeForArea(orderArea);
    const durationInMs = deliveryMinutes * 60 * 1000;
    const deliveryTime = (orderTimestamp || Date.now()) + durationInMs;
    
    if (countdownTimer) clearInterval(countdownTimer);
    updateCountdownDisplay(deliveryTime);
    
    countdownTimer = setInterval(() => updateCountdownDisplay(deliveryTime), 1000);
}

function updateCountdownDisplay(deliveryTime) {
    const now = Date.now();
    const remaining = deliveryTime - now;
    
    if (remaining <= 0) {
        if (countdownTimer) clearInterval(countdownTimer);
        const timerEl = document.querySelector('.countdown-timer');
        if (timerEl) {
            timerEl.innerHTML = '<span style="color: var(--success-green); font-size: 1.3rem;">🎉 وصل قريباً!</span>';
        }
        return;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    setText('countdownHours', String(hours).padStart(2, '0'));
    setText('countdownMinutes', String(minutes).padStart(2, '0'));
    setText('countdownSeconds', String(seconds).padStart(2, '0'));
}

function hideCountdown() {
    const container = document.getElementById('countdownContainer');
    if (container) container.style.display = 'none';
    if (countdownTimer) { 
        clearInterval(countdownTimer); 
        countdownTimer = null; 
    }
}

// ============================================
// ✅ تطبيق الحالة الأحدث بغض النظر عن مصدر القراءة
// ============================================
function sourcePriority(source) {
    // loading/items is authoritative while enabled; archive is the terminal fallback.
    return ({ main: 3, loading: 2, archive: 1, session: 0, bootstrap: 0 })[source] ?? 0;
}

function applyTrackedSnapshot(record, source, firebaseKey = null) {
    if (!record) return false;
    const normalizedRecord = {
        ...record,
        id: currentOrderId || record.orderId || record.id || firebaseKey,
        orderId: currentOrderId || record.orderId || record.id || firebaseKey,
        phone: currentOrderPhone || normalizePhone(record.phone || ''),
        status: normalizeCustomerStatus(record.status, record.stage),
        source
    };
    const version = Number(record.statusUpdatedAt || record.updatedAt || record.timestamp || record.createdAt || 0);
    const priority = sourcePriority(source);
    if (version < lastAppliedStatusVersion || (version === lastAppliedStatusVersion && priority < lastAppliedSourcePriority)) {
        return false;
    }

    lastAppliedStatusVersion = version;
    lastAppliedSourcePriority = priority;
    displayOrderDetails(normalizedRecord);
    updateReviewButton(normalizedRecord.status);
    handleOrderStatusChange(normalizedRecord.status, normalizedRecord.statusUpdatedAt || normalizedRecord.timestamp);
    return true;
}

function addTrackingListener(ref, source, canonicalId) {
    if (!ref) return;
    const callback = snapshot => {
        const record = snapshot.val();
        if (record) {
            applyTrackedSnapshot(record, source, canonicalId);
            return;
        }
        // Stage 3 archives the final record and then removes loading/items/{id}.
        if (source === 'loading' && firebaseDB && canonicalId) {
            firebaseDB.ref(`loading/archive/${canonicalId}`).once('value')
                .then(archived => {
                    if (archived.exists()) applyTrackedSnapshot(archived.val(), 'archive', canonicalId);
                })
                .catch(error => console.warn('⚠️ تعذر فحص أرشيف الطلب:', error));
        }
    };
    const errorCallback = error => {
        console.warn(`⚠️ Realtime listener (${source}) failed:`, error);
        if (!trackingInterval) startAutoRefreshForCurrentOrder();
    };
    ref.on('value', callback, errorCallback);
    orderStatusListeners.push({ ref, callback });
}

function stopTrackingListeners() {
    for (const listener of orderStatusListeners) {
        try { listener.ref.off('value', listener.callback); } catch (_) {}
    }
    orderStatusListeners = [];
}

function startRealtimeTracking(orderId, phone) {
    stopTrackingListeners();
    if (!firebaseDB || !orderId) return;

    if (isLoadingFeatureEnabledForTracking()) {
        addTrackingListener(firebaseDB.ref(`loading/items/${orderId}`), 'loading', orderId);
        addTrackingListener(firebaseDB.ref(`loading/archive/${orderId}`), 'archive', orderId);
    } else {
        // Feature-flag rollback: keep canonical-key updates flowing from the previous main list.
        addTrackingListener(firebaseDB.ref(`orders/list/${orderId}`), 'main', orderId);
    }
    console.log(`🔄 تتبع الطلب ${orderId} عبر ${isLoadingFeatureEnabledForTracking() ? 'loading/items و loading/archive' : 'orders/list (kill switch)'}`);
}

function startAutoRefreshForCurrentOrder() {
    if (trackingInterval) clearInterval(trackingInterval);
    trackingInterval = setInterval(async () => {
        if (!currentOrderId || !firebaseDB) return;
        const reads = isLoadingFeatureEnabledForTracking()
            ? [['loading', `loading/items/${currentOrderId}`], ['archive', `loading/archive/${currentOrderId}`]]
            : [['main', `orders/list/${currentOrderId}`]];
        await Promise.all(reads.map(async ([source, path]) => {
            try {
                const snapshot = await firebaseDB.ref(path).once('value');
                if (snapshot.exists()) applyTrackedSnapshot(snapshot.val(), source, currentOrderId);
            } catch (error) {
                console.warn(`⚠️ فشل التحديث الدوري من ${path}:`, error);
            }
        }));
    }, AUTO_REFRESH_INTERVAL);
}

function refreshTracking() {
    if (!currentOrderId) {
        showNotification('⚠ لا يوجد طلب حالي للتحديث', 'warning');
        return;
    }

    const refreshBtn = document.getElementById('refreshTrackingBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
    }
    showNotification('🔄 جاري تحديث الحالة...', 'info');

    const reads = isLoadingFeatureEnabledForTracking()
        ? [['loading', `loading/items/${currentOrderId}`], ['archive', `loading/archive/${currentOrderId}`]]
        : [['main', `orders/list/${currentOrderId}`]];

    Promise.all(reads.map(async ([source, path]) => {
        try {
            const snapshot = await firebaseDB.ref(path).once('value');
            if (snapshot.exists()) return applyTrackedSnapshot(snapshot.val(), source, currentOrderId);
        } catch (error) {
            console.warn(`⚠️ فشل التحديث اليدوي من ${path}:`, error);
        }
        return false;
    })).then(results => {
        if (results.some(Boolean)) showNotification('✅ تم تحديث الحالة', 'success');
        else showNotification('⚠ لم يتم العثور على سجل قابل للتحديث', 'warning');
    }).finally(() => {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث الحالة';
        }
    });
}

// ============================================
// ✅ التعامل مع تغيير حالة الطلب
// ============================================
function handleOrderStatusChange(status, timestamp) {
    const normalizedStatus = normalizeCustomerStatus(status);
    const isCompleted = normalizedStatus === 'delivered';
    const isCancelled = normalizedStatus === 'cancelled';
    const isReturned = normalizedStatus === 'returned';

    if (isCancelled || isReturned) {
        stopAllTimers();
        showNotification(isCancelled ? '⚠️ تم إلغاء هذا الطلب' : '↩️ تم إرجاع هذا الطلب', isCancelled ? 'error' : 'warning');
        const timerEl = document.querySelector('.countdown-timer');
        if (timerEl) {
            timerEl.innerHTML = isCancelled
                ? '<span style="color: var(--danger-red);">❌ ملغي</span>'
                : '<span style="color: #ea580c;">↩️ مرتجع</span>';
        }
        return;
    }

    if (isCompleted && !hasRedirectedToReview && !reviewRedirectScheduled) {
        reviewRedirectScheduled = true;
        stopAllTimers();
        const timerEl = document.querySelector('.countdown-timer');
        if (timerEl) timerEl.innerHTML = '<span style="color: var(--success-green); font-size: 1.3rem;">✅ تم التوصيل!</span>';
        updateReviewButton(normalizedStatus);
        showNotification('🎉 تم تسليم طلبك! يمكنك الآن تقييم تجربتك', 'success');
        setTimeout(() => {
            if (!hasRedirectedToReview) {
                hasRedirectedToReview = true;
                sessionStorage.setItem('review_order_data', JSON.stringify({
                    orderNumber: document.getElementById('displayOrderNumber')?.textContent,
                    total: document.getElementById('orderTotalAmount')?.textContent,
                    status: normalizedStatus,
                    orderId: currentOrderId,
                    phone: currentOrderPhone,
                    completedAt: new Date().toISOString()
                }));
                window.location.href = REVIEW_PAGE_PATH;
            }
        }, AUTO_REDIRECT_DELAY);
        document.title = '✅ تم التوصيل - تعلولة';
    }
}

function stopAllTimers() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    stopTrackingListeners();
}

// ============================================
// ⭐ إدارة زر التقييم
// ============================================
function updateReviewButton(status) {
    const reviewBtn = document.getElementById('reviewBtn');
    if (!reviewBtn) return;
    
    const isCompleted = ['completed', 'delivered'].includes(status);
    
    reviewBtn.style.display = 'flex';
    
    if (isCompleted) {
        reviewBtn.classList.remove('disabled');
        reviewBtn.style.pointerEvents = 'auto';
        reviewBtn.style.opacity = '1';
        reviewBtn.title = '🌟 قيّم تجربتك الآن وساعدنا في التحسين';
        reviewBtn.innerHTML = '<i class="fas fa-star"></i> <span>قيّم تجربتك 🌟</span>';
        
        reviewBtn.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], { duration: 500, iterations: 2 });
    } else {
        reviewBtn.classList.add('disabled');
        reviewBtn.style.pointerEvents = 'none';
        reviewBtn.style.opacity = '0.6';
        reviewBtn.title = 'سيتم تفعيل زر التقييم بعد وصول الطلب وإكماله ✅';
        reviewBtn.innerHTML = '<i class="fas fa-star"></i> <span>التقييم متاح قريباً ⏳</span>';
    }
}

// ============================================
// 🔗 تحديث رابط واتساب
// ============================================
function updateWhatsappLink(orderNumber) {
    const btn = document.getElementById('whatsappContactBtn');
    if (!btn) return;
    
    const orderNum = orderNumber || sessionStorage.getItem('lastOrderNumber') || '000';
    btn.href = `https://wa.me/9647755666073?text=${encodeURIComponent(`استفسار عن طلب #${orderNum}`)}`;
}

// ============================================
// 🎛️ التحكم في الأقسام
// ============================================
function showSection(sectionId) {
    document.querySelectorAll('.tracking-section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        section.style.display = 'block';
    }
}

// ============================================
// 🔔 الإشعارات
// ============================================
function showNotification(message, type = 'info') {
    document.querySelectorAll('.tracking-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `tracking-notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `<i class="fas ${getIcon(type)}"></i><span>${escapeHtml(message)}</span>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function getIcon(type) {
    const icons = { 
        'success': 'fa-check-circle', 
        'error': 'fa-exclamation-circle', 
        'warning': 'fa-exclamation-triangle', 
        'info': 'fa-info-circle' 
    };
    return icons[type] || icons['info'];
}

// ============================================
// 🧹 تنظيف الموارد
// ============================================
window.addEventListener('beforeunload', stopAllTimers);

// ============================================
// 📤 تصدير الدوال العامة
// ============================================
window.refreshTracking = refreshTracking;
window.updateReviewButton = updateReviewButton;
window.handleOrderStatusChange = handleOrderStatusChange;
