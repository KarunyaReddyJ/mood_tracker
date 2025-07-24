export class IndexedDBBackend {
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async _getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        db.createObjectStore(this.storeName);
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async get(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key, val) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(val, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
