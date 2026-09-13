import {
  renderBuild, renderFluidGuide, renderStrategy,
  renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
  renderMaintenanceLog, renderShopContacts, bindTaskCheckboxes
} from '../tracker-site/render.js';

const FULL_DOM = `
  <div id="tab-Build" class="tab-content" style="display:block"></div>
  <div id="tab-Fluid-Guide" class="tab-content" style="display:none"></div>
  <div id="tab-2026-Strategy" class="tab-content" style="display:none"></div>
  <div id="tab-Parts-Inventory" class="tab-content" style="display:none"></div>
  <div id="tab-Spend-Summary" class="tab-content" style="display:none"></div>
  <div id="tab-Scheduled-Maintenance" class="tab-content" style="display:none"></div>
  <div id="tab-Maintenance-Log" class="tab-content" style="display:none"></div>
  <div id="tab-Shop-Contacts" class="tab-content" style="display:none"></div>
`;

beforeEach(() => {
  document.body.innerHTML = FULL_DOM;
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
      { name: 'UFI 18G Turbo', note: 'Upgraded from factory CT26' },
      { name: 'PDI Intercooler' }
    ]
  }];

  test('renders .build-card in #tab-Build with item count', () => {
    renderBuild(cards, meta);
    const card = document.getElementById('tab-Build').querySelector('.build-card');
    expect(card).not.toBeNull();
    expect(card.querySelector('.card-count').textContent).toBe('2');
  });

  test('items render name and note, with no status icon or tags', () => {
    renderBuild(cards, meta);
    const items = document.querySelectorAll('#tab-Build .build-item');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.bi-name').textContent).toBe('UFI 18G Turbo');
    expect(items[0].querySelector('.bi-note').textContent).toBe('Upgraded from factory CT26');
    expect(items[1].querySelector('.bi-note')).toBeNull();
    expect(document.querySelector('#tab-Build .bi-status')).toBeNull();
    expect(document.querySelector('#tab-Build .bi-tag')).toBeNull();
  });

  test('card icon is rendered', () => {
    renderBuild(cards, meta);
    expect(document.getElementById('tab-Build').innerHTML).toContain('🔧');
  });

  test('the section with the most items renders last with .build-card-main', () => {
    renderBuild([
      { icon: '🔧', category: 'Small', items: [{ name: 'A' }] },
      { icon: '💡', category: 'Big', items: [{ name: 'B' }, { name: 'C' }, { name: 'D' }] },
      { icon: '🔩', category: 'Mid', items: [{ name: 'E' }, { name: 'F' }] }
    ], meta);
    const cards = [...document.querySelectorAll('#tab-Build .build-card')];
    expect(cards.map(c => c.querySelector('.build-card-header').textContent.trim().replace(/\d+$/, '').trim())).toEqual(['🔧 Small', '🔩 Mid', '💡 Big']);
    expect(cards[2].classList.contains('build-card-main')).toBe(true);
    expect(cards[0].classList.contains('build-card-main')).toBe(false);
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
    expect(document.querySelector('#tab-2026-Strategy .task-row.status-urgent')).not.toBeNull();
  });

  test('done row gets status-done class', () => {
    renderStrategy(phases);
    expect(document.querySelector('#tab-2026-Strategy .task-row.status-done')).not.toBeNull();
  });

  test('cards carry the task id as data-task', () => {
    renderStrategy(phases);
    expect(document.querySelector('.task-row[data-task="strat-rear-diff"]')).not.toBeNull();
  });
});

// ─── renderStrategy (status board) ──────────────────────────────────────────

