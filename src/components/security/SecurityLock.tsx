import React, { useState } from 'react';
import { Delete, Fingerprint, Lock } from 'lucide-react';
import { sounds } from '../../utils/soundEngine';

interface SecurityLockProps {
  onUnlockSuccess: () => void;
}

export const SecurityLock: React.FC<SecurityLockProps> = ({ onUnlockSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const savedPin = localStorage.getItem('nep_security_pin');
  const isSettingUp = !savedPin;

  const handleKeyPress = (num: string) => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);

      if (nextPin.length === 4) {
        if (isSettingUp) {
          localStorage.setItem('nep_security_pin', nextPin);
          localStorage.setItem('nep_security_enabled', 'true');
          try { sounds?.playChime?.(); } catch {}
          onUnlockSuccess();
        } else {
          if (nextPin === savedPin) {
            try { sounds?.playChime?.(); } catch {}
            onUnlockSuccess();
          } else {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([40, 60, 40]);
            setErrorMsg('Mã PIN không đúng, vui lòng thử lại');
            setTimeout(() => {
              setPin('');
              setErrorMsg('');
            }, 800);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricAuth = async () => {
    if (window.PublicKeyCredential) {
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(25);
        try { sounds?.playChime?.(); } catch {}
        onUnlockSuccess();
      } catch {
        setErrorMsg('Xác thực sinh trắc học không khả dụng');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F0F12] text-white flex flex-col justify-between items-center py-12 px-6 select-none animate-tab-switch">
      <div className="text-center space-y-2 pt-8">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 text-amber-400">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-black tracking-tight">Nếp · Bảo Mật</h2>
        <p className="text-xs text-neutral-400 font-semibold">
          {isSettingUp ? 'Thiết lập mã PIN 4 số để bảo vệ ví của bạn' : 'Nhập mã PIN để mở khóa'}
        </p>
      </div>

      <div className="space-y-4 text-center">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50'
                  : 'bg-neutral-800 border border-white/20'
              }`}
            />
          ))}
        </div>
        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold animate-shake">{errorMsg}</p>
        )}
      </div>

      <div className="w-full max-w-xs space-y-3 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-400 active:text-black border border-white/10 text-xl font-black font-mono flex items-center justify-center transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleBiometricAuth}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-amber-400 border border-white/10 flex items-center justify-center cursor-pointer"
            title="Face ID / Vân tay"
          >
            <Fingerprint size={24} />
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-400 active:text-black border border-white/10 text-xl font-black font-mono flex items-center justify-center transition-all cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-neutral-400 border border-white/10 flex items-center justify-center cursor-pointer"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};