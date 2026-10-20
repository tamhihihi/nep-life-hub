import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Copy, 
  Check, 
  Plus, 
  Minus, 
  Sparkles,
  QrCode,
  CreditCard
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose }) => {
  const [totalBill, setTotalBill] = useState('');
  const [peopleCount, setPeopleCount] = useState(3);
  const [billNote, setBillNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const [bankId, setBankId] = useState(() => localStorage.getItem('nep_my_bank_id') || 'MB');
  const [accountNo, setAccountNo] = useState(() => localStorage.getItem('nep_my_account_no') || '0988888888');
  const [accountName, setAccountName] = useState(() => localStorage.getItem('nep_my_account_name') || 'NGUYEN VAN A');
  const [isEditingBank, setIsEditingBank] = useState(false);

  if (!isOpen) return null;

  const numericTotal = parseInt(totalBill.replace(/\D/g, ''), 10) || 0;
  const validPeople = Math.max(1, peopleCount);
  const perPersonRaw = Math.round(numericTotal / validPeople);
  const perPerson = Math.ceil(perPersonRaw / 1000) * 1000;

  const handleBillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setTotalBill('');
      return;
    }
    const num = parseInt(raw, 10);
    setTotalBill(num.toLocaleString('vi-VN'));
  };

  const handleCopyReminderMessage = () => {
    if (numericTotal <= 0) return;
    try { sounds?.playKeypadTap?.(); } catch {}

    const noteText = billNote.trim() ? `tiền "${billNote.trim()}"` : 'hóa đơn';
    const message = `✨ Tổng ${noteText} hết ${numericTotal.toLocaleString('vi-VN')}đ chia đều cho ${validPeople} người.\n👉 Mỗi người chuyển cho mình: ${perPerson.toLocaleString('vi-VN')}đ\nSTK: ${accountNo} (${bankId}) - ${accountName}\nCảm ơn cả nhà! ✨`;

    navigator.clipboard?.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRecordMyShare = () => {
    if (perPerson <= 0) return;
    try { sounds?.playChime?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate([15, 30]);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newTx = {
      id: `tx_${Date.now()}`,
      amount: perPerson,
      type: 'expense' as const,
      category: 'Cơm trưa',
      bankName: 'Tiền mặt',
      note: `Chia bill (${billNote.trim() || 'Ăn uống'}): ${validPeople} người`,
      dateStr: todayStr,
      timestamp: Date.now(),
    };

    useAppStore.setState((prev: any) => ({
      transactions: [newTx, ...(prev?.transactions || [])],
    }));

    onClose();
  };

  const handleSaveBankInfo = () => {
    localStorage.setItem('nep_my_bank_id', bankId);
    localStorage.setItem('nep_my_account_no', accountNo);
    localStorage.setItem('nep_my_account_name', accountName);
    setIsEditingBank(false);
  };

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${perPerson}&addInfo=${encodeURIComponent(
    `Chia tien ${billNote.trim() || 'bill'}`
  )}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
      <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200/90 max-h-[90dvh] overflow-y-auto no-scrollbar animate-sheet-spring space-y-4">
        
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <Users size={16} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 block">
                Tiện ích nhóm
              </span>
              <h3 className="text-base font-black text-[#18181B]">Chia Tiền Hóa Đơn</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* BƯỚC 1: TỔNG TIỀN */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70 space-y-1 text-center">
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
            Tổng tiền cả nhóm cần thanh toán
          </label>
          <div className="relative inline-block w-full">
            <input
              type="text"
              placeholder="0"
              value={totalBill}
              onChange={handleBillInputChange}
              className="w-full bg-transparent text-3xl font-black font-mono text-center text-[#18181B] focus:outline-none placeholder-neutral-300"
              autoFocus
            />
            <span className="text-xs font-black text-neutral-400">VNĐ</span>
          </div>
        </div>

        {/* BƯỚC 2: SỐ NGƯỜI */}
        <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-[#18181B] block">Số người chia</span>
            <span className="text-[10px] text-neutral-400 font-semibold">Bao gồm cả bạn</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                try { sounds?.playKeypadTap?.(); } catch {}
                setPeopleCount((prev) => Math.max(2, prev - 1));
              }}
              className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 active:scale-90 transition cursor-pointer"
            >
              <Minus size={14} />
            </button>

            <span className="text-base font-black font-mono text-[#18181B] w-6 text-center">
              {peopleCount}
            </span>

            <button
              type="button"
              onClick={() => {
                try { sounds?.playKeypadTap?.(); } catch {}
                setPeopleCount((prev) => prev + 1);
              }}
              className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 active:scale-90 transition cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="Tên quán / Bữa ăn (VD: Lẩu Haidilao, Cà phê...)"
            value={billNote}
            onChange={(e) => setBillNote(e.target.value)}
            className="w-full bg-neutral-100 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#18181B] focus:outline-none focus:bg-white border border-transparent focus:border-amber-400 transition"
          />
        </div>

        {/* THẺ KẾT QUẢ ĐÃ SỬA LỖI VIỀN */}
        <div className="bg-gradient-to-br from-[#18181B] to-[#27272A] text-white rounded-3xl p-5 space-y-2 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center text-neutral-300 text-xs font-bold pb-1">
            <span>Mỗi người cần chuyển:</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300">
              {validPeople} phần đều nhau
            </span>
          </div>

          <div className="text-center py-1">
            <h2 className="text-3xl font-black font-mono text-amber-400 tracking-tight">
              {perPerson.toLocaleString('vi-VN')}đ
            </h2>
            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">
              (Đã làm tròn số nghìn tiện chuyển khoản)
            </span>
          </div>
        </div>

        {/* MÃ VIETQR NHẬN TIỀN */}
        {perPerson > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <QrCode size={16} />
              <span>{showQrCode ? 'Ẩn mã QR nhận tiền' : 'Hiện mã VietQR nhận tiền ngay'}</span>
            </button>

            {showQrCode && (
              <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-200 text-center space-y-3 animate-tab-switch">
                <div className="w-52 h-52 mx-auto bg-white p-2 rounded-2xl shadow-md border border-neutral-200 flex items-center justify-center">
                  <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" />
                </div>
                <p className="text-[11px] font-bold text-neutral-600">
                  Bạn bè chỉ cần mở camera hoặc app ngân hàng quét mã này là tiền tự điền đúng {perPerson.toLocaleString('vi-VN')}đ.
                </p>

                <div className="text-left pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(!isEditingBank)}
                    className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1"
                  >
                    <CreditCard size={11} /> Cài đặt tài khoản nhận tiền
                  </button>

                  {isEditingBank && (
                    <div className="space-y-2 pt-2 animate-tab-switch">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Mã Bank (MB, VCB, TCB...)"
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value.toUpperCase())}
                          className="bg-white border rounded-xl px-2 py-1.5 text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Số tài khoản"
                          value={accountNo}
                          onChange={(e) => setAccountNo(e.target.value)}
                          className="bg-white border rounded-xl px-2 py-1.5 text-xs font-bold font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Tên chủ thẻ (không dấu)"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                        className="w-full bg-white border rounded-xl px-2 py-1.5 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleSaveBankInfo}
                        className="w-full py-1.5 bg-[#18181B] text-white rounded-xl text-xs font-bold"
                      >
                        Lưu thông tin nhận tiền
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleCopyReminderMessage}
            className="w-full py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-[#18181B] text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Đã sao chép tin nhắn nhắc nợ!' : 'Sao chép tin nhắn gửi nhóm bạn'}</span>
          </button>

          <button
            type="button"
            onClick={handleRecordMyShare}
            className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Chỉ ghi phần của tôi ({perPerson.toLocaleString('vi-VN')}đ) vào sổ</span>
          </button>
        </div>

      </div>
    </div>
  );
};