describe('renderStrategy board', () => {
  const phases = [
    {
      phase: 'PHASE 2 — SPRING 2026',
      tasks: [
        { id: 'strat-oil', priority: 'done', task: 'Oil Change', who: 'Me', status: 'DONE', checked: true, still_needed: 'Nothing' },
        { id: 'strat-tyres', priority: 'low', task: 'Tyre Rotation', who: 'Shop', status: 'SHOP JOB (Pending)', checked: false },
        { id: 'strat-sway', priority: 'low', task: 'Sway Bar Off', who: 'Me', status: 'CAN DO NOW', checked: false, on_hand: 'Jack' },
        { id: 'strat-bulbs', priority: 'low', task: 'Bulbs', who: 'Me', status: 'NEEDS PARTS', checked: false, still_needed: 'New bulbs' },
        {
          id: 'strat-brakes', priority: 'urgent', task: 'Brake Inspection', category: 'Brakes / Safety',
          who: 'Me', status: 'URGENT SERVICE', cost_cad: 200, time: '2 hrs', checked: false,
          notes: 'Warning light on', on_hand: 'DOT3 fluid', still_needed: 'Pads if worn'
        }
      ]
    },
    { phase: 'PHASE 4 — REBUILD', tasks: [
      { id: 'strat-valve', priority: 'low', task: 'Valve Check', who: 'Eli', status: 'DEFERRED TO REBUILD', checked: false },
      { id: 'strat-mystery', priority: 'low', task: 'No Status Task', who: 'Me', checked: false }
    ] }
  ];

  beforeEach(() => renderStrategy(phases));

  const colTitles = () => [...document.querySelectorAll('.board .col')].map(c => [...c.querySelectorAll('.bi-name')].map(t => t.textContent));

  test('#strategyBody exists with no toggle button, one checkbox per row', () => {
    expect(document.getElementById('strategyBody')).not.toBeNull();
    expect(document.getElementById('toggleDoneBtn')).toBeNull();
    expect(document.querySelectorAll('#strategyBody input[type="checkbox"]').length).toBe(document.querySelectorAll('#strategyBody .task-row').length);
  });

  test('renders two stacked sections: To do and 2027 Rebuild, with counts', () => {
    const cols = document.querySelectorAll('.board .col');
    expect(cols.length).toBe(2);
    cols.forEach(c => expect(c.classList.contains('strat-col')).toBe(true));
    expect(cols[0].querySelector('.strat-col-head').textContent).toContain('To do');
    expect(cols[1].querySelector('.strat-col-head').textContent).toContain('2027 Rebuild');
    expect(document.querySelector('.strat-head-2027 .strat-title').textContent).toBe('2027 Rebuild');
    expect(cols[0].querySelector('.col-count').textContent).toBe('4 tasks');
    expect(cols[1].querySelector('.col-count').textContent).toBe('2 tasks');
    expect(cols[0].querySelector('.strat-col-cost').textContent).toBe('~$200');
  });

  test('To do orders urgent, then can-do-now, needs-parts, shop; rebuild statuses and unknown go right', () => {
    const [todo, later] = colTitles();
    expect(todo).toEqual(['Brake Inspection', 'Sway Bar Off', 'Bulbs', 'Tyre Rotation']);
    expect(later).toEqual(['Valve Check', 'No Status Task']);
  });

  test('urgent tasks sort first within a column with the red icon', () => {
    const todo = document.querySelectorAll('.board .col')[0];
    const first = todo.querySelector('.task-row');
    expect(first.dataset.task).toBe('strat-brakes');
    expect(first.classList.contains('status-urgent')).toBe(true);
    expect(first.querySelector('.bi-status').classList.contains('dot-urgent')).toBe(true);
    expect(first.querySelector('.task-num').textContent).toBe('01');
  });

  test('row shows who/cost/time meta, still-needed line, phase and status tags', () => {
    const r = document.querySelector('.task-row[data-task="strat-brakes"]');
    expect(r.querySelector('.bi-meta').textContent).toBe('Me · 2 hrs');
    expect(r.querySelector('.bi-cost').textContent).toBe('Est: ~$200');
    expect(r.querySelector('.bi-need').textContent).toBe('Needs: Pads if worn');
    const tags = [...r.querySelectorAll('.bi-tag')].map(t => t.textContent);
    expect(tags).toEqual(['P2', 'URGENT SERVICE']);
    expect(r.querySelector('.tag-phase').getAttribute('title')).toBe('PHASE 2 — SPRING 2026');
  });

  test('notes and on-hand sit inside a collapsed details element', () => {
    const more = document.querySelector('.task-row[data-task="strat-brakes"] details.bi-more');
    expect(more).not.toBeNull();
    expect(more.open).toBe(false);
    expect(more.textContent).toContain('Warning light on');
    expect(more.textContent).toContain('On hand:');
    expect(more.textContent).toContain('DOT3 fluid');
  });

  test('row without still-needed or notes renders neither element', () => {
    const r = document.querySelector('.task-row[data-task="strat-tyres"]');
    expect(r.querySelector('.bi-need')).toBeNull();
    expect(r.querySelector('.bi-more')).toBeNull();
  });

  test('done tasks go to the visible done card below the board, green, no status tag', () => {
    const done = document.querySelector('.strat-done');
    expect(done.querySelector('.col-count').textContent).toBe('1 tasks');
    expect(done.compareDocumentPosition(document.querySelector('.board')) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    const r = done.querySelector('.task-row[data-task="strat-oil"]');
    expect(r.classList.contains('status-done')).toBe(true);
    expect(r.querySelector('.bi-status').classList.contains('dot-done')).toBe(true);
    expect([...r.querySelectorAll('.bi-tag')].map(t => t.textContent)).toEqual(['P2']);
    expect(document.querySelectorAll('.board .task-row[data-task="strat-oil"]').length).toBe(0);
  });

  test('stat tiles show progress, open, urgent, and outstanding cost; header shows meta', () => {
    renderStrategy(phases, { odometer_km: 170000, updated: '2026-09' });
    const stats = [...document.querySelectorAll('.strat-stats .stat')].map(s => s.textContent);
    expect(stats[0]).toContain('1/7');
    expect(stats[1]).toContain('4');
    expect(stats[1]).toContain('2 more in the 2027 rebuild');
    expect(stats[2]).toContain('1');
    expect(stats[2]).toContain('brake inspection');
    expect(stats[3]).toContain('~$200');
    expect(document.querySelector('.stat-bar-fill').style.width).toBe('14%');
    expect(document.querySelector('.strat-facts').textContent).toContain('170,000 km');
    expect(document.querySelector('.strat-facts').textContent).toContain('2026-09');
    expect(document.querySelector('.strat-legend')).not.toBeNull();
  });

  test('a parts list renders inside Notes with Have/Need labels', () => {
    renderStrategy([{ phase: 'P4', tasks: [
      { id: 'rb', priority: 'low', task: 'Rebuild', who: 'Eli', status: 'SCHEDULED 2026/27', checked: false,
        parts: [{ item: 'Water pump', have: true, note: 'HD Auto' }, { item: 'Head gasket', have: false }] }
    ] }]);
    const more = document.querySelector('.task-row[data-task="rb"] details.bi-more');
    expect(more.querySelector('summary').textContent).toBe('Notes + parts list');
    const items = [...more.querySelectorAll('.parts-list li')];
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('have')).toBe(true);
    expect(items[0].querySelector('.bi-tag').textContent).toBe('Have');
    expect(items[0].querySelector('.pl-note').textContent).toBe('HD Auto');
    expect(items[1].querySelector('.bi-tag').textContent).toBe('Need');
    expect(items[1].querySelector('.pl-note')).toBeNull();
  });

  test('shop labour rate from meta is shown next to the hours for that person', () => {
    renderStrategy([{ phase: 'P2', tasks: [
      { id: 'a', priority: 'low', task: 'Bearings', who: 'Liam Schram', status: 'NEEDS PARTS', time: '3 hrs', cost_cad: 615, parts_cad: 359, checked: false },
      { id: 'b', priority: 'low', task: 'Strips', who: 'DIY — Brennon', status: 'CAN DO NOW', time: '3 hrs', checked: false }
    ] }], { labour_rate_liam_cad_hr: 85 });
    expect(document.querySelector('.task-row[data-task="a"] .bi-meta').textContent).toBe('Liam Schram · 3 hrs @ $85/hr');
    expect(document.querySelector('.task-row[data-task="b"] .bi-cost').textContent).toBe('Est: $0');
    expect(document.querySelector('.task-row[data-task="b"] .bi-meta').textContent).toBe('DIY — Brennon · 3 hrs');
    expect(document.querySelector('.task-row[data-task="a"] .bi-cost').textContent).toBe('Est: ~$615 · Parts est: ~$359 · Labour est: ~$256');
  });

  test('empty column shows a placeholder and no done card when nothing is done', () => {
    renderStrategy([{ phase: 'P', tasks: [{ id: 'a', priority: 'low', task: 'A', who: 'Me', status: 'NEEDS PARTS', checked: false }] }]);
    expect(document.querySelectorAll('.col-empty').length).toBe(1);
    expect(document.querySelector('.strat-done')).toBeNull();
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

// ─── renderMaintenanceLog ────────────────────────────────────────────────────

describe('renderMaintenanceLog', () => {
  const entries = [
    { date: '2024-02', km: 165000, item: 'Coolant flush', detail: '50/50 premix', who: 'Shop' },
    { item: 'Rear axle rebuild', detail: 'Date not recorded', who: 'Shop' },
    { date: '2026-04', km: 170000, item: 'Trans fluid', detail: 'Red Line MT-90', who: 'DIY' }
  ];

  beforeEach(() => renderMaintenanceLog(entries));

  test('renders newest first with undated entries last', () => {
    const items = [...document.querySelectorAll('#tab-Maintenance-Log td.log-item')].map(td => td.textContent);
    expect(items).toEqual(['Trans fluid', 'Coolant flush', 'Rear axle rebuild']);
  });

  test('formats odometer and marks unknown date', () => {
    const rows = document.querySelectorAll('#tab-Maintenance-Log tbody tr');
    expect(rows[0].querySelector('.log-km').textContent).toBe('~170,000 km');
    expect(rows[2].querySelector('.log-date').textContent).toBe('Date unknown');
    expect(rows[2].querySelector('.log-km').textContent).toBe('—');
  });

  test('does not mutate the input order', () => {
    expect(entries[0].item).toBe('Coolant flush');
  });
});

// ─── strategy checkboxes (per-browser memory) ────────────────────────────────

describe('strategy checkboxes', () => {
  const phases = [{ phase: 'PHASE 2', tasks: [
    { id: 'strat-a', priority: 'urgent', task: 'A', who: 'Me', status: 'NEEDS PARTS', checked: false },
    { id: 'strat-b', priority: 'done', task: 'B', who: 'Me', status: 'DONE', checked: true }
  ] }];
  const fire = (cb) => cb.dispatchEvent(new Event('change', { bubbles: true }));

  beforeEach(() => { localStorage.clear(); renderStrategy(phases); });

  test('every row has a checkbox reflecting data.json done state', () => {
    expect(document.querySelector('.task-row[data-task="strat-a"] input[data-strat]').checked).toBe(false);
    expect(document.querySelector('.task-row[data-task="strat-b"] input[data-strat]').checked).toBe(true);
  });

  test('checking an open task paints it done and remembers it in localStorage', () => {
    const cb = document.querySelector('.task-row[data-task="strat-a"] input');
    cb.checked = true; fire(cb);
    const row = cb.closest('.task-row');
    expect(row.classList.contains('status-done')).toBe(true);
    expect(row.classList.contains('local-override')).toBe(true);
    expect(row.querySelector('.bi-status').classList.contains('dot-done')).toBe(true);
    expect(localStorage.getItem('lc80:done:strat-a')).toBe('true');
  });

  test('a remembered state is restored on the next render', () => {
    localStorage.setItem('lc80:done:strat-a', 'true');
    renderStrategy(phases);
    const row = document.querySelector('.task-row[data-task="strat-a"]');
    expect(row.querySelector('input').checked).toBe(true);
    expect(row.classList.contains('status-done')).toBe(true);
    expect(row.classList.contains('local-override')).toBe(true);
  });

  test('unchecking back to the data.json state clears the memory and repaints urgent', () => {
    const cb = document.querySelector('.task-row[data-task="strat-a"] input');
    cb.checked = true; fire(cb);
    cb.checked = false; fire(cb);
    const row = cb.closest('.task-row');
    expect(localStorage.getItem('lc80:done:strat-a')).toBeNull();
    expect(row.classList.contains('status-urgent')).toBe(true);
    expect(row.classList.contains('local-override')).toBe(false);
    expect(row.querySelector('.bi-status').classList.contains('dot-urgent')).toBe(true);
  });

  test('a done task never has its checkbox pre-checked state contradicted by the data', () => {
    expect(document.querySelector('.task-row[data-task="strat-b"]').classList.contains('local-override')).toBe(false);
    expect(typeof bindTaskCheckboxes).toBe('function');
  });
});
