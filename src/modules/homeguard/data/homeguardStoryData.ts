/**
 * homeguardStoryData.ts
 * 
 * Friendly household stories for HomeGuard Simple Shell.
 * Strict Plain-Language rules:
 * - Narration line <= 12 words per step
 * - Zero technical symbols (no Σ, Δ, Φ, µ, IΔn, Ω, kA)
 * - Speak-on-tap glossary friendly tokens
 */

export interface StoryStep {
  stepIndex: number;
  /** Narration text (strictly <= 12 words) */
  narration: string;
  /** Speech synthesis script (friendly plain audio narration) */
  speechText: string;
  /** One primary big button label */
  actionLabel: string;
  /** Target element to spotlight: 'house_canvas' | 'child_shock' | 'socket' | 'db_box' | 'action_button' | 'heater' */
  spotlightTarget: 'child_shock' | 'db_box' | 'heater' | 'socket' | 'action_button' | 'house_canvas';
  /** Approximate relative coordinates in SVG viewBox (720x540) or screen */
  targetCoords?: { x: number; y: number; radius: number };
  /** Required action type to advance */
  actionType: 'start' | 'touch_socket' | 'trip_breaker' | 'reset_breaker' | 'unplug' | 'finish';
}

export interface HomeGuardStory {
  id: string;
  presetId: string;
  scenarioId: string;
  title: string;
  subtitle: string;
  emoji: string;
  cardImage: string; // SVG or gradient representation
  steps: StoryStep[];
}

