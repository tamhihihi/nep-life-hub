import { getCurrentEveningComfort } from '../data/eveningComfortMessages';

class NotificationService {
  private hasPermission = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Web Notification.');
      return false;
    }
    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  send(title: string, body: string, icon = '🔔', tag = 'nep-noti') {
    if (!this.hasPermission) return;
    try {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        tag,
      });
    } catch {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, { body, tag });
        });
      }
    }
  }

  checkBudgetThreshold(spent: number, limit: number) {
    if (limit <= 0) return;
    const ratio = spent / limit;
    const notifiedKey = `notified_threshold_${new Date().getMonth()}`;
    const lastNotified = localStorage.getItem(notifiedKey);

    if (ratio >= 1.0 && lastNotified !== '100') {
      this.send(
        '🚨 Chạm trần chi tiêu!',
        `Bạn đã tiêu hết 100% hạn mức tháng (${spent.toLocaleString()}đ / ${limit.toLocaleString()}đ).`,
        '🚨',
        'budget-100'
      );
      localStorage.setItem(notifiedKey, '100');
    } else if (ratio >= 0.9 && lastNotified !== '90' && lastNotified !== '100') {
      this.send(
        '⚠️ Sắp chạm trần ngân sách (90%)',
        `Bạn đã dùng 90% hạn mức tháng. Còn lại: ${(limit - spent).toLocaleString()}đ.`,
        '⚠️',
        'budget-90'
      );
      localStorage.setItem(notifiedKey, '90');
    } else if (ratio >= 0.8 && !lastNotified) {
      this.send(
        '📊 Cảnh báo hạn mức (80%)',
        `Dòng tiền đã chạm 80% hạn mức tháng. Chú ý các khoản chi lớn nhé!`,
        '📊',
        'budget-80'
      );
      localStorage.setItem(notifiedKey, '80');
    }
  }

  checkInactivity(lastActiveTimestamp: number) {
    const now = Date.now();
    const hoursPassed = (now - lastActiveTimestamp) / (1000 * 60 * 60);

    if (hoursPassed >= 48) {
      this.send(
        '👋 Đã 2 ngày bạn chưa ghé Nếp',
        'Vào cập nhật chi tiêu và lịch trình để không bị sót việc bạn nhé!',
        '👋',
        'inactive-reminder'
      );
    }
  }

  checkDailyRoutine() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dateStr = now.toISOString().split('T')[0];

    const morningKey = `noti_morning_${dateStr}`;
    if (hour >= 8 && hour < 9 && !localStorage.getItem(morningKey)) {
      this.send(
        '☀️ Chào buổi sáng!',
        'Kiểm tra tuyến Metro lịch trình hôm nay để bắt đầu ngày mới thật năng suất nhé.',
        '☀️',
        'routine-morning'
      );
      localStorage.setItem(morningKey, 'sent');
    }

    const lunchKey = `noti_lunch_${dateStr}`;
    if (hour >= 11 && minute >= 30 && hour < 13 && !localStorage.getItem(lunchKey)) {
      this.send(
        '🍜 Trưa nay ăn gì ta?',
        '11:30 rồi! Mở hòm cơm trưa CS:GO để xua tan nỗi phân vân ăn trưa nào.',
        '🍜',
        'routine-lunch'
      );
      localStorage.setItem(lunchKey, 'sent');
    }

    const eveningKey = `noti_evening_${dateStr}`;
    if (hour >= 20 && hour < 22 && !localStorage.getItem(eveningKey)) {
      this.send(
        '🌙 Tối nay làm gì chill?',
        'Bốc một lá bài Tarot đêm, bật tiếng mưa Lofi và kiểm tra lại sổ chi tiêu hôm nay nào.',
        '🌙',
        'routine-evening'
      );
      localStorage.setItem(eveningKey, 'sent');
    }
  }

  checkEveningComfortRoutine() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const { slot, message } = getCurrentEveningComfort();

    if (!slot || !message) return;

    const storageKey = `noti_evening_comfort_${slot}_${dateStr}`;
    if (!localStorage.getItem(storageKey)) {
      this.send(
        `${message.icon} ${message.title}`,
        message.content,
        message.icon,
        `evening-comfort-${slot}`
      );
      localStorage.setItem(storageKey, 'sent');
    }
  }
}

export const notifier = new NotificationService();
