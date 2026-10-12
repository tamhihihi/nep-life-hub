import { ComfortMessage } from '../types';

export const EVENING_MESSAGES = {
  unwind: [
    {
      id: 'u1',
      tag: 'HẠ CÁNH AN TOÀN',
      title: 'Hôm nay bạn vất vả nhiều rồi!',
      content: 'Bỏ hết deadline và sự bận rộn ngoài cửa nhé. Về đến nhà rồi, bạn chỉ cần là chính mình và nghỉ ngơi thôi.',
      icon: '🛋️',
    },
    {
      id: 'u2',
      tag: 'VỖ VỀ',
      title: 'Bạn đã làm rất tốt hôm nay',
      content: 'Dù mọi việc có trọn vẹn 100% hay không, việc bạn kiên trì đến tận giờ này đã là một điều đáng tự hào rồi.',
      icon: '🍵',
    },
    {
      id: 'u3',
      tag: 'THẢ LỎNG',
      title: 'Đừng nghiêm khắc với bản thân quá nhé',
      content: 'Thế giới ngoài kia để mai tính. Tối nay cho phép bản thân được lười biếng một chút, ăn món mình thích nha.',
      icon: '🤍',
    },
  ],
  cheerful: [
    {
      id: 'c1',
      tag: 'VITAMIN CƯỜI',
      title: 'Tự hào lên xem nào!',
      content: 'Hôm nay lại thêm một ngày bạn sống sót qua bao nhiêu cuộc họp và deadline. Điểm thưởng kiên cường: 10/10!',
      icon: '🎉',
    },
    {
      id: 'c2',
      tag: 'NẠP PIN',
      title: 'Tin nhắn gửi tới bạn',
      content: 'Chẳng cần phải trở thành ai đó vĩ đại mỗi ngày, chỉ cần bạn vui vẻ và khỏe mạnh tối nay là đủ đỉnh rồi!',
      icon: '⚡',
    },
    {
      id: 'c3',
      tag: 'CHILL TIME',
      title: 'Não bộ ơi, tan làm thôi!',
      content: 'Bật một bài nhạc Lofi, xem một tập phim vui nhộn. Nụ cười của bạn là thứ xứng đáng được ưu tiên hàng đầu đêm nay.',
      icon: '🎵',
    },
  ],
  goodnight: [
    {
      id: 'g1',
      tag: 'CHÚC NGỦ NGON',
      title: 'Khép lại âu lo, ngủ ngoan nhé!',
      content: 'Đừng nghĩ về chuyện của ngày mai nữa. Giấc ngủ ngon đêm nay sẽ chữa lành mọi mệt mỏi của ngày hôm nay.',
      icon: '🌙',
    },
    {
      id: 'g2',
      tag: 'BÌNH YÊN',
      title: 'Chiếc giường êm đang đợi bạn kìa',
      content: 'Đặt điện thoại xuống, đắp chăn thật ấm. Chúc bạn có những giấc mơ thật dịu dàng và một sớm mai tươi sáng.',
      icon: '💤',
    },
  ],
};

export function getCurrentEveningComfort(): {
  slot: 'unwind' | 'cheerful' | 'goodnight' | null;
  message: ComfortMessage | null;
} {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const totalMinutes = hour * 60 + minute;

  // 19:30 - 20:30 (1170 - 1230 phút)
  if (totalMinutes >= 1170 && totalMinutes <= 1230) {
    const list = EVENING_MESSAGES.unwind;
    return { slot: 'unwind', message: list[Math.floor(Math.random() * list.length)] };
  }

  // 21:15 - 22:30 (1275 - 1350 phút)
  if (totalMinutes >= 1275 && totalMinutes <= 1350) {
    const list = EVENING_MESSAGES.cheerful;
    return { slot: 'cheerful', message: list[Math.floor(Math.random() * list.length)] };
  }

  // 23:00 - 23:45 (1380 - 1425 phút)
  if (totalMinutes >= 1380 && totalMinutes <= 1425) {
    const list = EVENING_MESSAGES.goodnight;
    return { slot: 'goodnight', message: list[Math.floor(Math.random() * list.length)] };
  }

  return { slot: null, message: null };
}
