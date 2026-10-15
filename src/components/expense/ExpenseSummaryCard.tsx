import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Plus, 
  Eye, 
  EyeOff, 
  Users, 
  Zap, 
  RotateCcw, 
  X, 
  Check, 
  Sparkles,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

interface QuickTapItem {
  id: string;
  emoji: string;
  label: string;
  amount: number;
  category: string;
}

interface BankProfile {
  bankBin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
}

const DEFAULT_QUICK_TAPS: QuickTapItem[] = [
  { id: 'qt1', emoji: '🛵', label: 'Gửi xe', amount: 5000, category: 'Grab/Xăng' },
  { id: 'qt2', emoji: '☕', label: 'Cà phê', amount: 30000, category: 'Cà phê' },
  { id: 'qt3', emoji: '🍜', label: 'Ăn sáng', amount: 35000, category: 'Ăn uống' },
  { id: 'qt4', emoji: '🧋', label: 'Trà sữa', amount: 45000, category: 'Ăn uống' },
];

const VIETQR_BANKS = [
  { bin: '970422', name: 'MB Bank' },
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970432', name: 'VPBank' },
];

export const ExpenseSummaryCard: React.FC = () => {
  const { 
    transactions, 
    monthlyLimit, 
    setMonthlyLimit,
    setIsQrOpen, 
    setIsKeypadOpen, 
    addTransaction 
  } = useAppStore();

  const [hideBalance, setHideBalance] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(monthlyLimit.toString());

  // State cho 1-Tap Micro Expense
  const [quickTaps, setQuickTaps] = useState<QuickTapItem[]>(() => {
    try {
      const saved = localStorage.getItem('nep_quick_taps_v1');
      return saved ? JSON.parse(saved) : DEFAULT_QUICK_TAPS;
    } catch {
      return DEFAULT_QUICK_TAPS;
    }
  });
  const [isAddingQuickTap, setIsAddingQuickTap] = useState(false);
  const [newTapLabel, setNewTapLabel] = useState('');
  const [newTapAmount, setNewTapAmount] = useState('25000');
  const [newTapEmoji, setNewTapEmoji] = useState('🥤');

  // State cho Hoàn tác 3 giây
  const [pendingTap, setPendingTap] = useState<QuickTapItem | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // State cho Chia Bill & Tạo VietQR
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [totalBillStr, setTotalBillStr] = useState('400000');
  const [peopleCount, setPeopleCount] = useState(4);
  const [splitNote, setSplitNote] = useState('Campuchia an trua');
  const [bankProfile, setBankProfile] = useState<BankProfile>(() => {
    try {
      const saved = localStorage.getItem('nep_my_bank_v1');
      return saved
        ? JSON.parse(saved)
        : { bankBin: '970422', bankName: 'MB Bank', accountNo: '', accountName: '' };
    } catch {
      return { bankBin: '970422', bankName: 'MB Bank', accountNo: '', accountName: '' };
    }
  });

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Tính toán tổng chi trong tháng hiện tại
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const committedSpent = transactions
    .filter((t) => t.type === 'expense' && t.dateStr.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = committedSpent + (pendingTap ? pendingTap.amount : 0);
  const remaining = Math.max(0, monthlyLimit - totalSpent);
  const spentPercent = Math.min(100, Math.round((totalSpent / (monthlyLimit || 1)) * 100));

  // Tính số ngày còn lại trong tháng & Hạn mức tiêu mỗi ngày
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.floor(remaining / daysLeft);

  // Quy đổi đơn vị vui: Phở (50k) & Trà sữa (40k)
  const phoCount = Math.floor(remaining / 50000);
  const bobaCount = Math.floor(remaining / 40000);

  const handleSaveLimit = () => {
    const val = parseInt(limitInput, 10);
    if (!isNaN(val) && val >= 100000) {
      setMonthlyLimit(val);
    }
    setIsEditingLimit(false);
  };

  // Xử lý Chạm Là Ghi (Chờ 3 giây để Hoàn tác)
  const handleQuickTap = (item: QuickTapItem) => {
    sounds.playKeypadTap();

    if (pendingTap && undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      addTransaction({
        amount: pendingTap.amount,
        type: 'expense',
        category: pendingTap.category,
        bankName: 'Tiền mặt',
        note: `${pendingTap.emoji} ${pendingTap.label} (Chạm nhanh)`,
        dateStr: new Date().toISOString().split('T')[0],
      });
    }

    setPendingTap(item);
    undoTimerRef.current = window.setTimeout(() => {
      addTransaction({
        amount: item.amount,
        type: 'expense',
        category: item.category,
        bankName: 'Tiền mặt',
        note: `${item.emoji} ${item.label} (Chạm nhanh)`,
        dateStr: new Date().toISOString().split('T')[0],
      });
      sounds.playChime();
      setPendingTap(null);
    }, 3200);
  };

  const handleUndoQuickTap = () => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    setPendingTap(null);
    sounds.playCardSlide();
  };

  const handleAddQuickTap = () => {
    const amt = parseInt(newTapAmount, 10);
    if (!newTapLabel.trim() || isNaN(amt) || amt <= 0) return;
    const updated: QuickTapItem[] = [
      ...quickTaps,
      {
        id: `qt_${Date.now()}`,
        emoji: newTapEmoji || '⚡',
        label: newTapLabel.trim(),
        amount: amt,
        category: 'Ăn uống',
      },
    ];
    setQuickTaps(updated);
    localStorage.setItem('nep_quick_taps_v1', JSON.stringify(updated));
    setNewTapLabel('');
    setIsAddingQuickTap(false);
  };

  const handleDeleteQuickTap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = quickTaps.filter((q) => q.id !== id);
    setQuickTaps(updated);
    localStorage.setItem('nep_quick_taps_v1', JSON.stringify(updated));
  };

  const updateBankProfile = (patch: Partial<BankProfile>) => {
    const updated = { ...bankProfile, ...patch };
    setBankProfile(updated);
    localStorage.setItem('nep_my_bank_v1', JSON.stringify(updated));
  };

  const totalBill = parseInt(totalBillStr, 10) || 0;
  const amountPerPerson = peopleCount > 0 ? Math.ceil(totalBill / peopleCount) : 0;

  const vietQrImageUrl = bankProfile.accountNo.trim()
    ? `https://img.vietqr.io/image/${bankProfile.bankBin}-${bankProfile.accountNo.trim()}-compact2.png?amount=${amountPerPerson}&addInfo=${encodeURIComponent(
        splitNote
      )}&accountName=${encodeURIComponent(bankProfile.accountName)}`
    : '';

  const handleRecordMyShare = () => {
    if (amountPerPerson <= 0) return;
    addTransaction({
      amount: amountPerPerson,
      type: 'expense',
      category: 'Ăn uống',
      bankName: bankProfile.bankName,
      note: `Chia bill (${peopleCount} người): ${splitNote}`,
      dateStr: new Date().toISOString().split('T')[0],
    });
    sounds.playChime();
    setIsSplitOpen(false);
  };

  return (
    <div className="space-y-2.5">
      {/* THẺ CHÍNH: NGÂN SÁCH & CHỈ SỐ PHỞ/TRÀ SỮA */}
      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-neutral-200/70 relative overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Ngân sách còn lại tháng này
            </span>
            <button
              type="button"
              onClick={() => {
                setLimitInput(monthlyLimit.toString());
                setIsEditingLimit(!isEditingLimit);
              }}
              className="text-neutral-400 hover:text-black transition cursor-pointer"
              title="Đổi hạn mức tháng"
            >
              <Edit3 size={12} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setHideBalance(!hideBalance)}
            className="text-neutral-400 hover:text-black transition cursor-pointer p-1"
          >
            {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {isEditingLimit && (
          <div className="flex items-center gap-2 my-2 bg-neutral-100 p-2 rounded-2xl">
            <input
              type="number"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-xl text-xs font-black w-full focus:outline-none border border-neutral-200"
              placeholder="Nhập hạn mức tháng..."
            />
            <button
              type="button"
              onClick={handleSaveLimit}
              className="px-3 py-1.5 bg-[#18181B] text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
            >
              Lưu
            </button>
          </div>
        )}

        <div className="text-3xl font-black tracking-tight text-[#18181B] mb-2">
          {hideBalance ? '••••••••' : `${remaining.toLocaleString('vi-VN')}đ`}
        </div>

        {/* Hạn mức tiêu mỗi ngày & Quy đổi Phở / Trà sữa */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 border border-amber-300/80">
            <Sparkles size={12} /> Hôm nay được tiêu:{' '}
            {hideBalance ? '•••' : `${dailyAllowance.toLocaleString('vi-VN')}đ`}
          </span>
          <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
            ≈ {phoCount} bát phở 🍜 · {bobaCount} ly trà sữa 🧋
          </span>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spentPercent > 85
                ? 'bg-rose-500'
                : spentPercent > 65
                ? 'bg-amber-500'
                : 'bg-[#18181B]'
            }`}
            style={{ width: `${spentPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-neutral-400 font-semibold mb-4">
          <span>Đã chi: {hideBalance ? '•••' : `${totalSpent.toLocaleString('vi-VN')}đ`}</span>
          <span>Hạn mức: {monthlyLimit.toLocaleString('vi-VN')}đ ({spentPercent}%)</span>
        </div>

        {/* 3 Nút Hành Động Chính */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setIsQrOpen(true)}
            className="py-3 px-2 bg-[#18181B] hover:bg-black active:scale-95 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <QrCode className="text-amber-400 shrink-0" size={15} />
            <span>Quét QR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSplitOpen(true)}
            className="py-3 px-2 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-900 border border-amber-300/80 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Users className="text-amber-600 shrink-0" size={15} />
            <span>Chia Bill</span>
          </button>

          <button
            type="button"
            onClick={() => setIsKeypadOpen(true)}
            className="py-3 px-2 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-[#18181B] rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="shrink-0" size={15} />
            <span>Ghi sổ</span>
          </button>
        </div>
      </div>

      {/* DẢI NÚT "CHẠM LÀ GHI" (1-TAP MICRO EXPENSE) */}
      <div className="bg-white rounded-[24px] p-3.5 shadow-sm border border-neutral-200/60">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Zap className="text-amber-500" size={12} /> Chạm là ghi (1-Tap)
          </span>
          <button
            type="button"
            onClick={() => setIsAddingQuickTap(!isAddingQuickTap)}
            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            {isAddingQuickTap ? 'Đóng' : '+ Thêm nút'}
          </button>
        </div>

        {/* Thanh thông báo Hoàn tác 3 giây */}
        {pendingTap && (
          <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#18181B] text-white flex items-center justify-between text-xs animate-ios-fade shadow-md">
            <span>
              Đã chạm: <b>{pendingTap.emoji} {pendingTap.label}</b> (-{(pendingTap.amount / 1000).toFixed(0)}k)
            </span>
            <button
              type="button"
              onClick={handleUndoQuickTap}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-black text-[11px] flex items-center gap-1 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw size={12} /> Hoàn tác
            </button>
          </div>
        )}

        {/* Form thêm nút 1-Tap mới */}
        {isAddingQuickTap && (
          <div className="mb-2.5 p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex gap-1.5 items-center">
            <input
              type="text"
              value={newTapEmoji}
              onChange={(e) => setNewTapEmoji(e.target.value)}
              className="w-9 text-center bg-white border border-neutral-200 rounded-xl py-1.5 text-xs"
              placeholder="☕"
            />
            <input
              type="text"
              value={newTapLabel}
              onChange={(e) => setNewTapLabel(e.target.value)}
              className="flex-1 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
              placeholder="Tên (VD: Trà đá)"
            />
            <input
              type="number"
              value={newTapAmount}
              onChange={(e) => setNewTapAmount(e.target.value)}
              className="w-20 bg-white border border-neutral-200 rounded-xl px-2 py-1.5 text-xs font-bold"
              placeholder="10000"
            />
            <button
              type="button"
              onClick={handleAddQuickTap}
              className="p-2 bg-[#18181B] text-white rounded-xl cursor-pointer"
            >
              <Check size={14} />
            </button>
          </div>
        )}

        {/* Danh sách các chip chạm nhanh */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {quickTaps.map((item) => (
            <div
              key={item.id}
              onClick={() => handleQuickTap(item)}
              className="group shrink-0 px-3 py-2 rounded-2xl bg-[#F7F7F5] hover:bg-neutral-200/70 active:scale-95 border border-neutral-200/80 flex items-center gap-1.5 cursor-pointer transition select-none"
            >
              <span className="text-sm">{item.emoji}</span>
              <div className="text-left">
                <span className="text-[11px] font-bold text-[#18181B] block leading-none">
                  {item.label}
                </span>
                <span className="text-[10px] font-extrabold text-amber-600 font-mono">
                  {(item.amount / 1000).toFixed(0)}k
                </span>
              </div>
              {quickTaps.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteQuickTap(item.id, e)}
                  className="ml-1 text-neutral-300 hover:text-rose-500 transition"
                  title="Xóa nút này"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL TRẠM CAMPUCHIA (CHIA BILL & TẠO MÃ VIETQR) */}
      {isSplitOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade">
          <div className="w-full max-w-md bg-[#F7F7F5] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-ios-sheet max-h-[92vh] overflow-y-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setIsSplitOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                Trạm Campuchia · VietQR
              </span>
              <h3 className="text-lg font-black text-[#18181B]">
                Chia Bill & Tạo QR Thu Tiền
              </h3>
            </div>

            {/* 1. Nhập Tổng Bill & Số Người */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm space-y-3 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  Tổng hóa đơn cả bàn (VNĐ)
                </span>
                <input
                  type="number"
                  value={totalBillStr}
                  onChange={(e) => setTotalBillStr(e.target.value)}
                  className="w-full text-2xl font-black text-[#18181B] bg-neutral-50 rounded-2xl px-3.5 py-2 border border-neutral-200 focus:outline-none"
                />
                <div className="flex gap-1.5 mt-2">
                  {[200000, 350000, 500000, 800000].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setTotalBillStr(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[11px] font-bold text-neutral-600 cursor-pointer"
                    >
                      {(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <span className="text-xs font-bold text-neutral-600">Số người chia đều:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))}
                    className="w-8 h-8 rounded-xl bg-neutral-200 font-black text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-[#18181B] w-6 text-center">
                    {peopleCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPeopleCount(peopleCount + 1)}
                    className="w-8 h-8 rounded-xl bg-[#18181B] text-white font-black text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300/70 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-900">Mỗi người cần trả:</span>
                <span className="text-lg font-black text-amber-700 font-mono">
                  {amountPerPerson.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {/* 2. Cấu hình Tài khoản nhận tiền */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm space-y-2.5 mb-3">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                Tài khoản nhận tiền của bạn (Lưu tự động)
              </span>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {VIETQR_BANKS.map((b) => (
                  <button
                    type="button"
                    key={b.bin}
                    onClick={() => updateBankProfile({ bankBin: b.bin, bankName: b.name })}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition cursor-pointer ${
                      bankProfile.bankBin === b.bin
                        ? 'bg-[#18181B] text-white border-black'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Số tài khoản..."
                  value={bankProfile.accountNo}
                  onChange={(e) => updateBankProfile({ accountNo: e.target.value })}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-[#18181B] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Tên chủ TK (Không dấu)"
                  value={bankProfile.accountName}
                  onChange={(e) => updateBankProfile({ accountName: e.target.value.toUpperCase() })}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-[#18181B] focus:outline-none"
                />
              </div>

              <input
                type="text"
                placeholder="Nội dung chuyển khoản..."
                value={splitNote}
                onChange={(e) => setSplitNote(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none"
              />
            </div>

            {/* 3. Hiển thị Mã VietQR Động */}
            {vietQrImageUrl ? (
              <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm text-center mb-3">
                <p className="text-[11px] font-bold text-neutral-500 mb-2">
                  Đưa màn hình này cho bạn bè quét ({amountPerPerson.toLocaleString()}đ/người)
                </p>
                <img
                  src={vietQrImageUrl}
                  alt="VietQR Chia Bill"
                  className="w-52 h-52 object-contain mx-auto rounded-2xl border border-neutral-100"
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-dashed border-neutral-300 text-center text-xs text-neutral-400 mb-3">
                Nhập <b>Số tài khoản</b> ở trên để hiện mã VietQR tự động gắn sẵn số tiền{' '}
                <b>{amountPerPerson.toLocaleString()}đ</b>
              </div>
            )}

            <button
              type="button"
              onClick={handleRecordMyShare}
              className="w-full py-4 bg-[#18181B] hover:bg-black text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <Check size={16} /> Ghi phần của mình ({amountPerPerson.toLocaleString()}đ) vào Sổ Chi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};