// تهيئة Firebase - للقاعدة فقط (بدون Storage)
const firebaseConfig = {
  apiKey: "AIzaSyD5mfdKg5MaKfnzOQNMumt0ZwL8QGeKMfU",
  authDomain: "talola-food.firebaseapp.com",
  databaseURL: "https://talola-food-default-rtdb.firebaseio.com",
  projectId: "talola-food",
  storageBucket: "talola-food.firebasestorage.app",
  messagingSenderId: "440585170470",
  appId: "1:440585170470:web:d9a2ba4500d9738dcf00e7",
  measurementId: "G-L4SLHVVFVR"
};

// Initialize Firebase (بدون Storage)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const analytics = firebase.analytics();

// اختبار اتصال Supabase
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // محاولة الحصول على معلومات الـ bucket
    const { data, error } = await supabase.storage.getBucket('images');
    
    if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('Connection successful! Bucket info:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// تشغيل الاختبار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  // اختبار اتصال Supabase
  testSupabaseConnection().then(success => {
    if (!success) {
      console.warn('Supabase connection test failed. Check your settings.');
    }
  });
  
// تهيئة Supabase
const SUPABASE_URL = 'https://vtntyscabuyleeqqfhdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bnR5c2NhYnV5bGVlcXFmaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDg0NzQsImV4cCI6MjA3MzA4NDQ3NH0.G3-4dkrHHVSxOjVqguNyQ2BC2YWmIm7E2k7s_6uJBOA';
//const SUPABASE_ANON_KEY = 'sb_secret_SjuV5OL-5K3Y6VaIeLkmuw_7iDCcSqa';

// إنشاء عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تعريف الدوال العامة التي سيتم استخدامها في admin.js
window.previewImage = function(input) {
  const preview = document.getElementById('imagePreview');
  if (!preview) return;
  
  const file = input.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
    }
    
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '<span>معاينة الصورة</span>';
  }
}

window.closeAuthModal = function() {
  const adminAuthModal = document.getElementById('adminAuthModal');
  if (adminAuthModal) {
    adminAuthModal.style.display = 'none';
  }
}

// دالة لعرض الإعلانات للزوار (سيتم استدعاؤها من admin.js)
window.displayAds = function() {
  const adsContainer = document.getElementById('adsContainer');
  if (!adsContainer) return;
  
  adsContainer.innerHTML = '';
  
  database.ref('ads/').orderByChild('timestamp').once('value')
    .then((snapshot) => {
      const ads = snapshot.val();
      if (!ads) {
        adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
        return;
      }
      
      Object.keys(ads).forEach((key) => {
        const ad = ads[key];
        const adElement = document.createElement('div');
        adElement.className = `ad-card ${ad.template}`;
        adElement.innerHTML = `
          ${ad.imageUrl ? `
            <div class="ad-image">
              <img src="${ad.imageUrl}" alt="${ad.title}">
            </div>
          ` : ''}
          <h4>${ad.title}</h4>
          <p>${ad.description}</p>
          ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
          ${ad.duration ? `<p class="ad-duration">${ad.duration}</p>` : ''}
        `;
        adsContainer.appendChild(adElement);
      });
    })
    .catch((error) => {
      console.error('Error loading ads:', error);
      adsContainer.innerHTML = '<p class="no-ads">حدث خطأ أثناء تحميل الإعلانات</p>';
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // عناصر DOM
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const navButtons = document.querySelectorAll('nav.sections-nav button');
  const menuSections = document.querySelectorAll('section.menu-section');
  const orderBtn = document.getElementById('orderBtn');
  
  // زر العودة لأعلى الصفحة
  window.addEventListener('scroll', () => {
    if (scrollToTopBtn) {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.style.display = 'flex';
      } else {
        scrollToTopBtn.style.display = 'none';
      }
    }
  });
  
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({top: 0, behavior: 'smooth'});
    });
  }
  
  // التنقل بين الأقسام
  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');
      const sectionElement = document.getElementById(targetSection);
      
      if (sectionElement) {
        sectionElement.scrollIntoView({behavior: 'smooth'});
        
        // إضافة تأثير مرئي للقسم النشط
        menuSections.forEach(section => {
          section.classList.remove('active');
        });
        sectionElement.classList.add('active');
      }
    });
  });
  
  // زر الطلب الآن - واتساب
  if (orderBtn) {
    orderBtn.addEventListener('click', function() {
      const phoneNumber = '9647755666073';
      const message = 'مرحباً، أريد طلب وجبة من تعلولة';
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank');
    });
  }
  
  // إضافة تأثيرات للعناصر عند التمرير
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // مراقبة العناصر لإضافة تأثيرات التمرير
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    observer.observe(item);
  });
  
  menuSections.forEach(section => {
    observer.observe(section);
  });
  
  // إضافة تأثيرات للعناصر عند التمرير
  const infoSections = document.querySelectorAll('.info-section');
  infoSections.forEach(section => {
    observer.observe(section);
  });
  
  // عرض الإعلانات عند تحميل الصفحة
  if (typeof window.displayAds === 'function') {
    window.displayAds();
  }
});

// فتح نموذج الدعم
window.openSupport = function() {
  const phoneNumber = '9647755666073';
  const message = 'أحتاج إلى مساعدة بخصوص...';
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
}

// تهيئة البيانات للعناصر (يمكن استكمالها لاحقاً)
function initializeMenuItems() {
  // هنا يمكنك إضافة البيانات الديناميكية للقوائم
  console.log("تهيئة عناصر القائمة...");
}

// تهيئة الصفحة عند التحميل
window.onload = function() {
  initializeMenuItems();



// اختبار رفع صورة مباشرة
async function testUpload() {
  try {
    // إنشاء ملف تجريبي
    const response = await fetch('https://via.placeholder.com/150');
    const blob = await response.blob();
    const file = new File([blob], 'test.png', { type: 'image/png' });
    
    // رفع الملف
    const fileName = `test/${Date.now()}_test.png`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return;
    }
    
    console.log('Upload successful! File info:', data);
    
    // الحصول على الرابط العام
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    console.log('Public URL:', urlData.publicUrl);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// تشغيل الاختبار
testUpload();

};
