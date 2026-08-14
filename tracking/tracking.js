// ============================================
// 🚚 نظام تتبع الطلب - النسخة المحسّنة (User-Centric + DineIn Support)
// ============================================

// 🔑 الثوابت
const TRACKING_STORAGE_KEY = 'taloola_tracking_phone';
const AUTO_REFRESH_INTERVAL = 5000;
const REVIEW_PAGE_PATH = '../review/review.html';
const AUTO_REDIRECT_DELAY = 4000;

// 📦 المتغيرات العامة
let trackingInterval = null;
let currentOrderId = null;
let currentOrderPhone = null;
let currentIsDineIn = false; // ✅ متغير جديد لتتبع نوع الطلب (صالة أم دلفري)
let firebaseDB = null;
let countdownTimer = null;
let hasRedirectedToReview = false;
let lastKnownStatus = null;
let orderStatusListener = null;

// ⏱️ متغيرات مدة التوصيل الديناميكية
let deliveryAreasData = []; 
const DEFAULT_DELIVERY_MINUTES = 45; 

// 🎯 خريطة حالات الطلب
const ORDER_STATUS_MAP = {
    'pending': { step: 1, label: 'قيد المعالجة', icon: 'fa-clock', class: 'pending', progress: 0, color: '#ffc107' },
    'preparing': { step: 2, label: 'قيد التحضير', icon: 'fa-utensils', class: 'preparing', progress: 33, color: '#17a2b8' },
    'ready': { step: 3, label: 'جاهز للتوصيل', icon: 'fa-motorcycle', class: 'ready', progress: 66, color: '#28a745' },
    'delivered': { step: 4, label: 'تم التوصيل ✅', icon: 'fa-home', class: 'delivered', progress: 100, color: '#28a745' },
    'completed': { step: 4, label: 'تم التوصيل ✅', icon: 'fa-home', class: 'completed', progress: 100, color: '#28a745' },
    'served': { step: 4, label: 'تم التقديم ✅', icon: 'fa-concierge-bell', class: 'completed', progress: 100, color: '#28a745' }, // ✅ حالة الصالة
    'cancelled': { step: 0, label: 'تم الإلغاء ❌', icon: 'fa-times-circle', class: 'cancelled', progress: 0, color: '#dc3545' }
};

// ============================================
// 🚀 التهيئة عند التحميل
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initFirebase();
        await fetchDeliveryAreasData(); 
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
                showNotification('⏳ سيكون التقييم متاحاً بعد اكتمال الطلب', 'warning');
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

// ✅ دالة مساعدة لتحديد إذا كان الطلب من الصالة
function isDineInOrder(order) {
    return order.orderType === 2 || order.orderType === 'DineIn' || order.orderSource === 'Table' || !!order.tableId;
}

