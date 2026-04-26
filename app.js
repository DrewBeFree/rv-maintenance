const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentArea = null;
let sessionActive = false;
let checkedItems = new Set();

// ── Seed Data ────────────────────────────────────────────────
const SEED_AREAS = [
  { slug: 'winterize',    name: 'Winterize',            icon: '❄️',  interval: 365 },
  { slug: 'dewinterize',  name: 'De-Winterize',         icon: '🌱',  interval: 365 },
  { slug: 'generator',    name: 'Generator',             icon: '🔧',  interval: 90  },
  { slug: 'battery',      name: 'Battery / Electrical',  icon: '⚡',  interval: 90  },
  { slug: 'roof',         name: 'Roof / Seals',          icon: '🏠',  interval: 180 },
  { slug: 'lpgas',        name: 'LP Gas',                icon: '🔥',  interval: 180 },
  { slug: 'engine',       name: 'Engine / Chassis',      icon: '🚗',  interval: 180 },
  { slug: 'water',        name: 'Water System',          icon: '💧',  interval: 180 },
  { slug: 'hvac',         name: 'HVAC',                  icon: '🌬️', interval: 365 },
  { slug: 'tires',        name: 'Tires / Wheels',        icon: '🛞',  interval: 90  },
];

const SEED_ITEMS = {
  winterize: [
    'Drain fresh water tank completely',
    'Drain and bypass the water heater',
    'Blow out water lines with air compressor (40–50 psi)',
    'Add RV antifreeze to all sink p-traps',
    'Add RV antifreeze to shower p-trap',
    'Add RV antifreeze to toilet (flush until pink)',
    'Drain and flush black tank',
    'Drain and flush gray tanks',
    'Add RV antifreeze to gray tank drain valves',
    'Remove and store inline water filter',
    'Disconnect battery or connect battery tender',
    'Cover roof vents and A/C unit',
    'Close all interior vents and openings',
    'Note any issues to address in spring',
  ],
  dewinterize: [
    'Remove vent and A/C covers',
    'Reconnect inline water filter',
    'Turn water heater bypass valves to normal position',
    'Connect to water source or fill fresh water tank',
    'Flush all faucets until antifreeze is cleared',
    'Flush toilet multiple times until water runs clear',
    'Check all connections under sinks for leaks',
    'Test water heater — electric and LP modes',
    'Inspect roof seals and caulking',
    'Test all LP appliances — furnace, range, oven, refrigerator',
    'Test smoke, CO, and LP detectors',
    'Test all slide-outs — in and out',
    'Charge and reconnect house battery',
    'Run generator under load for 30 minutes',
  ],
  generator: [
    'Check oil level — between marks on dipstick',
    'Check air filter — clean or replace if dirty',
    'Inspect fuel level',
    'Check all visible wiring and connections',
    'Start and let warm up for 5 minutes',
    'Run under load for at least 2 hours (run A/C)',
    'Check for exhaust leaks or unusual sounds',
    'Log current hours on hour meter',
    'Change oil if due (every 100 hours or annually)',
  ],
  battery: [
    'Check house battery voltage (12.6V+ = fully charged)',
    'Inspect battery terminals for corrosion — clean if needed',
    'Check battery water level if wet cell (add distilled water if low)',
    'Inspect 12V fuse panel — check for blown fuses',
    'Test all interior 12V lights',
    'Test slide-out operation',
    'Verify converter/charger is operating',
    'Inspect shore power cord and plug for damage',
    'Test all GFCI outlets (press Test, then Reset)',
    'Verify battery disconnect switch operation',
  ],
  roof: [
    'Inspect entire roof surface for cracks, tears, or punctures',
    'Inspect all roof sealant around vents, A/C, and antennas',
    'Check sealant along all roof edges (drip rail)',
    'Inspect slide-out roof seals — apply rubber protectant',
    'Check front and rear cap seams',
    'Inspect all exterior wall seams and sealant',
    'Reseal any cracked or missing caulk (Dicor or appropriate product)',
    'Clean roof with RV roof cleaner',
    'Apply UV protectant to rubber roof (EPDM)',
  ],
  lpgas: [
    'Check LP tank levels — fill if below 20%',
    'Inspect tank valves and regulator for corrosion or damage',
    'Check regulator pressure (~11 inches water column)',
    'Inspect all LP lines and connections for wear or cracks',
    'Test LP detector — hold test button until alarm sounds',
    'Test furnace — ignites and runs full heating cycle',
    'Test all range burners — all ignite properly',
    'Test oven — ignites and holds temperature',
    'Test water heater in LP mode',
    'Test refrigerator in LP mode',
  ],
  engine: [
    'Check engine oil level and condition',
    'Check coolant level and condition',
    'Check power steering fluid level',
    'Check brake fluid level',
    'Check windshield washer fluid',
    'Inspect belts and hoses for wear or cracking',
    'Check engine air filter',
    'Inspect all 6 tires — tread depth and condition',
    'Check tire pressure (cold) — front, rear inside, rear outside',
    'Verify lug nut torque (150 ft-lbs)',
    'Inspect brake pads and rotors visually',
    'Inspect chassis underneath for leaks or damage',
    'Test headlights, taillights, turn signals, brake lights',
    'Check wiper blades — replace if streaking',
  ],
  water: [
    'Sanitize fresh water tank (bleach solution, flush thoroughly)',
    'Replace inline water filter cartridge',
    'Test water pump — pressurizes quickly, no cycling at rest',
    'Inspect visible water supply lines for wear or leaks',
    'Check under all sinks and toilet for moisture or leaks',
    'Test water heater — heats on both electric and LP modes',
    'Flush and sanitize black tank with tank rinser',
    'Flush and treat gray tanks with deodorizer',
    'Check tank level sensors — verify accuracy',
    'Inspect city water inlet for cracks or stripped threads',
  ],
  hvac: [
    'Clean A/C filter(s) — wash foam filter, let dry fully before reinstalling',
    'Inspect A/C shroud for cracks or damage',
    'Clean A/C coils with coil cleaner if accessible',
    'Test A/C cooling — reaches setpoint within 30 minutes',
    'Test furnace — ignites and runs full heating cycle',
    'Inspect furnace exterior vent for obstructions or nests',
    'Check all ceiling vent covers — clean and operate smoothly',
    'Test thermostat controls — all modes respond correctly',
  ],
  tires: [
    'Check tire pressure (cold) — fronts per door placard, rears per placard',
    'Inspect all tires for tread wear, cracking, or bulges',
    'Check tire age — DOT date codes (replace if 7+ years old)',
    'Check lug nut torque on all wheels (150 ft-lbs)',
    'Inspect wheel wells for debris or signs of rubbing',
    'Check spare tire condition and pressure',
    'Inspect brake drums or rotors for scoring',
    'Check wheel bearings — no play, no heat after short drive',
  ],
};

// ── Seed on First Load ────────────────────────────────────────
async function seedIfEmpty() {
  const { data: existing } = await sb.from('areas').select('id').limit(1);
  if (existing && existing.length > 0) return;

  const { data: inserted, error } = await sb
    .from('areas')
    .insert(SEED_AREAS.map((a, i) => ({
      slug: a.slug,
      name: a.name,
      icon: a.icon,
      sort_order: i,
      reminder_interval_days: a.interval,
    })))
    .select();

  if (error) { console.error('Seed areas failed:', error); return; }

  const areaMap = {};
  inserted.forEach(a => { areaMap[a.slug] = a.id; });

  const items = [];
  SEED_AREAS.forEach(a => {
    (SEED_ITEMS[a.slug] || []).forEach((text, i) => {
      items.push({ area_id: areaMap[a.slug], text, sort_order: i, is_active: true });
    });
  });

  const { error: itemErr } = await sb.from('checklist_items').insert(items);
  if (itemErr) console.error('Seed items failed:', itemErr);
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await seedIfEmpty();
  await showHub();
});
