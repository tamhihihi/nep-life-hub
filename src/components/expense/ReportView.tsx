import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const ReportView: React.FC = () => {
  const { transactions } = useAppStore();
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const catMap: Record<string, number> = {};
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  const catList = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#18181B]">Báo cáo</h2>
          <p className="text-xs text-neutral-400 font-medium">Biết tiền đi đâu · Thống kê minh bạch</p>
        </div>
        <div className="bg-neutral-200/80 p-0.5 rounded-xl flex text-xs font-bold">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              period === 'week' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'
            }`}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              period === 'month' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-neutral-100">
        <p className="text-xs text-neutral-400 font-medium">Tổng chi · Tháng này</p>
        <div className="text-3xl font-black text-[#18181B] mt-1 mb-4">
          {totalExpense.toLocaleString()}<span className="text-xl font-bold ml-0.5">đ</span>
        </div>

        <div className="h-28 flex items-end justify-between gap-3 pt-4 pb-1 border-b border-neutral-100 px-2">
          {[
            { label: 'T1', height: '35%', val: '1.2M' },
            { label: 'T2', height: '60%', val: '2.4M' },
            { label: 'T3', height: '85%', val: '3.5M', active: true },
            { label: 'T4', height: '25%', val: '900K' },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] text-neutral-400 font-bold">{bar.val}</span>
              <div
                className={`w-full max-w-[26px] rounded-t-lg transition-all ${
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
        <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">Tỷ trọng danh mục</h3>
        <div className="space-y-3">
          {catList.map(([cat, amount]) => {
            const pct = Math.round((amount / (totalExpense || 1)) * 100);
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold text-neutral-800 mb-1">
                  <span>{cat}</span>
                  <span>{amount.toLocaleString()}đ ({pct}%)</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#18181B] h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
