import React, { useState } from 'react';
import { Eye, EyeOff, Edit3, Sparkles, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const ExpenseSummaryCard: React.FC = () => {
  const { transactions = [], monthlyLimit = 5000000, setMonthlyLimit } = useAppStore();
  const [showAmount, setShowAmount] = useState(true);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyLimit.toString());
  const [wobbleItem, setWobbleItem] = useState<'pho' | 'boba' | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthSpent = transactions
    .filter((t) => {
      const d = new Date(t.dateStr);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = Math.max(0, monthlyLimit - monthSpent);
  const percentUsed = Math.min(100, Math.round((monthSpent / monthlyLimit) * 100));

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.round(remaining / daysLeft);

  const phoCount = Math.floor(remaining / 50000);
  const bobaCount = Math.floor(remaining / 40000);

  // Đánh giá tình trạng ví để đổi màu sắc sống động
  const getWalletHealth = () => {
    if (percentUsed < 70) {
      return {
        label: 'Ví đang rất khỏe',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
        dot: 'bg-emerald-500 shadow-emerald-400/60',
        barGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      };
    }
    if (percentUsed < 90) {
      return {
        label: 'Tiêu vừa tay thôi nhé',
        color: 'text-amber-800 bg-amber-50 border-amber-200/80',
        dot: 'bg-amber-500 shadow-amber-400/60',
        barGradient: 'from-amber-400 via-orange-400 to-amber-500',
      };
    }
    return {
      label: 'Cảnh báo: Sắp cạn quỹ!',
      color: 'text-rose-700 bg-rose-50 border-rose-200/80',
      dot: 'bg-rose-500 shadow-rose-400/60 animate-ping',
      barGradient: 'from-orange-500 via-rose-500 to-red-600',
    };
  };

  const health = getWalletHealth();

  const handleSaveLimit = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    const val = parseInt(tempLimit.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0 && typeof setMonthlyLimit === 'function') {
      setMonthlyLimit(val);
    }
    setIsEditingLimit(false);
  };

  const triggerWobble = (item: 'pho' | 'boba') => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(10);
    setWobbleItem(item);
    setTimeout(() => setWobbleItem(null), 500);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-white to-neutral-50/70 rounded-[34px] p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] border border-neutral-200/80 space-y-4">
      
      {/* Vệt hào quang nền động vi lượng */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* DÒNG TIÊU ĐỀ & HUY HIỆU SỨC KHỎE VÍ */}
      <div className="relative flex justify-between items-center px-0.5">
        <div className="flex items-center gap-2">
          {/* Đèn nhịp thở tình trạng ví */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-wide ${health.color}`}>
            <span className={`w-2 h-2 rounded-full ${health.dot} shadow-[0_0_8px]`} />
            <span>{health.label}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingLimit(!isEditingLimit)}
            className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-400 hover:text-black transition"
            title="Đổi hạn mức"
          >
            <Edit3 size={11} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setShowAmount(!showAmount);
          }}
          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200/80 flex items-center justify-center text-neutral-500 hover:text-black transition cursor-pointer"
        >
          {showAmount ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* SỐ TIỀN CÒN LẠI (TYPOGRAPHY NỔI BẬT) */}
      <div className="relative pt-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-0.5">
          Ngân sách còn lại tháng này
        </span>

        {isEditingLimit ? (
          <div className="flex items-center gap-2 animate-tab-switch pt-1">
            <input
              type="number"
              value={tempLimit}
              onChange={(e) => setTempLimit(e.target.value)}
              className="w-full bg-neutral-100 rounded-2xl px-4 py-2.5 text-lg font-black text-[#18181B] focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Nhập hạn mức..."
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveLimit}
              className="px-4 py-2.5 bg-[#18181B] text-white rounded-2xl text-xs font-black shadow-md active:scale-95 transition"
            >
              Lưu
            </button>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#18181B] font-mono drop-shadow-sm">
              {showAmount ? `${remaining.toLocaleString('vi-VN')}đ` : '••••••••đ'}
            </h2>
          </div>
        )}
      </div>

      {/* THẺ HẠN MỨC NGÀY & QUY ĐỔI MÓN ĂN VUI VẺ */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-300/70 text-amber-900 text-xs font-black shadow-sm">
          <Sparkles className="text-amber-500 animate-spin-slow" size={13} />
          <span>Hôm nay được tiêu: <span className="font-mono">{dailyAllowance.toLocaleString('vi-VN')}đ</span></span>
        </div>

        {/* Nút bấm vui vẻ nhún nhảy */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => triggerWobble('pho')}
            className={`px-2 py-1 rounded-xl bg-neutral-100 hover:bg-amber-100/70 border border-neutral-200/60 font-bold text-neutral-700 transition cursor-pointer active:scale-90 ${
              wobbleItem === 'pho' ? 'scale-125 rotate-6 bg-amber-200' : ''
            }`}
            title="Quy đổi phở"
          >
            ≈ {phoCount} 🍜
          </button>
          <button
            type="button"
            onClick={() => triggerWobble('boba')}
            className={`px-2 py-1 rounded-xl bg-neutral-100 hover:bg-amber-100/70 border border-neutral-200/60 font-bold text-neutral-700 transition cursor-pointer active:scale-90 ${
              wobbleItem === 'boba' ? 'scale-125 -rotate-6 bg-amber-200' : ''
            }`}
            title="Quy đổi trà sữa"
          >
            {bobaCount} 🧋
          </button>
        </div>
      </div>

      {/* THANH TIẾN ĐỘ THIẾT KẾ CẢNH BÁO GRADIENT MƯỢT MÀ */}
      <div className="relative space-y-1.5 pt-1.5">
        <div className="w-full h-3 rounded-full bg-neutral-200/70 p-0.5 shadow-inner overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${health.barGradient} transition-all duration-700 shadow-sm`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold font-mono px-1">
          <span className="flex items-center gap-1">
            <TrendingDown size={11} className="text-neutral-400" />
            Đã chi: {monthSpent.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-neutral-600">
            Hạn mức: {monthlyLimit.toLocaleString('vi-VN')}đ ({percentUsed}%)
          </span>
        </div>
      </div>

    </div>
  );
};