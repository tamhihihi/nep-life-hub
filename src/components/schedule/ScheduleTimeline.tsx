import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Train, 
  Utensils, 
  Moon, 
  Briefcase, 
  Dumbbell, 
  CheckCircle2, 
  CircleDot,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { WeeklyStrip } from './WeeklyStrip';

export const ScheduleTimeline: React.FC = () => {
  const { 
    scheduleItems, 
    selectedDate, 
    toggleScheduleItem, 
    deleteScheduleItem, 
    setIsAddScheduleOpen,
    setIsFoodOpen,
    setIsEveningOpen
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'work' | 'food' | 'evening' | 'sport'>('all');

  const items = scheduleItems
    .filter((i) => i.dateStr === selectedDate)
    .filter((i) => activeFilter === 'all' || i.category === activeFilter)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  const now = new Date();
  const currentHour = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const getStationIcon = (cat: string) => {
    switch (cat) {
      case 'work': return <Briefcase size={13} className="text-neutral-700" />;
      case 'food': return <Utensils size={13} className="text-amber-500" />;
      case 'evening': return <Moon size={13} className="text-indigo-400" />;
      case 'sport': return <Dumbbell size={13} className="text-emerald-500" />;
      default: return <CircleDot size={13} className="text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 w-fit mb-1">
            <Train size={11} /> Tuyến Metro 24H · Line 10
          </div>
          <h2 className="text-2xl font-black text-[#18181B] tracking-tight">Hành Trình Hôm Nay</h2>
        </div>
        
        <button
          type="button"
          onClick={() => setIsAddScheduleOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#18181B] active:bg-black text-white flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
        >
          <Plus size={18} />
        </button>
      </div>

      <WeeklyStrip />

      <div className="bg-[#18181B] text-white rounded-[26px] p-4.5 shadow-md relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              Trạng thái hành trình
            </span>
            <div className="text-base font-black mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Đã qua {completedCount}/{items.length} ga dừng
            </div>
          </div>
          <span className="text-2xl font-black text-amber-400">{progressPercent}%</span>
        </div>

        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { key: 'all', label: 'Toàn tuyến' },
          { key: 'work', label: '💼 Công việc' },
          { key: 'food', label: '🍜 Trạm ăn' },
          { key: 'sport', label: '🏃 Thể lực' },
          { key: 'evening', label: '🌙 Trạm đêm' },
        ].map((f) => (
          <button
            type="button"
            key={f.key}
            onClick={() => setActiveFilter(f.key as typeof activeFilter)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeFilter === f.key 
                ? 'bg-[#18181B] text-white shadow-sm' 
                : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] p-5 border border-neutral-100 shadow-sm relative">
        {items.length === 0 ? (
          <div className="text-center py-12 text-xs text-neutral-400">
            Chưa có trạm dừng nào cho tuyến ngày này.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[35px] top-4 bottom-4 w-[3px] bg-neutral-200 rounded-full">
              <div 
                className="w-full bg-[#18181B] rounded-full transition-all duration-500"
                style={{ height: `${progressPercent}%` }}
              />
            </div>

            {items.map((station) => {
              const isPast = station.completed;
              const isNextStation = !station.completed && station.startTime >= currentHour;

              return (
                <div key={station.id} className="relative flex items-start gap-4 group">
                  <div className="relative z-10 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleScheduleItem(station.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isPast
                          ? 'bg-[#18181B] border-[#18181B] text-white shadow-sm'
                          : isNextStation
                          ? 'bg-amber-400 border-[#18181B] text-black shadow-md scale-110'
                          : 'bg-white border-neutral-300 text-neutral-400'
                      }`}
                    >
                      {isPast ? <CheckCircle2 size={15} /> : getStationIcon(station.category)}
                    </button>

                    {isNextStation && (
                      <span className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
                    )}
                  </div>

                  <div 
                    className={`flex-1 p-3.5 rounded-2xl border transition-all ${
                      isPast 
                        ? 'bg-neutral-50/60 border-neutral-100 opacity-60' 
                        : isNextStation
                        ? 'bg-[#FAF8F5] border-amber-300 shadow-sm'
                        : 'bg-[#F7F7F5] border-neutral-200/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-black text-neutral-400 tracking-wider font-mono">
                          {station.startTime} {station.endTime ? `→ ${station.endTime}` : ''}
                        </span>
                        <h4 className={`text-xs font-black mt-0.5 ${isPast ? 'line-through text-neutral-400' : 'text-[#18181B]'}`}>
                          {station.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        {station.cost && (
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/40">
                            -{station.cost.toLocaleString()}đ
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteScheduleItem(station.id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500 p-1 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {station.category === 'food' && (
                      <button
                        type="button"
                        onClick={() => setIsFoodOpen(true)}
                        className="mt-2.5 w-full py-1.5 px-2 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 rounded-xl text-[10px] font-bold text-amber-700 flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                      >
                        <Utensils size={11} /> Mở Hòm Cơm CS:GO Cho Ga Này
                      </button>
                    )}

                    {station.category === 'evening' && (
                      <button
                        type="button"
                        onClick={() => setIsEveningOpen(true)}
                        className="mt-2.5 w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-[10px] font-bold text-indigo-700 flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                      >
                        <Sparkles size={11} /> Rút Lá Bài Tarot Cho Ga Này
                      </button>
                    )}
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
