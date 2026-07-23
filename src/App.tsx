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

  if (showDisclaimer) {
    return <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />;
  }

  if (!userConfig) {
    return <GameOnboarding onComplete={setUserConfig} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'ac_shock':
        return <ACShockSimulator config={userConfig} />;
      case 'dc_shock':
        return <DCShockSimulator config={userConfig} />;
      case 'earth_fault':
        return <EarthFaultSimulator config={userConfig} />;
      case 'short_circuit':
        return <ShortCircuitSimulator config={userConfig} />;
      case 'step_touch':
        return <StepTouchSimulator config={userConfig} />;
      case 'arc_flash':
        return <ArcFlashSimulator config={userConfig} />;
      case 'loto':
        return <LOTOSimulator config={userConfig} />;
      case 'first_aid':
        return <FirstAidSimulator config={userConfig} />;

      case 'assessment':
        return <AssessmentModule config={userConfig} />;

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
      
      <main className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#0f172a_100%)] relative flex flex-col">
        <div className="max-w-[1600px] w-full p-2 lg:p-4 mx-auto flex flex-col flex-1 min-h-0 overflow-hidden">
          <div id="alert-container" className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-3 z-[110] empty:hidden pointer-events-none"></div>
          <div id="mobile-action-container" className="fixed bottom-4 left-4 right-4 z-[100] lg:hidden empty:hidden pointer-events-none flex flex-col justify-end"></div>
          
          <div className="flex-1 overflow-hidden">
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
