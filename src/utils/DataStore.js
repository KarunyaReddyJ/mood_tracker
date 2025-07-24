const { default: constants } = require("./constants");
import { SessionStorageBackend } from "./SessionStorageBackend";
import { IndexedDBBackend } from "./IndexedDBBackend";
export default class DataStore {
  constructor(type) {
    this.type = type;
    console.log('Datasource: ',type)
    switch (type) {
      case constants.sessionStorage:
        this.backend = new SessionStorageBackend();
        break;
      case constants.indexedDB:
        this.backend = new IndexedDBBackend('AppStore', 'defaultStore');
        break;
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }

  async get(key, defaultValue = null) {
    const val = await this.backend.get(key);
    return val !== null ? val : defaultValue;
  }

  async set(key, val) {
    await this.backend.set(key, val);
  }
}
