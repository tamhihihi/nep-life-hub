import React, { useState } from 'react';
import { CloudRain, Music2 } from 'lucide-react';
import { sounds } from '../../utils/soundEngine';

export const AmbientPlayer: React.FC = () => {
  const [rainActive, setRainActive] = useState(false);
  const [lofiActive, setLofiActive] = useState(false);

  return (
    <div className="bg-[#1C1C20] rounded-2xl p-3 flex items-center justify-between text-white border border-white/10 mt-3">
      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ambient Sound</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRainActive(sounds.toggleRain())}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            rainActive ? 'bg-sky-500 text-white shadow-sm' : 'bg-white/10 text-neutral-300'
          }`}
        >
          <CloudRain size={14} /> Mưa đêm
        </button>
        <button
          type="button"
          onClick={() => setLofiActive(sounds.toggleLofi())}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            lofiActive ? 'bg-amber-400 text-black shadow-sm' : 'bg-white/10 text-neutral-300'
          }`}
        >
          <Music2 size={14} /> Hợp âm Lofi
        </button>
      </div>
    </div>
  );
};
