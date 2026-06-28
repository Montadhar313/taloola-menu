// ============================================
// ⚙️ إعدادات Firebase (Database فقط - بدون Storage)
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
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// التحقق من الجلسة المحفوظة
if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    showDashboard();
}

loginBtn.addEventListener('click', () => {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showDashboard();
    } else {
        loginError.textContent = 'كلمة المرور غير صحيحة!';
        setTimeout(() => loginError.textContent = '', 3000);
    }
});

// تسجيل الخروج
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('isAdminLoggedIn');
        location.reload();
    }
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    loadAds();
}

// ============================================
// 📑 إدارة التبويبات
// ============================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.disabled) return;
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
});

// ============================================
// 📢 إدارة الإعلانات (CRUD بدون Storage)
// ============================================
const adForm = document.getElementById('adForm');
const adsList = document.getElementById('adsList');
const imageUrlInput = document.getElementById('imageUrl');
const previewBtn = document.getElementById('previewBtn');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const totalAdsCount = document.getElementById('totalAdsCount');

// معاينة الصورة من الرابط
previewBtn.addEventListener('click', () => {
    const url = imageUrlInput.value.trim();
    if (!url) {
        showToast('الرجاء إدخال رابط الصورة أولاً', 'error');
        return;
    }
    
    // التحقق من صحة الرابط
    try {
        new URL(url);
    } catch (e) {
        showToast('الرابط غير صالح', 'error');
        return;
    }
    
    imagePreview.src = url;
    imagePreviewContainer.style.display = 'block';
});

// إزالة الصورة
removeImageBtn.addEventListener('click', () => {
    imageUrlInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
});

// حفظ الإعلان
adForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveAdBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    const title = document.getElementById('adTitle').value.trim();
    const description = document.getElementById('adDescription').value.trim();
    const price = document.getElementById('adPrice').value.trim();
    const imageUrl = imageUrlInput.value.trim();

    // التحقق من صحة الرابط إذا تم إدخاله
    if (imageUrl) {
        try {
            new URL(imageUrl);
        } catch (e) {
            showToast('رابط الصورة غير صالح', 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
            return;
        }
    }

    try {
        const newAd = {
            title,
            description,
            price: price || '',
            imageUrl: imageUrl || '',
            template: 'red',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ar-EG')
        };

        await db.ref('ads').push(newAd);
        
        showToast('تم نشر الإعلان بنجاح!', 'success');
        adForm.reset();
        imagePreviewContainer.style.display = 'none';
        
    } catch (error) {
        console.error(error);
        showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
    }
});

// مسح النموذج
adForm.addEventListener('reset', () => {
    setTimeout(() => {
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
    }, 10);
});

// جلب وعرض الإعلانات
function loadAds() {
    db.ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
        adsList.innerHTML = '';
        const ads = snapshot.val();
        
        if (!ads) {
            adsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-bullhorn fa-3x"></i>
                    <h3>لا توجد إعلانات</h3>
                    <p>أضف أول إعلان لبدء عرض العروض الخاصة</p>
                </div>
            `;
            totalAdsCount.textContent = '0';
            return;
        }

        // عكس الترتيب لعرض الأحدث أولاً
        const sortedAds = Object.keys(ads).reverse();
        totalAdsCount.textContent = sortedAds.length;
        
        sortedAds.forEach(key => {
            const ad = ads[key];
            const card = document.createElement('div');
            card.className = 'ad-card';
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteAd('${key}')" title="حذف الإعلان">
                    <i class="fas fa-trash"></i>
                </button>
                ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}" onerror="this.style.display='none'">` : ''}
                <div class="ad-card-content">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<div class="price">${ad.price} د.ع</div>` : ''}
                    <div class="date">
                        <i class="fas fa-calendar"></i>
                        ${ad.date}
                    </div>
                </div>
            `;
            adsList.appendChild(card);
        });
    });
}

// حذف الإعلان
window.deleteAd = async function(key) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    try {
        await db.ref('ads/' + key).remove();
        showToast('تم حذف الإعلان بنجاح', 'success');
    } catch (error) {
        showToast('فشل الحذف: ' + error.message, 'error');
    }
};

// ============================================
// 🔔 نظام الإشعارات (Toast)
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.4s ease reverse';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
