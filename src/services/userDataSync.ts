// DỊCH VỤ ĐỒNG BỘ DỮ LIỆU & LẮNG NGHE TỰ ĐỘNG HÓA IPHONE
export const FIREBASE_RTDB_URL = 'https://nep-lokcam-default-rtdb.asia-southeast1.firebasedatabase.app';

export interface UserAppData {
  transactions: any[];
  scheduleItems: any[];
  monthlyLimit: number;
}

export const userDataSync = {
  // 1. Tải dữ liệu ban đầu
  async loadUserData(userId: string): Promise<UserAppData | null> {
    const localCache = localStorage.getItem(`nep_data_${userId}`);
    let initialData: UserAppData | null = localCache ? JSON.parse(localCache) : null;

    if (!FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database')) {
      return initialData;
    }

    try {
      const res = await fetch(`${FIREBASE_RTDB_URL}/users/${userId}.json`);
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData) {
          const merged: UserAppData = {
            transactions: cloudData.transactions ? Object.values(cloudData.transactions) : [],
            scheduleItems: cloudData.scheduleItems || [],
            monthlyLimit: cloudData.monthlyLimit || 5000000,
          };
          localStorage.setItem(`nep_data_${userId}`, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}

    return initialData;
  },

  // 2. Lưu dữ liệu từ app lên cloud
  async syncUserData(userId: string, data: UserAppData): Promise<void> {
    localStorage.setItem(`nep_data_${userId}`, JSON.stringify(data));
    if (!FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database')) return;

    try {
      await fetch(`${FIREBASE_RTDB_URL}/users/${userId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}
  },

  // 3. LẮNG NGHE BIẾN ĐỘNG REALTIME TỪ PHÍM TẮT IPHONE (SSE)
  listenAutoTransactions(userId: string, onNewTx: (tx: any) => void): () => void {
    if (!FIREBASE_RTDB_URL || !userId) return () => {};

    try {
      const es = new EventSource(`${FIREBASE_RTDB_URL}/users/${userId}/transactions.json`);

      es.addEventListener('put', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          // Khi iPhone bắn một transaction mới vào Firebase
          if (payload.path && payload.path !== '/' && payload.data) {
            onNewTx(payload.data);
          } else if (payload.data && typeof payload.data === 'object' && payload.data.amount) {
            onNewTx(payload.data);
          }
        } catch {}
      });

      return () => es.close();
    } catch {
      return () => {};
    }
  }
};