import React, { useRef, useState, useEffect, Suspense, lazy } from 'react';
import { 
  Moon, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Bell, 
  BellRing, 
  Bus, 
  Download, 
  Upload, 
  Sparkles, 
  X, 
  QrCode, 
  Calculator, 
  ChevronRight, 
  RotateCcw, 
  LogOut, 
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { useAppStore } from './stores/useAppStore';
import { ExpenseSummaryCard } from './components/expense/ExpenseSummaryCard';
import { FloatingDock } from './components/common/FloatingDock';
import { EveningWhisperCard } from './components/evening/EveningWhisperCard';
import { NepMoments } from './components/expense/social/NepMoments';
import { LoginView, GoogleUser } from './components/auth/LoginView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { userDataSync } from './services/userDataSync';
import { notifier } from './utils/notificationService';
import { sounds } from './utils/soundEngine';

// IMPORT TRỰC TIẾP 6 ICON TỪ SRC/ASSETS/ICONS/
import walletIcon from './assets/icons/wallet.png';
import cameraIcon from './assets/icons/camera.png';
import foodIcon from './assets/icons/food.png';
import friendsIcon from './assets/icons/friends.png';
import socialIcon from './assets/icons/social.png';
import spendingIcon from './assets/icons/spending.png';

const QrScannerModal = lazy(() =>
  import('./components/expense/QrScannerModal').then((m) => ({ default: (m as any).QrScannerModal || (m as any).default }))
);
const KeypadModal = lazy(() =>
  import('./components/expense/KeypadModal').then((m) => ({ default: (m as any).KeypadModal || (m as any).default }))
);
const TransactionHistory = lazy(() =>
  import('./components/expense/TransactionHistory').then((m) => ({ default: (m as any).TransactionHistory || (m as any).default }))
);
const ReportView = lazy(() =>
  import('./components/expense/ReportView').then((m) => ({ default: (m as any).ReportView || (m as any).default }))
);
const ScheduleTimeline = lazy(() =>
  import('./components/schedule/ScheduleTimeline').then((m) => ({ default: (m as any).ScheduleTimeline || (m as any).default }))
);
const AddScheduleModal = lazy(() =>
  import('./components/schedule/AddScheduleModal').then((m) => ({ default: (m as any).AddScheduleModal || (m as any).default }))
);
const CsgoFoodRoulette = lazy(() =>
  import('./components/food/CsgoFoodRoulette').then((m) => ({ default: (m as any).CsgoFoodRoulette || (m as any).default }))
);
const TarotCardFlip = lazy(() =>
  import('./components/evening/TarotCardFlip').then((m) => ({ default: (m as any).TarotCardFlip || (m as any).default }))
);

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

  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem('nep_user_session_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('nep_user_session_v1');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.id) return !localStorage.getItem(`nep_onboarded_${u.id}`);
      }
      return false;
    } catch {
      return false;
    }
  });

  const [hubSection, setHubSection] = useState<'wallet' | 'lokcam' | 'chill'>('wallet');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [undoToast, setUndoToast] = useState<{ id: string; text: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [notiEnabled, setNotiEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLokCamActive = activeTab === 'home' && hubSection === 'lokcam';

  const now = new Date();
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const currentWeekday = weekdays[now.getDay()];
  const currentDateLabel = `${now.getDate()} thg ${now.getMonth() + 1}`;
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

  const handleLoginSuccess = async (user: GoogleUser) => {
    setCurrentUser(user);
    localStorage.setItem('nep_user_session_v1', JSON.stringify(user));

    const onboardKey = `nep_onboarded_${user.id}`;
    const isAlreadyOnboarded = localStorage.getItem(onboardKey);

    if (!isAlreadyOnboarded) {
      useAppStore.setState({ transactions: [] });
      if (typeof (store as any).setTransactions === 'function') {
        (store as any).setTransactions([]);
      }
      setShowOnboarding(true);
    } else {
      try {
        const savedData = await userDataSync.loadUserData(user.id);
        if (savedData) {
          useAppStore.setState({
            monthlyLimit: savedData.monthlyLimit,
            transactions: savedData.transactions || [],
            scheduleItems: savedData.scheduleItems || [],
          });
        }
      } catch {}
    }
  };

  const handleCompleteOnboarding = (initialLimit: number) => {
    if (!currentUser) return;

    useAppStore.setState({
      monthlyLimit: initialLimit,
      transactions: [],
    });

    if (typeof store.setMonthlyLimit === 'function') {
      store.setMonthlyLimit(initialLimit);
    }
    if (typeof (store as any).setTransactions === 'function') {
      (store as any).setTransactions([]);
    }

    localStorage.setItem(`nep_onboarded_${currentUser.id}`, 'true');

    try {
      userDataSync.syncUserData(currentUser.id, {
        transactions: [],
        scheduleItems: [],
        monthlyLimit: initialLimit,
      });
    } catch {}

    setShowOnboarding(false);
  };

  const handleLogout = () => {
    triggerHaptic('light');
    try { sounds?.playKeypadTap?.(); } catch {}
    if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản Google?')) {
      setCurrentUser(null);
      localStorage.removeItem('nep_user_session_v1');
      setIsSettingsOpen(false);
    }
  };

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

  const handleQuickSpend = (amount: number, category: string, note: string) => {
    triggerHaptic('medium');
    try { sounds?.playKeypadTap?.(); } catch {}

    const newId = `tx_${Date.now()}`;
    const newTx = {
      id: newId,
      amount,
      type: 'expense' as const,
      category,
      bankName: 'Tiền mặt',
      note,
      dateStr: todayStr,
    };

    if (typeof (store as any).addTransaction === 'function') {
      (store as any).addTransaction(newTx);
    } else {
      useAppStore.setState((prev: any) => ({
        transactions: [newTx, ...(prev.transactions || [])],
      }));
    }

    if (currentUser) {
      const currentList = [newTx, ...transactions];
      try {
        userDataSync.syncUserData(currentUser.id, {
          transactions: currentList,
          scheduleItems,
          monthlyLimit,
        });
      } catch {}
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setUndoToast({ id: newId, text: `Đã ghi ${category}: -${(amount / 1000).toFixed(0)}k` });

    toastTimeoutRef.current = window.setTimeout(() => {
      setUndoToast(null);
    }, 3500);
  };

  const handleUndoSpend = () => {
    if (!undoToast) return;
    triggerHaptic('light');
    sounds.playKeypadTap();

    if (typeof (store as any).deleteTransaction === 'function') {
      (store as any).deleteTransaction(undoToast.id);
    } else {
      useAppStore.setState((prev: any) => ({
        transactions: (prev.transactions || []).filter((t: any) => t.id !== undoToast.id),
      }));
    }

    if (currentUser) {
      const remainingTx = transactions.filter((t) => t.id !== undoToast.id);
      try {
        userDataSync.syncUserData(currentUser.id, {
          transactions: remainingTx,
          scheduleItems,
          monthlyLimit,
        });
      } catch {}
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

  const handleGoToReport = () => {
    triggerHaptic('light');
    sounds.playKeypadTap();
    if (typeof (store as any).setActiveTab === 'function') {
      (store as any).setActiveTab('report');
    } else {
      useAppStore.setState({ activeTab: 'report' });
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Ăn') || cat.includes('Cơm')) {
      return <img src={foodIcon} alt="Cơm" className="w-5 h-5 object-contain" />;
    }
    if (cat.includes('Mua') || cat.includes('Sắm')) {
      return <img src={spendingIcon} alt="Mua sắm" className="w-5 h-5 object-contain" />;
    }
    if (cat.includes('Cà phê')) {
      return <img src={socialIcon} alt="Cà phê" className="w-5 h-5 object-contain" />;
    }
    if (cat.includes('Grab') || cat.includes('Xăng')) return <Bus size={15} />;
    return <img src={spendingIcon} alt="Chi tiêu" className="w-5 h-5 object-contain" />;
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-[#F8F8F7] text-[#18181B] font-sans flex flex-col justify-between selection:bg-neutral-200 ${isLokCamActive ? 'h-[100dvh] overflow-hidden' : ''}`}>
      <main className={`w-full max-w-md mx-auto flex flex-col px-4 pt-4 ${
        isLokCamActive
          ? 'h-[100dvh] overflow-hidden pb-3'
          : 'min-h-screen pb-36'
      }`}>
        
        {/* ================= HEADER ĐƠN GIẢN, DỄ NHÌN ================= */}
        <header className="flex justify-between items-center mb-3 px-1 shrink-0">
          <div>
            <span className="text-[11px] font-bold text-neutral-400">
              {currentWeekday}, {currentDateLabel}
            </span>
            <h1 className="text-xl font-black text-[#18181B] flex items-center gap-1.5">
              Nếp · Sổ Chi Tiêu <Sparkles size={15} className="text-amber-500 fill-amber-400" />
            </h1>
          </div>
          
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              sounds.playKeypadTap();
              setIsSettingsOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center active:scale-90 transition-transform cursor-pointer overflow-hidden p-0.5"
            title="Cài đặt & Hồ sơ"
          >
            {currentUser.picture ? (
              <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <img src={friendsIcon} alt="Hồ sơ" className="w-full h-full object-contain p-1" />
            )}
          </button>
        </header>

        {/* ================= NỘI DUNG CHÍNH ================= */}
        <div className={`flex-1 flex flex-col min-h-0 ${isLokCamActive ? 'overflow-hidden' : 'space-y-4'}`}>
          {activeTab === 'home' && (
            <>
              {/* THANH 3 KHÔNG GIAN CÓ CHỮ RÕ RÀNG */}
              <div className="bg-neutral-200/80 p-1 rounded-2xl grid grid-cols-3 gap-1 shrink-0 mb-3 border border-neutral-300/40">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    sounds.playKeypadTap();
                    setHubSection('wallet');
                  }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    hubSection === 'wallet'
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-neutral-500 hover:text-black opacity-80'
                  }`}
                >
                  <img src={walletIcon} alt="Ví Tiền" className="w-4 h-4 object-contain" />
                  <span>Ví Tiền</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    sounds.playKeypadTap();
                    setHubSection('lokcam');
                  }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    hubSection === 'lokcam'
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-neutral-500 hover:text-black opacity-80'
                  }`}
                >
                  <img src={cameraIcon} alt="Ảnh Bạn Thân" className="w-4 h-4 object-contain" />
                  <span>Ảnh Bạn Bè</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    sounds.playKeypadTap();
                    setHubSection('chill');
                  }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    hubSection === 'chill'
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-neutral-500 hover:text-black opacity-80'
                  }`}
                >
                  <img src={socialIcon} alt="Tiện ích" className="w-4 h-4 object-contain" />
                  <span>Tiện Ích</span>
                </button>
              </div>

              {/* ----- KHÔNG GIAN 1: VÍ TIỀN DỄ TIẾP CẬN NHẤT ----- */}
              {hubSection === 'wallet' && (
                <div className="space-y-4 animate-tab-switch">
                  {/* THẺ TỔNG KẾT TIỀN THÁNG */}
                  <ExpenseSummaryCard />

                  {/* 3 NÚT TIỆN ÍCH DỄ HIỂU NHẤT CHO NGƯỜI DÙNG */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. Quét QR thanh toán */}
                    <button
                      type="button"
                      onClick={handleOpenScanner}
                      className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <QrCode size={18} />
                      </div>
                      <span className="text-[11px] font-black text-neutral-800">Quét VietQR</span>
                    </button>

                    {/* 2. Chia tiền nhóm */}
                    <button
                      type="button"
                      onClick={handleOpenKeypad}
                      className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center p-1.5">
                        <img src={friendsIcon} alt="Chia bill" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[11px] font-black text-neutral-800">Chia Tiền</span>
                    </button>

                    {/* 3. Xem báo cáo chi tiêu */}
                    <button
                      type="button"
                      onClick={handleGoToReport}
                      className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Calculator size={18} />
                      </div>
                      <span className="text-[11px] font-black text-neutral-800">Báo Cáo</span>
                    </button>
                  </div>

                  {/* DẢI GHI NHANH 1 CHẠM: ĐỔI TÊN MÓN ĂN UỐNG QUEN THUỘC */}
                  <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        Chi Nhanh 1 Chạm (Bấm là xong)
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400">
                        Bấm nhầm có hoàn tác
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Cà phê', cost: 30000, img: socialIcon },
                        { name: 'Cơm trưa', cost: 40000, img: foodIcon },
                        { name: 'Đổ xăng', cost: 50000, img: spendingIcon },
                        { name: 'Ăn vặt', cost: 25000, img: walletIcon },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleQuickSpend(item.cost, item.name, item.name)}
                          className="py-3 px-1 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex flex-col items-center gap-1 active:scale-90 active:bg-amber-100 transition-all cursor-pointer"
                        >
                          <img src={item.img} alt={item.name} className="w-7 h-7 object-contain drop-shadow-xs" />
                          <span className="text-[11px] font-black text-[#18181B]">{item.name}</span>
                          <span className="text-[10px] text-neutral-500 font-bold font-mono">
                            {(item.cost / 1000).toFixed(0)}k
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CÁC KHOẢN TIÊU GẦN ĐÂY */}
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-200/90 divide-y divide-neutral-100">
                    <div className="flex justify-between items-center pb-2 px-1">
                      <span className="text-xs font-black text-neutral-800">Vừa chi tiêu gần đây</span>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">
                        {transactions.length} khoản
                      </span>
                    </div>

                    {transactions.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">Chưa có khoản chi nào trong tháng</p>
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

              {/* ----- KHÔNG GIAN 2: LOKCAM ----- */}
              {hubSection === 'lokcam' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-switch">
                  <NepMoments />
                </div>
              )}

              {/* ----- KHÔNG GIAN 3: NẾP CHILL ----- */}
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
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center p-1.5">
                        <img src={foodIcon} alt="Trưa nay ăn gì" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase font-bold">Quay Món Ăn</span>
                        <span className="text-xs font-black text-white">Hôm nay ăn gì?</span>
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
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center p-1">
                        <Moon size={18} className="text-indigo-500" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase font-bold">Thư Giãn Đêm</span>
                        <span className="text-xs font-black text-[#18181B]">Bốc quẻ bài</span>
                      </div>
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-200/80 space-y-2.5">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-xs font-black text-[#18181B] flex items-center gap-1.5">
                        <Calendar size={13} className="text-neutral-400" /> Lịch trình việc cần làm
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
                        <Plus size={12} /> Thêm việc
                      </button>
                    </div>

                    {todaySchedules.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">Chưa có việc nào cần làm hôm nay</p>
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

          {activeTab === 'schedule' && (
            <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Đang tải Lịch trình...</div>}>
              <ScheduleTimeline />
            </Suspense>
          )}
          {activeTab === 'history' && (
            <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Đang tải Lịch sử...</div>}>
              <TransactionHistory />
            </Suspense>
          )}
          {activeTab === 'report' && (
            <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Đang tải Báo cáo...</div>}>
              <ReportView />
            </Suspense>
          )}
        </div>

        {/* ================= TOAST THÔNG BÁO HOÀN TÁC ================= */}
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

        {/* ================= CÀI ĐẶT ================= */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-tab-switch">
            <div className="w-full max-w-sm bg-[#F8F8F7] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 animate-sheet-spring space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                    Cài đặt tài khoản
                  </span>
                  <h3 className="text-lg font-black text-[#18181B]">Hồ Sơ Của Bạn</h3>
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
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                  {currentUser.picture ? (
                    <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src={friendsIcon} alt="Avatar" className="w-full h-full object-contain p-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-[#18181B] truncate">{currentUser.name}</h4>
                  <p className="text-[11px] text-neutral-400 font-semibold truncate">{currentUser.email}</p>
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
                      <h5 className="text-xs font-black text-[#18181B]">Thông báo nhắc nhở</h5>
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
                      <h5 className="text-xs font-black text-[#18181B]">Tải bản sao lưu sổ</h5>
                      <p className="text-[10px] text-neutral-400">Lưu lại toàn bộ lịch sử chi tiêu</p>
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
                      <p className="text-[10px] text-neutral-400">Nhập lại sổ chi tiêu từ file</p>
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

                <div 
                  onClick={handleLogout}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-rose-50 rounded-2xl transition-colors text-rose-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <LogOut size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black">Đăng xuất</h5>
                      <p className="text-[10px] text-rose-400">Thoát tài khoản Google</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-rose-300" />
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] font-bold text-neutral-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  Bảo mật tài khoản Google
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= THANH DOCK ĐÁY: TỰ ĐỘNG ẨN KHI Ở LOKCAM ================= */}
        {!isLokCamActive && (
          <div className="fixed bottom-5 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30 transition-all duration-300">
            <FloatingDock />
          </div>
        )}

        {showOnboarding && currentUser && (
          <OnboardingModal
            userName={currentUser.name}
            onComplete={handleCompleteOnboarding}
          />
        )}

        <Suspense fallback={null}>
          <QrScannerModal />
          <KeypadModal />
          <AddScheduleModal />
          <CsgoFoodRoulette />
          <TarotCardFlip />
        </Suspense>
      </main>
    </div>
  );
}