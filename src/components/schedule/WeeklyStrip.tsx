import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const WeeklyStrip: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAppStore();

  const days = [
    { dayName: 'T2', dateNumber: '12', dateStr: '2026-10-12' },
    { dayName: 'T3', dateNumber: '13', dateStr: '2026-10-13' },
    { dayName: 'T4', dateNumber: '14', dateStr: '2026-10-14' },
    { dayName: 'T5', dateNumber: '15', dateStr: '2026-10-15' },
    { dayName: 'T6', dateNumber: '16', dateStr: '2026-10-16' },
    { dayName: 'T7', dateNumber: '17', dateStr: '2026-10-17' },
    { dayName: 'CN', dateNumber: '18', dateStr: '2026-10-18' },
  ];

  return (
    <div className="flex justify-between items-center bg-white rounded-2xl p-2 border border-neutral-100 shadow-sm mb-3">
      {days.map((d) => {
        const isSelected = selectedDate === d.dateStr;
        return (
          <button
            type="button"
            key={d.dateStr}
            onClick={() => setSelectedDate(d.dateStr)}
            className={`flex-1 py-2 rounded-xl flex flex-col items-center transition cursor-pointer ${
              isSelected ? 'bg-[#18181B] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
            <span className="text-xs font-black mt-0.5">{d.dateNumber}</span>
          </button>
        );
      })}
    </div>
  );
};
