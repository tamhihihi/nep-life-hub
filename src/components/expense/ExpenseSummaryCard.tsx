import React, { useState } from 'react';
import { Eye, EyeOff, Edit3, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const ExpenseSummaryCard: React.FC = () => {
  const { transactions = [], monthlyLimit = 5000000, setMonthlyLimit } = useAppStore();
  const [showAmount, setShowAmount] = useState(true);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyLimit.toString());

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Tính tiền đã chi tháng này
  const monthSpent = transactions
    .filter((t) => {
      const d = new Date(t.dateStr);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = Math.max(0, monthlyLimit - monthSpent);
  const percentUsed = Math.min(100, Math.round((monthSpent / monthlyLimit) * 100));

  // Tính số tiền được tiêu mỗi ngày
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.round(remaining / daysLeft);

  const handleSaveLimit = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    const val = parseInt(tempLimit.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0 && typeof setMonthlyLimit === 'function') {
      setMonthlyLimit(val);
    }
    setIsEditingLimit(false);
  };

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-sm border border-neutral-200/90 space-y-4">
      {/* PHẦN 1: HÔM NAY ĐƯỢC TIÊU BAO NHIÊU (THÔNG TIN QUAN TRỌNG NHẤT) */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500 fill-amber-500" />
            Hôm nay bạn được tiêu
          </span>
          <div className="pt-1">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#18181B] font-mono">
              {showAmount ? `${dailyAllowance.toLocaleString('vi-VN')}đ` : '••••••••đ'}
            </h2>
          </div>
          <p className="text-[11px] font-semibold text-neutral-400">
            Còn {daysLeft} ngày nữa là hết tháng
          </p>
        </div>

        {/* Nút Ẩn/Hiện số tiền */}
        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setShowAmount(!showAmount);
          }}
          className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 flex items-center justify-center text-neutral-500 hover:text-black transition cursor-pointer"
          title="Ẩn/Hiện số dư"
        >
          {showAmount ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* PHẦN 2: TỔNG QUÁT CẢ THÁNG */}
      <div className="bg-[#F8F8F7] rounded-2xl p-3 border border-neutral-200/60 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-neutral-500">Quỹ còn lại cả tháng:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[#18181B] font-mono">
              {showAmount ? `${remaining.toLocaleString('vi-VN')}đ` : '••••••••đ'}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingLimit(!isEditingLimit)}
              className="text-neutral-400 hover:text-black p-0.5"
              title="Đổi hạn mức quỹ tháng"
            >
              <Edit3 size={12} />
            </button>
          </div>
        </div>

        {isEditingLimit && (
          <div className="flex items-center gap-2 pt-1 animate-tab-switch">
            <input
              type="number"
              value={tempLimit}
              onChange={(e) => setTempLimit(e.target.value)}
              className="w-full bg-white rounded-xl px-3 py-1.5 text-xs font-black text-[#18181B] border border-amber-300 focus:outline-none"
              placeholder="VD: 5000000"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveLimit}
              className="px-3 py-1.5 bg-[#18181B] text-white rounded-xl text-xs font-black shrink-0"
            >
              Lưu
            </button>
          </div>
        )}

        {/* Thanh đo mức độ tiêu tiền */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 85 ? 'bg-rose-500' : 'bg-[#18181B]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-400 font-bold font-mono">
            <span>Đã tiêu: {monthSpent.toLocaleString('vi-VN')}đ</span>
            <span>Hạn mức: {monthlyLimit.toLocaleString('vi-VN')}đ ({percentUsed}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};