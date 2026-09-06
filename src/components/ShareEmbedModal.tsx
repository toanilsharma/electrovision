import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Code2, 
  ExternalLink, 
  Layers, 
  Smartphone, 
  Monitor, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { SimulationUrlParams, buildShareableUrl, buildIframeSnippet } from '../utils/shareableState';

interface ShareEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: SimulationUrlParams;
}

export const ShareEmbedModal: React.FC<ShareEmbedModalProps> = ({
  isOpen,
  onClose,
  currentParams
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'embed'>('link');
  const [copiedType, setCopiedType] = useState<'link' | 'embed' | null>(null);
  const [embedWidth, setEmbedWidth] = useState<string>('100%');
  const [embedHeight, setEmbedHeight] = useState<string>('700px');

  // Full Shareable Link
  const shareableUrl = useMemo(() => {
    return buildShareableUrl(currentParams);
  }, [currentParams]);

  // Embeddable Link (with embed=true)
  const embedUrl = useMemo(() => {
    return buildShareableUrl(currentParams, { embedOnly: true });
  }, [currentParams]);

  // Iframe Snippet
  const iframeSnippet = useMemo(() => {
    return buildIframeSnippet(embedUrl, embedWidth, embedHeight);
  }, [embedUrl, embedWidth, embedHeight]);

  // Handle Copy to Clipboard
  const handleCopy = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Generate SVG QR Matrix
  // Generates an interactive QR display via public QR API with instant fallback
  const qrImageUrl = useMemo(() => {
    const encoded = encodeURIComponent(shareableUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encoded}&bgcolor=060a12&color=38bdf8&margin=10`;
  }, [shareableUrl]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto font-mono text-slate-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                <Share2 className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white block">
                  SHARE & EMBED SIMULATION
                </span>
                <span className="text-[10px] text-slate-400">
                  INSTITUTIONAL LMS, CLASSROOM QR & DEEP-LINKING
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 transition-colors border border-slate-700 hover:border-rose-500/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 p-2 bg-slate-900/60 border-b border-slate-800 gap-1.5 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('link')}
              className={cn(
                "py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === 'link' 
                  ? "bg-cyan-950/90 border-cyan-400 text-white shadow-sm" 
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Link</span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={cn(
                "py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === 'qr' 
                  ? "bg-cyan-950/90 border-cyan-400 text-white shadow-sm" 
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mobile QR</span>
            </button>

            <button
              onClick={() => setActiveTab('embed')}
              className={cn(
                "py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === 'embed' 
                  ? "bg-cyan-950/90 border-cyan-400 text-white shadow-sm" 
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>LMS Embed</span>
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
            {activeTab === 'link' && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-slate-300 leading-relaxed">
                  Share this exact simulation configuration with students, colleagues, or trainees. All active dial values are safely serialized into the URL query parameters.
                </div>

                {/* Active Parameter Badges */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px]">
                  <span className="text-slate-400 font-bold px-1 uppercase">Parameters:</span>
                  {currentParams.sim && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                      Module: {currentParams.sim}
                    </span>
                  )}
                  {currentParams.v !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                      Voltage: {currentParams.v}V
                    </span>
                  )}
                  {currentParams.cur !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700">
                      Current: {currentParams.cur} kA
                    </span>
                  )}
                  {currentParams.skin && (
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                      Skin: {currentParams.skin}
                    </span>
                  )}
                  {currentParams.rcd && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      RCD: {currentParams.rcd}
                    </span>
                  )}
                </div>

                {/* URL Copy Box */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full bg-transparent text-xs text-cyan-300 select-all outline-none font-mono px-1"
                  />
                  <button
                    onClick={() => handleCopy(shareableUrl, 'link')}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
                  >
                    {copiedType === 'link' ? (
                      <><Check className="w-3.5 h-3.5" /> COPIED</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> COPY</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="text-xs text-slate-300 max-w-md">
                  Display this QR code on classroom projectors, lab whiteboards, or printed syllabi. Students can scan with smartphone cameras to instantly load this simulation state.
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] flex items-center justify-center">
                  <img 
                    src={qrImageUrl} 
                    alt="Classroom Mobile QR Code" 
                    className="w-52 h-52 rounded-xl object-contain"
                    onError={(e) => {
                      // Fallback UI if offline
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Compatible with iOS Camera, Android Google Lens, and QR scanners.</span>
                </div>
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-slate-300 leading-relaxed">
                  Embed this visual simulation directly inside Canvas, Moodle, Blackboard, Notion, Google Sites, or your university intranet. The embed mode strips external menus and runs in focused presentation mode.
                </div>

                {/* Dimension Presets */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Frame Dimensions:</span>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'Responsive 100%', w: '100%', h: '700px' },
                      { label: '800 × 600', w: '800px', h: '600px' },
                      { label: '1024 × 768', w: '1024px', h: '768px' }
                    ].map((d) => (
                      <button
                        key={d.label}
                        onClick={() => {
                          setEmbedWidth(d.w);
                          setEmbedHeight(d.h);
                        }}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer",
                          embedWidth === d.w 
                            ? "bg-cyan-950 border-cyan-400 text-cyan-300" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snippet Output Box */}
                <div className="relative">
                  <textarea
                    readOnly
                    rows={4}
                    value={iframeSnippet}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-amber-300 font-mono resize-none outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopy(iframeSnippet, 'embed')}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow"
                  >
                    {copiedType === 'embed' ? (
                      <><Check className="w-3 h-3" /> COPIED</>
                    ) : (
                      <><Copy className="w-3 h-3" /> COPY CODE</>
                    )}
                  </button>
                </div>

                {/* LMS Instructions */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1 text-[10.5px] text-slate-400">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Instructions for Canvas & Moodle:
                  </span>
                  <span>1. In your LMS Course Page, switch the Rich Content Editor to HTML View (<code>&lt;&gt;</code>).</span>
                  <span>2. Paste the iframe snippet and save the page. The interactive simulation renders seamlessly!</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
