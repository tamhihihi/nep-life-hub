import React, { useState } from 'react';
import { Eye, EyeOff, QrCode, Plus, Pencil, Check, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const QUICK_BUDGETS = [10000000, 15000000, 20000000, 25000000, 30000000];

export const ExpenseSummaryCard: React.FC = () => {
  const { monthlyLimit, setMonthlyLimit, transactions, setIsKeypadOpen, setIsQrOpen } = useAppStore();
  const [hideAmount, setHideAmount] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyLimit.toString());

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySpent = transactions
    .filter((t) => t.dateStr === todayStr && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthSpent = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = Math.max(0, monthlyLimit - monthSpent);
  const percentage = Math.min(100, Math.round((monthSpent / monthlyLimit) * 100));

  const handleOpenEdit = () => {
    setTempLimit(monthlyLimit.toString());
    setIsEditingLimit(true);
  };

  const handleSaveLimit = () => {
    const val = parseInt(tempLimit, 10);
    if (!isNaN(val) && val > 0) {
      setMonthlyLimit(val);
    }
    setIsEditingLimit(false);
  };

  return (
    <>
      <div className="bg-white rounded-[28px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-neutral-100">
        <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
          <span>Còn lại tháng này · theo hạn mức Nếp</span>
          <button
            type="button"
            onClick={() => setHideAmount(!hideAmount)}
            className="text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            {hideAmount ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="text-[32px] font-black tracking-tight text-[#18181B] mb-2 leading-none">
          {hideAmount ? '••••••••' : remaining.toLocaleString()}
          <span className="text-xl font-bold ml-0.5">đ</span>
        </div>

        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-2">
          <div
            className="bg-[#18181B] h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-neutral-400 font-medium pb-4 border-b border-neutral-100">
          <span>Đã dùng {percentage}%</span>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-1 text-neutral-500 hover:text-black font-semibold transition cursor-pointer"
          >
            <span>Hạn mức: <strong className="text-neutral-800">{monthlyLimit.toLocaleString()}đ</strong></span>
            <Pencil size={11} className="text-amber-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 pt-3 pb-4">
          <div>
            <span className="text-[11px] text-neutral-400 block font-medium">Hôm nay</span>
            <span className="text-sm font-black text-[#18181B]">
              {hideAmount ? '•••• đ' : `${todaySpent.toLocaleString()}đ`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-neutral-400 block font-medium">Tháng này</span>
            <span className="text-sm font-black text-[#18181B]">
              {hideAmount ? '•••• đ' : `${monthSpent.toLocaleString()}đ`}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setIsQrOpen(true)}
            className="w-full py-3.5 bg-[#18181B] hover:bg-black active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <QrCode size={18} /> Quét QR thanh toán
          </button>
          <button
            type="button"
            onClick={() => setIsKeypadOpen(true)}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98] text-neutral-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={15} /> + Ghi thủ công
          </button>
        </div>
      </div>

      {isEditingLimit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade">
          <div className="w-full max-w-sm bg-[#F7F7F5] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-ios-sheet">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-[#18181B]">Cài đặt hạn mức tháng</h3>
              <button
                type="button"
                onClick={() => setIsEditingLimit(false)}
                className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3">
              Đặt ngân sách tối đa mỗi tháng để theo dõi tiến độ chi tiêu.
            </p>

            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 mb-3 shadow-sm">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Số tiền hạn mức (VNĐ)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(e.target.value)}
                  className="w-full text-2xl font-black text-[#18181B] bg-transparent focus:outline-none"
                  autoFocus
                />
                <span className="text-lg font-bold text-neutral-600 ml-1">đ</span>
              </div>
            </div>

            <div className="mb-5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Gợi ý nhanh
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_BUDGETS.map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    onClick={() => setTempLimit(amount.toString())}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      parseInt(tempLimit, 10) === amount
                        ? 'bg-[#18181B] text-white'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {(amount / 1000000).toFixed(0)} triệu
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveLimit}
              className="w-full py-3.5 bg-[#18181B] hover:bg-black active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Check size={16} /> Lưu hạn mức mới
            </button>
          </div>
        </div>
      )}
    </>
  );
};
