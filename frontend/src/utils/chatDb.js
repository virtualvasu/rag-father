const DB_NAME = 'RagfatherChatDB';
const DB_VERSION = 2; // Increment version to drop old 'messages' store logic or add 'sessions'
const STORE_NAME = 'sessions';

export const initChatDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getAllSessions = async () => {
  const db = await initChatDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by updatedAt descending
      const sorted = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(sorted);
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getSession = async (id) => {
  const db = await initChatDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveSession = async (session) => {
  const db = await initChatDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(session);

    request.onsuccess = () => {
      // Dispatch custom event to notify other components (e.g. Sidebar)
      window.dispatchEvent(new Event('chat-sessions-updated'));
      resolve(request.result);
    };
    request.onerror = (e) => {
      if (e.target.error && e.target.error.name === 'QuotaExceededError') {
        reject(new Error('QuotaExceededError'));
      } else {
        reject(e.target.error);
      }
    };
  });
};

export const deleteSession = async (id) => {
  const db = await initChatDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      window.dispatchEvent(new Event('chat-sessions-updated'));
      resolve();
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

export const clearAllSessions = async () => {
  const db = await initChatDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      window.dispatchEvent(new Event('chat-sessions-updated'));
      resolve();
    };
    request.onerror = (e) => reject(e.target.error);
  });
};
