import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const WeeklyStrip: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAppStore();

  const days = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (CN) -> 6 (T7)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return labels.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return {
        dayName,
        dateNumber: dd,
        dateStr: `${yyyy}-${mm}-${dd}`,
      };
    });
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex justify-between items-center bg-white rounded-2xl p-2 border border-neutral-100 shadow-sm mb-3">
      {days.map((d) => {
        const isSelected = selectedDate === d.dateStr;
        const isToday = d.dateStr === todayStr;
        return (
          <button
            type="button"
            key={d.dateStr}
            onClick={() => setSelectedDate(d.dateStr)}
            className={`flex-1 py-2 rounded-xl flex flex-col items-center relative transition cursor-pointer ${
              isSelected
                ? 'bg-[#18181B] text-white shadow-sm'
                : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
            <span className="text-xs font-black mt-0.5">{d.dateNumber}</span>
            {isToday && (
              <span
                className={`w-1 h-1 rounded-full mt-1 ${
                  isSelected ? 'bg-amber-400' : 'bg-[#18181B]'
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};