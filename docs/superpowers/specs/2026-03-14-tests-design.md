# Test Suite Design — LC80 Data Layer

**Date:** 2026-03-14
**Branch:** feature/data-layer
**Scope:** Unit, component, and integration tests for the data layer in `tracker-site/`

---

## Goal

Verify that `data.json` is fetched, parsed, and rendered correctly into all 8 tab containers. Catch silent render failures and provide a regression suite for future data or render changes.

---

## Context

- Vanilla HTML/CSS/JS static site, no build step, no framework
- All render logic is currently inline in a single `<script>` block in `index.html`
- `tracker-site/data.json` (64KB) is fetched at runtime via `fetch('/data.json')`
- 8 render functions + 4 utility functions (all in the inline script)
- Tab buttons use `onclick="showTab('...')"` HTML attributes
- Node 20, no existing `package.json`

---

## Architecture

### Step 1: Extract to `tracker-site/render.js`

All render and utility functions are moved from the inline `<script>` to `tracker-site/render.js` as an ES module.

**Exported from `render.js`:**
- `renderBuild(cards, meta)`
- `renderFluidGuide(rows)`
- `renderStrategy(phases)`
- `renderProjectTracker(sections)`
- `renderPartsInventory(parts)`
- `renderSpendSummary(rows)`
- `renderScheduledMaintenance(items)`
- `renderShopContacts(contacts)`
- `showTab(name)`
- `sortProjectTable(colIdx)`
- `applyDoneVisibility()`
- `toggleDoneRows()`

**`window.*` assignment in `render.js` at module top-level (not async, not inside fetch callback):**
```js
// Must be top-level so onclick attributes resolve immediately on page load
window.showTab = showTab;
window.sortProjectTable = sortProjectTable;
window.toggleDoneRows = toggleDoneRows;
```

This is required because `onclick="showTab(...)"` attributes resolve bare identifiers from the global scope. ES modules do not pollute global scope by default, so the assignments must happen before any `await` to ensure buttons work before data loads.

**`index.html` init block:**
```html
<script type="module">
  import { renderBuild, renderFluidGuide, renderStrategy, renderProjectTracker,
           renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
           renderShopContacts, showTab, applyDoneVisibility } from './render.js';

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
      applyDoneVisibility();
      // hash routing
      const hash = window.location.hash.replace('#','');
      if (hash) showTab(hash.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' '));
    });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#','');
    if (hash) showTab(hash.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' '));
  });
</script>
```

---

## Test Structure

```
tests/
  render.unit.test.js        # Each render function in isolation
  render.component.test.js   # Tab switching, sorting, done-row toggling
  render.integration.test.js # Full fetch → render pipeline with real data.json
```

### DOM Reset Between Tests

All test files use `beforeEach` to reset the 8 tab containers and any relevant state:

```js
beforeEach(() => {
  document.body.innerHTML = `
    <div id="tab-Build" class="tab-content" style="display:block"></div>
    <div id="tab-Fluid-Guide" class="tab-content" style="display:none"></div>
    <div id="tab-2026-Strategy" class="tab-content" style="display:none"></div>
    <div id="tab-Project-Tracker" class="tab-content" style="display:none"></div>
    <div id="tab-Parts-Inventory" class="tab-content" style="display:none"></div>
    <div id="tab-Spend-Summary" class="tab-content" style="display:none"></div>
    <div id="tab-Scheduled-Maintenance" class="tab-content" style="display:none"></div>
    <div id="tab-Shop-Contacts" class="tab-content" style="display:none"></div>
    <button class="tab-btn active" onclick="showTab('Build')">Build</button>
    <button class="tab-btn" onclick="showTab('Fluid Guide')">Fluid Guide</button>
  `;
});
```

Jest resets jsdom between test *files* automatically. `beforeEach` handles reset within a file.

---

### Unit Tests (`render.unit.test.js`)

Each render function is called with **minimal valid fixture data** (1–2 items). Assertions check specific rendered content from the fixture — not just non-emptiness — to catch wrong field names or broken traversal.

