// ========================
// سلة المشتريات - Core Logic
// ========================

// مصفوفة السلة - تخزين العناصر
let shoppingCart = JSON.parse(localStorage.getItem('taloola_cart')) || [];

// حفظ السلة في التخزين المحلي
function saveCart() {
    localStorage.setItem('taloola_cart', JSON.stringify(shoppingCart));
    updateCartUI();
}

// تحديث واجهة السلة
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
        
        // تأثير نبض عند تغيير الكمية
        if (totalItems > 0) {
            cartCount.style.animation = 'none';
            setTimeout(() => {
                cartCount.style.animation = 'pulse 2s infinite';
            }, 10);
        }
    }
}

// إضافة عنصر إلى السلة مع الكمية المحددة
function addToCart(name, price, quantity = 1) {
    // التحقق من وجود العنصر مسبقاً في السلة
    const existingItem = shoppingCart.find(item => item.name === name);
    
    if (existingItem) {
        // زيادة الكمية إذا كان العنصر موجوداً
        existingItem.quantity += quantity;
    } else {
        // إضافة عنصر جديد
        shoppingCart.push({
            name: name,
            price: parseInt(price),
            quantity: quantity
        });
    }
    
    saveCart();
    showNotification(`✓ تم إضافة ${quantity} × ${name} إلى السلة`);
}

// إزالة عنصر من السلة
function removeFromCart(index) {
    shoppingCart.splice(index, 1);
    saveCart();
    displayCartItems();
}

// تغيير كمية العنصر
function changeQuantity(index, change) {
    shoppingCart[index].quantity += change;
    
    // إزالة العنصر إذا كانت الكمية صفر أو أقل
    if (shoppingCart[index].quantity <= 0) {
        shoppingCart.splice(index, 1);
    }
    
    saveCart();
    displayCartItems();
}

// تفريغ السلة
function clearCart() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة بالفعل!');
        return;
    }
    
    if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
        shoppingCart = [];
        saveCart();
        displayCartItems();
        showNotification('✓ تم تفريغ السلة');
    }
}

// عرض عناصر السلة
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (!cartItemsContainer) return;
    
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <h3>السلة فارغة</h3>
                <p>لم تضف أي منتجات بعد</p>
            </div>
        `;
        if (cartTotalElement) cartTotalElement.textContent = '0';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} د.ع × ${item.quantity} = ${itemTotal.toLocaleString('ar-EG')} د.ع</div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="changeQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItemsContainer.appendChild(itemElement);
    });
    
    if (cartTotalElement) {
        cartTotalElement.textContent = total.toLocaleString('ar-EG');
    }
}

// فتح نافذة السلة
function openCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        displayCartItems();
    }
}

// إغلاق نافذة السلة
function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

// ============================================
// 🔥 نافذة مراجعة الطلب قبل الإرسال (جديدة)
// ============================================

// عرض نافذة مراجعة الطلب
function showOrderReview() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة! الرجاء إضافة منتجات أولاً.');
        return;
    }
    
    // إغلاق نافذة السلة وفتح نافذة المراجعة
    closeCartModal();
    
    const reviewModal = document.getElementById('orderReviewModal');
    if (reviewModal) {
        reviewModal.style.display = 'flex';
        displayOrderReview();
    }
}

// عرض تفاصيل الطلب في نافذة المراجعة
function displayOrderReview() {
    const reviewItemsContainer = document.getElementById('orderReviewItems');
    const reviewItemCount = document.getElementById('reviewItemCount');
    const reviewTotalQuantity = document.getElementById('reviewTotalQuantity');
    const reviewTotalAmount = document.getElementById('reviewTotalAmount');
    
    if (!reviewItemsContainer) return;
    
    reviewItemsContainer.innerHTML = '';
    let totalQuantity = 0;
    let totalAmount = 0;
    
    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += itemTotal;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-item-info">
                <div class="review-item-name">${item.name}</div>
                <div class="review-item-details">
                    <span><i class="fas fa-box"></i> الكمية: ${item.quantity}</span>
                    <span><i class="fas fa-tag"></i> السعر: ${item.price.toLocaleString('ar-EG')} د.ع</span>
                </div>
            </div>
            <div class="review-item-total">${itemTotal.toLocaleString('ar-EG')} د.ع</div>
        `;
        
        reviewItemsContainer.appendChild(reviewItem);
    });
    
    if (reviewItemCount) {
        reviewItemCount.textContent = `${shoppingCart.length} منتج`;
    }
    if (reviewTotalQuantity) {
        reviewTotalQuantity.textContent = `${totalQuantity} قطعة`;
    }
    if (reviewTotalAmount) {
        reviewTotalAmount.textContent = `${totalAmount.toLocaleString('ar-EG')} د.ع`;
    }
}

