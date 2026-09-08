import {
  showTab, toggleDoneRows, applyDoneVisibility, sortProjectTable,
  renderProjectTracker, _resetStateForTest
} from '../tracker-site/render.js';

const TAB_DOM = `
  <div id="tab-Build" class="tab-content" style="display:block"></div>
  <div id="tab-Fluid-Guide" class="tab-content" style="display:none"></div>
  <div id="tab-2026-Strategy" class="tab-content" style="display:none"></div>
  <div id="tab-Project-Tracker" class="tab-content" style="display:none"></div>
  <div id="tab-Parts-Inventory" class="tab-content" style="display:none"></div>
  <div id="tab-Spend-Summary" class="tab-content" style="display:none"></div>
  <div id="tab-Scheduled-Maintenance" class="tab-content" style="display:none"></div>
  <div id="tab-Shop-Contacts" class="tab-content" style="display:none"></div>
  <button class="tab-btn active">Build</button>
  <button class="tab-btn">Fluid Guide</button>
`;

beforeEach(() => {
  document.body.innerHTML = TAB_DOM;
  _resetStateForTest();
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

// ─── toggleDoneRows / applyDoneVisibility ────────────────────────────────────

describe('toggleDoneRows', () => {
  beforeEach(() => {
    // Render project tracker so #projectBody and #toggleDoneBtn exist
    document.body.innerHTML += `
      <div id="tab-Project-Tracker" class="tab-content" style="display:none"></div>
    `;
    renderProjectTracker([{
      section: 'DONE',
      projects: [{ project: 'Oil Change', category: 'Engine', who: 'Me', status: 'DONE', priority: '—' }]
    }]);
  });

  test('first call flips doneHidden to false — done rows become visible', () => {
    // Initial state: doneHidden = true (done rows hidden)
    const btn = document.getElementById('toggleDoneBtn');
    expect(btn.textContent).toBe('Show ✅ Done');

    toggleDoneRows();

    expect(btn.textContent).toBe('Hide ✅ Done');
  });

  test('second call flips doneHidden back to true', () => {
    toggleDoneRows(); // → false
    toggleDoneRows(); // → true

    const btn = document.getElementById('toggleDoneBtn');
    expect(btn.textContent).toBe('Show ✅ Done');
  });
});

describe('applyDoneVisibility', () => {
  beforeEach(() => {
    renderProjectTracker([{
      section: 'DONE',
      projects: [{ project: 'Oil Change', category: 'Engine', who: 'Me', status: 'DONE', priority: '—' }]
    }]);
  });

  test('updates #toggleDoneBtn text and style based on doneHidden state', () => {
    applyDoneVisibility();
    const btn = document.getElementById('toggleDoneBtn');
    expect(btn.textContent).toBe('Show ✅ Done');
    expect(btn.style.background).toBe('rgb(240, 165, 0)'); // #f0a500
  });
});

// ─── sortProjectTable ────────────────────────────────────────────────────────

describe('sortProjectTable', () => {
  beforeEach(() => {
    renderProjectTracker([{
      section: 'TEST',
      projects: [
        { project: 'Zebra Job', category: 'Engine', who: 'Me', status: 'DONE', priority: '—' },
        { project: 'Alpha Job', category: 'Engine', who: 'Me', status: 'DONE', priority: '—' }
      ]
    }]);
  });

  test('sorts rows alphabetically by col 0 asc', () => {
    sortProjectTable(0);
    const rows = document.querySelectorAll('#projectBody tr.project-main');
    expect(rows[0].cells[0].textContent).toBe('Alpha Job');
    expect(rows[1].cells[0].textContent).toBe('Zebra Job');
  });

  test('second call on same col reverses to desc', () => {
    sortProjectTable(0);
    sortProjectTable(0);
    const rows = document.querySelectorAll('#projectBody tr.project-main');
    expect(rows[0].cells[0].textContent).toBe('Zebra Job');
    expect(rows[1].cells[0].textContent).toBe('Alpha Job');
  });
});
