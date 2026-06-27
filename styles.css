/* ============================================ */
/* متغيرات الألوان */
/* ============================================ */
:root {
    --main-red: #c70301;
    --main-yellow: #fedb17;
    --text-color: #ffffff;
    --item-bg: rgba(199, 3, 1, 0.95);
    --shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    --shadow-hover: 0 8px 25px rgba(254, 219, 23, 0.5);
    --main-font: 'Cairo', sans-serif;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    touch-action: manipulation;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #1a1a1a;
    color: var(--text-color);
    min-height: 100vh;
    line-height: 1.6;
    overflow-x: hidden;
}

h4, p, .price, .cart-item-name, .review-item-name, .product-description {
    -webkit-user-select: text;
    user-select: text;
}

button, .menu-item, .cart-icon, .location-icon-btn {
    -webkit-appearance: none;
    appearance: none;
    touch-action: manipulation;
    cursor: pointer;
}

/* ============================================ */
/* فيديو الخلفية */
/* ============================================ */
#background-video {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -2;
}

.video-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: -1;
}

/* ============================================ */
/* الهيدر */
/* ============================================ */
header {
    position: relative;
    text-align: center;
    padding: 3rem 1rem 2rem;
    color: white;
    z-index: 1;
}

header .logo {
    max-width: 250px;
    margin-bottom: 1rem;
    border-radius: 50%;
    animation: fadeInDown 1s ease;
}

header .team-under-logo {
    max-width: 300px;
    border-radius: 20px;
    margin: 1rem auto;
    display: block;
    box-shadow: var(--shadow);
}

header p {
    margin: 0.3rem 0;
    font-weight: 600;
    font-size: 1.1rem;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

header p.hours {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-top: 0.5rem;
}

/* ============================================ */
/* التنقل */
/* ============================================ */
nav.sections-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    padding: 1rem;
    background: var(--main-red);
    border-radius: 20px;
    margin: 0 1rem 1.5rem;
    box-shadow: var(--shadow);
    position: sticky;
    top: 10px;
    z-index: 100;
    backdrop-filter: blur(10px);
}

nav.sections-nav button {
    background: var(--main-yellow);
    color: #000000;
    border: none;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    border-radius: 50px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-family: var(--main-font);
}

