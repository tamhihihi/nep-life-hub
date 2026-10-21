import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, CheckCircle2, AlertCircle, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { sounds } from '../../utils/soundEngine';

interface OtpVerificationViewProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  email,
  onVerified,
  onCancel,
}) => {
  // Tạo mã OTP ngẫu nhiên 4 số (hoặc cố định 1234 theo demo)
  const [generatedOtp, setGeneratedOtp] = useState('1234');
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error' | 'success'>('idle');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  // Ẩn bớt email dạng s******@gmail.com
  const maskEmail = (rawEmail: string) => {
    if (!rawEmail || !rawEmail.includes('@')) return 's******@gmail.com';
    const [name, domain] = rawEmail.split('@');
    const maskedName = name.length > 2 ? `${name[0]}${'*'.repeat(name.length - 1)}` : `${name}*`;
    return `${maskedName}@${domain}`;
  };

  // Đếm ngược thời gian gửi lại mã
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Tự động focus vào ô đầu tiên khi mở màn hình
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const triggerHaptic = (type: 'tap' | 'error' | 'success') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'tap') navigator.vibrate(10);
      if (type === 'error') navigator.vibrate([40, 60, 40]);
      if (type === 'success') navigator.vibrate([20, 60, 30]);
    }
  };

  // Xử lý khi nhập từng ô số
  const handleDigitChange = (index: number, value: string) => {
    setStatus('idle');
    const numericChar = value.replace(/\D/g, '').slice(-1); // Chỉ lấy ký tự số cuối

    const nextDigits = [...digits];
    nextDigits[index] = numericChar;
    setDigits(nextDigits);

    if (numericChar) {
      triggerHaptic('tap');
      try { sounds?.playKeypadTap?.(); } catch {}
      // Tự nhảy sang ô kế tiếp
      if (index < 3) {
        inputRefs[index + 1].current?.focus();
      } else {
        // Đã nhập đủ 4 số -> tự động kiểm tra
        verifyCode(nextDigits.join(''));
      }
    }
  };

  // Xử lý phím Backspace để lùi lại ô trước
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Hỗ trợ dán (paste) 4 số
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 4);
    if (!pasteData) return;

    const nextDigits = ['', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      nextDigits[i] = pasteData[i];
    }
    setDigits(nextDigits);
    triggerHaptic('tap');

    if (pasteData.length === 4) {
      verifyCode(pasteData);
    } else {
      inputRefs[pasteData.length]?.current?.focus();
    }
  };

  // Kiểm tra mã OTP
  const verifyCode = (codeToCheck?: string) => {
    const code = codeToCheck || digits.join('');
    if (code.length < 4) return;

    setStatus('verifying');

    setTimeout(() => {
      if (code === generatedOtp) {
        setStatus('success');
        triggerHaptic('success');
        try { sounds?.playChime?.(); } catch {}
        // Chờ hiệu ứng xanh hoàn tất và chuyển vào trang chính
        setTimeout(() => {
          onVerified();
        }, 1200);
      } else {
        setStatus('error');
        triggerHaptic('error');
        try { sounds?.playKeypadTap?.(); } catch {}
      }
    }, 900);
  };

  // Gửi lại mã
  const handleResend = () => {
    if (!canResend) return;
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newCode);
    setDigits(['', '', '', '']);
    setStatus('idle');
    setCountdown(30);
    setCanResend(false);
    triggerHaptic('tap');
    try { sounds?.playChime?.(); } catch {}
    inputRefs[0].current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121216] flex flex-col items-center justify-center p-4 select-none">
      
      {/* NÚT QUAY LẠI */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft size={18} />
      </button>

      {/* THẺ CARD TRUNG TÂM CHUẨN DESIGN VIDEO */}
      <div className="w-full max-w-[360px] bg-white rounded-[36px] p-7 shadow-2xl border border-neutral-100 flex flex-col items-center text-center space-y-5 animate-sheet-spring relative">
        
        {/* ICON Ổ KHÓA CHUYỂN TRẠNG THÁI (TÍM / ĐỎ / XANH LÁ) */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            status === 'error'
              ? 'bg-rose-50 text-rose-500 border-2 border-rose-200'
              : status === 'success'
              ? 'bg-emerald-50 text-emerald-500 border-2 border-emerald-300'
              : 'bg-indigo-50/70 text-indigo-500 border-2 border-indigo-200/80'
          }`}
        >
          {status === 'success' ? (
            <Unlock size={26} className="animate-bounce" />
          ) : (
            <Lock size={26} />
          )}
        </div>

        {/* TIÊU ĐỀ & MÔ TẢ */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#18181B] tracking-tight">
            {status === 'success' ? "You're verified" : "Verify it's you"}
          </h2>
          <p className="text-xs text-neutral-500 font-medium leading-relaxed">
            {status === 'success' ? (
              <span className="text-emerald-600 font-bold">Your account has been verified.</span>
            ) : (
              <>
                Enter the 4-digit code we just sent to <br />
                <span className="font-bold text-neutral-800 font-mono">{maskEmail(email)}</span>
              </>
            )}
          </p>
        </div>

        {/* 4 Ô NHẬP MÃ SỐ OTP VỚI HIỆU ỨNG RUNG / XANH LÁ */}
        <div className={`flex justify-center gap-3 pt-1 ${status === 'error' ? 'animate-shake' : ''}`}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={status === 'verifying' || status === 'success'}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-13 h-16 sm:w-14 sm:h-16 rounded-2xl text-2xl font-black font-mono text-center transition-all duration-200 focus:outline-none ${
                status === 'success'
                  ? 'bg-emerald-500 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/25'
                  : status === 'error'
                  ? 'bg-rose-50 border-2 border-rose-400 text-rose-600'
                  : digit
                  ? 'bg-neutral-50 border-2 border-neutral-300 text-[#18181B]'
                  : 'bg-neutral-50 border-2 border-neutral-200 text-[#18181B] focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100'
              }`}
            />
          ))}
        </div>

        {/* DÒNG BÁO LỖI KHI NHẬP SAI MÃ */}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold animate-tab-switch">
            <AlertCircle size={14} className="shrink-0" />
            <span>That code didn't match. Try again.</span>
          </div>
        )}

        {/* NÚT HÀNH ĐỘNG CHUYỂN MÀU THEO TIẾN ĐỘ */}
        <div className="w-full pt-1">
          <button
            type="button"
            disabled={status === 'verifying' || digits.join('').length < 4}
            onClick={() => {
              if (status === 'success') onVerified();
              else verifyCode();
            }}
            className={`w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
              status === 'success'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none'
            }`}
          >
            {status === 'verifying' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying</span>
              </>
            ) : status === 'success' ? (
              <>
                <span>Continue</span>
                <ArrowRight size={15} />
              </>
            ) : (
              <span>Verify code</span>
            )}
          </button>
        </div>

        {/* BỘ ĐẾM GỬI LẠI MÃ */}
        <div className="pt-1 text-xs font-semibold text-neutral-400">
          Didn't get a code?{' '}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Resend code
            </button>
          ) : (
            <span className="font-mono text-neutral-600 font-bold">
              Resend in 0:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          )}
        </div>

        {/* DÒNG GỢI Ý MÃ OTP ĐỂ TEST DỄ DÀNG (GIỐNG TRONG VIDEO) */}
        <div className="text-[11px] font-bold text-neutral-400 pt-1">
          Your OTP is: <span className="font-mono text-neutral-700 font-black tracking-widest">{generatedOtp}</span>
        </div>

      </div>
    </div>
  );
};