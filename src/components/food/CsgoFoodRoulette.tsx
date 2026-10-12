import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Flame, 
  Clock, 
  Utensils, 
  MapPin, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { sounds } from '../../utils/soundEngine';
import { useAppStore } from '../../stores/useAppStore';

interface FoodCard {
  id: string;
  name: string;
  category: 'all' | 'com' | 'bun_pho' | 'fast' | 'healthy';
  categoryLabel: string;
  price: number;
  calories: number;
  prepTime: string;
  location: string;
  quote: string;
  accentColor: string;
  image: string;
}

const FOOD_DECK: FoodCard[] = [
  {
    id: 'f1',
    name: 'Cơm Tấm Sườn Bì Chả',
    category: 'com',
    categoryLabel: 'Cơm Chắc Bụng',
    price: 45000,
    calories: 680,
    prepTime: '5-10 phút',
    location: 'Quán cơm tấm gần cơ quan',
    quote: 'Sườn nướng than hoa thơm nức mũi, chả trứng bùi béo kèm mỡ hành tóp mỡ giòn rụm.',
    accentColor: 'from-amber-500/20 to-orange-500/10 border-amber-400',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f2',
    name: 'Phở Bò Tái Lăn Hà Nội',
    category: 'bun_pho',
    categoryLabel: 'Món Nước Thanh Ngọt',
    price: 50000,
    calories: 520,
    prepTime: '3-5 phút',
    location: 'Phở gia truyền đầu ngõ',
    quote: 'Bò xào lăn tỏi thơm lừng, nước dùng ngọt hầm xương nghi ngút khói làm ấm cả ngày dài.',
    accentColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-400',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f3',
    name: 'Bún Chả Nướng Than Hoa',
    category: 'bun_pho',
    categoryLabel: 'Bún Nước Mắm Kẹo',
    price: 50000,
    calories: 590,
    prepTime: '5-7 phút',
    location: 'Bún chả que tre phố cổ',
    quote: 'Chả miếng xém cạnh, chả băm đượm mùi khói than thả vào bát nước mắm chua ngọt ấm nồng.',
    accentColor: 'from-rose-500/20 to-amber-500/10 border-rose-400',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f4',
    name: 'Cơm Gà Xối Mỡ Da Giòn',
    category: 'com',
    categoryLabel: 'Cơm No Lâu',
    price: 55000,
    calories: 740,
    prepTime: '8-12 phút',
    location: 'Cơm gà góc phố',
    quote: 'Đùi gà xối mỡ da giòn rụm, hạt cơm đỏ óng ả ăn cùng dưa chua thanh họng chống ngấy.',
    accentColor: 'from-orange-500/20 to-amber-500/10 border-orange-400',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f5',
    name: 'Bánh Mì Thịt Nướng Pâté',
    category: 'fast',
    categoryLabel: 'Nhanh Gọn Tiết Kiệm',
    price: 25000,
    calories: 420,
    prepTime: '2-3 phút',
    location: 'Xe bánh mì giòn tan',
    quote: 'Vỏ giòn rôm rốp, bơ trứng béo ngậy kèm dưa chuột và sốt ớt cay kích thích vị giác.',
    accentColor: 'from-amber-500/20 to-yellow-500/10 border-amber-400',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f6',
    name: 'Bún Đậu Mẹt Thập Cẩm',
    category: 'bun_pho',
    categoryLabel: 'Món Giao Lưu Team',
    price: 45000,
    calories: 610,
    prepTime: '5-8 phút',
    location: 'Bún đậu gốc đa',
    quote: 'Đậu Mơ lướt ván giòn vỏ mềm ruột, chả cốm dẻo thơm chấm mắm tôm đánh sủi bọt quất ớt.',
    accentColor: 'from-purple-500/20 to-indigo-500/10 border-purple-400',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f7',
    name: 'Salad Ức Gà Sốt Mè Rang',
    category: 'healthy',
    categoryLabel: 'Healthy Giữ Dáng',
    price: 50000,
    calories: 340,
    prepTime: '5 phút',
    location: 'Eat Clean Green Hub',
    quote: 'Rau xanh giòn mọng, ức gà mềm ngọt áp chảo hạt tiêu, sốt mè rang bùi béo thanh sạch.',
    accentColor: 'from-emerald-500/20 to-green-500/10 border-emerald-400',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'com', label: '🍚 Cơm' },
  { id: 'bun_pho', label: '🍜 Bún / Phở' },
  { id: 'fast', label: '🥖 Ăn Nhanh' },
  { id: 'healthy', label: '🥗 Healthy' },
];