nav.sections-nav button:hover,
nav.sections-nav button:focus {
    background: #ffffff;
    color: var(--main-red);
    outline: none;
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* ============================================ */
/* المحتوى الرئيسي */
/* ============================================ */
main {
    padding: 0 1rem;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
    position: relative;
}

/* ============================================ */
/* أقسام المنيو */
/* ============================================ */
section.menu-section {
    margin: 2rem auto 4rem;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    padding: 25px;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(254, 219, 23, 0.3);
    box-shadow: var(--shadow);
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

section.menu-section.animate-in {
    opacity: 1;
    transform: translateY(0);
}

section.menu-section h3 {
    border-bottom: 3px solid var(--main-yellow);
    padding-bottom: 0.8rem;
    font-weight: 700;
    font-size: 2rem;
    margin-bottom: 2rem;
    color: var(--text-color);
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* ============================================ */
/* 🎨 بطاقات المنتجات (جديدة - أنظف) */
/* ============================================ */
div.menu-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
}

div.menu-item {
    background: var(--item-bg);
    border-radius: 18px;
    padding: 1rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.3s ease;
    border: 2px solid var(--main-yellow);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

div.menu-item:active {
    transform: scale(0.97);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

div.menu-item:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-5px);
}

.item-image {
    width: 100%;
    height: 160px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 0.8rem;
    background: linear-gradient(135deg, var(--main-red), #8b0000);
    border: 2px solid var(--main-yellow);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.item-image img {
    max-width: 85%;
    max-height: 85%;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: transform 0.3s ease;
    pointer-events: none;
}

div.menu-item:hover .item-image img {
    transform: scale(1.1);
}

div.menu-item h4 {
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
    font-weight: 700;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

div.menu-item p.price {
    font-weight: 700;
    color: var(--main-yellow);
    font-size: 1.2rem;
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* ============================================ */
/* 🛍️ نافذة تفاصيل المنتج (جديدة) */
/* ============================================ */
.product-modal {
    z-index: 10001;
}

.product-modal-content {
    max-width: 500px;
    width: 95%;
    padding: 0 !important;
    overflow: hidden;
    background: #fff;
    animation: slideUpModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUpModal {
    from {
        transform: translateY(100px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.close-product-modal {
    position: absolute;
    top: 15px;
    left: 15px;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--main-red);
    z-index: 10;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    touch-action: manipulation;
}

.close-product-modal:active {
    transform: scale(0.9) rotate(90deg);
}

.product-image-wrapper {
    width: 100%;
    height: 300px;
    background: linear-gradient(135deg, var(--main-red), #8b0000);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.product-image-wrapper img {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
    filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
    animation: zoomIn 0.5s ease;
}

@keyframes zoomIn {
    from {
        transform: scale(0.5);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.product-details {
    padding: 25px;
    text-align: center;
}

.product-details h2 {
    color: var(--main-red);
    font-size: 1.8rem;
    margin-bottom: 10px;
    font-weight: 700;
    font-family: var(--main-font);
}

.product-description {
    color: #666;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 15px;
    font-family: var(--main-font);
}

.product-price-wrapper {
    background: linear-gradient(135deg, var(--main-yellow), #f39c12);
    padding: 12px 20px;
    border-radius: 50px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(254, 219, 23, 0.4);
}

.product-price {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--main-red);
    font-family: var(--main-font);
}

.currency {
    font-size: 1rem;
    color: var(--main-red);
    font-weight: 600;
}

/* محدد الكمية */
.quantity-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.quantity-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    font-family: var(--main-font);
}

.quantity-buttons {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f5f5f5;
    padding: 6px;
    border-radius: 50px;
    border: 2px solid var(--main-yellow);
}

.qty-btn-modal {
    background: var(--main-yellow);
    color: #000;
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    touch-action: manipulation;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.qty-btn-modal:active {
    transform: scale(0.9);
    background: var(--main-red);
    color: white;
}

.qty-display-modal {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--main-red);
    min-width: 40px;
    text-align: center;
    font-family: var(--main-font);
}

/* الإجمالي */
.total-price-wrapper {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 12px;
    margin: 15px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 2px dashed var(--main-yellow);
}

.total-price-wrapper span:first-child {
    color: #555;
    font-weight: 600;
    font-size: 1.1rem;
}

.total-price {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--main-red);
    font-family: var(--main-font);
}

/* زر الإضافة للسلة */
.add-to-cart-modal-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--main-red), #a50301);
    color: white;
    border: none;
    padding: 16px 25px;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(199, 3, 1, 0.4);
    font-family: var(--main-font);
    touch-action: manipulation;
    position: relative;
    overflow: hidden;
}

.add-to-cart-modal-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.add-to-cart-modal-btn:active::before {
    width: 400px;
    height: 400px;
}

.add-to-cart-modal-btn:active {
    transform: scale(0.97);
}

.add-to-cart-modal-btn.added {
    background: linear-gradient(135deg, #28a745, #20c997);
}

/* ============================================ */
/* أيقونة السلة */
/* ============================================ */
.cart-icon {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--main-yellow);
    color: #000000;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 1001;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    border: 3px solid var(--main-red);
}

.cart-icon.empty {
    opacity: 0.4;
    transform: scale(0.9);
    pointer-events: none;
}

.cart-icon:active {
    transform: scale(0.9);
}

.cart-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--main-red);
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: bold;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* ============================================ */
/* أقسام المعلومات */
/* ============================================ */
section.info-section {
    margin: 3rem auto;
    background-color: rgba(199, 3, 1, 0.9);
    border-radius: 20px;
    padding: 30px;
    text-align: center;
    border: 2px solid var(--main-yellow);
    box-shadow: var(--shadow);
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

section.info-section.animate-in {
    opacity: 1;
    transform: translateY(0);
}

section.info-section h3 {
    border-bottom: 3px solid var(--main-yellow);
    padding-bottom: 0.8rem;
    font-weight: 700;
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: var(--text-color);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

section.info-section p {
    line-height: 1.8;
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
}

.team-content {
    text-align: right;
    line-height: 1.8;
}

/* ============================================ */
/* روابط التواصل */
/* ============================================ */
.social-links {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2rem;
    flex-wrap: wrap;
}

.social-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--main-yellow);
    color: #000;
    padding: 12px 25px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: var(--shadow);
    font-family: var(--main-font);
    font-size: 1.1rem;
}

.social-btn:hover {
    background: #fff;
    color: var(--main-red);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.support-btn {
    background: var(--main-yellow);
    color: #000;
    border: none;
    padding: 12px 30px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow);
    font-family: var(--main-font);
}

.support-btn:hover {
    background: #fff;
    color: var(--main-red);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* ============================================ */
/* زر العودة لأعلى */
/* ============================================ */
#scrollToTopBtn {
    display: none;
    position: fixed;
    bottom: 30px;
    left: 30px;
    z-index: 9999;
    background: var(--main-red);
    color: #ffffff;
    border-radius: 50%;
    width: 55px;
    height: 55px;
    border: 3px solid var(--main-yellow);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.3rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    align-items: center;
    justify-content: center;
}

#scrollToTopBtn:hover {
    transform: translateY(-5px) scale(1.1);
    background: var(--main-yellow);
    color: var(--main-red);
}

/* ============================================ */
/* النوافذ المنبثقة */
/* ============================================ */
.modal {
    display: none;
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-content {
    background: linear-gradient(135deg, #fefefe, #f5f5f5);
    padding: 30px;
    border-radius: 20px;
    width: 90%;
    max-width: 500px;
    text-align: center;
    color: #000;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    position: relative;
    animation: slideDown 0.4s ease;
    max-height: 90vh;
    overflow-y: auto;
}

@keyframes slideDown {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.modal-content h2 {
    margin-top: 0;
    color: var(--main-red);
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    border-bottom: 3px solid var(--main-yellow);
    padding-bottom: 0.8rem;
}

.close {
    color: #aaa;
    position: absolute;
    top: 15px;
    left: 15px;
    font-size: 32px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    z-index: 10;
}

.close:hover {
    color: var(--main-red);
    transform: rotate(90deg);
}

/* ============================================ */
/* نافذة السلة */
/* ============================================ */
.cart-modal { max-width: 600px; }

.cart-items {
    margin: 20px 0;
    max-height: 400px;
    overflow-y: auto;
}

.cart-item {
    background: #f9f9f9;
    border: 2px solid var(--main-yellow);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.cart-item:hover {
    transform: translateX(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.cart-item-info { flex: 1; text-align: right; }

.cart-item-name {
    font-weight: 700;
    color: var(--main-red);
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.cart-item-price { color: #666; font-size: 0.95rem; }

.cart-item-quantity {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
}

.qty-btn {
    background: var(--main-yellow);
    color: #000;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.1rem;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qty-btn:hover {
    background: var(--main-red);
    color: white;
    transform: scale(1.1);
}

.qty-display {
    font-weight: bold;
    font-size: 1.1rem;
    min-width: 30px;
    text-align: center;
}

.cart-item-remove {
    background: var(--main-red);
    color: white;
    border: none;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cart-item-remove:hover {
    background: #8b0000;
    transform: scale(1.1) rotate(90deg);
}

.cart-total {
    background: var(--main-yellow);
    color: #000;
    padding: 20px;
    border-radius: 12px;
    margin: 20px 0;
    font-size: 1.3rem;
    font-weight: 700;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cart-total h3 {
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cart-actions {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.cart-actions button {
    flex: 1;
    min-width: 200px;
    background: var(--main-red);
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: var(--main-font);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cart-actions button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-clear { background: #666 !important; }
.btn-clear:hover { background: #444 !important; }
.btn-review { background: #25D366 !important; }
.btn-review:hover { background: #128C7E !important; }

/* ============================================ */
/* نافذة مراجعة الطلب */
/* ============================================ */
.review-modal {
    max-width: 700px;
    text-align: right;
}

.review-subtitle {
    color: #666;
    margin-bottom: 20px;
    font-size: 0.95rem;
    text-align: center;
}

.order-review-items {
    margin: 20px 0;
    max-height: 350px;
    overflow-y: auto;
    background: #f9f9f9;
    padding: 15px;
    border-radius: 12px;
    border: 2px solid var(--main-yellow);
}

.review-item {
    background: white;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s;
}

.review-item-info { flex: 1; text-align: right; }

.review-item-name {
    font-weight: 700;
    color: var(--main-red);
    font-size: 1.05rem;
    margin-bottom: 5px;
}

.review-item-details {
    color: #555;
    font-size: 0.9rem;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.review-item-details span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.review-item-details i { color: var(--main-yellow); }

.review-item-total {
    font-weight: 700;
    color: #000;
    font-size: 1.1rem;
    background: var(--main-yellow);
    padding: 8px 15px;
    border-radius: 50px;
    min-width: 100px;
    text-align: center;
}

.review-summary {
    background: #fff8e1;
    border: 2px solid var(--main-yellow);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #ddd;
    font-size: 1rem;
}

.summary-row:last-child { border-bottom: none; }

.total-row {
    background: var(--main-yellow);
    color: var(--main-red);
    margin: 10px -20px -20px;
    padding: 15px 20px;
    border-radius: 0 0 10px 10px;
    font-size: 1.3rem;
    font-weight: 700;
}

.review-note {
    background: #e3f2fd;
    color: #1976d2;
    padding: 12px;
    border-radius: 10px;
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
}

.review-actions {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    margin-top: 20px;
}

.review-actions button {
    flex: 1;
    min-width: 200px;
    border: none;
    padding: 14px 20px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: var(--main-font);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-back { background: #999; color: white; }
.btn-back:hover { background: #666; transform: translateY(-3px); }
.btn-confirm { background: #25D366; color: white; }
.btn-confirm:hover {
    background: #128C7E;
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
}

/* ============================================ */
/* لوحة التحكم */
/* ============================================ */
.admin-login-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
    background: var(--main-yellow);
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    font-family: var(--main-font);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.admin-panel {
    display: none;
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    overflow: auto;
}

.admin-panel-content {
    background: linear-gradient(135deg, #fefefe, #f5f5f5);
    margin: 5% auto;
    padding: 30px;
    border-radius: 20px;
    width: 85%;
    max-width: 900px;
    color: #000;
    position: relative;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.close-admin-panel {
    color: #aaa;
    position: absolute;
    top: 15px;
    left: 20px;
    font-size: 32px;
    font-weight: bold;
    cursor: pointer;
    z-index: 10;
}

.admin-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 2px solid var(--main-yellow);
    border-radius: 15px;
    background: #f9f9f9;
}

.admin-section h3 {
    margin-top: 0;
    color: var(--main-red);
    border-bottom: 2px solid var(--main-yellow);
    padding-bottom: 10px;
    margin-bottom: 20px;
}

.admin-section input,
.admin-section textarea,
.admin-section select {
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border: 2px solid #ddd;
    border-radius: 10px;
    font-size: 16px;
    font-family: var(--main-font);
}

.admin-section button {
    background: var(--main-red);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 50px;
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    margin-top: 10px;
    font-family: var(--main-font);
}

.file-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 15px 0;
}

.file-upload-label {
    display: inline-block;
    padding: 12px 25px;
    background: var(--main-yellow);
    color: #000;
    border-radius: 50px;
    cursor: pointer;
    font-weight: 600;
    margin-bottom: 10px;
}

.file-upload-preview {
    width: 200px;
    height: 200px;
    border: 3px dashed #ddd;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #fff;
}

.file-upload-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}

/* ============================================ */
/* بطاقات الإعلانات */
/* ============================================ */
.ad-card {
    background: #fff;
    border: 2px solid var(--main-yellow);
    border-radius: 15px;
    padding: 20px;
    margin: 15px 0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.ad-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.ad-card h4 {
    margin: 0 0 10px 0;
    color: var(--main-red);
    font-size: 1.3rem;
}

.ad-image {
    width: 100%;
    height: 200px;
    border-radius: 10px;
    overflow: hidden;
    margin: 15px 0;
    border: 2px solid var(--main-yellow);
}

.ad-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.ad-actions {
    margin-top: 15px;
    display: flex;
    justify-content: center;
}

.ad-actions button {
    background: var(--main-red);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 50px;
    cursor: pointer;
    font-weight: 600;
}

#adsContainer {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

#adsContainer .ad-card {
    background: var(--item-bg);
    color: white;
}

#adsContainer .ad-card h4 { color: var(--main-yellow); }

.no-ads {
    text-align: center;
    color: var(--text-color);
    grid-column: 1 / -1;
    font-size: 1.1rem;
    padding: 30px;
}

/* ============================================ */
/* الموقع الجغرافي */
/* ============================================ */
.location-icon-btn {
    position: fixed;
    bottom: 100px;
    left: 20px;
    background: var(--main-red);
    color: white;
    width: 55px;
    height: 55px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    cursor: pointer;
    z-index: 999;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    border: 3px solid var(--main-yellow);
    transition: all 0.3s ease;
}

.location-icon-btn:active {
    transform: scale(0.9);
}

.location-icon-btn.located {
    background: #28a745;
    animation: pulse 2s infinite;
}

.location-permission-modal,
.location-modal-content {
    max-width: 500px;
    padding: 40px 30px;
}

.location-icon-wrapper {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, var(--main-red), var(--main-yellow));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 25px;
    box-shadow: 0 10px 30px rgba(199, 3, 1, 0.3);
}

.location-icon-wrapper i {
    font-size: 3rem;
    color: white;
}

.permission-features {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 20px;
    margin: 20px 0;
    border: 2px solid var(--main-yellow);
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    text-align: right;
    font-size: 1rem;
    color: #333;
}

.feature-item i { color: #28a745; font-size: 1.2rem; }

.permission-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 25px 0;
}

.btn-allow {
    background: linear-gradient(135deg, var(--main-red), #a50301);
    color: white;
    border: none;
    padding: 16px 25px;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: var(--main-font);
}

.btn-deny {
    background: transparent;
    color: #666;
    border: 2px solid #ddd;
    padding: 14px 25px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--main-font);
}

.privacy-note {
    color: #888;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 15px;
    padding: 10px;
    background: #f1f3f5;
    border-radius: 10px;
}

.location-in-cart {
    background: linear-gradient(135deg, #fff8e1, #fff3c4);
    border: 2px solid var(--main-yellow);
    border-radius: 15px;
    padding: 15px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    flex-wrap: wrap;
}

.location-status-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    flex: 1;
    min-width: 200px;
}

.location-status-badge.success { color: #28a745; }
.location-status-badge.warning { color: #f39c12; }

.btn-update-location {
    background: var(--main-yellow);
    color: #000;
    border: none;
    padding: 10px 18px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--main-font);
}

.location-description-section {
    background: linear-gradient(135deg, #fff8e1, #fff3c4);
    border: 2px solid var(--main-yellow);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
}

.location-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    color: var(--main-red);
    flex-wrap: wrap;
}

.location-header h4 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--main-red);
    flex: 1;
    min-width: 180px;
}

.required-badge {
    background: var(--main-red);
    color: white;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
}

.use-saved-address-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    border: none;
    padding: 12px 18px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin-bottom: 15px;
    font-family: var(--main-font);
}

.location-input-wrapper {
    background: white;
    border: 2px solid #eee;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 15px;
}

.location-input {
    width: 100%;
    padding: 15px;
    border: none;
    font-size: 1rem;
    font-family: var(--main-font);
    outline: none;
    direction: rtl;
}

.location-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 15px;
}

.checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    color: #333;
    padding: 10px;
    background: white;
    border-radius: 8px;
    font-weight: 600;
}

.checkbox-wrapper input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: var(--main-red);
}

.gps-info-compact {
    background: rgba(255, 255, 255, 0.7);
    padding: 10px 15px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    color: #555;
    border: 1px dashed #ddd;
}

.gps-info-compact.success {
    background: #d4edda;
    color: #155724;
    border-color: #c3e6cb;
}

.gps-info-compact.success i { color: #28a745; }

.location-modal-status {
    padding: 12px;
    border-radius: 10px;
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f1f3f5;
    color: #333;
}

.location-modal-status.loading { background: #fff3cd; color: #856404; }
.location-modal-status.success { background: #d4edda; color: #155724; }
.location-modal-status.error { background: #f8d7da; color: #721c24; }

.location-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 20px 0;
}

.btn-get-location {
    background: linear-gradient(135deg, var(--main-red), #a50301);
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: var(--main-font);
}

.btn-close-location {
    background: #6c757d;
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    font-family: var(--main-font);
}

/* ============================================ */
/* إشعار إضافة للسلة */
/* ============================================ */
.cart-notification {
    position: fixed;
    top: 100px;
    right: 50%;
    transform: translateX(50%);
    background: #28a745;
    color: white;
    padding: 15px 30px;
    border-radius: 50px;
    font-weight: 700;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    z-index: 10002;
    display: none;
    animation: slideInDown 0.5s ease;
    font-family: var(--main-font);
}

@keyframes slideInDown {
    from { transform: translateX(50%) translateY(-100px); opacity: 0; }
    to { transform: translateX(50%) translateY(0); opacity: 1; }
}

.empty-cart-message {
    text-align: center;
    padding: 40px;
    color: #666;
}

.empty-cart-message i {
    font-size: 4rem;
    color: #ddd;
    margin-bottom: 20px;
}

/* ============================================ */
/* التجاوب */
/* ============================================ */
@media (max-width: 768px) {
    div.menu-items {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1rem;
    }
    
    .item-image {
        height: 130px;
    }
    
    div.menu-item h4 {
        font-size: 0.95rem;
    }
    
    div.menu-item p.price {
        font-size: 1rem;
    }
    
    .product-image-wrapper {
        height: 250px;
    }
    
    .product-details h2 {
        font-size: 1.4rem;
    }
    
    .product-price {
        font-size: 1.4rem;
    }
    
    .cart-icon {
        width: 55px;
        height: 55px;
        top: 15px;
        right: 15px;
    }
    
    .location-icon-btn {
        bottom: 90px;
        width: 50px;
        height: 50px;
    }
}

@media (max-width: 480px) {
    div.menu-items {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.8rem;
    }
    
    .item-image {
        height: 110px;
    }
    
    div.menu-item {
        padding: 0.8rem;
    }
    
    div.menu-item h4 {
        font-size: 0.85rem;
    }
    
    div.menu-item p.price {
        font-size: 0.95rem;
    }
    
    .product-modal-content {
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
    }
    
    .product-image-wrapper {
        height: 220px;
    }
    
    .product-details {
        padding: 20px;
    }
    
    .product-details h2 {
        font-size: 1.3rem;
    }
    
    .quantity-control {
        flex-direction: column;
        gap: 10px;
    }
    
    .qty-btn-modal {
        width: 50px;
        height: 50px;
    }
}

/* تحسينات اللمس */
@media (hover: none) and (pointer: coarse) {
    div.menu-item:active {
        transform: scale(0.95);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: transform 0.1s ease;
    }
    
    .qty-btn-modal:active,
    .add-to-cart-modal-btn:active {
        transform: scale(0.95);
    }
}

/* تحسينات إمكانية الوصول */
*:focus {
    outline: 3px solid var(--main-yellow);
    outline-offset: 2px;
}

/* شريط التمرير المخصص */
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: var(--main-red); border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: #a50301; }
