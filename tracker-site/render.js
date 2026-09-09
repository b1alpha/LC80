let projectSortDir = {};
let doneHidden = true;

export function _resetStateForTest() {
  projectSortDir = {};
  doneHidden = true;
}

export function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
  var id = name.replace(/ /g, '-');
  var el = document.getElementById('tab-' + id);
  if (el) el.style.display = 'block';
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    var label = btn.textContent.trim();
    if (label === name || label.endsWith(name)) btn.classList.add('active');
  });
  window.location.hash = name.replace(/ /g, '-').toLowerCase();
}

export function sortProjectTable(colIdx) {
  var tbody = document.getElementById('projectBody');
  if (!tbody) return;
  var allRows = Array.from(tbody.querySelectorAll('tr'));
  var groups = [];
  var current = null;
  allRows.forEach(function(row) {
    if (row.classList.contains('project-main')) {
      current = { main: row, subs: [] };
      groups.push(current);
    } else if (current) {
      current.subs.push(row);
    }
  });
  var dir = projectSortDir[colIdx] === 'asc' ? 'desc' : 'asc';
  projectSortDir[colIdx] = dir;
  groups.sort(function(a, b) {
    var aCell = a.main.cells[colIdx];
    var bCell = b.main.cells[colIdx];
    if (!aCell || !bCell) return 0;
    var aVal = aCell.textContent.trim();
    var bVal = bCell.textContent.trim();
    var aNum = parseFloat(aVal);
    var bNum = parseFloat(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return dir === 'asc' ? aNum - bNum : bNum - aNum;
    }
    return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  groups.forEach(function(g) {
    tbody.appendChild(g.main);
    g.subs.forEach(function(s) { tbody.appendChild(s); });
  });
  applyDoneVisibility();
}

export function applyDoneVisibility() {
  var btn = document.getElementById('toggleDoneBtn');
  if (btn) {
    btn.textContent = doneHidden ? 'Show \u2705 Done' : 'Hide \u2705 Done';
    btn.style.background = doneHidden ? '#f0a500' : '#333';
    btn.style.color = doneHidden ? '#111' : '#ccc';
  }
  var tbody = document.getElementById('projectBody');
  if (!tbody) return;
  tbody.classList.toggle('hide-done', doneHidden);
  var inDoneGroup = false;
  Array.from(tbody.querySelectorAll('tr')).forEach(function(row) {
    if (row.classList.contains('project-main')) {
      inDoneGroup = row.classList.contains('status-done');
      row.style.display = (doneHidden && inDoneGroup) ? 'none' : '';
      return;
    }
    var rowIsDone = row.classList.contains('status-done') || inDoneGroup;
    row.style.display = (doneHidden && rowIsDone) ? 'none' : '';
  });
}

export function toggleDoneRows() {
  doneHidden = !doneHidden;
  applyDoneVisibility();
}

export function renderBuild(cards, meta) {
  var statusEmoji = { installed: '\u2705', urgent: '\ud83d\udd34', planned: '\ud83d\udd35', on_hand: '\u26a0\ufe0f', ordered: '\ud83d\udce6' };
  var tagClass = { 'INSTALLED': 'tag-installed', 'DO FIRST': 'tag-urgent', 'PLANNED': 'tag-planned', 'PARTS ON HAND': 'tag-onhand', 'ORDERED': 'tag-ordered' };
  var html = '<div class="build-page">' +
    '<div class="build-vitals">' +
    '<div class="build-vitals-title">\ud83d\ude99 Sneaky Pete \u2014 Build Sheet</div>' +
    '<div class="vital-item"><strong>1993</strong> Toyota Land Cruiser HDJ81</div>' +
    '<div class="vital-divider">|</div>' +
    '<div class="vital-item"><strong>' + meta.engine.split(' ')[0] + '</strong> ' + meta.engine.split(' ').slice(1).join(' ') + '</div>' +
    '<div class="vital-divider">|</div>' +
    '<div class="vital-item"><strong>' + meta.transmission.split(' ')[0] + '</strong> ' + meta.transmission.split(' ').slice(1).join(' ') + '</div>' +
    '<div class="vital-divider">|</div>' +
    '<div class="vital-item"><strong>~' + meta.odometer_km.toLocaleString() + ' km</strong></div>' +
    '<div class="vital-divider">|</div>' +
    '<div class="vital-item"><strong>' + meta.color + ' \u00b7 ' + meta.tires + ' Tires</strong></div>' +
    '<div class="build-power-bar">' +
    '<div class="power-label">Torque progress: <span class="bar-marker-installed">~' + meta.torque_now_nm + 'NM now (est.)</span> \u2192 <span class="bar-marker-target">' + meta.torque_target_nm + 'NM target (pump tune)</span> \u2192 ' + meta.torque_max_nm + 'NM max recommended</div>' +
    '<div class="bar-track"><div class="bar-fill-installed"></div><div class="bar-fill-target"></div></div>' +
    '</div></div><div class="build-grid">';
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    html += '<div class="build-card"><div class="build-card-header"><span class="card-icon">' + card.icon + '</span> ' + card.category + '</div>';
    for (var j = 0; j < card.items.length; j++) {
      var item = card.items[j];
      var nameClass = item.status === 'installed' ? ' installed' : '';
      var tagsHtml = (item.tags || []).map(function(t) {
        return '<span class="bi-tag ' + (tagClass[t] || 'tag-planned') + '">' + t + '</span>';
      }).join('');
      html += '<div class="build-item">' +
        '<div class="bi-status">' + (statusEmoji[item.status] || '\ud83d\udd35') + '</div>' +
        '<div class="bi-body">' +
        '<div class="bi-name' + nameClass + '">' + item.name + '</div>' +
        '<div class="bi-note">' + (item.note || '') + '</div>' +
        tagsHtml +
        '</div></div>';
    }
    html += '</div>';
  }
  html += '</div></div>';
  document.getElementById('tab-Build').innerHTML = html;
}

export function renderFluidGuide(rows) {
  var html = '<table><thead>' +
    '<tr><th colspan="7">\ud83d\udee2\ufe0f SNEAKY PETE \u2014 Fluid Buying Guide | What to Buy + How Much</th></tr>' +
    '<tr><th>System</th><th>Spec / Weight</th><th>Capacity</th><th>Buy This Amount</th><th>Brand Ideas</th><th>Status</th><th>Notes</th></tr>' +
    '</thead><tbody>';
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    html += '<tr><td>' + r.system + '</td><td>' + r.spec + '</td><td>' + r.capacity + '</td><td>' + r.buy_amount + '</td><td>' + r.brand + '</td><td>' + r.status + '</td><td>' + (r.notes || '') + '</td></tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tab-Fluid-Guide').innerHTML = html;
}

