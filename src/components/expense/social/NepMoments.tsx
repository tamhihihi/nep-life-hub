import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Heart, 
  Send, 
  X, 
  RefreshCw, 
  Image as ImageIcon, 
  Trash2,
  UserPlus,
  Share2,
  Check,
  Copy,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Flame,
  Coffee,
  RotateCcw,
  Zap
} from 'lucide-react';
import { sounds } from '../../../utils/soundEngine';
import { firebaseLokcam, LokCamPost } from '../../../services/firebaseLokcam';

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

const DEFAULT_MOMENTS: LokCamPost[] = [
  {
    id: 'm1',
    author: 'Người Thương',
    avatarEmoji: '❤️',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    caption: 'Đang ăn cơm trưa nè, bạn nhớ ăn đúng giờ nha! ✨',
    timestamp: Date.now() - 15 * 60 * 1000,
    timeAgo: '15 phút trước',
    likes: 4,
  },
  {
    id: 'm2',
    author: 'Tôi (Tâm)',
    avatarEmoji: '😎',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    caption: 'Tô phở cứu đói buổi chiều tại văn phòng 🍜',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    timeAgo: '2 giờ trước',
    likes: 6,
  },
];

export const NepMoments: React.FC = () => {
  // CHẾ ĐỘ HIỂN THỊ: 'camera' (Khung chụp Locket) HOẶC 'history' (Lịch sử khoảnh khắc)
  const [activeScreen, setActiveScreen] = useState<'camera' | 'history'>('camera');

  // STATE BÀI ĐĂNG & BẠN BÈ
  const [moments, setMoments] = useState<LokCamPost[]>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_moments_v3');
      return saved ? JSON.parse(saved) : DEFAULT_MOMENTS;
    } catch {
      return DEFAULT_MOMENTS;
    }
  });

  const [friends, setFriends] = useState<FriendProfile[]>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_friends_v3');
      return saved ? JSON.parse(saved) : DEFAULT_FRIENDS;
    } catch {
      return DEFAULT_FRIENDS;
    }
  });

  const [myProfile, setMyProfile] = useState<{ name: string; avatar: string }>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_my_profile_v3');
      return saved ? JSON.parse(saved) : { name: 'Tâm', avatar: '😎' };
    } catch {
      return { name: 'Tâm', avatar: '😎' };
    }
  });

  const [selectedFriendFilter, setSelectedFriendFilter] = useState<string>('all');
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pendingFriendInvite, setPendingFriendInvite] = useState<{ name: string; avatar: string } | null>(null);

  // CAMERA STATE
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. TẢI ẢNH TỪ FIREBASE & LẮNG NGHE REALTIME
  useEffect(() => {
    firebaseLokcam.fetchLatestPosts().then((cloudPosts) => {
      if (cloudPosts && cloudPosts.length > 0) {
        setMoments((prev) => {
          const merged = [...cloudPosts];
          prev.forEach((p) => {
            if (!merged.some((m) => m.id === p.id)) merged.push(p);
          });
          const sorted = merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(sorted));
          return sorted;
        });
      }
    });

    const unsubscribe = firebaseLokcam.listenRealtime((newPost) => {
      setMoments((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        sounds.playChime();
        if ('vibrate' in navigator) navigator.vibrate([20, 50, 20]);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
        const updated = [newPost, ...prev];
        localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));
        return updated;
      });
    });

    return () => unsubscribe();
  }, []);

  // 2. TỰ ĐỘNG BẮT LINK KẾT BẠN QUA URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const friendName = params.get('add_friend');
    const friendAvatar = params.get('avatar') || '👋';

    if (friendName && friendName.trim() !== '') {
      const exists = friends.some((f) => f.name.toLowerCase() === friendName.toLowerCase());
      if (!exists && friendName !== myProfile.name) {
        setPendingFriendInvite({
          name: decodeURIComponent(friendName),
          avatar: decodeURIComponent(friendAvatar),
        });
      }
    }
  }, []);

  // KHỞI ĐỘNG CAMERA KHI Ở MÀN HÌNH CHỤP
  useEffect(() => {
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    if (activeScreen !== 'camera' || capturedImage) {
      stopStream();
      return;
    }

    setCameraError(null);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Chạm biểu tượng Ảnh góc dưới để chọn ảnh sẵn có trong máy!');
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
          setCameraError('Chưa cấp quyền Camera. Hãy chọn ảnh sẵn có qua nút Thư viện!');
        }
      });

    return () => {
      active = false;
      stopStream();
    };
  }, [activeScreen, facingMode, capturedImage]);

  // NÉN ẢNH VUÔNG CHUẨN LOCKET (480x480)
  const handleCapture = () => {
    if (!videoRef.current) return;
    sounds.playKeypadTap();
    if ('vibrate' in navigator) navigator.vibrate(20);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = 480;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minDim = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    const sx = ((video.videoWidth || 480) - minDim) / 2;
    const sy = ((video.videoHeight || 480) - minDim) / 2;

    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.65));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sounds.playKeypadTap();

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const size = 480;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.src = url;
  };

  // ĐĂNG ẢNH VÀO LOKCAM
  const handlePublish = async () => {
    if (!capturedImage || isPublishing) return;
    setIsPublishing(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} Hôm nay`;

    const postPayload = {
      author: myProfile.name,
      avatarEmoji: myProfile.avatar,
      image: capturedImage,
      caption: caption.trim() || 'Khoảnh khắc vừa gửi ✨',
      timeAgo: timeStr,
      timestamp: Date.now(),
      likes: 1,
    };

    const cloudId = await firebaseLokcam.publishPost(postPayload);
    const finalId = cloudId || `lok_${Date.now()}`;

    const newPost: LokCamPost = { id: finalId, ...postPayload };
    const updated = [newPost, ...moments];
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));

    sounds.playChime();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.5 } });

    setIsPublishing(false);
    setCapturedImage(null);
    setCaption('');
    setActiveScreen('history'); // Đăng xong tự trượt sang xem lịch sử
  };

  const handleLike = (item: LokCamPost) => {
    sounds.playChime();
    if ('vibrate' in navigator) navigator.vibrate(15);
    const updated = moments.map((m) => (m.id === item.id ? { ...m, likes: m.likes + 1 } : m));
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));
    firebaseLokcam.incrementLike(item.id, item.likes);
  };

  const handleSendQuickReaction = (emoji: string) => {
    sounds.playKeypadTap();
    if ('vibrate' in navigator) navigator.vibrate(12);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
  };

  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?add_friend=${encodeURIComponent(myProfile.name)}&avatar=${encodeURIComponent(myProfile.avatar)}`;
  };

  const handleCopyLink = () => {
    sounds.playKeypadTap();
    navigator.clipboard?.writeText(getInviteUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredMoments = selectedFriendFilter === 'all' 
    ? moments 
    : moments.filter(m => m.author === selectedFriendFilter);

  return (
    <div className="relative w-full max-w-sm mx-auto bg-[#0F0F12] text-white rounded-[40px] p-4 shadow-2xl border border-white/10 overflow-hidden select-none">
      
      {/* ================= THANH ĐỈNH ĐẦU (TOP BAR) ================= */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3">
        {/* Avatar của tôi */}
        <button
          type="button"
          onClick={() => setIsFriendModalOpen(true)}
          className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-base shadow-sm active:scale-90 transition cursor-pointer"
          title="Hồ sơ & Bạn bè"
        >
          {myProfile.avatar}
        </button>

        {/* Nút Pill Bạn Thân (như Ảnh 1 & 2) */}
        <button
          type="button"
          onClick={() => setIsFriendModalOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <span className="text-xs">🔥</span>
          <span className="text-xs font-black tracking-wide text-neutral-200">
            {friends.length} bạn thân
          </span>
        </button>

        {/* Nút Chuyển Màn hình: Camera <-> Lịch sử */}
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadTap();
            setActiveScreen(prev => prev === 'camera' ? 'history' : 'camera');
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition cursor-pointer ${
            activeScreen === 'history' 
              ? 'bg-amber-400 text-black font-black' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={activeScreen === 'camera' ? 'Xem Lịch sử' : 'Mở Camera'}
        >
          {activeScreen === 'camera' ? <MessageCircle size={16} /> : <Camera size={16} />}
        </button>
      </div>

      {/* ================= GIAO DIỆN 1: CAMERA LOKCAM (Ảnh 1) ================= */}
      {activeScreen === 'camera' && (
        <div className="space-y-4 animate-tab-switch">
          
          {/* KHUNG NGẮM VUÔNG BO GÓC SQUIRCLE LỚN */}
          <div className="relative w-full aspect-square rounded-[36px] overflow-hidden bg-neutral-900 border border-white/15 shadow-inner flex items-center justify-center">
            
            {/* Huy hiệu Flash góc trái */}
            <div className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Zap size={14} className="fill-amber-300" />
            </div>

            {capturedImage ? (
              <img src={capturedImage} alt="Ảnh chụp" className="w-full h-full object-cover" />
            ) : cameraError ? (
              <div className="p-6 text-center space-y-2">
                <Camera size={38} className="text-amber-400 mx-auto opacity-80" />
                <p className="text-xs text-neutral-400 leading-relaxed">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            )}

            {/* NHÃN CAPTION DẠNG FLOATING PILL KHI ĐÃ CHỤP */}
            {capturedImage && (
              <div className="absolute inset-x-4 bottom-4 z-10">
                <input
                  type="text"
                  placeholder="Gõ lời nhắn gửi bạn bè..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-black/65 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold text-white text-center placeholder-neutral-400 focus:outline-none shadow-lg"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* CÁC NÚT ĐIỀU KHIỂN CHỤP CHUẨN LOCKET (ẢNH 1) */}
          {!capturedImage ? (
            <div className="flex items-center justify-around py-1 px-4">
              {/* Nút Thư viện */}
              <label className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer active:scale-90 transition">
                <ImageIcon size={20} className="text-white" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {/* NÚT SHUTTER VÀNG HOÀNG KIM APPLE */}
              <button
                type="button"
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-[3px] border-amber-400 p-1 flex items-center justify-center active:scale-90 transition cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <div className="w-full h-full rounded-full bg-white active:bg-amber-200 transition" />
              </button>

              {/* Nút Đổi Camera trước / sau */}
              <button
                type="button"
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center active:scale-90 transition cursor-pointer"
              >
                <RefreshCw size={20} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-2">
              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                disabled={isPublishing}
                className="py-3.5 rounded-2xl bg-white/15 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <RotateCcw size={14} /> Chụp lại
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              >
                <Send size={14} /> {isPublishing ? 'Đang bắn ảnh...' : 'Bắn lên LokCam'}
              </button>
            </div>
          )}

          {/* THANH GẠT ĐÁY: HISTORY ⌵ (ẢNH 1) */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadTap();
                setActiveScreen('history');
              }}
              className="inline-flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white transition cursor-pointer active:scale-95"
            >
              <span className="text-[11px] font-black uppercase tracking-wider">History</span>
              <ChevronDown size={14} className="animate-bounce" />
            </button>
          </div>
        </div>
      )}

      {/* ================= GIAO DIỆN 3: LỊCH SỬ KHOẢNH KHẮC (Ảnh 3) ================= */}
      {activeScreen === 'history' && (
        <div className="space-y-4 animate-tab-switch">
          
          {/* THANH LỌC BẠN BÈ */}
          <div className="flex items-center justify-between px-1">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedFriendFilter('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition cursor-pointer ${
                  selectedFriendFilter === 'all' 
                    ? 'bg-amber-400 text-black' 
                    : 'bg-white/10 text-neutral-300'
                }`}
              >
                Tất cả
              </button>
              {friends.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFriendFilter(f.name)}
                  className={`px-3 py-1 rounded-full text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                    selectedFriendFilter === f.name 
                      ? 'bg-amber-400 text-black' 
                      : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  <span>{f.avatar}</span>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DANH SÁCH ẢNH DẠNG WIDGET (ẢNH 3) */}
          <div className="space-y-4 max-h-[62vh] overflow-y-auto no-scrollbar pb-2">
            {filteredMoments.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                Chưa có ảnh nào của nhóm này
              </div>
            ) : (
              filteredMoments.map((item) => (
                <div key={item.id} className="space-y-2.5">
                  {/* Khung ảnh bo tròn Squircle 34px */}
                  <div className="relative w-full aspect-square rounded-[34px] overflow-hidden bg-neutral-900 border border-white/10 shadow-lg">
                    <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
                    
                    {/* Caption dạng Floating Pill nhãn đen mờ (như Ảnh 3) */}
                    <div className="absolute inset-x-3 bottom-3 text-center">
                      <span className="inline-block bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold text-white border border-white/15 shadow-md max-w-[90%] truncate">
                        {item.caption}
                      </span>
                    </div>
                  </div>

                  {/* Thông tin người chụp & thời gian (như Ảnh 3) */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-neutral-800 border border-amber-400 flex items-center justify-center text-xs">
                        {item.avatarEmoji || '✨'}
                      </span>
                      <span className="text-xs font-black text-white">{item.author}</span>
                      <span className="text-[10px] text-neutral-400 font-semibold">{item.timeAgo}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLike(item)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black active:scale-90 transition cursor-pointer"
                    >
                      <Heart size={13} className="fill-rose-500" /> {item.likes}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* THANH TƯƠNG TÁC CẢM XÚC NHANH (ẢNH 3) */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex items-center justify-between border border-white/10">
            <input
              type="text"
              placeholder="Gửi lời nhắn..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-neutral-400 px-2 py-1 flex-1 focus:outline-none"
            />
            <div className="flex items-center gap-2 pr-1">
              <button 
                type="button" 
                onClick={() => handleSendQuickReaction('🔥')} 
                className="text-base active:scale-125 transition cursor-pointer"
                title="Quá cháy"
              >
                🔥
              </button>
              <button 
                type="button" 
                onClick={() => handleSendQuickReaction('❤️')} 
                className="text-base active:scale-125 transition cursor-pointer"
                title="Thả tim"
              >
                ❤️
              </button>
              <button 
                type="button" 
                onClick={() => handleSendQuickReaction('☕')} 
                className="text-base active:scale-125 transition cursor-pointer"
                title="Cà phê nhé"
              >
                ☕
              </button>
              <button 
                type="button" 
                onClick={() => handleSendQuickReaction('🍱')} 
                className="text-base active:scale-125 transition cursor-pointer"
                title="Ăn cơm thôi"
              >
                🍱
              </button>
            </div>
          </div>

          {/* NÚT QUAY LẠI CAMERA */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setActiveScreen('camera')}
              className="inline-flex items-center gap-1 text-xs font-black text-amber-400 hover:text-amber-300 transition cursor-pointer active:scale-95"
            >
              <Camera size={14} /> Chụp khoảnh khắc mới
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL BẠN BÈ & NGƯỜI ĐANG YÊU (Ảnh 2) ================= */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
          <div className="w-full max-w-sm bg-[#18181B] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-white/10 animate-sheet-spring max-h-[88vh] overflow-y-auto no-scrollbar space-y-4 text-white">
            
            {/* Header: 🔥 8 friends / Slow down, best friends only! (Ảnh 2) */}
            <div className="text-center relative pb-1">
              <button
                type="button"
                onClick={() => setIsFriendModalOpen(false)}
                className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="inline-flex items-center gap-1.5 text-amber-400 font-black text-base">
                <span>🔥</span>
                <span>{friends.length} bạn thân</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Chỉ dành cho bạn thân và người đang yêu!
              </p>
            </div>

            {/* Ô CẬP NHẬT TÊN & AVATAR CÁ NHÂN */}
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-2.5">
              <input
                type="text"
                value={myProfile.avatar}
                onChange={(e) => {
                  const updated = { ...myProfile, avatar: e.target.value };
                  setMyProfile(updated);
                  localStorage.setItem('nep_lokcam_my_profile_v3', JSON.stringify(updated));
                }}
                className="w-10 h-10 text-center bg-white/10 rounded-xl text-lg focus:outline-none"
                placeholder="😎"
              />
              <div className="flex-1">
                <span className="text-[9px] text-neutral-400 uppercase font-black block">Tên hiển thị</span>
                <input
                  type="text"
                  value={myProfile.name}
                  onChange={(e) => {
                    const updated = { ...myProfile, name: e.target.value };
                    setMyProfile(updated);
                    localStorage.setItem('nep_lokcam_my_profile_v3', JSON.stringify(updated));
                  }}
                  className="bg-transparent text-xs font-black text-white focus:outline-none w-full"
                />
              </div>
            </div>

            {/* TÌM BẠN QUA ỨNG DỤNG KHÁC (BIẾN TẤU CHO VIỆT NAM: Zalo, Messenger, Copy Link) */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-neutral-300 block px-1">
                Tìm bạn từ ứng dụng khác
              </span>

              <div className="grid grid-cols-4 gap-2 text-center">
                {/* Zalo */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs text-white">
                    Zalo
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">Zalo</span>
                </button>

                {/* Messenger */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    <MessageCircle size={18} />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">Messenger</span>
                </button>

                {/* Sao chép link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">
                    {copiedLink ? 'Đã chép' : 'Sao chép'}
                  </span>
                </button>

                {/* Khác */}
                <button
                  type="button"
                  onClick={async () => {
                    sounds.playKeypadTap();
                    const url = getInviteUrl();
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Kết bạn LokCam cùng mình nhé!',
                          text: `👋 ${myProfile.avatar} ${myProfile.name} mời bạn chia sẻ ảnh trên LokCam:`,
                          url,
                        });
                      } catch {
                        handleCopyLink();
                      }
                    } else {
                      handleCopyLink();
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white">
                    <Share2 size={18} />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">Khác</span>
                </button>
              </div>
            </div>

            {/* DANH SÁCH BẠN BÈ CỦA BẠN (YOUR FRIENDS - ẢNH 2) */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-neutral-300 block px-1">
                Bạn bè của bạn ({friends.length})
              </span>

              <div className="bg-white/5 rounded-2xl p-2 border border-white/10 space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition">
                    <div className="flex items-center gap-3">
                      {/* Avatar viền vàng kim chuẩn Locket */}
                      <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-neutral-800 flex items-center justify-center text-lg shadow-sm">
                        {f.avatar}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white">{f.name}</h5>
                        {f.isMe && (
                          <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                            Bạn
                          </span>
                        )}
                      </div>
                    </div>

                    {!f.isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = friends.filter(item => item.id !== f.id);
                          setFriends(updated);
                          localStorage.setItem('nep_lokcam_friends_v3', JSON.stringify(updated));
                        }}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                        title="Xóa bạn"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};