export const CsgoFoodRoulette: React.FC = () => {
  const { isFoodOpen, setIsFoodOpen, addTransaction, addScheduleItem } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  const timerRef = useRef<number | null>(null);

  const filteredPool = FOOD_DECK.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  useEffect(() => {
    if (isFoodOpen) {
      setCurrentIndex(Math.floor(Math.random() * filteredPool.length));
      setIsShuffling(false);
    }
  }, [isFoodOpen, activeCategory]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!isFoodOpen) return null;

  const handleShuffle = () => {
    if (isShuffling || filteredPool.length <= 1) return;

    setIsShuffling(true);

    let step = 0;
    const totalSteps = 22;

    const runStep = () => {
      sounds.playCsgoTick();
      setCurrentIndex((prev) => (prev + 1) % filteredPool.length);

      step++;
      if (step < totalSteps) {
        const delay = 40 + Math.pow(step / totalSteps, 2.6) * 350;
        timerRef.current = window.setTimeout(runStep, delay);
      } else {
        setIsShuffling(false);
        sounds.playChime();
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
        });
      }
    };

    runStep();
  };

  const handlePrev = () => {
    if (isShuffling) return;
    setCurrentIndex((prev) => (prev - 1 + filteredPool.length) % filteredPool.length);
    sounds.playCardSlide();
  };

  const handleNext = () => {
    if (isShuffling) return;
    setCurrentIndex((prev) => (prev + 1) % filteredPool.length);
    sounds.playCardSlide();
  };

  const currentDish = filteredPool[currentIndex] || filteredPool[0];
  const prevDish = filteredPool[(currentIndex - 1 + filteredPool.length) % filteredPool.length];
  const nextDish = filteredPool[(currentIndex + 1) % filteredPool.length];

  const handleConfirm = () => {
    addTransaction({
      amount: currentDish.price,
      type: 'expense',
      category: 'Ăn uống',
      bankName: 'Tiền mặt',
      note: `Trưa nay: ${currentDish.name}`,
      dateStr: new Date().toISOString().split('T')[0],
    });

    addScheduleItem({
      title: `Ăn trưa: ${currentDish.name}`,
      dateStr: new Date().toISOString().split('T')[0],
      startTime: '12:00',
      category: 'food',
      cost: currentDish.price,
    });

    setIsFoodOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade select-none">
      <div className="w-full max-w-md bg-[#F7F7F5] rounded-t-[38px] sm:rounded-[38px] p-6 shadow-2xl relative border border-neutral-200/80 animate-ios-sheet flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Thanh vuốt ngang trên Mobile */}
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-sm">
              <Utensils size={15} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                Nếp Flavors · 3D Deck
              </span>
              <h3 className="text-base font-black text-[#18181B] tracking-tight">
                Trưa Nay Ăn Gì Ta?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFoodOpen(false)}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Thanh chọn phân loại */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar bg-neutral-200/60 p-1 rounded-2xl mb-4">
          {CATEGORIES.map((tab) => (
            <button
              type="button"
              key={tab.id}
              disabled={isShuffling}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-white text-[#18181B] shadow-sm'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= SÂN KHẤU 3D COVER FLOW ================= */}
        <div className="relative w-full h-64 flex items-center justify-center overflow-hidden my-1 [perspective:1000px]">
          
          {/* Thẻ Trái */}
          <div 
            onClick={handlePrev}
            className="absolute left-1 w-44 h-56 rounded-3xl overflow-hidden shadow-md opacity-40 scale-[0.82] [transform:rotateY(25deg)] transition-all duration-300 pointer-events-auto cursor-pointer z-0 border border-neutral-300 bg-neutral-200"
          >
            <img src={prevDish.image} alt={prevDish.name} className="w-full h-full object-cover filter blur-[0.5px]" />
          </div>

          {/* Thẻ Phải */}
          <div 
            onClick={handleNext}
            className="absolute right-1 w-44 h-56 rounded-3xl overflow-hidden shadow-md opacity-40 scale-[0.82] [transform:rotateY(-25deg)] transition-all duration-300 pointer-events-auto cursor-pointer z-0 border border-neutral-300 bg-neutral-200"
          >
            <img src={nextDish.image} alt={nextDish.name} className="w-full h-full object-cover filter blur-[0.5px]" />
          </div>

          {/* Thẻ Chính Giữa */}
          <div 
            className={`w-60 h-64 rounded-[32px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.14)] z-20 transition-all duration-300 relative border-2 ${
              isShuffling 
                ? 'scale-[0.96] ring-4 ring-amber-400/40 border-amber-400' 
                : 'scale-100 border-white hover:scale-[1.02]'
            }`}
          >
            <img 
              src={currentDish.image} 
              alt={currentDish.name} 
              className={`w-full h-full object-cover transition-all duration-300 ${
                isShuffling ? 'filter blur-[1px]' : ''
              }`} 
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-between p-4 text-white">
              <span className="self-start text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                {currentDish.categoryLabel}
              </span>

              <div>
                <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">
                  Món Gợi Ý
                </span>
                <h4 className="text-lg font-black leading-tight drop-shadow-sm">
                  {currentDish.name}
                </h4>
              </div>
            </div>

            <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-[#18181B]/85 backdrop-blur-md text-amber-300 font-mono font-black text-xs shadow-md">
              {currentDish.price.toLocaleString()}đ
            </div>
          </div>

          <button 
            type="button"
            onClick={handlePrev}
            className="absolute left-2 z-30 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md shadow-md text-neutral-800 flex items-center justify-center hover:bg-white active:scale-90 transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={handleNext}
            className="absolute right-2 z-30 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md shadow-md text-neutral-800 flex items-center justify-center hover:bg-white active:scale-90 transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>

        </div>

        {/* Thông tin món ăn */}
        <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-sm space-y-2 mt-2">
          <p className="text-xs text-neutral-600 italic leading-relaxed">
            "{currentDish.quote}"
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-[11px] font-bold text-neutral-600">
            <div className="flex items-center gap-1">
              <Flame size={13} className="text-rose-500 shrink-0" />
              <span>{currentDish.calories} kcal</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={13} className="text-blue-500 shrink-0" />
              <span>{currentDish.prepTime}</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-neutral-500 truncate">
              <MapPin size={13} className="text-amber-500 shrink-0" />
              <span className="truncate">{currentDish.location}</span>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="space-y-2 mt-4">
          <button
            type="button"
            disabled={isShuffling}
            onClick={handleShuffle}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.97] ${
              isShuffling
                ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/25'
            }`}
          >
            {isShuffling ? (
              <>
                <RotateCcw size={17} className="animate-spin" />
                Đang xáo dải thẻ...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Lắc Ngẫu Nhiên Món Trưa
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isShuffling}
            onClick={handleConfirm}
            className="w-full py-3.5 bg-[#18181B] hover:bg-black active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Check size={16} /> Chốt món này & Ghi vào Sổ + Lịch 12:00
          </button>
        </div>

      </div>
    </div>
  );
};