export function renderStrategy(phases) {
  var html = '<table><thead>' +
    '<tr><th colspan="7">\ud83d\udccb SNEAKY PETE \u2014 2026 Strategy &amp; Roadmap | Updated Feb 2026</th></tr>' +
    '<tr><th style="width:36px">\u2713</th><th>Priority</th><th>Task</th><th>Who</th><th>Est. Cost</th><th>Est. Time</th><th>Notes / Action</th></tr>' +
    '</thead><tbody>';
  for (var i = 0; i < phases.length; i++) {
    var phase = phases[i];
    html += '<tr><td colspan="7" style="background:#222;color:#f0a500;font-weight:bold;padding:10px 14px;">' + phase.phase + '</td></tr>';
    for (var j = 0; j < phase.tasks.length; j++) {
      var t = phase.tasks[j];
      var rowClass = t.priority === 'urgent' ? 'status-urgent' : t.priority === 'done' ? 'status-done' : 'status-low';
      var prioEmoji = t.priority === 'urgent' ? '\ud83d\udd34' : t.priority === 'done' ? '\u2705' : '\ud83d\udfe1';
      html += '<tr class="' + rowClass + '">' +
        '<td class="strat-check"><input type="checkbox" data-strat="' + t.id + '"' + (t.checked ? ' checked' : '') + '></td>' +
        '<td>' + prioEmoji + '</td>' +
        '<td>' + t.task + '</td><td>' + t.who + '</td>' +
        '<td>' + (t.cost_cad ? '~$' + t.cost_cad : '$0') + '</td>' +
        '<td>' + (t.time || '\u2014') + '</td><td>' + (t.notes || '') + '</td>' +
        '</tr>';
    }
  }
  html += '</tbody></table>';
  document.getElementById('tab-2026-Strategy').innerHTML = html;
}

