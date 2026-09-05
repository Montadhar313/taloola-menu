/**
 * IndexedDB Cache Layer لتعلولة
 * يحسن الأداء من خلال تخزين البيانات محلياً
 * مع الحفاظ على الاتصال بـ Firebase
 */

class TaloolaCache {
    constructor() {
        this.dbName = 'TaloolaDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.log('[Cache] IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('[Cache] IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // إنشاء مخازن البيانات
                if (!db.objectStoreNames.contains('menu')) {
                    db.createObjectStore('menu', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('ads')) {
                    db.createObjectStore('ads', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('orders')) {
                    db.createObjectStore('orders', { keyPath: 'orderId', autoIncrement: true });
                }

                console.log('[Cache] IndexedDB stores created');
            };
        });
    }

    // حفظ البيانات
    async save(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب البيانات
    async get(storeName, key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب جميع البيانات من متجر
    async getAll(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // حذف بيانات
    async delete(storeName, key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // مسح جميع البيانات
    async clear(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // حفظ القائمة مع الطوابع الزمنية
    async saveMenu(items, timestamp = Date.now()) {
        const menuData = { items, timestamp, version: 'v1' };
        await this.save('menu', { id: 'current', ...menuData });
        console.log('[Cache] Menu saved with', items.length, 'items');
    }

    // جلب القائمة المحفوظة
    async getMenu() {
        const menuData = await this.get('menu', 'current');
        if (!menuData) return null;
        
        // التحقق من أن البيانات حديثة (أقل من ساعة)
        const oneHour = 60 * 60 * 1000;
        const isExpired = Date.now() - menuData.timestamp > oneHour;
        
        return {
            items: menuData.items,
            isExpired,
            timestamp: menuData.timestamp
        };
    }

    // حفظ التصنيفات
    async saveCategories(categories, timestamp = Date.now()) {
        await this.save('settings', { key: 'categories', data: categories, timestamp });
        console.log('[Cache] Categories saved');
    }

    // جلب التصنيفات
    async getCategories() {
        const data = await this.get('settings', 'categories');
        if (!data) return null;
        
        const oneHour = 60 * 60 * 1000;
        const isExpired = Date.now() - data.timestamp > oneHour;
        
        return {
            data: data.data,
            isExpired,
            timestamp: data.timestamp
        };
    }

    // حفظ الطلب محلياً للمزامنة اللاحقة
    async saveOrderLocally(order) {
        order.synced = false;
        order.savedAt = Date.now();
        await this.save('orders', order);
        console.log('[Cache] Order saved locally for sync');
        return order;
    }

    // جلب الطلبات غير المتزامنة
    async getPendingOrders() {
        const allOrders = await this.getAll('orders');
        return allOrders.filter(order => !order.synced);
    }

    // تحديث حالة المزامنة
    async markOrderSynced(orderId) {
        const order = await this.get('orders', orderId);
        if (order) {
            order.synced = true;
            order.syncedAt = Date.now();
            await this.save('orders', order);
        }
    }

    // تنظيف الطلبات القديمة المتزامنة
    async cleanupOldOrders(daysToKeep = 7) {
        const allOrders = await this.getAll('orders');
        const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        
        for (const order of allOrders) {
            if (order.synced && order.savedAt < cutoffDate) {
                await this.delete('orders', order.orderId);
            }
        }
        console.log('[Cache] Old orders cleaned up');
    }
}

// إنشاء نسخة عامة
window.taloolaCache = new TaloolaCache();

// دوال مساعدة للاستخدام السريع
window.cacheMenu = (items) => window.taloolaCache.saveMenu(items);
window.getCachedMenu = () => window.taloolaCache.getMenu();
window.cacheCategories = (cats) => window.taloolaCache.saveCategories(cats);
window.getCachedCategories = () => window.taloolaCache.getCategories();
window.saveOrderOffline = (order) => window.taloolaCache.saveOrderLocally(order);
window.getPendingOrders = () => window.taloolaCache.getPendingOrders();
