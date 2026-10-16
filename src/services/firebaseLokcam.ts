// Dịch vụ đồng bộ ảnh LokCam Realtime
// Dán URL Realtime Database bạn vừa lấy ở Bước 1 vào đây:
export const FIREBASE_RTDB_URL = 'https://nep-lokcam-default-rtdb.asia-southeast1.firebasedatabase.app';

export interface LokCamPost {
  id: string;
  author: string;
  avatarEmoji?: string;
  image: string;
  caption: string;
  timeAgo?: string;
  timestamp: number;
  likes: number;
}

export const firebaseLokcam = {
  // 1. Gửi khoảnh khắc mới lên Firebase Realtime
  async publishPost(post: Omit<LokCamPost, 'id'>): Promise<string | null> {
    if (!FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database-name')) {
      return null;
    }

    try {
      const response = await fetch(`${FIREBASE_RTDB_URL}/lokcam_posts.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.name; // Trả về ID mới tạo từ Firebase
    } catch {
      return null;
    }
  },

  // 2. Lấy danh sách bài đăng gần nhất
  async fetchLatestPosts(): Promise<LokCamPost[]> {
    if (!FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database-name')) {
      return [];
    }

    try {
      const response = await fetch(`${FIREBASE_RTDB_URL}/lokcam_posts.json?orderBy="$key"&limitToLast=20`);
      if (!response.ok) return [];
      const data = await response.json();
      if (!data) return [];

      const list: LokCamPost[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      // Sắp xếp mới nhất lên đầu
      return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch {
      return [];
    }
  },

  // 3. Tăng lượt thích (Like) theo thời gian thực
  async incrementLike(postId: string, currentLikes: number): Promise<void> {
    if (!FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database-name')) return;
    try {
      await fetch(`${FIREBASE_RTDB_URL}/lokcam_posts/${postId}/likes.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLikes + 1),
      });
    } catch {}
  },

  // 4. Lắng nghe bài đăng mới theo thời gian thực qua Server-Sent Events (SSE)
  listenRealtime(onNewPost: (post: LokCamPost) => void): () => void {
    if (!FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database-name') || typeof EventSource === 'undefined') {
      return () => {};
    }

    try {
      const eventSource = new EventSource(`${FIREBASE_RTDB_URL}/lokcam_posts.json`);

      eventSource.addEventListener('put', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          // Trường hợp 1 bài mới được thêm (đường dẫn /xxx)
          if (payload.path && payload.path !== '/' && payload.data) {
            const id = payload.path.replace('/', '');
            const post: LokCamPost = { id, ...payload.data };
            onNewPost(post);
          }
        } catch {}
      });

      return () => {
        eventSource.close();
      };
    } catch {
      return () => {};
    }
  },
};