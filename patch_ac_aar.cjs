const fs = require('fs');
let content = fs.readFileSync('src/components/Simulators/ACShockSimulator.tsx', 'utf8');

const stateVars = `
  const [showAAR, setShowAAR] = useState(false);
  const [lastReport, setLastReport] = useState<IncidentReport | null>(null);
`;
content = content.replace(/const \[isPPESafe, setIsPPESafe\] = useState\(false\);/, 'const [isPPESafe, setIsPPESafe] = useState(false);\n' + stateVars);

const aarEffect = `
  const prevSimulating = React.useRef(isSimulating);
  React.useEffect(() => {
    if (prevSimulating.current && !isSimulating && hasSimulated) {
      if (results.level >= 6 || (!isPPESafe && results.level >= 3)) {
        setLastReport({
          hazardType: 'AC Electrical Shock',
          severity: results.severity,
          intensity: results.intensity,
          ppeWorn: isPPESafe,
          fatal: results.level >= 8,
          description: results.level >= 8 ? 'Lethal Ventricular Fibrillation occurred due to extended exposure above threshold C2. Severe tissue burning at entry/exit points.' : 'Muscle tetanization and possible respiratory distress observed. Patient requires immediate medical evaluation.',
          preventativeMeasures: [
            'De-energize equipment before working (LOTO)',
            'Verify isolation using a rated test instrument',
            'Wear appropriately rated insulating gloves (ASTM D120)',
            'Use dielectric footwear in industrial environments'
          ]
        });
        setShowAAR(true);
      }
    }
    prevSimulating.current = isSimulating;
  }, [isSimulating, hasSimulated, results, isPPESafe]);
`;

content = content.replace(/const results = calculateResults\(\);/, 'const results = calculateResults();\n' + aarEffect);

const renderAAR = `
      {showAAR && lastReport && <AfterActionReportModal report={lastReport} onClose={() => setShowAAR(false)} />}
    </motion.div>
`;
content = content.replace(/<\/motion\.div>/, renderAAR);

fs.writeFileSync('src/components/Simulators/ACShockSimulator.tsx', content);
console.log("Patched AC AAR");
