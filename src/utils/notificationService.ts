// DỊCH VỤ THÔNG BÁO THÔNG MINH CHO NẾP HUB
class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const res = await Notification.requestPermission();
      this.permission = res;
      return res === 'granted';
    } catch {
      return false;
    }
  }

  send(title: string, body: string, icon = '✨') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (this.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch {}
  }

  // THUẬT TOÁN QUÉT VÀ BẮN THÔNG BÁO LỊCH TRÌNH THỜI GIAN THỰC
  checkScheduleNotifications(scheduleItems: any[]) {
    if (!Array.isArray(scheduleItems) || scheduleItems.length === 0) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Lọc các lịch trình chưa xong trong ngày hôm nay
    const todayItems = scheduleItems.filter(
      (item) => item?.dateStr === todayStr && !item?.completed && item?.startTime
    );

    todayItems.forEach((item) => {
      const [hStr, mStr] = String(item.startTime).split(':');
      const itemMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      const diff = itemMinutes - currentMinutes;

      // 1. Nhắc trước 15 phút
      const remindBefore = Number(item.remindBefore) || 15;
      const remindKey = `nep_alert_${item.id}_${todayStr}_remind`;
      if (diff > 0 && diff <= remindBefore && !sessionStorage.getItem(remindKey)) {
        this.send(
          `⏰ Sắp đến giờ: ${item.title}`, `Còn ${diff} phút nữa (Bắt đầu lúc ${item.startTime}). Chuẩn bị nhé!`,
          '⏰'
        );
        sessionStorage.setItem(remindKey, 'true');
      }

      // 2. Thông báo đúng giờ
      const startKey = `nep_alert_${item.id}_${todayStr}_start`;
      if (diff <= 0 && diff >= -5 && !sessionStorage.getItem(startKey)) {
        this.send(
          `🔔 Đến giờ hẹn: ${item.title}`, `Đã đến ${item.startTime}. Hãy bắt đầu công việc và tích hoàn thành khi xong!`,
          '🔔'
        );
        sessionStorage.setItem(startKey, 'true');
      }
    });
  }

  checkInactivity(lastActiveTime: number) {
    if (!lastActiveTime) return;
    const diffHours = (Date.now() - lastActiveTime) / (1000 * 60 * 60);
    if (diffHours >= 12 && !sessionStorage.getItem('nep_inactivity_notified')) {
      this.send('🌿 Nếp nhớ bạn!', 'Hôm nay bạn đã ghi chép chi tiêu và công việc chưa?', '🌿');
      sessionStorage.setItem('nep_inactivity_notified', 'true');
    }
  }

  checkBudgetThreshold(spent: number, limit: number) {
    if (!limit || limit <= 0) return;
    const ratio = spent / limit;
    if (ratio >= 0.85 && !sessionStorage.getItem('nep_budget_warned')) {
      this.send('⚠️ Chú ý ngân sách!', `Bạn đã tiêu ${(ratio * 100).toFixed(0)}% hạn mức tháng. Hãy tiêu vừa tay nhé!`, '⚠️');
      sessionStorage.setItem('nep_budget_warned', 'true');
    }
  }

  checkDailyRoutine() {
    const hour = new Date().getHours();
    if (hour === 12 && !sessionStorage.getItem('nep_lunch_notified')) {
      this.send('🍱 Đến giờ ăn trưa rồi!', 'Dừng tay nghỉ ngơi và ăn trưa đúng giờ nhé.', '🍱');
      sessionStorage.setItem('nep_lunch_notified', 'true');
    }
  }

  checkEveningComfortRoutine() {
    const hour = new Date().getHours();
    if (hour === 21 && !sessionStorage.getItem('nep_evening_notified')) {
      this.send('🌙 Đêm đã về', 'Thả lỏng cơ thể, tổng kết ngày và bốc một quẻ bài thư giãn nhé.', '🌙');
      sessionStorage.setItem('nep_evening_notified', 'true');
    }
  }
}

export const notifier = new NotificationService();