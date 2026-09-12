/**
 * homeguardSimpleContent.ts
 * 
 * Educational Content for HomeGuard Simple Mode:
 * - 6 Micro-Lessons with Metaphors, 3-Emoji Quizzes (😀 safe / 😲 risky / 🚨 danger), and Badges
 * - 5 3-Act Guided Stories (Setup -> Danger -> Save/Lesson) with strict kid animation grammar
 * - One-Line Family Rule Pictogram Strips (Zero paragraphs)
 * - 3-Beat WHAT-JUST-HAPPENED Pictogram Summaries
 */

export interface EmojiQuizQuestion {
  id: string;
  prompt: string; // <= 12 words
  options: {
    emoji: '😀' | '😲' | '🚨';
    label: string;
    isCorrect: boolean;
    feedback: string; // <= 12 words
  }[];
}

export interface MicroLesson {
  id: string;
  badgeId: string;
  badgeEmoji: string;
  badgeTitle: string;
  badgeDesc: string;
  lessonTitle: string;
  metaphorName: string;
  metaphorTagline: string; // <= 12 words
  threeBeatStory: [
    { beatTitle: string; text: string; icon: string },
    { beatTitle: string; text: string; icon: string },
    { beatTitle: string; text: string; icon: string }
  ];
  familyRulePictogram: {
    iconA: string;
    labelA: string;
    iconB: string;
    labelB: string;
    iconC?: string;
    labelC?: string;
    resultEmoji: '😀' | '🚨';
    resultLabel: string;
    spokenRule: string; // <= 12 words
  };
  quiz: EmojiQuizQuestion;
}

export interface ScenarioAct {
  actNumber: 1 | 2 | 3;
  actTitle: 'Setup' | 'Danger' | 'Save & Lesson';
  /** Sentence <= 12 words, verb-first */
  narrationLine: string;
  speechText: string;
  actionButtonLabel: string;
  soundCue: 'sizzle' | 'zap' | 'click' | 'cheer' | 'heartbeat';
  visualEffect: 'water_pipe' | 'thermo_dial' | 'zap_blackout' | 'race_lane' | 'cracked_road';
  targetElement: 'heater' | 'socket' | 'child' | 'db_box' | 'action_button';
  pictogramBeat: { icon: string; caption: string };
}

export interface ThreeActScenario {
  id: string;
  scenarioId: string;
  presetId: string;
  title: string;
  emoji: string;
  summaryLine: string; // <= 12 words
  familyRule: {
    stripIcons: string[];
    resultEmoji: '😀' | '🚨';
    caption: string;
  };
  whatJustHappenedBeats: [
    { icon: string; label: string },
    { icon: string; label: string },
    { icon: string; label: string }
  ];
  whatJustHappenedSpoken: string; // <= 12 words
  acts: [ScenarioAct, ScenarioAct, ScenarioAct];
}