// ============================================
// 🔍 بدء التتبع التلقائي
// ============================================
async function startAutoTracking() {
    showSection('trackLoadingSection');

    try {
        let order = null;
        let source = '';

        // ✅ الأولوية 1: من URL Parameters
        const urlParams = new URLSearchParams(window.location.search);
        const orderParam = urlParams.get('order');
        if (orderParam) {
            order = await findOrderByNumberInUserPath(orderParam);
            if (order) source = 'URL parameter (user path)';
        }

        // ✅ الأولوية 2: من رقم الهاتف
        if (!order) {
            const savedPhone = localStorage.getItem(TRACKING_STORAGE_KEY);
            if (savedPhone) {
                order = await findLatestOrderByPhoneInUserPath(savedPhone);
                if (order) {
                    source = 'phone (user path - primary)';
                    currentOrderPhone = normalizePhone(savedPhone);
                }
            }
        }

        // ✅ الأولوية 3: من sessionStorage
        if (!order) {
            const savedOrder = sessionStorage.getItem('current_tracking_order');
            if (savedOrder) {
                try {
                    const parsed = JSON.parse(savedOrder);
                    if (parsed.phone) {
                        order = await findLatestOrderByPhoneInUserPath(parsed.phone);
                        if (order) source = 'sessionStorage → user path';
                    }
                } catch (e) {}
            }
        }

        // ✅ الأولوية 4: البحث في المسار الرئيسي
        if (!order) {
            const savedPhone = localStorage.getItem(TRACKING_STORAGE_KEY);
            if (savedPhone) {
                order = await findOrderByPhoneInMainList(savedPhone);
                if (order) source = 'phone (main list - fallback)';
            }
        }

        if (order) {
            console.log(`✅ تم العثور على الطلب عبر: ${source}`);
            currentOrderId = order.id;
            currentIsDineIn = isDineInOrder(order); // ✅ تحديد نوع الطلب
            if (!currentOrderPhone) currentOrderPhone = normalizePhone(order.phone);

            sessionStorage.setItem('current_tracking_order', JSON.stringify({
                id: order.id,
                phone: currentOrderPhone,
                orderNumber: order.orderNumber,
                status: order.status
            }));

            displayOrderDetails(order);
            showSection('trackResultSection');
            startRealtimeTrackingForUser(order.id, currentOrderPhone);
            updateWhatsappLink(order.orderNumber);
            handleOrderStatusChange(order.status, order.timestamp);
            showNotification('✅ تم تحميل حالة طلبك بنجاح', 'success');
        } else {
            console.warn('⚠️ لم يتم العثور على الطلب في مسار المستخدمين');
            showSection('trackNotFoundSection');
            showNotification('⚠ لم يتم العثور على طلب نشط لهذا الرقم', 'warning');
        }
    } catch (error) {
        console.error('❌ خطأ في التتبع:', error);
        showSection('trackNotFoundSection');
        showNotification('❌ حدث خطأ أثناء تحميل الطلب', 'error');
    }
}

// ============================================
// 🔎 دوال البحث في Firebase
// ============================================
async function findOrderByNumberInUserPath(orderNumber) {
    if (!firebaseDB) return null;
    const cleanNumber = orderNumber.replace('#', '').replace(/\s/g, '');
    const numValue = parseInt(cleanNumber);
    if (isNaN(numValue)) return null;

    try {
        const usersSnapshot = await firebaseDB.ref('users').once('value');
        const usersData = usersSnapshot.val();
        if (!usersData) return null;

        for (const phone of Object.keys(usersData)) {
            const ordersSnapshot = await firebaseDB
                .ref(`users/${phone}/orders`)
                .orderByChild('orderNumber')
                .equalTo(numValue)
                .limitToLast(1)
                .once('value');
            const ordersData = ordersSnapshot.val();
            if (ordersData) {
                const orderId = Object.keys(ordersData)[0];
                return { id: orderId, ...ordersData[orderId], phone: phone };
            }
        }
        return null;
    } catch (error) {
        console.warn('⚠️ خطأ في البحث برقم الطلب (user path):', error);
        return null;
    }
}

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

function getEstimatedTimeForArea(areaName) {
    if (!areaName || !deliveryAreasData.length) return DEFAULT_DELIVERY_MINUTES;
    const targetArea = deliveryAreasData.find(area => area.name.trim() === areaName.trim());
    if (targetArea && targetArea.estimatedTime) return parseInt(targetArea.estimatedTime);
    return DEFAULT_DELIVERY_MINUTES;
}

async function findLatestOrderByPhoneInUserPath(phone) {
    if (!firebaseDB) return null;
    const normalizedPhone = normalizePhone(phone);
    try {
        const snapshot = await firebaseDB.ref(`users/${normalizedPhone}/orders`).orderByChild('timestamp').limitToLast(1).once('value');
        const data = snapshot.val();
        if (!data) return null;
        const orderId = Object.keys(data)[0];
        const orderData = data[orderId];
        return { id: orderId, ...orderData, phone: normalizedPhone, orderNumber: orderData.orderNumber || orderId.substring(0, 6).toUpperCase() };
    } catch (error) { return null; }
}

