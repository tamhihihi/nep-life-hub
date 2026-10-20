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
  Trash2,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

interface SmartFinanceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartFinanceHubModal: React.FC<SmartFinanceHubModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'wallets' | 'debts' | 'savings' | 'subscriptions'>('wallets');

  // 1. DỮ LIỆU ĐA VÍ
  const [wallets, setWallets] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('nep_multi_wallets');
      return s ? JSON.parse(s) : [
        { id: 'w1', name: 'Tiền mặt', balance: 500000, type: 'cash' },
        { id: 'w2', name: 'Tài khoản MB Bank', balance: 4200000, type: 'bank' },
        { id: 'w3', name: 'Ví MoMo', balance: 350000, type: 'ewallet' },
      ];
    } catch {
      return [];
    }
  });

  // 2. DỮ LIỆU SỔ NỢ
  const [debts, setDebts] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('nep_debt_tracker');
      return s ? JSON.parse(s) : [
        { id: 'd1', name: 'Tuấn Cạ Cứng', amount: 85000, type: 'they_owe_me', note: 'Tiền cà phê hôm qua' },
        { id: 'd2', name: 'Quán cơm bà Năm', amount: 40000, type: 'i_owe_them', note: 'Nợ tiền ăn trưa' },
      ];
    } catch {
      return [];
    }
  });

  // 3. DỮ LIỆU HŨ TIẾT KIỆM
  const [savings, setSavings] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('nep_savings_goals');
      return s ? JSON.parse(s) : [
        { id: 's1', title: 'Đi du lịch Đà Lạt', target: 3000000, current: 1200000, icon: '✈️' },
        { id: 's2', title: 'Quỹ dự phòng khẩn cấp', target: 5000000, current: 2500000, icon: '🛡️' },
      ];
    } catch {
      return [];
    }
  });

  // 4. DỮ LIỆU THUÊ BAO ĐỊNH KỲ
  const [subscriptions, setSubscriptions] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem('nep_recurring_bills');
      return s ? JSON.parse(s) : [
        { id: 'r1', name: 'Tiền phòng trọ', cost: 2500000, dueDay: 5 },
        { id: 'r2', name: 'Gói Netflix', cost: 70000, dueDay: 15 },
        { id: 'r3', name: 'Spotify Premium', cost: 59000, dueDay: 20 },
      ];
    } catch {
      return [];
    }
  });

  // Form thêm nhanh
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState('they_owe_me');

  if (!isOpen) return null;

  // XỬ LÝ SỔ NỢ: ĐÃ THU HOẶC ĐÃ TRẢ
  const handleResolveDebt = (debtId: string) => {
    try { sounds?.playChime?.(); } catch {}
    const target = debts.find((d) => d.id === debtId);
    if (!target) return;

    // Tự động đồng bộ vào lịch sử thu/chi
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    useAppStore.setState((prev: any) => ({
      transactions: [
        {
          id: `tx_${Date.now()}`,
          amount: target.amount,
          type: target.type === 'they_owe_me' ? 'income' : 'expense',
          category: 'Sổ nợ',
          bankName: 'Tiền mặt',
          note: target.type === 'they_owe_me' ? `Đã thu nợ từ: ${target.name}` : `Đã trả nợ cho: ${target.name}`,
          dateStr: todayStr,
          timestamp: Date.now(),
        },
        ...(prev?.transactions || []),
      ],
    }));

    const next = debts.filter((d) => d.id !== debtId);
    setDebts(next);
    localStorage.setItem('nep_debt_tracker', JSON.stringify(next));
  };

  // BỎ ỐNG HEO TIẾT KIỆM
  const handleDepositSaving = (id: string, amount: number) => {
    try { sounds?.playChime?.(); } catch {}
    const next = savings.map((s) => (s.id === id ? { ...s, current: Math.min(s.target, s.current + amount) } : s));
    setSavings(next);
    localStorage.setItem('nep_savings_goals', JSON.stringify(next));
  };

  // THÊM MỚI THEO TAB HIỆN TẠI
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseInt(formAmount.replace(/\D/g, ''), 10) || 0;
    if (!formName.trim() || numeric <= 0) return;

    if (activeTab === 'debts') {
      const next = [{ id: `d_${Date.now()}`, name: formName.trim(), amount: numeric, type: formType, note: 'Ghi chú nợ' }, ...debts];
      setDebts(next);
      localStorage.setItem('nep_debt_tracker', JSON.stringify(next));
    } else if (activeTab === 'savings') {
      const next = [{ id: `s_${Date.now()}`, title: formName.trim(), target: numeric, current: 0, icon: '🎯' }, ...savings];
      setSavings(next);
      localStorage.setItem('nep_savings_goals', JSON.stringify(next));
    } else if (activeTab === 'subscriptions') {
      const next = [{ id: `r_${Date.now()}`, name: formName.trim(), cost: numeric, dueDay: 10 }, ...subscriptions];
      setSubscriptions(next);
      localStorage.setItem('nep_recurring_bills', JSON.stringify(next));
    }

    setFormName('');
    setFormAmount('');
    setIsAddingItem(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
      <div className="w-full max-w-sm bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200/90 max-h-[88dvh] overflow-y-auto no-scrollbar animate-sheet-spring space-y-4">
        
        {/* THANH KÉO */}
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        {/* TIÊU ĐỀ & ĐÓNG */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 block">Bộ công cụ tài chính</span>
            <h3 className="text-base font-black text-[#18181B]">Ví Thông Minh</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4 TAB ĐIỀU HƯỚNG */}
        <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-2xl">
          {[
            { id: 'wallets', label: 'Đa Ví', icon: Wallet },
            { id: 'debts', label: 'Sổ Nợ', icon: HandCoins },
            { id: 'savings', label: 'Tiết Kiệm', icon: PiggyBank },
            { id: 'subscriptions', label: 'Định Kỳ', icon: CalendarClock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  try { sounds?.playKeypadTap?.(); } catch {}
                  setActiveTab(tab.id as any);
                  setIsAddingItem(false);
                }}
                className={`py-2 flex flex-col items-center gap-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                  isSelected ? 'bg-white text-[#18181B] shadow-xs' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-amber-500' : 'text-neutral-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* NỘI DUNG 1: ĐA VÍ */}
        {activeTab === 'wallets' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-neutral-700">Các nguồn tiền của bạn</span>
              <span className="text-[10px] text-neutral-400 font-bold">
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

        {/* NỘI DUNG 2: SỔ NỢ 2 CHIỀU */}
        {activeTab === 'debts' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-neutral-700">Sổ theo dõi nợ 2 chiều</span>
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-xs font-black text-amber-600 flex items-center gap-0.5"
              >
                <Plus size={13} /> Thêm nợ
              </button>
            </div>

            <div className="space-y-2">
              {debts.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-6">Không có khoản nợ nào cần thu/trả</p>
              ) : (
                debts.map((d) => (
                  <div key={d.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          d.type === 'they_owe_me' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {d.type === 'they_owe_me' ? 'Cần thu' : 'Cần trả'}
                        </span>
                        <h4 className="text-xs font-black text-[#18181B]">{d.name}</h4>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{d.note}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-[#18181B]">
                        {d.amount.toLocaleString('vi-VN')}đ
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResolveDebt(d.id)}
                        className="px-2 py-1 bg-[#18181B] text-white text-[10px] font-bold rounded-lg active:scale-95 transition"
                        title="Đã thanh toán"
                      >
                        <Check size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NỘI DUNG 3: HŨ TIẾT KIỆM */}
        {activeTab === 'savings' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-neutral-700">Mục tiêu tích lũy</span>
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-xs font-black text-amber-600 flex items-center gap-0.5"
              >
                <Plus size={13} /> Thêm mục tiêu
              </button>
            </div>

            <div className="space-y-2.5">
              {savings.map((s) => {
                const percent = Math.min(100, Math.round((s.current / s.target) * 100));
                return (
                  <div key={s.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{s.icon}</span>
                        <div>
                          <h4 className="text-xs font-black text-[#18181B]">{s.title}</h4>
                          <span className="text-[10px] text-neutral-400 font-bold font-mono">
                            {s.current.toLocaleString('vi-VN')}đ / {s.target.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDepositSaving(s.id, 50000)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black rounded-lg active:scale-95 transition cursor-pointer"
                      >
                        + Bỏ 50k
                      </button>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NỘI DUNG 4: THUÊ BAO ĐỊNH KỲ */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-3 animate-tab-switch">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-neutral-700">Chi phí cố định hàng tháng</span>
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-xs font-black text-amber-600 flex items-center gap-0.5"
              >
                <Plus size={13} /> Thêm khoản
              </button>
            </div>

            <div className="space-y-2">
              {subscriptions.map((r) => (
                <div key={r.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-[#18181B]">{r.name}</h4>
                    <span className="text-[10px] text-neutral-400 font-semibold">Đến hạn ngày {r.dueDay} hàng tháng</span>
                  </div>
                  <span className="text-xs font-black font-mono text-rose-600">
                    -{r.cost.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORM THÊM NHANH */}
        {isAddingItem && (
          <form onSubmit={handleAddNew} className="p-3.5 bg-amber-50/70 border border-amber-300/80 rounded-2xl space-y-2 animate-tab-switch">
            <input
              type="text"
              required
              placeholder="Tên mục (VD: Netflix, Tiền trọ, Bạn Nam...)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
            />
            <input
              type="number"
              required
              placeholder="Số tiền (VNĐ)"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className="w-full bg-white rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:outline-none"
            />
            {activeTab === 'debts' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('they_owe_me')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${formType === 'they_owe_me' ? 'bg-emerald-600 text-white' : 'bg-white'}`}
                >
                  Người ta nợ tôi
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('i_owe_them')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${formType === 'i_owe_them' ? 'bg-rose-600 text-white' : 'bg-white'}`}
                >
                  Tôi nợ người ta
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2 bg-[#18181B] text-white text-xs font-black rounded-xl cursor-pointer"
            >
              Lưu vào danh sách
            </button>
          </form>
        )}

      </div>
    </div>
  );
};