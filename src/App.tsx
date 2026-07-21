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

export default function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeModule, setActiveModule] = useState<SimulationType>('ac_shock');

  if (showDisclaimer) {
    return <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />;
  }

  if (!userConfig) {
    return <GameOnboarding onComplete={(config) => setUserConfig(config)} />;
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
        return <AssessmentModule />;

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
          <div id="alert-container" className="fixed top-3 right-3 md:right-6 w-full max-w-lg px-2 z-[100] empty:hidden pointer-events-none"></div>
          <div id="mobile-action-container" className="fixed bottom-4 left-4 right-4 z-[100] lg:hidden empty:hidden pointer-events-none flex flex-col justify-end"></div>
          
          <div className="flex-1 overflow-hidden">
            {renderModule()}
          </div>
        </div>
      </main>
    </div>
  );
}
