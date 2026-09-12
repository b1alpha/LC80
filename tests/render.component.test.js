import {
  showTab, renderStrategy
} from '../tracker-site/render.js';

const TAB_DOM = `
  <div id="tab-Build" class="tab-content" style="display:block"></div>
  <div id="tab-Fluid-Guide" class="tab-content" style="display:none"></div>
  <div id="tab-2026-Strategy" class="tab-content" style="display:none"></div>
  <div id="tab-Parts-Inventory" class="tab-content" style="display:none"></div>
  <div id="tab-Spend-Summary" class="tab-content" style="display:none"></div>
  <div id="tab-Scheduled-Maintenance" class="tab-content" style="display:none"></div>
  <div id="tab-Shop-Contacts" class="tab-content" style="display:none"></div>
  <button class="tab-btn active">Build</button>
  <button class="tab-btn">Fluid Guide</button>
`;

beforeEach(() => {
  document.body.innerHTML = TAB_DOM;
});

// ─── showTab ─────────────────────────────────────────────────────────────────

describe('showTab', () => {
  test('shows target tab, hides others', () => {
    showTab('Fluid Guide');
    expect(document.getElementById('tab-Fluid-Guide').style.display).toBe('block');
    expect(document.getElementById('tab-Build').style.display).toBe('none');
  });

  test('sets active class on matching button', () => {
    showTab('Fluid Guide');
    const buttons = Array.from(document.querySelectorAll('.tab-btn'));
    const fluidBtn = buttons.find(b => b.textContent === 'Fluid Guide');
    const buildBtn = buttons.find(b => b.textContent === 'Build');
    expect(fluidBtn.classList.contains('active')).toBe(true);
    expect(buildBtn.classList.contains('active')).toBe(false);
  });

  test('does not throw for nonexistent tab name', () => {
    expect(() => showTab('Nonexistent Tab')).not.toThrow();
  });
});

// ─── done list ───────────────────────────────────────────────────────────────

describe('done list', () => {
  test('done tasks render below the board, visible, with no toggle button', () => {
    renderStrategy([{
      phase: 'PHASE 1',
      tasks: [{ id: 'strat-oil', priority: 'done', task: 'Oil Change', who: 'Me', status: 'DONE', checked: true, notes: 'Fresh oil' }]
    }]);
    const done = document.querySelector('#strategyBody .strat-done');
    expect(done).not.toBeNull();
    expect(done.querySelector('.task-row.status-done .bi-name').textContent).toBe('Oil Change');
    expect(document.getElementById('toggleDoneBtn')).toBeNull();
    expect(document.querySelector('#strategyBody input[type="checkbox"]')).toBeNull();
  });
});
