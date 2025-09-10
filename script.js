// إضافة هذا الكود إلى ملف script.js الحالي

// عناصر DOM
const orderBtn = document.getElementById('orderBtn');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// زر الطلب الآن - واتساب
orderBtn.addEventListener('click', function() {
  const phoneNumber = '+9647755666073';
  const message = 'مرحباً، أريد طلب وجبة من تعلولة';
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
});

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
const navButtons = document.querySelectorAll('nav.sections-nav button');
const menuSections = document.querySelectorAll('section.menu-section');

navButtons.forEach(button => {
  button.addEventListener('click', function() {
    const targetSection = this.getAttribute('data-section');
    const sectionElement = document.getElementById(targetSection);
    
    if (sectionElement) {
      sectionElement.scrollIntoView({behavior: 'smooth'});
    }
  });
});

// تأثيرات التمرير
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

// فتح نموذج الدعم
function openSupport() {
  const phoneNumber = '+9647755666073';
  const message = 'أحتاج إلى مساعدة بخصوص...';
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
}