export const HOMEGUARD_STORIES: HomeGuardStory[] = [
  {
    id: 'story_child_shock',
    presetId: 'preset_child_shock',
    scenarioId: 'child_touch_shock',
    title: 'Curious Little Fingers',
    subtitle: 'See how the Leak Guard switch saves a child in 0.03 seconds.',
    emoji: '👶⚡',
    cardImage: 'child_shock',
    steps: [
      {
        stepIndex: 1,
        narration: 'Curious toddler reaches towards the wall socket with a shiny hairpin.',
        speechText: 'A curious toddler reaches towards the wall socket with a shiny hairpin.',
        actionLabel: '👆 Tap Socket to See What Happens',
        spotlightTarget: 'child_shock',
        targetCoords: { x: 260, y: 340, radius: 65 },
        actionType: 'touch_socket'
      },
      {
        stepIndex: 2,
        narration: 'Electricity starts leaking! The smart Leak Guard switch feels the leak.',
        speechText: 'Electricity starts leaking! The smart Leak Guard switch feels the leak.',
        actionLabel: '👆 Look at the DB Safety Box',
        spotlightTarget: 'db_box',
        targetCoords: { x: 420, y: 220, radius: 50 },
        actionType: 'trip_breaker'
      },
      {
        stepIndex: 3,
        narration: 'SNAP! Power cuts in a flash. Child is 100% safe!',
        speechText: 'Snap! Power cuts in a flash. The child is completely safe.',
        actionLabel: '👆 Tap Breaker to Restore Power',
        spotlightTarget: 'db_box',
        targetCoords: { x: 420, y: 220, radius: 50 },
        actionType: 'reset_breaker'
      },
      {
        stepIndex: 4,
        narration: 'Great job! Always cover empty sockets with plastic safety plugs.',
        speechText: 'Great job! Always keep your home safe with plastic socket covers.',
        actionLabel: '🎉 Story Finished! Next Story',
        spotlightTarget: 'action_button',
        actionType: 'finish'
      }
    ]
  },
  {
    id: 'story_overload',
    presetId: 'preset_overload',
    scenarioId: 'winter_overload_145',
    title: 'Too Many Heaters',
    subtitle: 'Why turning on every heater makes the power switch turn off.',
    emoji: '🔥❄️',
    cardImage: 'overload',
    steps: [
      {
        stepIndex: 1,
        narration: 'It is freezing cold outside. Both big room heaters are turned on.',
        speechText: 'It is freezing cold outside. Both big room heaters are turned on.',
        actionLabel: '👆 Turn On Space Heater',
        spotlightTarget: 'heater',
        targetCoords: { x: 300, y: 410, radius: 60 },
        actionType: 'start'
      },
      {
        stepIndex: 2,
        narration: 'Wall wires are getting red hot from carrying too much electricity.',
        speechText: 'Wall wires are getting red hot from carrying too much electricity.',
        actionLabel: '👆 Unplug Heater Before Reset',
        spotlightTarget: 'heater',
        targetCoords: { x: 300, y: 410, radius: 60 },
        actionType: 'unplug'
      },
      {
        stepIndex: 3,
        narration: 'Smart safety switch popped OFF to prevent wall wires from melting.',
        speechText: 'The smart safety switch popped off to prevent wall wires from melting.',
        actionLabel: '👆 Push Breaker Switch UP',
        spotlightTarget: 'db_box',
        targetCoords: { x: 420, y: 220, radius: 50 },
        actionType: 'reset_breaker'
      },
      {
        stepIndex: 4,
        narration: 'Safe again! Never plug two heavy heaters into one wall plug.',
        speechText: 'Safe again! Never plug two heavy heaters into one wall plug.',
        actionLabel: '🎉 Story Complete!',
        spotlightTarget: 'action_button',
        actionType: 'finish'
      }
    ]
  },
  {
    id: 'story_short_circuit',
    presetId: 'preset_short',
    scenarioId: 'damaged_cord_short',
    title: 'Crushed Lamp Cord',
    subtitle: 'A crushed cable touches together and sparks loudly.',
    emoji: '💥⚡',
    cardImage: 'short_circuit',
    steps: [
      {
        stepIndex: 1,
        narration: 'A heavy sofa chair pinched and crushed the lamp electrical cord.',
        speechText: 'A heavy sofa chair pinched and crushed the lamp electrical cord.',
        actionLabel: '👆 Inspect Pinched Wire',
        spotlightTarget: 'socket',
        targetCoords: { x: 260, y: 340, radius: 55 },
        actionType: 'start'
      },
      {
        stepIndex: 2,
        narration: 'SPARK! The copper wires touch each other with huge power rush.',
        speechText: 'Spark! The copper wires touch each other with huge power rush.',
        actionLabel: '👆 See Breaker Protect Home',
        spotlightTarget: 'db_box',
        targetCoords: { x: 420, y: 220, radius: 50 },
        actionType: 'trip_breaker'
      },
      {
        stepIndex: 3,
        narration: 'Magnetic trip shut off in one millisecond before fire could start!',
        speechText: 'The magnetic trip shut off in one millisecond before fire could start!',
        actionLabel: '🎉 Awesome Protection!',
        spotlightTarget: 'action_button',
        actionType: 'finish'
      }
    ]
  },
  {
    id: 'story_wet_bath',
    presetId: 'preset_wet_bath',
    scenarioId: 'kettle_earth_leakage',
    title: 'Water Spills on Counter',
    subtitle: 'Water conducts power fast. Watch the Leak Guard catch it.',
    emoji: '💧⚡',
    cardImage: 'wet_bath',
    steps: [
      {
        stepIndex: 1,
        narration: 'Water spilled all over the kitchen counter near the electric kettle.',
        speechText: 'Water spilled all over the kitchen counter near the electric kettle.',
        actionLabel: '👆 Touch Wet Counter',
        spotlightTarget: 'socket',
        targetCoords: { x: 500, y: 320, radius: 60 },
        actionType: 'start'
      },
      {
        stepIndex: 2,
        narration: 'Water lets current escape through wet tiles. Shock danger!',
        speechText: 'Water lets current escape through wet tiles. Shock danger!',
        actionLabel: '👆 Watch Leak Guard Snap',
        spotlightTarget: 'db_box',
        targetCoords: { x: 420, y: 220, radius: 50 },
        actionType: 'trip_breaker'
      },
      {
        stepIndex: 3,
        narration: 'Leak Guard cut electricity instantly. Nobody got hurt!',
        speechText: 'The Leak Guard cut electricity instantly. Nobody got hurt!',
        actionLabel: '🎉 Everyone is Safe!',
        spotlightTarget: 'action_button',
        actionType: 'finish'
      }
    ]
  },
  {
    id: 'story_broken_earth',
    presetId: 'preset_broken_earth',
    scenarioId: 'broken_earth_velcb',
    title: 'The Broken Green Wire',
    subtitle: 'Why old 1980s switches fail if the ground wire gets cut.',
    emoji: '🔌⚠️',
    cardImage: 'broken_earth',
    steps: [
      {
        stepIndex: 1,
        narration: 'A rodent chewed through the hidden green earthing wire.',
        speechText: 'A rodent chewed through the hidden green earthing wire.',
        actionLabel: '👆 Inspect Earthing Wire',
        spotlightTarget: 'house_canvas',
        targetCoords: { x: 360, y: 460, radius: 70 },
        actionType: 'start'
      },
      {
        stepIndex: 2,
        narration: 'Old switches stay asleep! Modern Leak Guard protects you anyway.',
        speechText: 'Old switches stay asleep, but modern Leak Guard protects you anyway.',
        actionLabel: '👆 Test Safety Trip',
        spotlightTarget: 'db_box',
        targetCoords: { x: 420, y: 220, radius: 50 },
        actionType: 'reset_breaker'
      },
      {
        stepIndex: 3,
        narration: 'Modern homes use modern Leak Guards for true 100% protection.',
        speechText: 'Modern homes use modern Leak Guards for true 100% protection.',
        actionLabel: '🎉 Knowledge Mastered!',
        spotlightTarget: 'action_button',
        actionType: 'finish'
      }
    ]
  }
];

