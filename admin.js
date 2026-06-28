// ============================================
// ⚙️ إعدادات Firebase
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
    authDomain: "talola-food.firebaseapp.com",
    databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
    projectId: "talola-food",
    storageBucket: "talola-food.firebasestorage.app", // تأكد من صحة هذا الرابط من Firebase Console
    messagingSenderId: "440585170470",
    appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// ============================================
// 🔐 نظام المصادقة (بسيط للوحة التحكم)
// ============================================
const ADMIN_PASSWORD = "TaloolaAdmin@2024"; // قم بتغييرها لكلمة مرور قوية
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

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    location.reload();
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
// 📢 إدارة الإعلانات (CRUD)
// ============================================
const adForm = document.getElementById('adForm');
const adsList = document.getElementById('adsList');
const fileUploadArea = document.getElementById('fileUploadArea');
const adImageInput = document.getElementById('adImage');
const imagePreview = document.getElementById('imagePreview');
let uploadedImageUrl = '';

// رفع الصورة
fileUploadArea.addEventListener('click', () => adImageInput.click());
fileUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); fileUploadArea.style.borderColor = '#c70301'; });
fileUploadArea.addEventListener('dragleave', () => { fileUploadArea.style.borderColor = '#ddd'; });
fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '#ddd';
    if (e.dataTransfer.files.length) {
        adImageInput.files = e.dataTransfer.files;
        previewFile(e.dataTransfer.files[0]);
    }
});

adImageInput.addEventListener('change', function() {
    if (this.files.length) previewFile(this.files[0]);
});

function previewFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// حفظ الإعلان
adForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveAdBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    const title = document.getElementById('adTitle').value;
    const description = document.getElementById('adDescription').value;
    const price = document.getElementById('adPrice').value;
    const imageFile = adImageInput.files[0];

    try {
        let imageUrl = '';
        
        // رفع الصورة إذا وجدت
        if (imageFile) {
            const storageRef = storage.ref().child('ads/' + Date.now() + '_' + imageFile.name);
            const snapshot = await storageRef.put(imageFile);
            imageUrl = await snapshot.ref.getDownloadURL();
        }

        // حفظ في قاعدة البيانات
        const newAd = {
            title,
            description,
            price: price || '',
            imageUrl,
            template: 'red',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ar-EG')
        };

        await db.ref('ads').push(newAd);
        
        showToast('تم نشر الإعلان بنجاح!', 'success');
        adForm.reset();
        imagePreview.style.display = 'none';
        uploadedImageUrl = '';
        
    } catch (error) {
        console.error(error);
        showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ ونشر الإعلان';
    }
});

// جلب وعرض الإعلانات
function loadAds() {
    db.ref('ads').orderByChild('timestamp').on('value', (snapshot) => {
        adsList.innerHTML = '';
        const ads = snapshot.val();
        
        if (!ads) {
            adsList.innerHTML = '<p class="loading-text">لا توجد إعلانات حالياً. أضف أول إعلان!</p>';
            return;
        }

        // عكس الترتيب لعرض الأحدث أولاً
        const sortedAds = Object.keys(ads).reverse();
        
        sortedAds.forEach(key => {
            const ad = ads[key];
            const card = document.createElement('div');
            card.className = 'ad-card';
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteAd('${key}', '${ad.imageUrl}')">
                    <i class="fas fa-trash"></i>
                </button>
                ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}">` : ''}
                <div class="ad-card-content">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<div class="price">${ad.price} د.ع</div>` : ''}
                    <small style="color: #999; display: block; margin-top: 10px;">${ad.date}</small>
                </div>
            `;
            adsList.appendChild(card);
        });
    });
}

// حذف الإعلان
window.deleteAd = async function(key, imageUrl) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    
    try {
        await db.ref('ads/' + key).remove();
        if (imageUrl) {
            await storage.refFromURL(imageUrl).delete();
        }
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
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
