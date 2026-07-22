export interface LOTOQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

export const LOTO_QUESTION_BANK: LOTOQuizQuestion[] = [
  {
    id: 1,
    question: "What does LOTO stand for in industrial workplace safety?",
    options: ["Lockout / Tagout", "Load Off / Turn Off", "Lock On / Tag Out", "Line Outage / Total Off"],
    correctAnswer: 0,
    explanation: "LOTO stands for Lockout/Tagout — the mandated safety process of physically locking energy isolation devices and attaching warning tags to prevent unexpected machinery startup.",
    category: "LOTO Basics"
  },
  {
    id: 2,
    question: "Who is authorized under OSHA 1910.147 to remove a worker's personal safety lock?",
    options: ["ONLY the authorized employee who placed it", "The shift supervisor on duty", "The safety manager", "Any licensed electrician"],
    correctAnswer: 0,
    explanation: "Only the authorized worker who placed the lock can remove it. Individual lock ownership guarantees that no one re-energizes equipment while you are working inside.",
    category: "Lock Rules"
  },
  {
    id: 3,
    question: "Which energy type is most commonly involved in industrial LOTO incidents?",
    options: ["Electrical Energy", "Hydraulic Pressure", "Pneumatic Compressed Air", "Thermal Energy"],
    correctAnswer: 0,
    explanation: "Electrical energy accounts for the majority of LOTO incidents, though all energy forms (mechanical, hydraulic, pneumatic, thermal, chemical) must be controlled.",
    category: "Hazardous Energy"
  },
  {
    id: 4,
    question: "What is the very LAST step of the standard 6-step LOTO procedure before work begins?",
    options: ["Zero Energy Verification", "Applying personal locks", "Bleeding pneumatic lines", "Notifying affected employees"],
    correctAnswer: 0,
    explanation: "Verification (Step 6) tests that isolation is 100% effective using instruments and start attempts before touching any components.",
    category: "LOTO Steps"
  },
  {
    id: 5,
    question: "When is a warning tag ALONE permitted without a physical lock?",
    options: ["Only when an energy isolation device cannot physically accept a lock", "Whenever a supervisor signs off", "If the job takes less than 15 minutes", "Tags are always equivalent to locks"],
    correctAnswer: 0,
    explanation: "OSHA allows tagout-only ONLY if the isolation device cannot physically accommodate a lock. If a lock can be applied, a lock MUST be used.",
    category: "Lock Rules"
  },
  {
    id: 6,
    question: "What is the primary function of a Lockout Hasp (Group Lockout Hasp)?",
    options: ["To allow multiple workers to place individual padlocks on a single energy control device", "To lock toolboxes shut", "To hang warning signs on doors", "To store extra keys"],
    correctAnswer: 0,
    explanation: "A hasp has 6 holes so every technician working on the system can attach their own lock. Power cannot be restored until every single lock is removed.",
    category: "LOTO Tools"
  },
  {
    id: 7,
    question: "What does 'Stored Energy' in machine LOTO refer to?",
    options: ["Residual electrical charge, air/hydraulic pressure, compressed springs, or gravity loads", "Fuel stored in gas cans", "Battery power banks in offices", "Solar panels on roof"],
    correctAnswer: 0,
    explanation: "Stored or residual energy remains trapped inside capacitors, air tanks, hydraulic lines, elevated counterweights, or mechanical springs after power is switched off.",
    category: "Hazardous Energy"
  },
  {
    id: 8,
    question: "Why must pneumatic air lines be bled to zero PSI during LOTO Step 5?",
    options: ["Trapped compressed air can violently discharge actuators or blow air hoses off fittings during repair", "Air lines rust if left pressurized", "Compressed air wastes electricity", "To clean the pressure gauge"],
    correctAnswer: 0,
    explanation: "Residual pneumatic pressure can trigger sudden cylinder movement or hose whip injuries if not safely bled to zero pressure.",
    category: "Stored Energy"
  },
  {
    id: 9,
    question: "What should you do before using a multimeter to verify zero electrical voltage?",
    options: ["Perform a 3-point test: check meter on known live source, test target circuit, re-test meter on live source", "Blow on meter probes", "Calibrate meter screen brightness", "Touch probes together"],
    correctAnswer: 0,
    explanation: "The 3-point test ensures your meter and internal fuse are working properly before and after probing the de-energized target line.",
    category: "Verification"
  },
  {
    id: 10,
    question: "Who is defined as an 'Affected Employee' under OSHA LOTO regulations?",
    options: ["An employee whose job requires operating equipment on which LOTO servicing is performed", "The safety director who writes policies", "An electrician applying locks", "A contractor outside the plant"],
    correctAnswer: 0,
    explanation: "Affected employees operate or use the machines being serviced. They must be notified before LOTO starts and after it is completed.",
    category: "Roles & Training"
  },
  {
    id: 11,
    question: "Why should you NEVER use another worker's LOTO padlock key?",
    options: ["Each lock must be uniquely keyed so only the authorized owner controls their safety isolation", "Keys look different", "Locks will jam", "It violates tool room inventory"],
    correctAnswer: 0,
    explanation: "One worker, one lock, one key is the core rule preventing accidental power restoration while a technician is inside equipment.",
    category: "Lock Rules"
  },
  {
    id: 12,
    question: "What color is standard OSHA LOTO Danger Tags universally required to feature?",
    options: ["High-visibility Red, Black, and White with 'DANGER - DO NOT OPERATE'", "Bright Neon Yellow only", "Solid Green", "Blue and Silver"],
    correctAnswer: 0,
    explanation: "OSHA mandates high-contrast red/white/black Danger tags that clearly state 'DANGER - DO NOT OPERATE' with worker contact info.",
    category: "LOTO Tools"
  },
  {
    id: 13,
    question: "What is the first step in restoring equipment to normal operation after LOTO maintenance?",
    options: ["Inspect work area, ensure guards are replaced, tools removed, and personnel clear", "Remove all personal locks immediately", "Turn on main breaker switch", "Notify accounting"],
    correctAnswer: 0,
    explanation: "Before removing locks, the work area must be checked to ensure all tools and spare parts are cleared and all workers are out of danger zones.",
    category: "LOTO Steps"
  },
  {
    id: 14,
    question: "What is the danger of relying on control circuit switches (like E-stops or selector switches) for LOTO?",
    options: ["Control circuits can fail electronically or short out, re-energizing the machine unexpectedly", "Switches are hard to push", "E-stops burn out fuses", "Buttons rust outdoors"],
    correctAnswer: 0,
    explanation: "LOTO requires isolating PRIMARY energy switches (disconnect switches, circuit breakers, main valves), not software or control pushbuttons.",
    category: "Isolation"
  },
  {
    id: 15,
    question: "How long should high-voltage capacitors in industrial drives be allowed to bleed down before opening covers?",
    options: ["Wait the full manufacturer specified discharge time (typically 5 to 10 minutes) and test voltage", "Open cover instantly", "1 second", "No waiting needed"],
    correctAnswer: 0,
    explanation: "VFD DC bus capacitors store up to 800V DC. Bleed-down resistors require several minutes to safely reduce charge to 0V.",
    category: "Stored Energy"
  },
  {
    id: 16,
    question: "What action must be taken if a LOTO device breaks or fails during maintenance?",
    options: ["Stop work immediately, replace isolation lock/tag, and re-verify zero energy state", "Keep working quickly", "Wrap duct tape around the lock", "Ignore it if nobody is looking"],
    correctAnswer: 0,
    explanation: "Any compromised LOTO protection invalidates safe work conditions. Re-establish positive isolation immediately.",
    category: "Emergency Actions"
  },
  {
    id: 17,
    question: "What is a 'Group Lockbox' (Key Lockout Box) used for in complex plant turnarounds?",
    options: ["Equipment isolation keys are locked inside the box, and every team member places their lock on the box handle", "To store extra padlocks", "To hold blueprints", "To lock up mobile phones"],
    correctAnswer: 0,
    explanation: "In group LOTO, equipment keys are placed in a lockbox. No one can access equipment keys until every worker removes their lock from the box.",
    category: "LOTO Tools"
  },
  {
    id: 18,
    question: "What type of device is required to block mechanical gravity hazards (like raised press rams)?",
    options: ["Certified mechanical safety blocks, pins, or chains capable of supporting the full weight", "Cardboard boxes", "Wooden broomsticks", "Plastic zip ties"],
    correctAnswer: 0,
    explanation: "Gravitational hazards require rated mechanical blocks or locking pins to prevent heavy rams or counterweights from falling.",
    category: "Stored Energy"
  },
  {
    id: 19,
    question: "What should be written on a LOTO Danger Tag?",
    options: ["Authorized worker name, date, department, equipment ID, and reason for lockout", "Company slogan", "Equipment price", "General warning only"],
    correctAnswer: 0,
    explanation: "Tags must identify the authorized worker, date applied, contact details, and reason so everyone knows who controls the lock.",
    category: "LOTO Tools"
  },
  {
    id: 20,
    question: "Why must hydraulic systems be de-pressurized and thermal systems cooled down in LOTO Step 5?",
    options: ["High pressure fluid spray can cause skin injection injuries, and hot steam causes severe thermal burns", "Oil leaks smell bad", "Cooling makes pipes shrink", "Hydraulic fluid loses color"],
    correctAnswer: 0,
    explanation: "High-pressure hydraulic oil can penetrate skin (fluid injection injury), while un-vented thermal lines burst under heat expansion.",
    category: "Stored Energy"
  },
  {
    id: 21,
    question: "What is the requirement for LOTO padlocks regarding color and appearance?",
    options: ["LOTO padlocks must be standardized in color, shape, or size and designated ONLY for energy control", "Any random lock from home", "Combination luggage locks", "Bicycle chain locks"],
    correctAnswer: 0,
    explanation: "OSHA requires LOTO locks to be standardized within the facility and strictly reserved for safety lockout (never for lockers or toolboxes).",
    category: "Lock Rules"
  },
  {
    id: 22,
    question: "What is the procedure if a shift change occurs while equipment is still locked out?",
    options: ["Incoming workers place their locks before outgoing workers remove theirs (orderly transition)", "Leave the machine unlocked for 30 minutes", "Cut off old locks", "Leave without locking"],
    correctAnswer: 0,
    explanation: "Shift overlap procedures guarantee continuous LOTO protection without leaving equipment unlocked at any time.",
    category: "Roles & Training"
  },
  {
    id: 23,
    question: "What is the minimum requirement for an employee to be classified as an 'Authorized Employee'?",
    options: ["Comprehensive formal training on LOTO regulations, hazard identification, energy isolation, and practical evaluation", "Wearing a hard hat", "Working at the company for 1 week", "Having a multimeter"],
    correctAnswer: 0,
    explanation: "Authorized employees undergo rigorous training to recognize energy types, isolation methods, and mandatory LOTO steps.",
    category: "Roles & Training"
  },
  {
    id: 24,
    question: "Why should electrical circuit disconnect levers be operated using the 'Left-Hand Rule' while standing to the side?",
    options: ["To keep your body out of the direct line of fire in case of an arc flash blast inside the panel", "To practice left-hand coordination", "Because handles are on the left", "It is easier to push"],
    correctAnswer: 0,
    explanation: "Standing to the side and operating disconnect switches with the far hand prevents face and chest exposure to potential arc blast doors blowing open.",
    category: "Safety Protocols"
  },
  {
    id: 25,
    question: "What is an Energy Isolating Device?",
    options: ["A mechanical device that physically prevents the transmission or release of energy (e.g. circuit breaker, disconnect switch, line valve)", "A software password", "A digital remote control", "A fuse cover"],
    correctAnswer: 0,
    explanation: "Energy isolating devices physically sever electrical, hydraulic, or pneumatic power connections.",
    category: "Isolation"
  },
  {
    id: 26,
    question: "Why is placing a lock on a circuit breaker handle better than using a push button stop?",
    options: ["A lock physically blocks the mechanical movement of breaker contacts, ensuring positive power separation", "Padlocks look more professional", "Push buttons are small", "Breakers are quiet"],
    correctAnswer: 0,
    explanation: "Breaker locks provide physical mechanical blocking, preventing any possibility of electrical current flow.",
    category: "Lock Rules"
  },
  {
    id: 27,
    question: "What must be done if an energy isolation valve has no built-in locking mechanism?",
    options: ["Install a specialized valve lockout cover or chain and padlock to secure the valve wheel/lever", "Tie rope around it", "Post a paper note", "Leave a worker standing by"],
    correctAnswer: 0,
    explanation: "Commercial valve lockout devices (ball valve clamps, gate valve covers, cable lockouts) adapt non-lockable valves for padlocks.",
    category: "LOTO Tools"
  },
  {
    id: 28,
    question: "During LOTO Step 6 (Verification), what should you attempt after testing zero voltage?",
    options: ["Press the local machine start button to confirm it will NOT start, then return switch to OFF", "Turn on main power to test", "Leave start button ON", "Remove personal lock"],
    correctAnswer: 0,
    explanation: "Attempting a normal start proves the isolation is effective. Always return control switches to OFF afterwards.",
    category: "Verification"
  },
  {
    id: 29,
    question: "What is the penalty under OSHA for willful failure to implement Lockout/Tagout procedures?",
    options: ["Fines exceeding $150,000 per violation and potential criminal prosecution for fatalities", "A verbal warning", "$50 fine", "1 hour of retraining"],
    correctAnswer: 0,
    explanation: "OSHA strictly enforces LOTO violations due to severe risk of life, handing down maximum statutory penalties for willful non-compliance.",
    category: "Regulations"
  },
  {
    id: 30,
    question: "What is required before contractor workers perform maintenance on your facility machinery?",
    options: ["Facility management and contractor must exchange and align their respective LOTO procedures", "Contractors work without LOTO", "Contractors use home locks", "No coordination needed"],
    correctAnswer: 0,
    explanation: "OSHA 1910.147(f)(2) requires mutual coordination so both host facility workers and contractor staff understand all lockout steps.",
    category: "Roles & Training"
  },
  {
    id: 31,
    question: "What is 'Complex LOTO' in industrial plants?",
    options: ["Lockout involving multiple energy sources, multiple crews, multiple shifts, or complex interlocks", "Locking a single light switch", "Changing a desk lamp", "Using a key fob"],
    correctAnswer: 0,
    explanation: "Complex LOTO requires written master execution plans, group lockboxes, and designated LOTO leads to coordinate isolation.",
    category: "LOTO Basics"
  },
  {
    id: 32,
    question: "What device is used to secure multi-phase high-voltage plug connectors during LOTO?",
    options: ["Plug lockout enclosure box that encloses the plug prongs and accepts a padlock", "Electrical tape", "Cardboard tube", "Plastic bag"],
    correctAnswer: 0,
    explanation: "Plug lockout boxes enclose electrical plugs so they cannot be inserted into wall receptacles or industrial sockets.",
    category: "LOTO Tools"
  },
  {
    id: 33,
    question: "Why should you never use a key-retaining lock for non-LOTO purposes?",
    options: ["Key-retaining locks prevent key removal while the shackle is open, ensuring the lock stays secured when in use", "They are too heavy", "They cost more", "Keys are small"],
    correctAnswer: 0,
    explanation: "LOTO locks feature key-retaining cylinders so authorized workers cannot accidentally walk away leaving locks unfastened.",
    category: "Lock Rules"
  },
  {
    id: 34,
    question: "What is the purpose of periodic annual LOTO inspections mandated by OSHA?",
    options: ["To audit LOTO procedures, verify employee compliance, and correct any deficiencies", "To paint lock boxes", "To count toolboxes", "To clean machinery"],
    correctAnswer: 0,
    explanation: "OSHA requires annual audits of every energy control procedure by an inspector other than the ones utilizing the procedure.",
    category: "Regulations"
  },
  {
    id: 35,
    question: "What should you do if an electrical breaker handle trips to the 'CENTER' position during LOTO verification?",
    options: ["The breaker tripped on fault! Do NOT reclose — investigate short circuits before resetting", "Force it ON immediately", "Tape handle to ON", "Ignore it"],
    correctAnswer: 0,
    explanation: "A tripped breaker signals an active short circuit or overload fault. Forcing it closed can spark an arc flash blast.",
    category: "Emergency Actions"
  },
  {
    id: 36,
    question: "Why must thermal energy (hot steam, pipes) be allowed to cool during LOTO Step 5?",
    options: ["Trapped hot fluids expand and cause severe thermal burns if lines are opened while hot", "Cold pipes look cleaner", "Heat turns metal green", "To save HVAC power"],
    correctAnswer: 0,
    explanation: "Cooling prevents thermal expansion pressure spikes and protects technicians from contact burns when opening flanges.",
    category: "Stored Energy"
  },
  {
    id: 37,
    question: "What is the correct procedure for emergency lock removal if an employee leaves the plant with their lock attached?",
    options: ["Follow strict documented supervisor override protocol: verify worker left, contact worker, inspect machine, supervisor approves", "Cut lock with bolt cutters immediately without asking", "Break breaker handle", "Leave machine running"],
    correctAnswer: 0,
    explanation: "Emergency lock removal requires rigorous verification that the worker is safe and off-site, with mandatory documented supervisor approval.",
    category: "Emergency Actions"
  },
  {
    id: 38,
    question: "What color code indicates 'Equipment De-energized & Verified Safe' on industrial status displays?",
    options: ["Green (or open contacts indicator)", "Flashing Red", "Bright Yellow", "Purple"],
    correctAnswer: 0,
    explanation: "Green indicators signal open circuit / de-energized condition, while Red indicates live / energized status.",
    category: "Verification"
  },
  {
    id: 39,
    question: "What is the difference between a Lockout Device and a Tagout Device?",
    options: ["Lockout devices physically prevent energization; Tagout devices provide prominent visual warnings only", "Locks carry contact info", "Tags hold keys", "No difference"],
    correctAnswer: 0,
    explanation: "Locks provide physical restraint, while tags are warning devices that must be paired with locks whenever feasible.",
    category: "LOTO Basics"
  },
  {
    id: 40,
    question: "Why should grounding cluster cables be applied during high-voltage substation LOTO?",
    options: ["To create a solid low-resistance path to earth, tripping breakers if lines accidentally re-energize", "To ground static electricity only", "To hold cables straight", "To decorate switchgear"],
    correctAnswer: 0,
    explanation: "Temporary protective grounding leads ensure zero potential and trip upstream breakers if lines are re-energized remotely.",
    category: "Isolation"
  },
  {
    id: 41,
    question: "What is the safe procedure when applying a cable lockout device through multiple valve handwheels?",
    options: ["Pull cable tight through all handwheels, cinch with cable clamp, and attach padlock", "Wrap loose rope around valves", "Use plastic tape", "Tie wire in knots"],
    correctAnswer: 0,
    explanation: "Cable lockout devices feature steel cables that loop through multiple valves or handles, cinching tight under a single lock.",
    category: "LOTO Tools"
  },
  {
    id: 42,
    question: "What is the golden rule of electrical LOTO before touching any wire?",
    options: ["TEST BEFORE TOUCH — verify zero voltage with a calibrated meter", "Assume wires are safe if breaker is off", "Touch with back of hand", "Smell wire insulation"],
    correctAnswer: 0,
    explanation: "Never assume a line is dead! Always test with a verified meter before making contact with conductors.",
    category: "Verification"
  },
  {
    id: 43,
    question: "Why should LOTO padlocks have durable steel or brass shackles?",
    options: ["To withstand force, environmental corrosion, and prevent easy cutting", "To look shiny", "To add weight", "Because steel is magnetic"],
    correctAnswer: 0,
    explanation: "Heavy-duty shackles prevent accidental breakage or tampering under industrial working conditions.",
    category: "Lock Rules"
  },
  {
    id: 44,
    question: "What should be done with energy isolation keys during a multi-person maintenance job?",
    options: ["Keys stay locked inside a group lockbox until every worker removes their individual lock", "Put keys in operator's pocket", "Leave keys in lock cylinder", "Hang keys on wall"],
    correctAnswer: 0,
    explanation: "Group lockboxes hold isolation keys secure until every single technician has finished work and removed their personal lock.",
    category: "LOTO Tools"
  },
  {
    id: 45,
    question: "Why must blind flanges ('pancakes') be inserted into chemical pipes during chemical line LOTO?",
    options: ["To provide 100% positive physical barrier against hazardous chemical leaks through valves", "To clean pipe interiors", "To adjust flow rate", "To reduce pipe noise"],
    correctAnswer: 0,
    explanation: "Valves can leak internally. Inserting solid steel blind flanges creates absolute physical separation for chemical safety.",
    category: "Isolation"
  },
  {
    id: 46,
    question: "What action is required if an equipment modification changes energy isolation points?",
    options: ["Update the written LOTO procedure document and retrain authorized personnel immediately", "Keep using old document", "Rely on memory", "Ignore changes"],
    correctAnswer: 0,
    explanation: "LOTO machine-specific procedures must be kept 100% accurate. Any equipment change requires immediate document updates.",
    category: "Regulations"
  },
  {
    id: 47,
    question: "What is the function of a Circuit Breaker Lockout Pin/Clamp?",
    options: ["Clamps onto the miniature circuit breaker handle, preventing the toggle from switching to ON", "Prevents wire theft", "Measures breaker current", "Dims panel lights"],
    correctAnswer: 0,
    explanation: "Breaker pin/clamp devices grip the toggle handle tightly, featuring a lock hole to prevent turning power ON.",
    category: "LOTO Tools"
  },
  {
    id: 48,
    question: "Why should you never leave an un-tagged lock on an industrial breaker panel?",
    options: ["Without a tag, coworkers cannot identify who applied the lock or why, causing confusion and delays", "Locks turn black without tags", "Tags make locks heavier", "It is proper etiquette"],
    correctAnswer: 0,
    explanation: "Tags specify WHO placed the lock and WHY. Un-tagged locks create safety risks and unauthorized removal attempts.",
    category: "LOTO Tools"
  },
  {
    id: 49,
    question: "What is the purpose of testing equipment controls in Step 6 (Verification)?",
    options: ["To confirm local controls are de-energized and cannot trigger machine motion", "To warm up motor windings", "To test button spring tension", "To clear digital memory"],
    correctAnswer: 0,
    explanation: "Attempting to start equipment confirms power is isolated and no hidden backup power circuits remain connected.",
    category: "Verification"
  },
  {
    id: 50,
    question: "What is the ultimate goal of the OSHA 1910.147 Lockout/Tagout Standard?",
    options: ["To protect workers from unexpected energy releases and eliminate fatalities during maintenance", "To audit electric meters", "To increase machine speed", "To organize tool sheds"],
    correctAnswer: 0,
    explanation: "LOTO standards exist to guarantee every industrial worker returns home safely to their family at the end of every shift.",
    category: "LOTO Basics"
  }
];
