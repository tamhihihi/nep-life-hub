import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Heart, 
  Send, 
  X, 
  RefreshCw, 
  Image as ImageIcon, 
  RotateCcw, 
  Trash2,
  UserPlus,
  Share2,
  Check,
  Copy,
  Users,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../../utils/soundEngine';

export interface MomentPost {
  id: string;
  author: string;
  avatarEmoji?: string;
  image: string;
  caption: string;
  timeAgo: string;
  likes: number;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatar: string;
  isMe?: boolean;
}

const DEFAULT_FRIENDS: FriendProfile[] = [
  { id: 'f_me', name: 'Tôi (Tâm)', avatar: '😎', isMe: true },
  { id: 'f_love', name: 'Người Thương', avatar: '❤️' },
  { id: 'f_bestie', name: 'Cạ Cứng', avatar: '🍻' },
];

const DEFAULT_MOMENTS: MomentPost[] = [
  {
    id: 'm1',
    author: 'Người Thương',
    avatarEmoji: '❤️',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    caption: 'Đang ăn cơm tấm nè, nhớ ăn trưa nha!',
    timeAgo: '15 phút trước',
    likes: 3,
  },
  {
    id: 'm2',
    author: 'Tôi (Tâm)',
    avatarEmoji: '😎',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    caption: 'Tô phở cứu đói buổi trưa tại văn phòng.',
    timeAgo: '2 giờ trước',
    likes: 5,
  },
];