async function findOrderByPhoneInMainList(phone) {
    if (!firebaseDB) return null;
    const normalizedPhone = normalizePhone(phone);
    try {
        const snapshot = await firebaseDB.ref('orders/list').orderByChild('phone').equalTo(normalizedPhone).limitToLast(1).once('value');
        const data = snapshot.val();
        if (!data) return null;
        const orderId = Object.keys(data)[0];
        return { id: orderId, ...data[orderId] };
    } catch (error) { return null; }
}

function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('964')) p = '0' + p.substring(3);
    if (p.startsWith('+964')) p = '0' + p.substring(4);
    if (p.length === 9 && p.startsWith('7')) p = '0' + p;
    return p;
}

// ============================================
// 📊 عرض تفاصيل الطلب (مع دعم الصالة)
// ============================================
function displayOrderDetails(order) {
    if (!order) return;

    const isDineIn = isDineInOrder(order);
    currentIsDineIn = isDineIn; 

    const orderNum = order.orderNumber || order.id?.substring(0, 6).toUpperCase() || '000';
    setText('displayOrderNumber', `#${orderNum}`);
    setText('customerName', order.customerName || 'زبون');

    const phoneRow = document.getElementById('customerPhone')?.closest('.detail-row');
    const addressRow = document.getElementById('deliveryAddress')?.closest('.detail-row');
    const progressTracker = document.querySelector('.progress-tracker');
    const dineinSection = document.getElementById('dineinStatusSection');

    if (isDineIn) {
        // ✅ إخفاء عناصر الدلفري
        if (phoneRow) phoneRow.style.display = 'none';
        if (addressRow) addressRow.style.display = 'none';
        if (progressTracker) progressTracker.style.display = 'none';
        hideCountdown();
        
        // ✅ إظهار وتعبئة قسم الصالة
        if (dineinSection) dineinSection.style.display = 'block';
        setText('dineinTableNumber', order.tableNumber || order.tableId || '-');
        setText('dineinPersonsCount', order.numberOfPersons || order.personCount || '-');
        
        updateDineinProgress(order.status);
        updateDineinStatusBadge(order.status);
        
    } else {
        // 🛵 مسار الدلفري الطبيعي
        if (phoneRow) phoneRow.style.display = 'flex';
        if (addressRow) addressRow.style.display = 'flex';
        if (progressTracker) progressTracker.style.display = 'flex';
        if (dineinSection) dineinSection.style.display = 'none';

        const phone = order.phone || '';
        const phoneEl = document.getElementById('customerPhone');
        if (phoneEl) {
            phoneEl.textContent = formatPhone(phone) || 'غير متوفر';
            phoneEl.href = phone ? `tel:${phone}` : '#';
        }
        setText('deliveryAddress', [order.area, order.detailedAddress].filter(Boolean).join(' - ') || 'غير محدد');
        
        const status = order.status || 'pending';
        updateStatusBadge(status);
        updateProgressTracker(status);
        
        if (['pending', 'preparing', 'ready'].includes(status)) {
            startCountdown(order.timestamp, order.area);
        } else {
            hideCountdown();
        }
    }

    if (order.timestamp) {
        const date = new Date(order.timestamp);
        setText('orderTime', date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }

    renderOrderItems(order.items);
    setText('orderTotalAmount', `${(order.total || 0).toLocaleString('ar-EG')} د.ع`);

    updateWhatsappLink(order.orderNumber);
    updateReviewButton(order.status);
    handleCancelledStatus(order.status);
    
    const statusLabel = isDineIn ? 
        (['completed', 'served'].includes(order.status) ? 'تم التقديم' : 'جاري التحضير') : 
        (ORDER_STATUS_MAP[order.status]?.label || 'تتبع الطلب');
        
    document.title = `${statusLabel} - تعلولة`;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('0')) return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    return phone;
}