// ── 6 MICRO-LESSONS ──
export const HOMEGUARD_MICRO_LESSONS: MicroLesson[] = [
  {
    id: 'lesson_water_pipe',
    badgeId: 'badge_water',
    badgeEmoji: '💧',
    badgeTitle: 'Water Explorer',
    badgeDesc: 'Mastered current flow through closed pipes!',
    lessonTitle: 'The Water Pipe River',
    metaphorName: 'Water-Pipes Current',
    metaphorTagline: 'Watch electricity flow like smooth water in a clear pipe.',
    threeBeatStory: [
      { beatTitle: '1. The Loop', text: 'Pump pushes water through a round garden hose.', icon: '🔄' },
      { beatTitle: '2. The Wheel', text: 'Flowing water spins the waterwheel smoothly.', icon: '⚙️' },
      { beatTitle: '3. Return Home', text: 'Every single drop returns back to the pump.', icon: '🏠' }
    ],
    familyRulePictogram: {
      iconA: '💧',
      labelA: 'Water Puddle',
      iconB: '🔌',
      labelB: 'Wall Plug',
      resultEmoji: '🚨',
      resultLabel: 'DANGER',
      spokenRule: 'Keep water splashes far away from electric wall sockets.'
    },
    quiz: {
      id: 'quiz_water',
      prompt: 'A water puddle spills onto an open electrical wall plug:',
      options: [
        { emoji: '😀', label: 'Safe', isCorrect: false, feedback: 'Watch out! Water conducts electricity fast.' },
        { emoji: '😲', label: 'Risky', isCorrect: false, feedback: 'More than risky, this is an extreme danger!' },
        { emoji: '🚨', label: 'Danger', isCorrect: true, feedback: 'Correct! Water and open plugs cause severe shocks.' }
      ]
    }
  },
  {
    id: 'lesson_sweating_wire',
    badgeId: 'badge_wire',
    badgeEmoji: '🌡️',
    badgeTitle: 'Wire Master',
    badgeDesc: 'Protected copper wires from fever heat!',
    lessonTitle: 'The Sweating Wire',
    metaphorName: 'Thermometer-Face Wire Heat',
    metaphorTagline: 'Too much power makes wires sweat like a fever.',
    threeBeatStory: [
      { beatTitle: '1. Cozy Current', text: 'Cool copper wire carries power with a happy smile.', icon: '😊' },
      { beatTitle: '2. Fever Heats Up', text: 'Two heavy heaters make the wire sweat red hot.', icon: '😰' },
      { beatTitle: '3. Pop Goes Switch', text: 'Smart breaker pops off before wires melt.', icon: '🛡️' }
    ],
    familyRulePictogram: {
      iconA: '🔥',
      labelA: 'Heater 1',
      iconB: '🔥',
      labelB: 'Heater 2',
      iconC: '🔌',
      labelC: 'One Strip',
      resultEmoji: '🚨',
      resultLabel: 'DANGER',
      spokenRule: 'Never plug two big room heaters into one multi-plug.'
    },
    quiz: {
      id: 'quiz_wire',
      prompt: 'Plugging two heavy room heaters into one extension strip is:',
      options: [
        { emoji: '😀', label: 'Safe', isCorrect: false, feedback: 'No! The hidden copper wire will overheat.' },
        { emoji: '😲', label: 'Risky', isCorrect: false, feedback: 'Too dangerous! It can ignite a wall fire.' },
        { emoji: '🚨', label: 'Danger', isCorrect: true, feedback: 'Correct! Never stack high-watt heaters on one socket.' }
      ]
    }
  },
  {
    id: 'lesson_wall_lightning',
    badgeId: 'badge_lightning',
    badgeEmoji: '⚡',
    badgeTitle: 'Lightning Buster',
    badgeDesc: 'Defeated dangerous wall spark lightning in 0.001s!',
    lessonTitle: 'The Wall Lightning',
    metaphorName: 'Lightning-in-Wall Short',
    metaphorTagline: 'When copper wires touch directly, mini lightning flashes.',
    threeBeatStory: [
      { beatTitle: '1. Pinched Wire', text: 'Crushed plastic insulation exposes raw copper wires.', icon: '🛋️' },
      { beatTitle: '2. Flash Spark', text: 'Wires touch each other with loud lightning pop.', icon: '💥' },
      { beatTitle: '3. Instant Lock', text: 'Magnetic hammer snaps breaker in one thousandth second.', icon: '⚡' }
    ],
    familyRulePictogram: {
      iconA: '🛋️',
      labelA: 'Heavy Couch',
      iconB: '⚡',
      labelB: 'Pinched Cord',
      resultEmoji: '🚨',
      resultLabel: 'DANGER',
      spokenRule: 'Never press heavy furniture legs on flexible power cords.'
    },
    quiz: {
      id: 'quiz_lightning',
      prompt: 'Squashing a lamp wire tightly under a heavy wooden cabinet:',
      options: [
        { emoji: '😀', label: 'Safe', isCorrect: false, feedback: 'Nope! Squashing breaks internal plastic insulation.' },
        { emoji: '😲', label: 'Risky', isCorrect: false, feedback: 'Crushed wires short circuit directly into sparks.' },
        { emoji: '🚨', label: 'Danger', isCorrect: true, feedback: 'Correct! Keep all wires free and unpinched.' }
      ]
    }
  },
  {
    id: 'lesson_leak_detective',
    badgeId: 'badge_detective',
    badgeEmoji: '🕵️',
    badgeTitle: 'Leak Detective',
    badgeDesc: 'Saved a heartbeat with 0.03s super-speed reflex!',
    lessonTitle: 'The Leak Detective',
    metaphorName: 'Leak Guard Detective Ring',
    metaphorTagline: 'Smart magnetic ring counts drops entering and returning.',
    threeBeatStory: [
      { beatTitle: '1. Watching Drops', text: 'Detective ring counts 100 drops entering house.', icon: '🔍' },
      { beatTitle: '2. Missing Drop', text: 'Only 99 drops come back! One escaped outside.', icon: '💧' },
      { beatTitle: '3. Super-Fast Trip', text: 'Detective snaps breaker in 0.03s to save life.', icon: '🛡️' }
    ],
    familyRulePictogram: {
      iconA: '🛡️',
      labelA: 'Leak Guard',
      iconB: '⚡',
      labelB: 'Stray Current',
      resultEmoji: '😀',
      resultLabel: 'SAFE',
      spokenRule: 'Modern Leak Guard switches protect human life in 0.03 seconds.'
    },
    quiz: {
      id: 'quiz_detective',
      prompt: 'A modern Leak Guard switch trips in 0.03 seconds:',
      options: [
        { emoji: '😀', label: 'Safe', isCorrect: true, feedback: 'Correct! It cuts power faster than a single heartbeat.' },
        { emoji: '😲', label: 'Risky', isCorrect: false, feedback: 'It is actually the ultimate life-saving protection!' },
        { emoji: '🚨', label: 'Danger', isCorrect: false, feedback: 'Incorrect. The switch is your primary safety guardian.' }
      ]
    }
  },
  {
    id: 'lesson_escape_road',
    badgeId: 'badge_road',
    badgeEmoji: '🌱',
    badgeTitle: 'Road Builder',
    badgeDesc: 'Built safe green ground escape paths for electricity!',
    lessonTitle: 'The Green Escape Road',
    metaphorName: 'Escape-Road Earth',
    metaphorTagline: 'Stray electricity races safely underground through green road.',
    threeBeatStory: [
      { beatTitle: '1. Metal Case Touch', text: 'Loose wire touches metal kettle outer shell.', icon: '🫖' },
      { beatTitle: '2. The Green Highway', text: 'Electricity chooses green copper road into ground.', icon: '🌱' },
      { beatTitle: '3. Human Safe', text: 'Human touches kettle and feels zero shock.', icon: '😊' }
    ],
    familyRulePictogram: {
      iconA: '🌱',
      labelA: 'Green Ground',
      iconB: '🏠',
      labelB: '3-Pin Plug',
      resultEmoji: '😀',
      resultLabel: 'SAFE',
      spokenRule: 'Always use 3-pin plugs so appliances have ground roads.'
    },
    quiz: {
      id: 'quiz_road',
      prompt: 'Plugging an iron with an intact 3-pin earth plug:',
      options: [
        { emoji: '😀', label: 'Safe', isCorrect: true, feedback: 'Correct! The 3rd pin connects to the ground escape road.' },
        { emoji: '😲', label: 'Risky', isCorrect: false, feedback: 'A 3-pin plug provides proper grounding safety.' },
        { emoji: '🚨', label: 'Danger', isCorrect: false, feedback: 'Grounding protects against shock when you touch metal.' }
      ]
    }
  },
  {
    id: 'lesson_blind_guard',
    badgeId: 'badge_guard',
    badgeEmoji: '🛡️',
    badgeTitle: 'Home Guardian',
    badgeDesc: 'Certified home guardian! Tests the T button every month!',
    lessonTitle: 'The Old Blind Guard',
    metaphorName: 'Old Blind Guard (vELCB)',
    metaphorTagline: 'Old 1980s switches fail if green road cracks.',
    threeBeatStory: [
      { beatTitle: '1. Broken Wire', text: 'Underground earth wire breaks into two pieces.', icon: '⚡' },
      { beatTitle: '2. Old Guard Asleep', text: 'Old 1980s switch cannot see the leak.', icon: '🙈' },
      { beatTitle: '3. Modern Savior', text: 'Modern Leak Guard protects home anyway.', icon: '🛡️' }
    ],
    familyRulePictogram: {
      iconA: '📅',
      labelA: '1st of Month',
      iconB: '🟡',
      labelB: 'Press T Button',
      resultEmoji: '😀',
      resultLabel: 'SAFE',
      spokenRule: 'Press the yellow T button every month to test.'
    },
    quiz: {
      id: 'quiz_blind',
      prompt: 'Testing your home breaker by pressing the yellow T button monthly:',
      options: [
        { emoji: '😀', label: 'Safe', isCorrect: true, feedback: 'Excellent! Testing monthly guarantees your breaker is alive.' },
        { emoji: '😲', label: 'Risky', isCorrect: false, feedback: 'Testing is recommended by electrical safety experts worldwide.' },
        { emoji: '🚨', label: 'Danger', isCorrect: false, feedback: 'Testing keeps your family safe, never in danger.' }
      ]
    }
  }
];

