# Data Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract all tab data from `tracker-site/index.html` into a single `tracker-site/data.json`, then rewrite `index.html` to fetch and render from it — making the data accessible at `lc80.vercel.app/data.json` for AI consumption while keeping the visual site identical. Add a FastAPI local preview server and a schema doc for structured data intake.

**Architecture:** All data lives in `data.json` as a single source of truth. `index.html` fetches it on load and renders each tab with JS render functions. All existing CSS and tab-switching logic is preserved untouched. A FastAPI server mounts `tracker-site/` as static files for local preview. A `docs/schema.md` defines required fields + allowed status values per tab so Claude can run structured intake conversations.

**Tech Stack:** Vanilla HTML/CSS/JS, static Vercel hosting (prod). FastAPI + uvicorn (local preview only). No build step, no framework.

**Files:**
| File | Purpose |
|------|---------|
| `tracker-site/data.json` | Single source of truth for all data |
| `tracker-site/index.html` | Fetches `data.json`, renders all tabs dynamically |
| `docs/schema.md` | Required fields + allowed status values per tab |
| `server.py` | FastAPI local preview server |
| `requirements.txt` | `fastapi`, `uvicorn` |

**Local workflow:**
```
uvicorn server:app --reload
# → http://localhost:8000
```

---

## Important Context

- `tracker-site/index.html` is ~362KB — a single file with all CSS, data, and JS
- There are 8 tabs: Build, Fluid Guide, 2026 Strategy, Project Tracker, Parts Inventory, Spend Summary, Scheduled Maintenance, Shop Contacts
- The existing tab-switching JS uses `showTab(name)` and `window.location.hash`
- All tab content divs have ids like `id="tab-Build"`, `id="tab-Fluid-Guide"` etc.
- The file is too large to read at once — always use `offset` + `limit` when reading

---

### Task 1: Create branch

**Files:**
- No file changes yet

**Step 1: Create and checkout the feature branch**

```bash
git checkout -b feature/data-layer
```

**Step 2: Verify**

```bash
git branch
```
Expected: `* feature/data-layer`

---

### Task 2: Extract data — `meta` + `build` tab

**Files:**
- Create: `tracker-site/data.json`

Read `index.html` lines 107–476 (the Build tab content). Extract all build cards and items.

**Step 1: Create `tracker-site/data.json` with meta + build**

The build tab has cards grouped by category. Each card has a header (category + icon) and items (status emoji, name, note, tags).

Status values to normalize: `installed`, `urgent`, `planned`, `on_hand`, `ordered`

```json
{
  "meta": {
    "vehicle": "1993 Toyota Land Cruiser HDJ81",
    "engine": "1HD-T 4.2L Inline-6 Turbo Diesel",
    "transmission": "H151F 5-Speed Manual",
    "odometer_km": 170000,
    "color": "Purple / White",
    "tires": "37\"",
    "updated": "2026-02",
    "torque_now_nm": 380,
    "torque_target_nm": 500,
    "torque_max_nm": 600
  },
  "build": [
    {
      "category": "Engine / Power",
      "icon": "⚙️",
      "items": [
        {
          "status": "installed",
          "name": "UFI 18G Turbo (20psi)",
          "note": "Upgraded from factory CT26. Direct bolt-on. Running at 20psi.",
          "tags": ["INSTALLED"]
        },
        {
          "status": "installed",
          "name": "PDI Front Mount Intercooler",
          "note": "50–100°C charge temp reduction. Confirmed installed with turbo. Critical safety margin for pump tune.",
          "tags": ["INSTALLED"]
        },
        {
          "status": "installed",
          "name": "TerraClean Fuel System Service",
          "note": "Full fuel system clean done at ~165,000 km. Injectors confirmed serviceable.",
          "tags": ["INSTALLED"]
        },
        {
          "status": "installed",
          "name": "Engine Hoses (Replaced)",
          "note": "New rubber engine hoses installed.",
          "tags": ["INSTALLED"]
        },
        {
          "status": "urgent",
          "name": "BEB Fix — ACL Race Bearings + Rod Bolts",
          "note": "Do before pump tune. Parts on hand. ~3–4hrs Liam. Common 1HD-T failure — do not run up boost on unresolved bearings.",
          "tags": ["PARTS ON HAND", "DO FIRST"]
        },
        {
          "status": "planned",
          "name": "Valve Adjustment",
          "note": "Jon Fox recommended. Check before sending pump. Good time to do it while engine access is open for pump removal.",
          "tags": ["PLANNED"]
        },
        {
          "status": "planned",
          "name": "3\" Exhaust",
          "note": "Reduces backpressure. Needed for full efficiency at 20psi+.",
          "tags": ["PLANNED"]
        },
        {
          "status": "planned",
          "name": "Pump Tune — Jon Fox @ Black Fox Diesel",
          "note": "Remove pump → drain fuel → ship to Celista BC (5124 Meadow Creek Rd) → bench rebuild + tune → reinstall. $1,300 CAD basic (gaskets, seals, calibration). Jon already has full build context from Oct 2024 emails. Fine-tune after install recommended. No injector work needed.",
          "tags": ["PLANNED"]
        },
        {
          "status": "planned",
          "name": "1HD-T Engine Rebuild — Eli (Edmonton)",
          "note": "Full long block rebuild scheduled with Eli in Edmonton. Head, block, crank, rods, pistons, bearings, cam. One worn cylinder ring confirmed — oil consumption 2.3L / 9,000 km. Target late 2026 / 2027. Most gasket + seal parts on hand.",
          "tags": ["PLANNED — 2026/27"]
        }
      ]
    }
  ]
}
```

