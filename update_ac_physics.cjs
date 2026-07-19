const fs = require('fs');

let content = fs.readFileSync('src/components/Simulators/ACShockSimulator.tsx', 'utf8');

const newPhysics = `
  // Exact IEC 60479-1 C1 Curve Approximation (Fibrillation Threshold)
  const getC1Threshold = (tMs: number) => {
    const table = [
      [0, 200], [10, 200], [20, 150], [50, 100], [100, 70], [200, 50], [500, 40], [1000, 30], [10000, 30]
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
    return 30;
  };

  const calculateResults = () => {
    const { r, heartFactor } = getResistance();
    const currentAmp = voltage / r;
    const currentMA = currentAmp * 1000;
    const effectiveHeartCurrent = currentMA * heartFactor; // I_eq
    
    if (!isSimulating) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE (NO CONTACT)', intensity: 0, heartFactor };
    }
    if (isPPESafe) { 
       return { currentMA: 0, effectiveHeartCurrent: 0, r, level: 0 as ShockEffectLevel, severity: 'SAFE: PPE INSULATION ACTIVE', intensity: 0, heartFactor };
    }
    
    let level: ShockEffectLevel = 1;
    let severity = 'AC-1 (Perception)';
    
    const c1 = getC1Threshold(duration);
    const c2 = c1 * 1.5; // Roughly Curve C2
    const c3 = c1 * 2.5; // Roughly Curve C3
    
    if (effectiveHeartCurrent > 0.5) { level = 2; severity = 'AC-2 (Involuntary Contractions)'; }
    if (effectiveHeartCurrent > 10) { level = 3; severity = 'AC-3 (Let-go impossible, cramping)'; }
    
    if (duration > 0) {
       if (effectiveHeartCurrent > c1) { level = 7; severity = 'AC-4.1 (<5% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c2) { level = 8; severity = 'AC-4.2 (<50% V-Fib Prob)'; }
       if (effectiveHeartCurrent > c3) { level = 9; severity = 'AC-4.3 (>50% V-Fib Prob)'; }
    }
    
    // I^2t specific energy in A^2s for tissue damage visualization
    const i2t = Math.pow(currentAmp, 2) * (duration / 1000);
    
    // Compute a continuous intensity 0-1 based on actual physical values
    // Current contribution: 0-0.5 up to 100mA
    const intensityCurrent = Math.min(effectiveHeartCurrent / 100, 1) * 0.5;
    // Energy contribution: 0-0.5 based on heating (0.05 A^2s starts showing burns)
    const intensityEnergy = Math.min(i2t / 0.05, 1) * 0.5;
    
    const intensity = Math.min(intensityCurrent + intensityEnergy, 1.0);
    
    return { currentMA, effectiveHeartCurrent, r, level, severity, intensity, heartFactor };
  };
`;

content = content.replace(/const calculateResults = \(\) => \{[\s\S]*?return \{ currentMA, effectiveHeartCurrent, r, level, severity, intensity, heartFactor \};\n  \};/, newPhysics.trim());

fs.writeFileSync('src/components/Simulators/ACShockSimulator.tsx', content);
console.log("Updated AC physics");
