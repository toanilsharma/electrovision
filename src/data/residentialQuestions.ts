export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  targetProfiles: string[]; // 'child', 'teenager', 'adult_male', 'adult_female', 'all'
  category: string;
}

export const RESIDENTIAL_QUESTIONS: AssessmentQuestion[] = [
  // CHILD & FAMILY SAFETIES (1-20)
  {
    id: 1,
    question: "What should you do before plugging a toy or device into an outlet?",
    options: ["Make sure your hands are completely dry", "Wipe it with a wet towel", "Lick the plug to clean it", "Pull the cord as hard as you can"],
    correctAnswer: 0,
    explanation: "Water conducts electricity! Wet hands can let electric current pass through your body. Always dry hands first.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Basic Safety"
  },
  {
    id: 2,
    question: "If a ball or toy gets stuck near outdoor power lines, what is the right choice?",
    options: ["Climb the pole to get it", "Use a metal stick to reach it", "Ask an adult for help and stay far away", "Throw rocks at the power line"],
    correctAnswer: 2,
    explanation: "Power lines carry high voltage that can jump through air or metal poles. Never touch power lines or climb near them.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 3,
    question: "Why should toddler safety caps be placed inside empty wall outlets?",
    options: ["To make the room look pretty", "To stop children from poking metal objects inside", "To save electricity bills", "To keep out light"],
    correctAnswer: 1,
    explanation: "Wall outlets have live electrical contacts. Safety caps prevent children from sticking keys, pins, or fingers into the socket.",
    targetProfiles: ["child", "adult_female", "adult_male", "all"],
    category: "Childproofing"
  },
  {
    id: 4,
    question: "What is dangerous about using a mobile phone while charging in the bathtub?",
    options: ["The battery will charge too slowly", "If dropped, electricity can flow through water and cause a fatal shock", "The screen brightness will drop", "The phone will lose signal"],
    correctAnswer: 1,
    explanation: "Water dramatically lowers body electrical resistance. A charger dropped in bathwater creates a direct path for lethal current.",
    targetProfiles: ["teenager", "adult_female", "adult_male", "all"],
    category: "Water & Power"
  },
  {
    id: 5,
    question: "What should you do if you notice a wire is frayed and metal wires are showing?",
    options: ["Wrap it in paper tape", "Stop using it immediately and tell an adult or electrician", "Touch it gently to check if warm", "Keep using it if it still powers the light"],
    correctAnswer: 1,
    explanation: "Exposed wires can cause short circuits, severe electrical shocks, or spark a home fire.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Cord Safety"
  },
  {
    id: 6,
    question: "How should you unplug a hair dryer or lamp from the wall?",
    options: ["Yank the cord from far away", "Pull firmly on the solid plastic plug head", "Twist the wire while pulling", "Cut the cord with scissors"],
    correctAnswer: 1,
    explanation: "Pulling the cord damages internal copper strands and insulation, leading to dangerous loose connections and shocks.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Basic Safety"
  },
  {
    id: 7,
    question: "What does an GFCI (Ground Fault Circuit Interrupter) outlet with 'TEST' and 'RESET' buttons do in bathrooms?",
    options: ["It measures water temperature", "It cuts off electricity instantly if it detects current leaking to water or ground", "It makes appliances work twice as fast", "It acts as a nightlight"],
    correctAnswer: 1,
    explanation: "GFCIs monitor electrical current balance and cut power within milliseconds to prevent electrocution in damp areas.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 8,
    question: "If a slice of bread gets stuck in a toaster, how should you safely remove it?",
    options: ["Pry it out with a metal knife while plugged in", "Unplug the toaster first, then use wooden tongs", "Use metal forks while turned on", "Shake it upside down while plugged in"],
    correctAnswer: 1,
    explanation: "Metal utensils in a live toaster touch heating elements carrying 120V/240V, causing instant electric shock.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 9,
    question: "Why should you never run extension cords under rugs or carpets?",
    options: ["It makes the carpet look bumpy", "Trapped heat can melt insulation and cause hidden fires", "The cord gets dirty faster", "It slows down internet speed"],
    correctAnswer: 1,
    explanation: "Walking on covered cords damages wires, while trapped heat cannot dissipate, creating a major fire risk.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Home Safety"
  },
  {
    id: 10,
    question: "During a severe lightning storm, which action is safest indoors?",
    options: ["Taking a bath or hot shower", "Staying away from wired phones, metal pipes, and plugged appliances", "Standing next to open windows with metal frames", "Holding metal railings on balconies"],
    correctAnswer: 1,
    explanation: "Lightning can travel through metal plumbing pipes and electrical wiring. Stay clear of connected appliances during storms.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Lightning Safety"
  },
  {
    id: 11,
    question: "What is the main sign that an extension power strip is overloaded?",
    options: ["It turns bright neon blue", "It feels hot to touch, smells burnt, or trips the breaker", "It plays a chime song", "The cord becomes flexible"],
    correctAnswer: 1,
    explanation: "Drawing more current than a power strip is rated for causes overheating, melting plastics, and potential electrical fires.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 12,
    question: "If water spills over your electric blender, what is your first step?",
    options: ["Wipe the liquid with your hand while it runs", "Safely turn off the power switch or unplug with dry hands", "Pour more water to wash it", "Blow air on it while turned on"],
    correctAnswer: 1,
    explanation: "Disconnect the power source safely before touching flooded appliances to prevent current flowing into you.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 13,
    question: "Why are light bulbs rated with maximum wattage limits (e.g. Max 60W)?",
    options: ["To limit room brightness", "Bulbs over the rating overheat fixtures and can ignite shade materials", "Higher wattage bulbs use less energy", "It is just a suggestion"],
    correctAnswer: 1,
    explanation: "Using a bulb exceeding fixture wattage ratings causes excessive heat accumulation, breaking insulation and risking fires.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Lighting Safety"
  },
  {
    id: 14,
    question: "What should you do if a room smells like burnt plastic or fishy chemical odors near an outlet?",
    options: ["Ignore it until tomorrow", "Turn off the main breaker or circuit, unplug items, and inspect for melting", "Spray air freshener into the socket", "Plug in a fan to clear the smell"],
    correctAnswer: 1,
    explanation: "A fishy or burning plastic smell near outlets indicates overheating electrical contacts or smoldering wire insulation.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Emergency Action"
  },
  {
    id: 15,
    question: "What is the purpose of the main circuit breaker inside your home's breaker box?",
    options: ["To turn on the garden sprinklers", "To safely cut off all electrical power to the house during emergency or overload", "To boost your Wi-Fi signal", "To change lighting colors"],
    correctAnswer: 1,
    explanation: "The main circuit breaker protects the entire home by shutting off incoming current when demand exceeds safe thermal limits.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Breaker Panel"
  },
  {
    id: 16,
    question: "Why should you never touch a person who is currently undergoing an active electric shock?",
    options: ["They might startle you", "Your body will become part of the circuit and shock you too", "It is bad manners", "It breaks the appliance"],
    correctAnswer: 1,
    explanation: "Human skin conducts electricity. Always turn off main power or push the victim away using a dry non-conductive object like wood.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "First Aid & CPR"
  },
  {
    id: 17,
    question: "Which of these materials is an ELECTRICAL INSULATOR (blocks electricity)?",
    options: ["Copper wire", "Dry Rubber / Plastic", "Tap water", "Aluminum foil"],
    correctAnswer: 1,
    explanation: "Rubber and plastic have high electrical resistance and block electron flow, which is why wire coverings use them.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Basic Physics"
  },
  {
    id: 18,
    question: "Which of these materials is an ELECTRICAL CONDUCTOR (lets electricity flow easily)?",
    options: ["Dry Wood", "Glass", "Copper metal", "Pure Dry Air"],
    correctAnswer: 2,
    explanation: "Metals like copper and aluminum have free electrons that carry electrical current easily.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Basic Physics"
  },
  {
    id: 19,
    question: "Why should space heaters be kept at least 3 feet (1 meter) away from curtains and bedsheets?",
    options: ["To allow airflow to cold walls", "Radiant heat can easily ignite flammable fabrics", "So you can see the heater better", "Heaters operate quieter far away"],
    correctAnswer: 1,
    explanation: "Space heaters generate high temperatures. Combustible items within 3 feet can catch fire without direct contact.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Appliance Safety"
  },
  {
    id: 20,
    question: "What is the safest way to store electric garden power tools after trimming wet grass?",
    options: ["Leave them outdoors in the rain", "Unplug, clean off grass with a dry cloth, and store in a dry shed", "Wash them with a hose while plugged in", "Wrap cords tightly around hot motors"],
    correctAnswer: 1,
    explanation: "Storing power tools in damp environments causes rust and moisture ingress into electrical motor windings.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },

  // TEENAGER & ADULT HOME SCENARIOS (21-60)
  {
    id: 21,
    question: "You see sparks jump out when plugging in a laptop charger. What does this usually mean?",
    options: ["It is a cool feature showing power is active", "A sudden arc occurred due to loose contact or shorted wires", "The laptop is fully charged", "The room is too dark"],
    correctAnswer: 1,
    explanation: "Small momentary sparks can happen when contact is made, but loud pops or persistent sparks indicate damaged outlets or shorts.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Outlet Safety"
  },
  {
    id: 22,
    question: "Why is it dangerous to replace a blown 15-Amp fuse with a 30-Amp fuse?",
    options: ["The 30-Amp fuse is too shiny", "The wires in the wall may overheat and burn before the 30-Amp fuse trips", "It causes lights to flicker yellow", "The fuse will explode instantly"],
    correctAnswer: 1,
    explanation: "Fuses match wire gauge size. Putting a larger fuse allows excess current to melt home wiring inside walls.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Breaker Panel"
  },
  {
    id: 23,
    question: "What should you do if an electric appliance falls into a full sink?",
    options: ["Reach in quickly to grab it", "Unplug it from the wall socket first before touching the water", "Use a metal spoon to scoop it", "Turn on the water faucet full speed"],
    correctAnswer: 1,
    explanation: "Water conducts current to ground. Touching water containing an active appliance results in severe electric shock.",
    targetProfiles: ["teenager", "adult_female", "adult_male", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 24,
    question: "What is the primary function of the third round pin on a 3-prong electrical plug?",
    options: ["It carries extra electricity for power", "It is a safety ground wire that safely channels fault current into the earth", "It locks the plug so it doesn't fall out", "It reduces electricity cost"],
    correctAnswer: 1,
    explanation: "The ground pin connects metal appliance housings to earth, tripping the breaker if internal wires touch the case.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Grounding"
  },
  {
    id: 25,
    question: "Why should you never clip or break off the third ground pin of a plug to fit a 2-slot outlet?",
    options: ["It voids the manufacturer warranty only", "It removes ground fault protection, exposing users to lethal metal frame shocks", "The appliance will spin backwards", "The plug will get stuck"],
    correctAnswer: 1,
    explanation: "Cutting the ground pin disables the equipment safety ground path, leaving you unprotected against internal short circuits.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Grounding"
  },
  {
    id: 26,
    question: "Which type of fire extinguisher must be used on an ACTIVE ELECTRICAL FIRE?",
    options: ["Class A (Water bucket)", "Class C / CO2 / Dry Chemical extinguisher", "Wet foam blanket", "Bucket of soapy water"],
    correctAnswer: 1,
    explanation: "Water conducts electricity and causes violent shock hazards! Always use Class C / CO2 / Dry Chemical on electrical fires.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Fire Safety"
  },
  {
    id: 27,
    question: "If a power line falls onto your car while you are inside, what should you do?",
    options: ["Step out normally with one foot on the ground and one on the car", "Stay inside the car, tell others to keep back, and call emergency services", "Touch the power line to move it away", "Run out touching the metal door frame"],
    correctAnswer: 1,
    explanation: "The car tires insulate you! Touching the car and ground at the same time creates a path for high voltage through your body.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 28,
    question: "If you MUST evacuate a car touched by a fallen power line due to fire, how should you exit?",
    options: ["Walk out slowly taking long steps", "Jump clear landing with both feet together without touching the car and ground at once", "Crawl out on hands and knees", "Slide down the metal hood"],
    correctAnswer: 1,
    explanation: "Jumping clear with feet together prevents 'Step Potential' voltage differences between your feet across electrified ground.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 29,
    question: "Why is it unsafe to chain multiple extension cords ('daisy-chaining') together?",
    options: ["It makes the cords look messy", "Voltage drops and cumulative resistance causes cords to overheat and ignite", "It reverses AC polarity", "It drains the main battery"],
    correctAnswer: 1,
    explanation: "Connecting multiple extension cords increases electrical resistance, generating dangerous heat over the long run.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 30,
    question: "What is the safe distance to keep when carrying tall metal ladders near outdoor overhead power lines?",
    options: ["At least 10 feet (3 meters) away", "1 foot away", "Directly under the line as long as you don't touch", "Distance does not matter"],
    correctAnswer: 0,
    explanation: "High voltage electricity can arc through air to metal ladders. Keep a strict clearance of at least 10 feet.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 31,
    question: "What does a flickering light in your home usually indicate?",
    options: ["Ghost activity", "Loose wiring connections or circuit overloading requiring inspection", "High energy savings", "Normal bulb break-in period"],
    correctAnswer: 1,
    explanation: "Flickering lights often point to loose wire nuts or corroded contacts, which spark arc faults inside walls.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 32,
    question: "What should you do before changing a ceiling light bulb?",
    options: ["Turn off the light switch and let the bulb cool down", "Pour cold water on the hot bulb", "Stand on a wet metal stool while powered", "Lick your fingertips for grip"],
    correctAnswer: 0,
    explanation: "Turning off the switch isolates the live hot wire. Cooling prevents glass thermal shattering burns.",
    targetProfiles: ["teenager", "adult_female", "adult_male", "all"],
    category: "Lighting Safety"
  },
  {
    id: 33,
    question: "Why should wet hands never touch circuit breaker switches?",
    options: ["Water leaves smudge marks", "Moisture on skin lowers electrical resistance and increases shock risk", "The breaker will rust instantly", "It changes circuit voltage"],
    correctAnswer: 1,
    explanation: "Wet skin allows current to bypass natural skin resistance, leading to painful or dangerous shocks.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Breaker Panel"
  },
  {
    id: 34,
    question: "What is the standard household voltage in North America vs Europe/Asia?",
    options: ["12V DC vs 24V DC", "120V AC (North America) vs 230V AC (Europe/Asia)", "500V vs 1000V", "5V USB everywhere"],
    correctAnswer: 1,
    explanation: "North America uses 120V 60Hz AC for standard outlets, while Europe and Asia use 220V-240V 50Hz AC.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Basic Physics"
  },
  {
    id: 35,
    question: "Why should you never plug high-wattage space heaters into thin decorative extension cords?",
    options: ["Thin wires have high resistance and melt under heavy current loads", "The heater won't turn on", "The room gets too warm", "Thin cords block heat"],
    correctAnswer: 0,
    explanation: "Space heaters draw ~1500W (12.5A). Thin 18-gauge cords overheat quickly under heavy load and catch fire.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Appliance Safety"
  },
  {
    id: 36,
    question: "What should you check on an electric blanket before using it in winter?",
    options: ["Check for charred spots, cracked wiring, or bent internal elements", "Check if it matches bed sheet colors", "Wash it in hot water while plugged in", "Iron it with a hot steam iron"],
    correctAnswer: 0,
    explanation: "Kinked or worn electric blanket wires produce hot spots that ignite mattress foam and bedding.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Appliance Safety"
  },
  {
    id: 37,
    question: "What is the danger of using a damaged wall outlet with cracked plastic faceplates?",
    options: ["It looks outdated", "Live internal brass contacts are exposed to accidental finger contact", "It uses more electricity", "It makes plugs slip out easily"],
    correctAnswer: 1,
    explanation: "Cracked faceplates expose live terminals carrying lethal house voltage. Replace cracked covers immediately.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Outlet Safety"
  },
  {
    id: 38,
    question: "Why should microwave oven back covers NEVER be opened by untrained people?",
    options: ["It voids warranty stickers", "High-voltage capacitors store up to 2,000 Volts even when unplugged!", "Microwaves escape into the room", "The turntable stops spinning"],
    correctAnswer: 1,
    explanation: "Microwave high-voltage capacitors hold lethal charge long after being unplugged. Servicing requires discharge tools.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Appliance Safety"
  },
  {
    id: 39,
    question: "What is the function of an Arc Fault Circuit Interrupter (AFCI) breaker?",
    options: ["To dim bedroom lights", "To detect dangerous electrical arcing (sparks) in home wiring and trip power", "To boost ceiling fan speed", "To filter audio noise"],
    correctAnswer: 1,
    explanation: "AFCI breakers analyze electrical waveforms for spark arcing signature to prevent electrical house fires.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Breaker Panel"
  },
  {
    id: 40,
    question: "Why are outdoor electrical outlets required to have weatherproof covers?",
    options: ["To prevent dirt buildup", "To prevent rain and moisture from creating ground faults and short circuits", "To keep insects inside", "For aesthetic house matching"],
    correctAnswer: 1,
    explanation: "Water entering outdoor outlets creates short circuits to ground, tripping breakers and causing shock hazards.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },

  // EXPANDED RESIDENTIAL SAFETY QUESTIONS (41-100)
  {
    id: 41,
    question: "What is the primary danger of leaving a smartphone charging under your pillow overnight?",
    options: ["The battery charges too quickly", "Heat cannot escape, causing thermal runaway and pillow fires", "Wi-Fi signals get blocked", "The screen glass will warp"],
    correctAnswer: 1,
    explanation: "Pillows trap battery heat. Overheating lithium-ion batteries can swell, burst, and ignite bedding.",
    targetProfiles: ["teenager", "child", "adult_female", "adult_male", "all"],
    category: "Battery Safety"
  },
  {
    id: 42,
    question: "Why should you never touch electrical switches while standing barefoot on a wet tile floor?",
    options: ["Bare feet smudge floor tiles", "Wet feet create a direct, low-resistance ground path through your body", "Your feet will get cold", "Tile floors reflect electricity"],
    correctAnswer: 1,
    explanation: "Wet bare feet connect you directly to earth ground. Any current leakage through the switch passes through your heart.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 43,
    question: "What should you do if an electric lawnmower cuts through its own power cord?",
    options: ["Grab the cut wire with bare hands", "Release the handle, step back, and unplug the cord from the wall outlet first", "Tie the cut wires in a knot", "Pour water on the cord"],
    correctAnswer: 1,
    explanation: "The cord remains live! Never touch severed cords until completely disconnected from the wall outlet.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 44,
    question: "What is the correct action if a breaker trips repeatedly as soon as you reset it?",
    options: ["Hold the breaker lever down forcibly with tape", "Leave it off and investigate for short circuits or damaged appliances", "Replace it with a bigger breaker", "Pour water on the breaker panel"],
    correctAnswer: 1,
    explanation: "A breaker that trips immediately protects you from an active short circuit or severe overload. Forcing it on causes fires.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Breaker Panel"
  },
  {
    id: 45,
    question: "Why should electric power tools be unplugged before changing drill bits or saw blades?",
    options: ["To save electricity", "To prevent accidental trigger activation while your fingers touch sharp metal parts", "To keep bits sharp", "To cool the motor"],
    correctAnswer: 1,
    explanation: "Accidental bumping of the power switch while changing blades can cause instant limb injuries.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Tool Safety"
  },
  {
    id: 46,
    question: "How does a ground wire protect you from getting shocked by a washing machine?",
    options: ["It cleans the washing water", "If a live wire touches the metal casing, current safely flows to ground and trips the breaker", "It speeds up the spin cycle", "It reduces vibration noise"],
    correctAnswer: 1,
    explanation: "Grounding keeps appliance metal frames at zero Volts potential, safely conducting fault current away from your body.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Grounding"
  },
  {
    id: 47,
    question: "Why are cheap, unbranded counterfeit USB phone chargers dangerous?",
    options: ["They come in plain boxes", "They lack proper electrical isolation between 120V/230V mains and low voltage USB", "They download malware", "They make phone screens dim"],
    correctAnswer: 1,
    explanation: "Counterfeit chargers often lack safety distance insulation, allowing high voltage mains to leak directly into phone casings.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Appliance Safety"
  },
  {
    id: 48,
    question: "What is the safest way to test if an outdoor electric grill cord is safe to use?",
    options: ["Inspect visually for cuts, cracked insulation, or loose prongs before plugging in", "Plug it in and splash water on it", "Touch live wires to feel warmth", "Smell the plug"],
    correctAnswer: 0,
    explanation: "Always perform a visual inspection for insulation damage before powering outdoor appliances.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 49,
    question: "Why should young children never play with wall-plug air fresheners or nightlights?",
    options: ["They are too bright", "Liquid leaks or plastic breakage exposes live 120V prongs", "They use too much power", "They turn off automatically"],
    correctAnswer: 1,
    explanation: "Small plugin devices can be pulled out slightly by children, exposing energized metal prongs to small hands.",
    targetProfiles: ["child", "adult_female", "adult_male", "all"],
    category: "Childproofing"
  },
  {
    id: 50,
    question: "What is the main danger of placing clothes to dry directly over electric baseboard heaters?",
    options: ["Clothes will shrink", "Blocking airflow causes high heat buildup and fabric ignition", "Heater colors will fade", "Room humidity drops"],
    correctAnswer: 1,
    explanation: "Baseboard heaters reach surface temperatures that easily ignite cotton and synthetic fabrics if ventilation is blocked.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Appliance Safety"
  },
  {
    id: 51,
    question: "What should you do if an electric stove coil begins smoking and sparking red fire?",
    options: ["Pour a cup of tap water on the stove coil", "Turn off burner controls, main breaker if needed, and use dry chemical extinguisher", "Fan the sparks with a towel", "Blow hard on the flame"],
    correctAnswer: 1,
    explanation: "Never throw water on electric stove fires. Shut off power and use a Class C dry chemical fire extinguisher.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 52,
    question: "Why are extension cords intended for temporary use only, not permanent wiring?",
    options: ["They are painted red", "Flexible cords deteriorate faster, suffer mechanical damage, and lack wall conduit armor", "They use DC current", "They attract dust"],
    correctAnswer: 1,
    explanation: "Extension cord insulation degrades when exposed to continuous wear, bending, and thermal stress over long periods.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 53,
    question: "If you feel a mild tingling sensation when touching your refrigerator door, what does this mean?",
    options: ["Static electricity from floor tiles", "Grounding fault or insulation failure carrying leakage current to the metal door!", "The fridge is extra cold", "Normal operation"],
    correctAnswer: 1,
    explanation: "Tingling means the appliance case is energized due to missing ground or shorted wires! Unplug and call an electrician immediately.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Appliance Safety"
  },
  {
    id: 54,
    question: "Why should metallic balloons (Mylar balloons) be kept away from outdoor power lines?",
    options: ["They absorb sunlight", "Mylar metallic foil conducts electricity, causing explosive short circuits and blackouts", "They pop easily", "They float too high"],
    correctAnswer: 1,
    explanation: "Metallic balloons touching power lines bridge phases, causing violent arc short circuits and burning down utility lines.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 55,
    question: "What is the purpose of a surge protector strip for computers and TVs?",
    options: ["To store backup power for hours", "To clamp sudden high voltage spikes (like lightning surges) to protect sensitive electronics", "To convert AC to battery power", "To speed up computer chips"],
    correctAnswer: 1,
    explanation: "Surge protectors contain metal oxide varistors (MOVs) that divert destructive transient voltage surges safely to ground.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Appliance Safety"
  },
  {
    id: 56,
    question: "Why should you never plug two high-power appliances (e.g., microwave and toaster) into the same 15A outlet circuit?",
    options: ["The wall will turn black", "Combined current exceeds 15 Amps, tripping the circuit breaker", "Food will taste metallic", "Plugs will stick together"],
    correctAnswer: 1,
    explanation: "Microwaves (1200W) and toasters (1200W) together draw ~20A on a 15A circuit, exceeding breaker limits.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 57,
    question: "What should you do if an electric heating pad cord feels extremely hot while in bed?",
    options: ["Cover it with extra blankets", "Turn it off and unplug immediately to prevent bed fires", "Turn the temperature knob higher", "Sleep on top of it"],
    correctAnswer: 1,
    explanation: "Hot heating pad cords indicate broken copper strands carrying concentrated current, posing immediate burn and fire risks.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Appliance Safety"
  },
  {
    id: 58,
    question: "Why is it dangerous to dig deep holes in your yard without calling utility line location services?",
    options: ["You might hit tree roots", "Underground high-voltage cables can be severed, causing lethal shocks and outages", "Soil gets messy", "It ruins the grass pattern"],
    correctAnswer: 1,
    explanation: "Underground electric cables lie buried just inches to feet beneath lawns. Striking them with shovels causes fatal shocks.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 59,
    question: "What does the red 'TRIP' indicator position on a circuit breaker mean?",
    options: ["The breaker is operating normally", "The breaker automatically cut off power due to an electrical overload or short circuit", "The house has no utility bill", "Solar panels are active"],
    correctAnswer: 1,
    explanation: "When a breaker trips, its switch handle rests in the middle position between ON and OFF to signal fault disconnection.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Breaker Panel"
  },
  {
    id: 60,
    question: "What is the safe procedure to reset a tripped circuit breaker?",
    options: ["Push handle all the way to OFF first, then switch back to ON with dry hands", "Bang on the metal box with a hammer", "Pour lubricating oil on the switch", "Hold it ON forcibly"],
    correctAnswer: 0,
    explanation: "Breakers must be firmly clicked to the OFF position first to reset the internal spring mechanism before switching ON.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Breaker Panel"
  },

  // MORE HOME & FAMILY SAFETY (61-100)
  {
    id: 61,
    question: "Why shouldn't children climb trees near power lines?",
    options: ["Tree branches might break", "Tree branches touching power lines can conduct high voltage to the tree trunk", "Birds will get scared", "Leaves will fall off"],
    correctAnswer: 1,
    explanation: "Live electric lines touching tree limbs energize the wood, especially when sap or rain moisture is present.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 62,
    question: "What should you do if your phone charger block feels scalding hot while plugged into the wall?",
    options: ["Keep charging until phone reaches 100%", "Unplug it carefully and stop using that charger", "Put it under cold water while plugged in", "Blow on it with a fan"],
    correctAnswer: 1,
    explanation: "Overheating chargers indicate failing internal transformers or shorted circuitry that can melt the outlet casing.",
    targetProfiles: ["teenager", "child", "adult_female", "adult_male", "all"],
    category: "Battery Safety"
  },
  {
    id: 63,
    question: "Why should you never use an electric hair straightener right beside a filled sink?",
    options: ["Water vapor dulls the ceramic plate", "Accidental drops into water create an immediate electrocution hazard", "The cord gets wet", "It burns hair faster"],
    correctAnswer: 1,
    explanation: "High voltage electrical appliances dropped in water transfer current through the sink basin to ground through you.",
    targetProfiles: ["teenager", "adult_female", "adult_male", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 64,
    question: "What color is the Ground wire in standard modern home electrical wiring (US/UK)?",
    options: ["Black or Red", "Bare Copper, Green, or Green/Yellow stripes", "Blue or White", "Yellow or Pink"],
    correctAnswer: 1,
    explanation: "Green or bare copper wires are universally reserved for equipment grounding protection.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Basic Physics"
  },
  {
    id: 65,
    question: "Why is it unsafe to run extension cords through doorways or window frames?",
    options: ["Doors might get jammed", "Closing doors pinch and cut wire insulation, exposing live conductors", "It blocks foot traffic only", "The cord turns green"],
    correctAnswer: 1,
    explanation: "Repeated crushing of cords in door hinges damages copper wire strands and tears protective PVC insulation.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Home Safety"
  },
  {
    id: 66,
    question: "What should you do if an electric kettle cord is warm to touch during boiling?",
    options: ["Normal for heavy 1500W current, but if hot or melting, replace cord immediately", "Throw the kettle away instantly", "Put ice on the cord while boiling", "Wrap tape tightly"],
    correctAnswer: 0,
    explanation: "Kettles draw high current (~13A), making cords slightly warm. Scalding hot cords signal damaged connections.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 67,
    question: "Why is it dangerous to plug a 3-prong appliance into an ungrounded 2-slot outlet using an adapter without grounding the green lug?",
    options: ["The appliance runs at half speed", "The metal frame loses fault protection, risking severe shocks if shorted", "It burns out the light bulb", "Plugs get loose"],
    correctAnswer: 1,
    explanation: "Cheater adapters must have their ground tab screwed to a grounded metal box, or else protection is lost.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Grounding"
  },
  {
    id: 68,
    question: "What is the purpose of tamper-resistant (TR) wall receptacles in modern homes?",
    options: ["To prevent theft of electrical power", "Internal spring shutters prevent single objects (keys, paperclips) from being inserted", "To lock plug cords in place", "To block dust"],
    correctAnswer: 1,
    explanation: "TR outlets require equal pressure on both slots simultaneously, preventing curious children from sticking single metal pins in.",
    targetProfiles: ["child", "adult_female", "adult_male", "all"],
    category: "Childproofing"
  },
  {
    id: 69,
    question: "What should you do if you see a neighbor flying a kite near overhead electrical wires?",
    options: ["Cheer them on", "Warn them immediately to move to an open field far away from power lines", "Try to catch the kite string", "Climb the fence"],
    correctAnswer: 1,
    explanation: "Kite strings, especially when damp or containing metallic threads, conduct high voltage directly to the person holding the reel.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 70,
    question: "Why shouldn't you touch an electric ceiling fan metal body while standing on an aluminum ladder?",
    options: ["It will turn the fan on", "Aluminum ladders conduct current directly through your body to the floor if a ground fault exists", "The ladder will tip over", "It scratches the fan finish"],
    correctAnswer: 1,
    explanation: "Metal ladders provide an excellent ground path. Use fiberglass or dry wood ladders when doing electrical work.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 71,
    question: "What is the danger of using a portable generator indoors or in an enclosed garage?",
    options: ["It uses too much gas", "Exhaust produces deadly, odorless Carbon Monoxide (CO) gas within minutes!", "It makes noise", "The lights get too bright"],
    correctAnswer: 1,
    explanation: "Generators emit lethal Carbon Monoxide. Always run generators outdoors at least 20 feet away from windows and doors.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Emergency Action"
  },
  {
    id: 72,
    question: "What is 'Backfeeding' from a portable generator, and why is it extremely dangerous?",
    options: ["Powering your fridge backwards", "Plugging generator output into a wall outlet sends lethal high voltage back into utility power lines!", "It drains generator fuel fast", "It trips the generator fuse"],
    correctAnswer: 1,
    explanation: "Backfeeding energizes utility lines outside your house, threatening utility linemen working to repair storm damage.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Emergency Action"
  },
  {
    id: 73,
    question: "Why should you never spray liquid cleaners directly onto live light switches or outlets?",
    options: ["It wastes cleaning liquid", "Liquid seeps into live contacts, causing short circuits, sparks, and electrical shocks", "It changes switch colors", "The switch turns stiff"],
    correctAnswer: 1,
    explanation: "Spraying conductive cleaning fluids into electrical faceplates causes short circuits and dangerous shock paths.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Home Safety"
  },
  {
    id: 74,
    question: "What is the safest way to clean a dusty electrical outlet or switch plate?",
    options: ["Use a soaking wet sponge", "Turn off power at the main breaker, use a dry microfiber cloth", "Spray water hose", "Scrape inside with a metal pin"],
    correctAnswer: 1,
    explanation: "Shutting off breaker power and using dry cloths eliminates liquid conduction and contact shock risks.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Home Safety"
  },
  {
    id: 75,
    question: "What does it mean if an electrical outlet wall faceplate feels hot to touch?",
    options: ["Normal in summer heat", "Dangerous loose connection or overload occurring inside the electrical box!", "The house heater is working", "Higher Wi-Fi speed"],
    correctAnswer: 1,
    explanation: "Hot faceplates indicate excessive electrical resistance from loose screw terminals or overloaded wiring inside the junction box.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outlet Safety"
  },
  {
    id: 76,
    question: "Why should you never operate an electric blender or food processor with a damaged power cord?",
    options: ["Food won't blend smoothly", "Kitchen moisture and food liquids can touch exposed wires, creating short circuits", "The motor spins backwards", "The glass pitcher breaks"],
    correctAnswer: 1,
    explanation: "Exposed wires in wet kitchen environments create high risk for electrical shocks and fires.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 77,
    question: "What is the purpose of testing your home GFCI outlets once a month?",
    options: ["To clear dust", "To verify internal trip mechanism functions properly to protect against electrocution", "To reset Wi-Fi", "To test wall paint durability"],
    correctAnswer: 1,
    explanation: "GFCI internal sensing components can fail over time due to voltage surges. Press 'TEST' monthly to confirm protection.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 78,
    question: "What should happen when you press the 'TEST' button on a working GFCI outlet?",
    options: ["The 'RESET' button pops out and power to connected devices is cut instantly", "A loud horn sounds", "The wall outlet glows blue", "Nothing changes"],
    correctAnswer: 0,
    explanation: "Pressing TEST simulates a ground fault, tripping the breaker mechanism and popping out the RESET button.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 79,
    question: "Why shouldn't you leave high-power hair dryers plugged in and resting near filled washbasins?",
    options: ["It takes up counter space", "Accidental bumps or pets can knock the live unit into water, energizing the sink", "The dryer handle gets dusty", "It drains vampire power"],
    correctAnswer: 1,
    explanation: "Even when switched OFF, plugged-in appliances have live hot wire terminals inside that energize water if submerged.",
    targetProfiles: ["teenager", "adult_female", "adult_male", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 80,
    question: "What is the safe procedure when replacing an electric oven light bulb?",
    options: ["Unplug oven or turn off oven circuit breaker, wait for oven to cool completely", "Change it while baking at 400°F", "Touch live socket with wet hands", "Use a metal knife to pry glass cover"],
    correctAnswer: 0,
    explanation: "Isolate circuit power and let heating elements cool down before touching light sockets.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 81,
    question: "Why should you never remove the protective plastic guard from electric hedge trimmers?",
    options: ["The tool looks unfinished", "The guard prevents your hands from reaching blades and slicing power cords", "It makes the tool heavier", "It slows blade rotation"],
    correctAnswer: 1,
    explanation: "Guards prevent accidental contact with moving teeth and prevent accidental cutting of energized supply cords.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Tool Safety"
  },
  {
    id: 82,
    question: "What should you do if an outdoor extension cord gets submerged in a rain puddle?",
    options: ["Pick it up out of the puddle immediately with bare hands", "Turn off power at the house outlet/breaker before touching the cord or water", "Pull the cord out quickly while plugged in", "Drink from the puddle"],
    correctAnswer: 1,
    explanation: "Water around outdoor plugs conducts electricity. De-energize the circuit before stepping into flooded cord areas.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 83,
    question: "What does a buzzing sound coming from an electrical switch on your wall indicate?",
    options: ["Insects nested inside", "Arcing between loose electrical contacts inside the switch mechanism", "Normal fan power flow", "Low battery level"],
    correctAnswer: 1,
    explanation: "Buzzing or sizzling sounds in switches mean electric current is arcing across loose contacts, creating fire hazards.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 84,
    question: "Why is it important to keep paper, boxes, and clutter away from main home circuit breaker panels?",
    options: ["To keep the basement tidy", "Panels require clear access during emergencies and must not have flammable items nearby", "To let the panel breathe cold air", "Breaker boxes drop dust"],
    correctAnswer: 1,
    explanation: "Emergency access to breakers must be unimpeded, and combustible boxes near panels catch fire if arcing occurs.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Breaker Panel"
  },
  {
    id: 85,
    question: "What is 'Vampire Draw' (Standby Power) in home electronics?",
    options: ["Power consumed by devices even when switched OFF or in standby mode", "Electricity used during nighttime hours only", "Power stolen by neighbors", "High voltage power spikes"],
    correctAnswer: 0,
    explanation: "Electronics like TVs, chargers, and microwaves draw small continuous current to power clocks and remote receivers.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Appliance Safety"
  },
  {
    id: 86,
    question: "Why should you unplug laptop chargers from wall sockets when leaving on long vacations?",
    options: ["To prevent continuous heat degradation and protect against lightning surge spikes", "The charger will lose its memory", "Laptops won't turn on again", "Wall outlets freeze"],
    correctAnswer: 0,
    explanation: "Unplugging non-essential electronics during travel prevents surge damage from thunder storms and saves energy.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Home Safety"
  },
  {
    id: 87,
    question: "What is the danger of plugging a 120V appliance into a 240V high-voltage outlet?",
    options: ["Appliance runs twice as efficient", "Excess voltage causes insulation breakdown, violent overheating, and component explosion!", "Bulbs shine dim yellow", "Nothing happens"],
    correctAnswer: 1,
    explanation: "Applying double rated voltage forces excessive current into circuits, causing instant component burnout and fires.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Basic Physics"
  },
  {
    id: 88,
    question: "What should you do if an electric space heater tips over in your living room?",
    options: ["Modern heaters have tip-over safety switches that automatically cut power; verify power shuts off", "Leave it lying down while running", "Cover it with a pillow", "Pour water on it"],
    correctAnswer: 0,
    explanation: "Approved space heaters feature built-in tip-over switches that break power if tilted past 45 degrees.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Appliance Safety"
  },
  {
    id: 89,
    question: "Why should extension cords used outdoors be explicitly rated 'Outdoor Use Only' (marked with 'W')?",
    options: ["Outdoor cords are painted yellow", "They feature heavy moisture-resistant, UV-resistant rubber insulation and molded plugs", "They produce higher voltage", "They weigh less"],
    correctAnswer: 1,
    explanation: "Outdoor-rated cords withstand sunlight degradation, rain, freezing temperatures, and heavy foot traffic.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 90,
    question: "What is the safest way to store battery power banks and lithium batteries at home?",
    options: ["In direct hot sunlight on windowsill", "In a cool, dry place away from metal objects like keys and coins that could short terminals", "In a bucket of water", "In the freezer"],
    correctAnswer: 1,
    explanation: "Metal objects shorting battery terminals cause high discharge current, thermal runaway, and dangerous chemical fires.",
    targetProfiles: ["teenager", "adult_male", "adult_female", "all"],
    category: "Battery Safety"
  },
  {
    id: 91,
    question: "What should you do if you see smoke coming out of your washing machine motor?",
    options: ["Unplug machine or switch off circuit breaker immediately, do not touch wet laundry inside", "Add more laundry detergent", "Turn speed to high", "Splash water into drum"],
    correctAnswer: 0,
    explanation: "Disconnect main electrical power before investigating smoking appliance motors to prevent electrical fire.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Appliance Safety"
  },
  {
    id: 92,
    question: "Why should you never touch outdoor electric meter boxes with metal tools?",
    options: ["Meters record power usage", "Service entrance cables inside meter boxes carry un-fused utility power direct from transformers!", "Utility companies charge fines", "Glass cover scratches easily"],
    correctAnswer: 1,
    explanation: "Meter box line-side terminals carry thousands of Amps of short-circuit energy with no home breaker protection.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 93,
    question: "What is the safe procedure if your electric toaster oven starts catching fire inside?",
    options: ["Open the glass door and blow air on it", "Keep door closed, unplug power cord, and use Class C extinguisher if flames escape", "Pour water into toaster slot", "Fan flames with cardboard"],
    correctAnswer: 1,
    explanation: "Keeping door closed starves flames of oxygen. Unplugging cuts heating element power.",
    targetProfiles: ["adult_female", "adult_male", "teenager", "all"],
    category: "Kitchen Safety"
  },
  {
    id: 94,
    question: "Why should kids stay far away from green metal electrical transformer boxes in neighborhoods?",
    options: ["They are fresh painted", "High voltage underground connections inside can cause fatal shocks if damaged or tampered with", "They store garden tools", "They attract bees"],
    correctAnswer: 1,
    explanation: "Pad-mounted neighborhood transformers convert thousands of Volts down to home levels. Never climb or sit on them.",
    targetProfiles: ["child", "teenager", "all"],
    category: "Outdoor Safety"
  },
  {
    id: 95,
    question: "What is the main hazard of using a damaged electric heating pad with exposed copper wires on your skin?",
    options: ["Mild itching", "Severe electrical burns and electric shocks directly into skin tissue", "Pad stays lukewarm", "Skin turns blue"],
    correctAnswer: 1,
    explanation: "Direct skin contact with live copper strands causes severe thermal burns and ventricular fibrillation.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Appliance Safety"
  },
  {
    id: 96,
    question: "Why are bathroom electrical outlets placed at least 3 feet away from bathtubs and showers?",
    options: ["Architectural style guidelines", "To prevent accidental water splashes and handheld appliance cord reaches into water", "To keep walls clean", "For easier wiring"],
    correctAnswer: 1,
    explanation: "Distance separation prevents users from reaching wall plugs while touching or standing in bath water.",
    targetProfiles: ["adult_female", "adult_male", "all"],
    category: "Bathroom Safety"
  },
  {
    id: 97,
    question: "What should you do if an electric cord feels brittle, stiff, and cracks when bent?",
    options: ["Wrap it in plastic wrap", "Discard and replace the cord or device immediately; dried insulation exposes live wires", "Soak in hot water to soften", "Oil the wire"],
    correctAnswer: 1,
    explanation: "Aged insulation loses flexibility and cracks open, exposing live copper conductors to touch hazards.",
    targetProfiles: ["adult_male", "adult_female", "all"],
    category: "Cord Safety"
  },
  {
    id: 98,
    question: "Why shouldn't you run cords across high-traffic hallways at home?",
    options: ["Cords get dirty", "People can trip over cords, yanking appliances off tables or damaging plug prongs", "It blocks air flow", "Wi-Fi slows down"],
    correctAnswer: 1,
    explanation: "Tripping yanks hot appliances like irons or deep fryers onto floor surfaces, causing burns and cord damage.",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Home Safety"
  },
  {
    id: 99,
    question: "What is the correct action if you notice water dripping from a light fixture in your ceiling?",
    options: ["Place a bucket under drip and turn off the circuit breaker controlling that ceiling light immediately!", "Turn on the light to dry the water with bulb heat", "Touch the fixture to see if water is warm", "Poke holes in the ceiling"],
    correctAnswer: 0,
    explanation: "Water inside electrical light fixtures causes active short circuits and energizes wet ceiling plaster.",
    targetProfiles: ["adult_male", "adult_female", "teenager", "all"],
    category: "Emergency Action"
  },
  {
    id: 100,
    question: "What is the most important golden rule of residential electrical safety?",
    options: ["Electricity is fast so work faster than it", "Treat all electrical wires as live, keep water away from power, and isolate power before touching!", "Always touch wires with wet hands to test voltage", "Ignore warning signs"],
    correctAnswer: 1,
    explanation: "Assume wires are energized until tested. Water and electricity never mix safely. Always isolate power first!",
    targetProfiles: ["child", "teenager", "adult_female", "adult_male", "all"],
    category: "Basic Safety"
  }
];