| Function | Fixture has | Key assertions |
|----------|-------------|----------------|
| `renderBuild` | 1 card, 2 items (1 installed, 1 urgent) | `#tab-Build` contains `.build-card`; installed item name has class `installed`; urgent item has `🔴`; card icon rendered |
| `renderFluidGuide` | 2 rows | `#tab-Fluid-Guide` has `<table>`; both system names appear in DOM |
| `renderStrategy` | 1 phase, 2 tasks (1 urgent, 1 done) | Phase header row rendered; urgent row has `status-urgent`; done row has `status-done`; checkboxes have `data-strat` attr |
| `renderProjectTracker` | 1 section, 2 projects (1 with notes, 1 without) | `#projectBody` exists; project name rendered; notes sub-row appears; project without notes has no sub-row |
| `renderPartsInventory` | 2 parts (1 installed, 1 on_hand) | Row count = 2 data rows; installed shows `✅ Installed`; on_hand shows `📦 On Hand` |
| `renderSpendSummary` | 2 rows + 1 total | Total row has `status-warn` class; vendor text present; `$` rendered in amount cell |
| `renderScheduledMaintenance` | 3 items (ok, urgent, overdue) | ok → `status-done`; urgent → `status-urgent`; overdue → `status-warn`; item names rendered |
| `renderShopContacts` | 2 contacts (1 with phone, 1 without) | Both names rendered; null phone shows `—` |

---

### Component Tests (`render.component.test.js`)

Tests call functions directly (e.g., `showTab('Fluid Guide')`) rather than simulating clicks on `onclick`-attributed buttons, because jsdom evaluates inline `onclick` attributes in a restricted scope that does not reliably resolve bare global identifiers.

| Scenario | Assertion |
|----------|-----------|
| `showTab('Fluid Guide')` | `#tab-Fluid-Guide` is `display:block`; `#tab-Build` is `display:none`; `Fluid Guide` button has class `active` |
| `showTab('Build')` | `#tab-Build` is `display:block`; hash updated |
| `showTab('Nonexistent')` | No throw; no tab shown |
| `toggleDoneRows()` once | Done rows hidden (doneHidden = true by default → first call flips to false, shows done rows) |
| `toggleDoneRows()` twice | Back to hidden |
| `applyDoneVisibility()` | `#toggleDoneBtn` text and style updated per `doneHidden` state |
| `sortProjectTable(0)` | Rows reordered alphabetically by col 0 text |

---

### Integration Tests (`render.integration.test.js`)

Mocks `global.fetch` using `fs.readFileSync` to load the real `tracker-site/data.json` from the filesystem. This avoids needing a running HTTP server.

**Setup pattern:**
```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const realData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../tracker-site/data.json'), 'utf8')
);

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve(realData)
  });
});
```

**Assertions (specific values from real `data.json`, not just non-empty):**

| Tab | Specific assertion |
|-----|---------------------|
| `#tab-Build` | Contains text `"UFI 18G Turbo"` (first build item name) |
| `#tab-Fluid-Guide` | Contains text `"Engine Oil (1HD-T)"` (first fluid row) |
| `#tab-2026-Strategy` | Contains `data-strat="strat-rear-diff"` attribute |
| `#tab-Project-Tracker` | Contains `id="projectBody"` and text `"Rear Differential Fluid Service"` |
| `#tab-Parts-Inventory` | Contains text `"PDI Intercooler Kit"` |
| `#tab-Spend-Summary` | Contains text `"INITIAL PURCHASE"` |
| `#tab-Scheduled-Maintenance` | Contains text `"Engine Oil + Filter"` |
| `#tab-Shop-Contacts` | Contains text `"Liam Schram"` |

Also asserts: `data.json` has all 8 expected keys, each array has `length > 0`.

---

## Tooling

**`package.json`** (no `"type": "module"` — Babel handles ESM→CJS transform for Jest):
```json
{
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29",
    "jest-environment-jsdom": "^29",
    "@jest/globals": "^29",
    "babel-jest": "^29",
    "@babel/preset-env": "^7"
  }
}
```

**`babel.config.json`:**
```json
{
  "presets": [["@babel/preset-env", { "targets": { "node": "current" } }]]
}
```

Babel transforms `import`/`export` in both `render.js` and test files to CJS at test-time. This is the standard Jest approach for testing ES module source without `--experimental-vm-modules`. The browser still loads `render.js` as a native ES module via `<script type="module">` — Babel only runs during `npm test`.

**`jest.config.js`:**
```js
export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.json' }]
  }
};
```

No `extensionsToTreatAsEsm`, no `--experimental-vm-modules`. Babel handles the transform.

> **Note:** `jest.config.js` uses `export default` syntax — Babel will transform it just like any other `.js` file. This is consistent with the rest of the project.

---

## What This Does NOT Cover

- Visual/pixel correctness
- Vercel deployment
- FastAPI server behaviour
- `localStorage` persistence of strategy checkboxes (deferred)
- The `file://` runtime limitation (needs server; not a code bug)

---

## Success Criteria

- `npm test` passes with all tests green
- Integration test confirms all 8 tab containers populate from real `data.json` with known content values
- Unit tests assert on specific fixture values
- Component tests call functions directly (no onclick simulation)
- No test requires a running HTTP server
