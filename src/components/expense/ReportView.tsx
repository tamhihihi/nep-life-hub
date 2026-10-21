import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  PieChart as PieIcon, 
  Sparkles, 
  Calendar, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ReportView: React.FC = () => {
  const store = useAppStore();
  const transactions = (store as any)?.transactions || [];
  const monthlyLimit = Number((store as any)?.monthlyLimit) || 5000000;
  const salaryStartDay = Number(localStorage.getItem('nep_salary_start_day')) || 1;

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTxs = useMemo(() => {
    return transactions.filter((t: any) => t?.dateStr && String(t.dateStr).startsWith(currentYearMonth));
  }, [transactions, currentYearMonth]);

  const totalExpense = currentMonthTxs
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

  const totalIncome = currentMonthTxs
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

  // 1. THUẬT TOÁN PHÂN CHIA DANH MỤC CHI TIÊU & TÍNH GÓC VẼ BIỂU ĐỒ TRÒN SVG
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTxs
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        const cat = t.category || 'Khác';
        map[cat] = (map[cat] || 0) + Number(t.amount);
      });

    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#64748B'];
    let accAngle = 0;

    return Object.entries(map).map(([name, amount], index) => {
      const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      const angle = (percent / 100) * 360;
      const startAngle = accAngle;
      accAngle += angle;

      return {
        name,
        amount,
        percent: Math.round(percent),
        color: colors[index % colors.length],
        startAngle,
        angle,
      };
    });
  }, [currentMonthTxs, totalExpense]);

  // 2. THUẬT TOÁN DỰ BÁO CHI TIÊU (SPENDING FORECAST)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = Math.max(1, now.getDate());
  const daysLeft = Math.max(1, daysInMonth - daysPassed);
  
  const dailyBurnRate = Math.round(totalExpense / daysPassed);
  const remainingBudget = Math.max(0, monthlyLimit + totalIncome - totalExpense);
  const daysUntilExhaustion = dailyBurnRate > 0 ? Math.floor(remainingBudget / dailyBurnRate) : 99;

  // 3. ĐIỂM SỨC KHỎE TÀI CHÍNH (0 - 100 ĐIỂM)
  const healthScore = Math.max(10, Math.min(100, Math.round(100 - (totalExpense / (monthlyLimit || 1)) * 70)));

  return (
    <div className="space-y-4 animate-tab-switch pb-24">
      
      {/* THẺ ĐIỂM SỨC KHỎE TÀI CHÍNH */}
      <div className="bg-gradient-to-br from-[#18181B] to-[#27272A] text-white rounded-[32px] p-5 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <ShieldCheck size={13} /> Sức khỏe tài chính tháng
          </span>
          <span className="text-xs font-mono font-bold text-neutral-400">Chu kỳ từ ngày {salaryStartDay}</span>
        </div>

        <div className="flex items-baseline gap-2">
          <h2 className="text-4xl font-black font-mono text-white">{healthScore}</h2>
          <span className="text-sm font-bold text-neutral-400">/ 100 điểm</span>
        </div>

        <p className="text-xs text-neutral-300 font-medium">
          {healthScore >= 80 
            ? '🌿 Bạn đang kiểm soát chi tiêu rất xuất sắc!' 
            : healthScore >= 50 
            ? '⚠️ Chi tiêu đang ở mức trung bình, hãy chú ý các bữa ăn ngoài.' 
            : '🚨 Báo động: Tốc độ tiêu tiền đang vượt quá hạn mức an toàn!'}
        </p>
      </div>

      {/* THẺ CẢNH BÁO DỰ BÁO CẠN QUỸ */}
      <div className="bg-amber-500/10 border border-amber-300/70 rounded-3xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center shrink-0 font-bold">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-black text-amber-950">Dự báo chi tiêu thông minh</h4>
          <p className="text-[11px] text-amber-900 font-medium mt-0.5">
            Với mức tiêu trung bình <b className="font-mono">{dailyBurnRate.toLocaleString('vi-VN')}đ/ngày</b>, 
            {daysUntilExhaustion < daysLeft 
              ? ` ví của bạn có nguy cơ cạn quỹ sau ${daysUntilExhaustion} ngày nữa!` 
              : ` bạn hoàn toàn đủ tiền duy trì đến hết tháng.`}
          </p>
        </div>
      </div>

      {/* BIỂU ĐỒ TRÒN DONUT CHART BẰNG SVG SIÊU NHẸ */}
      <div className="bg-white rounded-[32px] p-5 border border-neutral-200/90 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-[#18181B] flex items-center gap-1.5">
            <PieIcon size={14} className="text-amber-500" /> Cơ cấu chi tiêu tháng
          </span>
          <span className="text-[10px] font-mono font-bold text-neutral-400">
            Tổng: {totalExpense.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {totalExpense === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-8">Chưa có giao dịch chi tiêu trong tháng</p>
        ) : (
          <div className="flex items-center justify-around gap-4 pt-2">
            {/* SVG DONUT CHART */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {categoryStats.map((cat, i) => {
                  const strokeDasharray = `${cat.percent} ${100 - cat.percent}`;
                  const strokeDashoffset = -categoryStats.slice(0, i).reduce((s, c) => s + c.percent, 0);
                  return (
                    <circle
                      key={cat.name}
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth="5"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700"
                    />
                  );
                })}
              </svg>
              <div className="absolute text-center">
                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Chi</span>
                <span className="text-xs font-black font-mono text-[#18181B]">
                  {(totalExpense / 1000).toFixed(0)}k
                </span>
              </div>
            </div>

            {/* DANH SÁCH DANH MỤC VÀ % */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-bold text-[#18181B] truncate">{cat.name}</span>
                  </div>
                  <span className="font-black font-mono text-neutral-500 shrink-0">{cat.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};