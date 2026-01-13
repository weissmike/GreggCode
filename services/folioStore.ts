import { FolioGuide } from '../types';

const DB_NAME = 'gregg-folio';
const DB_VERSION = 1;
const STORE_NAME = 'guides';

interface StoredGuide {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  blob: Blob;
}

const openDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!window.indexedDB) {
    reject(new Error('IndexedDB unavailable'));
    return;
  }
  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const loadUserGuides = async (): Promise<FolioGuide[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const guides = (request.result as StoredGuide[]).map((stored) => ({
        id: stored.id,
        title: stored.title,
        description: stored.description,
        createdAt: stored.createdAt,
        type: 'user' as const
      }));
      resolve(guides);
    };

    request.onerror = () => reject(request.error);
  });
};

export const saveUserGuide = async (guide: FolioGuide, blob: Blob): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const stored: StoredGuide = {
      id: guide.id,
      title: guide.title,
      description: guide.description,
      createdAt: guide.createdAt || new Date().toISOString(),
      blob
    };

    const request = store.put(stored);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadUserGuideBlob = async (id: string): Promise<Blob | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const stored = request.result as StoredGuide | undefined;
      resolve(stored?.blob || null);
    };

    request.onerror = () => reject(request.error);
  });
};
