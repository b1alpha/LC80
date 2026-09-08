import {
  renderBuild, renderFluidGuide, renderStrategy, renderProjectTracker,
  renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
  renderShopContacts, _resetStateForTest
} from '../tracker-site/render.js';

const FULL_DOM = `
  <div id="tab-Build" class="tab-content" style="display:block"></div>
  <div id="tab-Fluid-Guide" class="tab-content" style="display:none"></div>
  <div id="tab-2026-Strategy" class="tab-content" style="display:none"></div>
  <div id="tab-Project-Tracker" class="tab-content" style="display:none"></div>
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
    expect(document.querySelector('#tab-2026-Strategy tr.status-urgent')).not.toBeNull();
  });

  test('done row gets status-done class', () => {
    renderStrategy(phases);
    expect(document.querySelector('#tab-2026-Strategy tr.status-done')).not.toBeNull();
  });

  test('checkboxes have data-strat attribute', () => {
    renderStrategy(phases);
    const cb = document.querySelector('[data-strat="strat-rear-diff"]');
    expect(cb).not.toBeNull();
  });
});

// ─── renderProjectTracker ────────────────────────────────────────────────────

describe('renderProjectTracker', () => {
  const sections = [{
    section: 'URGENT — Action Required Now',
    projects: [
      {
        project: 'Rear Differential Fluid Service', category: 'Drivetrain',
        who: 'Me', status: 'URGENT SERVICE', priority: '1 🔴 TOP',
        notes: 'Overdue fluid change'
      },
      {
        project: 'Tyre Rotation', category: 'Tyres',
        who: 'Shop', status: 'NEEDS BOOKING', priority: '3 🟡 Medium'
      }
    ]
  }];

  test('#projectBody exists after render', () => {
    renderProjectTracker(sections);
    expect(document.getElementById('projectBody')).not.toBeNull();
  });

  test('project name is rendered', () => {
    renderProjectTracker(sections);
    expect(document.getElementById('tab-Project-Tracker').innerHTML).toContain('Rear Differential Fluid Service');
  });

  test('notes sub-row appears for project with notes', () => {
    renderProjectTracker(sections);
    expect(document.getElementById('tab-Project-Tracker').innerHTML).toContain('Overdue fluid change');
  });

  test('no notes sub-row for project without notes', () => {
    renderProjectTracker(sections);
    const subRows = document.querySelectorAll('#projectBody tr.parts-sub');
    expect(subRows.length).toBe(1); // only one project has notes
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
