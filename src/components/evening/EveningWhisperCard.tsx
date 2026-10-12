import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { getCurrentEveningComfort, ComfortMessage } from '../../data/eveningComfortMessages';

export const EveningWhisperCard: React.FC = () => {
  const [data, setData] = useState<ComfortMessage | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const res = getCurrentEveningComfort();
    if (res.message) {
      setData(res.message);
    }
  }, []);

  if (!data || isDismissed) return null;

  return (
    <div className="bg-gradient-to-br from-[#1E1B2E] via-[#161424] to-[#12111A] text-white rounded-[26px] p-4 border border-indigo-500/30 shadow-lg relative overflow-hidden animate-ios-fade">
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white p-1 rounded-full active:scale-90 transition cursor-pointer"
      >
        <X size={15} />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-400/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
          {data.icon}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-400/20">
              {data.tag}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">Tối nay</span>
          </div>

          <h4 className="text-xs font-black text-amber-200 tracking-tight leading-snug">
            {data.title}
          </h4>

          <p className="text-[11px] text-neutral-300 leading-relaxed pt-0.5">
            {data.content}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-indigo-300/80 font-medium">
        <span className="flex items-center gap-1">
          <Heart size={11} className="text-rose-400 fill-rose-400/30" /> Nếp gửi chút bình yên đến bạn
        </span>
        <span className="italic">Thư giãn nhé</span>
      </div>
    </div>
  );
};
