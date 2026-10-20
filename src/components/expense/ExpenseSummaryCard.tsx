import React, { useState } from 'react';
import { Eye, EyeOff, Edit3, ArrowDownLeft, ArrowUpRight, Sparkles, Calendar } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const ExpenseSummaryCard: React.FC = () => {
  const store = useAppStore();
  const transactions = (store as any)?.transactions || [];
  const monthlyLimit = Number((store as any)?.monthlyLimit) || 5000000;
  const setMonthlyLimit = (store as any)?.setMonthlyLimit;

  const salaryStartDay = Number(localStorage.getItem('nep_salary_start_day')) || 1;

  const [showAmount, setShowAmount] = useState(true);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyLimit.toString());

  const now = new Date();
  const todayNum = now.getDate();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  let cycleStartDate: Date;
  let cycleEndDate: Date;

  if (todayNum >= salaryStartDay) {
    cycleStartDate = new Date(thisYear, thisMonth, salaryStartDay);
    cycleEndDate = new Date(thisYear, thisMonth + 1, salaryStartDay - 1, 23, 59, 59);
  } else {
    cycleStartDate = new Date(thisYear, thisMonth - 1, salaryStartDay);
    cycleEndDate = new Date(thisYear, thisMonth, salaryStartDay - 1, 23, 59, 59);
  }

  const startDateStr = `${cycleStartDate.getFullYear()}-${String(cycleStartDate.getMonth() + 1).padStart(2, '0')}-${String(cycleStartDate.getDate()).padStart(2, '0')}`;
  const endDateStr = `${cycleEndDate.getFullYear()}-${String(cycleEndDate.getMonth() + 1).padStart(2, '0')}-${String(cycleEndDate.getDate()).padStart(2, '0')}`;

  const safeTransactions = Array.isArray(transactions) ? transactions.filter(Boolean) : [];

  const cycleTransactions = safeTransactions.filter((t) => {
    if (!t?.dateStr) return true;
    return t.dateStr >= startDateStr && t.dateStr <= endDateStr;
  });

  const totalExpense = cycleTransactions
    .filter((t) => t?.type === 'expense')
    .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  const totalIncome = cycleTransactions
    .filter((t) => t?.type === 'income')
    .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  const availableBalance = monthlyLimit + totalIncome - totalExpense;
  const totalBudget = monthlyLimit + totalIncome;
  const percentUsed = totalBudget > 0 ? Math.min(100, Math.round((totalExpense / totalBudget) * 100)) : 100;

  const msLeft = cycleEndDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
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
              Số dư khả dụng chu kỳ này
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

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-300/60 text-amber-900 text-xs font-black">
              <Sparkles size={12} className="text-amber-500 fill-amber-500" />
              <span>Hôm nay được tiêu: </span>
              <span className="font-mono">{dailyAllowance.toLocaleString('vi-VN')}đ</span>
            </div>

            <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-full">
              <Calendar size={10} /> Còn {daysLeft} ngày (hết ngày {cycleEndDate.getDate()}/{cycleEndDate.getMonth() + 1})
            </span>
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
          <span>Hạn mức: {monthlyLimit.toLocaleString('vi-VN')}đ (từ ngày {salaryStartDay})</span>
        </div>
      </div>
    </div>
  );
};