// إغلاق نافذة المراجعة
function closeOrderReview() {
    const reviewModal = document.getElementById('orderReviewModal');
    if (reviewModal) {
        reviewModal.style.display = 'none';
    }
}

// تأكيد الطلب وإرساله عبر واتساب
function confirmAndSendOrder() {
    if (shoppingCart.length === 0) {
        alert('السلة فارغة!');
        return;
    }
    
    const phoneNumber = '9647755666073';
    
    // بناء رسالة الطلب بالتنسيق المطلوب
    let message = 'مرحبا اريد طلب استلام من مطعم تعلولة\n\n';
    message += 'الطلب :\n';
    
    let totalAmount = 0;
    
    shoppingCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        message += `\n${index + 1}.${item.name}`;
        message += `\nالكمية : ${item.quantity}`;
        message += `\nالسعر :${item.price}`;
        message += `\n`;
    });
    
    message += `\nالاجمالي : ${totalAmount}`;
    message += `\nالمجموع النهائي ${totalAmount}`;
    
    // فتح واتساب مع الرسالة
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
    
    // إغلاق نافذة المراجعة
    closeOrderReview();
    
    // إظهار إشعار النجاح
    showNotification('✓ تم إرسال طلبك عبر واتساب بنجاح!');
    
    // تفريغ السلة بعد الإرسال الناجح
    setTimeout(() => {
        shoppingCart = [];
        saveCart();
    }, 500);
}

// إظهار إشعار
function showNotification(message) {
    // إزالة الإشعار السابق إذا وجد
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // إنشاء إشعار جديد
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.display = 'block';
    document.body.appendChild(notification);
    
    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.style.animation = 'slideInDown 0.5s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// ============================================
// 🔥 التحكم بالكمية داخل عناصر المنيو (جديد)
// ============================================

// تغيير الكمية داخل المنتج
function changeItemQuantity(button, change) {
    const menuCard = button.closest('.menu-item');
    const qtyInput = menuCard.querySelector('.qty-input');
    
    if (!qtyInput) return;
    
    let currentQty = parseInt(qtyInput.value) || 1;
    currentQty += change;
    
    // الحد الأدنى = 1
    if (currentQty < 1) {
        currentQty = 1;
    }
    
    // الحد الأقصى = 99
    if (currentQty > 99) {
        currentQty = 99;
        showNotification('الحد الأقصى للكمية هو 99');
    }
    
    qtyInput.value = currentQty;
    
    // تأثير بصري
    qtyInput.style.transform = 'scale(1.2)';
    setTimeout(() => {
        qtyInput.style.transform = 'scale(1)';
    }, 200);
}

// ============================================
// الدوال العامة
// ============================================

function openSupport() {
    const phoneNumber = '9647755666073';
    const message = 'أحتاج إلى مساعدة بخصوص...';
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

function closeAuthModal() {
    const adminAuthModal = document.getElementById('adminAuthModal');
    if (adminAuthModal) {
        adminAuthModal.style.display = 'none';
    }
}

function previewImage(input) {
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

// ============================================
// التهيئة عند تحميل الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تم تحميل صفحة تعلولة بنجاح');
    
    // تهيئة Firebase
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

    // تحميل Firebase SDK ديناميكياً
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(firebaseScript);
    
    const firebaseDbScript = document.createElement('script');
    firebaseDbScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    document.head.appendChild(firebaseDbScript);
    
    const firebaseStorageScript = document.createElement('script');
    firebaseStorageScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js';
    document.head.appendChild(firebaseStorageScript);
    
    // عناصر DOM
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const navButtons = document.querySelectorAll('nav.sections-nav button');
    const menuSections = document.querySelectorAll('section.menu-section');
    const menuItems = document.querySelectorAll('.menu-item');
    const cartIcon = document.getElementById('cartIcon');
    
    // زر العودة لأعلى الصفحة
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.style.display = 'flex';
                scrollToTopBtn.style.alignItems = 'center';
                scrollToTopBtn.style.justifyContent = 'center';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        }
    });
    
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // التنقل بين الأقسام
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            const sectionElement = document.getElementById(targetSection);
            
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                menuSections.forEach(section => {
                    section.classList.remove('active');
                });
                sectionElement.classList.add('active');
                
                navButtons.forEach(btn => btn.style.background = 'var(--main-yellow)');
                this.style.background = '#ffffff';
            }
        });
    });
    
    // ============================================
    // 🔥 ربط أزرار الكمية وزر الإضافة للسلة (محسّن)
    // ============================================
    
    menuItems.forEach(item => {
        const decreaseBtn = item.querySelector('.qty-decrease');
        const increaseBtn = item.querySelector('.qty-increase');
        const qtyInput = item.querySelector('.qty-input');
        const addToCartBtn = item.querySelector('.add-to-cart-btn');
        
        // زر نقصان الكمية
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                changeItemQuantity(this, -1);
            });
        }
        
        // زر زيادة الكمية
        if (increaseBtn) {
            increaseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                changeItemQuantity(this, 1);
            });
        }
        
        // زر إضافة للسلة
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const itemName = item.getAttribute('data-name');
                const itemPrice = item.getAttribute('data-price');
                const quantity = parseInt(qtyInput.value) || 1;
                
                if (itemName && itemPrice) {
                    addToCart(itemName, itemPrice, quantity);
                    
                    // تأثير بصري على الزر
                    this.classList.add('added');
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> تم الإضافة';
                    
                    setTimeout(() => {
                        this.classList.remove('added');
                        this.innerHTML = originalHTML;
                        // إعادة الكمية إلى 1 بعد الإضافة
                        qtyInput.value = 1;
                    }, 1500);
                }
            });
        }
    });
    
    // أيقونة السلة
    if (cartIcon) {
        cartIcon.addEventListener('click', openCartModal);
    }
    
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
    
    menuSections.forEach(section => {
        observer.observe(section);
    });
    
    document.querySelectorAll('section.info-section').forEach(section => {
        observer.observe(section);
    });
    
    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', function(event) {
        const cartModal = document.getElementById('cartModal');
        const adminPanel = document.getElementById('adminPanel');
        const adminAuthModal = document.getElementById('adminAuthModal');
        const orderReviewModal = document.getElementById('orderReviewModal');
        
        if (event.target === cartModal) {
            closeCartModal();
        }
        if (event.target === orderReviewModal) {
            closeOrderReview();
        }
        if (event.target === adminPanel) {
            adminPanel.style.display = 'none';
        }
        if (event.target === adminAuthModal) {
            closeAuthModal();
        }
    });
    
    // تحديث واجهة السلة
    updateCartUI();
    
    // تحميل الإعلانات بعد تحميل Firebase
    firebaseStorageScript.onload = function() {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.initializeApp(firebaseConfig);
                    console.log('✅ تم تهيئة Firebase بنجاح');
                    displayAds();
                } catch (error) {
                    console.error('خطأ في تهيئة Firebase:', error);
                }
            }
        }, 500);
    };
});

