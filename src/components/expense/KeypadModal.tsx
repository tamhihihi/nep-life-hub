import React, { useState } from 'react';
import { ChevronLeft, Delete, Check } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

const EXPENSE_CATEGORIES = ['Ăn uống', 'Cà phê', 'Grab/Xăng', 'Mua sắm', 'Hóa đơn', 'Giải trí'];
const INCOME_CATEGORIES = ['Lương', 'Thưởng', 'Bán hàng', 'Được tặng', 'Hoàn tiền'];
const BANKS = ['BIDV', 'MB Bank', 'Vietcombank', 'VietinBank', 'Tiền mặt'];

export const KeypadModal: React.FC = () => {
  const { isKeypadOpen, setIsKeypadOpen, addTransaction } = useAppStore();
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('50000');
  const [selectedCat, setSelectedCat] = useState('Ăn uống');
  const [selectedBank, setSelectedBank] = useState('MB Bank');
  const [note, setNote] = useState('');

  if (!isKeypadOpen) return null;

  const categories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSwitchType = (type: 'expense' | 'income') => {
    setTxType(type);
    setSelectedCat(type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleKeyPress = (char: string) => {
    sounds.playKeypadTap();
    if (amountStr.length >= 10) return;
    setAmountStr(amountStr === '0' ? char : amountStr + char);
  };

  const handleDelete = () => {
    sounds.playKeypadTap();
    setAmountStr(amountStr.length <= 1 ? '0' : amountStr.slice(0, -1));
  };

  const handleSave = () => {
    const val = parseInt(amountStr, 10);
    if (val > 0) {
      addTransaction({
        amount: val,
        type: txType,
        category: selectedCat,
        bankName: selectedBank,
        note: note.trim() || selectedCat,
        dateStr: new Date().toISOString().split('T')[0],
      });
    }
    setNote('');
    setIsKeypadOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-ios-fade">
      <div className="w-full max-w-[420px] bg-[#F7F7F5] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar border border-neutral-200 animate-ios-sheet">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setIsKeypadOpen(false)}
            className="flex items-center text-amber-600 font-bold text-xs gap-0.5 cursor-pointer"
          >
            <ChevronLeft size={16} /> Đóng
          </button>

          {/* Chuyển đổi Khoản chi / Thu nhập */}
          <div className="bg-neutral-200/80 p-0.5 rounded-xl flex text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchType('expense')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                txType === 'expense' ? 'bg-[#18181B] text-white shadow-sm' : 'text-neutral-500'
              }`}
            >
              Khoản chi
            </button>
            <button
              type="button"
              onClick={() => handleSwitchType('income')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                txType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-500'
              }`}
            >
              Thu nhập
            </button>
          </div>

          <div className="w-10" />
        </div>

        <div className="text-center py-3">
          <div
            className={`text-4xl font-black tracking-tight flex items-center justify-center ${
              txType === 'income' ? 'text-emerald-600' : 'text-[#18181B]'
            }`}
          >
            {txType === 'income' ? '+' : '-'}
            {parseInt(amountStr || '0', 10).toLocaleString('vi-VN')}
            <span className="text-2xl font-bold ml-1 text-neutral-700">đ</span>
            <span className="w-0.5 h-8 bg-amber-500 animate-pulse ml-1 inline-block" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 mb-3 space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5 uppercase tracking-wider">
              Danh mục
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCat === cat
                      ? 'bg-[#18181B] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-neutral-400 block mb-1 uppercase tracking-wider">
              Ghi chú
            </span>
            <input
              type="text"
              placeholder="Thêm ghi chú..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs font-semibold text-neutral-800 bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {BANKS.map((bank) => (
            <button
              type="button"
              key={bank}
              onClick={() => setSelectedBank(bank)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border shrink-0 transition cursor-pointer ${
                selectedBank === bank
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {bank}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '000'].map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => handleKeyPress(k)}
              className="py-3 bg-white hover:bg-neutral-100 active:scale-95 text-[#18181B] font-black text-xl rounded-2xl shadow-sm border border-neutral-100 transition cursor-pointer"
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="py-3 bg-neutral-200/60 active:scale-95 text-[#18181B] font-bold text-lg rounded-2xl flex items-center justify-center transition cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`w-full py-4 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
            txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#18181B] hover:bg-black'
          }`}
        >
          <Check size={18} /> {txType === 'income' ? 'Ghi Khoản Thu' : 'Ghi Khoản Chi'}
        </button>
      </div>
    </div>
  );
};