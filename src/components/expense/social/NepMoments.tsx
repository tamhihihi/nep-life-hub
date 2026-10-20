import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Heart, 
  Send, 
  X, 
  RefreshCw, 
  Image as ImageIcon, 
  RotateCcw, 
  Zap,
  Grid,
  Calendar as CalendarIcon,
  Users,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import { sounds } from '../../../utils/soundEngine';
import { savePhotoToDB, getPhotoFromDB, getAllPhotosFromDB } from '../../../utils/indexedDB';
import { FIREBASE_RTDB_URL } from '../../../services/userDataSync';

export interface LokCamPost {
  id: string;
  author: string;
  avatarEmoji?: string;
  image?: string;
  caption: string;
  timeAgo?: string;
  timestamp: number;
  likes: number;
}

export const NepMoments: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<'camera' | 'feed' | 'memories'>('camera');
  const [roomCode, setRoomCode] = useState<string>(() => localStorage.getItem('nep_lokcam_room_code') || '');
  const [tempRoomInput, setTempRoomInput] = useState('');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [myProfile, setMyProfile] = useState<{ name: string; avatar: string }>(() => {
    try {
      const saved = localStorage.getItem('nep_lokcam_my_profile_v3');
      return saved ? JSON.parse(saved) : { name: 'Tâm', avatar: '😎' };
    } catch {
      return { name: 'Tâm', avatar: '😎' };
    }
  });

  const [moments, setMoments] = useState<LokCamPost[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<LokCamPost | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // NẠP ẢNH TỪ INDEXEDDB KHI VÀO ỨNG DỤNG (CHỐNG TRÀN BỘ NHỚ 5MB)
  useEffect(() => {
    const loadStoredMoments = async () => {
      try {
        const metadataRaw = localStorage.getItem('nep_lokcam_meta_v4');
        const metaList: LokCamPost[] = metadataRaw ? JSON.parse(metadataRaw) : [];
        const photoMap = await getAllPhotosFromDB();

        const enriched = metaList.map((m) => ({
          ...m,
          image: photoMap[m.id] || m.image || '',
        }));

        setMoments(enriched);
      } catch (e) {
        console.error('Lỗi nạp ảnh IndexedDB:', e);
      }
    };

    loadStoredMoments();
  }, []);

  // LẮNG NGHE BẠN BÈ GỬI ẢNH QUA PHÒNG CHUNG FIREBASE
  useEffect(() => {
    if (!roomCode || !FIREBASE_RTDB_URL || FIREBASE_RTDB_URL.includes('your-database')) return;

    try {
      const es = new EventSource(`${FIREBASE_RTDB_URL}/rooms/${roomCode}/moments.json`);
      es.addEventListener('put', async (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.data && typeof payload.data === 'object') {
            const incoming: LokCamPost = payload.data;
            if (incoming.image) {
              await savePhotoToDB(incoming.id, incoming.image);
            }
            setMoments((prev) => {
              if (prev.some((p) => p.id === incoming.id)) return prev;
              const next = [incoming, ...prev];
              // Chỉ lưu metadata (không chứa chuỗi ảnh lớn) vào localStorage
              const cleanMeta = next.map(({ image, ...rest }) => rest);
              localStorage.setItem('nep_lokcam_meta_v4', JSON.stringify(cleanMeta));
              return next;
            });
            try { sounds?.playChime?.(); } catch {}
          }
        } catch {}
      });

      return () => es.close();
    } catch {}
  }, [roomCode]);

  // ĐIỀU KHIỂN LUỒNG CAMERA
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
      setCameraError('Chạm biểu tượng Thư viện để tải ảnh từ máy lên!');
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
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (active) setCameraError('Chưa cấp quyền Camera. Hãy chọn ảnh từ máy!');
      });

    return () => {
      active = false;
      stopStream();
    };
  }, [activeScreen, facingMode, capturedImage]);

  const handleCapture = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(30);

    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      const size = 640;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;

      if (vw > 0 && vh > 0) {
        const minDim = Math.min(vw, vh);
        const sx = (vw - minDim) / 2;
        const sy = (vh - minDim) / 2;
        if (facingMode === 'user') {
          ctx.translate(size, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
      } else {
        ctx.drawImage(video, 0, 0, size, size);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setCapturedImage(dataUrl);
      try { sounds?.playChime?.(); } catch {}
    } catch (e) {
      console.error('Lỗi chụp hình:', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const size = 640;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  };

  const handlePublish = async () => {
    if (!capturedImage || isPublishing) return;
    setIsPublishing(true);

    const postId = `lok_${Date.now()}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} Hôm nay`;

    const newPost: LokCamPost = {
      id: postId,
      author: myProfile.name,
      avatarEmoji: myProfile.avatar,
      image: capturedImage,
      caption: caption.trim() || 'Khoảnh khắc vừa gửi ✨',
      timeAgo: timeStr,
      timestamp: Date.now(),
      likes: 1,
    };

    // 1. LƯU ẢNH VÀO INDEXEDDB
    await savePhotoToDB(postId, capturedImage);

    // 2. LƯU METADATA VÀO LOCALSTORAGE
    const updatedMeta = [
      { ...newPost, image: undefined },
      ...moments.map(({ image, ...rest }) => rest),
    ];
    localStorage.setItem('nep_lokcam_meta_v4', JSON.stringify(updatedMeta));
    setMoments([newPost, ...moments]);

    // 3. ĐỒNG BỘ ĐẾN PHÒNG CHUNG NẾU ĐÃ KẾT ĐÔI
    if (roomCode && FIREBASE_RTDB_URL && !FIREBASE_RTDB_URL.includes('your-database')) {
      try {
        await fetch(`${FIREBASE_RTDB_URL}/rooms/${roomCode}/moments.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPost),
        });
      } catch {}
    }

    try { sounds?.playChime?.(); } catch {}
    setIsPublishing(false);
    setCapturedImage(null);
    setCaption('');
    setActiveScreen('feed');
  };

  const handleConnectRoom = () => {
    const code = tempRoomInput.trim().toUpperCase();
    if (!code) return;
    setRoomCode(code);
    localStorage.setItem('nep_lokcam_room_code', code);
    setIsRoomModalOpen(false);
    try { sounds?.playChime?.(); } catch {}
  };

  const handleGenerateRoom = () => {
    const randomCode = `NEP${Math.floor(100 + Math.random() * 900)}`;
    setRoomCode(randomCode);
    localStorage.setItem('nep_lokcam_room_code', randomCode);
    setTempRoomInput(randomCode);
    try { sounds?.playKeypadTap?.(); } catch {}
  };

  return (
    <div className="flex-1 w-full flex flex-col justify-between overflow-hidden bg-[#0D0D11] text-white rounded-[36px] shadow-2xl border border-white/10 select-none relative">
      
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0 border-b border-white/5 bg-[#0D0D11]/90 backdrop-blur-md z-20">
        <button
          type="button"
          onClick={() => setIsRoomModalOpen(true)}
          className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-sm shadow-sm cursor-pointer"
        >
          {myProfile.avatar}
        </button>

        {/* NÚT PHÒNG KẾT NỐI BẠN BÈ REALTIME */}
        <button
          type="button"
          onClick={() => setIsRoomModalOpen(true)}
          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Radio size={12} className={roomCode ? 'text-emerald-400 animate-pulse' : 'text-neutral-400'} />
          <span className="text-[11px] font-black text-neutral-200">
            {roomCode ? `Phòng: ${roomCode}` : 'Ghép đôi bạn bè'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setActiveScreen((prev) => (prev === 'memories' ? 'camera' : 'memories'));
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
            activeScreen === 'memories' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white'
          }`}
        >
          <Grid size={15} />
        </button>
      </div>

      {/* KHUNG NỘI DUNG */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeScreen === 'camera' && (
          <div className="flex-1 flex flex-col justify-between items-center py-2 px-3 overflow-hidden">
            <div className="w-full flex-1 max-h-[340px] aspect-square rounded-[34px] overflow-hidden bg-neutral-900 border border-white/15 shadow-inner relative flex items-center justify-center shrink-0 my-auto">
              <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-black/45 flex items-center justify-center text-amber-300">
                <Zap size={13} className="fill-amber-300" />
              </div>

              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : cameraError ? (
                <div className="p-6 text-center space-y-2">
                  <Camera size={34} className="text-amber-400 mx-auto opacity-80" />
                  <p className="text-[11px] text-neutral-400">{cameraError}</p>
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
                    className="w-full bg-black/75 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 text-xs font-bold text-white text-center focus:outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {!capturedImage ? (
              <div className="w-full flex items-center justify-around py-2 px-4 shrink-0 z-10">
                <label className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer">
                  <ImageIcon size={20} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-20 h-20 rounded-full border-4 border-amber-400 p-1.5 flex items-center justify-center active:scale-90 transition cursor-pointer shadow-xl shadow-amber-500/25"
                >
                  <div className="w-full h-full rounded-full bg-white active:bg-amber-200 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw size={20} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 gap-2 py-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  disabled={isPublishing}
                  className="py-3.5 rounded-2xl bg-white/15 text-white font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> Chụp lại
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Send size={14} /> {isPublishing ? 'Đang gửi...' : 'Gửi Bạn Bè'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeScreen === 'feed' && (
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-16 space-y-4">
            {moments.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Camera size={32} className="text-neutral-500 mx-auto" />
                <p className="text-xs text-neutral-400">Chưa có khoảnh khắc nào</p>
              </div>
            ) : (
              moments.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="relative w-full aspect-square rounded-[30px] overflow-hidden bg-neutral-900 border border-white/10 shadow-lg">
                    {item.image && (
                      <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-x-3 bottom-3 text-center">
                      <span className="inline-block bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-white border border-white/15 max-w-[90%] truncate">
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
                      onClick={() => {
                        const updated = moments.map((m) => (m.id === item.id ? { ...m, likes: m.likes + 1 } : m));
                        setMoments(updated);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black"
                    >
                      <Heart size={12} className="fill-rose-500" /> {item.likes}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeScreen === 'memories' && (
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-16 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-amber-400" /> Kỷ niệm ảnh
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">
                {moments.length} tấm (Lưu IndexedDB)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {moments.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostDetail(post)}
                  className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 border border-white/20 relative active:scale-90 transition cursor-pointer"
                >
                  {post.image && <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* THANH ĐÁY LOKCAM */}
      <div className="px-3 pb-3 pt-1 shrink-0 flex justify-center z-20 bg-[#0D0D11]/90 backdrop-blur-md border-t border-white/5">
        <div className="bg-[#18181F] border border-white/15 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveScreen('memories')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              activeScreen === 'memories' ? 'bg-amber-400 text-black font-black' : 'text-neutral-400'
            }`}
          >
            <Grid size={17} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeScreen === 'camera') handleCapture();
              else setActiveScreen('camera');
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              activeScreen === 'camera' ? 'bg-amber-400 text-black font-black' : 'text-neutral-400'
            }`}
          >
            <Camera size={17} />
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('feed')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              activeScreen === 'feed' ? 'bg-amber-400 text-black font-black' : 'text-neutral-400'
            }`}
          >
            <Users size={17} />
          </button>
        </div>
      </div>

      {/* MODAL KẾT ĐÔI BẠN BÈ VỚI MÃ 6 KÝ TỰ */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-[#18181B] rounded-t-[36px] sm:rounded-[36px] p-6 text-white border border-white/15 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400">Kết đôi Realtime</span>
                <h3 className="text-base font-black">Phòng ảnh LokCam</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-2">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">Mã phòng hiện tại</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black font-mono text-amber-400 tracking-widest">
                  {roomCode || 'CHƯA CÓ'}
                </span>
                {roomCode && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(roomCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">Nhập mã phòng của bạn bè:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VD: NEP882"
                  value={tempRoomInput}
                  onChange={(e) => setTempRoomInput(e.target.value.toUpperCase())}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConnectRoom}
                  className="px-4 bg-amber-400 text-black text-xs font-black rounded-xl cursor-pointer"
                >
                  Kết nối
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateRoom}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Tạo mã phòng mới ngẫu nhiên
            </button>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT ẢNH */}
      {selectedPostDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#18181B] rounded-[32px] p-4 text-white border border-white/15 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black">{selectedPostDetail.author}</span>
              <button
                type="button"
                onClick={() => setSelectedPostDetail(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-black">
              {selectedPostDetail.image && (
                <img src={selectedPostDetail.image} alt="Detail" className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs font-bold text-center text-neutral-200">{selectedPostDetail.caption}</p>
          </div>
        </div>
      )}

    </div>
  );
};