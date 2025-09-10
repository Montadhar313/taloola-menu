// تهيئة Supabase
const SUPABASE_URL = 'https://vtntyscabuyleeqqfhdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bnR5c2NhYnV5bGVlcXFmaGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDg0NzQsImV4cCI6MjA3MzA4NDQ3NH0.G3-4dkrHHVSxOjVqguNyQ2BC2YWmIm7E2k7s_6uJBOA';

// إنشاء عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// دالة لعرض الإعلانات للزوار
window.displayAds = async function() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    
    adsContainer.innerHTML = '<p class="no-ads">جاري تحميل العروض...</p>';
    
    try {
        // جلب الإعلانات من جدول Supabase
        const { data: ads, error } = await supabase
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading ads:', error);
            adsContainer.innerHTML = '<p class="no-ads">حدث خطأ أثناء تحميل الإعلانات</p>';
            return;
        }
        
        if (!ads || ads.length === 0) {
            adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
            return;
        }
        
        adsContainer.innerHTML = '';
        
        ads.forEach((ad) => {
            const adElement = document.createElement('div');
            adElement.className = `ad-card ${ad.template || ''}`;
            adElement.innerHTML = `
                ${ad.image_url ? `
                    <div class="ad-image">
                        <img src="${ad.image_url}" alt="${ad.title}">
                    </div>
                ` : ''}
                <h4>${ad.title}</h4>
                <p>${ad.description}</p>
                ${ad.price ? `<p class="ad-price">السعر: ${ad.price}</p>` : ''}
                ${ad.duration ? `<p class="ad-duration">${ad.duration}</p>` : ''}
            `;
            adsContainer.appendChild(adElement);
        });
    } catch (error) {
        console.error('Error loading ads:', error);
        adsContainer.innerHTML = '<p class="no-ads">حدث خطأ أثناء تحميل الإعلانات</p>';
    }
}

// فتح نموذج الدعم
window.openSupport = function() {
    const phoneNumber = '9647755666073';
    const message = 'أحتاج إلى مساعدة بخصوص...';
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // اختبار اتصال Supabase
    testSupabaseConnection().then(success => {
        if (!success) {
            console.warn('Supabase connection test failed. Check your settings.');
        }
    });
    
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
    menuSections.forEach(section => {
        observer.observe(section);
    });
    
    // عرض الإعلانات عند تحميل الصفحة
    if (typeof window.displayAds === 'function') {
        window.displayAds();
    }
});
