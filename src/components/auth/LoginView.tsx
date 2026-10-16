import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, ArrowRight, LogIn } from 'lucide-react';
import { sounds } from '../../utils/soundEngine';

// Import bộ icon voxel để trang trí màn hình chào mừng
import walletIcon from '../../assets/icons/wallet.png';
import cameraIcon from '../../assets/icons/camera.png';
import foodIcon from '../../assets/icons/food.png';
import friendsIcon from '../../assets/icons/friends.png';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface LoginViewProps {
  onLoginSuccess: (user: GoogleUser) => void;
}

// Client ID của Google (Bạn có thể cấu hình trong file .env: VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1058298492048-sample.apps.googleusercontent.com';

// Giải mã JWT Payload từ Google mà không cần cài thêm thư viện
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  useEffect(() => {
    // Khởi tạo Google Identity Services (GIS)
    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        setIsGsiLoaded(true);
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            const payload = parseJwt(response.credential);
            if (payload) {
              try { sounds?.playChime?.(); } catch {}
              if ('vibrate' in navigator) navigator.vibrate([15, 30, 20]);

              const user: GoogleUser = {
                id: payload.sub,
                name: payload.name || 'Người dùng Google',
                email: payload.email,
                picture: payload.picture || '',
              };
              onLoginSuccess(user);
            }
          },
          auto_select: false,
        });

        // Vẽ nút Google Sign-In chuẩn chính thức của Google
        const btnContainer = document.getElementById('googleBtnContainer');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 290,
          });
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [onLoginSuccess]);

  // Đăng nhập Demo nhanh (Dành cho việc kiểm tra giao diện khi chưa cấu hình Google Cloud Console)
  const handleDemoGoogleLogin = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(20);

    const demoUser: GoogleUser = {
      id: 'google_123456789',
      name: 'Nguyễn Văn Tâm',
      email: 'tam.developer@gmail.com',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    onLoginSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#18181B] font-sans flex flex-col justify-between selection:bg-neutral-200 p-4">
      <div className="w-full max-w-sm mx-auto min-h-screen flex flex-col justify-between py-8">
        
        {/* ================= PHẦN ĐẦU: LOGO & BRANDING ================= */}
        <div className="text-center pt-4 space-y-3">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-[28px] bg-[#18181B] shadow-xl border border-neutral-300/60 p-3 mx-auto flex items-center justify-center animate-glow">
              <img src={friendsIcon} alt="Nếp" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-[#F8F8F7] flex items-center justify-center shadow-sm">
              <Sparkles size={13} className="text-black" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#18181B] flex items-center justify-center gap-1.5">
              Nếp · Life Hub
            </h1>
            <p className="text-xs text-neutral-500 font-semibold max-w-[260px] mx-auto mt-1 leading-relaxed">
              Quản lý chi tiêu, nhịp sống cá nhân & khoảnh khắc tức thì cùng bạn thân.
            </p>
          </div>
        </div>

        {/* ================= PHẦN GIỮA: 3 TÍNH NĂNG NỔI BẬT ================= */}
        <div className="bg-white rounded-[32px] p-4 border border-neutral-200/90 shadow-sm space-y-3 my-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block px-1">
            Không gian độc quyền
          </span>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100">
              <img src={walletIcon} alt="Ví tiền" className="w-8 h-8 object-contain" />
              <div>
                <h4 className="text-xs font-black text-[#18181B]">Ví Tiền & 1-Tap Ghi Nhanh</h4>
                <p className="text-[10px] text-neutral-400 font-medium">Theo dõi hạn mức & chia bill VietQR</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100">
              <img src={cameraIcon} alt="LokCam" className="w-8 h-8 object-contain" />
              <div>
                <h4 className="text-xs font-black text-[#18181B]">LokCam Widget Tức Thì</h4>
                <p className="text-[10px] text-neutral-400 font-medium">Bắn ảnh trực tiếp đến màn hình bạn thân</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100">
              <img src={foodIcon} alt="Nếp Chill" className="w-8 h-8 object-contain" />
              <div>
                <h4 className="text-xs font-black text-[#18181B]">Nếp Chill & Thực Đơn 3D</h4>
                <p className="text-[10px] text-neutral-400 font-medium">Trưa nay ăn gì & quẻ bài đêm giải tỏa</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PHẦN ĐÁY: KHỐI GOOGLE SIGN-IN ================= */}
        <div className="space-y-4 pt-4 text-center">
          
          <div className="space-y-2.5 flex flex-col items-center">
            {/* 1. NÚT GOOGLE CHÍNH THỨC RENDER TỪ GIS */}
            <div id="googleBtnContainer" className="min-h-[44px] flex justify-center" />

            {/* 2. NÚT GOOGLE TÙY BIẾN DÀNH CHO BẢN DEV / THỬ NGHIỆM */}
            <button
              type="button"
              onClick={handleDemoGoogleLogin}
              className="w-full max-w-[290px] py-3.5 px-4 bg-white hover:bg-neutral-50 text-[#18181B] font-black text-xs rounded-full border border-neutral-300/90 shadow-sm flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </div>

          {/* CAM KẾT BẢO MẬT & ĐIỀU KHOẢN */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-neutral-400">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Chỉ đăng nhập bằng Google · Dữ liệu bảo mật</span>
          </div>

          <p className="text-[10px] text-neutral-400 leading-normal max-w-xs mx-auto">
            Bằng việc tiếp tục, bạn đồng ý với các điều khoản bảo mật dữ liệu cá nhân trên thiết bị của Nếp Hub.
          </p>
        </div>

      </div>
    </div>
  );
};