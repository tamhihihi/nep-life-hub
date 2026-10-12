import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabType, Transaction, ScheduleItem } from '../types';

interface AppState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isKeypadOpen: boolean;
  setIsKeypadOpen: (open: boolean) => void;
  isQrOpen: boolean;
  setIsQrOpen: (open: boolean) => void;
  isFoodOpen: boolean;
  setIsFoodOpen: (open: boolean) => void;
  isEveningOpen: boolean;
  setIsEveningOpen: (open: boolean) => void;
  isAddScheduleOpen: boolean;
  setIsAddScheduleOpen: (open: boolean) => void;

  monthlyLimit: number;
  setMonthlyLimit: (limit: number) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;
  scheduleItems: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id' | 'completed'>) => void;
  toggleScheduleItem: (id: string) => void;
  deleteScheduleItem: (id: string) => void;

  lastActiveTime: number;
  updateLastActive: () => void;
}

const getToday = () => new Date().toISOString().split('T')[0];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'home',
      setActiveTab: (activeTab) => set({ activeTab }),
      isKeypadOpen: false,
      setIsKeypadOpen: (isKeypadOpen) => set({ isKeypadOpen }),
      isQrOpen: false,
      setIsQrOpen: (isQrOpen) => set({ isQrOpen }),
      isFoodOpen: false,
      setIsFoodOpen: (isFoodOpen) => set({ isFoodOpen }),
      isEveningOpen: false,
      setIsEveningOpen: (isEveningOpen) => set({ isEveningOpen }),
      isAddScheduleOpen: false,
      setIsAddScheduleOpen: (isAddScheduleOpen) => set({ isAddScheduleOpen }),

      monthlyLimit: 25000000,
      setMonthlyLimit: (monthlyLimit) => set({ monthlyLimit }),
      transactions: [
        { id: '1', amount: 35000, type: 'expense', category: 'Cà phê sáng', bankName: 'MB Bank', note: 'Capuccino', dateStr: getToday(), createdAt: new Date().toISOString() },
        { id: '2', amount: 55000, type: 'expense', category: 'Cơm trưa văn phòng', bankName: 'BIDV', note: 'Cơm sườn', dateStr: getToday(), createdAt: new Date().toISOString() },
        { id: '3', amount: 45000, type: 'expense', category: 'Grab di chuyển', bankName: 'MB Bank', note: 'Gặp đối tác', dateStr: getToday(), createdAt: new Date().toISOString() },
      ],
      addTransaction: (tx) =>
        set((state) => {
          const updatedTransactions = [
            { ...tx, id: `tx-${Date.now()}`, createdAt: new Date().toISOString() },
            ...state.transactions,
          ];
          const totalSpent = updatedTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          import('../utils/notificationService').then(({ notifier }) => {
            notifier.checkBudgetThreshold(totalSpent, state.monthlyLimit);
          });

          return {
            transactions: updatedTransactions,
            lastActiveTime: Date.now(),
          };
        }),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      selectedDate: getToday(),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      scheduleItems: [
        { id: 's1', title: 'Họp tiến độ dự án', dateStr: getToday(), startTime: '09:30', category: 'work', completed: true },
        { id: 's2', title: 'Ăn trưa: Lẩu riêu cua bắp bò', dateStr: getToday(), startTime: '12:15', category: 'food', completed: true, cost: 55000 },
        { id: 's3', title: 'Chạy bộ hồ & hít thở', dateStr: getToday(), startTime: '18:30', category: 'sport', completed: false },
        { id: 's4', title: 'Cà phê ngắm phố & đọc sách', dateStr: getToday(), startTime: '20:00', category: 'evening', completed: false, cost: 45000 },
      ],
      addScheduleItem: (item) =>
        set((state) => ({
          scheduleItems: [...state.scheduleItems, { ...item, id: `s-${Date.now()}`, completed: false }],
        })),
      toggleScheduleItem: (id) =>
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          ),
        })),
      deleteScheduleItem: (id) =>
        set((state) => ({
          scheduleItems: state.scheduleItems.filter((item) => item.id !== id),
        })),

      lastActiveTime: Date.now(),
      updateLastActive: () => set({ lastActiveTime: Date.now() }),
    }),
    { name: 'nep_lifehub_v3' }
  )
);
