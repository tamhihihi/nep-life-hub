import React from 'react';
import { Utensils, Moon, Calendar, Coffee, Plus, CheckCircle2, Circle, Bell, BellRing } from 'lucide-react';
import { useAppStore } from './stores/useAppStore';
import { ExpenseSummaryCard } from './components/expense/ExpenseSummaryCard';
import { QrScannerModal } from './components/expense/QrScannerModal';
import { KeypadModal } from './components/expense/KeypadModal';
import { TransactionHistory } from './components/expense/TransactionHistory';
import { ReportView } from './components/expense/ReportView';
import { ScheduleTimeline } from './components/schedule/ScheduleTimeline';
import { AddScheduleModal } from './components/schedule/AddScheduleModal';
import { CsgoFoodRoulette } from './components/food/CsgoFoodRoulette';
import { TarotCardFlip } from './components/evening/TarotCardFlip';
import { FloatingDock } from './components/common/FloatingDock';
import { EveningWhisperCard } from './components/evening/EveningWhisperCard';
import { notifier } from './utils/notificationService';

export default function App() {
  const { 
    activeTab, 
    scheduleItems, 
    transactions, 
    monthlyLimit,
    lastActiveTime,
    updateLastActive,
    setIsFoodOpen, 
    setIsEveningOpen, 
    toggleScheduleItem, 
    setIsAddScheduleOpen 
  } = useAppStore();

  const [notiEnabled, setNotiEnabled] = React.useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = scheduleItems.filter((i) => i.dateStr === todayStr);

  React.useEffect(() => {
    notifier.checkInactivity(lastActiveTime);
    updateLastActive();

    const monthSpent = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    notifier.checkBudgetThreshold(monthSpent, monthlyLimit);
    notifier.checkDailyRoutine();
    notifier.checkEveningComfortRoutine();

    const interval = setInterval(() => {
      notifier.checkDailyRoutine();
      notifier.checkEveningComfortRoutine();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleNotification = async () => {
    const granted = await notifier.requestPermission();
    setNotiEnabled(granted);
    if (granted) {
      notifier.send(
        '✨ Đã bật thông báo Nếp',
        'Bạn sẽ nhận được lời nhắc hạn mức chi tiêu và thông điệp động viên Sáng, Trưa, Tối mỗi ngày.',
        '✨'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#18181B] font-sans flex flex-col justify-between selection:bg-neutral-200">
      <main className="w-full max-w-md mx-auto min-h-screen flex flex-col px-4 pt-8 pb-32">
        <header className="flex justify-between items-end mb-5 px-1">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">THỨ HAI</p>
            <h1 className="text-2xl font-black tracking-tight text-[#18181B]">12 tháng 10</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleNotification}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                notiEnabled 
                  ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm' 
                  : 'bg-white border-neutral-200/80 text-neutral-400 hover:text-black'
              }`}
              title={notiEnabled ? 'Thông báo đang bật' : 'Bấm để bật thông báo'}
            >
              {notiEnabled ? <BellRing size={16} /> : <Bell size={16} />}
            </button>

            <div className="w-9 h-9 rounded-full bg-white border border-neutral-200/60 flex items-center justify-center font-bold text-xs text-neutral-700 shadow-sm">
              VN
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4">
          {activeTab === 'home' && (
            <>
              <EveningWhisperCard />
              <ExpenseSummaryCard />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFoodOpen(true)}
                  className="bg-[#18181B] text-white p-4 rounded-[26px] flex flex-col justify-between text-left active:scale-[0.95] transition-all duration-200 shadow-sm hover:shadow-md h-32 cursor-pointer gpu-accelerated"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-amber-300">
                    <Utensils size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Hòm cơm trưa</span>
                    <span className="text-sm font-black text-white">Ăn gì ta?</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEveningOpen(true)}
                  className="bg-white border border-neutral-200/80 p-4 rounded-[26px] flex flex-col justify-between text-left active:scale-[0.95] transition-all duration-200 shadow-sm hover:shadow-md h-32 cursor-pointer gpu-accelerated"
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-indigo-500">
                    <Moon size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Bốc quẻ đêm</span>
                    <span className="text-sm font-black text-[#18181B]">Làm gì chill?</span>
                  </div>
                </button>
              </div>

              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-neutral-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#18181B] flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar size={14} className="text-neutral-400" /> Tuyến hôm nay
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddScheduleOpen(true)}
                    className="text-[11px] font-bold text-neutral-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={13} /> Thêm ga
                  </button>
                </div>

                <div className="space-y-2">
                  {todaySchedules.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-3 text-center">Chưa có lịch trình cho hôm nay</p>
                  ) : (
                    todaySchedules.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleScheduleItem(item.id)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F7F5] border border-neutral-200/40 cursor-pointer active:scale-[0.98] transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-neutral-400 w-10 font-mono">{item.startTime}</span>
                          <span className={`text-xs font-semibold ${item.completed ? 'line-through text-neutral-400' : 'text-[#18181B]'}`}>
                            {item.title}
                          </span>
                        </div>
                        {item.completed ? (
                          <CheckCircle2 size={18} className="text-neutral-800" />
                        ) : (
                          <Circle size={18} className="text-neutral-300" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[28px] p-4 shadow-sm border border-neutral-100 divide-y divide-neutral-100">
                <div className="flex justify-between items-center pb-2 px-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Chi tiêu gần đây</span>
                  <span className="text-[11px] text-neutral-400 font-semibold">{transactions.length} khoản</span>
                </div>
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600">
                        <Coffee size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#18181B]">{tx.category}</h4>
                        <p className="text-[10px] text-neutral-400">{tx.bankName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#18181B]">-{tx.amount.toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'schedule' && <ScheduleTimeline />}
          {activeTab === 'history' && <TransactionHistory />}
          {activeTab === 'report' && <ReportView />}
        </div>

        <div className="fixed bottom-5 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30">
          <FloatingDock />
        </div>

        <QrScannerModal />
        <KeypadModal />
        <AddScheduleModal />
        <CsgoFoodRoulette />
        <TarotCardFlip />

      </main>
    </div>
  );
}
