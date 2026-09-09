import fs from 'fs';
import path from 'path';
import {
  renderBuild, renderFluidGuide, renderStrategy, renderProjectTracker,
  renderPartsInventory, renderSpendSummary, renderScheduledMaintenance,
  renderShopContacts, _resetStateForTest
} from '../tracker-site/render.js';

const dataPath = path.resolve(process.cwd(), 'tracker-site/data.json');
const realData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

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

describe('data.json structure', () => {
  const EXPECTED_KEYS = [
    'meta', 'build', 'fluid_guide', 'strategy_2026',
    'project_tracker', 'parts_inventory', 'spend_summary',
    'scheduled_maintenance', 'shop_contacts'
  ];

  test('has all 9 expected top-level keys', () => {
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
    renderProjectTracker(realData.project_tracker);
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

  test('#tab-2026-Strategy contains data-strat="strat-rear-diff"', () => {
    expect(document.querySelector('[data-strat="strat-rear-diff"]')).not.toBeNull();
  });

  test('#tab-Project-Tracker contains #projectBody and "Rear Differential Fluid Service"', () => {
    expect(document.getElementById('projectBody')).not.toBeNull();
    expect(document.getElementById('tab-Project-Tracker').innerHTML)
      .toContain('Rear Differential Fluid Service');
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

  test('#tab-Shop-Contacts contains "Liam Schram"', () => {
    expect(document.getElementById('tab-Shop-Contacts').innerHTML).toContain('Liam Schram');
  });
});
