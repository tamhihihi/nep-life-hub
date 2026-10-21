import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  HandCoins, 
  PiggyBank, 
  CalendarClock, 
  Plus, 
  Check, 
  ArrowRightLeft, 
  HeartHandshake, 
  Trophy,
  Copy,
  Radio
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

interface SmartFinanceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartFinanceHubModal: React.FC<SmartFinanceHubModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transfer' | 'shared' | 'debts' | 'challenges'>('wallets');

  // 1. ĐA VÍ
  const [wallets, setWallets] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('nep_multi_wallets');
      return s ? JSON.parse(s) : [
        { id: 'w1', name: 'Tiền mặt', balance: 500000, type: 'cash' },
        { id: 'w2', name: 'Tài khoản Ngân hàng', balance: 4200000, type: 'bank' },
        { id: 'w3', name: 'Ví MoMo', balance: 350000, type: 'ewallet' },
      ];
    } catch {
      return [];
    }
  });

  // 2. CHUYỂN TIỀN NỘI BỘ
  const [fromWalletId, setFromWalletId] = useState('w2');
  const [toWalletId, setToWalletId] = useState('w1');
  const [transferAmount, setTransferAmount] = useState('');

  // 3. VÍ CHUNG CẶP ĐÔI REALTIME
  const [coupleCode, setCoupleCode] = useState(() => localStorage.getItem('nep_couple_wallet_code') || '');
  const [coupleInput, setCoupleInput] = useState('');
  const [sharedBalance, setSharedBalance] = useState(2400000);

  // 4. SỔ NỢ
  const [debts, setDebts] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('nep_debt_tracker');
      return s ? JSON.parse(s) : [
        { id: 'd1', name: 'Tuấn Cạ Cứng', amount: 85000, type: 'they_owe_me', note: 'Tiền cà phê hôm qua' },
      ];
    } catch {
      return [];
    }
  });

  // 5. THỬ THÁCH TÀI CHÍNH GAMIFICATION
  const [challenges, setChallenges] = useState<any[]>([
    { id: 'c1', title: '7 Ngày Không Trà Sữa', targetDays: 7, currentDays: 4, icon: '🧋', reward: 'Huy hiệu Cai Ngọt' },
    { id: 'c2', title: 'Nấu Ăn Tại Nhà 5 Bữa', targetDays: 5, currentDays: 3, icon: '🍳', reward: 'Vua Đầu Bếp' },
    { id: 'c3', title: 'Không Chi Sau 22h Đêm', targetDays: 7, currentDays: 6, icon: '🌙', reward: 'Người Nề Nếp' },
  ]);

  if (!isOpen) return null;

  // XỬ LÝ CHUYỂN TIỀN NỘI BỘ
  const handleExecuteTransfer = () => {
    const numeric = parseInt(transferAmount.replace(/\D/g, ''), 10) || 0;
    if (numeric <= 0 || fromWalletId === toWalletId) return;

    try { sounds?.playChime?.(); } catch {}
    const nextWallets = wallets.map((w) => {
      if (w.id === fromWalletId) return { ...w, balance: Math.max(0, w.balance - numeric) };
      if (w.id === toWalletId) return { ...w, balance: w.balance + numeric };
      return w;
    });

    setWallets(nextWallets);
    localStorage.setItem('nep_multi_wallets', JSON.stringify(nextWallets));
    setTransferAmount('');
    setActiveTab('wallets');
  };

  // GHÉP ĐÔI VÍ CHUNG
  const handleConnectCouple = () => {
    const code = coupleInput.trim().toUpperCase();
    if (!code) return;
    setCoupleCode(code);
    localStorage.setItem('nep_couple_wallet_code', code);
    try { sounds?.playChime?.(); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
      <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200/90 max-h-[88dvh] overflow-y-auto no-scrollbar animate-sheet-spring space-y-4">
        
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 block">Ví Thông Minh</span>
            <h3 className="text-base font-black text-[#18181B]">Hệ Sinh Thái Tài Chính</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 5 TAB ĐIỀU HƯỚNG */}
        <div className="grid grid-cols-5 gap-1 bg-neutral-100 p-1 rounded-2xl text-[9px] font-black">
          {[
            { id: 'wallets', label: 'Đa Ví', icon: Wallet },
            { id: 'transfer', label: 'Chuyển', icon: ArrowRightLeft },
            { id: 'shared', label: 'Ví Đôi', icon: HeartHandshake },
            { id: 'debts', label: 'Sổ Nợ', icon: HandCoins },
            { id: 'challenges', label: 'Thử Thách', icon: Trophy },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  try { sounds?.playKeypadTap?.(); } catch {}
                  setActiveTab(t.id as any);
                }}
                className={`py-2 flex flex-col items-center gap-1 rounded-xl transition cursor-pointer ${
                  isSelected ? 'bg-white text-[#18181B] shadow-xs' : 'text-neutral-500'
                }`}
              >
                <Icon size={13} className={isSelected ? 'text-amber-500' : 'text-neutral-400'} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ĐA VÍ */}
        {activeTab === 'wallets' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-neutral-700">Tài sản theo từng nguồn</span>
              <span className="text-[10px] font-mono font-bold text-neutral-400">
                Tổng: {wallets.reduce((s, w) => s + w.balance, 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="space-y-2">
              {wallets.map((w) => (
                <div key={w.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center font-bold">
                      {w.type === 'cash' ? '💵' : w.type === 'bank' ? '🏦' : '📱'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#18181B]">{w.name}</h4>
                      <span className="text-[10px] text-neutral-400 font-semibold uppercase">{w.type}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono text-[#18181B]">
                    {w.balance.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CHUYỂN TIỀN NỘI BỘ (INTERNAL TRANSFER) */}
        {activeTab === 'transfer' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Từ ví nguồn</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-black"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.balance.toLocaleString('vi-VN')}đ)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Đến ví đích</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-black"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">Số tiền chuyển</label>
                <input
                  type="number"
                  placeholder="0đ"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-white border rounded-xl px-3 py-2 text-sm font-black font-mono focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="w-full py-3 bg-[#18181B] text-white text-xs font-black rounded-xl active:scale-95 transition cursor-pointer"
              >
                Xác nhận chuyển ví
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 text-center font-medium">
              Chuyển tiền qua lại giữa các ví không làm thay đổi tổng ngân sách chi tiêu của bạn.
            </p>
          </div>
        )}

        {/* TAB 3: VÍ CHUNG CẶP ĐÔI (COUPLE WALLET) */}
        {activeTab === 'shared' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-5 space-y-2 shadow-md">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1">
                  <HeartHandshake size={14} /> Quỹ chung hai đứa
                </span>
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {coupleCode ? `Mã: ${coupleCode}` : 'Chưa kết đôi'}
                </span>
              </div>
              <h2 className="text-3xl font-black font-mono text-white pt-1">
                {sharedBalance.toLocaleString('vi-VN')}đ
              </h2>
              <p className="text-[10px] text-rose-100">Cả 2 người đều có thể ghi chi tiêu trực tiếp vào quỹ này.</p>
            </div>

            {!coupleCode ? (
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2">
                <span className="text-xs font-black text-[#18181B] block">Nhập mã ghép đôi với người thương:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: LOVE88"
                    value={coupleInput}
                    onChange={(e) => setCoupleInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-white border rounded-xl px-3 py-2 text-xs font-black uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleConnectCouple}
                    className="px-4 bg-rose-500 text-white text-xs font-black rounded-xl"
                  >
                    Ghép Đôi
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSharedBalance((prev) => prev + 200000)}
                  className="py-2.5 bg-neutral-100 rounded-xl text-xs font-black text-neutral-800"
                >
                  + Góp 200k
                </button>
                <button
                  type="button"
                  onClick={() => setSharedBalance((prev) => Math.max(0, prev - 100000))}
                  className="py-2.5 bg-neutral-100 rounded-xl text-xs font-black text-rose-600"
                >
                  - Chi ăn tối 100k
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SỔ NỢ */}
        {activeTab === 'debts' && (
          <div className="space-y-2 animate-tab-switch">
            {debts.map((d) => (
              <div key={d.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#18181B]">{d.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-semibold">{d.note}</p>
                </div>
                <span className="text-xs font-black font-mono text-[#18181B]">
                  {d.amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: THỬ THÁCH TÀI CHÍNH GAMIFICATION */}
        {activeTab === 'challenges' && (
          <div className="space-y-2.5 animate-tab-switch">
            {challenges.map((c) => {
              const percent = Math.min(100, Math.round((c.currentDays / c.targetDays) * 100));
              return (
                <div key={c.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.icon}</span>
                      <div>
                        <h4 className="text-xs font-black text-[#18181B]">{c.title}</h4>
                        <span className="text-[10px] text-amber-700 font-bold">Thưởng: {c.reward}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-neutral-700">
                      {c.currentDays}/{c.targetDays} ngày
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
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