function renderOrderItems(items) {
    const list = document.getElementById('orderItemsList');
    if (!list) return;
    if (!items || !Array.isArray(items) || items.length === 0) {
        list.innerHTML = '<li class="item-row"><span>لا توجد أصناف</span></li>';
        return;
    }
    list.innerHTML = items.map(item => {
        const notes = item.note || item.notes || '';
        const notesHtml = notes ? `<div class="item-notes" style="font-size: 0.85rem; color: #b45309; margin-top: 4px;"><i class="fas fa-sticky-note"></i> ${escapeHtml(notes)}</div>` : '';
        return `
            <li class="item-row" style="display: flex; flex-direction: column; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span class="item-name">${escapeHtml(item.name || 'صنف')}</span>
                    <div>
                        <span class="item-qty">×${item.quantity || 1}</span>
                        <span class="item-price" style="margin-right: 10px;">${((item.price || 0) * (item.quantity || 1)).toLocaleString('ar-EG')} د.ع</span>
                    </div>
                </div>
                ${notesHtml}
            </li>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// 🍽️ دوال تحديث واجهة الصالة (Dine-In)
// ============================================
function updateDineinProgress(status) {
    const stepReceived = document.getElementById('dineinStepReceived');
    const stepPreparing = document.getElementById('dineinStepPreparing');
    const stepServed = document.getElementById('dineinStepServed');
    const line1 = document.getElementById('dineinLine1');
    const line2 = document.getElementById('dineinLine2');
    
    if(!stepReceived) return;

    [stepReceived, stepPreparing, stepServed].forEach(s => s.classList.remove('active', 'completed'));
    line1.style.background = '#e0e0e0';
    line2.style.background = '#e0e0e0';
    
    if (['completed', 'served'].includes(status)) {
        stepReceived.classList.add('completed');
        stepPreparing.classList.add('completed');
        stepServed.classList.add('active', 'completed');
        line1.style.background = '#28a745';
        line2.style.background = '#28a745';
    } else if (['preparing', 'ready'].includes(status)) {
        stepReceived.classList.add('completed');
        stepPreparing.classList.add('active');
        line1.style.background = '#28a745';
    } else {
        stepReceived.classList.add('active');
    }
}

function updateDineinStatusBadge(status) {
    const badge = document.getElementById('orderStatusBadge');
    if (!badge) return;
    
    let label = 'تم الاستلام ✅';
    let icon = 'fa-check-circle';
    let cls = 'pending';
    
    if (['preparing', 'ready'].includes(status)) {
        label = 'جاري التحضير 👨‍🍳';
        icon = 'fa-utensils';
        cls = 'preparing';
    } else if (['completed', 'served'].includes(status)) {
        label = 'تم التقديم 🍽️';
        icon = 'fa-concierge-bell';
        cls = 'delivered';
    } else if (status === 'cancelled') {
        label = 'تم الإلغاء ❌';
        icon = 'fa-times-circle';
        cls = 'cancelled';
    }
    
    badge.className = `status-badge ${cls}`;
    badge.innerHTML = `<i class="fas ${icon}"></i> <span>${label}</span>`;
}

// ============================================
// 🎨 تحديث شارة الحالة وشريط التقدم (للدلفري)
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
        }
    }

    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed', 'cancelled');
        if (status === 'cancelled') {
            if (stepNum === 1) step.classList.add('completed');
            else step.classList.add('cancelled');
        } else if (stepNum < currentStep) step.classList.add('completed');
        else if (stepNum === currentStep && currentStep > 0) step.classList.add('active');
    });
}

function handleCancelledStatus(status) {
    const cancelledSection = document.getElementById('cancelledInfo');
    const countdownContainer = document.getElementById('countdownContainer');
    const actionButtons = document.querySelector('.action-buttons');

    if (status === 'cancelled') {
        if (cancelledSection) cancelledSection.style.display = 'block';
        if (countdownContainer) countdownContainer.style.display = 'none';
        if (actionButtons) actionButtons.style.display = 'none';
        if (!currentIsDineIn) updateProgressTracker('cancelled');
    } else {
        if (cancelledSection) cancelledSection.style.display = 'none';
        if (actionButtons) actionButtons.style.display = 'flex';
    }
}

// ============================================
// ⏱️ العداد التنازلي (للدلفري فقط)
// ============================================
function startCountdown(orderTimestamp, orderArea) {
    if (currentIsDineIn) return; // ✅ لا عداد تنازلي للصالة
    const container = document.getElementById('countdownContainer');
    if (!container) return;
    container.style.display = 'block';
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
        if (timerEl) timerEl.innerHTML = '<span style="color: var(--success-green); font-size: 1.3rem;">🎉 وصل قريباً!</span>';
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
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

// ============================================
// ✅ التعامل مع تغيير حالة الطلب
// ============================================
function handleOrderStatusChange(status, timestamp) {
    const isCompleted = ['delivered', 'completed', 'served'].includes(status);
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
        stopAllTimers();
        showNotification('⚠️ تم إلغاء هذا الطلب', 'error');
        return;
    }

    if (isCompleted && !hasRedirectedToReview) {
        stopAllTimers();

        if (currentIsDineIn) {
            // ✅ منطق الصالة: إشعار بتقديم الطلب دون إجبار الزبون على مغادرة الصفحة
            showNotification('🍽️ تم تقديم طلبك! أتمنى لك وجبة شهية', 'success');
            document.title = '✅ تم التقديم - تعلولة';
            updateReviewButton(status);
        } else {
            // 🛵 منطق الدلفري: إشعار وتحويل تلقائي لصفحة التقييم
            const timerEl = document.querySelector('.countdown-timer');
            if (timerEl) timerEl.innerHTML = '<span style="color: var(--success-green); font-size: 1.3rem;">✅ تم التوصيل!</span>';

            updateReviewButton(status);
            showNotification('🎉 تم تسليم طلبك! يمكنك الآن تقييم تجربتك', 'success');

            setTimeout(() => {
                if (!hasRedirectedToReview) {
                    hasRedirectedToReview = true;
                    sessionStorage.setItem('review_order_data', JSON.stringify({
                        orderNumber: document.getElementById('displayOrderNumber')?.textContent,
                        total: document.getElementById('orderTotalAmount')?.textContent,
                        status: status,
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
}

function stopAllTimers() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }
    if (orderStatusListener) { try { orderStatusListener.off(); } catch(e) {} orderStatusListener = null; }
}

// ============================================
// 🔄 الاستماع الفوري للتغييرات
// ============================================
function startRealtimeTrackingForUser(orderId, phone) {
    if (orderStatusListener) { try { orderStatusListener.off(); } catch(e) {} orderStatusListener = null; }
    if (!firebaseDB || !orderId || !phone) return;
    const normalizedPhone = normalizePhone(phone);

    orderStatusListener = firebaseDB.ref(`users/${normalizedPhone}/orders/${orderId}`).on('value', (snapshot) => {
        const order = snapshot.val();
        if (order) {
            displayOrderDetails({ id: orderId, ...order, phone: normalizedPhone });
            updateReviewButton(order.status);
            handleOrderStatusChange(order.status, order.timestamp);
            if (['delivered', 'completed', 'served', 'cancelled'].includes(order.status)) {
                try { orderStatusListener.off(); } catch(e) {}
                orderStatusListener = null;
            }
        }
    }, (error) => {
        console.warn('⚠️ Realtime listener error:', error);
        startAutoRefreshForUser(orderId, normalizedPhone);
    });
}

function startAutoRefreshForUser(orderId, phone) {
    if (trackingInterval) clearInterval(trackingInterval);
    trackingInterval = setInterval(async () => {
        if (!orderId || !firebaseDB || !phone) return;
        try {
            const snapshot = await firebaseDB.ref(`users/${normalizePhone(phone)}/orders/${orderId}`).once('value');
            const order = snapshot.val();
            if (order) {
                displayOrderDetails({ id: orderId, ...order, phone: phone });
                updateReviewButton(order.status);
                handleOrderStatusChange(order.status, order.timestamp);
                if (['delivered', 'completed', 'served', 'cancelled'].includes(order.status)) {
                    clearInterval(trackingInterval); trackingInterval = null;
                }
            }
        } catch (error) {}
    }, AUTO_REFRESH_INTERVAL);
}

function refreshTracking() {
    if (!currentOrderId || !currentOrderPhone) {
        showNotification('⚠ لا يوجد طلب حالي للتحديث', 'warning');
        return;
    }
    const refreshBtn = document.getElementById('refreshTrackingBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
    }
    showNotification('🔄 جاري تحديث الحالة...', 'info');
    firebaseDB?.ref(`users/${currentOrderPhone}/orders/${currentOrderId}`).once('value')
        .then(snapshot => {
            const order = snapshot.val();
            if (order) {
                displayOrderDetails({ id: currentOrderId, ...order, phone: currentOrderPhone });
                updateReviewButton(order.status);
                handleOrderStatusChange(order.status, order.timestamp);
                showNotification('✅ تم تحديث الحالة', 'success');
            } else {
                showNotification('⚠ لم يتم العثور على الطلب', 'warning');
            }
        })
        .catch(() => showNotification('❌ فشل التحديث', 'error'))
        .finally(() => {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث الحالة';
            }
        });
}

// ============================================
// ⭐ إدارة زر التقييم
// ============================================
function updateReviewButton(status) {
    const reviewBtn = document.getElementById('reviewBtn');
    if (!reviewBtn) return;

    const isCompleted = ['completed', 'delivered', 'served'].includes(status);
    reviewBtn.style.display = 'flex';

    if (isCompleted) {
        reviewBtn.classList.remove('disabled');
        reviewBtn.style.pointerEvents = 'auto';
        reviewBtn.style.opacity = '1';
        reviewBtn.title = currentIsDineIn ? '🌟 قيّم تجربتك في المطعم' : '🌟 قيّم تجربتك الآن وساعدنا في التحسين';
        reviewBtn.innerHTML = '<i class="fas fa-star"></i> <span>قيّم تجربتك 🌟</span>';
    } else {
        reviewBtn.classList.add('disabled');
        reviewBtn.style.pointerEvents = 'none';
        reviewBtn.style.opacity = '0.6';
        reviewBtn.title = currentIsDineIn ? 'سيتم تفعيل التقييم بعد تقديم الطلب ✅' : 'سيتم تفعيل زر التقييم بعد وصول الطلب وإكماله ✅';
        reviewBtn.innerHTML = '<i class="fas fa-star"></i> <span>التقييم متاح قريباً ⏳</span>';
    }
}

// ============================================
// 🔗 تحديث رابط واتساب وإشعارات
// ============================================
function updateWhatsappLink(orderNumber) {
    const btn = document.getElementById('whatsappContactBtn');
    if (!btn) return;
    const orderNum = orderNumber || sessionStorage.getItem('lastOrderNumber') || '000';
    btn.href = `https://wa.me/9647755666073?text=${encodeURIComponent(`استفسار عن طلب #${orderNum}`)}`;
}

function showSection(sectionId) {
    document.querySelectorAll('.tracking-section').forEach(sec => { sec.classList.remove('active'); sec.style.display = 'none'; });
    const section = document.getElementById(sectionId);
    if (section) { section.classList.add('active'); section.style.display = 'block'; }
}

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
    const icons = { 'success': 'fa-check-circle', 'error': 'fa-exclamation-circle', 'warning': 'fa-exclamation-triangle', 'info': 'fa-info-circle' };
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