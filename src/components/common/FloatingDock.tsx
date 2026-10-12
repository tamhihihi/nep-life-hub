import React from 'react';
import { Compass, Clock, Plus, PieChart, ShoppingBag } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const FloatingDock: React.FC = () => {
  const { activeTab, setActiveTab, setIsKeypadOpen } = useAppStore();

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[32px] px-6 py-2.5 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-neutral-200/60 pointer-events-auto">
      <button
        type="button"
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-0.5 transition ${
          activeTab === 'home' ? 'text-[#18181B]' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        <Compass size={20} />
        <span className="text-[10px] font-bold">Trang chủ</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('schedule')}
        className={`flex flex-col items-center gap-0.5 transition ${
          activeTab === 'schedule' ? 'text-[#18181B]' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        <Clock size={20} />
        <span className="text-[10px] font-bold">Lịch trình</span>
      </button>

      <button
        type="button"
        onClick={() => setIsKeypadOpen(true)}
        className="w-12 h-12 bg-[#18181B] hover:bg-black text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition -my-2 cursor-pointer"
        aria-label="Thêm nhanh"
      >
        <Plus size={22} />
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('report')}
        className={`flex flex-col items-center gap-0.5 transition ${
          activeTab === 'report' ? 'text-[#18181B]' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        <PieChart size={20} />
        <span className="text-[10px] font-bold">Báo cáo</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center gap-0.5 transition ${
          activeTab === 'history' ? 'text-[#18181B]' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        <ShoppingBag size={20} />
        <span className="text-[10px] font-bold">Lịch sử</span>
      </button>
    </div>
  );
};
