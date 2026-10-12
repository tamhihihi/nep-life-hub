import React, { useState } from 'react';
import { Sparkles, Moon, X, PlusCircle, RefreshCw } from 'lucide-react';
import { TAROT_DECK } from '../../data/tarotCards';
import { TarotCard } from '../../types';
import { sounds } from '../../utils/soundEngine';
import { useAppStore } from '../../stores/useAppStore';
import { AmbientPlayer } from './AmbientPlayer';

export const TarotCardFlip: React.FC = () => {
  const { isEveningOpen, setIsEveningOpen, addScheduleItem, addTransaction } = useAppStore();
  const [phase, setPhase] = useState<'spread' | 'drawing' | 'revealed'>('spread');
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  if (!isEveningOpen) return null;

  const handleShuffle = () => {
    setIsShuffling(true);
    sounds.playCardSlide();
    setTimeout(() => sounds.playCardSlide(), 120);
    setTimeout(() => setIsShuffling(false), 350);
  };

  const handleSelectCard = () => {
    if (phase !== 'spread' || isShuffling) return;
    const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    setSelectedCard(randomCard);
    setPhase('drawing');
    sounds.playCardSlide();

    setTimeout(() => {
      setPhase('revealed');
      sounds.playChime();
    }, 450);
  };

  const handleReset = () => {
    sounds.playCardSlide();
    setPhase('spread');
    setSelectedCard(null);
  };

  const handleApply = () => {
    if (!selectedCard) return;
    addScheduleItem({
      title: selectedCard.title,
      dateStr: new Date().toISOString().split('T')[0],
      startTime: '20:00',
      category: 'evening',
      cost: selectedCard.cost,
    });
    if (selectedCard.cost > 0) {
      addTransaction({
        amount: selectedCard.cost,
        type: 'expense',
        category: 'Giải trí',
        bankName: 'Tiền mặt',
        note: `Buổi tối: ${selectedCard.title}`,
        dateStr: new Date().toISOString().split('T')[0],
      });
    }
    setIsEveningOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-ios-fade">
      <div className="w-full max-w-md bg-[#121214] rounded-t-[38px] sm:rounded-[38px] p-6 text-white border border-white/10 shadow-2xl relative animate-ios-sheet gpu-accelerated overflow-hidden">
        <button
          type="button"
          onClick={() => setIsEveningOpen(false)}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-3">
          <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-500/30">
            NIGHT ORACLE · TAROT DECK
          </span>
          <h3 className="text-xl font-black mt-2 tracking-tight">Tối Nay Bạn Cần Gì?</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {phase === 'spread' ? 'Tập trung tâm trí và chạm để rút 1 lá bài' : 'Thông điệp vũ trụ cho đêm nay'}
          </p>
        </div>

        <div className="min-h-[290px] flex items-center justify-center relative my-2">
          {phase === 'spread' && (
            <div className="relative w-full h-64 flex items-center justify-center">
              {[-2, -1, 0, 1, 2].map((offset, i) => {
                const rotation = offset * 12;
                const translateY = Math.abs(offset) * 10;
                const translateX = offset * 32;

                return (
                  <div
                    key={i}
                    onClick={handleSelectCard}
                    style={{
                      transform: isShuffling
                        ? 'translate(0px, 0px) rotate(0deg) scale(0.95)'
                        : `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
                    }}
                    className="absolute w-28 h-44 rounded-2xl bg-gradient-to-b from-[#1C1A2E] via-[#151322] to-black border-2 border-indigo-400/40 shadow-xl flex flex-col items-center justify-between p-2.5 cursor-pointer hover:-translate-y-4 hover:border-amber-400 transition-all duration-300 ease-ios-spring active:scale-95 group select-none"
                  >
                    <div className="w-full h-full rounded-xl border border-indigo-500/20 flex flex-col items-center justify-between p-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/50 to-transparent">
                      <span className="text-[10px] text-indigo-300 font-serif">✦ ☽ ✦</span>
                      <div className="w-10 h-10 rounded-full border border-amber-400/30 flex items-center justify-center">
                        <Moon size={18} className="text-amber-300 group-hover:rotate-45 transition-transform duration-500" />
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-indigo-300/60 uppercase">NIGHT</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(phase === 'drawing' || phase === 'revealed') && selectedCard && (
            <div className="w-56 h-80 cursor-pointer select-none" style={{ perspective: '1200px' }}>
              <div
                className={`w-full h-full relative transition-transform duration-700 ease-ios-spring ${
                  phase === 'revealed' ? '[transform:rotateY(180deg)]' : ''
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#1C1A2E] to-black border-2 border-indigo-400 p-3 flex flex-col items-center justify-between shadow-2xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-xs text-indigo-300 font-serif">✦ TAROT ✦</span>
                  <Moon size={32} className="text-amber-300 animate-pulse" />
                  <span className="text-[10px] tracking-widest text-neutral-400 uppercase">Đang hé lộ...</span>
                </div>

                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#1E1E24] via-[#141418] to-black border-2 border-amber-400/70 p-4 flex flex-col justify-between shadow-2xl text-left"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-xs font-serif font-black text-amber-400 tracking-widest">
                      {selectedCard.numeral} · {selectedCard.arcana}
                    </span>
                    <span className="text-xs">{selectedCard.symbol}</span>
                  </div>

                  <div className="my-auto py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {selectedCard.subtitle}
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5 leading-snug">
                      {selectedCard.title}
                    </h4>
                    <p className="text-xs text-neutral-300 italic mt-2.5 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                      "{selectedCard.quote}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400">
                      Chi phí: <strong className="text-white">{selectedCard.cost === 0 ? '0đ (Free)' : `${selectedCard.cost.toLocaleString()}đ`}</strong>
                    </span>
                    <span className="text-amber-400 font-bold">
                      {selectedCard.energy === 'low' ? '🪫 Thư giãn' : selectedCard.energy === 'mid' ? '🔋 Cân bằng' : '⚡ Bùng nổ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {phase === 'spread' && (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={isShuffling}
              className="flex-1 py-3 bg-white/10 active:bg-white/20 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={14} className={isShuffling ? 'animate-spin' : ''} /> Xáo lại bài
            </button>
            <button
              type="button"
              onClick={handleSelectCard}
              className="flex-1 py-3 bg-indigo-600 active:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <Sparkles size={14} /> Rút ngẫu nhiên
            </button>
          </div>
        )}

        {phase === 'revealed' && (
          <div className="space-y-2 mt-2 animate-ios-fade">
            <button
              type="button"
              onClick={handleApply}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.96] transition cursor-pointer"
            >
              <PlusCircle size={16} /> Chốt vào Lịch 20:00 & Ghi sổ ví
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 bg-white/10 text-neutral-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={13} /> Rút lại lá khác
            </button>
          </div>
        )}

        <AmbientPlayer />
      </div>
    </div>
  );
};
