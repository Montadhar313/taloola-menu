/**
 * Service Worker لتعلولة - مطعم الوجبات السريعة
 * يدعم PWA مع caching استراتيجي وتحسين الأداء
 */

const CACHE_NAME = 'taloola-v1';
const STATIC_CACHE = 'taloola-static-v1';
const DYNAMIC_CACHE = 'taloola-dynamic-v1';
const IMAGE_CACHE = 'taloola-images-v1';

// الموارد الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/advanced-image-loader.js',
  '/manifest.json',
  '/assets/images/Logo.gif'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.log('[SW] Cache install error:', err);
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker وتنظيف الـ caches القديمة
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// استراتيجية التخزين المؤقت للطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الطلبات غير الآمنة أو من نطاقات أخرى
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // التعامل مع طلبات الصور - استراتيجية Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // إرجاع النسخة المخزنة مع تحديث في الخلفية
          event.waitUntil(updateImageCache(request));
          return cachedResponse;
        }
        // جلب الصورة من الشبكة وتخزينها
        return fetchAndCache(request, IMAGE_CACHE);
      }).catch(() => {
        // صورة افتراضية في حالة الفشل
        return caches.match('/assets/images/Logo.gif');
      })
    );
    return;
  }

  // التعامل مع صفحات HTML - استراتيجية Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      }).catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // التعامل مع CSS و JS - استراتيجية Cache First
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      }).catch(() => {
        if (request.destination === 'style') {
          return new Response('', { status: 200 });
        }
      })
    );
    return;
  }

  // الطلبات الأخرى - استراتيجية Network First مع Fallback
  event.respondWith(
    fetch(request).then((response) => {
      const responseClone = response.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});

// دالة تحديث مخزن الصور في الخلفية
async function updateImageCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response);
    }
  } catch (error) {
    // تجاهل الأخطاء في التحديث الخلفي
  }
}

// دالة الجلب والتخزين
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// الاستماع لرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // تنظيف المخزن المؤقت عند الطلب
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});

// خلفية المزامنة (اختياري - يتطلب دعم المتصفح)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // منطق مزامنة الطلبات عند الاتصال بالإنترنت
  console.log('[SW] Syncing orders...');
}

// معالجة الإشعارات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/tracking/order-tracking.html')
  );
});
