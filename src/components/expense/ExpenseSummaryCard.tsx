import React, { useState } from 'react';
import { Eye, EyeOff, Edit3, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const ExpenseSummaryCard: React.FC = () => {
  const store = useAppStore();
  const transactions = (store as any)?.transactions || [];
  const monthlyLimit = Number((store as any)?.monthlyLimit) || 5000000;
  const setMonthlyLimit = (store as any)?.setMonthlyLimit;

  const [showAmount, setShowAmount] = useState(true);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyLimit.toString());

  // Lấy chuỗi YYYY-MM hiện tại
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Màng lọc an toàn chống dữ liệu rác hoặc undefined
  const safeTransactions = Array.isArray(transactions) ? transactions.filter(Boolean) : [];

  // 1. TỔNG CHI TIÊU THÁNG (-)
  const totalExpense = safeTransactions
    .filter((t) => t?.type === 'expense' && (t?.dateStr ? String(t.dateStr).startsWith(currentYearMonth) : true))
    .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  // 2. TỔNG THU NHẬP / NẠP VÍ (+)
  const totalIncome = safeTransactions
    .filter((t) => t?.type === 'income' && (t?.dateStr ? String(t.dateStr).startsWith(currentYearMonth) : false))
    .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  // 3. SỐ DƯ KHẢ DỤNG HIỆN TẠI
  const availableBalance = monthlyLimit + totalIncome - totalExpense;

  // 4. TIẾN ĐỘ TIÊU DÙNG
  const totalBudget = monthlyLimit + totalIncome;
  const percentUsed = totalBudget > 0 ? Math.min(100, Math.round((totalExpense / totalBudget) * 100)) : 100;

  // 5. TIỀN ĐƯỢC TIÊU MỖI NGÀY
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.round(Math.max(0, availableBalance) / daysLeft);

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
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Số dư khả dụng hiện tại
            </span>
            <button
              type="button"
              onClick={() => setIsEditingLimit(!isEditingLimit)}
              className="text-neutral-400 hover:text-black p-0.5"
              title="Đổi ngân sách ban đầu"
            >
              <Edit3 size={12} />
            </button>
          </div>

          {isEditingLimit ? (
            <div className="flex items-center gap-2 pt-1 animate-tab-switch">
              <input
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                className="w-full bg-neutral-100 rounded-xl px-3 py-1.5 text-sm font-black text-[#18181B] focus:outline-none"
                placeholder="VD: 5000000"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveLimit}
                className="px-3 py-1.5 bg-[#18181B] text-white rounded-xl text-xs font-black shrink-0 cursor-pointer"
              >
                Lưu
              </button>
            </div>
          ) : (
            <div>
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                availableBalance >= 0 ? 'text-[#18181B]' : 'text-rose-600'
              }`}>
                {showAmount ? `${availableBalance.toLocaleString('vi-VN')}đ` : '••••••••đ'}
              </h2>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-300/60 text-amber-900 text-xs font-black mt-1">
            <Sparkles size={12} className="text-amber-500 fill-amber-500" />
            <span>Hôm nay được tiêu: </span>
            <span className="font-mono">{dailyAllowance.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            try { sounds?.playKeypadTap?.(); } catch {}
            setShowAmount(!showAmount);
          }}
          className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 flex items-center justify-center text-neutral-500 hover:text-black transition cursor-pointer"
        >
          {showAmount ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <ArrowDownLeft size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Đã nhận (+):</span>
            <span className="text-xs font-black font-mono text-emerald-700 truncate block">
              +{totalIncome.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <ArrowUpRight size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Đã tiêu (-):</span>
            <span className="text-xs font-black font-mono text-rose-700 truncate block">
              -{totalExpense.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentUsed > 85 ? 'bg-rose-500' : 'bg-[#18181B]'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold font-mono">
          <span>Tiến độ chi tiêu: {percentUsed}%</span>
          <span>Ngân sách gốc: {monthlyLimit.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
    </div>
  );
};