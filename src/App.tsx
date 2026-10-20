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
  Edit2,
  WalletCards,
  Lock
} from 'lucide-react';
import { useAppStore } from './stores/useAppStore';
import { ExpenseSummaryCard } from './components/expense/ExpenseSummaryCard';
import { FloatingDock } from './components/common/FloatingDock';
import { EveningWhisperCard } from './components/evening/EveningWhisperCard';
import { NepMoments } from './components/expense/social/NepMoments';
import { LoginView, GoogleUser } from './components/auth/LoginView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { SplashScreen } from './components/common/SplashScreen';
import { SecurityLock } from './components/security/SecurityLock';
import { SmartFinanceHubModal } from './components/expense/SmartFinanceHubModal';
import { SplitBillModal } from './components/expense/SplitBillModal';
import { userDataSync } from './services/userDataSync';
import { notifier } from './utils/notificationService';
import { sounds } from './utils/soundEngine';

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

interface PresetItem {
  id: string;
  name: string;
  cost: number;
  img: string;
}

const DEFAULT_EXPENSE_PRESETS: PresetItem[] = [
  { id: 'p1', name: 'Cà phê', cost: 30000, img: socialIcon },
  { id: 'p2', name: 'Cơm trưa', cost: 40000, img: foodIcon },
  { id: 'p3', name: 'Đổ xăng', cost: 50000, img: spendingIcon },
  { id: 'p4', name: 'Ăn vặt', cost: 25000, img: walletIcon },
];