**Step 2: Read the remaining build cards from `index.html`** (lines 216–476) and append remaining categories to the `build` array. Categories to extract:
- Drivetrain / Axles (lines ~216–266)
- Offroad Capability (lines ~267–476 — read in chunks)

Read and extract: each `build-card` div becomes one object. Each `build-item` div becomes one item.

**Step 3: Commit**

```bash
git add tracker-site/data.json
git commit -m "feat: add data.json scaffold with meta + build tab"
```

---

### Task 3: Extract data — `fluid_guide` + `strategy_2026`

**Files:**
- Modify: `tracker-site/data.json`

Read `index.html` lines 477–529.

**Step 1: Append `fluid_guide` array**

```json
"fluid_guide": [
  {
    "system": "Engine Oil (1HD-T)",
    "spec": "15W-40 diesel engine oil",
    "capacity": "~9L (with filter)",
    "buy_amount": "10L",
    "brand": "Mobil Delvac 15W-40",
    "status": "tracker-based",
    "notes": "Scheduled Maintenance tab currently tracks ~9L @ 170k."
  },
  {
    "system": "Manual Transmission (H151F)",
    "spec": "USE ONLY Red Line MT-90 (GL-4)",
    "capacity": "2.6L (H151F)",
    "buy_amount": "4L",
    "brand": "Red Line MT-90 (GL-4) ONLY",
    "status": "locked",
    "notes": "IMPORTANT: No friction modifiers and no additives."
  }
  // ... remaining rows from lines 484–491
]
```

Read lines 477–493 carefully and extract all 9 fluid rows.

**Step 2: Append `strategy_2026` array**

Read lines 494–529. Structure as phases with tasks:

```json
"strategy_2026": [
  {
    "phase": "PHASE 2 — SPRING 2026 | Safety + Driveability + Pre-Summer",
    "tasks": [
      {
        "id": "strat-rear-diff",
        "checked": false,
        "priority": "urgent",
        "task": "Rear Differential Fluid (AMSOIL 75W-140)",
        "who": "Liam Schram",
        "cost_cad": 130,
        "time": "30 min",
        "notes": "DARK OIL REPORTED at 170,000 km — only 10,000 km after Eaton E-Locker install at 160k. Likely break-in debris. Drain and refill with AMSOIL 75W-140. Do NOT wait for 40k interval."
      }
      // ... all tasks for this phase
    ]
  },
  {
    "phase": "PHASE 3 — SUMMER/FALL 2026 | Cosmetic + Comfort + Rebuild Prep",
    "tasks": [ ... ]
  },
  {
    "phase": "PHASE 4 — ENGINE REBUILD PLANNING (Late 2026 / 2027)",
    "tasks": [ ... ]
  }
]
```

**Step 3: Commit**

```bash
git add tracker-site/data.json
git commit -m "feat: add fluid_guide and strategy_2026 to data.json"
```

---

### Task 4: Extract data — `project_tracker`

**Files:**
- Modify: `tracker-site/data.json`

Read `index.html` lines 530–639.

**Step 1: Append `project_tracker` array**

Structure as sections. Each section-header row becomes a section, each `project-main` + its `parts-sub` rows become one project object.

