/**
 * HomeGuardSimpleShell.tsx
 * 
 * Presentation Layer 1: SIMPLE SHELL (🏠 SIMPLE)
 * Designed specifically for Housewives & Children:
 * 1. Warm light theme, rounded cards, friendly Nunito font, body >= 16px, tap targets >= 56px.
 * 2. Full-bleed 2.5D house scene; NO left rail; Scenarios become horizontal 3-act story-card carousel.
 * 3. 6 Micro-Lessons + 5 Scenarios with the complete Metaphor System:
 *    - Water-pipes current
 *    - Thermometer-face wire heat (😰) + circular countdown dial
 *    - Lightning-in-wall short circuit
 *    - Dripping leak to escape-road earth
 *    - Leak Guard detective ring (0.03s CLICK vs heartbeat race lane + YOU SAVED BABY!)
 *    - Old blind guard (vELCB broken road)
 * 4. 3-Emoji Quizzes (😀 safe / 😲 risky / 🚨 danger), Sticker Badge Tray, Printable Certificate.
 * 5. One-line Family Rules as pictogram strips (no paragraphs): e.g. [heater]+[heater]+[socket] = 🚨.
 * 6. Sentences <= 12 words, verb-first; WHAT-JUST-HAPPENED = 3 pictogram beats + 1 spoken sentence.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IsometricHouseView } from './IsometricHouseView';
import { SmileyGauge } from './SmileyGauge';
import { SpotlightOverlay } from './SpotlightOverlay';
import { PlainLanguageText } from './GlossaryPopover';
import {
  HOMEGUARD_THREE_ACT_SCENARIOS,
  ThreeActScenario,
  HOMEGUARD_MICRO_LESSONS,
  MicroLesson
} from '../data/homeguardSimpleContent';
import { ChildShockRaceLane } from './simple/ChildShockRaceLane';
import { ThermometerHeatDial } from './simple/ThermometerHeatDial';
import { FamilyRulePictogramStrip } from './simple/FamilyRulePictogramStrip';
import { ThreeEmojiQuizModal } from './simple/ThreeEmojiQuizModal';
import { StickerTrayModal } from './simple/StickerTrayModal';
import { CircuitStates, ScenarioProfile } from '../types/homeguard';
import { homeguardAudio } from '../utils/homeguardAudio';
import { cn } from '@/src/lib/utils';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  BookOpen,
  Award,
  Zap,
  Flame,
  ArrowRight
} from 'lucide-react';

export interface HomeGuardSimpleShellProps {
  circuitStates: CircuitStates;
  selectedScenario: ScenarioProfile;
  onSelectScenarioId: (scenarioId: string) => void;
  activeApplianceIds: string[];
  onToggleAppliance: (applianceId: string) => void;
  isXRay: boolean;
  onToggleXRay: () => void;
  isDaisyChainActive: boolean;
  onToggleDaisyChain: () => void;
  onSafeRecloseBreaker: (circuitId: string) => void;
  onSafeTestTripRCCB: () => void;
  timeLapseSpeed: number;
  onSpeedChange: (speed: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HomeGuardSimpleShell: React.FC<HomeGuardSimpleShellProps> = ({
  circuitStates,
  selectedScenario,
  onSelectScenarioId,
  activeApplianceIds,
  onToggleAppliance,
  isXRay,
  onToggleXRay,
  isDaisyChainActive,
  onToggleDaisyChain,
  onSafeRecloseBreaker,
  onSafeTestTripRCCB,
  timeLapseSpeed,
  onSpeedChange,
  isMuted,
  onToggleMute
}) => {
  // Navigation Mode within Simple: 'stories' | 'lessons'
  const [simpleNavTab, setSimpleNavTab] = useState<'stories' | 'lessons'>('stories');

  // Active 3-Act Story
  const [activeStory, setActiveStory] = useState<ThreeActScenario | null>(null);
  const [currentActNumber, setCurrentActNumber] = useState<1 | 2 | 3>(1);

  // Micro-Lesson & Quiz State
  const [activeQuizLesson, setActiveQuizLesson] = useState<MicroLesson | null>(null);
  const [activeLessonModal, setActiveLessonModal] = useState<MicroLesson | null>(null);

  // Sticker Badges collected (persisted in localStorage)
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('homeguard_sticker_badges');
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.warn('Error reading sticker badges:', err);
      }
    }
    return ['badge_water']; // Starter badge
  });

  const [isStickerTrayOpen, setIsStickerTrayOpen] = useState<boolean>(false);
  const [isVoiceNarrationEnabled, setIsVoiceNarrationEnabled] = useState<boolean>(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [zapFlashActive, setZapFlashActive] = useState<boolean>(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const c2State = circuitStates.c2_living_sockets;
  const rccbState = circuitStates.main_rccb;
  const isTripped = c2State.state !== 'CLOSED' || rccbState.state !== 'CLOSED';
  const isShortCircuit = selectedScenario.faultType === 'short_circuit' && !isTripped;

  // Wattage calculation for Smiley Gauge
  const totalWatts = useMemo(() => {
    let w = 0;
    if (activeApplianceIds.includes('tv_console')) w += 150;
    if (activeApplianceIds.includes('space_heater')) w += 2000;
    if (activeApplianceIds.includes('kettle')) w += 2200;
    if (activeApplianceIds.includes('microwave')) w += 1200;
    return w;
  }, [activeApplianceIds]);

  // Current Act
  const currentAct = useMemo(() => {
    if (!activeStory) return null;
    return activeStory.acts[currentActNumber - 1];
  }, [activeStory, currentActNumber]);

  // Read speech narration aloud on act change
  useEffect(() => {
    if (!isVoiceNarrationEnabled || isMuted || !currentAct) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentAct.speechText);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech error:', err);
      }
    }
  }, [currentAct, isVoiceNarrationEnabled, isMuted]);

  // Award sticker badge
  const handleAwardBadge = (badgeId: string) => {
    setEarnedBadgeIds(prev => {
      if (prev.includes(badgeId)) return prev;
      const next = [...prev, badgeId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('homeguard_sticker_badges', JSON.stringify(next));
      }
      return next;
    });
    setActiveQuizLesson(null);
  };

  // Start 3-act story
  const handleStartStory = (story: ThreeActScenario) => {
    setActiveStory(story);
    setCurrentActNumber(1);
    onSelectScenarioId(story.scenarioId);
    homeguardAudio.playBreakerResetSound();
  };

  // Advance Act
  const handleAdvanceAct = () => {
    if (!activeStory || !currentAct) return;

    if (currentActNumber === 1) {
      // Act 1 (Setup) -> Act 2 (Danger)
      if (currentAct.soundCue === 'zap') {
        homeguardAudio.playArcSizzleSound();
        setZapFlashActive(true);
        setTimeout(() => setZapFlashActive(false), 250);
      } else if (currentAct.soundCue === 'heartbeat') {
        homeguardAudio.playHeartbeatThump();
      } else if (currentAct.soundCue === 'sizzle') {
        homeguardAudio.playArcSizzleSound();
      } else {
        homeguardAudio.playBreakerTripSound();
      }

      // Simulate fault trip on breaker
      onSafeTestTripRCCB();
      setCurrentActNumber(2);
    } else if (currentActNumber === 2) {
      // Act 2 (Danger) -> Act 3 (Save/Lesson)
      homeguardAudio.playBreakerTripSound();
      setCurrentActNumber(3);
    } else if (currentActNumber === 3) {
      // Act 3 (Save) -> Finished!
      homeguardAudio.playCheerSound();
      // Safe restore
      onSafeRecloseBreaker('c2_living_sockets');
      setActiveStory(null);
      setCurrentActNumber(1);
    }
  };

  // Spotlight coordinates map
  const getSpotlightCoords = () => {
    if (!activeStory || !currentAct) return { x: 360, y: 300, radius: 70 };
    switch (currentAct.targetElement) {
      case 'child':
        return { x: 260, y: 340, radius: 65 };
      case 'socket':
        return { x: 260, y: 340, radius: 55 };
      case 'heater':
        return { x: 300, y: 410, radius: 60 };
      case 'db_box':
        return { x: 420, y: 220, radius: 50 };
      default:
        return { x: 360, y: 300, radius: 70 };
    }
  };

  return (
    <div 
      className="flex-1 min-h-0 w-full h-full flex flex-col bg-amber-50/50 text-slate-800 select-none overflow-hidden relative"
      style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
    >
      {/* ── TOP BAR (Clean, Friendly & Warm) ── */}
      <header className="h-14 shrink-0 px-4 bg-white/95 border-b-2 border-amber-200/80 flex items-center justify-between gap-2 z-30 shadow-sm backdrop-blur-md">
        
        {/* Left: Back or Tab Switcher */}
        <div className="flex items-center gap-2.5">
          {activeStory ? (
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis?.cancel();
                setActiveStory(null);
                setCurrentActNumber(1);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-sm cursor-pointer transition-all active:scale-95 shadow-sm min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center bg-amber-100/90 p-1 rounded-2xl border border-amber-200 shadow-inner">
              <button
                type="button"
                onClick={() => setSimpleNavTab('stories')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5",
                  simpleNavTab === 'stories' 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "text-amber-900 hover:text-amber-700"
                )}
              >
                <span>📖 5 Stories</span>
              </button>

              <button
                type="button"
                onClick={() => setSimpleNavTab('lessons')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5",
                  simpleNavTab === 'lessons' 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "text-amber-900 hover:text-amber-700"
                )}
              >
                <span>🎓 6 Micro-Lessons</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Controls: Sticker Badge Tray, Voice, Speed, Help */}
        <div className="flex items-center gap-2">
          {/* Sticker Tray Button */}
          <button
            type="button"
            onClick={() => setIsStickerTrayOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black text-xs border border-amber-300 shadow-sm cursor-pointer transition-transform active:scale-95 min-h-[44px]"
            title="Open Sticker Badge Tray"
          >
            <Award className="w-4 h-4 text-amber-900" />
            <span>Badges: {earnedBadgeIds.length}/6</span>
          </button>

          {/* 🔊 Narration Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isVoiceNarrationEnabled;
              setIsVoiceNarrationEnabled(next);
              if (!next) {
                window.speechSynthesis?.cancel();
              } else if (currentAct) {
                const utterance = new SpeechSynthesisUtterance(currentAct.speechText);
                utterance.rate = 0.95;
                window.speechSynthesis?.speak(utterance);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border-2 font-bold text-xs transition-all cursor-pointer min-h-[44px] shadow-sm active:scale-95",
              isVoiceNarrationEnabled
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : "bg-slate-100 border-slate-200 text-slate-500"
            )}
            title="Toggle Voice Narration"
          >
            {isVoiceNarrationEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="hidden md:inline">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden md:inline">Mute</span>
              </>
            )}
          </button>

          {/* Single Speed Control [Slow | Normal] */}
          <div className="flex items-center bg-amber-100/80 p-0.5 rounded-2xl border border-amber-200 text-xs font-black">
            <button
              type="button"
              onClick={() => onSpeedChange(0.25)}
              className={cn(
                "px-2 py-1 rounded-xl transition-all cursor-pointer min-h-[34px] flex items-center",
                timeLapseSpeed < 1 ? "bg-amber-500 text-white shadow-sm" : "text-amber-900"
              )}
            >
              Slow 🐢
            </button>
            <button
              type="button"
              onClick={() => onSpeedChange(1)}
              className={cn(
                "px-2 py-1 rounded-xl transition-all cursor-pointer min-h-[34px] flex items-center",
                timeLapseSpeed >= 1 ? "bg-amber-500 text-white shadow-sm" : "text-amber-900"
              )}
            >
              Normal 🐇
            </button>
          </div>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="w-10 h-10 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-sm border border-amber-200"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* ── MAIN VISUAL CANVAS ── */}
      <main className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-amber-50/70 to-orange-50/50">
        
        {/* Full-Bleed 2.5D House Scene */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <IsometricHouseView
            isXRay={isXRay}
            onToggleXRay={onToggleXRay}
            circuitStates={circuitStates}
            activeApplianceIds={activeApplianceIds}
            onToggleAppliance={onToggleAppliance}
            isTripped={isTripped}
            isShortCircuit={isShortCircuit}
            isOverloaded={selectedScenario.faultType === 'thermal_overload' && !isTripped}
            scenarioId={selectedScenario.id}
            onOpenDBBox={() => {}}
            isDaisyChainActive={isDaisyChainActive}
            onToggleDaisyChain={onToggleDaisyChain}
            className="w-full h-full overflow-hidden"
          />

          {/* Zap Flash Blackout Overlay (Short Circuit Beat) */}
          {zapFlashActive && (
            <div className="absolute inset-0 z-30 bg-yellow-200/90 mix-blend-screen pointer-events-none animate-ping" />
          )}

          {/* Top-Left: Smiley Gauge 😊/😐/🚨 (Zero numbers) */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none drop-shadow-lg">
            <SmileyGauge
              percentage={Math.round((totalWatts / 3680) * 100)}
              isTripped={isTripped}
              isFault={selectedScenario.faultType === 'earth_leakage' || isShortCircuit}
              size="md"
              className="bg-white/95 backdrop-blur-md rounded-3xl p-2.5 border-3 border-amber-200 shadow-xl pointer-events-auto"
            />
          </div>

          {/* Overload Dial Overlay (Act 2 & 3 of Overload Story) */}
          {activeStory && activeStory.id === 'scenario_overload' && currentActNumber >= 2 && (
            <div className="absolute top-4 right-4 z-20 animate-in zoom-in-95 duration-200">
              <ThermometerHeatDial
                countdownSec={isTripped ? 0 : 4}
                maxCountdownSec={15}
                currentWatts={totalWatts}
                isTripped={isTripped}
              />
            </div>
          )}

          {/* Child Shock Race Lane Overlay (Act 2 & 3 of Child Shock Story) */}
          {activeStory && activeStory.id === 'scenario_child_shock' && currentActNumber >= 2 && (
            <div className="absolute top-4 inset-x-4 max-w-lg mx-auto z-20 animate-in slide-in-from-top-4 duration-300">
              <ChildShockRaceLane onComplete={() => {}} />
            </div>
          )}

          {/* Spotlight System with pulsing halo and bouncing hand 👆 */}
          {activeStory && currentAct && (
            <SpotlightOverlay
              isActive={true}
              targetCoords={getSpotlightCoords()}
              onTargetTap={handleAdvanceAct}
              targetLabel={currentAct.actionButtonLabel}
            />
          )}

          {/* ── STORIES HORIZONTAL CAROUSEL (When on Stories Tab & No Story Active) ── */}
          {!activeStory && simpleNavTab === 'stories' && (
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 pb-6 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent backdrop-blur-[2px] animate-in fade-in duration-300">
              <div className="max-w-4xl mx-auto w-full space-y-3">
                <div className="flex items-center justify-between text-white drop-shadow px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
                    <h2 className="text-xl font-black tracking-wide">
                      Select a Safety Story (Setup → Danger → Save):
                    </h2>
                  </div>
                  <span className="text-sm font-bold text-amber-200">
                    5 3-Act Stories
                  </span>
                </div>

                <div 
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none px-1"
                >
                  {HOMEGUARD_THREE_ACT_SCENARIOS.map((story, idx) => (
                    <div
                      key={story.id}
                      className="min-w-[280px] sm:min-w-[310px] bg-white rounded-3xl p-5 shadow-2xl border-4 border-amber-300 flex flex-col justify-between shrink-0 snap-center transform transition-all duration-200 hover:-translate-y-1"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{story.emoji}</span>
                          <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                            Story {idx + 1}
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 leading-snug">
                          {story.title}
                        </h3>

                        <p className="text-base text-slate-600 mt-2 leading-relaxed">
                          {story.summaryLine}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartStory(story)}
                        className="mt-5 w-full min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-amber-400"
                      >
                        <span>START STORY</span>
                        <ChevronRight className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 6 MICRO-LESSONS GRID (When on Lessons Tab) ── */}
          {!activeStory && simpleNavTab === 'lessons' && (
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 pb-6 bg-gradient-to-t from-slate-950/85 via-slate-900/50 to-transparent backdrop-blur-[2px] animate-in fade-in duration-300 overflow-y-auto">
              <div className="max-w-4xl mx-auto w-full space-y-3">
                <div className="flex items-center justify-between text-white drop-shadow px-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                    <h2 className="text-xl font-black tracking-wide">
                      6 Interactive Micro-Lessons (30s Metaphors):
                    </h2>
                  </div>
                  <span className="text-sm font-bold text-amber-200">
                    Earn All 6 Badges
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {HOMEGUARD_MICRO_LESSONS.map((lesson) => {
                    const isPassed = earnedBadgeIds.includes(lesson.badgeId);
                    return (
                      <div
                        key={lesson.id}
                        className="bg-white rounded-3xl p-4 shadow-xl border-3 border-amber-300 flex flex-col justify-between transition-transform hover:-translate-y-1"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl">{lesson.badgeEmoji}</span>
                            {isPassed ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center gap-1">
                                ✓ PASSED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                                30s Lesson
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-black text-slate-900">
                            {lesson.lessonTitle}
                          </h3>
                          <span className="text-xs font-bold text-amber-700 block mt-0.5">
                            {lesson.metaphorName}
                          </span>
                          <p className="text-xs text-slate-600 mt-1.5 leading-snug">
                            {lesson.metaphorTagline}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveLessonModal(lesson)}
                          className={cn(
                            "mt-3 w-full min-h-[48px] rounded-2xl font-black text-sm transition-all shadow cursor-pointer flex items-center justify-center gap-1.5",
                            isPassed 
                              ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-100" 
                              : "bg-amber-500 hover:bg-amber-400 text-white"
                          )}
                        >
                          <span>{isPassed ? 'Review Metaphor 🔄' : 'Explore Lesson 🚀'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* ── BOTTOM STORY BAR (Narration <= 12 words + ONE Big Action Button >= 56px) ── */}
      {activeStory && currentAct && (
        <footer className="shrink-0 w-full bg-white/95 border-t-3 border-amber-200 px-4 py-3 z-30 shadow-2xl backdrop-blur-md">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Act Caption / Narration Line (Strictly <= 12 words, verb-first) */}
            <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border-2 border-amber-300 flex items-center justify-center text-xl shrink-0 font-black shadow-inner">
                {currentAct.pictogramBeat.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-amber-700">
                  {activeStory.title} • Act {currentAct.actNumber}: {currentAct.actTitle}
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  <PlainLanguageText text={currentAct.narrationLine} />
                </div>
              </div>
            </div>

            {/* ONE Big Action Button (Height >= 56px, high contrast, tap target) */}
            <button
              type="button"
              onClick={handleAdvanceAct}
              className={cn(
                "w-full sm:w-auto shrink-0 min-h-[56px] px-8 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-2",
                currentAct.actNumber === 3
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-400"
                  : "bg-amber-500 hover:bg-amber-400 text-white border-amber-400 animate-pulse"
              )}
            >
              <span>{currentAct.actionButtonLabel}</span>
            </button>

          </div>

          {/* Act 3 Completion: One-Line Family Rule Strip */}
          {currentAct.actNumber === 3 && (
            <div className="max-w-3xl mx-auto mt-2 pt-2 border-t border-amber-100">
              <FamilyRulePictogramStrip
                icons={activeStory.familyRule.stripIcons}
                resultEmoji={activeStory.familyRule.resultEmoji}
                resultCaption={activeStory.familyRule.caption}
                spokenRule={activeStory.whatJustHappenedSpoken}
              />
            </div>
          )}
        </footer>
      )}

      {/* ── 30-SECOND MICRO-LESSON MODAL ── */}
      {activeLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-slate-800 relative select-none animate-in zoom-in-95 duration-150"
            style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
          >
            <button
              type="button"
              onClick={() => setActiveLessonModal(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{activeLessonModal.badgeEmoji}</span>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {activeLessonModal.lessonTitle}
                </h3>
                <span className="text-xs font-bold text-amber-700">
                  {activeLessonModal.metaphorName}
                </span>
              </div>
            </div>

            {/* 3-Beat Metaphor Story */}
            <div className="space-y-2 my-4">
              {activeLessonModal.threeBeatStory.map((beat, bIdx) => (
                <div key={bIdx} className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                  <span className="text-2xl">{beat.icon}</span>
                  <div className="text-xs font-bold text-slate-800">
                    <strong className="block text-amber-900 text-sm font-black">{beat.beatTitle}</strong>
                    {beat.text}
                  </div>
                </div>
              ))}
            </div>

            {/* One-Line Family Rule */}
            <div className="my-3">
              <FamilyRulePictogramStrip
                icons={[activeLessonModal.familyRulePictogram.iconA, activeLessonModal.familyRulePictogram.iconB]}
                resultEmoji={activeLessonModal.familyRulePictogram.resultEmoji}
                resultCaption={activeLessonModal.familyRulePictogram.resultLabel}
                spokenRule={activeLessonModal.familyRulePictogram.spokenRule}
              />
            </div>

            {/* Quiz Action Button */}
            <button
              type="button"
              onClick={() => {
                setActiveQuizLesson(activeLessonModal);
                setActiveLessonModal(null);
              }}
              className="mt-3 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-base shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Take 3-Emoji Quiz & Earn Badge! 🏆</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3-EMOJI QUIZ MODAL ── */}
      {activeQuizLesson && (
        <ThreeEmojiQuizModal
          lesson={activeQuizLesson}
          isOpen={!!activeQuizLesson}
          onClose={() => setActiveQuizLesson(null)}
          onPass={handleAwardBadge}
        />
      )}

      {/* ── STICKER TRAY & CERTIFICATE MODAL ── */}
      {isStickerTrayOpen && (
        <StickerTrayModal
          isOpen={isStickerTrayOpen}
          onClose={() => setIsStickerTrayOpen(false)}
          earnedBadgeIds={earnedBadgeIds}
          onSelectLesson={(lId) => {
            const match = HOMEGUARD_MICRO_LESSONS.find(l => l.id === lId);
            if (match) setActiveLessonModal(match);
          }}
        />
      )}

      {/* ── HELP MODAL ── */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-slate-800 relative">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏠</span>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Welcome to HomeGuard!
                </h3>
                <span className="text-xs font-bold text-amber-700">
                  Super simple family safety guide:
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-2xl shrink-0">👆</span>
                <p>
                  <strong>Follow the Hand:</strong> Just tap whatever the bouncing hand points at to advance!
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-2xl shrink-0">🏆</span>
                <p>
                  <strong>Earn Badges:</strong> Explore the 6 micro-lessons and take the 3-emoji quizzes to fill your sticker tray.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-2xl shrink-0">🖨️</span>
                <p>
                  <strong>Printable Certificate:</strong> Once all 6 badges are in your tray, print your official family certificate sheet!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="mt-5 w-full min-h-[50px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-base cursor-pointer shadow-md"
            >
              Let's Play! 🚀
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
