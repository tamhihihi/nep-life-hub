import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const ReportView: React.FC = () => {
  const { transactions } = useAppStore();
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  // Lọc giao dịch theo Tuần hiện tại hoặc Tháng hiện tại
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (period === 'month') {
      return transactions.filter((t) => t.dateStr.startsWith(currentMonthPrefix));
    }

    // Tính ngày đầu tuần (Thứ 2)
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    return transactions.filter((t) => {
      const txDate = new Date(t.dateStr);
      return txDate >= monday;
    });
  }, [transactions, period]);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Tính dữ liệu cột biểu đồ thực tế
  const chartBars = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');

    if (period === 'week') {
      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const sums = [0, 0, 0, 0, 0, 0, 0];
      expenses.forEach((t) => {
        const d = new Date(t.dateStr).getDay();
        const idx = d === 0 ? 6 : d - 1;
        sums[idx] += t.amount;
      });
      const maxVal = Math.max(...sums, 1);
      const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

      return labels.map((label, i) => ({
        label,
        amount: sums[i],
        height: `${Math.max(8, Math.round((sums[i] / maxVal) * 100))}%`,
        val: sums[i] >= 1000000 ? `${(sums[i] / 1000000).toFixed(1)}M` : sums[i] > 0 ? `${Math.round(sums[i] / 1000)}K` : '0',
        active: i === todayIdx,
      }));
    } else {
      const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
      const sums = [0, 0, 0, 0];
      expenses.forEach((t) => {
        const dayOfMonth = parseInt(t.dateStr.split('-')[2] || '1', 10);
        const weekIdx = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
        sums[weekIdx] += t.amount;
      });
      const maxVal = Math.max(...sums, 1);
      const currentWeekIdx = Math.min(3, Math.floor((new Date().getDate() - 1) / 7));

      return labels.map((label, i) => ({
        label,
        amount: sums[i],
        height: `${Math.max(10, Math.round((sums[i] / maxVal) * 100))}%`,
        val: sums[i] >= 1000000 ? `${(sums[i] / 1000000).toFixed(1)}M` : sums[i] > 0 ? `${Math.round(sums[i] / 1000)}K` : '0',
        active: i === currentWeekIdx,
      }));
    }
  }, [filteredTransactions, period]);

  const catMap: Record<string, number> = {};
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

  const catList = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#18181B]">Báo cáo</h2>
          <p className="text-xs text-neutral-400 font-medium">Biết tiền đi đâu · Thống kê thực tế</p>
        </div>
        <div className="bg-neutral-200/80 p-0.5 rounded-xl flex text-xs font-bold">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              period === 'week' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'
            }`}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              period === 'month' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-neutral-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-neutral-400 font-medium">
              Tổng chi · {period === 'week' ? 'Tuần này' : 'Tháng này'}
            </p>
            <div className="text-3xl font-black text-[#18181B] mt-1 mb-4">
              {totalExpense.toLocaleString()}
              <span className="text-xl font-bold ml-0.5">đ</span>
            </div>
          </div>

          {totalIncome > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-neutral-400 font-medium">Tổng thu</p>
              <p className="text-sm font-black text-emerald-600 mt-0.5">
                +{totalIncome.toLocaleString()}đ
              </p>
            </div>
          )}
        </div>

        <div className="h-32 flex items-end justify-between gap-2 pt-5 pb-1 border-b border-neutral-100 px-1">
          {chartBars.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[9px] text-neutral-400 font-bold">{bar.val}</span>
              <div
                className={`w-full max-w-[26px] rounded-t-lg transition-all duration-500 ${
                  bar.active ? 'bg-[#18181B]' : 'bg-neutral-200'
                }`}
                style={{ height: bar.height }}
              />
              <span className="text-[10px] text-neutral-500 font-semibold">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-neutral-100">
        <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">
          Tỷ trọng danh mục
        </h3>
        {catList.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-6">Chưa có khoản chi nào trong kỳ này</p>
        ) : (
          <div className="space-y-3">
            {catList.map(([cat, amount]) => {
              const pct = Math.round((amount / (totalExpense || 1)) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-bold text-neutral-800 mb-1">
                    <span>{cat}</span>
                    <span>
                      {amount.toLocaleString()}đ ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#18181B] h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};