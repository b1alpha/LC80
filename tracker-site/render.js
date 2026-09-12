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

export function applyDoneVisibility() {
  var btn = document.getElementById('toggleDoneBtn');
  if (btn) {
    btn.textContent = doneHidden ? 'Show \u2705 Done' : 'Hide \u2705 Done';
    btn.style.background = doneHidden ? '#f0a500' : '#333';
    btn.style.color = doneHidden ? '#111' : '#ccc';
  }
  var body = document.getElementById('strategyBody');
  if (!body) return;
  body.classList.toggle('hide-done', doneHidden);
  Array.from(body.querySelectorAll('.task-card')).forEach(function(card) {
    card.style.display = (doneHidden && card.classList.contains('status-done')) ? 'none' : '';
  });
  Array.from(body.querySelectorAll('.phase')).forEach(function(ph) {
    var anyVisible = Array.from(ph.querySelectorAll('.task-card')).some(function(c) { return c.style.display !== 'none'; });
    ph.style.display = anyVisible ? '' : 'none';
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
  var rank = { urgent: 0, low: 1, done: 2 };
  var statusClass = {
    'SHOP JOB (Pending)': 'status-planned', 'SCHEDULED 2026/27': 'status-planned',
    'LEAKING \u2014 NEEDS BOOKING': 'status-warn', 'NEEDS BOOKING': 'status-warn'
  };
  var all = [];
  phases.forEach(function(p) { p.tasks.forEach(function(t) { all.push(t); }); });
  var open = all.filter(function(t) { return t.priority !== 'done'; });
  var urgent = open.filter(function(t) { return t.priority === 'urgent'; });
  var needs = open.filter(function(t) { return t.still_needed; });

  var html = '<div class="strat-header">\ud83d\udccb SNEAKY PETE \u2014 2026 Strategy &amp; Project Tracker | 170,000 km | 1HD-T</div>' +
    '<div class="strat-toolbar">' +
    '<button id="toggleDoneBtn" onclick="toggleDoneRows()">Hide \u2705 Done</button>' +
    '<span class="strat-summary"><strong>' + open.length + '</strong> open \u00b7 <strong>' + urgent.length + '</strong> urgent \u00b7 <strong>' + (all.length - open.length) + '</strong> done</span>' +
    '</div>';

  if (needs.length) {
    html += '<section class="strat-needs"><h3>\ud83d\uded2 Still Needed \u2014 parts &amp; bookings across ' + needs.length + ' open tasks</h3><ul>';
    needs.forEach(function(t) {
      html += '<li><span class="need-task">' + t.task + '</span><span class="need-what">' + t.still_needed + '</span></li>';
    });
    html += '</ul></section>';
  }

  html += '<div id="strategyBody">';
  for (var i = 0; i < phases.length; i++) {
    var phase = phases[i];
    var tasks = phase.tasks.slice().sort(function(a, b) { return rank[a.priority] - rank[b.priority]; });
    var openCount = tasks.filter(function(t) { return t.priority !== 'done'; }).length;
    html += '<section class="phase"><h2 class="phase-title"><span>' + phase.phase + '</span><span class="phase-count">' + (openCount ? openCount + ' open' : 'all done') + '</span></h2>';
    for (var j = 0; j < tasks.length; j++) {
      var t = tasks[j];
      var isDone = t.priority === 'done';
      var rc = isDone ? 'status-done' : t.priority === 'urgent' ? 'status-urgent' : (statusClass[t.status] || 'status-low');
      var prio = isDone ? '\u2705 Done' : t.priority === 'urgent' ? '\ud83d\udd34 Urgent' : '\ud83d\udfe1 Later';
      html += '<article class="task-card project-main ' + rc + '" data-task="' + t.id + '">' +
        '<label class="task-check"><input type="checkbox" data-strat="' + t.id + '"' + (t.checked ? ' checked' : '') + '></label>' +
        '<div class="task-body">' +
        '<div class="task-head"><span class="task-prio">' + prio + '</span><h4 class="task-title">' + t.task + '</h4>' +
        (t.status ? '<span class="chip chip-status">' + t.status + '</span>' : '') + '</div>' +
        '<div class="task-meta"><span>\ud83d\udc64 ' + t.who + '</span>' +
        (t.category ? '<span>\ud83c\udff7\ufe0f ' + t.category + '</span>' : '') +
        '<span>\ud83d\udcb0 ' + (t.cost_cad ? '~$' + t.cost_cad : '$0') + '</span>' +
        '<span>\u23f1 ' + (t.time || '\u2014') + '</span></div>' +
        (t.notes ? '<p class="task-notes">' + t.notes + '</p>' : '') +
        ((t.on_hand || t.still_needed) ? '<div class="task-facts">' +
          (t.on_hand ? '<div class="fact fact-onhand"><strong>\ud83d\udce6 On Hand:</strong> ' + t.on_hand + '</div>' : '') +
          (t.still_needed ? '<div class="fact fact-need"><strong>\ud83d\udd0d Still Needed:</strong> ' + t.still_needed + '</div>' : '') +
          '</div>' : '') +
        '</div></article>';
    }
    html += '</section>';
  }
  html += '</div>';
  document.getElementById('tab-2026-Strategy').innerHTML = html;
  applyDoneVisibility();
}


export function renderPartsInventory(parts) {
  var statusLabel = { installed: '\u2705 Installed', on_hand: '\ud83d\udce6 On Hand', sold: '\u21a9\ufe0f Sold', used: '\u2705 Installed', reference: '\ud83d\udcd6 Reference' };
  var isInstalled = function(p) { return p.status === 'installed' || p.status === 'used'; };
  var order = { on_hand: 0, reference: 1, sold: 2 };

  var active = parts.filter(function(p) { return !isInstalled(p); });
  var installed = parts.filter(isInstalled);
  active.sort(function(a, b) {
    var ao = order[a.status] === undefined ? 9 : order[a.status];
    var bo = order[b.status] === undefined ? 9 : order[b.status];
    return ao - bo;
  });

  var headerRow = '<tr><th>Part / Item</th><th>Vendor</th><th>Part Number</th><th>Price Paid</th><th>Currency</th><th>Approx. CAD</th><th>Project / Use</th><th>Status</th></tr>';
  var rowsHtml = function(list, rc) {
    var out = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      out += '<tr class="' + rc + '"><td>' + p.name + '</td><td>' + p.vendor + '</td><td>' + (p.part_number || '\u2014') + '</td><td>' + (p.price_paid || '') + '</td><td>' + (p.currency || '') + '</td><td>' + (p.approx_cad || '') + '</td><td>' + (p.project || '') + '</td><td>' + (statusLabel[p.status] || p.status) + '</td></tr>';
    }
    return out;
  };

  var html = '<table><tbody>' +
    '<tr><th colspan="8">\ud83d\udce6 SNEAKY PETE \u2014 Parts Inventory | On Hand (' + active.length + ')</th></tr>' +
    headerRow + rowsHtml(active, '') +
    '</tbody></table>';

  if (installed.length) {
    html += '<details class="parts-installed">' +
      '<summary>\u2705 Installed (' + installed.length + ')</summary>' +
      '<table><tbody>' + headerRow + rowsHtml(installed, 'status-done') + '</tbody></table>' +
      '</details>';
  }
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
window.toggleDoneRows = toggleDoneRows;
