# RV Maintenance Tracker — Design Spec
**Date:** 2026-04-26
**Vehicle:** 2019 Thor Freedom Elite 26HE

---

## Overview

A personal RV maintenance tracker hosted on GitHub Pages. Tracks completion history and shows overdue reminders for 10 maintenance areas pre-populated for the 2019 Thor Freedom Elite 26HE. Checklists are fully editable. Single user for now, with sharing capability planned for the future.

---

## Repository

- **Repo:** `rv-maintenance` (new, under `C:\Users\drewb\Documents\GitHub\`)
- **Hosting:** GitHub Pages
- **Stack:** Pure HTML/CSS/JS, no build step
- **Backend:** Supabase (same instance as other apps)

---

## File Structure

```
rv-maintenance/
├── index.html      # Page shell + all view markup
├── style.css       # Rugged amber/brown theme
├── app.js          # All logic: routing, Supabase, checklist, history
├── bg.jpg          # User's RV photo (IMG_4497) — page background
└── CNAME           # Custom domain (if desired)
```

---

## Visual Design

- **Background:** User's personal RV photo (`bg.jpg`) — fixed, full-bleed, `center/cover`
- **Overlay:** `rgba(10,6,0,0.45)` — lets the photo show through while keeping text readable
- **Header gradient:** `rgba(10,6,0,0.7)` fading to transparent
- **Accent color:** `#fcd34d` (amber/gold) for titles, card labels
- **Card background:** `rgba(10,6,0,0.65)` with `backdrop-filter: blur(6px)`
- **Card border:** `rgba(251,191,36,0.25)`, brightens to `0.55` on hover
- **Overdue indicator:** `#ef4444` (red)
- **Last completed text:** `rgba(161,98,7,0.9)` (muted amber)
- **Font:** Georgia (headings), system sans-serif (labels/body)

---

## Maintenance Areas

10 areas, pre-populated with checklists for the 2019 Thor Freedom Elite 26HE:

| Area | Icon | Default Reminder Interval |
|---|---|---|
| Winterize | ❄️ | 365 days (annual) |
| De-Winterize | 🌱 | 365 days (annual) |
| Generator | 🔧 | 90 days |
| Battery / Electrical | ⚡ | 90 days |
| Roof / Seals | 🏠 | 180 days |
| LP Gas | 🔥 | 180 days |
| Engine / Chassis | 🚗 | 180 days |
| Water System | 💧 | 180 days |
| HVAC | 🌬️ | 365 days |
| Tires / Wheels | 🛞 | 90 days |

---

## UI Flow

### Hub View (default)
- Grid of 10 area cards (`auto-fill, minmax(180px, 1fr)`)
- Each card shows: icon, area name, last completed date (or "Overdue" in red if past due)
- Overdue = `last_completed_at + reminder_interval_days < today`
- Tap a card → navigate to Section View

### Section View
Two modes toggled by a button:

**Run Mode (default)**
- "Start Session" button activates the checklist
- Each item becomes checkable; progress bar shows X/N checked
- Optional notes field at bottom
- "Complete Session" button: writes session + items to Supabase, returns to hub
- Abandoned sessions (page closed before completing) are discarded — nothing is written until "Complete Session" is tapped

**Edit Mode**
- Toggle via "Edit Checklist" button
- Add new items (text input + add button)
- Delete items (trash icon per item)
- Reorder items (up/down arrow buttons per item — no drag library)
- Changes save immediately to Supabase

**History Panel** (below checklist in both modes)
- Scrollable log of past sessions for this area
- Each entry: date, notes (if any), expandable list of checked items (snapshot)

### Navigation
- Hub → Section: JS hides hub div, shows section div, updates `currentArea`
- Section → Hub: back button, hides section div, shows hub div, refreshes hub data

---

## Data Model (Supabase)

### `areas`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| slug | text | e.g. `winterize` |
| name | text | Display name |
| icon | text | Emoji |
| sort_order | int | Card order on hub |
| reminder_interval_days | int | Days between sessions |

Seeded once on first load if empty.

### `checklist_items`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| area_id | uuid | FK → areas |
| text | text | Item label |
| sort_order | int | Display order |
| is_active | boolean | Soft delete for removed items |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| area_id | uuid | FK → areas |
| completed_at | timestamptz | When session was logged |
| notes | text | Optional user notes |

### `session_items`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| session_id | uuid | FK → sessions |
| item_text | text | Snapshot of item text at completion time |
| checked | boolean | Whether this item was checked |

`item_text` is a snapshot so history stays accurate even after checklist edits.

---

## Reminders

- **Phase 1 (this build):** Visual only — "Overdue" badge on hub cards when past due
- **Phase 2 (future):** Text/push notification system — interval and contact info stored per area, external trigger (e.g. cron + Twilio)

`reminder_interval_days` is stored on the `areas` table and editable (but not exposed in UI yet — hardcoded defaults for now, editable via Edit Mode in a future pass).

---

## Pre-Populated Checklists

Full checklists for each area tailored to the 2019 Thor Freedom Elite 26HE, seeded on first load. Representative examples:

**Winterize:**
- Drain fresh water tank
- Drain and bypass water heater
- Blow out water lines with compressed air
- Add RV antifreeze to all drains (sinks, shower, toilet)
- Drain and flush black/gray tanks
- Disconnect and store battery (or use battery tender)
- Cover roof vents
- Inspect and seal any gaps/cracks

**Generator:**
- Run generator under load for 2 hours
- Check oil level and condition
- Check air filter
- Check fuel level
- Inspect exhaust for blockage
- Test transfer switch operation
- Log hours since last service

*(Full lists for all 10 areas generated at seed time in app.js)*

---

## Future Considerations

- Multi-user / sharing: `user_id` column on sessions + Supabase auth
- Text reminders: Twilio integration, phone number stored in user profile
- Reminder interval editing: exposed in UI per area
- Mileage-based reminders: for engine/chassis tasks
