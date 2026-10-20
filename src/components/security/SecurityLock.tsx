import React, { useState, useEffect } from 'react';
import { Delete, Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/soundEngine';

interface SecurityLockProps {
  onUnlockSuccess: () => void;
}

export const SecurityLock: React.FC<SecurityLockProps> = ({ onUnlockSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Kiểm tra mã PIN đã có hay chưa (nếu chưa có thì đây là lần đầu tạo PIN)
  const savedPin = localStorage.getItem('nep_security_pin');
  const isSettingUp = !savedPin;

  // Tự động gợi ý mở Face ID / Vân tay khi logo chào vừa tắt
  useEffect(() => {
    if (!isSettingUp && typeof window !== 'undefined' && window.PublicKeyCredential) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isSettingUp]);

  const handleKeyPress = (num: string) => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);

      if (nextPin.length === 4) {
        if (isSettingUp) {
          // Lưu mã PIN lần đầu
          localStorage.setItem('nep_security_pin', nextPin);
          localStorage.setItem('nep_security_enabled', 'true');
          try { sounds?.playChime?.(); } catch {}
          onUnlockSuccess();
        } else {
          // Kiểm tra mã PIN đã lưu
          if (nextPin === savedPin) {
            try { sounds?.playChime?.(); } catch {}
            onUnlockSuccess();
          } else {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([40, 60, 40]);
            setErrorMsg('Mã PIN không đúng, vui lòng thử lại');
            setTimeout(() => {
              setPin('');
              setErrorMsg('');
            }, 700);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    setPin((prev) => prev.slice(0, -1));
  };

  // Mở khóa bằng Face ID / Vân tay
  const handleBiometricAuth = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(25);
      
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          try { sounds?.playChime?.(); } catch {}
          onUnlockSuccess();
          return;
        }
      }
      try { sounds?.playChime?.(); } catch {}
      onUnlockSuccess();
    } catch {
      setErrorMsg('Không thể nhận diện sinh trắc học, vui lòng nhập mã PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-[180] bg-[#121216] text-white flex flex-col justify-between items-center py-10 px-6 select-none animate-tab-switch">
      {/* HEADER */}
      <div className="text-center space-y-2 pt-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/15 text-amber-400">
          <Lock size={26} />
        </div>
        <h2 className="text-lg font-black tracking-tight text-white">
          {isSettingUp ? 'Thiết Lập Mã PIN Mới' : 'Xác Thực Danh Tính'}
        </h2>
        <p className="text-xs text-neutral-400 font-semibold max-w-[240px] mx-auto">
          {isSettingUp 
            ? 'Nhập 4 số để tạo mật khẩu bảo vệ ví' 
            : 'Mở khóa bằng Face ID, Vân tay hoặc nhập mã PIN'}
        </p>
      </div>

      {/* 4 CHẤM MÃ PIN */}
      <div className="space-y-3 text-center my-auto">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/60'
                  : 'bg-neutral-800 border border-white/20'
              }`}
            />
          ))}
        </div>
        {errorMsg ? (
          <p className="text-xs text-rose-500 font-bold animate-shake">{errorMsg}</p>
        ) : (
          <p className="text-[11px] text-neutral-500 font-mono flex items-center justify-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" />
            Bảo vệ bởi Nếp Security
          </p>
        )}
      </div>

      {/* BÀN PHÍM CẢM ỨNG 3D */}
      <div className="w-full max-w-xs space-y-3 pb-2">
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-400 active:text-black border border-white/10 text-xl font-black font-mono flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* NÚT QUÉT FACE ID / TOUCH ID */}
          <button
            type="button"
            onClick={handleBiometricAuth}
            className="h-14 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 active:scale-95 text-amber-400 border border-amber-400/30 flex flex-col items-center justify-center cursor-pointer shadow-sm"
            title="Quét Face ID / Vân tay"
          >
            <Fingerprint size={22} />
            <span className="text-[8px] font-black uppercase mt-0.5">Sinh trắc</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-400 active:text-black border border-white/10 text-xl font-black font-mono flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-neutral-400 border border-white/10 flex items-center justify-center cursor-pointer"
            title="Xóa số"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};