export default function App() {
  const store = useAppStore();
  const activeTab = (store as any)?.activeTab || 'home';
  const scheduleItems = (store as any)?.scheduleItems || [];
  const transactions = (store as any)?.transactions || [];
  const monthlyLimit = Number((store as any)?.monthlyLimit) || 5000000;
  const lastActiveTime = (store as any)?.lastActiveTime;
  const updateLastActive = (store as any)?.updateLastActive;
  const setIsFoodOpen = (store as any)?.setIsFoodOpen;
  const setIsEveningOpen = (store as any)?.setIsEveningOpen;
  const toggleScheduleItem = (store as any)?.toggleScheduleItem;
  const setIsAddScheduleOpen = (store as any)?.setIsAddScheduleOpen;

  // 1. ĐIỀU PHỐI 3 GIAI ĐOẠN KHỞI ĐỘNG: SPLASH -> AUTH -> MAIN
  const [appPhase, setAppPhase] = useState<'splash' | 'auth' | 'main'>('splash');

  const [isSmartHubOpen, setIsSmartHubOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);

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
  const [spendMode, setSpendMode] = useState<'expense' | 'income'>('expense');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [undoToast, setUndoToast] = useState<{ id: string; text: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [salaryDay, setSalaryDay] = useState<number>(() => {
    return Number(localStorage.getItem('nep_salary_start_day')) || 1;
  });

  const [expensePresets, setExpensePresets] = useState<PresetItem[]>(() => {
    try {
      const saved = localStorage.getItem('nep_expense_presets');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_PRESETS;
    } catch {
      return DEFAULT_EXPENSE_PRESETS;
    }
  });

  const [editingPreset, setEditingPreset] = useState<PresetItem | null>(null);

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
  const todaySchedules = scheduleItems.filter((i: any) => i?.dateStr === todayStr);

  useEffect(() => {
    if (typeof updateLastActive === 'function') {
      notifier.checkInactivity(lastActiveTime);
      updateLastActive();
    }

    notifier.checkScheduleNotifications(scheduleItems);
    const interval = setInterval(() => {
      notifier.checkDailyRoutine();
      notifier.checkEveningComfortRoutine();
      notifier.checkScheduleNotifications(scheduleItems);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [scheduleItems]);

  const handleLoginSuccess = async (user: GoogleUser) => {
    setCurrentUser(user);
    localStorage.setItem('nep_user_session_v1', JSON.stringify(user));
    const onboardKey = `nep_onboarded_${user.id}`;
    if (!localStorage.getItem(onboardKey)) {
      useAppStore.setState({ transactions: [] });
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
    useAppStore.setState({ monthlyLimit: initialLimit, transactions: [] });
    localStorage.setItem(`nep_onboarded_${currentUser.id}`, 'true');
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản Google?')) {
      setCurrentUser(null);
      localStorage.removeItem('nep_user_session_v1');
      setIsSettingsOpen(false);
    }
  };

  const handleToggleNotification = async () => {
    const granted = await notifier.requestPermission();
    setNotiEnabled(granted);
    if (granted) {
      notifier.send('✨ Đã bật thông báo Nếp', 'Nếp sẽ nhắc nhở hạn mức và lịch trình.', '✨');
    }
  };

  const handleExportBackup = () => {
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
        window.location.reload();
      } catch {
        alert('Tệp sao lưu không đúng định dạng!');
      }
    };
    reader.readAsText(file);
  };

  const handleQuickSpend = (amount: number, category: string, note: string, type: 'expense' | 'income' = 'expense') => {
    triggerHaptic('medium');
    sounds.playKeypadTap();

    const newId = `tx_${Date.now()}`;
    const newTx = {
      id: newId,
      amount,
      type,
      category,
      bankName: 'Tiền mặt',
      note,
      dateStr: todayStr,
      timestamp: Date.now(),
    };

    const nextList = [newTx, ...(transactions || [])];
    useAppStore.setState({ transactions: nextList });

    if (currentUser) {
      userDataSync.syncUserData(currentUser.id, {
        transactions: nextList,
        scheduleItems,
        monthlyLimit,
      });
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const sign = type === 'income' ? '+' : '-';
    setUndoToast({
      id: newId,
      text: `Đã ${type === 'income' ? 'nạp' : 'ghi'} ${category}: ${sign}${(amount / 1000).toFixed(0)}k`,
    });

    toastTimeoutRef.current = window.setTimeout(() => setUndoToast(null), 3500);
  };

  const handleUndoSpend = () => {
    if (!undoToast) return;
    const remainingTx = (transactions || []).filter((t: any) => t?.id !== undoToast.id);
    useAppStore.setState({ transactions: remainingTx });
    setUndoToast(null);
  };

  const handleSaveEditedPreset = (updated: PresetItem) => {
    const next = expensePresets.map((p) => (p.id === updated.id ? updated : p));
    setExpensePresets(next);
    localStorage.setItem('nep_expense_presets', JSON.stringify(next));
    setEditingPreset(null);
  };

  const getCategoryIcon = (cat: string) => {
    if (!cat) return <img src={walletIcon} alt="Tiền" className="w-5 h-5 object-contain" />;
    if (cat.includes('Ăn') || cat.includes('Cơm')) return <img src={foodIcon} alt="Cơm" className="w-5 h-5 object-contain" />;
    if (cat.includes('Mua') || cat.includes('Sắm') || cat.includes('Lương')) return <img src={spendingIcon} alt="Mua sắm" className="w-5 h-5 object-contain" />;
    if (cat.includes('Cà phê')) return <img src={socialIcon} alt="Cà phê" className="w-5 h-5 object-contain" />;
    if (cat.includes('Grab') || cat.includes('Xăng')) return <Bus size={15} />;
    return <img src={walletIcon} alt="Tiền" className="w-5 h-5 object-contain" />;
  };

  // GIAI ĐOẠN 1: MÀN HÌNH CHÀO LOGO (SPLASH SCREEN)
  if (appPhase === 'splash') {
    return <SplashScreen onFinish={() => setAppPhase('auth')} />;
  }

  // GIAI ĐOẠN 2: MÀN HÌNH ĐĂNG NHẬP FACE ID / VÂN TAY / MÃ PIN
  if (appPhase === 'auth') {
    return <SecurityLock onUnlockSuccess={() => setAppPhase('main')} />;
  }

  // GIAI ĐOẠN 3: ĐĂNG NHẬP GOOGLE HOẶC GIAO DIỆN CHÍNH
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-[#F8F8F7] text-[#18181B] font-sans flex flex-col justify-between selection:bg-neutral-200 ${isLokCamActive ? 'h-[100dvh] overflow-hidden' : ''}`}>
      <main className={`w-full max-w-md mx-auto flex flex-col px-4 pt-4 ${
        isLokCamActive ? 'h-[100dvh] overflow-hidden pb-3' : 'min-h-screen pb-36'
      }`}>
        
        {/* HEADER */}
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
            className="w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center active:scale-90 transition cursor-pointer overflow-hidden p-0.5"
            title="Cài đặt & Hồ sơ"
          >
            {currentUser.picture ? (
              <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <img src={friendsIcon} alt="Hồ sơ" className="w-full h-full object-contain p-1" />
            )}
          </button>
        </header>

        {/* NỘI DUNG CHÍNH */}
        <div className={`flex-1 flex flex-col min-h-0 ${isLokCamActive ? 'overflow-hidden' : 'space-y-4'}`}>
          {activeTab === 'home' && (
            <>
              {/* THANH 3 KHÔNG GIAN */}
              <div className="bg-neutral-200/80 p-1 rounded-2xl grid grid-cols-3 gap-1 shrink-0 mb-3 border border-neutral-300/40">
                <button
                  type="button"
                  onClick={() => setHubSection('wallet')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    hubSection === 'wallet' ? 'bg-white text-[#18181B] shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  <img src={walletIcon} alt="Ví Tiền" className="w-4 h-4 object-contain" />
                  <span>Ví Tiền</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHubSection('lokcam')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    hubSection === 'lokcam' ? 'bg-white text-[#18181B] shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  <img src={cameraIcon} alt="LokCam" className="w-4 h-4 object-contain" />
                  <span>Ảnh Bạn Bè</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHubSection('chill')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    hubSection === 'chill' ? 'bg-white text-[#18181B] shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  <img src={socialIcon} alt="Tiện ích" className="w-4 h-4 object-contain" />
                  <span>Tiện Ích</span>
                </button>
              </div>

              {/* VÍ TIỀN */}
              {hubSection === 'wallet' && (
                <div className="space-y-4 animate-tab-switch">
                  <ExpenseSummaryCard />

                  {/* 4 NÚT TIỆN ÍCH */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => store.setIsQrOpen?.(true)}
                      className="p-2.5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <QrCode size={16} />
                      </div>
                      <span className="text-[10px] font-black text-neutral-800">Quét QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSplitBillOpen(true)}
                      className="p-2.5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center p-1">
                        <img src={friendsIcon} alt="Chia bill" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-black text-neutral-800">Chia Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSmartHubOpen(true)}
                      className="p-2.5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <WalletCards size={16} />
                      </div>
                      <span className="text-[10px] font-black text-neutral-800">Ví Smart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => useAppStore.setState({ activeTab: 'report' })}
                      className="p-2.5 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Calculator size={16} />
                      </div>
                      <span className="text-[10px] font-black text-neutral-800">Báo Cáo</span>
                    </button>
                  </div>

                  {/* DẢI 1-TAP */}
                  <div className="bg-white rounded-3xl p-4 border border-neutral-200/90 shadow-sm space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <div className="inline-flex bg-neutral-100 p-1 rounded-xl gap-1">
                        <button
                          type="button"
                          onClick={() => setSpendMode('expense')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                            spendMode === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-neutral-500'
                          }`}
                        >
                          - Chi Tiền
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpendMode('income')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                            spendMode === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-500'
                          }`}
                        >
                          + Nạp Tiền
                        </button>
                      </div>

                      <span className="text-[10px] font-bold text-neutral-400">
                        {spendMode === 'expense' ? 'Nhấn giữ nút để sửa' : 'Cộng ví tức thì'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {spendMode === 'expense' ? (
                        expensePresets.map((item) => (
                          <div key={item.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => handleQuickSpend(item.cost, item.name, item.name, 'expense')}
                              className="w-full py-3 px-1 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                            >
                              <img src={item.img} alt={item.name} className="w-7 h-7 object-contain" />
                              <span className="text-[11px] font-black text-[#18181B] truncate w-full text-center">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-rose-500 font-bold font-mono">
                                -{(item.cost / 1000).toFixed(0)}k
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPreset(item);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-neutral-300 shadow-sm flex items-center justify-center text-neutral-500 hover:text-black"
                              title="Sửa nút"
                            >
                              <Edit2 size={9} />
                            </button>
                          </div>
                        ))
                      ) : (
                        [
                          { name: 'Nạp ví', cost: 100000, img: walletIcon },
                          { name: 'Lương về', cost: 2000000, img: spendingIcon },
                          { name: 'Bạn trả', cost: 50000, img: friendsIcon },
                          { name: 'Khác', cost: 200000, img: socialIcon },
                        ].map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleQuickSpend(item.cost, item.name, item.name, 'income')}
                            className="py-3 px-1 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-200/60 flex flex-col items-center gap-1 active:scale-90 transition cursor-pointer"
                          >
                            <img src={item.img} alt={item.name} className="w-7 h-7 object-contain" />
                            <span className="text-[11px] font-black text-emerald-900">{item.name}</span>
                            <span className="text-[10px] text-emerald-600 font-bold font-mono">
                              +{(item.cost / 1000).toFixed(0)}k
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* LỊCH SỬ GIAO DỊCH */}
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-200/90 divide-y divide-neutral-100">
                    <div className="flex justify-between items-center pb-2 px-1">
                      <span className="text-xs font-black text-neutral-800">Giao dịch mới nhất</span>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">
                        {transactions.length} khoản
                      </span>
                    </div>

                    {transactions.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">Chưa có giao dịch nào</p>
                    ) : (
                      transactions.slice(0, 3).map((tx: any) => (
                        <div key={tx?.id || Math.random()} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                              {getCategoryIcon(tx?.category)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-[#18181B]">{tx?.category || 'Khoản chi'}</h4>
                              <p className="text-[10px] text-neutral-400 truncate max-w-[150px]">{tx?.note || tx?.bankName || 'Tiền mặt'}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-black font-mono ${tx?.type === 'income' ? 'text-emerald-600' : 'text-[#18181B]'}`}>
                            {tx?.type === 'income' ? '+' : '-'}{(Number(tx?.amount) || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* LOKCAM */}
              {hubSection === 'lokcam' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-switch">
                  <NepMoments />
                </div>
              )}

              {/* NẾP CHILL */}
              {hubSection === 'chill' && (
                <div className="space-y-4 animate-tab-switch">
                  <EveningWhisperCard />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFoodOpen?.(true)}
                      className="bg-[#18181B] text-white p-4 rounded-3xl flex flex-col justify-between text-left active:scale-95 transition h-28 shadow-sm cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center p-1.5">
                        <img src={foodIcon} alt="Quay ăn" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase font-bold">Quay Món Ăn</span>
                        <span className="text-xs font-black text-white">Hôm nay ăn gì?</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEveningOpen?.(true)}
                      className="bg-white border border-neutral-200/80 p-4 rounded-3xl flex flex-col justify-between text-left active:scale-95 transition h-28 shadow-sm cursor-pointer"
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
                        onClick={() => setIsAddScheduleOpen?.(true)}
                        className="text-[11px] font-bold text-neutral-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={12} /> Thêm việc
                      </button>
                    </div>

                    {todaySchedules.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">Chưa có việc nào hôm nay</p>
                    ) : (
                      todaySchedules.slice(0, 3).map((item: any) => (
                        <div
                          key={item?.id}
                          onClick={() => toggleScheduleItem?.(item.id)}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8F8F7] border border-neutral-200/50 cursor-pointer active:scale-98 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-neutral-400 w-10 font-mono">{item?.startTime}</span>
                            <span className={`text-xs font-semibold ${item?.completed ? 'line-through text-neutral-400' : 'text-[#18181B]'}`}>
                              {item?.title}
                            </span>
                          </div>
                          {item?.completed ? <CheckCircle2 size={16} className="text-neutral-800" /> : <Circle size={16} className="text-neutral-300" />}
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

        {/* TOAST HOÀN TÁC */}
        {undoToast && (
          <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-40 bg-[#18181B] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-sheet-spring">
            <span className="text-xs font-bold text-neutral-200">✓ {undoToast.text}</span>
            <button
              type="button"
              onClick={handleUndoSpend}
              className="px-2.5 py-1 bg-amber-400 text-black text-[11px] font-black rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Hoàn tác
            </button>
          </div>
        )}

        {/* MODAL SỬA NÚT 1-TAP */}
        {editingPreset && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-3">
              <h3 className="text-sm font-black text-[#18181B]">Tùy chỉnh nút 1-Tap</h3>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">Tên mục</label>
                <input
                  type="text"
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                  className="w-full bg-neutral-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">Số tiền mặc định (VNĐ)</label>
                <input
                  type="number"
                  value={editingPreset.cost}
                  onChange={(e) => setEditingPreset({ ...editingPreset, cost: Number(e.target.value) })}
                  className="w-full bg-neutral-100 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="flex-1 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditedPreset(editingPreset)}
                  className="flex-1 py-2 rounded-xl bg-[#18181B] text-white text-xs font-bold"
                >
                  Lưu nút
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CÀI ĐẶT */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#F8F8F7] rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl relative border border-neutral-200 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 block">Cài đặt tài khoản</span>
                  <h3 className="text-lg font-black text-[#18181B]">Hồ Sơ Của Bạn</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* KHÓA PIN & FACE ID */}
              <div className="bg-neutral-900 text-white rounded-3xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Lock size={13} /> Khóa bảo vệ mã PIN & Face ID
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = localStorage.getItem('nep_security_enabled') === 'true';
                      localStorage.setItem('nep_security_enabled', (!current).toString());
                      alert(!current ? 'Đã bật bảo vệ PIN & Face ID khi mở app!' : 'Đã tắt khóa bảo vệ.');
                    }}
                    className="px-2.5 py-1 bg-amber-400 text-black text-[10px] font-black rounded-lg cursor-pointer"
                  >
                    {localStorage.getItem('nep_security_enabled') === 'true' ? 'ĐANG BẬT' : 'BẬT NGAY'}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Tự động yêu cầu Face ID / Vân tay / PIN mỗi khi mở lại ứng dụng.
                </p>
              </div>

              {/* NGÀY NHẬN LƯƠNG */}
              <div className="bg-amber-500/10 border border-amber-300/60 rounded-3xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-amber-900">
                    📅 Ngày bắt đầu chu kỳ lương
                  </span>
                  <select
                    value={salaryDay}
                    onChange={(e) => {
                      const day = Number(e.target.value);
                      setSalaryDay(day);
                      localStorage.setItem('nep_salary_start_day', String(day));
                    }}
                    className="bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-black font-mono text-[#18181B] focus:outline-none"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Ngày {d} hàng tháng
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-amber-800 font-medium">
                  Ngân sách sẽ tự động tính toán lại từ ngày {salaryDay} tháng này đến ngày {salaryDay} tháng sau.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
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
                <div onClick={handleToggleNotification} className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      {notiEnabled ? <BellRing size={16} /> : <Bell size={16} />}
                    </div>
                    <div>
                      <h5 className="text-xs font-black">Thông báo nhắc nhở</h5>
                      <p className="text-[10px] text-neutral-400">Nhắc lịch trình & hạn mức</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${notiEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                    {notiEnabled ? 'BẬT' : 'TẮT'}
                  </span>
                </div>

                <div onClick={handleExportBackup} className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Download size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black">Tải bản sao lưu sổ</h5>
                      <p className="text-[10px] text-neutral-400">Xuất toàn bộ lịch sử ra file JSON</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-neutral-400" />
                </div>

                <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Upload size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black">Khôi phục dữ liệu</h5>
                      <p className="text-[10px] text-neutral-400">Nhập lại sổ chi tiêu từ file</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-neutral-400" />
                </div>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />

                <div onClick={handleLogout} className="flex items-center justify-between p-3 cursor-pointer hover:bg-rose-50 rounded-2xl text-rose-600">
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
                  <ShieldCheck size={12} className="text-emerald-600" /> Bảo mật tài khoản Google
                </span>
              </div>
            </div>
          </div>
        )}

        <SmartFinanceHubModal
          isOpen={isSmartHubOpen}
          onClose={() => setIsSmartHubOpen(false)}
        />

        <SplitBillModal
          isOpen={isSplitBillOpen}
          onClose={() => setIsSplitBillOpen(false)}
        />

        {!isLokCamActive && (
          <div className="fixed bottom-5 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30">
            <FloatingDock />
          </div>
        )}

        {showOnboarding && currentUser && (
          <OnboardingModal userName={currentUser.name} onComplete={handleCompleteOnboarding} />
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