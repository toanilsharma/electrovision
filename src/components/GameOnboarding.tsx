import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Factory, User, Users, HardHat, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { Environment, DigitalTwinProfile, UserConfig } from '../types';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onComplete: (config: UserConfig) => void;
}

export function GameOnboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [profile, setProfile] = useState<DigitalTwinProfile | null>(null);
  const [userName, setUserName] = useState('');
  const [loadingText, setLoadingText] = useState('INITIALIZING BIO-METRICS...');

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleEnvSelect = (env: Environment) => {
    setEnvironment(env);
    setStep(2);
  };

  const handleProfileSelect = (prof: DigitalTwinProfile) => {
    setProfile(prof);
    setStep(3); // Go to registration step
  };

  const handleRegisterComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4); // Go to loading step
  };

  useEffect(() => {
    if (step === 4) {
      // Simulate booting up process
      const texts = [
        'ESTABLISHING NEURAL LINK...',
        'RENDERING DIGITAL TWIN...',
        'CALIBRATING HAZARD MATRICES...',
        'BOOT SEQUENCE COMPLETE.'
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < texts.length) {
          setLoadingText(texts[i]);
          i++;
        } else {
          clearInterval(interval);
          const finalEnv: Environment = environment || 'residential';
          const finalProfile: DigitalTwinProfile = profile || (finalEnv === 'industrial' ? 'electrician' : 'adult_male');
          onCompleteRef.current({ 
            environment: finalEnv, 
            profile: finalProfile, 
            name: userName.trim() || undefined
          });
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step, environment, profile, userName]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 pb-14 sm:pb-14 bg-[#020617] bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#020617_100%)] overflow-y-auto select-none">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b_1px,transparent_1px),linear-gradient(to_bottom,#64748b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.04] pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center w-full max-w-xl lg:max-w-5xl xl:max-w-6xl p-3 sm:p-6 md:p-8 my-auto"
          >
            <div className="mb-6 sm:mb-8 md:mb-12 text-center">
              <h1 className="text-sm sm:text-sm font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-orange-400 mb-2 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
                <Cpu className="w-5 h-5 sm:w-5 sm:h-5 text-orange-400" /> Module Selection
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wider sm:tracking-widest uppercase">Select Operating Environment</h2>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
              <button
                onClick={() => handleEnvSelect('residential')}
                className="relative flex flex-col items-center justify-center p-5 sm:p-8 md:p-12 overflow-hidden transition-all duration-300 border bg-slate-900/80 border-white/15 rounded-2xl hover:bg-white/10 hover:border-orange-500/60 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] active:scale-[0.98] cursor-pointer min-h-[140px]"
              >
                <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 hidden sm:block">
                  <Home className="w-32 h-32 md:w-48 md:h-48" />
                </div>
                <Home className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-3 sm:mb-4 md:mb-6 text-orange-400" />
                <h3 className="mb-1.5 sm:mb-2 text-xl sm:text-xl md:text-2xl font-black text-white tracking-wider sm:tracking-widest uppercase">Residential</h3>
                <p className="text-xs sm:text-xs font-mono tracking-wide text-center text-slate-300">Home environments, 120V - 240V systems, domestic appliances.</p>
              </button>

              <button
                onClick={() => handleEnvSelect('industrial')}
                className="relative flex flex-col items-center justify-center p-5 sm:p-8 md:p-12 overflow-hidden transition-all duration-300 border bg-slate-900/80 border-white/15 rounded-2xl hover:bg-white/10 hover:border-orange-500/60 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] active:scale-[0.98] cursor-pointer min-h-[140px]"
              >
                <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 hidden sm:block">
                  <Factory className="w-32 h-32 md:w-48 md:h-48" />
                </div>
                <Factory className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-3 sm:mb-4 md:mb-6 text-orange-400" />
                <h3 className="mb-1.5 sm:mb-2 text-xl sm:text-xl md:text-2xl font-black text-white tracking-wider sm:tracking-widest uppercase">Industrial</h3>
                <p className="text-xs sm:text-xs font-mono tracking-wide text-center text-slate-300">Factories, 415V - 11kV systems, heavy machinery, switchgear.</p>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center w-full max-w-xl lg:max-w-5xl xl:max-w-6xl p-3 sm:p-6 md:p-8 my-auto"
          >
            <div className="mb-6 sm:mb-8 md:mb-12 text-center">
              <h1 className="text-sm sm:text-sm font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-orange-400 mb-2 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
                <User className="w-5 h-5 sm:w-5 sm:h-5 text-orange-400" /> Profile Selection
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wider sm:tracking-widest uppercase">Select Digital Twin Persona</h2>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-4">
              {environment === 'residential' && (
                <>
                  <ProfileCard icon={User} title="Adult Male" desc="High body mass" onClick={() => handleProfileSelect('adult_male')} />
                  <ProfileCard icon={Users} title="Adult Female" desc="Medium body mass" onClick={() => handleProfileSelect('adult_female')} />
                  <ProfileCard icon={User} title="Teenager" desc="Developing body" onClick={() => handleProfileSelect('teenager')} />
                  <ProfileCard icon={Users} title="Child" desc="High vulnerability" onClick={() => handleProfileSelect('child')} />
                </>
              )}

              {environment === 'industrial' && (
                <>
                  <ProfileCard icon={HardHat} title="Electrician" desc="Certified PPE" onClick={() => handleProfileSelect('electrician')} />
                  <ProfileCard icon={ShieldCheck} title="Engineer" desc="System designer" onClick={() => handleProfileSelect('engineer')} />
                  <ProfileCard icon={HardHat} title="Technician" desc="Maintenance ops" onClick={() => handleProfileSelect('technician')} />
                  <ProfileCard icon={ShieldCheck} title="Supervisor" desc="Safety oversight" onClick={() => handleProfileSelect('supervisor')} />
                </>
              )}
            </div>

            <button
               onClick={() => setStep(1)}
               className="mt-6 sm:mt-8 md:mt-12 text-xs sm:text-xs font-bold tracking-widest text-slate-300 uppercase hover:text-white transition-colors cursor-pointer py-2 px-4 rounded-lg bg-slate-900/60 border border-slate-800"
            >
              &larr; Back to Environment
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.form
            key="step3"
            onSubmit={handleRegisterComplete}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center w-full max-w-lg p-6 sm:p-8 bg-slate-900/90 border border-white/15 rounded-2xl backdrop-blur-md shadow-2xl my-auto"
          >
            <div className="mb-6 sm:mb-6 text-center">
              <h1 className="text-sm sm:text-sm font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-orange-400 mb-2 flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" /> {environment === 'industrial' ? 'Personnel Log' : 'Player Profile'}
              </h1>
              <h2 className="text-xl sm:text-xl font-black text-white tracking-wider uppercase">
                {environment === 'industrial' ? 'Operator Registration' : 'Welcome'}
              </h2>
              <p className="text-xs sm:text-xs font-mono text-slate-300 uppercase tracking-wider mt-1.5">
                {environment === 'industrial' ? 'Provide credentials for safety qualification certificate' : 'Enter your name to begin'}
              </p>
            </div>

            <div className="w-full space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black tracking-widest text-slate-300 uppercase block">
                  {environment === 'industrial' ? 'Full Operator Name' : 'Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={environment === 'industrial' ? "e.g. ALAN TURING" : "e.g. ALEX"}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/20 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 uppercase tracking-widest min-h-[48px]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-6 py-3.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-sm tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 cursor-pointer min-h-[48px]"
              >
                {environment === 'industrial' ? 'Register & Calibrate \u2192' : 'Start \u2192'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 text-xs font-bold tracking-widest text-slate-400 uppercase hover:text-white transition-colors cursor-pointer"
            >
              &larr; Back to Persona
            </button>
          </motion.form>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center justify-center p-6 text-center my-auto"
          >
            <Activity className="w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8 text-orange-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-[0.2em] uppercase text-center max-w-md">
              {loadingText}
            </h2>
            <div className="w-64 sm:w-80 h-2 mt-6 sm:mt-8 overflow-hidden rounded-full bg-slate-800 border border-slate-700">
              <motion.div 
                className="h-full bg-orange-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Footer Attribution */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-2.5 bg-slate-950/95 border-t border-slate-800 text-center text-[10px] sm:text-[10px] text-white font-black uppercase tracking-widest z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Concept, Visualisation & Engineering: Anil Sharma</span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">designcalculators.co.in</a>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold hover:underline">reliabilitytools.co.in</a>
      </div>
    </div>
  );
}

function ProfileCard({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 transition-all duration-300 border bg-slate-900/80 border-white/15 rounded-2xl hover:bg-white/10 hover:border-orange-500/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98] cursor-pointer min-h-[110px]"
    >
      <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 md:mb-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
      <h3 className="mb-1 sm:mb-2 text-sm sm:text-sm font-black text-white tracking-wider sm:tracking-widest uppercase text-center">{title}</h3>
      <p className="text-xs sm:text-[10px] font-mono tracking-wider text-slate-300 text-center uppercase">{desc}</p>
    </button>
  );
}
