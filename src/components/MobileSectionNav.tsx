import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Activity, Battery, Zap, Shield, ActivitySquare, ShieldAlert, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SectionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const SECTIONS: SectionItem[] = [
  { id: 'section-1', title: '1. AC Shock Physics', subtitle: 'IEC 60479-1 Bio-Impedance', icon: Activity },
  { id: 'section-2', title: '2. DC Shock Dissociation', subtitle: 'IEC 60479-2 Electrolytic Hazards', icon: Battery },
  { id: 'section-3', title: '3. Arc Flash Energy', subtitle: 'IEEE 1584-2018 Blast Boundaries', icon: ShieldAlert },
  { id: 'section-4', title: '4. Step & Touch Potential', subtitle: 'IEEE 80-2013 Ground Potential Rise', icon: ActivitySquare },
  { id: 'section-5', title: '5. Short Circuit Dynamics', subtitle: 'IEC 60909 Lorentz Forces', icon: Zap },
  { id: 'section-6', title: '6. MCB Trip Characteristics', subtitle: 'IEC 60898 Arc Chute Physics', icon: Shield },
  { id: 'section-7', title: '7. Lockout / Tagout (LOTO)', subtitle: 'OSHA 29 CFR 1910.147 Protocols', icon: BookOpen },
  { id: 'section-8', title: '8. Shock Emergency & CPR', subtitle: 'First Aid & Resuscitation Protocols', icon: Activity },
];

export function MobileSectionNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0) {
        const progress = (window.scrollY / scrollable) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (sectionId: string) => {
    setIsOpen(false);
    
    // Find the element by ID or selector
    const element = document.getElementById(sectionId) || document.querySelector(`#${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Scroll Progress Bar at very top */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-slate-900/40 z-[90] pointer-events-none lg:hidden"
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Mobile-Only Sticky Top Bar (Height: 56px) */}
      <header className="mobile-nav sticky top-0 left-0 right-0 h-[56px] bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 items-center justify-between z-40 lg:hidden shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-white">
              ELECTROLIVE<span className="text-orange-500">™</span>
            </span>
            <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">
              8 Standards & Physics Sections
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold transition-all min-h-[44px] min-w-[44px] justify-center cursor-pointer"
          aria-label="Open 8 Sections Navigation Menu"
        >
          <Menu className="w-4 h-4 text-orange-400" />
          <span className="text-[11px] font-bold">Sections</span>
        </button>
      </header>

      {/* Bottom Sheet Navigation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] lg:hidden"
              aria-hidden="true"
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-slate-950 border-t border-slate-800 rounded-t-3xl p-5 z-[120] flex flex-col lg:hidden shadow-2xl"
              role="dialog"
              aria-label="Standards & Physics Sections"
            >
              {/* Sheet Drag Handle */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Standards & Physics Sections
                    </h3>
                    <p className="text-[10px] text-slate-400">Tap to scroll smoothly to any section</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Close Sections Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section Links List */}
              <div className="overflow-y-auto space-y-2 py-1 flex-1 no-scrollbar">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleScrollToSection(sec.id)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 active:bg-orange-500/10 border border-slate-800/90 hover:border-orange-500/40 text-left transition-all group min-h-[52px] cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-orange-400 group-hover:text-orange-300 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-100 group-hover:text-orange-400 truncate">
                            {sec.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {sec.subtitle}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
