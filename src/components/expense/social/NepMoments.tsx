import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Heart, 
  Send, 
  X, 
  RefreshCw, 
  Image as ImageIcon, 
  Trash2,
  Share2, 
  Check, 
  Copy, 
  Users, 
  ChevronDown, 
  MessageCircle, 
  RotateCcw, 
  Zap,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../../utils/soundEngine';

// ================= KIỂU DỮ LIỆU & CẤU HÌNH REALTIME =================
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

export interface FriendProfile {
  id: string;
  name: string;
  avatar: string;
  isMe?: boolean;
}

// Thay bằng URL Realtime Database của bạn nếu có, hoặc để trống app vẫn chạy offline mượt mà
const FIREBASE_RTDB_URL = '';

// Hiệu ứng pháo hoa an toàn (không gây lỗi build nếu thiếu thư viện canvas-confetti)
const triggerSafeConfetti = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).confetti) {
      (window as any).confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  } catch {}
};

// VOXEL ICON HELPER TỰ BẢO VỆ CHỐNG VỠ HÌNH
const VoxelIcon: React.FC<{
  name: 'wallet' | 'camera' | 'food' | 'friends' | 'social' | 'spending';
  className?: string;
  fallback: React.ReactNode;
}> = ({ name, className = 'w-5 h-5 object-contain', fallback }) => {
  const [error, setError] = useState(false);
  const baseUrl = (import.meta as any).env?.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const src = `${cleanBase}icons/${name}.png`;

  if (error) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={name}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

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
  const [activeScreen, setActiveScreen] = useState<'camera' | 'history'>('camera');

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

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. TẢI DỮ LIỆU REALTIME AN TOÀN
  useEffect(() => {
    if (!FIREBASE_RTDB_URL) return;

    fetch(`${FIREBASE_RTDB_URL}/lokcam_posts.json?limitToLast=20`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const cloudPosts: LokCamPost[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        if (cloudPosts.length > 0) {
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
      })
      .catch(() => {});

    // Lắng nghe SSE
    try {
      const es = new EventSource(`${FIREBASE_RTDB_URL}/lokcam_posts.json`);
      es.addEventListener('put', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.path && payload.path !== '/' && payload.data) {
            const id = payload.path.replace('/', '');
            const newPost: LokCamPost = { id, ...payload.data };
            setMoments((prev) => {
              if (prev.some((p) => p.id === newPost.id)) return prev;
              try { sounds?.playChime?.(); } catch {}
              if ('vibrate' in navigator) navigator.vibrate([20, 50, 20]);
              triggerSafeConfetti();
              const updated = [newPost, ...prev];
              localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));
              return updated;
            });
          }
        } catch {}
      });
      return () => es.close();
    } catch {}
  }, []);

  // 2. TỰ ĐỘNG BẮT LINK KẾT BẠN
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

  // KHỞI ĐỘNG CAMERA
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
    try { sounds?.playKeypadTap?.(); } catch {}
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
    try { sounds?.playKeypadTap?.(); } catch {}

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

    let finalId = `lok_${Date.now()}`;

    // Đẩy lên Firebase nếu có cấu hình
    if (FIREBASE_RTDB_URL) {
      try {
        const res = await fetch(`${FIREBASE_RTDB_URL}/lokcam_posts.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postPayload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.name) finalId = data.name;
        }
      } catch {}
    }

    const newPost: LokCamPost = { id: finalId, ...postPayload };
    const updated = [newPost, ...moments];
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));

    try { sounds?.playChime?.(); } catch {}
    triggerSafeConfetti();

    setIsPublishing(false);
    setCapturedImage(null);
    setCaption('');
    setActiveScreen('history');
  };

  const handleLike = (item: LokCamPost) => {
    try { sounds?.playChime?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(15);
    const updated = moments.map((m) => (m.id === item.id ? { ...m, likes: m.likes + 1 } : m));
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));

    if (FIREBASE_RTDB_URL) {
      fetch(`${FIREBASE_RTDB_URL}/lokcam_posts/${item.id}/likes.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.likes + 1),
      }).catch(() => {});
    }
  };

  const handleSendQuickReaction = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(12);
    triggerSafeConfetti();
  };

  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?add_friend=${encodeURIComponent(myProfile.name)}&avatar=${encodeURIComponent(myProfile.avatar)}`;
  };

  const handleCopyLink = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    navigator.clipboard?.writeText(getInviteUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredMoments = selectedFriendFilter === 'all' 
    ? moments 
    : moments.filter(m => m.author === selectedFriendFilter);

  return (
    <div className="relative w-full max-w-sm mx-auto bg-[#0F0F12] text-white rounded-[40px] p-4 shadow-2xl border border-white/10 overflow-hidden select-none">
      
      {/* ================= THANH ĐỈNH ĐẦU ================= */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3">
        <button
          type="button"
          onClick={() => setIsFriendModalOpen(true)}
          className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-base shadow-sm active:scale-90 transition cursor-pointer"
          title="Hồ sơ & Bạn bè"
        >
          {myProfile.avatar}
        </button>

        <button
          type="button"
          onClick={() => setIsFriendModalOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <VoxelIcon name="friends" className="w-4 h-4 object-contain" fallback={<span className="text-xs">🔥</span>} />
          <span className="text-xs font-black tracking-wide text-neutral-200">
            {friends.length} bạn thân
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setActiveScreen(prev => prev === 'camera' ? 'history' : 'camera');
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center p-1.5 transition cursor-pointer ${
            activeScreen === 'history' 
              ? 'bg-amber-400 text-black font-black' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={activeScreen === 'camera' ? 'Xem Lịch sử' : 'Mở Camera'}
        >
          {activeScreen === 'camera' ? (
            <VoxelIcon name="social" className="w-5 h-5 object-contain" fallback={<MessageCircle size={16} />} />
          ) : (
            <VoxelIcon name="camera" className="w-5 h-5 object-contain" fallback={<Camera size={16} />} />
          )}
        </button>
      </div>

      {/* ================= MÀN HÌNH CAMERA ================= */}
      {activeScreen === 'camera' && (
        <div className="space-y-4 animate-tab-switch">
          
          <div className="relative w-full aspect-square rounded-[36px] overflow-hidden bg-neutral-900 border border-white/15 shadow-inner flex items-center justify-center">
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

          {!capturedImage ? (
            <div className="flex items-center justify-around py-1 px-4">
              <label className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer active:scale-90 transition">
                <ImageIcon size={20} className="text-white" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-[3px] border-amber-400 p-1 flex items-center justify-center active:scale-90 transition cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <div className="w-full h-full rounded-full bg-white active:bg-amber-200 transition" />
              </button>

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
                <Send size={14} /> {isPublishing ? 'Đang gửi...' : 'Bắn lên LokCam'}
              </button>
            </div>
          )}

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => {
                try { sounds?.playKeypadTap?.(); } catch {}
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

      {/* ================= MÀN HÌNH LỊCH SỬ KHOẢNH KHẮC ================= */}
      {activeScreen === 'history' && (
        <div className="space-y-4 animate-tab-switch">
          
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

          <div className="space-y-4 max-h-[62vh] overflow-y-auto no-scrollbar pb-2">
            {filteredMoments.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                Chưa có ảnh nào của nhóm này
              </div>
            ) : (
              filteredMoments.map((item) => (
                <div key={item.id} className="space-y-2.5">
                  <div className="relative w-full aspect-square rounded-[34px] overflow-hidden bg-neutral-900 border border-white/10 shadow-lg">
                    <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
                    
                    <div className="absolute inset-x-3 bottom-3 text-center">
                      <span className="inline-block bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold text-white border border-white/15 shadow-md max-w-[90%] truncate">
                        {item.caption}
                      </span>
                    </div>
                  </div>

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
                onClick={handleSendQuickReaction} 
                className="text-base active:scale-125 transition cursor-pointer"
              >
                🔥
              </button>
              <button 
                type="button" 
                onClick={handleSendQuickReaction} 
                className="text-base active:scale-125 transition cursor-pointer"
              >
                ❤️
              </button>
              <button 
                type="button" 
                onClick={handleSendQuickReaction} 
                className="text-base active:scale-125 transition cursor-pointer"
              >
                ☕
              </button>
              <button 
                type="button" 
                onClick={handleSendQuickReaction} 
                className="text-base active:scale-125 transition cursor-pointer"
              >
                🍱
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setActiveScreen('camera')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 transition cursor-pointer active:scale-95"
            >
              <VoxelIcon name="camera" className="w-4 h-4 object-contain" fallback={<Camera size={14} />} />
              <span>Chụp khoảnh khắc mới</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL BẠN BÈ ================= */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
          <div className="w-full max-w-sm bg-[#18181B] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-white/10 animate-sheet-spring max-h-[88vh] overflow-y-auto no-scrollbar space-y-4 text-white">
            
            <div className="text-center relative pb-1">
              <button
                type="button"
                onClick={() => setIsFriendModalOpen(false)}
                className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="inline-flex items-center gap-2 text-amber-400 font-black text-base">
                <VoxelIcon name="friends" className="w-6 h-6 object-contain" fallback={<span>🔥</span>} />
                <span>{friends.length} bạn thân</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Chỉ dành cho bạn thân và người đang yêu!
              </p>
            </div>

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

            <div className="space-y-2">
              <span className="text-[11px] font-black text-neutral-300 block px-1">
                Tìm bạn từ ứng dụng khác
              </span>

              <div className="grid grid-cols-4 gap-2 text-center">
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

                <button
                  type="button"
                  onClick={async () => {
                    try { sounds?.playKeypadTap?.(); } catch {}
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

            <div className="space-y-2">
              <span className="text-[11px] font-black text-neutral-300 block px-1">
                Bạn bè của bạn ({friends.length})
              </span>

              <div className="bg-white/5 rounded-2xl p-2 border border-white/10 space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition">
                    <div className="flex items-center gap-3">
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