// Dịch vụ đồng bộ dữ liệu riêng tư theo Google User ID
// Dán URL Realtime Database của bạn vào đây:
const FIREBASE_RTDB_URL = 'https://nep-lokcam-default-rtdb.asia-southeast1.firebasedatabase.app';

export interface UserAppData {
  transactions: any[];
  scheduleItems: any[];
  monthlyLimit: number;
}

export const userDataSync = {
  // 1. Tải dữ liệu của người dùng khi đăng nhập
  async loadUserData(userId: string): Promise<UserAppData | null> {
    // Ưu tiên đọc từ cache riêng của máy trước để mở app tức thì
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
            transactions: cloudData.transactions || [],
            scheduleItems: cloudData.scheduleItems || [],
            monthlyLimit: cloudData.monthlyLimit || 5000000,
          };
          // Cập nhật lại cache offline
          localStorage.setItem(`nep_data_${userId}`, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}

    return initialData;
  },

  // 2. Lưu dữ liệu lên Cloud khi có giao dịch hoặc lịch trình mới
  async syncUserData(userId: string, data: UserAppData): Promise<void> {
    // Luôn lưu offline vào localStorage theo userId trước
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
};