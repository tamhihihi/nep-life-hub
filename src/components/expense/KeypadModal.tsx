import React, { useState } from 'react';
import { 
  X, 
  Delete, 
  Check, 
  Utensils, 
  Coffee, 
  ShoppingBag, 
  Bus, 
  Briefcase, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const KeypadModal: React.FC = () => {
  const store = useAppStore();
  const isKeypadOpen = (store as any)?.isKeypadOpen;
  const setIsKeypadOpen = (store as any)?.setIsKeypadOpen;

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [category, setCategory] = useState('Cơm trưa');
  const [note, setNote] = useState('');

  if (!isKeypadOpen) return null;

  const handleClose = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    setAmountStr('0');
    setNote('');
    if (typeof setIsKeypadOpen === 'function') {
      setIsKeypadOpen(false);
    }
  };

  const handleNumClick = (val: string) => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);

    if (val === '000') {
      if (amountStr === '0') return;
      if (amountStr.length <= 8) setAmountStr((prev) => prev + '000');
      return;
    }

    if (amountStr === '0') {
      setAmountStr(val);
    } else if (amountStr.length < 10) {
      setAmountStr((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = () => {
    const numeric = parseInt(amountStr, 10) || 0;
    if (numeric <= 0) return;

    try { sounds?.playChime?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate([15, 30]);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newTx = {
      id: `tx_${Date.now()}`,
      amount: numeric,
      type,
      category,
      bankName: 'Tiền mặt',
      note: note.trim() || category,
      dateStr: todayStr,
      timestamp: Date.now(),
    };

    useAppStore.setState((prev: any) => ({
      transactions: [newTx, ...(prev?.transactions || [])],
    }));

    handleClose();
  };

  const expenseCategories = [
    { label: 'Cơm trưa', icon: Utensils },
    { label: 'Cà phê', icon: Coffee },
    { label: 'Mua sắm', icon: ShoppingBag },
    { label: 'Đổ xăng', icon: Bus },
    { label: 'Ăn vặt', icon: Wallet },
    { label: 'Khoản khác', icon: Sparkles },
  ];

  const incomeCategories = [
    { label: 'Lương về', icon: Briefcase },
    { label: 'Thưởng', icon: Sparkles },
    { label: 'Bạn trả', icon: Wallet },
    { label: 'Thu khác', icon: Check },
  ];

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
  const numericDisplay = (parseInt(amountStr, 10) || 0).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
      <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-[36px] p-5 shadow-2xl relative border border-neutral-200/90 max-h-[92dvh] overflow-y-auto no-scrollbar animate-sheet-spring space-y-3.5">
        
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        {/* HEADER & CHUYỂN ĐỔI CHI / THU */}
        <div className="flex justify-between items-center">
          <div className="inline-flex bg-neutral-100 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Cơm trưa');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                type === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-neutral-500'
              }`}
            >
              - Chi Tiền
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Lương về');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-500'
              }`}
            >
              + Nạp Tiền
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* MÀN HÌNH HIỂN THỊ SỐ TIỀN */}
        <div className="text-center py-2 bg-neutral-50 rounded-2xl border border-neutral-200/70">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
            {type === 'expense' ? 'Số tiền chi ra' : 'Số tiền nhận vào'}
          </span>
          <div className="flex items-baseline justify-center gap-1 pt-1">
            <span className={`text-4xl font-black font-mono tracking-tight ${
              type === 'expense' ? 'text-[#18181B]' : 'text-emerald-600'
            }`}>
              {type === 'income' ? '+' : '-'}{numericDisplay}
            </span>
            <span className="text-sm font-black text-neutral-400">đ</span>
          </div>
        </div>

        {/* CHỌN DANH MỤC */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {currentCategories.map((c) => {
            const Icon = c.icon;
            const isSelected = category === c.label;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(c.label)}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <Icon size={13} className={isSelected ? 'text-amber-400' : 'text-neutral-400'} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ô NHẬP GHI CHÚ */}
        <input
          type="text"
          placeholder="Thêm ghi chú (VD: Bánh mì chảo, Tiền đổ xăng...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-neutral-100 rounded-xl px-3.5 py-2 text-xs font-bold text-[#18181B] focus:outline-none focus:bg-white border border-transparent focus:border-amber-400"
        />

        {/* BÀN PHÍM SỐ CẢM ỨNG 3D */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleNumClick(d)}
              className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-lg font-black font-mono text-[#18181B] flex items-center justify-center transition cursor-pointer"
            >
              {d}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handleNumClick('000')}
            className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-xs font-black font-mono text-neutral-600 flex items-center justify-center transition cursor-pointer"
          >
            000
          </button>

          <button
            type="button"
            onClick={() => handleNumClick('0')}
            className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-lg font-black font-mono text-[#18181B] flex items-center justify-center transition cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-500 flex items-center justify-center transition cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* NÚT LƯU GIAO DỊCH */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 bg-[#18181B] hover:bg-black text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
        >
          <Check size={16} className="text-amber-400" />
          <span>Ghi nhận vào sổ</span>
        </button>

      </div>
    </div>
  );
};