export interface GlossaryEntry {
  term: string;
  aliases: string[];
  simpleTitle: string;
  plainMeaning: string;
  pronounceText: string;
  icon: string;
}

export const HOMEGUARD_GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Leak Guard',
    aliases: ['leak guard', 'rccb', 'elcb'],
    simpleTitle: 'Leak Guard Switch',
    plainMeaning: 'A super-fast safety switch that snaps off in 0.03 seconds if electricity leaks into water or people.',
    pronounceText: 'Leak Guard. A super-fast safety switch that shuts off power if any current leaks out.',
    icon: '🛡️'
  },
  {
    term: 'breaker',
    aliases: ['breaker', 'mcb', 'safety switch', 'fuse'],
    simpleTitle: 'Safety Breaker Switch',
    plainMeaning: 'An automatic switch that pops OFF when wires get too hot or touch together.',
    pronounceText: 'Safety Breaker. An automatic switch that shuts off when wires get too hot or short circuit.',
    icon: '⚡'
  },
  {
    term: 'earth',
    aliases: ['earth', 'ground', 'earthing wire', 'green wire'],
    simpleTitle: 'Safe Earth Wire (Green/Yellow)',
    plainMeaning: 'A special green wire in walls that carries runaway electricity safely deep into the ground.',
    pronounceText: 'Earth wire. A green wire that sends stray electricity safely into the ground.',
    icon: '🌱'
  },
  {
    term: 'wall socket',
    aliases: ['wall socket', 'socket', 'plug', 'sockets'],
    simpleTitle: 'Wall Socket',
    plainMeaning: 'The 3-pin opening in the wall where appliances get their 230 volt power.',
    pronounceText: 'Wall socket. Where home appliances plug in to get electricity.',
    icon: '🔌'
  },
  {
    term: 'shock',
    aliases: ['shock', 'electric shock', 'shocks'],
    simpleTitle: 'Electric Shock',
    plainMeaning: 'Dangerous tingling or painful zap that happens when electricity flows through human body.',
    pronounceText: 'Electric shock. When electricity accidentally flows through the human body.',
    icon: '⚡'
  }
];
