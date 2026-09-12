import {
  renderBuild, renderFluidGuide, renderStrategy,
  renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
  renderShopContacts, _resetStateForTest
} from '../tracker-site/render.js';

const FULL_DOM = `
  <div id="tab-Build" class="tab-content" style="display:block"></div>
  <div id="tab-Fluid-Guide" class="tab-content" style="display:none"></div>
  <div id="tab-2026-Strategy" class="tab-content" style="display:none"></div>
  <div id="tab-Parts-Inventory" class="tab-content" style="display:none"></div>
  <div id="tab-Spend-Summary" class="tab-content" style="display:none"></div>
  <div id="tab-Scheduled-Maintenance" class="tab-content" style="display:none"></div>
  <div id="tab-Shop-Contacts" class="tab-content" style="display:none"></div>
`;

beforeEach(() => {
  document.body.innerHTML = FULL_DOM;
  _resetStateForTest();
});

// ─── renderBuild ─────────────────────────────────────────────────────────────

describe('renderBuild', () => {
  const meta = {
    engine: '1HD-T 4.2L', transmission: 'Manual H151F', odometer_km: 170000,
    color: 'White', tires: 'BFG 285/75R16',
    torque_now_nm: 300, torque_target_nm: 380, torque_max_nm: 450
  };
  const cards = [{
    icon: '🔧',
    category: 'Engine / Power',
    items: [
      { status: 'installed', name: 'UFI 18G Turbo', note: 'Stock replacement', tags: ['INSTALLED'] },
      { status: 'urgent', name: 'Turbo cooldown timer', note: 'Run-on timer needed', tags: ['DO FIRST'] }
    ]
  }];

  test('renders .build-card in #tab-Build', () => {
    renderBuild(cards, meta);
    expect(document.getElementById('tab-Build').querySelector('.build-card')).not.toBeNull();
  });

  test('installed item name gets .installed class', () => {
    renderBuild(cards, meta);
    const el = document.querySelector('.bi-name.installed');
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('UFI 18G Turbo');
  });

  test('urgent item renders 🔴 emoji', () => {
    renderBuild(cards, meta);
    expect(document.getElementById('tab-Build').innerHTML).toContain('🔴');
  });

  test('card icon is rendered', () => {
    renderBuild(cards, meta);
    expect(document.getElementById('tab-Build').innerHTML).toContain('🔧');
  });
});

// ─── renderFluidGuide ────────────────────────────────────────────────────────

describe('renderFluidGuide', () => {
  const rows = [
    { system: 'Engine Oil (1HD-T)', spec: '15W-40', capacity: '9L', buy_amount: '10L', brand: 'Rotella T4', status: 'locked' },
    { system: 'Front Differential', spec: '80W-90 GL-5', capacity: '2.5L', buy_amount: '3L', brand: 'Penrite', status: 'locked' }
  ];

  test('renders a <table>', () => {
    renderFluidGuide(rows);
    expect(document.getElementById('tab-Fluid-Guide').querySelector('table')).not.toBeNull();
  });

  test('both system names appear in DOM', () => {
    renderFluidGuide(rows);
    const html = document.getElementById('tab-Fluid-Guide').innerHTML;
    expect(html).toContain('Engine Oil (1HD-T)');
    expect(html).toContain('Front Differential');
  });
});

// ─── renderStrategy ──────────────────────────────────────────────────────────

describe('renderStrategy', () => {
  const phases = [{
    phase: 'PHASE 2 — SPRING 2026',
    tasks: [
      { id: 'strat-rear-diff', priority: 'urgent', task: 'Rear Diff Fluid Service', who: 'Me', checked: false },
      { id: 'strat-oil-change', priority: 'done', task: 'Engine Oil Change', who: 'Me', checked: true }
    ]
  }];

  test('phase header row is rendered', () => {
    renderStrategy(phases);
    expect(document.getElementById('tab-2026-Strategy').innerHTML).toContain('PHASE 2 — SPRING 2026');
  });

  test('urgent row gets status-urgent class', () => {
    renderStrategy(phases);
    expect(document.querySelector('#tab-2026-Strategy .task-card.status-urgent')).not.toBeNull();
  });

  test('done row gets status-done class', () => {
    renderStrategy(phases);
    expect(document.querySelector('#tab-2026-Strategy .task-card.status-done')).not.toBeNull();
  });

  test('checkboxes have data-strat attribute', () => {
    renderStrategy(phases);
    const cb = document.querySelector('[data-strat="strat-rear-diff"]');
    expect(cb).not.toBeNull();
  });
});

// ─── renderStrategy (card layout + merged tracker fields) ───────────────────

