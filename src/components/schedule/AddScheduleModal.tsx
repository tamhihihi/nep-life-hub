import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const AddScheduleModal: React.FC = () => {
  const { isAddScheduleOpen, setIsAddScheduleOpen, selectedDate, addScheduleItem } = useAppStore();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [category, setCategory] = useState<'work' | 'food' | 'evening' | 'sport'>('work');
  const [cost, setCost] = useState('');

  if (!isAddScheduleOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addScheduleItem({
      title: title.trim(),
      dateStr: selectedDate,
      startTime: time,
      category,
      cost: cost ? parseInt(cost, 10) : undefined,
    });

    setTitle('');
    setCost('');
    setIsAddScheduleOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-ios-fade">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl relative border border-neutral-100 animate-ios-sheet">
        <button
          type="button"
          onClick={() => setIsAddScheduleOpen(false)}
          className="absolute top-5 right-5 text-neutral-400 hover:text-black cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-black text-[#18181B] mb-4">Thêm ga dừng lịch trình</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Tiêu đề trạm dừng
            </label>
            <input
              type="text"
              required
              placeholder="VD: Họp khách hàng, Tập gym..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Giờ đến ga
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Chi phí (nếu có)
              </label>
              <input
                type="number"
                placeholder="0đ"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Phân loại tuyến
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'work', label: '💼 Công việc' },
                { key: 'food', label: '🍜 Trạm ăn' },
                { key: 'sport', label: '🏃 Thể lực' },
                { key: 'evening', label: '🌙 Trạm đêm' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key as typeof category)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                    category === c.key
                      ? 'bg-[#18181B] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-[#18181B] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Check size={16} /> Lưu vào tuyến ngày
          </button>
        </form>
      </div>
    </div>
  );
};
