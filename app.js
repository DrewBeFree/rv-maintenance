const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentArea = null;
let sessionActive = false;
let checkedItems = new Set();
let currentSessionId = null;

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
  { slug: 'trip-departure', name: 'Trip Departure',      icon: '🛣️', interval: 30  },
  { slug: 'pack-out',       name: 'Pack Out',             icon: '🏕️', interval: 30  },
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
  'trip-departure': [
    'Check tire pressure — all 6 tires (cold)',
    'Inspect tires for visible damage or foreign objects',
    'Confirm all slide-outs are fully retracted',
    'Retract and lock all leveling jacks / stabilizers',
    'Retract awning fully',
    'Disconnect and stow shore power cord',
    'Disconnect and store fresh water hose',
    'Close and latch all exterior compartment doors',
    'Turn off propane at tank valve',
    'Close all roof vents',
    'Secure all interior loose items and cabinet latches',
    'Check all exterior lights — headlights, tails, signals, brake lights',
    'Confirm black and gray tanks have capacity for the trip',
    'Walk full perimeter — nothing snagged, dragging, or left behind',
  ],
  'pack-out': [
    'Connect sewer hose to dump station',
    'Open black tank valve — drain completely',
    'Close black tank valve',
    'Flush black tank with built-in rinse wand',
    'Open gray tank valve — use gray water to flush sewer hose',
    'Close gray tank valve',
    'Remove, rinse, and stow sewer hose',
    'Rinse dump station pad',
    'Disconnect shore power and stow cord',
    'Disconnect water hose and stow',
    'Retract awning',
    'Retract all slide-outs',
    'Retract leveling jacks / stabilizers',
    'Walk campsite — collect chairs, mats, wheel chocks, stakes',
    'Final perimeter walk — nothing left behind',
    'Lock all exterior compartment doors',
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

async function ensureNewAreas() {
  const { data: existing } = await sb.from('areas').select('slug, sort_order');
  const existingSlugs = new Set((existing || []).map(a => a.slug));
  const missing = SEED_AREAS.filter(a => !existingSlugs.has(a.slug));
  if (missing.length === 0) return;

  const maxOrder = Math.max(...(existing || []).map(a => a.sort_order), -1);
  const { data: inserted, error } = await sb
    .from('areas')
    .insert(missing.map((a, i) => ({
      slug: a.slug, name: a.name, icon: a.icon,
      sort_order: maxOrder + 1 + i, reminder_interval_days: a.interval,
    })))
    .select();

  if (error) { console.error('ensureNewAreas failed:', error); return; }

  const areaMap = {};
  (inserted || []).forEach(a => { areaMap[a.slug] = a.id; });

  const items = [];
  missing.forEach(a => {
    (SEED_ITEMS[a.slug] || []).forEach((text, i) => {
      items.push({ area_id: areaMap[a.slug], text, sort_order: i, is_active: true });
    });
  });

  if (items.length > 0) {
    const { error: itemErr } = await sb.from('checklist_items').insert(items);
    if (itemErr) console.error('ensureNewAreas items failed:', itemErr);
  }
}

// ── Hub View ──────────────────────────────────────────────────
async function showHub() {
  document.getElementById('hub-view').classList.remove('hidden');
  document.getElementById('section-view').classList.add('hidden');

  const [{ data: areas }, { data: sessions }, { data: liveSessions }] = await Promise.all([
    sb.from('areas').select('*').order('sort_order'),
    sb.from('sessions').select('area_id, completed_at').not('completed_at', 'is', null).order('completed_at', { ascending: false }),
    sb.from('sessions').select('area_id').is('completed_at', null),
  ]);

  const lastCompleted = {};
  (sessions || []).forEach(s => {
    if (!lastCompleted[s.area_id]) lastCompleted[s.area_id] = s.completed_at;
  });

  const liveAreaIds = new Set((liveSessions || []).map(s => s.area_id));

  renderDashboard(areas || [], lastCompleted, sessions || []);
  renderCards(areas || [], lastCompleted, liveAreaIds);
}

function renderDashboard(areas, lastCompleted, allSessions) {
  const areaMap = {};
  areas.forEach(a => { areaMap[a.id] = a; });

  let overdueCount = 0, okCount = 0;
  areas.forEach(area => {
    const status = getCardStatus(lastCompleted[area.id], area.reminder_interval_days);
    if (status === 'overdue') overdueCount++;
    if (status === 'ok' || status === 'due-soon') okCount++;
  });

  const healthPct = areas.length ? Math.round((okCount / areas.length) * 100) : 0;
  const ringColor = healthPct >= 70 ? '#4ade80' : healthPct >= 40 ? '#f59e0b' : '#ef4444';
  const ring = document.getElementById('health-ring');
  ring.style.background = `conic-gradient(${ringColor} ${healthPct}%, rgba(255,255,255,0.08) 0)`;
  ring.style.color = ringColor;
  ring.textContent = healthPct + '%';

  document.getElementById('vc-sessions').textContent = allSessions.length + ' sessions logged';

  const setVal = (id, text, color) => {
    const pill = document.getElementById(id);
    const v = pill.querySelector('.stat-val');
    v.textContent = text;
    if (color) v.style.color = color;
  };
  setVal('stat-overdue', overdueCount, overdueCount > 0 ? '#ef4444' : '#4ade80');
  setVal('stat-ok', okCount, '#4ade80');

  const mostRecent = allSessions[0];
  if (mostRecent) {
    const diff = Math.floor((Date.now() - new Date(mostRecent.completed_at)) / 86400000);
    setVal('stat-since', diff === 0 ? 'Today' : diff + 'd');
  } else {
    setVal('stat-since', '—');
  }
  setVal('stat-sessions', allSessions.length);

  // Recent activity
  const recentList = document.getElementById('recent-list');
  recentList.innerHTML = '';
  const recent = allSessions.slice(0, 3);
  if (recent.length === 0) {
    recentList.innerHTML = '<div class="act-empty">No sessions yet</div>';
  } else {
    recent.forEach(s => {
      const area = areaMap[s.area_id];
      if (!area) return;
      const div = document.createElement('div');
      div.className = 'act-entry';
      div.innerHTML = `<span class="act-icon">${area.icon}</span><span class="act-label">${esc(area.name)}</span><span class="act-date">${formatDate(s.completed_at)}</span>`;
      recentList.appendChild(div);
    });
  }

  // Coming due — sorted by urgency
  const dueList = document.getElementById('due-list');
  dueList.innerHTML = '';
  const now = Date.now();
  const dueItems = areas
    .filter(a => lastCompleted[a.id])
    .map(a => {
      const daysUntil = Math.ceil((new Date(lastCompleted[a.id]).getTime() + a.reminder_interval_days * 86400000 - now) / 86400000);
      return { area: a, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  if (dueItems.length === 0) {
    dueList.innerHTML = '<div class="act-empty">No data yet</div>';
  } else {
    dueItems.forEach(({ area, daysUntil }) => {
      const div = document.createElement('div');
      div.className = 'act-entry';
      const badge = daysUntil < 0
        ? `<span class="act-overdue">Overdue</span>`
        : daysUntil === 0
          ? `<span class="act-due-soon">Today</span>`
          : daysUntil <= 14
            ? `<span class="act-due-soon">in ${daysUntil}d</span>`
            : `<span class="act-date">in ${daysUntil}d</span>`;
      div.innerHTML = `<span class="act-icon">${area.icon}</span><span class="act-label">${esc(area.name)}</span>${badge}`;
      dueList.appendChild(div);
    });
  }
}

const STATUS_EMOJI = { 'ok': '🟢', 'due-soon': '🟡', 'overdue': '🔴', 'never': '⚪' };
const TRIP_SLUGS = ['trip-departure', 'pack-out'];

function renderCards(areas, lastCompleted, liveAreaIds = new Set()) {
  const tripAreas = TRIP_SLUGS.map(s => areas.find(a => a.slug === s)).filter(Boolean);
  const maintAreas = areas.filter(a => !TRIP_SLUGS.includes(a.slug));

  // Trip cards — full size
  const tripGrid = document.getElementById('trip-grid');
  tripGrid.innerHTML = '';
  tripAreas.forEach(area => {
    const last = lastCompleted[area.id];
    const isOverdue = isAreaOverdue(last, area.reminder_interval_days);
    const status = getCardStatus(last, area.reminder_interval_days);
    const isLive = liveAreaIds.has(area.id);
    const card = document.createElement('div');
    card.className = 'area-card';
    card.innerHTML = `
      ${isLive
        ? '<div class="live-badge">● LIVE</div>'
        : `<div class="status-dot">${STATUS_EMOJI[status]}</div>`}
      <div class="card-icon">${area.icon}</div>
      <div class="card-name">${area.name}</div>
      ${last
        ? `<div class="${isOverdue ? 'card-overdue' : 'card-last'}">${isOverdue ? 'Overdue' : formatDate(last)}</div>`
        : `<div class="card-never">Not started</div>`
      }
    `;
    card.addEventListener('click', () => showSection(area));
    tripGrid.appendChild(card);
  });

  // Maintenance rows — compact, collapsible
  const maintList = document.getElementById('maint-list');
  maintList.innerHTML = '';
  let overdueCount = 0;

  maintAreas.forEach(area => {
    const last = lastCompleted[area.id];
    const isOverdue = isAreaOverdue(last, area.reminder_interval_days);
    const status = getCardStatus(last, area.reminder_interval_days);
    const isLive = liveAreaIds.has(area.id);
    if (isOverdue) overdueCount++;

    const row = document.createElement('div');
    row.className = 'maint-row';
    const datePart = isLive
      ? `<span class="live-dot">● LIVE</span>`
      : last
        ? (isOverdue
            ? `<span class="card-overdue">Overdue</span>`
            : `<span class="maint-last">${formatDate(last)}</span>`)
        : `<span class="maint-never">Never</span>`;
    row.innerHTML = `
      <span class="maint-icon">${area.icon}</span>
      <span class="maint-name">${area.name}</span>
      ${datePart}
      ${isLive ? '' : `<span class="maint-dot">${STATUS_EMOJI[status]}</span>`}
    `;
    row.addEventListener('click', () => showSection(area));
    maintList.appendChild(row);
  });

  // Overdue badge on toggle
  const badge = document.getElementById('maint-overdue-badge');
  if (overdueCount > 0) {
    badge.textContent = overdueCount + ' overdue';
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function getCardStatus(lastCompletedAt, intervalDays) {
  if (!lastCompletedAt) return 'never';
  const due = new Date(new Date(lastCompletedAt).getTime() + intervalDays * 86400000);
  const now = new Date();
  if (due < now) return 'overdue';
  if ((due - now) / 86400000 <= 14) return 'due-soon';
  return 'ok';
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

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await seedIfEmpty();
  await ensureNewAreas();
  await showHub();

  document.getElementById('back-btn').addEventListener('click', showHub);

  document.getElementById('maint-toggle').addEventListener('click', () => {
    const list = document.getElementById('maint-list');
    const arrow = document.getElementById('maint-arrow');
    const collapsed = list.classList.toggle('collapsed');
    arrow.textContent = collapsed ? '▾' : '▴';
  });

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

async function loadRunMode() {
  const [{ data: items }, { data: pastSessions }, { data: inProgress }] = await Promise.all([
    sb.from('checklist_items').select('*').eq('area_id', currentArea.id).eq('is_active', true).order('sort_order'),
    sb.from('sessions').select('id, completed_at').eq('area_id', currentArea.id).not('completed_at', 'is', null),
    sb.from('sessions').select('id').eq('area_id', currentArea.id).is('completed_at', null).limit(1).maybeSingle(),
  ]);

  // Build item_text → most recent completed_at from checked session_items
  const lastDoneMap = {};
  const completedIds = (pastSessions || []).map(s => s.id);
  if (completedIds.length > 0) {
    const sessionDateMap = {};
    (pastSessions || []).forEach(s => { sessionDateMap[s.id] = s.completed_at; });
    const { data: doneItems } = await sb
      .from('session_items').select('item_text, session_id')
      .in('session_id', completedIds).eq('checked', true);
    (doneItems || []).forEach(ci => {
      const date = sessionDateMap[ci.session_id];
      if (date && (!lastDoneMap[ci.item_text] || date > lastDoneMap[ci.item_text]))
        lastDoneMap[ci.item_text] = date;
    });
  }

  const list = document.getElementById('checklist');
  list.innerHTML = '';
  (items || []).forEach(item => {
    const li = document.createElement('li');
    li.dataset.id = item.id;
    li.dataset.text = item.text;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.disabled = true;
    const textWrap = document.createElement('div');
    textWrap.className = 'item-text-wrap';
    const span = document.createElement('span');
    span.className = 'item-text';
    span.textContent = item.text;
    const dateSpan = document.createElement('span');
    dateSpan.className = 'item-last';
    dateSpan.textContent = lastDoneMap[item.text] ? 'Last: ' + formatDate(lastDoneMap[item.text]) : 'Never done';
    textWrap.appendChild(span);
    textWrap.appendChild(dateSpan);
    li.appendChild(cb);
    li.appendChild(textWrap);
    list.appendChild(li);
  });

  if (inProgress) {
    // Resume in-progress session
    currentSessionId = inProgress.id;
    const stored = JSON.parse(localStorage.getItem(`rv_session_${currentArea.id}`) || 'null');
    const toRestore = (stored && stored.sessionId === inProgress.id) ? stored.checkedIds : [];
    activateSession(toRestore);
  } else {
    currentSessionId = null;
    checkedItems.clear();
    sessionActive = false;
    document.getElementById('progress-wrap').classList.add('hidden');
    document.getElementById('session-footer').classList.add('hidden');
    document.getElementById('session-notes').value = '';
    document.getElementById('start-session-btn').classList.remove('hidden');
    document.getElementById('complete-session-btn').classList.add('hidden');
  }
}

function activateSession(checkedIdsToRestore = []) {
  sessionActive = true;
  checkedItems.clear();
  checkedIdsToRestore.forEach(id => checkedItems.add(id));

  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('session-date');
  if (!dateEl.value) dateEl.value = today;
  dateEl.max = today;

  document.getElementById('start-session-btn').classList.add('hidden');
  document.getElementById('complete-session-btn').classList.remove('hidden');
  document.getElementById('session-footer').classList.remove('hidden');
  document.getElementById('progress-wrap').classList.remove('hidden');

  const listItems = document.querySelectorAll('#checklist li');
  listItems.forEach(li => {
    li.classList.add('active');
    const cb = li.querySelector('input[type="checkbox"]');
    cb.disabled = false;
    if (checkedItems.has(li.dataset.id)) {
      cb.checked = true;
      li.classList.add('checked');
    }
    li.addEventListener('click', e => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });
    cb.addEventListener('change', () => {
      if (cb.checked) { checkedItems.add(li.dataset.id); li.classList.add('checked'); }
      else { checkedItems.delete(li.dataset.id); li.classList.remove('checked'); }
      updateProgress(listItems.length);
      saveSessionLocally();
    });
  });

  updateProgress(listItems.length);
}

function saveSessionLocally() {
  if (!currentSessionId || !currentArea) return;
  localStorage.setItem(`rv_session_${currentArea.id}`, JSON.stringify({
    sessionId: currentSessionId,
    checkedIds: Array.from(checkedItems),
  }));
}
async function loadHistory() {
  const { data: sessions } = await sb
    .from('sessions')
    .select('id, completed_at, notes')
    .eq('area_id', currentArea.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  if (!sessions || sessions.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No sessions logged yet.</p>';
    document.getElementById('history-panel').classList.remove('hidden');
    return;
  }

  const sessionIds = sessions.map(s => s.id);
  const { data: allItems } = await sb
    .from('session_items')
    .select('session_id, item_text, checked')
    .in('session_id', sessionIds);

  const itemsBySession = {};
  (allItems || []).forEach(i => {
    if (!itemsBySession[i.session_id]) itemsBySession[i.session_id] = [];
    itemsBySession[i.session_id].push(i);
  });

  for (const session of sessions) {
    const items = itemsBySession[session.id] || [];

    const entry = document.createElement('div');
    entry.className = 'history-entry';

    const checkedCount = items.filter(i => i.checked).length;
    const total = items.length;

    const makeDateStr = iso => new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    entry.innerHTML = `
      <div class="history-entry-header">
        <div class="history-date-wrap">
          <span class="history-date">${makeDateStr(session.completed_at)} &mdash; ${checkedCount}/${total} items</span>
          <button class="edit-date-btn" title="Edit date">✎</button>
        </div>
        <span class="history-toggle">▾ Details</span>
      </div>
      ${session.notes ? `<p class="history-notes">${esc(session.notes)}</p>` : ''}
      <ul class="history-items">
        ${items.map(i => `<li class="${i.checked ? '' : 'unchecked'}">${esc(i.item_text)}</li>`).join('')}
      </ul>
    `;

    entry.querySelector('.history-entry-header').addEventListener('click', e => {
      if (e.target.closest('.edit-date-btn, .history-date-edit')) return;
      const ul = entry.querySelector('.history-items');
      const toggle = entry.querySelector('.history-toggle');
      ul.classList.toggle('open');
      toggle.textContent = ul.classList.contains('open') ? '▴ Hide' : '▾ Details';
    });

    entry.querySelector('.edit-date-btn').addEventListener('click', e => {
      e.stopPropagation();
      const dateSpan = entry.querySelector('.history-date');
      const editBtn = entry.querySelector('.edit-date-btn');
      const currentVal = session.completed_at.split('T')[0];

      const input = document.createElement('input');
      input.type = 'date';
      input.className = 'history-date-edit';
      input.value = currentVal;
      input.max = new Date().toISOString().split('T')[0];
      dateSpan.replaceWith(input);
      editBtn.textContent = '✕';
      input.focus();

      const cancel = () => {
        input.replaceWith(dateSpan);
        editBtn.textContent = '✎';
      };

      const commit = async () => {
        if (!input.value || input.value === currentVal) { cancel(); return; }
        const newIso = new Date(input.value + 'T12:00:00').toISOString();
        const { error } = await sb.from('sessions').update({ completed_at: newIso }).eq('id', session.id);
        if (error) { console.error('Date update failed:', error); cancel(); return; }
        session.completed_at = newIso;
        dateSpan.innerHTML = `${makeDateStr(newIso)} &mdash; ${checkedCount}/${total} items`;
        input.replaceWith(dateSpan);
        editBtn.textContent = '✎';
      };

      editBtn.onclick = e => { e.stopPropagation(); cancel(); editBtn.onclick = null; };
      input.addEventListener('change', commit);
      input.addEventListener('blur', () => setTimeout(() => { if (document.contains(input)) cancel(); }, 150));
    });

    historyList.appendChild(entry);
  }

  document.getElementById('history-panel').classList.remove('hidden');
}
async function startSession() {
  if (sessionActive) return;

  const btn = document.getElementById('start-session-btn');
  btn.disabled = true;
  btn.textContent = 'Starting…';

  // Delete any stale in-progress sessions so the insert doesn't conflict
  await sb.from('sessions').delete().eq('area_id', currentArea.id).is('completed_at', null);

  const { data: session, error } = await sb
    .from('sessions')
    .insert({ area_id: currentArea.id, completed_at: null, notes: null })
    .select().single();

  if (error) {
    console.error('Failed to start session:', error);
    btn.disabled = false;
    btn.textContent = 'Start Session';
    alert('Failed to start session. Please try again.');
    return;
  }

  currentSessionId = session.id;
  saveSessionLocally();
  activateSession();
}

function updateProgress(total) {
  const count = checkedItems.size;
  const pct = total ? Math.round((count / total) * 100) : 0;
  document.getElementById('progress-bar').style.setProperty('--progress', pct + '%');
  document.getElementById('progress-label').textContent = `${count} / ${total}`;
}
async function completeSession() {
  const btn = document.getElementById('complete-session-btn');
  btn.disabled = true;

  const notes = document.getElementById('session-notes').value.trim() || null;
  const dateVal = document.getElementById('session-date').value;
  const completedAt = dateVal
    ? new Date(dateVal + 'T12:00:00').toISOString()
    : new Date().toISOString();

  const { error: sessionErr } = await sb
    .from('sessions')
    .update({ completed_at: completedAt, notes })
    .eq('id', currentSessionId);

  if (sessionErr) {
    console.error('Session complete failed:', sessionErr);
    alert('Failed to save session. Check the console for details.');
    btn.disabled = false;
    return;
  }

  const allItems = document.querySelectorAll('#checklist li');
  const sessionItems = Array.from(allItems).map(li => ({
    session_id: currentSessionId,
    item_text: li.dataset.text,
    checked: checkedItems.has(li.dataset.id),
  }));

  const { error: itemErr } = await sb.from('session_items').insert(sessionItems);
  if (itemErr) console.error('Session items insert failed:', itemErr);

  localStorage.removeItem(`rv_session_${currentArea.id}`);
  currentSessionId = null;

  await showHub();
}
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
      <span class="edit-text">${esc(item.text)}</span>
      <button class="delete-btn">✕</button>
    `;

    li.querySelector('[data-dir="up"]').addEventListener('click', () => moveItem(item.id, 'up'));
    li.querySelector('[data-dir="down"]').addEventListener('click', () => moveItem(item.id, 'down'));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));

    list.appendChild(li);
  });
}
async function addItem() {
  const input = document.getElementById('new-item-input');
  const text = input.value.trim();
  if (!text) return;

  const btn = document.getElementById('add-item-btn');
  btn.disabled = true;

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
  btn.disabled = false;
  await loadEditMode();
}

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
    sb.from('checklist_items').update({ sort_order: swapIdx }).eq('id', a.id),
    sb.from('checklist_items').update({ sort_order: idx }).eq('id', b.id),
  ]);

  await loadEditMode();
}
