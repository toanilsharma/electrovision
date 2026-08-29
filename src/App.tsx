import React, { useState } from 'react';
import { DisclaimerModal } from './components/DisclaimerModal';
import { GameOnboarding } from './components/GameOnboarding';
import { TopNavigation } from './components/TopNavigation';
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
import { SimulationType, UserConfig } from './types';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Simulator Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900 rounded-2xl border border-red-500/40">
          <h2 className="text-lg font-black text-red-400 uppercase tracking-widest mb-2">SIMULATOR MODULE RECOVERY</h2>
          <p className="text-xs text-slate-300 mb-4">A temporary rendering issue occurred. Click below to reload simulator state.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
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
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeModule, setActiveModule] = useState<SimulationType>('ac_shock');
  const [resetKey, setResetKey] = useState<number>(0);

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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      <TopNavigation 
        activeModule={activeModule} 
        onSelect={setActiveModule} 
        userConfig={userConfig}
        onReconfigure={() => setShowConfigModal(true)}
        onResetSimulator={handleResetSimulator}
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
      
      <main className="flex-1 overflow-y-auto lg:overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#0f172a_100%)] relative flex flex-col">
        <div className="max-w-[1600px] w-full p-2 lg:p-4 mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div id="alert-container" className="fixed top-12 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-3xl px-2 z-[110] empty:hidden pointer-events-none flex flex-col items-center"></div>
          <div id="mobile-action-container" className="fixed bottom-4 left-4 right-4 z-[100] lg:hidden empty:hidden pointer-events-none flex flex-col justify-end"></div>
          
          <div className="flex-1 overflow-y-auto lg:overflow-hidden">
            <ErrorBoundary>
              {renderModule()}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Persistent Bottom App Status Bar Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 p-1.5 px-4 flex flex-wrap items-center justify-center text-center mx-auto z-40 text-[9px] sm:text-[10px] shrink-0 gap-x-3 gap-y-1">
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
    </div>
  );
}
