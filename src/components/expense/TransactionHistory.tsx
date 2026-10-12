import React, { useState } from 'react';
import { Search, Coffee, Utensils, Bus, ShoppingBag, Trash2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const TransactionHistory: React.FC = () => {
  const { transactions, deleteTransaction } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.note.toLowerCase().includes(search.toLowerCase()) ||
      t.bankName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType;
  });

  const getIcon = (cat: string) => {
    if (cat.includes('Cà phê')) return <Coffee size={18} />;
    if (cat.includes('Ăn') || cat.includes('Cơm')) return <Utensils size={18} />;
    if (cat.includes('Grab') || cat.includes('Xăng')) return <Bus size={18} />;
    return <ShoppingBag size={18} />;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#18181B] mb-1">Lịch sử</h2>
        <p className="text-xs text-neutral-400 font-medium">Sổ ghi trong máy · Không đẩy lên mây</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Tìm người nhận, số tiền, ghi chú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white text-xs font-semibold rounded-2xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="flex gap-2">
        {(['all', 'expense', 'income'] as const).map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filterType === type
                ? 'bg-[#18181B] text-white'
                : 'bg-white text-neutral-600 border border-neutral-200'
            }`}
          >
            {type === 'all' ? 'Tất cả' : type === 'expense' ? 'Khoản chi' : 'Thu nhập'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[28px] p-2 divide-y divide-neutral-100 shadow-sm border border-neutral-100">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-xs">Không tìm thấy giao dịch nào</div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                  {getIcon(t.category)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#18181B]">{t.category}</h4>
                  <p className="text-[11px] text-neutral-400">
                    {t.note ? `${t.note} · ` : ''}{t.bankName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className={`text-xs font-black ${t.type === 'expense' ? 'text-[#18181B]' : 'text-emerald-600'}`}>
                    {t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString()}đ
                  </span>
                  <p className="text-[10px] text-neutral-400">{t.dateStr}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTransaction(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500 transition p-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
