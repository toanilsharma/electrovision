import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ChevronUp, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  peekHeight?: number; // e.g. 70px for collapsed drawer bar
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title = 'Simulation Controls',
  children,
  peekHeight = 70
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // If dragged down hard or far -> collapse or close
    if (info.offset.y > 100 || info.velocity.y > 500) {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (info.offset.y < -50 || info.velocity.y < -300) {
      // If dragged up hard -> expand
      setIsExpanded(true);
    }
  };

  return (
    <>
      {/* Backdrop overlay on full expansion */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Swipeable Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isExpanded ? 0 : `calc(100% - ${peekHeight}px)` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col max-h-[85vh] md:hidden select-none touch-none',
              isExpanded ? 'h-[80vh]' : ''
            )}
          >
            {/* Header Handle Bar */}
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-3 px-4 flex flex-col items-center gap-1 cursor-pointer border-b border-slate-800/60 active:bg-slate-800/40 transition-colors"
            >
              {/* Drag Pill */}
              <div className="w-12 h-1.5 rounded-full bg-slate-700" />

              <div className="w-full flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span>{title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs text-slate-400 font-mono">
                    {isExpanded ? 'Tap to collapse' : 'Swipe up to edit'}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="flex-1 overflow-y-auto p-4 touch-pan-y text-slate-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
