const fs = require('fs');

let content = fs.readFileSync('src/components/Simulators/DCShockSimulator.tsx', 'utf8');

const newPhysics = `
  // Exact IEC 60479-1 DC Curve Approximation (Fibrillation Threshold for DC)
  // DC C1 threshold is much higher than AC (roughly 3-4x)
  const getC1Threshold = (tMs: number) => {
    const table = [
      [0, 800], [10, 800], [20, 600], [50, 400], [100, 280], [200, 200], [500, 160], [1000, 120], [10000, 120]
    ];
    if (tMs <= table[0][0]) return table[0][1];
    if (tMs >= table[table.length - 1][0]) return table[table.length - 1][1];
    for (let i = 0; i < table.length - 1; i++) {
      if (tMs >= table[i][0] && tMs <= table[i+1][0]) {
        const t1 = table[i][0];
        const i1 = table[i][1];
        const t2 = table[i+1][0];
        const i2 = table[i+1][1];
        return i1 + ((tMs - t1) / (t2 - t1)) * (i2 - i1);
      }
    }
    return 120;
  };

  const calculateResults = () => {
    const { r, heartFactor } = getResistance();
    const currentAmp = voltage / r;
    const currentMA = currentAmp * 1000;
    const effectiveHeartCurrent = currentMA * heartFactor;
    
    if (!isSimulating) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE (NO CONTACT)', intensity: 0, heartFactor };
    }
    if (isPPESafe) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE: PPE INSULATION ACTIVE', intensity: 0, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'DC-1 (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5; // Roughly Curve C2
    const c3 = c1 * 2.5; // Roughly Curve C3
    
    if (effectiveHeartCurrent > 2) { level = 2; severity = 'DC-2 (Involuntary Contractions)'; }
    // DC doesn't have a let-go threshold in the same way, but muscular reactions become severe
    if (effectiveHeartCurrent > 30) { level = 3; severity = 'DC-3 (Strong muscular reactions)'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'DC-4.1 (<5% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'DC-4.2 (<50% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'DC-4.3 (>50% V-Fib Prob)'; }
    }
    
    // I^2t specific energy in A^2s for tissue damage visualization
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    
    // Compute a continuous intensity 0-1 based on actual physical values
    // DC requires more current for similar severity feeling
    const intensityCurrent = Math.min(effectiveHeartCurrent / 300, 1) * 0.5;
    // Energy contribution: 0-0.5 based on heating (0.05 A^2s starts showing burns)
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, level, severity, intensity, heartFactor };
  };
`;

content = content.replace(/const calculateResults = \(\) => \{[\s\S]*?return \{ currentMA, effectiveHeartCurrent, r, level, severity, intensity, heartFactor \};\n  \};/, newPhysics.trim());

fs.writeFileSync('src/components/Simulators/DCShockSimulator.tsx', content);
console.log("Updated DC physics");
