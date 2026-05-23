const DB_NAME = 'durianflow_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_logs';

/**
 * Opens (and initializes if necessary) the IndexedDB database.
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported or accessible in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open IndexedDB.'));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Saves an activity log record locally for offline queuing.
 */
export async function saveOfflineLog(logData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      ...logData,
      pendingSync: true,
      createdAt: new Date().toISOString()
    };

    const request = store.add(record);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error || new Error('Failed to save log offline.'));
  });
}

/**
 * Retrieves all currently queued offline logs.
 */
export async function getOfflineLogs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error || new Error('Failed to retrieve offline logs.'));
  });
}

/**
 * Deletes a synced offline log from IndexedDB.
 */
export async function deleteOfflineLog(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error || new Error('Failed to delete offline log.'));
  });
}