// ============================================
// نظام الإعلانات (Firebase)
// ============================================

const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

function loadCurrentAds() {
    const currentAds = document.getElementById('currentAds');
    
    if (!currentAds) return;
    
    currentAds.innerHTML = '<p>جاري تحميل الإعلانات...</p>';
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        currentAds.innerHTML = '<p>Firebase غير متوفر</p>';
        return;
    }
    
    const database = firebase.database();
    
    database.ref('ads/').orderByChild('timestamp').once('value')
        .then((snapshot) => {
            const ads = snapshot.val();
            if (!ads) {
                currentAds.innerHTML = '<p>لا توجد إعلانات حالية</p>';
                return;
            }
            
            currentAds.innerHTML = '';
            
            const keys = Object.keys(ads).reverse();
            
            keys.forEach((key) => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = 'ad-card';
                adElement.innerHTML = `
                    ${ad.imageUrl ? `
                        <div class="ad-image">
                            <img src="${ad.imageUrl}" alt="${ad.title}">
                        </div>
                    ` : ''}
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    ${ad.price ? `<p class="ad-price">السعر: ${ad.price} د.ع</p>` : ''}
                    ${ad.duration ? `<p class="ad-duration">المدة: ${ad.duration}</p>` : ''}
                    <p><small>تم الإنشاء: ${ad.date || new Date(ad.timestamp).toLocaleDateString('ar-EG')}</small></p>
                    <div class="ad-actions">
                        <button onclick="deleteAd('${key}', '${ad.imageUrl}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                `;
                currentAds.appendChild(adElement);
            });
        })
        .catch((error) => {
            console.error('خطأ في تحميل الإعلانات:', error);
            currentAds.innerHTML = '<p>حدث خطأ أثناء تحميل الإعلانات</p>';
        });
}

