const DB_NAME = 'nep_lokcam_database_v1';
const STORE_NAME = 'moments_photos';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePhotoToDB = async (id: string, imageBase64: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, image: imageBase64 });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Lỗi khi lưu ảnh vào IndexedDB:', err);
  }
};

export const getPhotoFromDB = async (id: string): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.image : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

export const getAllPhotosFromDB = async (): Promise<Record<string, string>> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<string, string> = {};
        (req.result || []).forEach((item: { id: string; image: string }) => {
          result[item.id] = item.image;
        });
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
};