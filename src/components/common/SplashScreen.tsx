import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import walletIcon from '../../assets/icons/wallet.png';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Hiển thị logo 1.5 giây, sau đó mờ dần trong 300ms rồi chuyển màn hình
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        onFinish();
      }, 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[200] bg-[#121216] flex flex-col items-center justify-center p-6 text-white transition-opacity duration-300 ${
      fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Vệt hào quang nền */}
      <div className="absolute w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-4 animate-sheet-spring">
        {/* KHUNG LOGO VOXEL NỔI BẬT */}
        <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/15 p-4 shadow-2xl flex items-center justify-center relative shadow-amber-500/10">
          <img 
            src={walletIcon} 
            alt="Nếp Hub Logo" 
            className="w-full h-full object-contain drop-shadow-lg animate-pulse" 
          />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <Sparkles size={11} className="text-black fill-black" />
          </span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            Nếp · Life Hub
          </h1>
          <p className="text-xs font-semibold text-neutral-400">
            Quản Lý Tài Chính & Sống Nề Nếp
          </p>
        </div>
      </div>

      {/* VÒNG QUAY ĐANG KHỞI TẠO Ở ĐÁY */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
          Đang khởi tạo ví an toàn...
        </span>
      </div>
    </div>
  );
};