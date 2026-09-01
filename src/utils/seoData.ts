import { SimulationType } from '../types';

export interface RouteSEOData {
  moduleId: SimulationType | 'home';
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  jsonLd: {
    '@context': string;
    '@type': string;
    name: string;
    applicationCategory: string;
    operatingSystem: string;
    description: string;
    url: string;
    author: {
      '@type': string;
      name: string;
      url?: string;
    };
    offers: {
      '@type': string;
      price: string;
      priceCurrency: string;
    };
    educationalUse: string;
    hasPart?: Array<{
      '@type': string;
      name: string;
      description: string;
    }>;
  };
  physicsSummary: string;
}

const BASE_URL = 'https://electrolive.netlify.app';

export const SEO_ROUTES: Record<SimulationType | 'home', RouteSEOData> = {
  home: {
    moduleId: 'home',
    path: '/',
    title: 'ElectroLive™ | High-Fidelity Electrical Hazard, Arc Flash & Shock Physics Simulator',
    description: 'Explore interactive, standards-compliant electrical engineering simulators (IEC 60479, IEEE 1584, IEEE 80, IEC 60909). Real-time AC/DC shock, arc flash boundary, step & touch potential, MCB curves, and LOTO diagnostics.',
    canonicalUrl: `${BASE_URL}/`,
    keywords: [
      'electrical safety simulator',
      'IEC 60479-1 shock physics',
      'IEEE 1584 arc flash calculator',
      'IEEE 80 step touch potential',
      'IEC 60909 short circuit simulator',
      'electrical engineering education',
      'MCB tripping curve simulator',
      'LOTO procedure trainer'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ElectroLive™ Electrical Hazard & Engineering Physics Simulator',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'An interactive, high-fidelity web platform for electrical safety training, bio-impedance shock modeling, arc flash incident energy analysis, and switchgear protection simulation.',
      url: `${BASE_URL}/`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma',
        url: 'https://designcalculators.co.in'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Electrical Engineering & High Voltage Safety Training'
    },
    physicsSummary: 'ElectroLive™ is an open-access engineering suite modeling electrical hazard physics including IEC 60479 human body impedance, IEEE 1584 arc flash incident energy, IEEE 80 grounding grid potential gradients, and IEC 60898 breaker trip dynamics.'
  },

  ac_shock: {
    moduleId: 'ac_shock',
    path: '/simulators/ac-shock',
    title: 'AC Electric Shock Simulator & IEC 60479-1 Biomechanics | ElectroLive™',
    description: 'Simulate alternating current (50/60Hz) shock physics based on IEC 60479-1. Calculate touch potential, dry vs wet skin impedance, let-go muscle lock (10mA), and ventricular fibrillation thresholds with live McSharry ECG morphology.',
    canonicalUrl: `${BASE_URL}/simulators/ac-shock`,
    keywords: [
      'AC shock simulator',
      'IEC 60479-1 body impedance',
      'let-go threshold current',
      'ventricular fibrillation mA',
      'touch voltage calculation',
      'dry wet skin electrical resistance'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'AC Electric Shock & Bio-Impedance Simulator (IEC 60479-1)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Interactive simulator modeling the physiological effects of alternating current on the human body, computing touch voltage, total body impedance (ZT), let-go threshold, and cardiac fibrillation risk under IEC 60479-1 standards.',
      url: `${BASE_URL}/simulators/ac-shock`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma',
        url: 'https://designcalculators.co.in'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Human Body Electrical Impedance & AC Safety Education'
    },
    physicsSummary: 'Alternating current at 50/60 Hz exhibits higher lethality than direct current due to continuous cyclic trans-membrane depolarization of cardiac muscle cells. Under IEC 60479-1, total human body impedance (ZT) is non-linear and voltage-dependent, dropping from ~8,280 Ohms on dry skin at low potential to ~1,328 Ohms on wet, punctured epidermis at 230V. Currents exceeding 10mA induce continuous involuntary forearm muscle tetany (the "cannot let-go" threshold), while currents above 50-75mA traversing the myocardium trigger lethal ventricular fibrillation (Zone C3/Zone 4).'
  },

  dc_shock: {
    moduleId: 'dc_shock',
    path: '/simulators/dc-shock',
    title: 'DC Shock & Electrolytic Tissue Dissociation Simulator (IEC 60479-2) | ElectroLive™',
    description: 'Calculate direct current physiological thresholds under IEC 60479-2. Compare continuous DC vs pulsating current, electrolytic cellular dissociation, and involuntary throw-off muscle reactions.',
    canonicalUrl: `${BASE_URL}/simulators/dc-shock`,
    keywords: [
      'DC shock simulator',
      'IEC 60479-2 direct current',
      'electrolytic tissue damage',
      'solar PV battery shock risk',
      'DC let-go threshold'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Direct Current (DC) Electrical Shock Simulator (IEC 60479-2)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Simulates DC electrical shock in photovoltaic systems, high-voltage battery banks, and industrial DC buses with electrolytic tissue breakdown and fibrillation boundaries.',
      url: `${BASE_URL}/simulators/dc-shock`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'DC Electrical Safety & Solar Storage Hazard Analysis'
    },
    physicsSummary: 'Direct current (DC) creates distinct physiological effects compared to AC under IEC 60479-2. Because DC lacks periodic zero-crossings, prolonged contact causes rapid electrolytic dissociation of intercellular fluids, severe internal thermal coagulation, and chemical skin burns. While the DC perception threshold (~2mA) and let-go threshold (~30mA) are higher than AC, interruption of high-current DC often induces an explosive involuntary muscular contraction that can violently throw the worker from heights.'
  },

  arc_flash: {
    moduleId: 'arc_flash',
    path: '/simulators/arc-flash',
    title: 'Arc Flash Incident Energy & Boundary Calculator (IEEE 1584-2018) | ElectroLive™',
    description: 'Calculate bolted fault current, arcing current, arc flash boundary (AFB), and incident energy (cal/cm²) using IEEE 1584-2018 and NFPA 70E. Determine PPE category 1-4 with interactive 3D blast radius visualization.',
    canonicalUrl: `${BASE_URL}/simulators/arc-flash`,
    keywords: [
      'arc flash simulator',
      'IEEE 1584-2018 calculator',
      'arc flash boundary AFB',
      'incident energy cal/cm2',
      'NFPA 70E PPE categories',
      'switchgear arc blast physics'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Arc Flash Incident Energy & Boundary Simulator (IEEE 1584-2018)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Accurately computes arc flash thermal incident energy, working distance boundaries, and NFPA 70E personal protective equipment (PPE) requirements for low and medium voltage switchgear.',
      url: `${BASE_URL}/simulators/arc-flash`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'High Voltage Switchgear Safety & Arc Flash Risk Assessment'
    },
    physicsSummary: 'An electrical arc flash produces extreme thermal radiation reaching temperatures up to 35,000°F (19,400°C), vaporizing copper conductors into expanding metal gas with a 67,000-to-1 volumetric expansion ratio. The IEEE 1584-2018 standard determines arcing current (Iarc), intermediate incident energy (E), and the Arc Flash Boundary (AFB) at 1.2 cal/cm² (the threshold for second-degree curable skin burns) based on electrode configuration (VCB, VCBB, HCB, VOA, HOA), bus gap, and enclosure box dimensions.'
  },

  earth_fault: {
    moduleId: 'earth_fault',
    path: '/simulators/earth-fault',
    title: 'Earth Fault & Ground Potential Rise Simulator (IEEE 80) | ElectroLive™',
    description: 'Simulate substation earth fault currents, Ground Potential Rise (GPR), soil resistivity gradients, and touch voltage risks across grounding grids according to IEEE 80 standards.',
    canonicalUrl: `${BASE_URL}/simulators/earth-fault`,
    keywords: [
      'earth fault simulator',
      'ground potential rise GPR',
      'IEEE 80 substation grounding',
      'soil resistivity voltage gradient',
      'touch voltage limit IEEE 80'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Earth Fault & Ground Potential Rise (GPR) Simulator (IEEE 80)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Educational engineering simulator modeling Ground Potential Rise (GPR), hemispherical ground dissipation, and touch potential hazards during single phase-to-ground faults.',
      url: `${BASE_URL}/simulators/earth-fault`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Substation Grounding Design & Earth Fault Diagnostics'
    },
    physicsSummary: 'When a high-voltage phase conductor faults to earth, the fault current (If) discharges through the grounding electrode system into the soil, creating Ground Potential Rise (GPR = If * Rg). Soil resistance creates a conical potential distribution surface. A person touching grounded metal equipment while standing on surrounding soil is subjected to the Touch Voltage (Etouch), which must be maintained below tolerable limits specified by IEEE 80-2013 equations for 50kg or 70kg human body weight.'
  },

  step_touch: {
    moduleId: 'step_touch',
    path: '/simulators/step-touch',
    title: 'Step & Touch Potential Instrument (IEEE 80 Grid Physics) | ElectroLive™',
    description: 'Interactive instrument measuring step potential (1m pace) and touch potential in electrical substations. Learn surface layer gravel resistivity and foot resistance equations.',
    canonicalUrl: `${BASE_URL}/simulators/step-touch`,
    keywords: [
      'step potential calculator',
      'touch potential instrument',
      'IEEE 80 pace voltage',
      'substation surface gravel crushed rock',
      'ground grid voltage gradient'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Step and Touch Potential Analysis Tool (IEEE 80)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Analyzes step potential across a 1.0-meter foot pace and touch potential from hand-to-feet, including the mitigating effect of a 100mm high-resistivity crushed rock surface layer (Cs).',
      url: `${BASE_URL}/simulators/step-touch`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Substation Grounding Grid Safety & Pace Potential Analysis'
    },
    physicsSummary: 'Step potential is the potential difference between two points on the earth surface separated by a distance of 1 pace (normally 1 meter), without touching any grounded structure. Touch potential is the potential difference between a grounded metallic structure and a point on the earth surface 1 meter away. IEEE 80 incorporates a surface derating factor (Cs) for crushed rock or asphalt surfacing, elevating allowable step and touch voltage thresholds by increasing foot contact resistance (Rf = 1.5 * rho_s / (pi * r)).'
  },

  short_circuit: {
    moduleId: 'short_circuit',
    path: '/simulators/short-circuit',
    title: 'Short Circuit Dynamic Thermal & Magnetic Force Simulator (IEC 60909) | ElectroLive™',
    description: 'Simulate symmetrical and asymmetrical short circuit fault currents (IEC 60909). Visualize peak making current (Ip), thermal equivalent Joule heating (I²t), and electromagnetic busbar deflection forces.',
    canonicalUrl: `${BASE_URL}/simulators/short-circuit`,
    keywords: [
      'short circuit simulator',
      'IEC 60909 fault calculation',
      'peak making current Ip',
      'I2t thermal withstand',
      'electromagnetic busbar forces',
      'asymmetrical DC offset'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Short Circuit Dynamic & Thermal Force Simulator (IEC 60909)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Calculates bolted short circuit currents, DC offset decay, thermal Joule heating withstand (I²t), and mechanical Lorentz forces on parallel switchgear busbars according to IEC 60909.',
      url: `${BASE_URL}/simulators/short-circuit`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Power System Fault Analysis & Switchgear Mechanical Withstand'
    },
    physicsSummary: 'During a bolted short-circuit condition, the initial peak current (Ip = kappa * sqrt(2) * Ik") is driven by the R/X ratio of the network, causing a transient DC offset. The resulting electromagnetic Lorentz forces between parallel busbars (F = mu_0 / 2pi * (i1 * i2 / d)) can exert thousands of Newtons of mechanical force within milliseconds, tearing loose unsupported conductors, while I²t thermal stress vaporizes under-sized cables.'
  },

  mcb_simulator: {
    moduleId: 'mcb_simulator',
    path: '/simulators/mcb',
    title: 'MCB Tripping Curves & Arc Chute Physics (IEC 60898) | ElectroLive™',
    description: 'Interactive 3D cutaway and Time-Current Characteristic (TCC) simulator for miniature circuit breakers (Curves B, C, D). Explore bi-metal thermal overload, magnetic solenoid instantaneous trip, and de-ionizing arc chute blowout.',
    canonicalUrl: `${BASE_URL}/simulators/mcb`,
    keywords: [
      'MCB tripping curve simulator',
      'IEC 60898 circuit breaker',
      'Type B Type C Type D curve',
      'bimetal thermal trip physics',
      'magnetic coil short circuit trip',
      'arc chute splitter plates deion'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Miniature Circuit Breaker (MCB) Physics & TCC Simulator (IEC 60898)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Interactive 3D cutaway and time-current coordination simulator exploring thermal bimetallic deflection, electromagnetic hammer trip, and de-ionizing arc splitter plates in low voltage circuit breakers.',
      url: `${BASE_URL}/simulators/mcb`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Electrical Protection Switchgear & MCB Selection Training'
    },
    physicsSummary: 'A Miniature Circuit Breaker (MCB) operates on two complementary physical principles: a slow-acting bimetallic strip for thermal inverse-time overload protection (where differential thermal expansion bends two bonded metals to release the latch), and an instantaneous electromagnetic coil solenoid that shoots a plunger at high fault currents (3-5x In for Curve B, 5-10x In for Curve C, 10-20x In for Curve D). When contacts part, the electric arc is driven by magnetic blowout coils into de-ionizing splitter plates, cooling and dividing the arc voltage until extinction.'
  },

  loto: {
    moduleId: 'loto',
    path: '/simulators/loto',
    title: 'Lockout / Tagout (LOTO) & Zero-Energy State Simulator (OSHA 1910.147) | ElectroLive™',
    description: 'Step-by-step interactive simulator for OSHA 1910.147 Lockout/Tagout procedures. Learn 6-step zero-energy state verification, residual capacitive energy dissipation, and group padlock hasps.',
    canonicalUrl: `${BASE_URL}/simulators/loto`,
    keywords: [
      'lockout tagout simulator',
      'OSHA 1910.147 LOTO steps',
      'zero energy state verification',
      'residual electrical capacitive discharge',
      'padlock hasp isolation procedure'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Lockout/Tagout (LOTO) Zero-Energy Verification Simulator (OSHA 1910.147)',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Step-by-step interactive compliance trainer for hazardous electrical energy isolation, padlock application, tagout warnings, and verified absence-of-voltage testing.',
      url: `${BASE_URL}/simulators/loto`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'OSHA Workplace Safety & Electrical Isolation Protocol Training'
    },
    physicsSummary: 'OSHA 29 CFR 1910.147 establishes mandatory practices for controlling hazardous energy during maintenance. Simply flipping a switch off is insufficient: residual capacitive charges in power factor correction banks, DC link inverters, or inductive motor windings must be discharged to earth. The standard requires the 6-step sequence: Preparation, Notification, Shutdown, Isolation, Lockout/Tagout Device Application, Stored Energy Dissipation, and Live-Dead-Live Voltage Verification.'
  },

  first_aid: {
    moduleId: 'first_aid',
    path: '/simulators/first-aid',
    title: 'Electrical First Aid, CPR Metronome & Medical Protocol Simulator | ElectroLive™',
    description: 'Learn critical emergency procedures for electrical shock victims. Interactive non-conductive rescue hook drill, CPR chest compression metronome (110 BPM), AED defibrillation, and delayed arrhythmia assessment.',
    canonicalUrl: `${BASE_URL}/simulators/first-aid`,
    keywords: [
      'electrical shock first aid',
      'rescue hook electrical victim',
      'CPR metronome 110 bpm',
      'AED defibrillator electrical shock',
      'delayed arrhythmia rhabdomyolysis'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Electrical Shock First Aid & Emergency Response Simulator',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Emergency rescue protocol training module covering safe victim detachment with fiberglass rescue hooks, continuous CPR chest compression metronome, automated external defibrillator (AED) delivery, and clinical post-shock monitoring.',
      url: `${BASE_URL}/simulators/first-aid`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Medical First Responder & Electrical Emergency Rescue'
    },
    physicsSummary: 'Rescuing an energized electrical shock victim requires immediate isolation of the upstream breaker or deployment of an insulated fiberglass rescue hook rated for the circuit voltage. Never touch the victim directly with bare hands while current flows. In cases of cardiac arrest due to Ventricular Fibrillation (VF), high-quality chest compressions at 100-120 BPM with 2-inch (5cm) depth preserve cerebral perfusion until an AED defibrillator depolarizes the myocardium. All electrical shock victims require 24-hour continuous ECG monitoring and urine myoglobin testing for delayed rhabdomyolysis.'
  },

  assessment: {
    moduleId: 'assessment',
    path: '/assessment',
    title: 'Electrical Safety Qualification & Comprehensive Assessment | ElectroLive™',
    description: 'Test your understanding of electrical hazard engineering, IEC/IEEE standards, protective relaying, and life-safety protocols across industrial and residential modules.',
    canonicalUrl: `${BASE_URL}/assessment`,
    keywords: [
      'electrical safety assessment',
      'electrical engineering quiz',
      'IEC 60479 exam',
      'IEEE 1584 certification test',
      'NFPA 70E qualification'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Electrical Safety & Engineering Qualification Exam',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Standardized assessment module testing engineers and electricians on international safety standards, body impedance calculations, arc flash boundaries, and circuit protection principles.',
      url: `${BASE_URL}/assessment`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Electrical Safety Certification & Competency Evaluation'
    },
    physicsSummary: 'The assessment evaluates mastery over international electrical safety standards including IEC 60479-1 body impedance models, IEEE 1584 arc flash incident energy calculations, IEEE 80 touch voltage limits, IEC 60909 fault currents, and OSHA 1910.147 isolation procedures.'
  },

  safety_quiz: {
    moduleId: 'safety_quiz',
    path: '/safety-quiz',
    title: 'Interactive Electrical Hazard Safety Quiz & Knowledge Challenge | ElectroLive™',
    description: 'Challenge your practical safety knowledge with interactive visual questions covering residential wiring, industrial switchgear, PPE selection, and hazardous voltage recognition.',
    canonicalUrl: `${BASE_URL}/safety-quiz`,
    keywords: [
      'electrical safety quiz',
      'interactive electrical training',
      'PPE selection quiz',
      'residential industrial safety test'
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Interactive Electrical Safety Knowledge Challenge',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Interactive gamified electrical safety challenge testing real-world hazard recognition, PPE rating selection, and emergency decision-making.',
      url: `${BASE_URL}/safety-quiz`,
      author: {
        '@type': 'Person',
        name: 'Anil Sharma'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      educationalUse: 'Gamified Electrical Safety Training & Knowledge Verification'
    },
    physicsSummary: 'Interactive quiz evaluating understanding of touch potentials, let-go limits, arc blast blast-radius calculations, breaker trip classifications, and CPR emergency resuscitation protocols.'
  }
};

/**
 * Helper to update document head tags dynamically
 */
export function applyRouteSEO(moduleId: SimulationType | 'home'): void {
  const data = SEO_ROUTES[moduleId] || SEO_ROUTES.home;

  // 1. Page Title
  document.title = data.title;

  // 2. Helper to set or create meta tag
  const setMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  // Standard Meta
  setMeta('description', data.description);
  setMeta('keywords', data.keywords.join(', '));
  setMeta('author', 'Anil Sharma');
  setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // OpenGraph Tags
  setMeta('og:title', data.title, true);
  setMeta('og:description', data.description, true);
  setMeta('og:url', data.canonicalUrl, true);
  setMeta('og:type', 'website', true);
  setMeta('og:site_name', 'ElectroLive™', true);

  // Twitter Cards
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', data.title);
  setMeta('twitter:description', data.description);
  setMeta('twitter:url', data.canonicalUrl);

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = data.canonicalUrl;

  // Dynamic JSON-LD Structured Data
  let jsonLdEl = document.getElementById('dynamic-jsonld-schema') as HTMLScriptElement | null;
  if (!jsonLdEl) {
    jsonLdEl = document.createElement('script');
    jsonLdEl.id = 'dynamic-jsonld-schema';
    jsonLdEl.type = 'application/ld+json';
    document.head.appendChild(jsonLdEl);
  }
  jsonLdEl.textContent = JSON.stringify(data.jsonLd, null, 2);
}

/**
 * Resolves simulation module from window path
 */
export function resolveModuleFromPath(pathname: string): SimulationType {
  const clean = pathname.toLowerCase().replace(/\/$/, '');
  if (clean.includes('/simulators/ac-shock') || clean.includes('ac-shock')) return 'ac_shock';
  if (clean.includes('/simulators/dc-shock') || clean.includes('dc-shock')) return 'dc_shock';
  if (clean.includes('/simulators/earth-fault') || clean.includes('earth-fault')) return 'earth_fault';
  if (clean.includes('/simulators/short-circuit') || clean.includes('short-circuit')) return 'short_circuit';
  if (clean.includes('/simulators/step-touch') || clean.includes('step-touch')) return 'step_touch';
  if (clean.includes('/simulators/arc-flash') || clean.includes('arc-flash')) return 'arc_flash';
  if (clean.includes('/simulators/loto') || clean.includes('loto')) return 'loto';
  if (clean.includes('/simulators/first-aid') || clean.includes('first-aid')) return 'first_aid';
  if (clean.includes('/simulators/mcb') || clean.includes('mcb')) return 'mcb_simulator';
  if (clean.includes('/assessment')) return 'assessment';
  if (clean.includes('/safety-quiz')) return 'safety_quiz';
  return 'ac_shock';
}