export const NepMoments: React.FC = () => {
  // --- STATE BÀI ĐĂNG LOKCAM ---
  const [moments, setMoments] = useState<MomentPost[]>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_moments_v2');
      return saved ? JSON.parse(saved) : DEFAULT_MOMENTS;
    } catch {
      return DEFAULT_MOMENTS;
    }
  });

  // --- STATE DANH SÁCH BẠN BÈ & HỒ SƠ CỦA BẠN ---
  const [friends, setFriends] = useState<FriendProfile[]>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_friends_v2');
      return saved ? JSON.parse(saved) : DEFAULT_FRIENDS;
    } catch {
      return DEFAULT_FRIENDS;
    }
  });

  const [myProfile, setMyProfile] = useState<{ name: string; avatar: string }>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_my_profile_v2');
      return saved ? JSON.parse(saved) : { name: 'Tâm', avatar: '😎' };
    } catch {
      return { name: 'Tâm', avatar: '😎' };
    }
  });

  // State Modal Bạn Bè & Link Mời
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // State Lời mời kết bạn tự động qua Link
  const [pendingFriendInvite, setPendingFriendInvite] = useState<{ name: string; avatar: string } | null>(null);

  // State Camera & Đăng ảnh
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<FriendProfile>(() => friends[0] || DEFAULT_FRIENDS[0]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // TỰ ĐỘNG BẮT ĐƯỜNG LINK KẾT BẠN KHI MỞ TRANG (?add_friend=Ten&avatar=Emoji)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const friendName = params.get('add_friend');
    const friendAvatar = params.get('avatar') || '👋';

    if (friendName && friendName.trim() !== '') {
      // Kiểm tra xem đã kết bạn chưa
      const exists = friends.some((f) => f.name.toLowerCase() === friendName.toLowerCase());
      if (!exists && friendName !== myProfile.name) {
        setPendingFriendInvite({
          name: decodeURIComponent(friendName),
          avatar: decodeURIComponent(friendAvatar),
        });
      }
    }
  }, []);

  // Chấp nhận lời mời kết bạn từ link
  const handleAcceptFriendInvite = () => {
    if (!pendingFriendInvite) return;
    sounds.playChime();

    const newFriend: FriendProfile = {
      id: `friend_${Date.now()}`,
      name: pendingFriendInvite.name,
      avatar: pendingFriendInvite.avatar,
    };

    const updated = [...friends, newFriend];
    setFriends(updated);
    localStorage.setItem('nep_lokcam_friends_v2', JSON.stringify(updated));

    confetti({ particleCount: 75, spread: 70, origin: { y: 0.5 } });
    setPendingFriendInvite(null);

    // Xóa param trên URL để link sạch sẽ
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

  // Tạo đường link mời kết bạn
  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?add_friend=${encodeURIComponent(myProfile.name)}&avatar=${encodeURIComponent(myProfile.avatar)}`;
  };

  // Sao chép link mời
  const handleCopyInviteLink = () => {
    sounds.playKeypadTap();
    const url = getInviteUrl();
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2200);
  };

  // Chia sẻ link mời trực tiếp (Zalo, Messenger, AirDrop...)
  const handleNativeShare = async () => {
    sounds.playKeypadTap();
    const url = getInviteUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kết bạn trên LokCam cùng mình nhé!',
          text: `👋 ${myProfile.avatar} ${myProfile.name} mời bạn tham gia mạng xã hội ảnh tức thì LokCam trên Nếp Hub:`,
          url,
        });
      } catch {
        handleCopyInviteLink();
      }
    } else {
      handleCopyInviteLink();
    }
  };

  // Xóa bạn bè
  const handleDeleteFriend = (id: string) => {
    const updated = friends.filter((f) => f.id !== id);
    setFriends(updated);
    localStorage.setItem('nep_lokcam_friends_v2', JSON.stringify(updated));
  };

  // Khởi động Camera khi mở Modal
  useEffect(() => {
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    if (!isCameraOpen || capturedImage) {
      stopStream();
      return;
    }

    setCameraError(null);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Đang mở qua Wi-Fi HTTP. Bấm biểu tượng Ảnh ở góc trái để chụp/chọn ảnh từ máy!');
      return;
    }

    let active = true;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (active) {
          setCameraError('Chưa cấp quyền Camera. Bấm icon Ảnh bên dưới để chọn ảnh sẵn có!');
        }
      });

    return () => {
      active = false;
      stopStream();
    };
  }, [isCameraOpen, facingMode, capturedImage]);

  // Chụp ảnh vuông 600x600
  const handleCapture = () => {
    if (!videoRef.current) return;
    sounds.playKeypadTap();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minDim = Math.min(video.videoWidth || 600, video.videoHeight || 600);
    const sx = ((video.videoWidth || 600) - minDim) / 2;
    const sy = ((video.videoHeight || 600) - minDim) / 2;

    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
  };

  // Chọn ảnh từ máy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sounds.playKeypadTap();

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const size = 600;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  };

  // Đăng ảnh LokCam
  const handlePost = () => {
    if (!capturedImage) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} Hôm nay`;

    const newPost: MomentPost = {
      id: `lok_${Date.now()}`,
      author: selectedAuthor.name,
      avatarEmoji: selectedAuthor.avatar,
      image: capturedImage,
      caption: caption.trim() || 'Khoảnh khắc mới vừa chụp ✨',
      timeAgo: timeStr,
      likes: 1,
    };

    const updated = [newPost, ...moments];
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v2', JSON.stringify(updated));

    sounds.playChime();
    confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });

    setCapturedImage(null);
    setCaption('');
    setIsCameraOpen(false);
  };

  const handleLike = (id: string) => {
    sounds.playChime();
    const updated = moments.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m));
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v2', JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    const updated = moments.filter((m) => m.id !== id);
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v2', JSON.stringify(updated));
  };

  return (
    <div className="space-y-4 animate-ios-fade">
      {/* THÔNG BÁO TỰ ĐỘNG NHẬN ĐƯỢC LỜI MỜI KẾT BẠN QUA LINK */}
      {pendingFriendInvite && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-[28px] p-4 text-black shadow-lg animate-ios-sheet space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center text-2xl shadow-sm">
              {pendingFriendInvite.avatar}
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/70 block">
                Lời mời kết bạn LokCam
              </span>
              <h4 className="text-sm font-black text-black">
                {pendingFriendInvite.name} muốn kết bạn cùng bạn!
              </h4>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPendingFriendInvite(null)}
              className="py-2.5 rounded-xl bg-black/15 font-bold text-xs hover:bg-black/25 transition cursor-pointer"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleAcceptFriendInvite}
              className="py-2.5 rounded-xl bg-[#18181B] text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Sparkles size={14} className="text-amber-400" /> Đồng ý kết bạn
            </button>
          </div>
        </div>
      )}

      {/* HEADER LOKCAM */}
      <div className="flex justify-between items-center px-1">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
            LokCam · Ảnh Tức Thì Bạn Thân
          </span>
          <h2 className="text-2xl font-black text-[#18181B]">LokCam</h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Nút Thêm Bạn Bè Qua Link */}
          <button
            type="button"
            onClick={() => setIsFriendModalOpen(true)}
            className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300/80 rounded-2xl text-xs font-black flex items-center gap-1 active:scale-95 transition cursor-pointer"
            title="Thêm bạn qua link chia sẻ"
          >
            <UserPlus size={14} className="text-amber-700" />
            <span>+ Bạn bè ({friends.length})</span>
          </button>

          {/* Nút Chụp LokCam */}
          <button
            type="button"
            onClick={() => {
              setCapturedImage(null);
              setIsCameraOpen(true);
            }}
            className="px-3.5 py-2 bg-[#18181B] hover:bg-black text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Camera size={14} className="text-amber-400" /> Chụp
          </button>
        </div>
      </div>

      {/* DANH SÁCH BÀI ĐĂNG LOKCAM VUÔNG 1:1 CHUẨN IOS */}
      <div className="space-y-4">
        {moments.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[34px] p-4 shadow-sm border border-neutral-200/80 space-y-3"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-[#18181B] flex items-center gap-1.5">
                <span className="text-sm">{item.avatarEmoji || '✨'}</span>
                {item.author}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">{item.timeAgo}</span>
            </div>

            {/* Khung Ảnh Vuông Chuẩn LokCam */}
            <div className="relative w-full aspect-square rounded-[26px] overflow-hidden bg-neutral-900 shadow-inner">
              <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-x-3 bottom-3 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-center">
                <p className="text-xs font-bold text-white leading-relaxed">{item.caption}</p>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <button
                type="button"
                onClick={() => handleLike(item.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 font-black text-xs active:scale-90 transition cursor-pointer"
              >
                <Heart size={14} className="fill-rose-500" /> {item.likes}
              </button>

              {moments.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-neutral-300 hover:text-rose-500 transition cursor-pointer"
                  title="Xóa bài"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL QUẢN LÝ BẠN BÈ & LINK CHIA SẺ ================= */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade">
          <div className="w-full max-w-sm bg-[#F7F7F5] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-ios-sheet max-h-[90vh] overflow-y-auto no-scrollbar space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                  LokCam Friends
                </span>
                <h3 className="text-lg font-black text-[#18181B]">Thêm Bạn Qua Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFriendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Thẻ Hồ Sơ Của Bạn */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                Tên & Avatar của bạn (Hiển thị khi gửi link)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={myProfile.avatar}
                  onChange={(e) => {
                    const updated = { ...myProfile, avatar: e.target.value };
                    setMyProfile(updated);
                    localStorage.setItem('nep_lokcam_my_profile_v2', JSON.stringify(updated));
                  }}
                  className="w-12 text-center bg-neutral-100 rounded-xl py-2 text-lg focus:outline-none"
                  placeholder="😎"
                />
                <input
                  type="text"
                  value={myProfile.name}
                  onChange={(e) => {
                    const updated = { ...myProfile, name: e.target.value };
                    setMyProfile(updated);
                    localStorage.setItem('nep_lokcam_my_profile_v2', JSON.stringify(updated));
                  }}
                  className="flex-1 bg-neutral-100 rounded-xl px-3 py-2 text-xs font-black text-[#18181B] focus:outline-none"
                  placeholder="Tên của bạn..."
                />
              </div>
            </div>

            {/* Ô Chia Sẻ Link */}
            <div className="bg-amber-500/10 border border-amber-300 rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-900 text-xs font-black">
                <Share2 size={14} className="text-amber-700" />
                <span>Link mời kết bạn cá nhân của bạn</span>
              </div>

              <div className="bg-white rounded-2xl p-2.5 border border-amber-200 text-[11px] font-mono text-neutral-600 truncate select-all">
                {getInviteUrl()}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-neutral-100 text-black border border-neutral-200'
                  }`}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Đã sao chép!' : 'Sao chép link'}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-3 rounded-2xl bg-[#18181B] hover:bg-black text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Share2 size={14} className="text-amber-400" /> Gửi link ngay
                </button>
              </div>
            </div>

            {/* Danh Sách Bạn Bè Hiện Tại */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b border-neutral-100">
                <span className="text-xs font-black text-[#18181B] flex items-center gap-1">
                  <Users size={13} className="text-neutral-400" /> Bạn bè đã kết nối
                </span>
                <span className="text-[11px] font-bold text-amber-600 font-mono">
                  {friends.length} người
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {friends.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2 rounded-2xl bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{f.avatar}</span>
                      <span className="text-xs font-bold text-[#18181B]">{f.name}</span>
                      {f.isMe && (
                        <span className="text-[9px] bg-neutral-200 px-1.5 py-0.5 rounded-full font-bold text-neutral-600">
                          Bạn
                        </span>
                      )}
                    </div>
                    {!f.isMe && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFriend(f.id)}
                        className="text-neutral-300 hover:text-rose-500 p-1 transition cursor-pointer"
                        title="Hủy kết bạn"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL CAMERA LOKCAM ================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-ios-fade">
          <div className="w-full max-w-sm bg-[#18181B] rounded-[36px] p-5 text-white border border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar">
            
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  LokCam Live
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chọn người đăng (Bạn hoặc người thân) */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
              {friends.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setSelectedAuthor(f)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shrink-0 transition cursor-pointer flex items-center gap-1 ${
                    selectedAuthor.id === f.id
                      ? 'bg-amber-400 text-black'
                      : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  <span>{f.avatar}</span>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            {/* Khung Ngắm Vuông 1:1 */}
            <div className="relative w-full aspect-square rounded-[28px] overflow-hidden bg-neutral-900 border-2 border-white/20 mb-3 flex items-center justify-center shadow-inner">
              {capturedImage ? (
                <img src={capturedImage} alt="Ảnh LokCam" className="w-full h-full object-cover" />
              ) : cameraError ? (
                <div className="p-5 text-center space-y-2">
                  <Camera size={36} className="text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-neutral-300 leading-relaxed">{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />
              )}
            </div>

            {/* BƯỚC 1: KHI ĐANG NGẮM */}
            {!capturedImage ? (
              <div className="flex items-center justify-around py-2">
                <label className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition active:scale-90">
                  <ImageIcon size={20} className="text-neutral-300" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-18 h-18 rounded-full border-4 border-amber-400 p-1 flex items-center justify-center active:scale-90 transition cursor-pointer shadow-lg"
                >
                  <div className="w-full h-full rounded-full bg-white active:bg-amber-300 transition" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                  }
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition active:scale-90"
                >
                  <RefreshCw size={20} className="text-neutral-300" />
                </button>
              </div>
            ) : (
              /* BƯỚC 2: SAU KHI ĐÃ CHỤP */
              <div className="space-y-3 animate-ios-fade">
                <input
                  type="text"
                  placeholder="Gõ lời nhắn cho khoảnh khắc này..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-neutral-400 focus:outline-none"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    className="py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw size={14} /> Chụp lại
                  </button>

                  <button
                    type="button"
                    onClick={handlePost}
                    className="py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
                  >
                    <Send size={14} /> Bắn lên LokCam
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};