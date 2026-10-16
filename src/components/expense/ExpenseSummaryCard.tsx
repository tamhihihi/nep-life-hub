import React, { useState } from 'react';
import { Eye, EyeOff, Edit3, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const ExpenseSummaryCard: React.FC = () => {
  const { transactions = [], monthlyLimit = 5000000, setMonthlyLimit } = useAppStore();
  const [showAmount, setShowAmount] = useState(true);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyLimit.toString());

  // Tính tổng chi tiêu trong tháng hiện tại
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

  // Tính số ngày còn lại trong tháng
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.round(remaining / daysLeft);

  const phoCount = Math.floor(remaining / 50000);
  const bobaCount = Math.floor(remaining / 40000);

  const handleSaveLimit = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    const val = parseInt(tempLimit.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0 && typeof setMonthlyLimit === 'function') {
      setMonthlyLimit(val);
    }
    setIsEditingLimit(false);
  };

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-sm border border-neutral-200/80 space-y-4">
      {/* TIÊU ĐỀ & NÚT ẨN HIỆN SỐ TIỀN */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Ngân sách còn lại tháng này
          </span>
          <button
            type="button"
            onClick={() => setIsEditingLimit(!isEditingLimit)}
            className="text-neutral-400 hover:text-black transition"
            title="Đổi hạn mức"
          >
            <Edit3 size={13} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setShowAmount(!showAmount);
          }}
          className="text-neutral-400 hover:text-black transition cursor-pointer p-1"
        >
          {showAmount ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>

      {/* SỐ DƯ CÒN LẠI */}
      {isEditingLimit ? (
        <div className="flex items-center gap-2 animate-tab-switch">
          <input
            type="number"
            value={tempLimit}
            onChange={(e) => setTempLimit(e.target.value)}
            className="w-full bg-neutral-100 rounded-xl px-3 py-2 text-base font-black text-[#18181B] focus:outline-none"
            placeholder="Nhập hạn mức..."
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveLimit}
            className="px-4 py-2 bg-[#18181B] text-white rounded-xl text-xs font-black"
          >
            Lưu
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#18181B] font-mono">
            {showAmount ? `${remaining.toLocaleString('vi-VN')}đ` : '••••••••đ'}
          </h2>
        </div>
      )}

      {/* THẺ HẠN MỨC HÀNG NGÀY */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-300/55 text-amber-900 text-[11px] font-black">
        <Sparkles className="text-amber-600" size={13} />
        <span>Hôm nay được tiêu: {dailyAllowance.toLocaleString('vi-VN')}đ</span>
      </div>

      <p className="text-[10px] text-neutral-400 font-semibold px-1 leading-normal">
        ≈ {phoCount} bát phở 🍜 · {bobaCount} ly trà sữa 🧋
      </p>

      {/* THANH TIẾN ĐỘ TIÊU DÙNG */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentUsed > 85 ? 'bg-rose-500' : 'bg-[#18181B]'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold font-mono px-0.5">
          <span>Đã chi: {monthSpent.toLocaleString('vi-VN')}đ</span>
          <span>Hạn mức: {monthlyLimit.toLocaleString('vi-VN')}đ ({percentUsed}%)</span>
        </div>
      </div>
    </div>
  );
};