function displayAds() {
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        adsContainer.innerHTML = '<p class="no-ads">Firebase غير متوفر</p>';
        return;
    }
    
    const database = firebase.database();
    
    adsContainer.innerHTML = '<p class="no-ads">جاري تحميل العروض...</p>';
    
    database.ref('ads/').orderByChild('timestamp').once('value')
        .then((snapshot) => {
            const ads = snapshot.val();
            if (!ads) {
                adsContainer.innerHTML = '<p class="no-ads">لا توجد عروض خاصة حالياً</p>';
                return;
            }
            
            adsContainer.innerHTML = '';
            
            const keys = Object.keys(ads).reverse();
            
            keys.forEach((key) => {
                const ad = ads[key];
                const adElement = document.createElement('div');
                adElement.className = `ad-card ${ad.template || 'red'}`;
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
            console.error('خطأ في تحميل الإعلانات:', error);
            adsContainer.innerHTML = '<p class="no-ads">حدث خطأ أثناء تحميل الإعلانات</p>';
        });
}

function createAd() {
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
    
    if (typeof firebase === 'undefined' || !firebase.storage || !firebase.database) {
        alert('Firebase غير متوفر');
        return;
    }
    
    const storage = firebase.storage();
    const database = firebase.database();
    
    let imageUrl = '';
    
    const uploadImage = imageFile ? new Promise((resolve, reject) => {
        const storageRef = storage.ref();
        const imageRef = storageRef.child('ads/' + Date.now() + '_' + imageFile.name.replace(/\s+/g, '_'));
        
        imageRef.put(imageFile).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((url) => {
                resolve(url);
            }).catch(reject);
        }).catch(reject);
    }) : Promise.resolve('');
    
    uploadImage.then((url) => {
        imageUrl = url;
        
        const newAd = {
            title,
            description,
            price,
            duration,
            template,
            imageUrl,
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now()
        };
        
        const newAdRef = database.ref('ads/').push();
        return newAdRef.set(newAd);
    })
    .then(() => {
        alert('تم إنشاء الإعلان بنجاح!');
        clearAdForm();
        loadCurrentAds();
        displayAds();
    })
    .catch((error) => {
        console.error('خطأ في إنشاء الإعلان:', error);
        alert('حدث خطأ أثناء إنشاء الإعلان: ' + error.message);
    });
}

function deleteAd(key, imageUrl) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.database) {
        alert('Firebase غير متوفر');
        return;
    }
    
    const database = firebase.database();
    const storage = firebase.storage();
    
    database.ref('ads/' + key).remove()
        .then(() => {
            if (imageUrl) {
                const imageRef = storage.refFromURL(imageUrl);
                return imageRef.delete();
            }
            return Promise.resolve();
        })
        .then(() => {
            alert('تم حذف الإعلان بنجاح');
            loadCurrentAds();
            displayAds();
        })
        .catch((error) => {
            console.error('خطأ في حذف الإعلان:', error);
            alert('حدث خطأ أثناء حذف الإعلان');
        });
}

function clearAdForm() {
    const adTitle = document.getElementById('adTitle');
    const adDescription = document.getElementById('adDescription');
    const adPrice = document.getElementById('adPrice');
    const adDuration = document.getElementById('adDuration');
    const adTemplate = document.getElementById('adTemplate');
    const adImage = document.getElementById('adImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (adTitle) adTitle.value = '';
    if (adDescription) adDescription.value = '';
    if (adPrice) adPrice.value = '';
    if (adDuration) adDuration.value = '';
    if (adTemplate) adTemplate.value = 'red';
    if (adImage) adImage.value = '';
    if (imagePreview) imagePreview.innerHTML = '<span>معاينة الصورة</span>';
}

// تهيئة لوحة التحكم
document.addEventListener('DOMContentLoaded', function() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginSubmit = document.getElementById('adminLoginSubmit');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminAuthModal = document.getElementById('adminAuthModal');
    
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            if (adminAuthModal) {
                adminAuthModal.style.display = 'flex';
            }
        });
    }
    
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
    
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', () => {
            if (adminPanel) {
                adminPanel.style.display = 'none';
            }
        });
    }
});

// تصدير الدوال العامة للنطاق العام
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.clearCart = clearCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.showOrderReview = showOrderReview;
window.closeOrderReview = closeOrderReview;
window.confirmAndSendOrder = confirmAndSendOrder;
window.openSupport = openSupport;
window.closeAuthModal = closeAuthModal;
window.previewImage = previewImage;
window.createAd = createAd;
window.deleteAd = deleteAd;
window.loadCurrentAds = loadCurrentAds;
window.displayAds = displayAds;