```json
"project_tracker": [
  {
    "section": "URGENT — Action Required Now",
    "projects": [
      {
        "project": "Rear Differential Fluid Service (AMSOIL 75W-140)",
        "category": "Drivetrain / Fluids",
        "who": "Liam Schram",
        "status": "URGENT SERVICE",
        "cost_cad": 130,
        "hours": 0.5,
        "priority": "1 🔴 TOP",
        "notes": "DARK rear diff oil reported at 170,000 km only ~10,000 km after Eaton E-Locker install (likely break-in debris). Drain + refill ASAP.",
        "on_hand": null,
        "still_needed": "Book service with Liam and confirm refill with AMSOIL 75W-140"
      }
      // ... all urgent projects
    ]
  },
  {
    "section": "NEEDS PARTS / BOOKING",
    "projects": [ ... ]
  },
  {
    "section": "NEEDS INVESTIGATION / PLANNING",
    "projects": [ ... ]
  },
  {
    "section": "SCHEDULED — 2026/27",
    "projects": [ ... ]
  },
  {
    "section": "DONE",
    "projects": [ ... ]
  }
]
```

Read lines 530–639 carefully. Extract every `project-main` row and its associated `parts-sub` rows.

**Step 2: Commit**

```bash
git add tracker-site/data.json
git commit -m "feat: add project_tracker to data.json"
```

---

### Task 5: Extract data — `parts_inventory`

**Files:**
- Modify: `tracker-site/data.json`

Read `index.html` lines 640–1650 in chunks (use offset+limit of ~100 lines at a time).

**Step 1: Append `parts_inventory` array**

```json
"parts_inventory": [
  {
    "name": "80 Series PDI Intercooler Kit (1HD-FT Manual)",
    "vendor": "HD Automotive",
    "part_number": null,
    "price_paid": 1431.82,
    "currency": "AUD",
    "approx_cad": 1289,
    "project": "Intercooler Install",
    "status": "installed"
  },
  {
    "name": "UFI Turbo 1HD-T — 18G 250hp",
    "vendor": "HD Automotive",
    "part_number": null,
    "price_paid": 2045.45,
    "currency": "AUD",
    "approx_cad": 1841,
    "project": "New Turbo Install",
    "status": "installed"
  }
  // ... all parts rows
]
```

Status values to normalize: `installed`, `on_hand`, `sold`, `used`, `reference`

**Step 2: Commit**

```bash
git add tracker-site/data.json
git commit -m "feat: add parts_inventory to data.json"
```

---

### Task 6: Extract data — `spend_summary`, `scheduled_maintenance`, `shop_contacts`

**Files:**
- Modify: `tracker-site/data.json`

**Step 1: Read and extract `spend_summary`** (lines 1651–2671)

```json
"spend_summary": [
  {
    "date": "2023-07-21",
    "vendor": "INITIAL PURCHASE — LC80",
    "description": "Purchase price of LC80",
    "amount_cad": 23990,
    "is_total": false
  },
  {
    "date": "2023-11",
    "vendor": "HD Automotive (AUS) — Inv. 3894",
    "description": "Intercooler kit, water pump, timing belt, gaskets, fan belt + shipping",
    "amount_cad": 2520,
    "is_total": false
  }
  // ... all rows. Mark total/subtotal rows with is_total: true
]
```

Read in chunks. The spend summary is ~1000 lines — it includes invoice line items, labour rows, subtotals, and totals. Mark summary/total rows with `is_total: true`.

**Step 2: Read and extract `scheduled_maintenance`** (lines 2672–3650)

```json
"scheduled_maintenance": [
  {
    "item": "Engine Oil + Filter (10W-30 Diesel)",
    "interval": "5,000 km",
    "last_done_km": 170000,
    "last_done_notes": "Feb 2026 — AMS 10W-30, fresh",
    "next_due_km": 175000,
    "km_until_due": 5000,
    "status": "upcoming",
    "notes": "AMS 10W-30 Diesel. ~9L with filter. Next due ~175,000 km or ~3 months."
  }
  // ... all maintenance items
]
```

Status values: `ok`, `upcoming`, `overdue`, `urgent`, `deferred`

**Step 3: Read and extract `shop_contacts`** (lines 3651–3680)

```json
"shop_contacts": [
  {
    "name": "Liam Schram",
    "role": "Primary Mechanic (Red Seal)",
    "location": "6943 Kelly Rd S, Prince George, BC V2K 2H4",
    "phone": "+1 (250) 552-9469",
    "contact": "liamschram@gmail.com — $80/hr labour rate",
    "specialty": "Red seal mechanic. Brakes, seals, diffs, trans, AC, general mechanical."
  }
  // ... all contacts
]
```

**Step 4: Commit**

