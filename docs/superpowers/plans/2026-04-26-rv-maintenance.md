# RV Maintenance Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal RV maintenance tracker for the 2019 Thor Freedom Elite 26HE with a hub dashboard, per-area checklists, completion history, and overdue indicators.

**Architecture:** Multi-file SPA (index.html + style.css + app.js) hosted on GitHub Pages. Supabase stores areas, checklist items, sessions, and session items. All views are show/hide divs — no page reloads. Checklist data is seeded once on first load from hardcoded defaults; user edits persist to Supabase.

**Tech Stack:** HTML, CSS, JavaScript (ES2020, no build step), Supabase JS v2 CDN, GitHub Pages

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Page shell + all view markup (hub, section, edit, history) |
| `style.css` | Rugged amber theme, background photo, card grid, all states |
| `app.js` | All logic: Supabase client, seed, hub, section, run/edit/history modes |
| `bg.jpg` | User's personal RV photo — page background |
| `.gitignore` | Ignore OS files |

---

## Task 1: Repo scaffolding

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`
- Create: `.gitignore`
- Copy: `bg.jpg` from `C:\Users\drewb\Pictures\Saved Pictures\IMG_4497 (1).JPEG`

- [ ] **Step 1: Init repo and copy background photo**

```bash
cd /c/Users/drewb/Documents/GitHub/rv-maintenance
git init
cp "/c/Users/drewb/Pictures/Saved Pictures/IMG_4497 (1).JPEG" bg.jpg
```

- [ ] **Step 2: Create `.gitignore`**

```
.DS_Store
Thumbs.db
.superpowers/
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RV Maintenance</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛺</text></svg>">
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    const SUPABASE_URL = 'https://vqfyaoanqpbcpbwtetcz.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_BQR3QmatKdMWtwIirlA5Dw_DLfiEOY9';
  </script>
</head>
<body>

  <!-- ── Hub View ── -->
  <div id="hub-view">
    <header>
      <h1>⛺ RV MAINTENANCE</h1>
      <p class="sub">Freedom Elite 26HE · 2019</p>
    </header>
    <div id="card-grid"></div>
  </div>

  <!-- ── Section View ── -->
  <div id="section-view" class="hidden">
    <header class="section-header">
      <button id="back-btn">← Back</button>
      <div class="section-title-wrap">
        <span id="section-icon"></span>
        <h2 id="section-title"></h2>
      </div>
      <button id="edit-toggle">Edit</button>
    </header>

    <!-- Run Mode -->
    <div id="run-mode">
      <div id="progress-wrap" class="hidden">
        <div id="progress-bar"></div>
        <span id="progress-label"></span>
      </div>
      <ul id="checklist"></ul>
      <textarea id="session-notes" placeholder="Notes (optional)…" class="hidden"></textarea>
      <div class="action-row">
        <button id="start-session-btn" class="primary-btn">Start Session</button>
        <button id="complete-session-btn" class="primary-btn hidden">Complete Session</button>
      </div>
    </div>

    <!-- Edit Mode -->
    <div id="edit-mode" class="hidden">
      <ul id="edit-list"></ul>
      <div class="add-row">
        <input id="new-item-input" type="text" placeholder="Add checklist item…">
        <button id="add-item-btn">Add</button>
      </div>
    </div>

    <!-- History Panel -->
    <div id="history-panel">
      <h3 class="history-heading">History</h3>
      <div id="history-list"></div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create empty `style.css` and `app.js`**

`style.css` — empty file for now.

`app.js` — empty file for now.

- [ ] **Step 5: Verify in browser**

