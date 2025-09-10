// بيانات المسؤول (يمكن تغييرها لاحقاً)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123"
};

// مصفوفة لتخزين الإعلانات
let advertisements = JSON.parse(localStorage.getItem('taloola_ads')) || [];

// عناصر DOM
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminAuthModal = document.getElementById('adminAuthModal');
const adminLoginSubmit = document.getElementById('adminLoginSubmit');
const adminPanel = document.getElementById('adminPanel');
const closeAdminPanel = document.getElementById('closeAdminPanel');
const viewAdsBtn = document.getElementById('viewAdsBtn');
const adsContainer = document.getElementById('adsContainer');
const currentAds = document.getElementById('currentAds');

// فتح نافذة تسجيل دخول المسؤول
adminLoginBtn.addEventListener('click', () => {
  adminAuthModal.style.display = 'flex';
});

// تسجيل دخول المسؤول
adminLoginSubmit.addEventListener('click', () => {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    adminAuthModal.style.display = 'none';
    adminPanel.style.display = 'block';
    loadCurrentAds();
  } else {
    alert('اسم المستخدم أو كلمة المرور غير صحيحة');
  }
});

// إغلاق لوحة التحكم
closeAdminPanel.addEventListener('click', () => {
  adminPanel.style.display = 'none';
});

// عرض الإعلانات للزوار
viewAdsBtn.addEventListener('click', () => {
  document.getElementById('ads').scrollIntoView({ behavior: 'smooth' });
});

// إنشاء إعلان جديد
function createAd() {
  const title = document.getElementById('adTitle').value;
  const description = document.getElementById('adDescription').value;
  const price = document.getElementById('adPrice').value;
  const duration = document.getElementById('adDuration').value;
  const template = document.getElementById('adTemplate').value;
  
  if (!title || !description) {
    alert('الرجاء ملء الحقول الإلزامية');
    return;
  }
  
  const newAd = {
    id: Date.now(),
    title,
    description,
    price,
    duration,
    template,
    date: new Date().toLocaleDateString('ar-EG')
  };
  
  advertisements.push(newAd);
  saveAds();
  loadCurrentAds();
  displayAds();
  clearAdForm();
  
  alert('تم إنشاء الإعلان بنجاح!');
}

// حفظ الإعلانات في localStorage
function saveAds() {
  localStorage.setItem('taloola_ads', JSON.stringify(advertisements));
}

// تحميل الإعلانات الحالية
function loadCurrentAds() {
  currentAds.innerHTML = '';
  
  if (advertisements.length === 0) {
    currentAds.innerHTML = '<p>لا توجد إعلانات حالية</p>';
    return;
  }
  
  advertisements.forEach(ad => {
    const adElement = document.createElement('div');
    adElement.className = 'ad-card';
    adElement.innerHTML = `
      <h4>${ad.title}</h4>
      <p>${ad.description}</p>
      ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
      ${ad.duration ? `<p class="ad-duration">المدة: ${ad.duration}</p>` : ''}
      <p><small>تم الإنشاء: ${ad.date}</small></p>
      <div class="ad-actions">
        <button onclick="deleteAd(${ad.id})" style="background: var(--main-red); color: white;">حذف</button>
      </div>
    `;
    currentAds.appendChild(adElement);
  });
}

// عرض الإعلانات للزوار
function displayAds() {
  adsContainer.innerHTML = '';
  
  if (advertisements.length === 0) {
    adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
    return;
  }
  
  advertisements.forEach(ad => {
    const adElement = document.createElement('div');
    adElement.className = `ad-card ${ad.template}`;
    adElement.innerHTML = `
      <h4>${ad.title}</h4>
      <p>${ad.description}</p>
      ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
      ${ad.duration ? `<p class="ad-duration">${ad.duration}</p>` : ''}
    `;
    adsContainer.appendChild(adElement);
  });
}

// حذف إعلان
function deleteAd(id) {
  if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
    advertisements = advertisements.filter(ad => ad.id !== id);
    saveAds();
    loadCurrentAds();
    displayAds();
  }
}

// مسح نموذج الإعلان
function clearAdForm() {
  document.getElementById('adTitle').value = '';
  document.getElementById('adDescription').value = '';
  document.getElementById('adPrice').value = '';
  document.getElementById('adDuration').value = '';
  document.getElementById('adTemplate').value = 'red';
}

// إغلاق نافذة المصادقة
function closeAuthModal() {
  adminAuthModal.style.display = 'none';
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
  displayAds();
  
  // إغلاق لوحة التحكم عند النقر خارجها
  window.addEventListener('click', function(event) {
    if (event.target === adminPanel) {
      adminPanel.style.display = 'none';
    }
  });
});
