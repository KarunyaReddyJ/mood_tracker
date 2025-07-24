export class SessionStorageBackend {
  async get(key) {
    return sessionStorage.getItem(key);
  }

  async set(key, val) {
    sessionStorage.setItem(key, val);
  }
}
