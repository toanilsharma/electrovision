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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#020617] bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#020617_100%)]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b_1px,transparent_1px),linear-gradient(to_bottom,#64748b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]"></div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center w-full max-w-md lg:max-w-5xl xl:max-w-6xl p-4 sm:p-8"
          >
            <div className="mb-12 text-center">
              <h1 className="text-sm font-black tracking-[0.3em] uppercase text-orange-500 mb-4 flex items-center justify-center gap-3">
                <Cpu className="w-5 h-5" /> Module Selection
              </h1>
              <h2 className="text-4xl font-black text-white tracking-widest uppercase">Select Operating Environment</h2>
            </div>

            <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
              <button
                onClick={() => handleEnvSelect('residential')}
                className="relative flex flex-col items-center justify-center p-12 overflow-hidden transition-all duration-300 border bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
                  <Home className="w-48 h-48" />
                </div>
                <Home className="w-16 h-16 mb-6 text-orange-400" />
                <h3 className="mb-2 text-2xl font-black text-white tracking-widest uppercase">Residential</h3>
                <p className="text-xs font-mono tracking-wide text-center text-slate-400">Home environments, 120V - 240V systems, domestic appliances.</p>
              </button>

              <button
                onClick={() => handleEnvSelect('industrial')}
                className="relative flex flex-col items-center justify-center p-12 overflow-hidden transition-all duration-300 border bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
                  <Factory className="w-48 h-48" />
                </div>
                <Factory className="w-16 h-16 mb-6 text-orange-400" />
                <h3 className="mb-2 text-2xl font-black text-white tracking-widest uppercase">Industrial</h3>
                <p className="text-xs font-mono tracking-wide text-center text-slate-400">Factories, 415V - 11kV systems, heavy machinery, switchgear.</p>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center w-full max-w-md lg:max-w-5xl xl:max-w-6xl p-4 sm:p-8"
          >
            <div className="mb-12 text-center">
              <h1 className="text-sm font-black tracking-[0.3em] uppercase text-orange-500 mb-4 flex items-center justify-center gap-3">
                <User className="w-5 h-5" /> Profile Selection
              </h1>
              <h2 className="text-4xl font-black text-white tracking-widest uppercase">Select Digital Twin Persona</h2>
            </div>

            <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-4">
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
               className="mt-12 text-xs font-bold tracking-widest text-slate-400 uppercase hover:text-white"
            >
              &larr; Back to Environment
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.form
            key="step3"
            onSubmit={handleRegisterComplete}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center w-full max-w-md p-8 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl"
          >
            <div className="mb-6 text-center">
              <h1 className="text-sm font-black tracking-[0.3em] uppercase text-orange-500 mb-2 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {environment === 'industrial' ? 'Personnel Log' : 'Player Profile'}
              </h1>
              <h2 className="text-xl font-black text-white tracking-wider uppercase">
                {environment === 'industrial' ? 'Operator Registration' : 'Welcome'}
              </h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                {environment === 'industrial' ? 'Provide credentials for safety qualification certificate' : 'Enter your name to begin'}
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase block">
                  {environment === 'industrial' ? 'Full Operator Name' : 'Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={environment === 'industrial' ? "e.g. ALAN TURING" : "e.g. ALEX"}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 uppercase tracking-widest"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs tracking-widest uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95"
              >
                {environment === 'industrial' ? 'Register & Calibrate \u2192' : 'Start \u2192'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 text-[9px] font-bold tracking-widest text-slate-500 uppercase hover:text-white transition-colors"
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
            className="relative z-10 flex flex-col items-center justify-center px-4"
          >
            <Activity className="w-24 h-24 mb-8 text-orange-500 animate-pulse" />
            <h2 className="text-2xl font-black font-mono text-white tracking-[0.2em] uppercase text-center">
              {loadingText}
            </h2>
            <div className="w-64 h-1 mt-8 overflow-hidden rounded-full bg-white/10">
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
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-slate-950/90 border-t border-slate-800 text-center text-[10px] text-white font-black uppercase tracking-widest z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Concept, Visualisation & Engineering: Anil Sharma</span>
        <span className="text-slate-600">|</span>
        <a href="https://designcalculators.co.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">designcalculators.co.in</a>
        <span className="text-slate-600">|</span>
        <a href="https://reliabilitytools.co.in" target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold hover:underline">reliabilitytools.co.in</a>
      </div>
    </div>
  );
}

function ProfileCard({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-8 transition-all duration-300 border bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] group"
    >
      <Icon className="w-12 h-12 mb-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
      <h3 className="mb-2 text-sm font-black text-white tracking-widest uppercase text-center">{title}</h3>
      <p className="text-[10px] font-mono tracking-wider text-slate-500 text-center uppercase">{desc}</p>
    </button>
  );
}
