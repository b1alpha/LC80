import fs from 'fs';
import path from 'path';
import {
  renderBuild, renderFluidGuide, renderStrategy,
  renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
  renderShopContacts
} from '../tracker-site/render.js';

const dataPath = path.resolve(process.cwd(), 'tracker-site/data.json');
const realData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

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
});

describe('data.json structure', () => {
  const EXPECTED_KEYS = [
    'meta', 'build', 'fluid_guide', 'strategy_2026',
    'parts_inventory', 'spend_summary',
    'scheduled_maintenance', 'shop_contacts'
  ];

  test('has all 8 expected top-level keys', () => {
    EXPECTED_KEYS.forEach(key => {
      expect(realData).toHaveProperty(key);
    });
  });

  test('all array keys are non-empty', () => {
    const arrayKeys = EXPECTED_KEYS.filter(k => k !== 'meta');
    arrayKeys.forEach(key => {
      expect(Array.isArray(realData[key])).toBe(true);
      expect(realData[key].length).toBeGreaterThan(0);
    });
  });
});

describe('full render pipeline with real data', () => {
  beforeEach(() => {
    renderBuild(realData.build, realData.meta);
    renderFluidGuide(realData.fluid_guide);
    renderStrategy(realData.strategy_2026);
    renderPartsInventory(realData.parts_inventory);
    renderSpendSummary(realData.spend_summary);
    renderScheduledMaintenance(realData.scheduled_maintenance);
    renderShopContacts(realData.shop_contacts);
  });

  test('#tab-Build contains "UFI 18G Turbo"', () => {
    expect(document.getElementById('tab-Build').innerHTML).toContain('UFI 18G Turbo');
  });

  test('#tab-Fluid-Guide contains "Engine Oil (1HD-T)"', () => {
    expect(document.getElementById('tab-Fluid-Guide').innerHTML).toContain('Engine Oil (1HD-T)');
  });

  test('#tab-2026-Strategy contains the strat-rear-diff card', () => {
    expect(document.querySelector('.task-card[data-task="strat-rear-diff"]')).not.toBeNull();
  });

  test('#tab-2026-Strategy contains #strategyBody and "Brake Inspection + Service"', () => {
    expect(document.getElementById('strategyBody')).not.toBeNull();
    expect(document.getElementById('tab-2026-Strategy').innerHTML)
      .toContain('Brake Inspection + Service');
  });

  test('#tab-2026-Strategy renders one card per task across the board and done list', () => {
    const taskCount = realData.strategy_2026.reduce((n, p) => n + p.tasks.length, 0);
    expect(document.querySelectorAll('#strategyBody .task-card').length).toBe(taskCount);
    expect(document.querySelectorAll('#strategyBody .board .col').length).toBe(4);
    expect(document.querySelectorAll('#strategyBody .task-need').length).toBeGreaterThan(5);
    expect(document.getElementById('tab-2026-Strategy').innerHTML).toContain('On hand:');
  });

  test('every open task appears in exactly one board column', () => {
    const openIds = realData.strategy_2026.flatMap(p => p.tasks).filter(t => t.priority !== 'done').map(t => t.id);
    const boardIds = [...document.querySelectorAll('#strategyBody .board .task-card')].map(c => c.dataset.task);
    expect(boardIds.sort()).toEqual(openIds.sort());
  });

  test('data.json no longer has a project_tracker key', () => {
    expect(realData.project_tracker).toBeUndefined();
  });

  test('#tab-Parts-Inventory contains "PDI Intercooler Kit"', () => {
    expect(document.getElementById('tab-Parts-Inventory').innerHTML).toContain('PDI Intercooler Kit');
  });

  test('#tab-Spend-Summary contains "INITIAL PURCHASE"', () => {
    expect(document.getElementById('tab-Spend-Summary').innerHTML).toContain('INITIAL PURCHASE');
  });

  test('#tab-Scheduled-Maintenance contains "Engine Oil + Filter"', () => {
    expect(document.getElementById('tab-Scheduled-Maintenance').innerHTML).toContain('Engine Oil + Filter');
  });

  test('#tab-Shop-Contacts contains "EBI Cruisers"', () => {
    expect(document.getElementById('tab-Shop-Contacts').innerHTML).toContain('EBI Cruisers');
  });
});