```bash
git add tracker-site/data.json
git commit -m "feat: add spend_summary, scheduled_maintenance, shop_contacts to data.json"
```

---

### Task 7: Rewrite `index.html` — scaffold + fetch infrastructure

**Files:**
- Modify: `tracker-site/index.html`

**Step 1: Read the current JS at the bottom of index.html** (lines 4658–end)

```bash
# Check total line count
wc -l tracker-site/index.html
```

Read lines ~4658–end to understand the existing `showTab()` and `sortProjectTable()` functions.

**Step 2: Replace all tab content divs with empty containers**

For each tab div like:
```html
<div id="tab-Build" class="tab-content" style="display:block">
  ... hundreds of lines ...
</div>
```

Replace with:
```html
<div id="tab-Build" class="tab-content" style="display:block"></div>
```

Do this for all 8 tabs. Keep all CSS, the `<h1>`, legend, tab-bar, and existing JS functions.

**Step 3: Add fetch + dispatch at the bottom of the `<script>` block**

```javascript
// Load data and render all tabs
fetch('/data.json')
  .then(r => r.json())
  .then(data => {
    renderBuild(data.build, data.meta);
    renderFluidGuide(data.fluid_guide);
    renderStrategy(data.strategy_2026);
    renderProjectTracker(data.project_tracker);
    renderPartsInventory(data.parts_inventory);
    renderSpendSummary(data.spend_summary);
    renderScheduledMaintenance(data.scheduled_maintenance);
    renderShopContacts(data.shop_contacts);
    // Re-apply active tab after render
    const hash = window.location.hash.replace('#','');
    if (hash) showTab(hash.replace(/-/g,' '));
  });
```

**Step 4: Commit**

```bash
git add tracker-site/index.html
git commit -m "feat: scaffold index.html fetch infrastructure, empty tab containers"
```

---

### Task 8: Render functions — Build tab

**Files:**
- Modify: `tracker-site/index.html`

**Step 1: Add `renderBuild(cards, meta)` function**

This must reproduce the exact same HTML structure currently in the Build tab. Reference lines 107–476 of the original for the expected output structure.

```javascript
function renderBuild(cards, meta) {
  const statusEmoji = { installed:'✅', urgent:'🔴', planned:'🔵', on_hand:'⚠️', ordered:'📦' };
  const tagClass = { 'INSTALLED':'tag-installed', 'DO FIRST':'tag-urgent', 'PLANNED':'tag-planned', 'PARTS ON HAND':'tag-onhand', 'ORDERED':'tag-ordered' };

  // Build vitals block
  let html = `
    <div class="build-page">
      <div class="build-vitals">
        <div class="build-vitals-title">🚙 Sneaky Pete — Build Sheet</div>
        <div class="vital-item"><strong>${meta.vehicle.split(' ')[0]}</strong> Toyota Land Cruiser HDJ81</div>
        <div class="vital-divider">|</div>
        <div class="vital-item"><strong>${meta.engine.split(' ')[0]}</strong> ${meta.engine.split(' ').slice(1).join(' ')}</div>
        <div class="vital-divider">|</div>
        <div class="vital-item"><strong>${meta.transmission.split(' ')[0]}</strong> ${meta.transmission.split(' ').slice(1).join(' ')}</div>
        <div class="vital-divider">|</div>
        <div class="vital-item"><strong>~${meta.odometer_km.toLocaleString()} km</strong></div>
        <div class="vital-divider">|</div>
        <div class="vital-item"><strong>${meta.color} · ${meta.tires} Tires</strong></div>
        <div class="build-power-bar">
          <div class="power-label">Torque progress: <span class="bar-marker-installed">~${meta.torque_now_nm}NM now (est.)</span> → <span class="bar-marker-target">${meta.torque_target_nm}NM target (pump tune)</span> → ${meta.torque_max_nm}NM max recommended</div>
          <div class="bar-track">
            <div class="bar-fill-installed"></div>
            <div class="bar-fill-target"></div>
          </div>
        </div>
      </div>
      <div class="build-grid">`;

  for (const card of cards) {
    html += `<div class="build-card">
      <div class="build-card-header"><span class="card-icon">${card.icon}</span> ${card.category}</div>`;
    for (const item of card.items) {
      const nameClass = item.status === 'installed' ? ' installed' : '';
      const tagsHtml = (item.tags || []).map(t =>
        `<span class="bi-tag ${tagClass[t] || 'tag-planned'}">${t}</span>`
      ).join('');
      html += `<div class="build-item">
        <div class="bi-status">${statusEmoji[item.status] || '🔵'}</div>
        <div class="bi-body">
          <div class="bi-name${nameClass}">${item.name}</div>
          <div class="bi-note">${item.note}</div>
          ${tagsHtml}
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div></div>`;
  document.getElementById('tab-Build').innerHTML = html;
}
```

