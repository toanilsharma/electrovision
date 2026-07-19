const fs = require('fs');
let file = 'src/components/HazardOverlay.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('playCriticalAlarm')) {
  content = content.replace(/const showOverlay = isActive && dangerLevel !== 'safe';/g,
  `const showOverlay = isActive && dangerLevel !== 'safe';

  useEffect(() => {
    if (showOverlay && dangerLevel === 'critical') {
      let osc: OscillatorNode;
      let gain: GainNode;
      let interval: any;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        
        let high = true;
        interval = setInterval(() => {
          if (high) {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          } else {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          }
          high = !high;
        }, 150);
      } catch (e) {
        // audio context failed
      }
      return () => {
        if (interval) clearInterval(interval);
        try {
          if (gain) {
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
          }
          if (osc) {
            setTimeout(() => osc.stop(), 100);
          }
        } catch (e) {}
      };
    }
  }, [showOverlay, dangerLevel]);`);
  fs.writeFileSync(file, content);
}
console.log("Done");
