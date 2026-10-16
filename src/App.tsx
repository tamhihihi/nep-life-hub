import React, { useRef, useState, useEffect } from 'react';
import { 
  Utensils, 
  Moon, 
  Calendar, 
  Coffee, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Bell, 
  BellRing, 
  Bus, 
  ShoppingBag, 
  Download, 
  Upload, 
  Camera, 
  Wallet, 
  Sparkles, 
  X, 
  QrCode, 
  Calculator, 
  Users, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';
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
import { NepMoments } from './components/expense/social/NepMoments';
import { notifier } from './utils/notificationService';
import { sounds } from './utils/soundEngine';

// Rung xúc giác chuẩn Haptic cho điện thoại (tự động bỏ qua nếu là máy tính)
const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    if (type === 'light') navigator.vibrate(12);
    else if (type === 'medium') navigator.vibrate(28);
    else if (type === 'success') navigator.vibrate([15, 40, 20]);
  }
};

export default function App() {
  const store = useAppStore();
  const { 
    activeTab, 
    scheduleItems = [], 
    transactions = [], 
    monthlyLimit = 5000000, 
    lastActiveTime, 
    updateLastActive, 
    setIsFoodOpen, 
    setIsEveningOpen, 
    toggleScheduleItem, 
    setIsAddScheduleOpen 
  } = store;

  // 3 Phân vùng Trang Chủ
  const [hubSection, setHubSection] = useState<'wallet' | 'lokcam' | 'chill'>('wallet');

  // Sheet Cài đặt & Hồ sơ
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast hoàn tác khi bấm 1-Tap
  const [undoToast, setUndoToast] = useState<{ id: string; text: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [notiEnabled, setNotiEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const weekdays = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
  const currentWeekday = weekdays[now.getDay()];
  const currentDateLabel = `${now.getDate()} tháng ${now.getMonth() + 1}`;
  const todayStr = now.toISOString().split('T')[0];
  const todaySchedules = scheduleItems.filter((i) => i.dateStr === todayStr);

  useEffect(() => {
    if (typeof updateLastActive === 'function') {
      notifier.checkInactivity(lastActiveTime);
      updateLastActive();
    }

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
    triggerHaptic('light');
    sounds.playKeypadTap();
    const granted = await notifier.requestPermission();
    setNotiEnabled(granted);
    if (granted) {
      notifier.send(
        '✨ Đã bật thông báo Nếp',
        'Nếp sẽ nhắc nhở hạn mức và gửi lời nhắn động viên mỗi ngày.',
        '✨'
      );
    }
  };

  const handleExportBackup = () => {
    triggerHaptic('success');
    sounds.playChime();
    const rawData = localStorage.getItem('nep_lifehub_v3');
    if (!rawData) return;
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nep-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        JSON.parse(content);
        localStorage.setItem('nep_lifehub_v3', content);
        triggerHaptic('success');
        sounds.playChime();
        window.location.reload();
      } catch {
        alert('Tệp sao lưu không đúng định dạng!');
      }
    };
    reader.readAsText(file);
  };

  // Nút tắt 1-Tap ghi nhanh + Rung Haptic + Hiện nút Hoàn Tác
  const handleQuickSpend = (amount: number, category: string, note: string) => {
    triggerHaptic('medium');
    sounds.playKeypadTap();

    const newId = `tx_${Date.now()}`;
    if (typeof (store as any).addTransaction === 'function') {
      (store as any).addTransaction({
        id: newId,
        amount,
        type: 'expense',
        category,
        bankName: 'Tiền mặt',
        note,
        dateStr: todayStr,
      });

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setUndoToast({ id: newId, text: `Đã ghi ${category} - ${(amount / 1000).toFixed(0)}k` });

      toastTimeoutRef.current = window.setTimeout(() => {
        setUndoToast(null);
      }, 3500);
    }
  };

  const handleUndoSpend = () => {
    if (!undoToast) return;
    triggerHaptic('light');
    sounds.playKeypadTap();
    if (typeof (store as any).deleteTransaction === 'function') {
      (store as any).deleteTransaction(undoToast.id);
    }
    setUndoToast(null);
  };

  const handleOpenScanner = () => {
    triggerHaptic('light');
    sounds.playKeypadTap();
    if (typeof (store as any).setIsQrOpen === 'function') {
      (store as any).setIsQrOpen(true);
    } else if (typeof (store as any).setIsScannerOpen === 'function') {
      (store as any).setIsScannerOpen(true);
    }
  };

  const handleOpenKeypad = () => {
    triggerHaptic('light');
    sounds.playKeypadTap();
    if (typeof (store as any).setIsKeypadOpen === 'function') {
      (store as any).setIsKeypadOpen(true);
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Cà phê')) return <Coffee size={15} />;
    if (cat.includes('Ăn') || cat.includes('Cơm')) return <Utensils size={15} />;
    if (cat.includes('Grab') || cat.includes('Xăng')) return <Bus size={15} />;
    return <ShoppingBag size={15} />;
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#18181B] font-sans flex flex-col justify-between selection:bg-neutral-200">
      <main className="w-full max-w-md mx-auto min-h-screen flex flex-col px-4 pt-6 pb-36">
        
        {/* ================= HEADER TỐI GIẢN ================= */}
        <header className="flex justify-between items-center mb-4 px-1">
          <div>
            <span className="text-[10px] font-black tracking-wider uppercase text-neutral-400">
              {currentWeekday} · {currentDateLabel}
            </span>
            <h1 className="text-xl font-black tracking-tight text-[#18181B] flex items-center gap-1.5">
              Nếp · Life Hub <Sparkles size={14} className="text-amber-500" />
            </h1>
          </div>
          
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              sounds.playKeypadTap();
              setIsSettingsOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-white border border-neutral-200/90 shadow-sm flex items-center justify-center text-sm font-black active:scale-90 transition-transform cursor-pointer"
            title="Hồ sơ & Cài đặt"
          >
            <span>😎</span>
          </button>
        </header>

        {/* ================= NỘI DUNG CHÍNH THEO TAB DOCK ================= */}
        <div className="flex-1 space-y-4">
          {activeTab === 'home' && (
            <>
              {/* THANH CHUYỂN 3 KHÔNG GIAN RIÊNG BIỆT (ANIMATED PILLS) */}
              <div className="bg-neutral-200/70 p-1 rounded-2xl grid grid-cols-3 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    sounds.playKeypadTap();
                    setHubSection('wallet');
                  }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 ${
                    hubSection === 'wallet'
                      ? 'bg-white text-[#18181B] shadow-sm scale-100'
                      : 'text-neutral-500 hover:text-black scale-95 opacity-80'
                  }`}
                >
                  <Wallet size={13} className="text-emerald-600" />
                  <span>Ví Tiền</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    sounds.playKeypadTap();
                    setHubSection('lokcam');
                  }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 ${
                    hubSection === 'lokcam'
                      ? 'bg-white text-[#18181B] shadow-sm scale-100'
                      : 'text-neutral-500 hover:text-black scale-95 opacity-80'
                  }`}
                >
                  <Camera size={13} className="text-amber-500" />
                  <span>LokCam</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    sounds.playKeypadTap();
                    setHubSection('chill');
                  }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 ${
                    hubSection === 'chill'
                      ? 'bg-white text-[#18181B] shadow-sm scale-100'
                      : 'text-neutral-500 hover:text-black scale-95 opacity-80'
                  }`}
                >
                  <Sparkles size={13} className="text-indigo-500" />
                  <span>Nếp Chill</span>
                </button>
              </div>

              {/* ----- KHÔNG GIAN 1: VÍ TIỀN & CHI TIÊU NHANH ----- */}
              {hubSection === 'wallet' && (
                <div className="space-y-4 animate-tab-switch">
                  <ExpenseSummaryCard />

                  {/* 3 NÚT HÀNH ĐỘNG GHI CHÉP CHÍNH */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleOpenScanner}
                      className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <QrCode size={16} />
                      </div>
                      <span className="text-[11px] font-black text-neutral-700">Quét VietQR</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenKeypad}
                      className="p-3 bg-[#18181B] text-white rounded-2xl shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                        <Calculator size={16} />
                      </div>
                      <span className="text-[11px] font-black">Ghi nhanh</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenKeypad}
                      className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <span className="text-[11px] font-black text-neutral-700">Chia Bill</span>
                    </button>
                  </div>

                  {/* DẢI 1-TAP GHI NHANH VỚI PHẢN HỒI CHẠM */}
                  <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        1-Tap · Chạm là ghi
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400">Bấm nhầm có hoàn tác</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Cà phê', cost: 30000, icon: '☕' },
                        { name: 'Cơm trưa', cost: 40000, icon: '🍱' },
                        { name: 'Xăng/Grab', cost: 30000, icon: '🚗' },
                        { name: 'Ăn vặt', cost: 20000, icon: '🧋' },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleQuickSpend(item.cost, item.name, item.name)}
                          className="py-3 px-1 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/70 flex flex-col items-center gap-1 active:scale-90 active:bg-amber-100 transition-all cursor-pointer"
                        >
                          <span className="text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black text-[#18181B]">{item.name}</span>
                          <span className="text-[10px] text-neutral-400 font-bold font-mono">{(item.cost / 1000).toFixed(0)}k</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GIAO DỊCH GẦN ĐÂY */}
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-200/80 divide-y divide-neutral-100">
                    <div className="flex justify-between items-center pb-2 px-1">
                      <span className="text-xs font-black text-neutral-700">Giao dịch mới nhất</span>
                      <span className="text-[10px] font-semibold text-neutral-400 font-mono">{transactions.length} khoản</span>
                    </div>

                    {transactions.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">Chưa có khoản chi nào</p>
                    ) : (
                      transactions.slice(0, 3).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                              {getCategoryIcon(tx.category)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-[#18181B]">{tx.category}</h4>
                              <p className="text-[10px] text-neutral-400">{tx.note || tx.bankName}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-black font-mono ${tx.type === 'income' ? 'text-emerald-600' : 'text-[#18181B]'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ----- KHÔNG GIAN 2: MẠNG XÃ HỘI LOKCAM ----- */}
              {hubSection === 'lokcam' && (
                <div className="animate-tab-switch">
                  <NepMoments />
                </div>
              )}

              {/* ----- KHÔNG GIAN 3: NẾP CHILL & LỊCH TRÌNH ----- */}
              {hubSection === 'chill' && (
                <div className="space-y-4 animate-tab-switch">
                  <EveningWhisperCard />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        sounds.playKeypadTap();
                        if (typeof setIsFoodOpen === 'function') setIsFoodOpen(true);
                      }}
                      className="bg-[#18181B] text-white p-4 rounded-3xl flex flex-col justify-between text-left active:scale-95 transition-transform h-28 shadow-sm cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-amber-300">
                        <Utensils size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase font-bold">Thực đơn 3D</span>
                        <span className="text-xs font-black text-white">Trưa nay ăn gì?</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        sounds.playKeypadTap();
                        if (typeof setIsEveningOpen === 'function') setIsEveningOpen(true);
                      }}
                      className="bg-white border border-neutral-200/80 p-4 rounded-3xl flex flex-col justify-between text-left active:scale-95 transition-transform h-28 shadow-sm cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Moon size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase font-bold">Bốc quẻ đêm</span>
                        <span className="text-xs font-black text-[#18181B]">Làm gì chill?</span>
                      </div>
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-200/80 space-y-2.5">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-xs font-black text-[#18181B] flex items-center gap-1.5">
                        <Calendar size={13} className="text-neutral-400" /> Tuyến lịch trình hôm nay
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          sounds.playKeypadTap();
                          if (typeof setIsAddScheduleOpen === 'function') setIsAddScheduleOpen(true);
                        }}
                        className="text-[11px] font-bold text-neutral-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={12} /> Thêm ga
                      </button>
                    </div>

                    {todaySchedules.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">Chưa có lịch trình cho hôm nay</p>
                    ) : (
                      todaySchedules.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            triggerHaptic('light');
                            sounds.playKeypadTap();
                            if (typeof toggleScheduleItem === 'function') toggleScheduleItem(item.id);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8F8F7] border border-neutral-200/50 cursor-pointer active:scale-98 transition-transform"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-neutral-400 w-10 font-mono">{item.startTime}</span>
                            <span className={`text-xs font-semibold ${item.completed ? 'line-through text-neutral-400' : 'text-[#18181B]'}`}>
                              {item.title}
                            </span>
                          </div>
                          {item.completed ? (
                            <CheckCircle2 size={16} className="text-neutral-800" />
                          ) : (
                            <Circle size={16} className="text-neutral-300" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'schedule' && <ScheduleTimeline />}
          {activeTab === 'history' && <TransactionHistory />}
          {activeTab === 'report' && <ReportView />}
        </div>

        {/* ================= TOAST HOÀN TÁC 1-TAP NỔI ================= */}
        {undoToast && (
          <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-40 bg-[#18181B] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-sheet-spring">
            <span className="text-xs font-bold text-neutral-200">
              ✓ {undoToast.text}
            </span>
            <button
              type="button"
              onClick={handleUndoSpend}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black rounded-xl flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw size={12} /> Hoàn tác
            </button>
          </div>
        )}

        {/* ================= MODAL CÀI ĐẶT & HỒ SƠ ================= */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
            <div className="w-full max-w-sm bg-[#F8F8F7] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-sheet-spring space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                    Cài đặt & Dữ liệu
                  </span>
                  <h3 className="text-lg font-black text-[#18181B]">Hồ Sơ Nếp Hub</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
                  😎
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#18181B]">Tâm (Admin)</h4>
                  <p className="text-[11px] text-neutral-400 font-semibold">Tài khoản cá nhân · Nếp Hub</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-2 border border-neutral-200/80 shadow-sm divide-y divide-neutral-100">
                <div 
                  onClick={handleToggleNotification}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      {notiEnabled ? <BellRing size={16} /> : <Bell size={16} />}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-[#18181B]">Thông báo đẩy</h5>
                      <p className="text-[10px] text-neutral-400">Nhắc hạn mức và động viên</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${notiEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                    {notiEnabled ? 'BẬT' : 'TẮT'}
                  </span>
                </div>

                <div 
                  onClick={handleExportBackup}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Download size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-[#18181B]">Tải bản sao lưu (JSON)</h5>
                      <p className="text-[10px] text-neutral-400">Xuất toàn bộ sổ chi tiêu ra file</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-neutral-400" />
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Upload size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-[#18181B]">Khôi phục dữ liệu</h5>
                      <p className="text-[10px] text-neutral-400">Nhập lại dữ liệu từ file JSON</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-neutral-400" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] font-bold text-neutral-400">
                  Nếp · Life Hub v3.3 · Giao diện chuyển động mượt
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Thanh Dock Điều Hướng Dưới Cùng */}
        <div className="fixed bottom-5 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30">
          <FloatingDock />
        </div>

        {/* CÁC MODAL HỆ THỐNG */}
        <QrScannerModal />
        <KeypadModal />
        <AddScheduleModal />
        <CsgoFoodRoulette />
        <TarotCardFlip />
      </main>
    </div>
  );
}