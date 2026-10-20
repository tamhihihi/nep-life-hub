import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles,
  AlertCircle,
  TrendingUp,
  Check
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { sounds } from '../../utils/soundEngine';

export const ScheduleTimeline: React.FC = () => {
  const store = useAppStore();
  const scheduleItems = (store as any)?.scheduleItems || [];
  const toggleScheduleItem = (store as any)?.toggleScheduleItem;
  const deleteScheduleItem = (store as any)?.deleteScheduleItem;
  const setIsAddScheduleOpen = (store as any)?.setIsAddScheduleOpen;

  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. STATE QUẢN LÝ TUẦN ĐANG CHỌN (0 = Tuần này, +1 = Tuần sau, -1 = Tuần trước...)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  // 2. THUẬT TOÁN TÍNH TOÁN 7 NGÀY TRONG TUẦN THEO WEEK OFFSET (BẮT ĐẦU TỪ THỨ HAI)
  const weekDays = useMemo(() => {
    const target = new Date();
    target.setDate(target.getDate() + weekOffset * 7);

    // Tính ngày Thứ Hai của tuần đó
    const dayOfWeek = target.getDay(); // 0 là Chủ Nhật, 1 là Thứ 2...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(target);
    monday.setDate(target.getDate() + diffToMonday);

    const days = [];
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Đếm số công việc trong ngày đó
      const count = scheduleItems.filter((item: any) => item?.dateStr === dStr).length;

      days.push({
        label: dayLabels[i],
        dayNum: d.getDate(),
        dateStr: dStr,
        isToday: dStr === todayDateStr,
        taskCount: count,
      });
    }
    return days;
  }, [weekOffset, scheduleItems, todayDateStr]);

  // 3. LỌC DANH SÁCH LỊCH TRÌNH THEO NGÀY ĐANG CHỌN & SẮP XẾP THEO GIỜ
  const daySchedules = useMemo(() => {
    return scheduleItems
      .filter((item: any) => item?.dateStr === selectedDate)
      .sort((a: any, b: any) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
  }, [scheduleItems, selectedDate]);

  // 4. TIẾN ĐỘ HOÀN THÀNH TRONG NGÀY
  const completedCount = daySchedules.filter((i: any) => i.completed).length;
  const progressPercent = daySchedules.length > 0 ? Math.round((completedCount / daySchedules.length) * 100) : 0;

  // 5. THUẬT TOÁN ĐÁNH GIÁ TÌNH TRẠNG THỜI GIAN THỰC (4 TRẠNG THÁI)
  const getItemStatus = (item: any) => {
    if (item.completed) {
      return {
        label: 'Đã hoàn thành',
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        dot: 'bg-emerald-500',
        type: 'done',
      };
    }

    // So sánh thời gian
    const [hStr, mStr] = String(item.startTime || '00:00').split(':');
    const itemMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (item.dateStr < todayDateStr) {
      return {
        label: 'Đã quá hạn',
        badge: 'bg-rose-50 text-rose-600 border-rose-200',
        dot: 'bg-rose-500',
        type: 'late',
      };
    }

    if (item.dateStr > todayDateStr) {
      return {
        label: 'Sắp tới',
        badge: 'bg-neutral-100 text-neutral-500 border-neutral-200',
        dot: 'bg-neutral-400',
        type: 'upcoming',
      };
    }

    // Cùng ngày hôm nay
    const diff = itemMinutes - currentMinutes;
    if (diff < -45) {
      return {
        label: 'Trễ hẹn',
        badge: 'bg-rose-50 text-rose-600 border-rose-200',
        dot: 'bg-rose-500',
        type: 'late',
      };
    }
    if (diff >= -45 && diff <= 30) {
      return {
        label: 'Đang diễn ra',
        badge: 'bg-amber-50 text-amber-700 border-amber-300 font-black animate-pulse',
        dot: 'bg-amber-500 shadow-amber-400/60 shadow-[0_0_8px]',
        type: 'ongoing',
      };
    }
    if (diff > 30) {
      return {
        label: `Còn ${Math.floor(diff / 60) > 0 ? `${Math.floor(diff / 60)}h ` : ''}${diff % 60}p`,
        badge: 'bg-blue-50 text-blue-600 border-blue-200',
        dot: 'bg-blue-500',
        type: 'countdown',
      };
    }

    return {
      label: 'Sắp tới',
      badge: 'bg-neutral-100 text-neutral-500 border-neutral-200',
      dot: 'bg-neutral-400',
      type: 'upcoming',
    };
  };

  const handleToggle = (id: string) => {
    try { sounds?.playKeypadTap?.(); } catch {}
    if ('vibrate' in navigator) navigator.vibrate(15);

    if (typeof toggleScheduleItem === 'function') {
      toggleScheduleItem(id);
    } else {
      useAppStore.setState((prev: any) => ({
        scheduleItems: (prev?.scheduleItems || []).map((it: any) =>
          it.id === id ? { ...it, completed: !it.completed } : it
        ),
      }));
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { sounds?.playKeypadTap?.(); } catch {}

    if (typeof deleteScheduleItem === 'function') {
      deleteScheduleItem(id);
    } else {
      useAppStore.setState((prev: any) => ({
        scheduleItems: (prev?.scheduleItems || []).filter((it: any) => it.id !== id),
      }));
    }
  };

  return (
    <div className="space-y-4 animate-tab-switch pb-20">
      
      {/* ================= 1. BỘ ĐIỀU HƯỚNG TUẦN (WEEK NAVIGATOR) ================= */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={15} className="text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B]">
              {weekOffset === 0 ? 'Tuần này' : weekOffset === 1 ? 'Tuần sau' : weekOffset === -1 ? 'Tuần trước' : `Cách ${Math.abs(weekOffset)} tuần`}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                try { sounds?.playKeypadTap?.(); } catch {}
                setWeekOffset((prev) => prev - 1);
              }}
              className="w-7 h-7 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft size={15} />
            </button>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  try { sounds?.playKeypadTap?.(); } catch {}
                  setWeekOffset(0);
                  setSelectedDate(todayDateStr);
                }}
                className="px-2 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black"
              >
                Về hôm nay
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                try { sounds?.playKeypadTap?.(); } catch {}
                setWeekOffset((prev) => prev + 1);
              }}
              className="w-7 h-7 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* DẢI 7 NGÀY TRONG TUẦN */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  try { sounds?.playKeypadTap?.(); } catch {}
                  setSelectedDate(day.dateStr);
                }}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#18181B] text-white shadow-md scale-102'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}
              >
                <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`}>
                  {day.label}
                </span>
                <span className={`text-xs font-black font-mono ${isSelected ? 'text-white' : 'text-[#18181B]'}`}>
                  {day.dayNum}
                </span>

                {/* Chấm báo số lượng việc */}
                {day.taskCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-neutral-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 2. THANH TIẾN ĐỘ NGÀY ĐANG CHỌN ================= */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs px-1">
          <div>
            <span className="font-black text-[#18181B] block">
              {selectedDate === todayDateStr ? 'Hôm nay' : selectedDate}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              Đã xong {completedCount}/{daySchedules.length} ga dừng
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              try { sounds?.playKeypadTap?.(); } catch {}
              if (typeof setIsAddScheduleOpen === 'function') setIsAddScheduleOpen(true);
            }}
            className="px-3 py-1.5 bg-[#18181B] hover:bg-black text-white text-[11px] font-black rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition cursor-pointer"
          >
            <Plus size={13} className="text-amber-400" />
            <span>Thêm ga</span>
          </button>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ================= 3. DANH SÁCH LỊCH TRÌNH DẠNG TUYẾN GA (TIMELINE) ================= */}
      <div className="space-y-2.5">
        {daySchedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-neutral-200/90 text-center space-y-2">
            <Clock size={28} className="text-neutral-300 mx-auto" />
            <p className="text-xs font-bold text-neutral-500">Chưa có lịch trình cho ngày này</p>
            <p className="text-[10px] text-neutral-400">Bấm nút "Thêm ga" ở trên để lên kế hoạch ngay!</p>
          </div>
        ) : (
          daySchedules.map((item: any, idx: number) => {
            const status = getItemStatus(item);
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-3.5 bg-white rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between gap-3 shadow-xs active:scale-98 ${
                  item.completed
                    ? 'border-neutral-200 opacity-60 bg-neutral-50/50'
                    : 'border-neutral-200/90 hover:border-neutral-400'
                }`}
              >
                {/* CỘT THỜI GIAN & ĐƯỜNG NỐI TIMELINE */}
                <div className="flex items-center gap-3">
                  <div className="text-center w-11 shrink-0">
                    <span className="text-xs font-black font-mono text-[#18181B] block">
                      {item.startTime}
                    </span>
                    <span className={`w-2 h-2 rounded-full mx-auto mt-1 block ${status.dot}`} />
                  </div>

                  {/* NỘI DUNG GA DỪNG */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-xs font-black truncate ${item.completed ? 'line-through text-neutral-400' : 'text-[#18181B]'}`}>
                        {item.title}
                      </h4>
                      {item.cost > 0 && (
                        <span className="text-[10px] font-bold font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded">
                          {(item.cost / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NÚT TÍCH HOÀN THÀNH & XÓA */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="w-7 h-7 rounded-xl hover:bg-neutral-100 text-neutral-300 hover:text-rose-500 flex items-center justify-center transition"
                    title="Xóa ga dừng"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    item.completed ? 'bg-emerald-500 text-white' : 'border-2 border-neutral-300'
                  }`}>
                    {item.completed && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};