import React, { useState, useEffect, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { DisclaimerModal } from './components/DisclaimerModal';
import { GameOnboarding } from './components/GameOnboarding';
import { TopNavigation } from './components/TopNavigation';
import { MobileSectionNav } from './components/MobileSectionNav';
import { ConfigModal } from './components/ConfigModal';
import { ACShockSimulator } from './components/Simulators/ACShockSimulator';
import { DCShockSimulator } from './components/Simulators/DCShockSimulator';
import { EarthFaultSimulator } from './components/Simulators/EarthFaultSimulator';
import { ShortCircuitSimulator } from './components/Simulators/ShortCircuitSimulator';
import { StepTouchSimulator } from './components/Simulators/StepTouchSimulator';
import { ArcFlashSimulator } from './components/Simulators/ArcFlashSimulator';
import { LOTOSimulator } from './components/Simulators/LOTOSimulator';
import { FirstAidSimulator } from './components/Simulators/FirstAidSimulator';
import { AssessmentModule } from './components/AssessmentModule';
import { MCBLayoutShell } from './components/mcb/MCBLayoutShell';
import { SafetyQuizPage } from './components/SafetyQuizPage';
import { DisasterReplayModal } from './components/DisasterReplayModal';
import { HazardRescueScenarios } from './components/HazardRescueScenarios';
import { ShareEmbedModal } from './components/ShareEmbedModal';
import { SafetyCertificateModal } from './components/SafetyCertificateModal';
import { SimulationType, UserConfig } from './types';
import { applyRouteSEO, resolveModuleFromPath, SEO_ROUTES } from './utils/seoData';
import { parseSimulationUrlParams } from './utils/shareableState';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Simulator Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900 rounded-2xl border border-red-500/40 overflow-auto">
          <h2 className="text-lg font-black text-red-400 uppercase tracking-widest mb-2">SIMULATOR MODULE RECOVERY</h2>
          <p className="text-xs text-slate-300 mb-2">A temporary rendering issue occurred. Click below to reload simulator state.</p>
          {this.state.error && (
            <pre className="p-3 my-2 text-[11px] font-mono text-red-300 bg-black/60 rounded border border-red-500/30 max-w-2xl text-left whitespace-pre-wrap overflow-auto max-h-48">
              {this.state.error?.toString() || 'Unknown error'}
              {this.state.error?.stack ? `\n\n${this.state.error.stack}` : ''}
            </pre>
          )}
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:outline-none min-h-[44px]"
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const initialUrlParams = useMemo(() => parseSimulationUrlParams(), []);
  const isEmbedMode = Boolean(initialUrlParams.embed);

  const [showDisclaimer, setShowDisclaimer] = useState(() => !isEmbedMode);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(() => {
    if (isEmbedMode) {
      return {
        environment: 'industrial',
        profile: 'engineer',
        name: 'Student Trainee'
      };
    }
    return null;
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeModule, setActiveModule] = useState<SimulationType>(() => {
    if (initialUrlParams.sim) {
      return initialUrlParams.sim as SimulationType;
    }
    return typeof window !== 'undefined' ? resolveModuleFromPath(window.location.pathname) : 'ac_shock';
  });
  const [resetKey, setResetKey] = useState<number>(0);

  // Modal states for Recommendations 18, 19, 20
  const [showDisasterReplay, setShowDisasterReplay] = useState(false);
  const [showRescueScenarios, setShowRescueScenarios] = useState(false);
  const [showShareEmbed, setShowShareEmbed] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certData, setCertData] = useState<{ name: string; score: number }>({
    name: 'Safety Practitioner',
    score: 95
  });

  // Sync Dynamic SEO Metadata, OpenGraph & JSON-LD when activeModule changes
  useEffect(() => {
    applyRouteSEO(activeModule);

    // Update browser URL sub-route history
    const routeInfo = SEO_ROUTES[activeModule];
    if (routeInfo && typeof window !== 'undefined' && window.location.pathname !== routeInfo.path) {
      window.history.pushState({ module: activeModule }, '', routeInfo.path);
    }
  }, [activeModule]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const moduleFromUrl = resolveModuleFromPath(window.location.pathname);
      setActiveModule(moduleFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (showDisclaimer) {
    return <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />;
  }

  if (!userConfig) {
    return <GameOnboarding onComplete={setUserConfig} />;
  }

  const handleResetSimulator = () => {
    setResetKey(prev => prev + 1);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'ac_shock':
        return <ACShockSimulator key={resetKey} config={userConfig} />;
      case 'dc_shock':
        return <DCShockSimulator key={resetKey} config={userConfig} />;
      case 'earth_fault':
        return <EarthFaultSimulator key={resetKey} config={userConfig} />;
      case 'short_circuit':
        return <ShortCircuitSimulator key={resetKey} config={userConfig} />;
      case 'step_touch':
        return <StepTouchSimulator key={resetKey} config={userConfig} />;
      case 'arc_flash':
        return <ArcFlashSimulator key={resetKey} config={userConfig} />;
      case 'loto':
        return <LOTOSimulator key={resetKey} config={userConfig} />;
      case 'first_aid':
        return <FirstAidSimulator key={resetKey} config={userConfig} />;
      case 'mcb_simulator':
        return <MCBLayoutShell key={resetKey} />;
      case 'assessment':
        return <AssessmentModule key={resetKey} config={userConfig} />;
      case 'safety_quiz':
        return <SafetyQuizPage key={resetKey} config={userConfig} onBackToSimulator={() => setActiveModule('ac_shock')} />;

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-bold font-display text-slate-400">Module Under Construction</h2>
              <p className="text-sm text-slate-500">This simulator module is currently being finalized.</p>
            </div>
          </div>
        );
    }
  };

  if (isEmbedMode) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#0f172a] text-slate-100 font-mono">
        <main className="flex-1 overflow-y-auto lg:overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#0f172a_100%)] relative flex flex-col p-1.5 sm:p-2">
          <ErrorBoundary>
            {renderModule()}
          </ErrorBoundary>
        </main>
        
        {/* Sleek Embedded LMS Footer Bar */}
        <div className="bg-slate-950/95 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500 flex items-center justify-center transform rotate-45 shrink-0">
              <Zap className="w-2.5 h-2.5 text-slate-950 -rotate-45" />
            </div>
            <span className="font-black text-white uppercase tracking-wider text-[10px] sm:text-xs">
              ELECTROLIVE™ INTERACTIVE SIMULATOR WIDGET
            </span>
          </div>

          <a
            href={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?sim=${activeModule}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
          >
            Open Full Experience ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#0f172a] text-slate-100">
      <MobileSectionNav />
      <TopNavigation 
        activeModule={activeModule} 
        onSelect={setActiveModule} 
        userConfig={userConfig}
        onReconfigure={() => setShowConfigModal(true)}
        onResetSimulator={handleResetSimulator}
        onOpenDisasterReplay={() => setShowDisasterReplay(true)}
        onOpenRescueScenarios={() => setShowRescueScenarios(true)}
        onOpenShareEmbed={() => setShowShareEmbed(true)}
        onOpenCertificate={() => setShowCertificate(true)}
      />
      
      {showConfigModal && userConfig && (
        <ConfigModal 
          currentConfig={userConfig}
          onClose={() => setShowConfigModal(false)}
          onSave={(newConfig) => {
            setUserConfig(newConfig);
            setShowConfigModal(false);
          }}
        />
      )}

      {/* App-Level Shared Severity Banner Notification Slot (Below Tab Bar, Never Overlaps Content) */}
      <div id="alert-container" className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 pt-2 z-30 shrink-0 empty:hidden"></div>
      
      <main className="flex-1 overflow-y-auto lg:overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#0f172a_100%)] relative flex flex-col">
        <div className="max-w-[1600px] w-full p-1.5 lg:p-2 mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div id="mobile-action-container" className="fixed bottom-4 left-4 right-4 z-[100] lg:hidden empty:hidden pointer-events-none flex flex-col justify-end"></div>
          
          <div className="flex-1 overflow-y-auto lg:overflow-hidden min-h-0 flex flex-col">
            <ErrorBoundary>
              {renderModule()}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Persistent Bottom App Status Bar Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 p-1.5 px-4 flex flex-wrap items-center justify-center text-center mx-auto z-40 text-[11px] shrink-0 gap-x-3 gap-y-1">
        <span className="font-black text-white uppercase tracking-widest">
          Concept, Visualisation & Engineering: Anil Sharma
        </span>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-3 font-bold">
          <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
            designcalculators.co.in
          </a>
          <span className="text-slate-600">|</span>
          <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
            reliabilitytools.co.in
          </a>
        </div>
      </footer>

      {/* Rec 18: 1000 FPS Camera Disaster Replay Modal */}
      <DisasterReplayModal 
        isOpen={showDisasterReplay}
        onClose={() => setShowDisasterReplay(false)}
      />

      {/* Rec 19: Gamified Hazard Spotter & Rescue Incident Scenarios */}
      <HazardRescueScenarios
        isOpen={showRescueScenarios}
        onClose={() => setShowRescueScenarios(false)}
        onOpenCertificate={(name, score) => {
          setCertData({ name, score });
          setShowCertificate(true);
        }}
      />

      {/* Rec 20: Institutional Sharing, Classroom QR & Embed Modal */}
      <ShareEmbedModal
        isOpen={showShareEmbed}
        onClose={() => setShowShareEmbed(false)}
        currentParams={{
          sim: activeModule,
          v: initialUrlParams.v,
          skin: initialUrlParams.skin,
          ppe: initialUrlParams.ppe,
          rcd: initialUrlParams.rcd,
          cur: initialUrlParams.cur,
          time: initialUrlParams.time,
          dist: initialUrlParams.dist
        }}
      />

      {/* Rec 20: Verifiable Certificate of Safety Competency */}
      <SafetyCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        defaultStudentName={certData.name}
        defaultScore={certData.score}
      />
    </div>
  );
}