describe('renderStrategy cards', () => {
  const phases = [
    {
      phase: 'PHASE 2 — SPRING 2026',
      tasks: [
        { id: 'strat-oil', priority: 'done', task: 'Oil Change', who: 'Me', status: 'DONE', checked: true, still_needed: 'Nothing' },
        { id: 'strat-tyres', priority: 'low', task: 'Tyre Rotation', who: 'Shop', status: 'SHOP JOB (Pending)', checked: false },
        {
          id: 'strat-brakes', priority: 'urgent', task: 'Brake Inspection', category: 'Brakes / Safety',
          who: 'Me', status: 'URGENT SERVICE', cost_cad: 200, time: '2 hrs', checked: false,
          notes: 'Warning light on', on_hand: 'DOT3 fluid', still_needed: 'Pads if worn'
        }
      ]
    },
    { phase: 'PHASE 1 — DONE ONLY', tasks: [{ id: 'strat-old', priority: 'done', task: 'Old Job', who: 'Me', checked: true }] }
  ];

  beforeEach(() => renderStrategy(phases));

  test('#strategyBody and #toggleDoneBtn exist after render', () => {
    expect(document.getElementById('strategyBody')).not.toBeNull();
    expect(document.getElementById('toggleDoneBtn')).not.toBeNull();
  });

  test('summary counts open, urgent, and done tasks', () => {
    const txt = document.querySelector('.strat-summary').textContent;
    expect(txt).toContain('2 open');
    expect(txt).toContain('1 urgent');
    expect(txt).toContain('2 done');
  });

  test('tasks within a phase are ordered urgent → later → done', () => {
    const titles = [...document.querySelectorAll('#strategyBody .phase:first-child .task-title')].map(el => el.textContent);
    expect(titles).toEqual(['Brake Inspection', 'Tyre Rotation', 'Oil Change']);
  });

  test('status renders as a chip, who/category/cost/time in the meta line', () => {
    const card = document.querySelector('.task-card[data-task="strat-brakes"]');
    expect(card.querySelector('.chip-status').textContent).toBe('URGENT SERVICE');
    const meta = card.querySelector('.task-meta').textContent;
    expect(meta).toContain('Me');
    expect(meta).toContain('Brakes / Safety');
    expect(meta).toContain('~$200');
    expect(meta).toContain('2 hrs');
  });

  test('notes, on-hand, and still-needed render inside the card', () => {
    const card = document.querySelector('.task-card[data-task="strat-brakes"]');
    expect(card.querySelector('.task-notes').textContent).toContain('Warning light on');
    expect(card.querySelector('.fact-onhand').textContent).toContain('On Hand:');
    expect(card.querySelector('.fact-onhand').textContent).toContain('DOT3 fluid');
    expect(card.querySelector('.fact-need').textContent).toContain('Still Needed:');
    expect(card.querySelector('.fact-need').textContent).toContain('Pads if worn');
  });

  test('card without notes/facts/status renders none of those elements', () => {
    const card = document.querySelector('.task-card[data-task="strat-old"]');
    expect(card.querySelector('.task-notes')).toBeNull();
    expect(card.querySelector('.task-facts')).toBeNull();
    expect(card.querySelector('.chip-status')).toBeNull();
  });

  test('still-needed list at the top covers open tasks only', () => {
    const items = [...document.querySelectorAll('.strat-needs li')].map(li => li.textContent);
    expect(items.length).toBe(1);
    expect(items[0]).toContain('Brake Inspection');
    expect(items[0]).toContain('Pads if worn');
    expect(document.querySelector('.strat-needs').textContent).not.toContain('Nothing');
  });

  test('no still-needed list when nothing is needed', () => {
    renderStrategy([{ phase: 'P', tasks: [{ id: 'a', priority: 'low', task: 'A', who: 'Me', checked: false }] }]);
    expect(document.querySelector('.strat-needs')).toBeNull();
  });

  test('shop jobs get the planned colour, done cards the done colour', () => {
    expect(document.querySelector('.task-card[data-task="strat-tyres"]').classList.contains('status-planned')).toBe(true);
    expect(document.querySelector('.task-card[data-task="strat-oil"]').classList.contains('status-done')).toBe(true);
  });

  test('done cards are hidden by default and a phase with only done tasks is hidden too', () => {
    expect(document.querySelector('.task-card[data-task="strat-oil"]').style.display).toBe('none');
    expect(document.querySelector('.task-card[data-task="strat-brakes"]').style.display).toBe('');
    const phases = document.querySelectorAll('#strategyBody .phase');
    expect(phases[0].style.display).toBe('');
    expect(phases[1].style.display).toBe('none');
    expect(phases[1].querySelector('.phase-count').textContent).toBe('all done');
  });
});

// ─── renderPartsInventory ────────────────────────────────────────────────────

