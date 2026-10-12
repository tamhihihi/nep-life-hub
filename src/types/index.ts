export type TabType = 'home' | 'schedule' | 'history' | 'report';

export interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  bankName: string;
  note: string;
  dateStr: string;
  createdAt: string;
}

export type DwarfRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'ancient';

export interface DwarfFoodItem {
  id: string;
  name: string;
  category: 'dinner' | 'drink' | 'snack' | 'drinking';
  categoryLabel: string;
  subCategory: string;
  price: number;
  rarity: DwarfRarity;
  rarityLabel: string;
  image: string;
  portionDesc: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  dateStr: string;
  startTime: string;
  endTime?: string;
  category: 'work' | 'food' | 'evening' | 'sport';
  completed: boolean;
  cost?: number;
}

export interface TarotCard {
  id: string;
  numeral: string;
  arcana: string;
  title: string;
  subtitle: string;
  quote: string;
  energy: 'low' | 'mid' | 'high';
  cost: number;
  symbol: string;
}

export interface ComfortMessage {
  id: string;
  tag: string;
  title: string;
  content: string;
  icon: string;
}
