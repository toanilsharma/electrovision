/**
 * Grade-6 Residential Language Glossary & Jargon Explanations
 * 
 * Translates complex electrical engineering concepts into crystal-clear,
 * accessible analogies for homeowners, students, and non-technical users.
 */

export interface GlossaryEntry {
  term: string;
  simpleName: string;
  oneLineSummary: string;
  grade6Analogy: string;
  whyItMatters: string;
}

export const RESIDENTIAL_GLOSSARY: Record<string, GlossaryEntry> = {
  overload: {
    term: 'Overload',
    simpleName: 'Too Many Hungry Gadgets',
    oneLineSummary: 'Trying to draw more electricity than the hidden wall wires can handle.',
    grade6Analogy:
      'Imagine a garden hose trying to pump a swimming pool of water every second. The hose expands and bulges. In your house, too many heaters and kettles cause the copper wires inside your walls to get scorching hot like a toaster coil.',
    whyItMatters:
      'If the circuit breaker didn’t shut off the power, hot wires inside the wall could melt their plastic coating and start a hidden house fire.'
  },
  short_circuit: {
    term: 'Short Circuit',
    simpleName: 'Accidental Wire Collision',
    oneLineSummary: 'When two bare electrical wires touch directly, creating an explosive rush of power.',
    grade6Analogy:
      'Electricity always takes the easiest shortcut back home. If a crushed cord allows the live and neutral wires to touch, electricity rushes through with the force of an avalanche in less than a thousandth of a second.',
    whyItMatters:
      'A short circuit creates instant sparks and intense heat. The magnetic coil inside your breaker trips in a millisecond to stop an explosion.'
  },
  mcb: {
    term: 'Miniature Circuit Breaker (MCB)',
    simpleName: 'Automatic Safety Switch',
    oneLineSummary: 'The clicky switch in your electrical box that protects wires from catching fire.',
    grade6Analogy:
      'Think of it as an automatic guard standing watch at your door. Inside, there is a heat-sensitive metal strip that bends when warm, and a tiny electromagnetic magnet that snaps open instantly during a short circuit.',
    whyItMatters:
      'Unlike old-fashioned fuses that burned out and had to be replaced with new wire, you can simply flip a modern breaker switch back on after fixing the problem.'
  },
  rcd: {
    term: 'Residual Current Device (RCD / RCCB)',
    simpleName: 'Electric Shock Guardian',
    oneLineSummary: 'A super-sensitive detector that stops electricity from flowing through your body.',
    grade6Analogy:
      'Picture an accountant counting cars entering and leaving a tunnel. If 1,000 cars enter but only 999 leave, one is stuck inside! The RCD measures current going out on the live wire and coming back on the neutral. If even a tiny droplet (30 milliamps) is missing, it cuts power in 40 milliseconds.',
    whyItMatters:
      'Circuit breakers protect wires from catching fire; RCDs protect YOU from getting an electric shock.'
  },
  grounding: {
    term: 'Protective Earth / Ground Wire',
    simpleName: 'The Safety Escape Slide',
    oneLineSummary: 'A green-and-yellow wire that safely drains stray electricity into the soil.',
    grade6Analogy:
      'If an internal wire comes loose inside a metal toaster, the whole toaster could become electrified. The ground wire gives that electricity an easy, harmless slide down into the dirt instead of shocking your hand.',
    whyItMatters:
      'Connected to metal pipes and appliances so stray voltage trips the safety breaker immediately.'
  },
  distribution_board: {
    term: 'Distribution Board / Consumer Unit',
    simpleName: 'The Main Breaker Box',
    oneLineSummary: 'The metal or plastic cabinet, usually under the stairs, where all home electricity is divided.',
    grade6Analogy:
      'The heart of your house electrical system. Big power cables arrive from the street into this box, and separate smaller pathways branch out to power your kitchen, bedrooms, and lights.',
    whyItMatters:
      'Every adult in the house should know where this box is located so they can turn off power in an emergency.'
  },
  time_warp: {
    term: 'Time Warp',
    simpleName: 'Fast-Forward Button',
    oneLineSummary: 'Speeds up the simulation so you do not have to wait 37 real minutes.',
    grade6Analogy:
      'In real life, a mild overload takes about 37 minutes (2,246 seconds) to heat up the bimetal strip. With Time Warp set to 100x, you can watch it unfold in just 20 seconds!',
    whyItMatters:
      'Allows you to see the real physics at work without waiting around.'
  }
};