// ── 5 3-ACT GUIDED SCENARIOS ──
export const HOMEGUARD_THREE_ACT_SCENARIOS: ThreeActScenario[] = [
  {
    id: 'scenario_child_shock',
    scenarioId: 'child_touch_shock',
    presetId: 'preset_child_shock',
    title: 'Curious Little Fingers',
    emoji: '👶⚡',
    summaryLine: 'Watch Leak Guard save toddler in 0.03 seconds.',
    familyRule: {
      stripIcons: ['👶', '📌', '🔌'],
      resultEmoji: '🚨',
      caption: 'Cover all low wall plugs with plastic safety covers.'
    },
    whatJustHappenedBeats: [
      { icon: '📌', label: 'Pin In Socket' },
      { icon: '💧', label: '230mA Leaks Out' },
      { icon: '🛡️', label: '0.03s Trip Saves Baby' }
    ],
    whatJustHappenedSpoken: 'Leak Guard cut electricity in 0.03 seconds before heartbeat stopped.',
    acts: [
      {
        actNumber: 1,
        actTitle: 'Setup',
        narrationLine: 'Curious toddler reaches towards wall socket with metal hairpin.',
        speechText: 'A curious toddler reaches towards the wall socket with a shiny hairpin.',
        actionButtonLabel: '👆 Tap Socket to See What Happens',
        soundCue: 'heartbeat',
        visualEffect: 'water_pipe',
        targetElement: 'child',
        pictogramBeat: { icon: '👶', caption: 'Toddler Reaches' }
      },
      {
        actNumber: 2,
        actTitle: 'Danger',
        narrationLine: 'Electricity leaks into fingers! Red droplets flow through little hand.',
        speechText: 'Electricity leaks into fingers! Red droplets flow through the little hand.',
        actionButtonLabel: '👆 Watch Super-Fast Safety Switch',
        soundCue: 'zap',
        visualEffect: 'race_lane',
        targetElement: 'socket',
        pictogramBeat: { icon: '⚡', caption: 'Current Leaking' }
      },
      {
        actNumber: 3,
        actTitle: 'Save & Lesson',
        narrationLine: 'SNAP! Leak Guard wins race by a mile! Baby safe!',
        speechText: 'Snap! The Leak Guard wins the race by a mile! The baby is safe!',
        actionButtonLabel: '🎉 YOU SAVED BABY! Complete Story',
        soundCue: 'cheer',
        visualEffect: 'race_lane',
        targetElement: 'db_box',
        pictogramBeat: { icon: '🛡️', caption: 'Baby 100% Safe' }
      }
    ]
  },
  {
    id: 'scenario_overload',
    scenarioId: 'winter_overload_145',
    presetId: 'preset_overload',
    title: 'Too Many Heaters',
    emoji: '🔥❄️',
    summaryLine: 'Plugging too many heaters makes wall wires sweat fever.',
    familyRule: {
      stripIcons: ['🔥', '🔥', '🔌'],
      resultEmoji: '🚨',
      caption: 'Never plug two high-power room heaters into one plug.'
    },
    whatJustHappenedBeats: [
      { icon: '🔥', label: '2 Heaters Plugged' },
      { icon: '🌡️', label: 'Wires Sweat Red' },
      { icon: '🛡️', label: 'Breaker Pops Off' }
    ],
    whatJustHappenedSpoken: 'Safety breaker opened switch to stop copper wires from melting.',
    acts: [
      {
        actNumber: 1,
        actTitle: 'Setup',
        narrationLine: 'Freeze outside! Turn on both room heaters to warm up.',
        speechText: 'It is freezing cold outside. Turn on both room heaters to warm up.',
        actionButtonLabel: '👆 Turn On Space Heater',
        soundCue: 'click',
        visualEffect: 'water_pipe',
        targetElement: 'heater',
        pictogramBeat: { icon: '❄️', caption: 'Cold Room' }
      },
      {
        actNumber: 2,
        actTitle: 'Danger',
        narrationLine: 'Wall wire is sweating red hot with fever heat!',
        speechText: 'The wall wire is sweating red hot with dangerous fever heat.',
        actionButtonLabel: '👆 Unplug Heater Before Reset',
        soundCue: 'sizzle',
        visualEffect: 'thermo_dial',
        targetElement: 'heater',
        pictogramBeat: { icon: '😰', caption: 'Wire Overheating' }
      },
      {
        actNumber: 3,
        actTitle: 'Save & Lesson',
        narrationLine: 'CLICK! Breaker shuts off power before copper wires catch fire.',
        speechText: 'Click! The breaker shuts off power before copper wires catch fire.',
        actionButtonLabel: '🎉 Wires Saved! Next Story',
        soundCue: 'cheer',
        visualEffect: 'thermo_dial',
        targetElement: 'db_box',
        pictogramBeat: { icon: '🛡️', caption: 'Power Cut Safely' }
      }
    ]
  },
  {
    id: 'scenario_short_circuit',
    scenarioId: 'damaged_cord_short',
    presetId: 'preset_short',
    title: 'Crushed Lamp Cord',
    emoji: '💥⚡',
    summaryLine: 'Pinched copper wire touches and creates mini wall lightning.',
    familyRule: {
      stripIcons: ['🛋️', '⚡', '🔌'],
      resultEmoji: '🚨',
      caption: 'Keep furniture legs off all flexible electrical power cables.'
    },
    whatJustHappenedBeats: [
      { icon: '🛋️', label: 'Cord Crushed' },
      { icon: '💥', label: 'Lightning Spark' },
      { icon: '⚡', label: '1ms Magnetic Trip' }
    ],
    whatJustHappenedSpoken: 'Magnetic solenoid fired trip in one millisecond stopping the spark.',
    acts: [
      {
        actNumber: 1,
        actTitle: 'Setup',
        narrationLine: 'Heavy armchair leg presses tightly onto flexible lamp power cord.',
        speechText: 'A heavy armchair leg presses tightly onto a flexible lamp power cord.',
        actionButtonLabel: '👆 Inspect Pinched Wire',
        soundCue: 'click',
        visualEffect: 'water_pipe',
        targetElement: 'socket',
        pictogramBeat: { icon: '🛋️', caption: 'Pinched Cord' }
      },
      {
        actNumber: 2,
        actTitle: 'Danger',
        narrationLine: 'SPARK! Copper wires touch and lightning flashes in wall!',
        speechText: 'Spark! The copper wires touch and lightning flashes in the wall.',
        actionButtonLabel: '👆 See Breaker Cut Spark',
        soundCue: 'zap',
        visualEffect: 'zap_blackout',
        targetElement: 'socket',
        pictogramBeat: { icon: '💥', caption: 'Lightning Spark' }
      },
      {
        actNumber: 3,
        actTitle: 'Save & Lesson',
        narrationLine: 'CLICK! Magnetic breaker trips in one millisecond! Fire prevented.',
        speechText: 'Click! Magnetic breaker trips in one millisecond! Fire is prevented.',
        actionButtonLabel: '🎉 House Protected! Next Story',
        soundCue: 'cheer',
        visualEffect: 'zap_blackout',
        targetElement: 'db_box',
        pictogramBeat: { icon: '🛡️', caption: 'Instant Protection' }
      }
    ]
  },
  {
    id: 'scenario_wet_bath',
    scenarioId: 'kettle_earth_leakage',
    presetId: 'preset_wet_bath',
    title: 'Water Spills on Counter',
    emoji: '💧⚡',
    summaryLine: 'Water lets power leak onto tiles before switch trips.',
    familyRule: {
      stripIcons: ['💧', '🫖', '🔌'],
      resultEmoji: '🚨',
      caption: 'Never place electric kettles or plugs directly inside puddles.'
    },
    whatJustHappenedBeats: [
      { icon: '💧', label: 'Water Splashed' },
      { icon: '⚡', label: 'Current In Puddle' },
      { icon: '🛡️', label: 'Leak Guard Trips' }
    ],
    whatJustHappenedSpoken: 'Leak Guard felt current leaking through water and snapped off.',
    acts: [
      {
        actNumber: 1,
        actTitle: 'Setup',
        narrationLine: 'Water spills on kitchen counter right next to boiling kettle.',
        speechText: 'Water spills on the kitchen counter right next to the boiling kettle.',
        actionButtonLabel: '👆 Touch Wet Counter',
        soundCue: 'click',
        visualEffect: 'water_pipe',
        targetElement: 'socket',
        pictogramBeat: { icon: '💧', caption: 'Water Spills' }
      },
      {
        actNumber: 2,
        actTitle: 'Danger',
        narrationLine: 'Water lets electricity leak across tiles! Shock danger threatens fingers.',
        speechText: 'Water lets electricity leak across tiles! Shock danger threatens fingers.',
        actionButtonLabel: '👆 Watch Leak Detective Snap',
        soundCue: 'sizzle',
        visualEffect: 'water_pipe',
        targetElement: 'socket',
        pictogramBeat: { icon: '⚡', caption: 'Leakage Current' }
      },
      {
        actNumber: 3,
        actTitle: 'Save & Lesson',
        narrationLine: 'CLICK! Leak Guard cut power in 0.03 seconds. Safe!',
        speechText: 'Click! Leak Guard cut power in 0.03 seconds. Everyone is safe!',
        actionButtonLabel: '🎉 Puddle Disarmed! Complete',
        soundCue: 'cheer',
        visualEffect: 'water_pipe',
        targetElement: 'db_box',
        pictogramBeat: { icon: '🛡️', caption: 'Safe From Shock' }
      }
    ]
  },
  {
    id: 'scenario_broken_earth',
    scenarioId: 'broken_earth_velcb',
    presetId: 'preset_broken_earth',
    title: 'The Broken Green Wire',
    emoji: '🔌⚠️',
    summaryLine: 'Cracked earth road makes old switches fail; test T monthly.',
    familyRule: {
      stripIcons: ['📅', '🟡', '🛡️'],
      resultEmoji: '😀',
      caption: 'Test your Leak Guard with the yellow T button monthly.'
    },
    whatJustHappenedBeats: [
      { icon: '🌱', label: 'Green Wire Cut' },
      { icon: '🙈', label: 'Old vELCB Blind' },
      { icon: '🛡️', label: 'Modern RCCB Trips' }
    ],
    whatJustHappenedSpoken: 'Modern Leak Guard protects you even if ground wires break.',
    acts: [
      {
        actNumber: 1,
        actTitle: 'Setup',
        narrationLine: 'Underground green earth wire is cracked and severed in two.',
        speechText: 'The underground green earth wire is cracked and severed in two.',
        actionButtonLabel: '👆 Inspect Ground Wire',
        soundCue: 'click',
        visualEffect: 'cracked_road',
        targetElement: 'child',
        pictogramBeat: { icon: '🌱', caption: 'Earth Wire Cracked' }
      },
      {
        actNumber: 2,
        actTitle: 'Danger',
        narrationLine: 'Old blind 1980s switch cannot see stray power without road!',
        speechText: 'The old blind 1980s switch cannot see stray power without the road!',
        actionButtonLabel: '👆 Switch to Modern Leak Guard',
        soundCue: 'zap',
        visualEffect: 'cracked_road',
        targetElement: 'db_box',
        pictogramBeat: { icon: '🙈', caption: 'Old Switch Blind' }
      },
      {
        actNumber: 3,
        actTitle: 'Save & Lesson',
        narrationLine: 'Modern Leak Guard protects anyway! Always press T button monthly.',
        speechText: 'Modern Leak Guard protects anyway! Always press the T button monthly.',
        actionButtonLabel: '🎉 Knowledge Mastered! Finish',
        soundCue: 'cheer',
        visualEffect: 'cracked_road',
        targetElement: 'db_box',
        pictogramBeat: { icon: '🛡️', caption: 'Modern Protection' }
      }
    ]
  }
];
