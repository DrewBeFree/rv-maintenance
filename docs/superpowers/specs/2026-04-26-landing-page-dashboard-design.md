# Landing Page Dashboard — Design Spec
**Date:** 2026-04-26

## Overview

Enhance the hub view to feel like a real maintenance dashboard, not just a list of checklists. Adds a vehicle identity card, stats summary, recent activity feed, and coming-due panel above the existing card grid. Cards get emoji status dots for at-a-glance health. Background image (bg.jpg) and amber/dark theme are preserved exactly.

---

## New Sections (above card grid)

### 1. Vehicle Identity Card
- RV emoji (🚐), name "Freedom Elite 26HE", "2019 Thor Motor Coach", total session count
- Health score ring (conic-gradient circle) showing % of areas currently up to date
- Health ring color: green if ≥70%, amber if 40–69%, red if <40%

### 2. Stats Pills Row
Four pills: Overdue count (red), Up to date count (green), Days since last service, Total sessions logged

### 3. Activity Panels (two side by side)
- **Recent activity:** last 3 sessions across all areas — icon, name, date
- **Coming due:** top 3 areas sorted by urgency — overdue first, then soonest due

---

## Card Status Dots

Emoji dot in top-right corner of each area card:
- 🔴 Overdue (past due date)
- 🟡 Due soon (due within 14 days)
- 🟢 Up to date (more than 14 days remaining)
- ⚪ Never logged

---

## Implementation Scope

- `index.html`: add markup for vehicle card, stats row, activity panels
- `style.css`: add styles for new sections; preserve all existing styles
- `app.js`: update `showHub()` to compute stats and render new sections; update `renderCards()` to add status dots

---

## What Does NOT Change

- bg.jpg background, overlay, header gradient — untouched
- Section view (run mode, edit mode, history) — untouched
- Card grid layout, card dimensions, hover behavior — untouched
- Supabase data model — no schema changes
