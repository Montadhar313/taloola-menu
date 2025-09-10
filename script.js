document.addEventListener('DOMContentLoaded', function() {
  // عناصر DOM
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const navButtons = document.querySelectorAll('nav.sections-nav button');
  const menuSections = document.querySelectorAll('section.menu-section');
  const orderBtn = document.getElementById('orderBtn');
  const progressBar = document.getElementById('progressBar');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authModal = document.getElementById('authModal');
  const authTitle = document.getElementById('authTitle');
  const authSubmit = document.getElementById('authSubmit');
  
  // شريط التقدم أثناء التمرير
  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / documentHeight) * 100;
    
    progressBar.style.width = scrollPercent + '%';
    
    if (window.pageYOffset > 300) {
      scrollToTopBtn.style.display = 'flex';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  });
  
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
  
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
  orderBtn.addEventListener('click', function() {
    const phoneNumber = '+9647755666073';
    const message = 'مرحباً، أريد طلب وجبة من تعلولة';
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  });
  
  // فتح نافذة تسجيل الدخول
  loginBtn.addEventListener('click', function() {
    authTitle.textContent = 'تسجيل الدخول';
    authSubmit.textContent = 'دخول';
    authModal.style.display = 'flex';
  });
  
  // فتح نافذة إنشاء حساب
  registerBtn.addEventListener('click', function() {
    authTitle.textContent = 'إنشاء حساب';
    authSubmit.textContent = 'إنشاء';
    authModal.style.display = 'flex';
  });
  
  // إغلاق نافذة التسجيل
  window.closeAuthModal = function() {
    authModal.style.display = 'none';
  };
  
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
  
  const infoSections = document.querySelectorAll('.info-section');
  infoSections.forEach(section => {
    observer.observe(section);
  });
  
  // تأثيرات للعناوين
  const headings = document.querySelectorAll('h2, h3, h4');
  headings.forEach(heading => {
    heading.style.opacity = '0';
    heading.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      heading.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heading.style.opacity = '1';
      heading.style.transform = 'translateY(0)';
    }, 200);
  });
});

// فتح نموذج الدعم
function openSupport() {
  const phoneNumber = '+9647755666073';
  const message = 'أحتاج إلى مساعدة بخصوص...';
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
}

// أداة إنشاء الإعلانات
function generateAd() {
  const title = document.getElementById('adTitle').value || 'عرض خاص';
  const desc = document.getElementById('adDesc').value || 'استفد من عرضنا الخاص';
  const date = document.getElementById('adDate').value || 'لمدة محدودة';
  const template = document.getElementById('adTemplate').value;
  
  let adHTML = '';
  
  if (template === 'template1') {
    adHTML = `
      <div style="background: linear-gradient(135deg, var(--main-red), var(--dark-red)); padding: 20px; border-radius: 15px; text-align: center; border: 3px solid var(--main-yellow);">
        <h3 style="color: var(--main-yellow); margin-bottom: 10px;">${title}</h3>
        <p style="color: white; margin-bottom: 15px;">${desc}</p>
        <p style="background: var(--main-yellow); color: black; padding: 5px 15px; border-radius: 20px; display: inline-block;">${date}</p>
      </div>
    `;
  } else if (template === 'template2') {
    adHTML = `
      <div style="background: var(--main-yellow); padding: 20px; border-radius: 15px; text-align: center; border: 3px solid var(--main-red);">
        <h3 style="color: var(--main-red); margin-bottom: 10px;">${title}</h3>
        <p style="color: black; margin-bottom: 15px;">${desc}</p>
        <p style="background: var(--main-red); color: white; padding: 5px 15px; border-radius: 20px; display: inline-block;">${date}</p>
      </div>
    `;
  } else {
    adHTML = `
      <div style="background: white; padding: 20px; border-radius: 15px; text-align: center; border: 3px solid var(--main-red);">
        <h3 style="color: var(--main-red); margin-bottom: 10px;">${title}</h3>
        <p style="color: black; margin-bottom: 15px;">${desc}</p>
        <p style="background: var(--main-yellow); color: black; padding: 5px 15px; border-radius: 20px; display: inline-block;">${date}</p>
      </div>
    `;
  }
  
  document.getElementById('adPreview').innerHTML = adHTML;
}

// تهيئة البيانات للعناصر (يمكن استكمالها لاحقاً)
function initializeMenuItems() {
  // هنا يمكنك إضافة البيانات الديناميكية للقوائم
  console.log("تهيئة عناصر القائمة...");
}

// تهيئة الصفحة عند التحميل
window.onload = function() {
  initializeMenuItems();
};