describe('renderPartsInventory', () => {
  const parts = [
    { name: 'PDI Intercooler Kit', vendor: 'PDI', status: 'installed', approx_cad: 1200 },
    { name: 'Diff Fluid', vendor: 'Penrite', status: 'on_hand', approx_cad: 40 }
  ];

  test('renders 2 data rows', () => {
    renderPartsInventory(parts);
    expect(document.getElementById('tab-Parts-Inventory').innerHTML).toContain('PDI Intercooler Kit');
    expect(document.getElementById('tab-Parts-Inventory').innerHTML).toContain('Diff Fluid');
  });

  test('installed status shows ✅ Installed', () => {
    renderPartsInventory(parts);
    expect(document.getElementById('tab-Parts-Inventory').innerHTML).toContain('✅ Installed');
  });

  test('on_hand status shows 📦 On Hand', () => {
    renderPartsInventory(parts);
    expect(document.getElementById('tab-Parts-Inventory').innerHTML).toContain('📦 On Hand');
  });

  test('on_hand rows render before the collapsed installed section', () => {
    renderPartsInventory(parts);
    const html = document.getElementById('tab-Parts-Inventory').innerHTML;
    expect(html.indexOf('Diff Fluid')).toBeLessThan(html.indexOf('<details'));
    expect(html.indexOf('PDI Intercooler Kit')).toBeGreaterThan(html.indexOf('<details'));
  });

  test('installed section is a collapsed <details> with a count in its summary', () => {
    renderPartsInventory(parts);
    const details = document.querySelector('#tab-Parts-Inventory details');
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    expect(details.querySelector('summary').textContent).toContain('(1)');
  });

  test('used parts are grouped with installed and labelled ✅ Installed', () => {
    renderPartsInventory([
      { name: 'Old Filter', vendor: 'Toyota', status: 'used' },
      { name: 'Spare Belt', vendor: 'Toyota', status: 'on_hand' }
    ]);
    const details = document.querySelector('#tab-Parts-Inventory details');
    expect(details.innerHTML).toContain('Old Filter');
    expect(details.innerHTML).toContain('✅ Installed');
    expect(details.innerHTML).not.toContain('Used');
    expect(details.querySelector('summary').textContent).toContain('(1)');
  });

  test('no <details> rendered when nothing is installed', () => {
    renderPartsInventory([{ name: 'Spare Belt', vendor: 'Toyota', status: 'on_hand' }]);
    expect(document.querySelector('#tab-Parts-Inventory details')).toBeNull();
  });
});

// ─── renderSpendSummary ──────────────────────────────────────────────────────

describe('renderSpendSummary', () => {
  const rows = [
    { date: '2023-01', vendor: 'Private Seller', description: 'INITIAL PURCHASE', amount_cad: 8500 },
    { is_total: true, vendor: 'TOTAL SPENT', amount_cad: 8500 }
  ];

  test('vendor and description text are rendered', () => {
    renderSpendSummary(rows);
    const html = document.getElementById('tab-Spend-Summary').innerHTML;
    expect(html).toContain('Private Seller');
    expect(html).toContain('INITIAL PURCHASE');
  });

  test('total row has status-warn class', () => {
    renderSpendSummary(rows);
    expect(document.querySelector('#tab-Spend-Summary tr.status-warn')).not.toBeNull();
  });

  test('$ appears in amount cell', () => {
    renderSpendSummary(rows);
    expect(document.getElementById('tab-Spend-Summary').innerHTML).toContain('$');
  });
});

// ─── renderScheduledMaintenance ──────────────────────────────────────────────

describe('renderScheduledMaintenance', () => {
  const items = [
    { item: 'Engine Oil + Filter', interval: '5,000 km', last_done_km: 165000, km_until_due: 5000, status: 'ok' },
    { item: 'Fuel Filter', interval: '20,000 km', last_done_km: 150000, km_until_due: 0, status: 'urgent' },
    { item: 'Coolant Flush', interval: '40,000 km', last_done_km: 130000, km_until_due: -10000, status: 'overdue' }
  ];

  test('item names are rendered', () => {
    renderScheduledMaintenance(items);
    const html = document.getElementById('tab-Scheduled-Maintenance').innerHTML;
    expect(html).toContain('Engine Oil + Filter');
    expect(html).toContain('Fuel Filter');
    expect(html).toContain('Coolant Flush');
  });

  test('ok status → status-done row', () => {
    renderScheduledMaintenance(items);
    expect(document.querySelector('#tab-Scheduled-Maintenance tr.status-done')).not.toBeNull();
  });

  test('urgent status → status-urgent row', () => {
    renderScheduledMaintenance(items);
    expect(document.querySelector('#tab-Scheduled-Maintenance tr.status-urgent')).not.toBeNull();
  });

  test('overdue status → status-warn row', () => {
    renderScheduledMaintenance(items);
    expect(document.querySelector('#tab-Scheduled-Maintenance tr.status-warn')).not.toBeNull();
  });
});

// ─── renderShopContacts ──────────────────────────────────────────────────────

describe('renderShopContacts', () => {
  const contacts = [
    { name: 'Liam Schram', role: 'Diesel specialist', specialty: '1HD-T rebuild', location: 'Calgary', phone: '403-555-0001' },
    { name: 'Generic Tyre Shop', role: 'Tyre service', specialty: 'Tyres' }
  ];

  test('both contact names are rendered', () => {
    renderShopContacts(contacts);
    const html = document.getElementById('tab-Shop-Contacts').innerHTML;
    expect(html).toContain('Liam Schram');
    expect(html).toContain('Generic Tyre Shop');
  });

  test('contact without phone shows — (em dash)', () => {
    renderShopContacts(contacts);
    expect(document.getElementById('tab-Shop-Contacts').innerHTML).toContain('—');
  });
});
