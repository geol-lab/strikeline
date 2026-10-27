/**
 * storage.js — local persistence in IndexedDB.
 * Map images are too large for localStorage, so the project and the
 * map hand-off between pages both live here. Nothing leaves the device.
 */

const DB_NAME = 'strikeline';
const STORE = 'kv';

function open() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req && req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export const put = (key, value) => run('readwrite', (s) => s.put(value, key));
export const get = (key) => run('readonly', (s) => s.get(key));
export const del = (key) => run('readwrite', (s) => s.delete(key));

/** Key used to pass a freshly chosen map from the landing page to the workspace. */
export const PENDING_MAP = 'pending-map';