export function renderProjectTracker(sections) {
  var statusClass = {
    'URGENT SERVICE': 'status-urgent', 'NEEDS INVESTIGATION': 'status-urgent',
    'BROKEN \u2014 REPLACE': 'status-urgent', 'NEEDS PARTS': 'status-urgent',
    'ONGOING TRACKING': 'status-urgent', 'LEAKING \u2014 NEEDS BOOKING': 'status-warn',
    'DONE': 'status-done', 'DEFERRED TO REBUILD': 'status-low', 'PLANNING QUOTE': 'status-low',
    'BRAKE LIGHT ON \u2014 INSPECT NOW': 'status-urgent',
    'CAN DO NOW': 'status-low',
    'SHOP JOB (Pending)': 'status-planned',
    'SHOP JOB (Winter)': 'status-planned',
    'NOT SOLVED \u2014 DEFERRED': 'status-low',
    'SCHEDULED 2026/27': 'status-planned'
  };
  var html = '<div style="margin-bottom:10px;">' +
    '<button id="toggleDoneBtn" onclick="toggleDoneRows()" style="background:#333;color:#ccc;border:1px solid #555;padding:7px 16px;border-radius:4px;cursor:pointer;font-size:0.9em;">Hide \u2705 Done</button>' +
    '</div>' +
    '<table id="projectTable">' +
    '<colgroup><col style="width:22%"><col style="width:12%"><col style="width:14%"><col style="width:20%"><col style="width:8%"><col style="width:6%"><col style="width:10%"></colgroup>' +
    '<thead>' +
    '<tr><th colspan="7">\ud83d\udef3 SNEAKY PETE \u2014 LC80 HDJ81 Project Tracker | 170,000 km | 1HD-T | Updated Feb 2026</th></tr>' +
    '<tr><td colspan="7" style="padding:8px 14px;color:#aaa;font-size:0.85em;">\ud83d\udfe2 CAN DO NOW &nbsp; \ud83d\udfe1 NEEDS PARTS &nbsp; \ud83d\udd0d NEEDS INVESTIGATION &nbsp; \ud83d\udd35 SHOP JOB (Pending) &nbsp; \ud83d\udcc5 SCHEDULED 2026/27 &nbsp; \u2705 DONE</td></tr>' +
    '<tr class="sortable-header">' +
    '<th onclick="sortProjectTable(0)">Project \u21c5</th>' +
    '<th onclick="sortProjectTable(1)">Category \u21c5</th>' +
    '<th onclick="sortProjectTable(2)">Who \u21c5</th>' +
    '<th onclick="sortProjectTable(3)">Status \u21c5</th>' +
    '<th onclick="sortProjectTable(4)">Est. CAD \u21c5</th>' +
    '<th onclick="sortProjectTable(5)">Hrs \u21c5</th>' +
    '<th onclick="sortProjectTable(6)">Priority \u21c5</th>' +
    '</tr></thead><tbody id="projectBody">';
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i];
    html += '<tr><td colspan="7" style="background:#222;color:#f0a500;font-weight:bold;padding:10px 14px;">' + section.section + '</td></tr>';
    for (var j = 0; j < section.projects.length; j++) {
      var p = sections[i].projects[j];
      var isDone = p.status === 'DONE' || (typeof p.status === 'string' && p.status.indexOf('DONE') === 0);
      var rc = isDone ? 'status-done' : (statusClass[p.status] || 'status-low');
      var doneClass = isDone ? ' status-done' : '';
      html += '<tr class="' + rc + ' project-main' + doneClass + '">' +
        '<td>' + p.project + '</td><td>' + p.category + '</td><td>' + p.who + '</td>' +
        '<td>' + p.status + '</td><td>' + (p.cost_cad || 0) + '</td><td>' + (p.hours || 0) + '</td><td>' + (p.priority || '\u2014') + '</td>' +
        '</tr>';
      if (p.notes) html += '<tr class="parts-sub ' + rc + doneClass + '"><td colspan="7">\ud83d\udcdd <strong>Notes:</strong> ' + p.notes + '</td></tr>';
      if (p.on_hand) html += '<tr class="parts-sub ' + rc + doneClass + '"><td colspan="7">\ud83d\udce6 <strong>On Hand:</strong> ' + p.on_hand + '</td></tr>';
      if (p.still_needed) html += '<tr class="parts-sub ' + rc + doneClass + '"><td colspan="7">\ud83d\udd0d <strong>Still Needed:</strong> ' + p.still_needed + '</td></tr>';
    }
  }
  html += '</tbody></table>';
  document.getElementById('tab-Project-Tracker').innerHTML = html;
  applyDoneVisibility();
}

