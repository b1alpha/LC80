# Test Suite Design — LC80 Data Layer

**Date:** 2026-03-14
**Branch:** feature/data-layer
**Scope:** Unit, component, and integration tests for the data layer implemented in `tracker-site/`

---

## Goal

Verify that `data.json` is fetched, parsed, and rendered correctly into all 8 tab containers. Catch silent render failures and provide a regression suite for future data or render changes.

---

## Context

The data layer was recently rewritten:
- All tab data lives in `tracker-site/data.json` (64KB, 8 keys)
- `tracker-site/index.html` fetches `/data.json` on load and calls 8 render functions
- All render functions are currently inline in a single `<script>` block in `index.html`
- No build step, no framework, no existing tests
- Node 20 and pytest available

---

## Architecture

### Refactor: Extract to `tracker-site/render.js`

All render functions and utility functions are extracted from the inline `<script>` in `index.html` to `tracker-site/render.js` as an ES module.

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

**`index.html` becomes:**
```html
<script type="module">
  import { renderBuild, renderFluidGuide, renderStrategy, renderProjectTracker,
           renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
           renderShopContacts, showTab, applyDoneVisibility } from './render.js';

  fetch('/data.json')
    .then(r => r.json())
    .then(data => {
      renderBuild(data.build, data.meta);
      // ... all 8 renders
      applyDoneVisibility();
      // hash routing
    });
</script>
```

The tab-switching buttons in the HTML call `showTab()` via `onclick`, so `showTab` must also be exposed on `window`:
```js
window.showTab = showTab;
window.sortProjectTable = sortProjectTable;
window.toggleDoneRows = toggleDoneRows;
```

---

## Test Structure

```
tests/
  render.unit.test.js        # Each render function in isolation
  render.component.test.js   # Tab switching, sorting, done-row toggling
  render.integration.test.js # Full fetch → render pipeline with real data.json
```

### Unit Tests (`render.unit.test.js`)

Each render function is called with **minimal valid fixture data** (1–2 items). Assertions check:

| Render function | Key assertions |
|----------------|----------------|
| `renderBuild` | `#tab-Build` has `.build-card`, items have `.bi-name`, installed items have class `installed`, urgent items show `🔴` emoji |
| `renderFluidGuide` | `#tab-Fluid-Guide` has `<table>`, correct number of `<tr>` in tbody |
| `renderStrategy` | `#tab-2026-Strategy` has checkboxes with `data-strat` attrs, phase header rows, urgent rows have `status-urgent` class |
| `renderProjectTracker` | `#tab-Project-Tracker` has `#projectBody`, project-main rows, parts-sub rows for notes/on_hand/still_needed |
| `renderPartsInventory` | `#tab-Parts-Inventory` has correct row count, status labels rendered |
| `renderSpendSummary` | Total rows get `status-warn` class, non-total rows render date/vendor/description |
| `renderScheduledMaintenance` | Urgent items get `status-urgent` class, ok items get `status-done` |
| `renderShopContacts` | `#tab-Shop-Contacts` has correct row count, null phone renders as `—` |

### Component Tests (`render.component.test.js`)

Tests DOM interactions using jsdom:

| Scenario | Assertion |
|----------|-----------|
| `showTab('Fluid Guide')` | `#tab-Fluid-Guide` becomes `display:block`, `#tab-Build` becomes `display:none`, active tab button gets `active` class, `location.hash` is set |
| `showTab` with unknown name | No crash, no tab shown |
| `toggleDoneRows()` twice | Done rows hidden after first call, visible after second |
| `sortProjectTable(0)` | Rows reordered alphabetically by project name |
| `applyDoneVisibility()` | Toggle button text updates, done rows hide/show |

### Integration Tests (`render.integration.test.js`)

Mocks `fetch` to return the real `tracker-site/data.json` content. After the fetch resolves:

| Tab container | Assertion |
|---------------|-----------|
| `#tab-Build` | `innerHTML` is not empty, contains at least one `.build-card` |
| `#tab-Fluid-Guide` | `innerHTML` contains `<table>` |
| `#tab-2026-Strategy` | `innerHTML` contains `<input type="checkbox">` |
| `#tab-Project-Tracker` | `innerHTML` contains `#projectBody` |
| `#tab-Parts-Inventory` | `innerHTML` contains at least one `<tr>` |
| `#tab-Spend-Summary` | `innerHTML` contains `<table>` |
| `#tab-Scheduled-Maintenance` | `innerHTML` contains at least one `<tr>` |
| `#tab-Shop-Contacts` | `innerHTML` contains `<table>` |

Also asserts that all 8 keys are present in `data.json` and that each array has length > 0.

---

## Tooling

**`package.json`:**
```json
{
  "type": "module",
  "scripts": { "test": "node --experimental-vm-modules node_modules/.bin/jest" },
  "devDependencies": {
    "jest": "^29",
    "jest-environment-jsdom": "^29"
  }
}
```

**`jest.config.js`:**
```js
export default {
  testEnvironment: 'jsdom',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  testMatch: ['**/tests/**/*.test.js']
};
```

---

## What This Does NOT Cover

- Visual/pixel correctness (no screenshots)
- Vercel deployment
- FastAPI server behaviour
- The `localStorage` persistence of strategy checkboxes (deferred — needs browser storage mock)

---

## Success Criteria

- `npm test` passes with all tests green
- Integration test confirms all 8 tab containers populate from real `data.json`
- No test requires a running server
