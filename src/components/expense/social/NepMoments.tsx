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
  Trash2 
} from 'lucide-react';
import { sounds } from '../../../utils/soundEngine';

export interface MomentPost {
  id: string;
  author: string;
  image: string;
  caption: string;
  timeAgo: string;
  likes: number;
}

const DEFAULT_MOMENTS: MomentPost[] = [
  {
    id: 'm1',
    author: 'Người Thương ❤️',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    caption: 'Đang ăn cơm tấm nè, nhớ ăn trưa nha!',
    timeAgo: '15 phút trước',
    likes: 3,
  },
  {
    id: 'm2',
    author: 'Tâm (Bạn)',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    caption: 'Tô phở cứu đói buổi trưa tại văn phòng.',
    timeAgo: '2 giờ trước',
    likes: 5,
  },
];

export const NepMoments: React.FC = () => {
  const [moments, setMoments] = useState<MomentPost[]>(() => {
    try {
      const saved = localStorage.getItem('nep_locket_moments_v1');
      return saved ? JSON.parse(saved) : DEFAULT_MOMENTS;
    } catch {
      return DEFAULT_MOMENTS;
    }
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

    // Kiểm tra quyền Camera (cần HTTPS hoặc localhost)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Đang chạy qua Wi-Fi HTTP. Hãy bấm biểu tượng Ảnh ở góc trái để chụp/chọn ảnh!');
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
          setCameraError('Chưa cấp quyền Camera hoặc thiết bị bận. Bấm icon Ảnh bên dưới để chọn ảnh!');
        }
      });

    return () => {
      active = false;
      stopStream();
    };
  }, [isCameraOpen, facingMode, capturedImage]);

  // Bấm nút Chụp: Cắt ảnh vuông 600x600 chuẩn Locket
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
  };

  // Chọn ảnh từ máy hoặc chụp từ Camera gốc của điện thoại
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

  // Đăng ảnh lên Feed
  const handlePost = () => {
    if (!capturedImage) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} Hôm nay`;

    const newPost: MomentPost = {
      id: `moment_${Date.now()}`,
      author: 'Tâm (Bạn)',
      image: capturedImage,
      caption: caption.trim() || 'Khoảnh khắc mới vừa chụp ✨',
      timeAgo: timeStr,
      likes: 1,
    };

    const updated = [newPost, ...moments];
    setMoments(updated);
    localStorage.setItem('nep_locket_moments_v1', JSON.stringify(updated));

    sounds.playChime();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

    // Reset form
    setCapturedImage(null);
    setCaption('');
    setIsCameraOpen(false);
  };

  const handleLike = (id: string) => {
    sounds.playChime();
    const updated = moments.map((m) =>
      m.id === id ? { ...m, likes: m.likes + 1 } : m
    );
    setMoments(updated);
    localStorage.setItem('nep_locket_moments_v1', JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    const updated = moments.filter((m) => m.id !== id);
    setMoments(updated);
    localStorage.setItem('nep_locket_moments_v1', JSON.stringify(updated));
  };

  return (
    <div className="space-y-4 animate-ios-fade">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
            Locket Style · Khoảnh Khắc Bạn Bè
          </span>
          <h2 className="text-xl font-black text-[#18181B]">Nếp Moments</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setCapturedImage(null);
            setIsCameraOpen(true);
          }}
          className="px-4 py-2.5 bg-[#18181B] hover:bg-black text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
        >
          <Camera size={15} className="text-amber-400" /> Chụp Locket
        </button>
      </div>

      {/* Danh sách bài đăng phong cách Locket */}
      <div className="space-y-4">
        {moments.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[32px] p-4 shadow-sm border border-neutral-200/80 space-y-3"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-[#18181B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {item.author}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">{item.timeAgo}</span>
            </div>

            {/* Khung ảnh vuông 1:1 */}
            <div className="relative w-full aspect-square rounded-[26px] overflow-hidden bg-neutral-900 shadow-inner">
              <img src={item.image} alt="Moment" className="w-full h-full object-cover" />
            </div>

            <div className="flex justify-between items-center px-1">
              <p className="text-xs font-bold text-neutral-800 leading-snug">"{item.caption}"</p>
              <div className="flex items-center gap-2">
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
          </div>
        ))}
      </div>

      {/* ================= MODAL CAMERA LOCKET CHUẨN IOS ================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-ios-fade">
          <div className="w-full max-w-sm bg-[#18181B] rounded-[36px] p-5 text-white border border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar">
            
            {/* Top Bar trong Modal */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Nếp Locket Cam
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

            {/* Khung Ngắm Vuông 1:1 */}
            <div className="relative w-full aspect-square rounded-[28px] overflow-hidden bg-neutral-900 border-2 border-white/20 mb-3 flex items-center justify-center shadow-inner">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Ảnh vừa chụp"
                  className="w-full h-full object-cover"
                />
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

            {/* BƯỚC 1: KHI ĐANG NGẮM CHỤP (HIỆN NÚT CHỤP TRÒN) */}
            {!capturedImage ? (
              <div className="flex items-center justify-around py-2">
                {/* Nút chọn ảnh từ máy */}
                <label className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition active:scale-90" title="Chọn ảnh có sẵn">
                  <ImageIcon size={20} className="text-neutral-300" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Nút Chụp Tròn Locket ở Giữa */}
                <button
                  type="button"
                  onClick={handleCapture}
                  className="w-18 h-18 rounded-full border-4 border-amber-400 p-1 flex items-center justify-center active:scale-90 transition cursor-pointer shadow-lg"
                  title="Bấm để chụp ảnh"
                >
                  <div className="w-full h-full rounded-full bg-white active:bg-amber-300 transition" />
                </button>

                {/* Nút Đổi Camera Trước/Sau */}
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                  }
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition active:scale-90"
                  title="Đổi camera"
                >
                  <RefreshCw size={20} className="text-neutral-300" />
                </button>
              </div>
            ) : (
              /* BƯỚC 2: SAU KHI ĐÃ CHỤP (HIỆN Ô CHÚ THÍCH + NÚT ĐĂNG) */
              <div className="space-y-3 animate-ios-fade">
                <input
                  type="text"
                  placeholder="Gõ chú thích cho khoảnh khắc này..."
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
                    <Send size={14} /> Đăng Locket
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