export function renderPartsInventory(parts) {
  var statusClass = { installed: 'status-done', on_hand: '', sold: '', used: 'status-done', reference: '' };
  var statusLabel = { installed: '\u2705 Installed', on_hand: '\ud83d\udce6 On Hand', sold: '\u21a9\ufe0f Sold', used: '\u2705 Used', reference: '\ud83d\udcd6 Reference' };
  var html = '<table><tbody>' +
    '<tr><th colspan="8">\ud83d\udce6 SNEAKY PETE \u2014 Parts Inventory | Updated Feb 2026</th></tr>' +
    '<tr><th>Part / Item</th><th>Vendor</th><th>Part Number</th><th>Price Paid</th><th>Currency</th><th>Approx. CAD</th><th>Project / Use</th><th>Status</th></tr>';
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    var rc = statusClass[p.status] || '';
    html += '<tr class="' + rc + '"><td>' + p.name + '</td><td>' + p.vendor + '</td><td>' + (p.part_number || '\u2014') + '</td><td>' + (p.price_paid || '') + '</td><td>' + (p.currency || '') + '</td><td>' + (p.approx_cad || '') + '</td><td>' + (p.project || '') + '</td><td>' + (statusLabel[p.status] || p.status) + '</td></tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tab-Parts-Inventory').innerHTML = html;
}

export function renderSpendSummary(rows) {
  var html = '<table><tbody>' +
    '<tr><th colspan="4">\ud83d\udcb0 SNEAKY PETE \u2014 Spend Summary | All Invoices + Labour + Credits</th></tr>' +
    '<tr><th>Date</th><th>Vendor / Invoice</th><th>Description</th><th>Amount (CAD approx.)</th></tr>';
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.is_total) {
      html += '<tr class="status-warn"><td></td><td><strong>' + r.vendor + '</strong></td><td></td><td><strong>$' + r.amount_cad.toLocaleString() + '</strong></td></tr>';
    } else {
      html += '<tr><td>' + (r.date || '') + '</td><td>' + r.vendor + '</td><td>' + (r.description || '') + '</td><td>$' + (r.amount_cad || '').toLocaleString() + '</td></tr>';
    }
  }
  html += '</tbody></table>';
  document.getElementById('tab-Spend-Summary').innerHTML = html;
}

export function renderScheduledMaintenance(items) {
  var rowClass = { ok: 'status-done', upcoming: 'status-planned', overdue: 'status-warn', urgent: 'status-urgent', deferred: 'status-planned', due_soon: 'status-low' };
  var html = '<table><tbody>' +
    '<tr><th colspan="8">\ud83d\udd27 SNEAKY PETE \u2014 Scheduled Maintenance | 1HD-T HDJ81 | Current: 170,000 km</th></tr>' +
    '<tr><th>Maintenance Item</th><th>Interval</th><th>Last Done (km)</th><th>Last Done (date/notes)</th><th>Next Due (km)</th><th>Km Until Due</th><th>Status</th><th>Notes</th></tr>';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var rc = rowClass[item.status] || '';
    html += '<tr class="' + rc + '"><td>' + item.item + '</td><td>' + item.interval + '</td><td>' + (item.last_done_km || '\u2014') + '</td><td>' + (item.last_done_notes || '') + '</td><td>' + (item.next_due_km || '\u2014') + '</td><td>' + item.km_until_due + '</td><td>' + (item.status_label || item.status) + '</td><td>' + (item.notes || '') + '</td></tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tab-Scheduled-Maintenance').innerHTML = html;
}

export function renderShopContacts(contacts) {
  var html = '<table><tbody>' +
    '<tr><th colspan="6">\ud83c\udfea SNEAKY PETE \u2014 Trusted Shop Contacts</th></tr>' +
    '<tr><th>Shop / Person</th><th>Role</th><th>Location</th><th>Phone</th><th>Website / Notes</th><th>Speciality</th></tr>';
  for (var i = 0; i < contacts.length; i++) {
    var c = contacts[i];
    html += '<tr><td>' + c.name + '</td><td>' + c.role + '</td><td>' + (c.location || '\u2014') + '</td><td>' + (c.phone || '\u2014') + '</td><td>' + (c.contact || '\u2014') + '</td><td>' + c.specialty + '</td></tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tab-Shop-Contacts').innerHTML = html;
}

window.showTab = showTab;
window.sortProjectTable = sortProjectTable;
window.toggleDoneRows = toggleDoneRows;