**Step 2: Open the page in a browser and verify the Build tab looks identical to the original**

**Step 3: Commit**

```bash
git add tracker-site/index.html
git commit -m "feat: renderBuild function"
```

---

### Task 9: Render functions — Fluid Guide, Strategy, Shop Contacts

**Files:**
- Modify: `tracker-site/index.html`

**Step 1: Add `renderFluidGuide(rows)`**

Reproduces the table at lines 477–493. Simple `<table>` with `<thead>` and `<tbody>`.

```javascript
function renderFluidGuide(rows) {
  let html = `<table><thead>
    <tr><th colspan="7">🛢️ SNEAKY PETE — Fluid Buying Guide | What to Buy + How Much</th></tr>
    <tr><th>System</th><th>Spec / Weight</th><th>Capacity</th><th>Buy This Amount</th><th>Brand Ideas</th><th>Status</th><th>Source</th></tr>
  </thead><tbody>`;
  for (const r of rows) {
    html += `<tr><td>${r.system}</td><td>${r.spec}</td><td>${r.capacity}</td><td>${r.buy_amount}</td><td>${r.brand}</td><td>${r.status}</td><td>${r.notes}</td></tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById('tab-Fluid-Guide').innerHTML = html;
}
```

**Step 2: Add `renderStrategy(phases)`**

Reproduces lines 494–529. Phases are section-header rows, tasks are data rows with checkboxes.

```javascript
function renderStrategy(phases) {
  let html = `<table><thead>
    <tr><th colspan="8">📋 SNEAKY PETE — 2026 Strategy & Roadmap | Updated Feb 2026</th></tr>
    <tr><th style="width:36px">✓</th><th>Priority</th><th>Task</th><th>Who</th><th>Est. Cost</th><th>Est. Time</th><th>Notes / Action</th></tr>
  </thead><tbody>`;
  for (const phase of phases) {
    html += `<tr><td colspan="8" style="background:#222;color:#f0a500;font-weight:bold;padding:10px 14px;">${phase.phase}</td></tr>`;
    for (const t of phase.tasks) {
      const rowClass = t.priority === 'urgent' ? 'status-urgent' : t.priority === 'done' ? 'status-done' : t.priority === 'low' ? 'status-low' : '';
      html += `<tr class="${rowClass}">
        <td class="strat-check"><input type="checkbox" data-strat="${t.id}" ${t.checked ? 'checked' : ''}></td>
        <td>${t.priority === 'urgent' ? '🔴' : t.priority === 'done' ? '✅' : '🟡'}</td>
        <td>${t.task}</td><td>${t.who}</td><td>${t.cost_cad ? '~$'+t.cost_cad : '$0'}</td>
        <td>${t.time}</td><td>${t.notes}</td>
      </tr>`;
    }
  }
  html += `</tbody></table>`;
  document.getElementById('tab-2026-Strategy').innerHTML = html;
}
```

**Step 3: Add `renderShopContacts(contacts)`**

```javascript
function renderShopContacts(contacts) {
  let html = `<table><tbody>
    <tr><th colspan="6">🏪 SNEAKY PETE — Trusted Shop Contacts</th></tr>
    <tr><th>Shop / Person</th><th>Role</th><th>Location</th><th>Phone</th><th>Website / Notes</th><th>Speciality</th></tr>`;
  for (const c of contacts) {
    html += `<tr><td>${c.name}</td><td>${c.role}</td><td>${c.location}</td><td>${c.phone || '—'}</td><td>${c.contact || '—'}</td><td>${c.specialty}</td></tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById('tab-Shop-Contacts').innerHTML = html;
}
```

**Step 4: Commit**

```bash
git add tracker-site/index.html
git commit -m "feat: renderFluidGuide, renderStrategy, renderShopContacts"
```

---

### Task 10: Render functions — Project Tracker

**Files:**
- Modify: `tracker-site/index.html`

**Step 1: Add `renderProjectTracker(sections)`**

This is the most complex tab. It uses the existing `sortProjectTable()` and `toggleDoneRows()` JS functions which must remain. The render must produce the exact same structure (project-main rows + parts-sub rows).

```javascript
function renderProjectTracker(sections) {
  const statusClass = {
    'URGENT SERVICE': 'status-urgent',
    'NEEDS INVESTIGATION': 'status-urgent',
    'BROKEN — REPLACE': 'status-urgent',
    'NEEDS PARTS': 'status-urgent',
    'ONGOING TRACKING': 'status-urgent',
    'LEAKING — NEEDS BOOKING': 'status-warn',
    'DONE': 'status-done',
    'DEFERRED TO REBUILD': 'status-low',
    'PLANNING QUOTE': 'status-low'
  };

  let html = `
    <div style="margin-bottom:10px;">
      <button id="toggleDoneBtn" onclick="toggleDoneRows()" style="background:#333;color:#ccc;border:1px solid #555;padding:7px 16px;border-radius:4px;cursor:pointer;font-size:0.9em;">Hide ✅ Done</button>
    </div>
    <table id="projectTable">
    <colgroup>
      <col style="width:22%"><col style="width:12%"><col style="width:14%">
      <col style="width:20%"><col style="width:8%"><col style="width:6%"><col style="width:10%">
    </colgroup>
    <thead>
      <tr><th colspan="7">🛻 SNEAKY PETE — LC80 HDJ81 Project Tracker | 170,000 km | 1HD-T | Updated Feb 2026</th></tr>
      <tr><td colspan="7" style="padding:8px 14px;color:#aaa;font-size:0.85em;">🟢 CAN DO NOW &nbsp; 🟡 NEEDS PARTS &nbsp; 🔍 NEEDS INVESTIGATION &nbsp; 🔵 SHOP JOB (Pending) &nbsp; 📅 SCHEDULED 2026/27 &nbsp; ✅ DONE</td></tr>
      <tr class="sortable-header">
        <th onclick="sortProjectTable(0)">Project ⇅</th>
        <th onclick="sortProjectTable(1)">Category ⇅</th>
        <th onclick="sortProjectTable(2)">Who ⇅</th>
        <th onclick="sortProjectTable(3)">Status ⇅</th>
        <th onclick="sortProjectTable(4)">Est. CAD ⇅</th>
        <th onclick="sortProjectTable(5)">Hrs ⇅</th>
        <th onclick="sortProjectTable(6)">Priority ⇅</th>
      </tr>
    </thead>
    <tbody id="projectBody">`;

  for (const section of sections) {
    html += `<tr><td colspan="7" style="background:#222;color:#f0a500;font-weight:bold;padding:10px 14px;">${section.section}</td></tr>`;
    for (const p of section.projects) {
      const rc = statusClass[p.status] || 'status-low';
      const isDone = p.status === 'DONE' ? ' status-done' : '';
      html += `<tr class="${rc} project-main${isDone}">
        <td>${p.project}</td><td>${p.category}</td><td>${p.who}</td>
        <td>${p.status}</td><td>${p.cost_cad}</td><td>${p.hours}</td><td>${p.priority}</td>
      </tr>`;
      if (p.notes) html += `<tr class="parts-sub ${rc}"><td colspan="7">📝 <strong>Notes:</strong> ${p.notes}</td></tr>`;
      if (p.on_hand) html += `<tr class="parts-sub ${rc}"><td colspan="7">📦 <strong>On Hand:</strong> ${p.on_hand}</td></tr>`;
      if (p.still_needed) html += `<tr class="parts-sub ${rc}"><td colspan="7">🔍 <strong>Still Needed:</strong> ${p.still_needed}</td></tr>`;
    }
  }

  html += `</tbody></table>`;
  document.getElementById('tab-Project-Tracker').innerHTML = html;
}
```

**Step 2: Commit**

```bash
git add tracker-site/index.html
git commit -m "feat: renderProjectTracker"
```

---

### Task 11: Render functions — Parts Inventory, Spend Summary, Scheduled Maintenance

**Files:**
- Modify: `tracker-site/index.html`

**Step 1: Add `renderPartsInventory(parts)`**

```javascript
function renderPartsInventory(parts) {
  const statusClass = { installed: 'status-done', on_hand: '', sold: '', used: 'status-done', reference: '' };
  let html = `<table><tbody>
    <tr><th colspan="8">📦 SNEAKY PETE — Parts Inventory | Updated Feb 2026</th></tr>
    <tr><th>Part / Item</th><th>Vendor</th><th>Part Number</th><th>Price Paid</th><th>Currency</th><th>Approx. CAD</th><th>Project / Use</th><th>Status</th></tr>`;
  for (const p of parts) {
    const rc = statusClass[p.status] || '';
    const statusLabel = { installed:'✅ Installed', on_hand:'📦 On Hand', sold:'↩️ Sold', used:'✅ Used', reference:'📖 Reference' }[p.status] || p.status;
    html += `<tr class="${rc}"><td>${p.name}</td><td>${p.vendor}</td><td>${p.part_number || '—'}</td><td>${p.price_paid}</td><td>${p.currency}</td><td>${p.approx_cad}</td><td>${p.project}</td><td>${statusLabel}</td></tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById('tab-Parts-Inventory').innerHTML = html;
}
```

**Step 2: Add `renderSpendSummary(rows)`**

```javascript
function renderSpendSummary(rows) {
  let html = `<table><tbody>
    <tr><th colspan="4">💰 SNEAKY PETE — Spend Summary | All Invoices + Labour + Credits</th></tr>
    <tr><th>Date</th><th>Vendor / Invoice</th><th>Description</th><th>Amount (CAD approx.)</th></tr>`;
  for (const r of rows) {
    if (r.is_total) {
      html += `<tr class="status-warn"><td></td><td><strong>${r.vendor}</strong></td><td></td><td><strong>${r.amount_cad}</strong></td></tr>`;
    } else {
      html += `<tr><td>${r.date || ''}</td><td>${r.vendor}</td><td>${r.description}</td><td>${r.amount_cad}</td></tr>`;
    }
  }
  html += `</tbody></table>`;
  document.getElementById('tab-Spend-Summary').innerHTML = html;
}
```

**Step 3: Add `renderScheduledMaintenance(items)`**

```javascript
function renderScheduledMaintenance(items) {
  const rowClass = { ok:'status-done', upcoming:'status-planned', overdue:'status-warn', urgent:'status-urgent', deferred:'status-planned', due_soon:'status-low' };
  let html = `<table><tbody>
    <tr><th colspan="8">🔧 SNEAKY PETE — Scheduled Maintenance | 1HD-T HDJ81 | Current: 170,000 km</th></tr>
    <tr><th>Maintenance Item</th><th>Interval</th><th>Last Done (km)</th><th>Last Done (date/notes)</th><th>Next Due (km)</th><th>Km Until Due</th><th>Status</th><th>Notes</th></tr>`;
  for (const item of items) {
    const rc = rowClass[item.status] || '';
    html += `<tr class="${rc}"><td>${item.item}</td><td>${item.interval}</td><td>${item.last_done_km}</td><td>${item.last_done_notes}</td><td>${item.next_due_km}</td><td>${item.km_until_due}</td><td>${item.status_label || item.status}</td><td>${item.notes}</td></tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById('tab-Scheduled-Maintenance').innerHTML = html;
}
```

**Step 4: Commit**

```bash
git add tracker-site/index.html
git commit -m "feat: renderPartsInventory, renderSpendSummary, renderScheduledMaintenance"
```

---

### Task 12: Add URL hash routing for tab deep-links

**Files:**
- Modify: `tracker-site/index.html`

**Step 1: Read the existing `showTab()` function** (lines ~4658–end)

**Step 2: Update `showTab()` to set `window.location.hash`**

```javascript
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const id = 'tab-' + name.replace(/\s+/g, '-');
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.textContent.includes(name)) btn.classList.add('active');
  });
  // Update URL hash for deep-linking
  window.location.hash = name.replace(/\s+/g, '-').toLowerCase();
}
```

**Step 3: Add hash-on-load handler** (already partially in the fetch callback from Task 7, but also handle direct navigation)

After the `showTab` function definition:
```javascript
// Handle direct navigation to a tab via URL hash
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '').replace(/-/g, ' ');
  if (hash) showTab(hash.replace(/\b\w/g, c => c.toUpperCase()));
});
```

**Step 4: Commit**

```bash
git add tracker-site/index.html
git commit -m "feat: hash-based URL routing for tab deep-links"
```

---

### Task 13: Final verification + deploy

**Step 1: Open `tracker-site/index.html` locally in browser**

```bash
open tracker-site/index.html
```

Check each tab renders correctly. Compare visually to the original (use git stash/pop if needed to compare).

**Step 2: Verify `data.json` is valid JSON**

```bash
python3 -m json.tool tracker-site/data.json > /dev/null && echo "Valid JSON"
```

**Step 3: Deploy to Vercel**

```bash
cd tracker-site && vercel --prod
```

Or push to main and let Vercel auto-deploy:
```bash
git checkout main
git merge feature/data-layer
git push origin main
```

Wait for deploy, then verify:
- `https://lc80.vercel.app/data.json` — returns JSON
- `https://lc80.vercel.app/#build` — opens Build tab
- `https://lc80.vercel.app/#spend-summary` — opens Spend Summary tab

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: data-layer complete — data.json + dynamic rendering + hash routing"
```

---

### Task 14: Schema doc

**Files:**
- Create: `docs/schema.md`

**Step 1: Create `docs/schema.md`**

This doc is referenced by Claude during intake conversations to know which fields are required and what values are valid.

```markdown
# LC80 Data Schema

> Claude: reference this when adding entries to data.json. Ask for required fields one at a time. Never accept a status value not in the allowed list.

---

## Build

**Required:** `category` (existing card name or new), `status`, `name`
**Optional:** `note`, `tags[]`

**Allowed `status`:** `installed` | `planned` | `urgent` | `on_hand` | `ordered`

**Allowed `tags`:** `INSTALLED` | `PLANNED` | `DO FIRST` | `PARTS ON HAND` | `ORDERED`

**Existing categories:** Engine / Power · Drivetrain / Axles · Offroad Capability · Suspension · Electrical · Interior · Body / Paint · Comms

---

## Fluid Guide

**Required:** `system`, `spec`, `capacity`, `buy_amount`, `brand`, `status`
**Optional:** `notes`

**Allowed `status`:** `locked` | `tracker-based` | `pending`

---

## 2026 Strategy

**Required:** `phase`, `task`, `who`, `priority`
**Optional:** `cost_cad`, `time`, `notes`, `checked` (default: false)

**Allowed `priority`:** `urgent` | `done` | `low`

**Existing phases:**
- `PHASE 2 — SPRING 2026 | Safety + Driveability + Pre-Summer`
- `PHASE 3 — SUMMER/FALL 2026 | Cosmetic + Comfort + Rebuild Prep`
- `PHASE 4 — ENGINE REBUILD PLANNING (Late 2026 / 2027)`

---

## Project Tracker

**Required:** `project`, `category`, `who`, `status`, `priority`
**Optional:** `cost_cad`, `hours`, `notes`, `on_hand`, `still_needed`

**Allowed `status`:** `URGENT SERVICE` | `NEEDS INVESTIGATION` | `BROKEN — REPLACE` | `NEEDS PARTS` | `ONGOING TRACKING` | `LEAKING — NEEDS BOOKING` | `NEEDS BOOKING` | `PLANNING QUOTE` | `DEFERRED TO REBUILD` | `DONE`

**Allowed `priority`:** `1 🔴 TOP` | `2 🔴 High` | `3 🟡 Medium` | `4 🟢 Low`

**Existing sections:** URGENT — Action Required Now · NEEDS PARTS / BOOKING · NEEDS INVESTIGATION / PLANNING · SCHEDULED — 2026/27 · DONE

---

## Parts Inventory

**Required:** `name`, `vendor`, `status`
**Optional:** `part_number`, `price_paid`, `currency`, `approx_cad`, `project`

**Allowed `status`:** `installed` | `on_hand` | `sold` | `used` | `reference`

**Allowed `currency`:** `CAD` | `USD` | `AUD`

---

## Spend Summary

**Required:** `date`, `vendor`, `description`, `amount_cad`
**Optional:** `is_total` (default: false)

**Date format:** `YYYY-MM` or `YYYY-MM-DD` or `YYYY` for approximate dates

---

## Scheduled Maintenance

**Required:** `item`, `interval`, `last_done_km`, `status`
**Optional:** `last_done_notes`, `next_due_km`, `km_until_due`, `notes`, `status_label`

**Allowed `status`:** `ok` | `upcoming` | `overdue` | `urgent` | `deferred` | `due_soon`

---

## Shop Contacts

**Required:** `name`, `role`, `specialty`
**Optional:** `location`, `phone`, `contact`
```

**Step 2: Commit**

```bash
git add docs/schema.md
git commit -m "docs: add data schema for structured intake"
```

---

### Task 15: FastAPI local preview server

**Files:**
- Create: `server.py`
- Create: `requirements.txt`

**Step 1: Create `requirements.txt`**

```
fastapi
uvicorn[standard]
```

**Step 2: Create `server.py`**

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/", StaticFiles(directory="tracker-site", html=True), name="static")
```

**Step 3: Install and verify**

```bash
pip install -r requirements.txt
uvicorn server:app --reload
# Open http://localhost:8000 — should show the full site
# Open http://localhost:8000/data.json — should return JSON
```

**Step 4: Commit**

```bash
git add server.py requirements.txt
git commit -m "feat: FastAPI local preview server"
```
