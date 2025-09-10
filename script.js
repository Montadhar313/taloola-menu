document.addEventListener('DOMContentLoaded', function() {
  // عناصر DOM
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const navButtons = document.querySelectorAll('nav.sections-nav button');
  const menuSections = document.querySelectorAll('section.menu-section');
  const orderBtn = document.getElementById('orderBtn');
  
  // زر العودة لأعلى الصفحة
  window.addEventListener('scroll', () => {
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
});

// فتح نموذج الدعم
function openSupport() {
  const phoneNumber = '+9647755666073 ';
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
};
