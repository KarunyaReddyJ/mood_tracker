const BACKEND = process.env.NEXT_PUBLIC_STORAGE_BACKEND;

const constants = {
    sessionStorage : 'sessionStorage',
    indexedDB : 'indexeddb' ,
    db : 'db',
    DEV : 'DEV',
    PROD : 'PROD',
    backend: BACKEND || this.sessionStorage,
}

export default constants