Open `index.html` directly in a browser (file:// is fine for this step). Confirm the page loads without console errors (Supabase CDN loads, no JS errors from the empty app.js).

- [ ] **Step 6: Commit**

```bash
git add index.html style.css app.js bg.jpg .gitignore
git commit -m "feat: scaffold rv-maintenance repo with page shell"
```

---

## Task 2: Supabase schema

**Action:** Run SQL in the Supabase dashboard for the existing project (`vqfyaoanqpbcpbwtetcz`).

- [ ] **Step 1: Open Supabase SQL editor**

Go to https://supabase.com → project `vqfyaoanqpbcpbwtetcz` → SQL Editor.

- [ ] **Step 2: Run table creation SQL**

```sql
-- Areas (maintenance categories)
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null,
  sort_order int not null default 0,
  reminder_interval_days int not null default 180
);

-- Checklist items per area
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- Maintenance sessions (completions)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  completed_at timestamptz not null default now(),
  notes text
);

-- Items checked during each session (snapshot)
create table if not exists session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  item_text text not null,
  checked boolean not null default false
);
```

- [ ] **Step 3: Run RLS policy SQL**

```sql
-- Enable RLS on all tables
alter table areas enable row level security;
alter table checklist_items enable row level security;
alter table sessions enable row level security;
alter table session_items enable row level security;

-- Allow all operations for anon (personal app)
create policy "allow all" on areas for all using (true) with check (true);
create policy "allow all" on checklist_items for all using (true) with check (true);
create policy "allow all" on sessions for all using (true) with check (true);
create policy "allow all" on session_items for all using (true) with check (true);
```

- [ ] **Step 4: Verify**

In the Supabase Table Editor, confirm all 4 tables appear: `areas`, `checklist_items`, `sessions`, `session_items`. All should be empty.

---

## Task 3: CSS

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Write complete stylesheet**

```css
/* ── Reset & Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { min-height: 100vh; }

body {
  background: url('bg.jpg') center center / cover fixed no-repeat;
  font-family: Georgia, serif;
  color: #fcd34d;
  position: relative;
}

body::before {
  content: '';
  position: fixed; inset: 0;
  background: rgba(10, 6, 0, 0.45);
  pointer-events: none;
  z-index: 0;
}

.hidden { display: none !important; }

/* ── Hub Header ── */
#hub-view header {
  position: relative; z-index: 1;
  text-align: center;
  padding: 40px 20px 28px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
  background: linear-gradient(180deg, rgba(10,6,0,0.75) 0%, transparent 100%);
}

#hub-view h1 {
  font-size: clamp(1.8rem, 6vw, 3rem);
  font-weight: 700;
  color: #fcd34d;
  letter-spacing: 5px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.8);
}

#hub-view .sub {
  color: rgba(252,211,77,0.55);
  font-size: 0.72rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-top: 6px;
  font-family: sans-serif;
  font-weight: 300;
}

/* ── Card Grid ── */
#card-grid {
  position: relative; z-index: 1;
  max-width: 700px;
  margin: 0 auto;
  padding: 28px 16px 60px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 14px;
}

.area-card {
  background: rgba(10,6,0,0.65);
  border: 1px solid rgba(251,191,36,0.25);
  border-radius: 10px;
  padding: 20px 14px;
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: border-color 0.2s, transform 0.15s;
  user-select: none;
}

.area-card:hover {
  border-color: rgba(251,191,36,0.55);
  transform: translateY(-2px);
}

.area-card .card-icon { font-size: 30px; margin-bottom: 10px; }

.area-card .card-name {
  color: #fcd34d;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: sans-serif;
  margin-bottom: 6px;
}

.area-card .card-last {
  color: rgba(161,98,7,0.9);
  font-size: 0.68rem;
  font-family: sans-serif;
}

.area-card .card-overdue {
  color: #ef4444;
  font-size: 0.68rem;
  font-family: sans-serif;
  font-weight: 600;
}

.area-card .card-never {
  color: rgba(161,98,7,0.5);
  font-size: 0.68rem;
  font-family: sans-serif;
}

/* ── Section View ── */
#section-view {
  position: relative; z-index: 1;
  max-width: 700px;
  margin: 0 auto;
  padding: 0 16px 60px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 16px;
  border-bottom: 1px solid rgba(245,158,11,0.2);
  margin-bottom: 20px;
  background: linear-gradient(180deg, rgba(10,6,0,0.6) 0%, transparent 100%);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

#section-icon { font-size: 22px; }

#section-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fcd34d;
  font-family: sans-serif;
}

#back-btn, #edit-toggle {
  background: rgba(10,6,0,0.5);
  border: 1px solid rgba(251,191,36,0.3);
  color: #fcd34d;
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: sans-serif;
  transition: border-color 0.2s;
}

#back-btn:hover, #edit-toggle:hover {
  border-color: rgba(251,191,36,0.6);
}

/* ── Progress Bar ── */
#progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

#progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(251,191,36,0.15);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

#progress-bar::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: #f59e0b;
  border-radius: 3px;
  width: var(--progress, 0%);
  transition: width 0.3s ease;
}

#progress-label {
  color: rgba(252,211,77,0.7);
  font-size: 0.72rem;
  font-family: sans-serif;
  white-space: nowrap;
}

/* ── Checklist ── */
#checklist {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

#checklist li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(10,6,0,0.55);
  border: 1px solid rgba(251,191,36,0.15);
  border-radius: 8px;
  padding: 12px 14px;
  backdrop-filter: blur(4px);
  cursor: default;
}

#checklist li.active { cursor: pointer; }
#checklist li.active:hover { border-color: rgba(251,191,36,0.35); }

#checklist li input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #f59e0b;
  cursor: inherit;
  flex-shrink: 0;
}

#checklist li .item-text {
  color: #e2c97a;
  font-size: 0.88rem;
  font-family: sans-serif;
  line-height: 1.4;
}

#checklist li.checked .item-text {
  color: rgba(226,201,122,0.4);
  text-decoration: line-through;
}

/* ── Session Notes ── */
#session-notes {
  width: 100%;
  background: rgba(10,6,0,0.55);
  border: 1px solid rgba(251,191,36,0.2);
  border-radius: 8px;
  color: #e2c97a;
  font-family: sans-serif;
  font-size: 0.88rem;
  padding: 10px 14px;
  resize: vertical;
  min-height: 70px;
  margin-bottom: 16px;
  backdrop-filter: blur(4px);
}

#session-notes::placeholder { color: rgba(226,201,122,0.35); }
#session-notes:focus { outline: none; border-color: rgba(251,191,36,0.5); }

/* ── Action Buttons ── */
.action-row {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.primary-btn {
  background: rgba(245,158,11,0.15);
  border: 1px solid rgba(251,191,36,0.5);
  color: #fcd34d;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 10px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-family: sans-serif;
  transition: background 0.2s, border-color 0.2s;
}

.primary-btn:hover {
  background: rgba(245,158,11,0.28);
  border-color: rgba(251,191,36,0.8);
}

/* ── Edit Mode ── */
#edit-mode { margin-bottom: 24px; }

#edit-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

#edit-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10,6,0,0.55);
  border: 1px solid rgba(251,191,36,0.15);
  border-radius: 8px;
  padding: 10px 12px;
  backdrop-filter: blur(4px);
}

#edit-list li .edit-text {
  flex: 1;
  color: #e2c97a;
  font-size: 0.88rem;
  font-family: sans-serif;
}

.move-btn, .delete-btn {
  background: none;
  border: 1px solid rgba(251,191,36,0.2);
  color: rgba(252,211,77,0.6);
  font-size: 0.75rem;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
}

.move-btn:hover { border-color: rgba(251,191,36,0.5); color: #fcd34d; }
.delete-btn { border-color: rgba(239,68,68,0.2); color: rgba(239,68,68,0.5); }
.delete-btn:hover { border-color: rgba(239,68,68,0.6); color: #ef4444; }

.add-row {
  display: flex;
  gap: 8px;
}

#new-item-input {
  flex: 1;
  background: rgba(10,6,0,0.55);
  border: 1px solid rgba(251,191,36,0.2);
  border-radius: 8px;
  color: #e2c97a;
  font-family: sans-serif;
  font-size: 0.88rem;
  padding: 9px 12px;
}

#new-item-input::placeholder { color: rgba(226,201,122,0.35); }
#new-item-input:focus { outline: none; border-color: rgba(251,191,36,0.5); }

#add-item-btn {
  background: rgba(245,158,11,0.15);
  border: 1px solid rgba(251,191,36,0.4);
  color: #fcd34d;
  font-size: 0.8rem;
  padding: 9px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-family: sans-serif;
}

#add-item-btn:hover { background: rgba(245,158,11,0.25); }

/* ── History Panel ── */
#history-panel { margin-top: 32px; }

.history-heading {
  color: rgba(252,211,77,0.5);
  font-size: 0.65rem;
  font-family: sans-serif;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.history-entry {
  background: rgba(10,6,0,0.45);
  border: 1px solid rgba(251,191,36,0.1);
  border-radius: 8px;
  margin-bottom: 10px;
  backdrop-filter: blur(4px);
  overflow: hidden;
}

.history-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
}

.history-date {
  color: rgba(252,211,77,0.8);
  font-size: 0.8rem;
  font-family: sans-serif;
}

.history-toggle {
  color: rgba(252,211,77,0.4);
  font-size: 0.7rem;
  font-family: sans-serif;
}

.history-notes {
  color: rgba(226,201,122,0.55);
  font-size: 0.78rem;
  font-family: sans-serif;
  font-style: italic;
  padding: 0 14px 8px;
}

.history-items {
  padding: 0 14px 12px;
  display: none;
}

.history-items.open { display: block; }

.history-items li {
  color: rgba(226,201,122,0.55);
  font-size: 0.78rem;
  font-family: sans-serif;
  padding: 3px 0;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-items li::before { content: '✓'; color: rgba(74,222,128,0.5); font-size: 0.7rem; }
.history-items li.unchecked::before { content: '–'; color: rgba(252,211,77,0.2); }

.history-empty {
  color: rgba(252,211,77,0.3);
  font-size: 0.8rem;
  font-family: sans-serif;
  text-align: center;
  padding: 20px 0;
}
```

- [ ] **Step 2: Verify**

Open `index.html` in a browser. The background photo should show, the hub header should render with amber text. The card grid area should be empty (no cards yet, that's fine). No CSS errors in the console.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add complete rugged amber stylesheet"
```

---

## Task 4: app.js — Supabase init + seed data

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Write Supabase init, constants, and seed data**

```javascript
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentArea = null;
let sessionActive = false;
let checkedItems = new Set();

// ── Seed Data ────────────────────────────────────────────────
const SEED_AREAS = [
  { slug: 'winterize',    name: 'Winterize',         icon: '❄️',  interval: 365 },
  { slug: 'dewinterize',  name: 'De-Winterize',      icon: '🌱',  interval: 365 },
  { slug: 'generator',    name: 'Generator',          icon: '🔧',  interval: 90  },
  { slug: 'battery',      name: 'Battery / Electrical', icon: '⚡', interval: 90  },
  { slug: 'roof',         name: 'Roof / Seals',       icon: '🏠',  interval: 180 },
  { slug: 'lpgas',        name: 'LP Gas',             icon: '🔥',  interval: 180 },
  { slug: 'engine',       name: 'Engine / Chassis',   icon: '🚗',  interval: 180 },
  { slug: 'water',        name: 'Water System',       icon: '💧',  interval: 180 },
  { slug: 'hvac',         name: 'HVAC',               icon: '🌬️', interval: 365 },
  { slug: 'tires',        name: 'Tires / Wheels',     icon: '🛞',  interval: 90  },
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
```

- [ ] **Step 2: Verify seed**

Open `index.html` in a browser. Open DevTools → Console. Confirm no errors. Then open the Supabase Table Editor and verify:
- `areas` table has 10 rows
- `checklist_items` table has ~100+ rows

Reload the page — `seedIfEmpty` should not re-insert (areas table is no longer empty).

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add Supabase init, seed data, and boot sequence"
```

---

## Task 5: Hub view

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add `showHub()` and `renderCards()` to app.js**

Add these functions after the `seedIfEmpty` function:

```javascript
// ── Hub View ──────────────────────────────────────────────────
async function showHub() {
  document.getElementById('hub-view').classList.remove('hidden');
  document.getElementById('section-view').classList.add('hidden');

  const [{ data: areas }, { data: sessions }] = await Promise.all([
    sb.from('areas').select('*').order('sort_order'),
    sb.from('sessions').select('area_id, completed_at').order('completed_at', { ascending: false }),
  ]);

  const lastCompleted = {};
  (sessions || []).forEach(s => {
    if (!lastCompleted[s.area_id]) lastCompleted[s.area_id] = s.completed_at;
  });

  renderCards(areas || [], lastCompleted);
}

function renderCards(areas, lastCompleted) {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';

  areas.forEach(area => {
    const last = lastCompleted[area.id];
    const isOverdue = isAreaOverdue(last, area.reminder_interval_days);

    const card = document.createElement('div');
    card.className = 'area-card';
    card.innerHTML = `
      <div class="card-icon">${area.icon}</div>
      <div class="card-name">${area.name}</div>
      ${last
        ? `<div class="${isOverdue ? 'card-overdue' : 'card-last'}">${isOverdue ? 'Overdue' : formatDate(last)}</div>`
        : `<div class="card-never">Never logged</div>`
      }
    `;
    card.addEventListener('click', () => showSection(area));
    grid.appendChild(card);
  });
}

function isAreaOverdue(lastCompletedAt, intervalDays) {
  if (!lastCompletedAt) return false;
  const last = new Date(lastCompletedAt);
  const due = new Date(last.getTime() + intervalDays * 86400000);
  return due < new Date();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
```

- [ ] **Step 2: Verify hub**

Reload `index.html`. All 10 area cards should render in the grid with their icons and "Never logged" status. Hover over a card — it should lift slightly. No console errors.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: render hub dashboard with area cards and overdue logic"
```

---

## Task 6: Section view + navigation

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add `showSection()` and wire back button**

Add after `formatDate`:

```javascript
// ── Section View ──────────────────────────────────────────────
async function showSection(area) {
  currentArea = area;
  sessionActive = false;
  checkedItems.clear();

  document.getElementById('hub-view').classList.add('hidden');
  document.getElementById('section-view').classList.remove('hidden');
  document.getElementById('section-icon').textContent = area.icon;
  document.getElementById('section-title').textContent = area.name;

  // Reset mode state
  document.getElementById('run-mode').classList.remove('hidden');
  document.getElementById('edit-mode').classList.add('hidden');
  document.getElementById('edit-toggle').textContent = 'Edit';

  await loadRunMode();
  await loadHistory();
}
```

- [ ] **Step 2: Wire back button and edit toggle in the DOMContentLoaded handler**

Update the `DOMContentLoaded` handler to add button wiring:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await seedIfEmpty();
  await showHub();

  document.getElementById('back-btn').addEventListener('click', showHub);

  document.getElementById('edit-toggle').addEventListener('click', () => {
    const runMode = document.getElementById('run-mode');
    const editMode = document.getElementById('edit-mode');
    const btn = document.getElementById('edit-toggle');
    const inEdit = !editMode.classList.contains('hidden');
    if (inEdit) {
      editMode.classList.add('hidden');
      runMode.classList.remove('hidden');
      btn.textContent = 'Edit';
      loadRunMode();
    } else {
      runMode.classList.add('hidden');
      editMode.classList.remove('hidden');
      btn.textContent = 'Done';
      loadEditMode();
    }
  });

  document.getElementById('start-session-btn').addEventListener('click', startSession);
  document.getElementById('complete-session-btn').addEventListener('click', completeSession);
  document.getElementById('add-item-btn').addEventListener('click', addItem);
  document.getElementById('new-item-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
  });
});
```

- [ ] **Step 3: Add stub functions so no errors on click**

Add stubs after `showSection` (will be filled in next tasks):

```javascript
async function loadRunMode() {}
async function loadHistory() {}
async function startSession() {}
async function completeSession() {}
async function loadEditMode() {}
async function addItem() {}
```

- [ ] **Step 4: Verify navigation**

Click any area card → section view appears with the area's name and icon in the header. Click ← Back → returns to hub. No console errors.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: section view navigation and header wiring"
```

---

## Task 7: Run mode — checklist + session

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace `loadRunMode` stub**

```javascript
async function loadRunMode() {
  const { data: items } = await sb
    .from('checklist_items')
    .select('*')
    .eq('area_id', currentArea.id)
    .eq('is_active', true)
    .order('sort_order');

  const list = document.getElementById('checklist');
  list.innerHTML = '';

  (items || []).forEach(item => {
    const li = document.createElement('li');
    li.dataset.id = item.id;
    li.dataset.text = item.text;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.disabled = true;

    const span = document.createElement('span');
    span.className = 'item-text';
    span.textContent = item.text;

    li.appendChild(cb);
    li.appendChild(span);
    list.appendChild(li);
  });

  // Reset session UI state
  document.getElementById('progress-wrap').classList.add('hidden');
  document.getElementById('session-notes').classList.add('hidden');
  document.getElementById('session-notes').value = '';
  document.getElementById('start-session-btn').classList.remove('hidden');
  document.getElementById('complete-session-btn').classList.add('hidden');
  sessionActive = false;
  checkedItems.clear();
}
```

- [ ] **Step 2: Replace `startSession` stub**

```javascript
function startSession() {
  sessionActive = true;
  document.getElementById('start-session-btn').classList.add('hidden');
  document.getElementById('complete-session-btn').classList.remove('hidden');
  document.getElementById('session-notes').classList.remove('hidden');
  document.getElementById('progress-wrap').classList.remove('hidden');

  const items = document.querySelectorAll('#checklist li');
  items.forEach(li => {
    li.classList.add('active');
    const cb = li.querySelector('input[type="checkbox"]');
    cb.disabled = false;
    li.addEventListener('click', e => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });
    cb.addEventListener('change', () => {
      if (cb.checked) {
        checkedItems.add(li.dataset.id);
        li.classList.add('checked');
      } else {
        checkedItems.delete(li.dataset.id);
        li.classList.remove('checked');
      }
      updateProgress(items.length);
    });
  });

  updateProgress(items.length);
}

function updateProgress(total) {
  const count = checkedItems.size;
  const pct = total ? Math.round((count / total) * 100) : 0;
  document.getElementById('progress-bar').style.setProperty('--progress', pct + '%');
  document.getElementById('progress-label').textContent = `${count} / ${total}`;
}
```

- [ ] **Step 3: Replace `completeSession` stub**

```javascript
async function completeSession() {
  const notes = document.getElementById('session-notes').value.trim() || null;

  const { data: session, error: sessionErr } = await sb
    .from('sessions')
    .insert({ area_id: currentArea.id, notes })
    .select()
    .single();

  if (sessionErr) { console.error('Session insert failed:', sessionErr); return; }

  const allItems = document.querySelectorAll('#checklist li');
  const sessionItems = Array.from(allItems).map(li => ({
    session_id: session.id,
    item_text: li.dataset.text,
    checked: checkedItems.has(li.dataset.id),
  }));

  const { error: itemErr } = await sb.from('session_items').insert(sessionItems);
  if (itemErr) console.error('Session items insert failed:', itemErr);

  await showHub();
}
```

- [ ] **Step 4: Verify run mode**

Open a section → checklist items appear (checkboxes disabled). Click "Start Session" → checkboxes enable, progress bar shows 0/N, notes field appears. Check some items → progress bar updates, items get strikethrough. Click "Complete Session" → writes to Supabase, returns to hub, card now shows the logged date.

Check in Supabase Table Editor: `sessions` has 1 row, `session_items` has N rows (one per checklist item).

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: run mode with checklist, progress bar, and session logging"
```

---

## Task 8: Edit mode

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace `loadEditMode` stub**

```javascript
async function loadEditMode() {
  const { data: items } = await sb
    .from('checklist_items')
    .select('*')
    .eq('area_id', currentArea.id)
    .eq('is_active', true)
    .order('sort_order');

  const list = document.getElementById('edit-list');
  list.innerHTML = '';

  (items || []).forEach((item, idx) => {
    const li = document.createElement('li');
    li.dataset.id = item.id;

    li.innerHTML = `
      <button class="move-btn" data-dir="up" ${idx === 0 ? 'disabled style="opacity:0.3"' : ''}>▲</button>
      <button class="move-btn" data-dir="down" ${idx === items.length - 1 ? 'disabled style="opacity:0.3"' : ''}>▼</button>
      <span class="edit-text">${item.text}</span>
      <button class="delete-btn">✕</button>
    `;

    li.querySelector('[data-dir="up"]').addEventListener('click', () => moveItem(item.id, 'up'));
    li.querySelector('[data-dir="down"]').addEventListener('click', () => moveItem(item.id, 'down'));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));

    list.appendChild(li);
  });
}
```

- [ ] **Step 2: Replace `addItem` stub**

```javascript
async function addItem() {
  const input = document.getElementById('new-item-input');
  const text = input.value.trim();
  if (!text) return;

  const { data: existing } = await sb
    .from('checklist_items')
    .select('sort_order')
    .eq('area_id', currentArea.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  await sb.from('checklist_items').insert({
    area_id: currentArea.id,
    text,
    sort_order: nextOrder,
    is_active: true,
  });

  input.value = '';
  await loadEditMode();
}
```

- [ ] **Step 3: Add `deleteItem` and `moveItem`**

```javascript
async function deleteItem(itemId) {
  await sb.from('checklist_items').update({ is_active: false }).eq('id', itemId);
  await loadEditMode();
}

async function moveItem(itemId, direction) {
  const { data: items } = await sb
    .from('checklist_items')
    .select('id, sort_order')
    .eq('area_id', currentArea.id)
    .eq('is_active', true)
    .order('sort_order');

  const idx = items.findIndex(i => i.id === itemId);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];

  await Promise.all([
    sb.from('checklist_items').update({ sort_order: b.sort_order }).eq('id', a.id),
    sb.from('checklist_items').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);

  await loadEditMode();
}
```

- [ ] **Step 4: Verify edit mode**

Open a section → click "Edit". Edit list appears. Click ▲/▼ on an item — it reorders. Click ✕ on an item — it disappears. Type in the add input and press Add or Enter — new item appears at bottom. Click "Done" — returns to run mode with updated checklist order.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: edit mode with add, delete, and reorder"
```

---

## Task 9: History panel

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace `loadHistory` stub**

```javascript
async function loadHistory() {
  const { data: sessions } = await sb
    .from('sessions')
    .select('id, completed_at, notes')
    .eq('area_id', currentArea.id)
    .order('completed_at', { ascending: false });

  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  if (!sessions || sessions.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No sessions logged yet.</p>';
    return;
  }

  for (const session of sessions) {
    const { data: items } = await sb
      .from('session_items')
      .select('item_text, checked')
      .eq('session_id', session.id);

    const entry = document.createElement('div');
    entry.className = 'history-entry';

    const checkedCount = (items || []).filter(i => i.checked).length;
    const total = (items || []).length;
    const dateStr = new Date(session.completed_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    entry.innerHTML = `
      <div class="history-entry-header">
        <span class="history-date">${dateStr} &mdash; ${checkedCount}/${total} items</span>
        <span class="history-toggle">▾ Details</span>
      </div>
      ${session.notes ? `<p class="history-notes">${session.notes}</p>` : ''}
      <ul class="history-items">
        ${(items || []).map(i =>
          `<li class="${i.checked ? '' : 'unchecked'}">${i.item_text}</li>`
        ).join('')}
      </ul>
    `;

    entry.querySelector('.history-entry-header').addEventListener('click', () => {
      const ul = entry.querySelector('.history-items');
      const toggle = entry.querySelector('.history-toggle');
      ul.classList.toggle('open');
      toggle.textContent = ul.classList.contains('open') ? '▴ Hide' : '▾ Details';
    });

    historyList.appendChild(entry);
  }
}
```

- [ ] **Step 2: Verify history**

Complete a session on any area if you haven't already. Open that section again — history panel at the bottom shows the session with date and item count. Click "Details" — expands to show each item with ✓ or — indicator. Notes appear if you entered any. No console errors.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: history panel with expandable session details"
```

---

## Task 10: GitHub Pages deploy

**Files:**
- Create: `CNAME` (optional)

- [ ] **Step 1: Create GitHub repo and push**

```bash
git remote add origin https://github.com/DrewBeFree/rv-maintenance.git
git branch -M main
git push -u origin main
```

(Create the `rv-maintenance` repo on GitHub first — public, no template.)

- [ ] **Step 2: Enable GitHub Pages**

GitHub → repo → Settings → Pages → Source: Deploy from branch → Branch: `main` → `/ (root)` → Save.

- [ ] **Step 3: Verify live deploy**

Wait ~60 seconds, then open `https://drewbefree.github.io/rv-maintenance/`. Confirm:
- Background photo shows
- All 10 area cards render
- Navigation works (tap card → section, back → hub)
- Run mode: Start Session, check items, Complete Session
- Edit mode: add/delete/reorder
- History panel shows completed sessions

- [ ] **Step 4: Add rv-maintenance card to Command Center**

Open `C:\Users\drewb\Documents\GitHub\DrewBeFree-Command-Center\index.html` and add a new app card for `rv-maintenance` (APP_005 or next available ID) with version `v1.0 · 2026-04-26`. Update the terminal scan line to include `rv-maintenance v1.0`.

- [ ] **Step 5: Final commit**

```bash
# In rv-maintenance repo
git add .
git commit -m "feat: initial release — RV maintenance tracker v1.0"

# In command center repo
cd /c/Users/drewb/Documents/GitHub/DrewBeFree-Command-Center
git add index.html
git commit -m "feat: add rv-maintenance app card (APP_005)"

# Push both
cd /c/Users/drewb/Documents/GitHub/rv-maintenance && git push
cd /c/Users/drewb/Documents/GitHub/DrewBeFree-Command-Center && git push
```
