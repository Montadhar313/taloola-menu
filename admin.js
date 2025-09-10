// بيانات المسؤول
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// تحميل الإعلانات الحالية
async function loadCurrentAds() {
    const currentAds = document.getElementById('currentAds');
    
    if (!currentAds) return;
    
    currentAds.innerHTML = '<p>جاري تحميل الإعلانات...</p>';
    
    try {
        // جلب الإعلانات من جدول Supabase
        const { data: ads, error } = await supabase
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading ads:', error);
            currentAds.innerHTML = '<p>حدث خطأ أثناء تحميل الإعلانات</p>';
            return;
        }
        
        if (!ads || ads.length === 0) {
            currentAds.innerHTML = '<p>لا توجد إعلانات حالية</p>';
            return;
        }
        
        currentAds.innerHTML = '';
        
        ads.forEach((ad) => {
            const adElement = document.createElement('div');
            adElement.className = 'ad-card';
            adElement.innerHTML = `
                ${ad.image_url ? `
                    <div class="ad-image">
                        <img src="${ad.image_url}" alt="${ad.title}">
                    </div>
                ` : ''}
                <h4>${ad.title}</h4>
                <p>${ad.description}</p>
                ${ad.price ? `<p class="ad-price">السعر: ${ad.price}</p>` : ''}
                ${ad.duration ? `<p class="ad-duration">المدة: ${ad.duration}</p>` : ''}
                <p><small>تم الإنشاء: ${new Date(ad.created_at).toLocaleDateString('ar-EG')}</small></p>
                <div class="ad-actions">
                    <button onclick="deleteAd('${ad.id}', '${ad.image_url}')">حذف</button>
                </div>
            `;
            currentAds.appendChild(adElement);
        });
    } catch (error) {
        console.error('Error loading ads:', error);
        currentAds.innerHTML = '<p>حدث خطأ أثناء تحميل الإعلانات</p>';
    }
}

// إنشاء إعلان جديد
async function createAd() {
    const title = document.getElementById('adTitle').value;
    const description = document.getElementById('adDescription').value;
    const price = document.getElementById('adPrice').value;
    const duration = document.getElementById('adDuration').value;
    const template = document.getElementById('adTemplate').value;
    const imageFile = document.getElementById('adImage').files[0];
    
    if (!title || !description) {
        alert('الرجاء ملء الحقول الإلزامية (العنوان والوصف)');
        return;
    }
    
    let imageUrl = '';
    
    // رفع الصورة إلى Supabase Storage إذا تم اختيارها
    if (imageFile) {
        try {
            // إظهار مؤشر التحميل
            const createButton = document.querySelector('#adminPanel .admin-section button');
            const originalText = createButton.textContent;
            createButton.textContent = 'جاري رفع الصورة...';
            createButton.disabled = true;
            
            const fileName = `ads/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
            
            console.log('بدء رفع الصورة:', fileName);
            
            // رفع الملف إلى Supabase Storage
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error('Supabase upload error:', error);
                throw error;
            }
            
            console.log('تم رفع الصورة بنجاح:', data);
            
            // الحصول على رابط الصورة
            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);
            
            imageUrl = urlData.publicUrl;
            console.log('رابط الصورة:', imageUrl);
            
            // إعادة حالة الزر إلى الطبيعي
            createButton.textContent = originalText;
            createButton.disabled = false;
            
        } catch (error) {
            console.error('Error uploading image:', error);
            
            // إعادة حالة الزر إلى الطبيعي
            const createButton = document.querySelector('#adminPanel .admin-section button');
            createButton.textContent = 'إنشاء الإعلان';
            createButton.disabled = false;
            
            alert(`حدث خطأ أثناء رفع الصورة: ${error.message}`);
            return;
        }
    }
    
    const newAd = {
        title,
        description,
        price,
        duration,
        template,
        image_url: imageUrl
    };
    
    // إضافة الإعلان إلى Supabase
    try {
        const { data, error } = await supabase
            .from('ads')
            .insert([newAd])
            .select();
        
        if (error) {
            console.error('Error saving ad:', error);
            alert('حدث خطأ أثناء حفظ الإعلان');
            return;
        }
        
        alert('تم إنشاء الإعلان بنجاح!');
        clearAdForm();
        loadCurrentAds();
        
        // تحديث عرض الإعلانات للزوار
        if (typeof window.displayAds === 'function') {
            window.displayAds();
        }
    } catch (error) {
        console.error('Error saving ad:', error);
        alert('حدث خطأ أثناء حفظ الإعلان');
    }
}

// حذف إعلان
async function deleteAd(id, imageUrl) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        try {
            // حذف الإعلان من قاعدة البيانات
            const { error } = await supabase
                .from('ads')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error deleting ad:', error);
                throw error;
            }
            
            // حذف الصورة من Supabase Storage إذا كانت موجودة
            if (imageUrl) {
                try {
                    // استخراج اسم الملف من الرابط
                    const urlParts = imageUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const fullPath = `ads/${fileName}`;
                    
                    // حذف الملف من Supabase Storage
                    const { error } = await supabase.storage
                        .from('images')
                        .remove([fullPath]);
                    
                    if (error) {
                        console.error('Error deleting image:', error);
                    }
                } catch (error) {
                    console.error('Error deleting image from storage:', error);
                }
            }
            
            alert('تم حذف الإعلان بنجاح');
            loadCurrentAds();
            
            // تحديث عرض الإعلانات للزوار
            if (typeof window.displayAds === 'function') {
                window.displayAds();
            }
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('حدث خطأ أثناء حذف الإعلان');
        }
    }
}

// مسح نموذج الإعلان
function clearAdForm() {
    document.getElementById('adTitle').value = '';
    document.getElementById('adDescription').value = '';
    document.getElementById('adPrice').value = '';
    document.getElementById('adDuration').value = '';
    document.getElementById('adTemplate').value = 'red';
    document.getElementById('adImage').value = '';
    document.getElementById('imagePreview').innerHTML = '<span>معاينة الصورة</span>';
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginSubmit = document.getElementById('adminLoginSubmit');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminAuthModal = document.getElementById('adminAuthModal');
    
    // فتح نافذة تسجيل دخول المسؤول
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            if (adminAuthModal) {
                adminAuthModal.style.display = 'flex';
            }
        });
    }
    
    // تسجيل دخول المسؤول
    if (adminLoginSubmit) {
        adminLoginSubmit.addEventListener('click', () => {
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                if (adminAuthModal) {
                    adminAuthModal.style.display = 'none';
                }
                if (adminPanel) {
                    adminPanel.style.display = 'flex';
                }
                loadCurrentAds();
            } else {
                alert('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
        });
    }
    
    // إغلاق لوحة التحكم
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', () => {
            if (adminPanel) {
                adminPanel.style.display = 'none';
            }
        });
    }
    
    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target === adminPanel) {
            adminPanel.style.display = 'none';
        }
        if (event.target === adminAuthModal) {
            adminAuthModal.style.display = 'none';
        }
    });
});
