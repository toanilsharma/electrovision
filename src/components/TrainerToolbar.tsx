import React, { useState, useEffect } from 'react';
import { Play, Pause, FastForward, Settings2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function TrainerToolbar() {
  const [speed, setSpeed] = useState<number>(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Attempt to control all Web Animations API
    document.getAnimations().forEach((anim) => {
      if (paused) {
        anim.pause();
      } else {
        anim.play();
        anim.playbackRate = speed;
      }
    });

    // We can also toggle a global CSS class for CSS animations
    if (paused) {
      document.body.classList.add('animations-paused');
    } else {
      document.body.classList.remove('animations-paused');
      document.documentElement.style.setProperty('--global-animation-speed', `${1 / speed}`);
    }

    // Setting up an interval to constantly enforce playback rate for new animations
    const interval = setInterval(() => {
      document.getAnimations().forEach((anim) => {
        if (paused) {
          if (anim.playState !== 'paused') anim.pause();
        } else {
          if (anim.playbackRate !== speed) anim.playbackRate = speed;
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [speed, paused]);

  return (
    <div className="hidden md:flex items-center gap-2 bg-slate-950/60 backdrop-blur-md border border-slate-800/80 p-1.5 rounded-xl shadow-inner select-none">
      <Settings2 className="w-3 h-3 text-sky-500 ml-1" />
      <span className="text-[9px] font-black tracking-widest uppercase text-sky-500 mr-2">Trainer Mode</span>
      
      <div className="flex bg-slate-950 rounded-lg overflow-hidden border border-white/5">
        <button onClick={() => setSpeed(0.25)} className={cn("px-2 py-1 text-[10px] font-bold uppercase transition-colors", speed === 0.25 ? "bg-sky-500 text-slate-900" : "text-slate-400 hover:bg-white/5")}>0.25x</button>
        <button onClick={() => setSpeed(0.5)} className={cn("px-2 py-1 text-[10px] font-bold uppercase transition-colors", speed === 0.5 ? "bg-sky-500 text-slate-900" : "text-slate-400 hover:bg-white/5")}>0.5x</button>
        <button onClick={() => setSpeed(1)} className={cn("px-2 py-1 text-[10px] font-bold uppercase transition-colors", speed === 1 ? "bg-sky-500 text-slate-900" : "text-slate-400 hover:bg-white/5")}>1x</button>
      </div>

      <button 
        onClick={() => setPaused(!paused)}
        className={cn("w-7 h-7 flex items-center justify-center rounded-lg border ml-1 transition-colors", paused ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-slate-800 border-white/5 text-slate-300 hover:bg-white/10")}
      >
        {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
      </button>
    </div>
  );
}
