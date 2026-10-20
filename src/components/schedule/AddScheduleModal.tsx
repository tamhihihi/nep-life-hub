import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, DollarSign, Bell, Repeat, Briefcase, Utensils, Zap, Moon, BookOpen, Coffee } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const AddScheduleModal: React.FC = () => {
  const store = useAppStore();
  const isAddScheduleOpen = (store as any)?.isAddScheduleOpen;
  const setIsAddScheduleOpen = (store as any)?.setIsAddScheduleOpen;

  const now = new Date();
  const defaultDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('09:00');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState<'work' | 'food' | 'fitness' | 'study' | 'chill'>('work');
  const [remindBefore, setRemindBefore] = useState<number>(15);
  const [repeatWeekly, setRepeatWeekly] = useState<boolean>(false);

  if (!isAddScheduleOpen) return null;

  const handleClose = () => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if (typeof setIsAddScheduleOpen === 'function') {
      setIsAddScheduleOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try { sounds?.playChime?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(20);

    const numericCost = parseInt(cost.replace(/\D/g, ''), 10) || 0;
    const baseDate = new Date(dateStr);

    // THUẬT TOÁN TẠO LỊCH (NẾU CHỌN LẶP LẠI -> TẠO LIÊN TIẾP 4 TUẦN TỚI)
    const weeksToCreate = repeatWeekly ? [0, 1, 2, 3] : [0];
    const newItems: any[] = [];

    weeksToCreate.forEach((weekIndex) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + weekIndex * 7);
      const itemDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      newItems.push({
        id: `sch_${Date.now()}_w${weekIndex}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        dateStr: itemDateStr,
        startTime: startTime || '09:00',
        cost: numericCost,
        category,
        remindBefore,
        completed: false,
      });
    });

    // CẬP NHẬT VÀO STORE
    useAppStore.setState((prev: any) => ({
      scheduleItems: [...newItems, ...(prev?.scheduleItems || [])],
    }));

    // NẾU CÓ CHI PHÍ -> TỰ ĐỘNG THÊM VÀO SỔ CHI TIÊU CỦA NGÀY HÔM ĐÓ
    if (numericCost > 0) {
      const newTx = {
        id: `tx_${Date.now()}`,
        amount: numericCost,
        type: 'expense' as const,
        category: category === 'food' ? 'Cơm trưa' : 'Chi tiêu',
        bankName: 'Tiền mặt',
        note: `Ga lịch trình: ${title.trim()}`,
        dateStr,
        timestamp: Date.now(),
      };
      useAppStore.setState((prev: any) => ({
        transactions: [newTx, ...(prev?.transactions || [])],
      }));
    }

    // Reset Form
    setTitle('');
    setCost('');
    setRepeatWeekly(false);
    handleClose();
  };

  const categories = [
    { id: 'work', label: 'Công việc', icon: Briefcase },
    { id: 'food', label: 'Ăn uống', icon: Utensils },
    { id: 'fitness', label: 'Thể lực', icon: Zap },
    { id: 'study', label: 'Học tập', icon: BookOpen },
    { id: 'chill', label: 'Nghỉ ngơi', icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
      <div className="w-full max-w-sm bg-white rounded-t-[34px] sm:rounded-[34px] p-5 shadow-2xl relative border border-neutral-200/90 max-h-[90dvh] overflow-y-auto no-scrollbar animate-sheet-spring space-y-4">
        
        {/* THANH KÉO GỢI Ý MOBILE */}
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        {/* TIÊU ĐỀ & NÚT ĐÓNG */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
              Lên kế hoạch mới
            </span>
            <h3 className="text-lg font-black text-[#18181B]">Thêm ga dừng lịch trình</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* TÊN CÔNG VIỆC */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-400 block px-1">
              Tên việc / Điểm dừng
            </label>
            <input
              type="text"
              required
              placeholder="VD: Họp dự án, Đi tập gym, Cà phê bạn bè..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-100 focus:bg-white border border-transparent focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#18181B] focus:outline-none transition"
              autoFocus
            />
          </div>

          {/* CHỌN NGÀY & GIỜ (HỖ TRỢ CHỌN BẤT CỨ NGÀY NÀO TRONG TƯƠNG LAI) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1 px-1">
                <Calendar size={11} /> Ngày đến
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-neutral-100 border border-transparent focus:border-amber-400 rounded-2xl px-2.5 py-2 text-xs font-bold font-mono text-[#18181B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1 px-1">
                <Clock size={11} /> Giờ bắt đầu
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-neutral-100 border border-transparent focus:border-amber-400 rounded-2xl px-2.5 py-2 text-xs font-bold font-mono text-center text-[#18181B] focus:outline-none"
              />
            </div>
          </div>

          {/* CHỌN DANH MỤC */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-400 block px-1">
              Phân loại ga dừng
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((c) => {
                const IconComponent = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as any)}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#18181B] text-white border-black shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200/70'
                    }`}
                  >
                    <IconComponent size={12} className={isSelected ? 'text-amber-400' : 'text-neutral-400'} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NHẮC BÁO & CHI PHÍ */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1 px-1">
                <Bell size={11} /> Nhắc trước
              </label>
              <select
                value={remindBefore}
                onChange={(e) => setRemindBefore(Number(e.target.value))}
                className="w-full bg-neutral-100 rounded-2xl px-2 py-2 text-xs font-bold text-[#18181B] focus:outline-none border border-transparent focus:border-amber-400"
              >
                <option value={5}>Trước 5 phút</option>
                <option value={15}>Trước 15 phút</option>
                <option value={30}>Trước 30 phút</option>
                <option value={60}>Trước 1 tiếng</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1 px-1">
                <DollarSign size={11} /> Chi phí (nếu có)
              </label>
              <input
                type="number"
                placeholder="0đ"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-neutral-100 rounded-2xl px-3 py-2 text-xs font-bold font-mono text-[#18181B] focus:outline-none"
              />
            </div>
          </div>

          {/* TÙY CHỌN: LẶP LẠI CHO CÁC TUẦN TIẾP THEO (TÍNH NĂNG ĐA TUẦN) */}
          <div 
            onClick={() => setRepeatWeekly(!repeatWeekly)}
            className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-300/60 rounded-2xl cursor-pointer active:scale-98 transition"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-black flex items-center justify-center">
                <Repeat size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-amber-950 block">Lặp lại 4 tuần tới</span>
                <span className="text-[10px] text-amber-800 font-semibold">Tự thêm vào đúng thứ này ở 4 tuần tiếp theo</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={repeatWeekly}
              onChange={() => {}}
              className="w-4 h-4 accent-amber-500 pointer-events-none"
            />
          </div>

          {/* NÚT THÊM GA */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#18181B] hover:bg-black text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={15} className="text-amber-400" />
            <span>Xác nhận thêm ga dừng</span>
          </button>
        </form>

      </div>
    </div>
  );
};