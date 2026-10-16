import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Heart, 
  Send, 
  X, 
  RefreshCw, 
  Image as ImageIcon, 
  Share2, 
  Check, 
  Copy, 
  MessageCircle, 
  RotateCcw, 
  Zap,
  Grid,
  Calendar as CalendarIcon
} from 'lucide-react';
import { sounds } from '../../../utils/soundEngine';

import cameraIcon from '../../../assets/icons/camera.png';
import friendsIcon from '../../../assets/icons/friends.png';

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
  {
    id: 'm3',
    author: 'Cạ Cứng',
    avatarEmoji: '🍻',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    caption: 'Cuối tuần làm cốc cà phê đá giải nhiệt ☕',
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
    timeAgo: '15 ngày trước',
    likes: 8,
  },
];

export const NepMoments: React.FC = () => {
  // 3 CHẾ ĐỘ XEM: 'camera' | 'feed' | 'memories'
  const [activeScreen, setActiveScreen] = useState<'camera' | 'feed' | 'memories'>('camera');

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
  const [selectedPostDetail, setSelectedPostDetail] = useState<LokCamPost | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
          setCameraError('Chưa cấp quyền Camera. Hãy bấm nút Thư viện để chọn ảnh!');
        }
      });

    return () => {
      active = false;
      stopStream();
    };
  }, [activeScreen, facingMode, capturedImage]);

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

  const handlePublish = () => {
    if (!capturedImage || isPublishing) return;
    setIsPublishing(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} Hôm nay`;

    const newPost: LokCamPost = {
      id: `lok_${Date.now()}`,
      author: myProfile.name,
      avatarEmoji: myProfile.avatar,
      image: capturedImage,
      caption: caption.trim() || 'Khoảnh khắc vừa gửi ✨',
      timeAgo: timeStr,
      timestamp: Date.now(),
      likes: 1,
    };

    const updated = [newPost, ...moments];
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));

    try { sounds?.playChime?.(); } catch {}

    setIsPublishing(false);
    setCapturedImage(null);
    setCaption('');
    setActiveScreen('feed');
  };

  const handleLike = (item: LokCamPost) => {
    try { sounds?.playChime?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(15);
    const updated = moments.map((m) => (m.id === item.id ? { ...m, likes: m.likes + 1 } : m));
    setMoments(updated);
    localStorage.setItem('nep_lokcam_moments_v3', JSON.stringify(updated));
  };

  const filteredMoments = selectedFriendFilter === 'all' 
    ? moments 
    : moments.filter(m => m.author === selectedFriendFilter);

  const groupedMemories = moments.reduce((acc: { [key: string]: LokCamPost[] }, post) => {
    const d = new Date(post.timestamp || Date.now());
    const monthKey = `tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(post);
    return acc;
  }, {});

  return (
    <div className="flex-1 w-full flex flex-col justify-between overflow-hidden bg-[#0D0D11] text-white rounded-[36px] shadow-2xl border border-white/10 select-none relative">
      
      {/* ================= THANH TOP BAR (CỐ ĐỊNH) ================= */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0 border-b border-white/5 bg-[#0D0D11]/90 backdrop-blur-md z-20">
        <button
          type="button"
          onClick={() => setIsFriendModalOpen(true)}
          className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-sm shadow-sm active:scale-90 transition cursor-pointer overflow-hidden p-0.5"
          title="Hồ sơ & Bạn bè"
        >
          {myProfile.avatar}
        </button>

        <button
          type="button"
          onClick={() => setIsFriendModalOpen(true)}
          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <img src={friendsIcon} alt="Bạn thân" className="w-3.5 h-3.5 object-contain" />
          <span className="text-[11px] font-black tracking-wide text-neutral-200">
            {friends.length} bạn thân
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setActiveScreen(prev => prev === 'memories' ? 'camera' : 'memories');
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
            activeScreen === 'memories' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title="Kỷ niệm"
        >
          <Grid size={15} />
        </button>
      </div>

      {/* ================= KHUNG NỘI DUNG CHÍNH (KHÔNG BAO GIỜ BỊ TRÔI TRANG) ================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

        {/* 1. MÀN HÌNH CAMERA LIVE */}
        {activeScreen === 'camera' && (
          <div className="flex-1 flex flex-col justify-between items-center py-2 px-3 overflow-hidden">
            {/* KHUNG NGẮM VUÔNG CHUẨN LOCKET (TỰ CO GIÃN VỪA KHÍT MÀN HÌNH) */}
            <div className="w-full flex-1 max-h-[340px] aspect-square rounded-[34px] overflow-hidden bg-neutral-900 border border-white/15 shadow-inner relative flex items-center justify-center shrink-0 my-auto">
              <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-amber-300">
                <Zap size={13} className="fill-amber-300" />
              </div>

              {capturedImage ? (
                <img src={capturedImage} alt="Ảnh chụp" className="w-full h-full object-cover" />
              ) : cameraError ? (
                <div className="p-6 text-center space-y-2">
                  <Camera size={34} className="text-amber-400 mx-auto opacity-80" />
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{cameraError}</p>
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
                <div className="absolute inset-x-3 bottom-3 z-10">
                  <input
                    type="text"
                    placeholder="Gõ lời nhắn gửi bạn bè..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-black/75 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 text-xs font-bold text-white text-center placeholder-neutral-400 focus:outline-none shadow-lg"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* BỘ NÚT CHỤP ẢNH */}
            {!capturedImage ? (
              <div className="w-full flex items-center justify-around py-2 px-4 shrink-0">
                <label className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer active:scale-90 transition">
                  <ImageIcon size={18} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-18 h-18 rounded-full border-[3px] border-amber-400 p-1 flex items-center justify-center active:scale-90 transition cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <div className="w-full h-full rounded-full bg-white active:bg-amber-200 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center active:scale-90 transition cursor-pointer"
                >
                  <RefreshCw size={18} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 gap-2 py-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  disabled={isPublishing}
                  className="py-3 rounded-2xl bg-white/15 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <RotateCcw size={13} /> Chụp lại
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <Send size={13} /> {isPublishing ? 'Đang gửi...' : 'Bắn lên LokCam'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. MÀN HÌNH FEED (CHỈ CUỘN NỘI BỘ, KHÔNG TRÔI TRANG) */}
        {activeScreen === 'feed' && (
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-16 space-y-4">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFriendFilter('all')}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition cursor-pointer shrink-0 ${
                  selectedFriendFilter === 'all' ? 'bg-amber-400 text-black' : 'bg-white/10 text-neutral-300'
                }`}
              >
                Tất cả
              </button>
              {friends.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFriendFilter(f.name)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    selectedFriendFilter === f.name ? 'bg-amber-400 text-black' : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  <span>{f.avatar}</span>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredMoments.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="relative w-full aspect-square rounded-[30px] overflow-hidden bg-neutral-900 border border-white/10 shadow-lg">
                    <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-3 bottom-3 text-center">
                      <span className="inline-block bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-white border border-white/15 shadow-md max-w-[90%] truncate">
                        {item.caption}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-800 border border-amber-400 flex items-center justify-center text-xs">
                        {item.avatarEmoji || '✨'}
                      </span>
                      <span className="text-xs font-black text-white">{item.author}</span>
                      <span className="text-[10px] text-neutral-400 font-semibold">{item.timeAgo}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLike(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black active:scale-90 transition cursor-pointer"
                    >
                      <Heart size={12} className="fill-rose-500" /> {item.likes}
                    </button>
                  </div>
                </div>
              ))}
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
                {['🔥', '❤️', '☕', '🍱'].map((emoji) => (
                  <button 
                    key={emoji}
                    type="button" 
                    onClick={() => {
                      try { sounds?.playKeypadTap?.(); } catch {}
                      if ('vibrate' in navigator) navigator.vibrate(12);
                    }} 
                    className="text-base active:scale-125 transition cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. MÀN HÌNH LƯỚI KỶ NIỆM (CHỈ CUỘN NỘI BỘ) */}
        {activeScreen === 'memories' && (
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-16 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-amber-400" /> Kỷ niệm
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">
                {moments.length} khoảnh khắc
              </span>
            </div>

            {Object.keys(groupedMemories).map((monthLabel) => (
              <div key={monthLabel} className="bg-white/5 rounded-3xl p-3.5 border border-white/10 space-y-3">
                <span className="text-xs font-black text-neutral-300 uppercase tracking-wide block px-1">
                  {monthLabel}
                </span>

                <div className="grid grid-cols-5 gap-2">
                  {groupedMemories[monthLabel].map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPostDetail(post)}
                      className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 border border-white/20 shadow-sm relative active:scale-90 transition cursor-pointer hover:border-amber-400"
                    >
                      <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, 15 - groupedMemories[monthLabel].length) }).map((_, i) => (
                    <div key={`empty_${i}`} className="aspect-square rounded-2xl flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= THANH ĐIỀU HƯỚNG LOKCAM (CỐ ĐỊNH Ở ĐÁY KHUNG ĐEN) ================= */}
      <div className="px-3 pb-3 pt-1 shrink-0 flex justify-center z-20 bg-[#0D0D11]/90 backdrop-blur-md border-t border-white/5">
        <div className="bg-[#18181F] border border-white/15 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              try { sounds?.playKeypadTap?.(); } catch {}
              setActiveScreen('memories');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
              activeScreen === 'memories' ? 'bg-amber-400 text-black font-black' : 'text-neutral-400 hover:text-white'
            }`}
            title="Lưới Kỷ niệm"
          >
            <Grid size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              try { sounds?.playKeypadTap?.(); } catch {}
              setActiveScreen('camera');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
              activeScreen === 'camera' ? 'bg-amber-400 text-black font-black' : 'text-neutral-400 hover:text-white'
            }`}
            title="Mở Camera"
          >
            <Camera size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              try { sounds?.playKeypadTap?.(); } catch {}
              setActiveScreen('feed');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
              activeScreen === 'feed' ? 'bg-amber-400 text-black font-black' : 'text-neutral-400 hover:text-white'
            }`}
            title="Dòng thời gian"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedPostDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-tab-switch">
          <div className="w-full max-w-xs bg-[#18181B] rounded-[32px] p-4 text-white border border-white/15 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black">{selectedPostDetail.author}</span>
              <button
                type="button"
                onClick={() => setSelectedPostDetail(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-black">
              <img src={selectedPostDetail.image} alt="Detail" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-bold text-center text-neutral-200">
              {selectedPostDetail.caption}
            </p>
          </div>
        </div>
      )}

      {/* MODAL BẠN BÈ */}
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
                <img src={friendsIcon} alt="Bạn thân" className="w-5 h-5 object-contain" />
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
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">{copiedLink ? 'Đã chép' : 'Sao chép link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'LokCam', url: window.location.href }).catch(() => {});
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Share2 size={16} />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">Chia sẻ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFriendModalOpen(false)}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-white">
                    <X size={16} />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">Đóng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};