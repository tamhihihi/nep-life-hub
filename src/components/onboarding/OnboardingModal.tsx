import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, ShieldCheck, Smartphone, Wallet, Camera, Moon } from 'lucide-react';
import { sounds } from '../../utils/soundEngine';

// Import bộ icon Voxel 3D
import walletIcon from '../../assets/icons/wallet.png';
import cameraIcon from '../../assets/icons/camera.png';
import foodIcon from '../../assets/icons/food.png';
import friendsIcon from '../../assets/icons/friends.png';

interface OnboardingModalProps {
  userName: string;
  onComplete: (initialLimit: number) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userName, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [budgetInput, setBudgetInput] = useState('3000000');
  const [displayFormatted, setDisplayFormatted] = useState('3.000.000');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setBudgetInput('0');
      setDisplayFormatted('0');
      return;
    }
    const num = parseInt(raw, 10);
    setBudgetInput(num.toString());
    setDisplayFormatted(num.toLocaleString('vi-VN'));
  };

  const handleQuickSelect = (amount: number) => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(10);
    setBudgetInput(amount.toString());
    setDisplayFormatted(amount.toLocaleString('vi-VN'));
  };

  const handleNextStep = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(15);

    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else {
      try { sounds?.playChime?.(); } catch {}
      const finalLimit = parseInt(budgetInput, 10) || 3000000;
      onComplete(finalLimit);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-tab-switch">
      <div className="w-full max-w-sm bg-[#F8F8F7] text-[#18181B] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-neutral-200 animate-sheet-spring flex flex-col justify-between min-h-[520px]">
        
        {/* THANH ĐIỀU HƯỚNG BƯỚC (STEP INDICATOR) */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 bg-amber-500' : 'w-2 bg-neutral-300'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 bg-amber-500' : 'w-2 bg-neutral-300'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-6 bg-amber-500' : 'w-2 bg-neutral-300'}`} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Bước {step}/3
          </span>
        </div>

        {/* ================= BƯỚC 1: THIẾT LẬP NGÂN SÁCH THÁNG (RESET VỀ 0) ================= */}
        {step === 1 && (
          <div className="space-y-4 py-2 animate-tab-switch">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center p-2 mb-2 shadow-sm">
                <img src={walletIcon} alt="Ví tiền" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-black text-[#18181B]">
                Chào {userName}! 👋
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Hãy đặt ngân sách chi tiêu tháng này của bạn. Lịch sử ban đầu sẽ được reset về <span className="font-bold text-emerald-600">0đ</span>.
              </p>
            </div>

            {/* Ô NHẬP TIỀN */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                Ngân sách dự kiến (VNĐ)
              </span>
              <div className="flex items-center justify-center">
                <input
                  type="text"
                  value={displayFormatted}
                  onChange={handleInputChange}
                  className="w-full text-center text-3xl font-black font-mono text-[#18181B] bg-transparent focus:outline-none"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <span className="text-[10px] font-semibold text-neutral-400 block">
                (Có thể chỉnh sửa bất cứ lúc nào trong ứng dụng)
              </span>
            </div>

            {/* GỢI Ý NHANH HẠN MỨC */}
            <div className="grid grid-cols-3 gap-2">
              {[2000000, 3000000, 5000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickSelect(amt)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black border transition active:scale-95 cursor-pointer ${
                    budgetInput === amt.toString()
                      ? 'bg-[#18181B] text-white border-black'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {(amt / 1000000).toFixed(0)} Triệu
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= BƯỚC 2: HƯỚNG DẪN 3 KHÔNG GIAN CỐT LÕI ================= */}
        {step === 2 && (
          <div className="space-y-3.5 py-1 animate-tab-switch">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#18181B] flex items-center justify-center gap-1.5">
                3 Không Gian Trên Nếp Hub <Sparkles size={16} className="text-amber-500" />
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Chuyển đổi linh hoạt giữa 3 tab trên đầu màn hình:
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 p-1.5 shrink-0">
                  <img src={walletIcon} alt="Ví Tiền" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#18181B]">Ví Tiền & 1-Tap</h4>
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Chạm 1 giây ghi tiền cà phê, cơm trưa. Quét mã VietQR và chia bill bạn bè.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 p-1.5 shrink-0">
                  <img src={cameraIcon} alt="LokCam" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#18181B]">LokCam Widget</h4>
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Chụp ảnh và bắn ngay sang màn hình bạn thân/người yêu theo thời gian thực.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 p-1.5 shrink-0">
                  <img src={foodIcon} alt="Nếp Chill" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#18181B]">Nếp Chill</h4>
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Bàn xoay 3D "Trưa nay ăn gì" giải cứu cơn đói và quẻ bài thư giãn buổi tối.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= BƯỚC 3: MẸO CÀI ĐẶT PWA TOÀN MÀN HÌNH ================= */}
        {step === 3 && (
          <div className="space-y-4 py-2 animate-tab-switch text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#18181B] mx-auto flex items-center justify-center p-2 mb-1 shadow-md">
              <Smartphone size={28} className="text-amber-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#18181B]">
                Trải Nghiệm Toàn Màn Hình
              </h3>
              <p className="text-xs text-neutral-500 font-medium px-2">
                Để ứng dụng ẩn thanh duyệt web và mở tức thì như app App Store:
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm text-left space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-neutral-600">
                  Bấm nút <strong>Chia sẻ (Share)</strong> trên Safari hoặc dấu <strong>3 chấm</strong> trên Chrome.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-neutral-600">
                  Chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <ShieldCheck size={14} />
              <span>Dữ liệu của bạn được lưu riêng biệt theo Google ID</span>
            </div>
          </div>
        )}

        {/* NÚT TIẾP TỤC / BẮT ĐẦU */}
        <div className="pt-3">
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-4 rounded-2xl bg-[#18181B] hover:bg-black text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <span>{step === 3 ? 'Bắt đầu sử dụng Nếp Hub' : 'Tiếp tục'}</span>
            <ArrowRight size={15} className="text-amber-400" />
          </button>
        </div>

      </div>
    </div>
  );
};