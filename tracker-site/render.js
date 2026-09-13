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

export function renderBuild(cards, meta) {
  var html = '<div class="build-page">' +
    '<div class="build-vitals">' +
    '<div class="build-vitals-title">\ud83d\ude99 Sneaky Pete \u2014 Build Sheet \u00b7 what changed from stock</div>' +
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
  var biggest = cards.reduce(function(best, c) { return (!best || c.items.length > best.items.length) ? c : best; }, null);
  var ordered = cards.filter(function(c) { return c !== biggest; }).concat(biggest ? [biggest] : []);
  var cardHtml = function(card, isMain) {
    var out = '<div class="build-card' + (isMain ? ' build-card-main' : '') + '"><div class="build-card-header"><span class="card-icon">' + card.icon + '</span> ' + card.category + '<span class="card-count">' + card.items.length + '</span></div>';
    for (var j = 0; j < card.items.length; j++) {
      var item = card.items[j];
      out += '<div class="build-item"><div class="bi-body">' +
        '<div class="bi-name">' + item.name + '</div>' +
        (item.note ? '<div class="bi-note">' + item.note + '</div>' : '') +
        '</div></div>';
    }
    return out + '</div>';
  };
  var split = cards.length > 1;
  if (split) html += '<div class="build-left">';
  for (var i = 0; i < ordered.length; i++) {
    var card = ordered[i];
    if (split && card === biggest) html += '</div>';
    html += cardHtml(card, split && card === biggest);
  }
  html += '</div></div>';
  document.getElementById('tab-Build').innerHTML = html;
}

export function renderFluidGuide(rows) {
  var html = '<table><thead>' +
    '<tr><th colspan="6">\ud83d\udee2\ufe0f SNEAKY PETE \u2014 Fluid Guide</th></tr>' +
    '<tr><th>System</th><th>Spec / Weight</th><th>Capacity</th><th>Brand Ideas</th><th>Status</th><th>Notes</th></tr>' +
    '</thead><tbody>';
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    html += '<tr><td>' + r.system + '</td><td>' + r.spec + '</td><td>' + r.capacity + '</td><td>' + r.brand + '</td><td>' + r.status + '</td><td>' + (r.notes || '') + '</td></tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tab-Fluid-Guide').innerHTML = html;
}

export function renderStrategy(phases, meta) {
  meta = meta || {};
  var BUCKETS = [
    { key: 'now', title: 'To do', statuses: ['CAN DO NOW', 'ONGOING TRACKING', 'NEEDS PARTS', 'URGENT SERVICE', 'NEEDS INVESTIGATION', 'LEAKING — NEEDS BOOKING', 'NEEDS BOOKING', 'SHOP JOB (Pending)', 'BROKEN — REPLACE'] },
    { key: 'later', title: '2027 Rebuild', statuses: ['PLANNING QUOTE', 'DEFERRED TO REBUILD', 'SCHEDULED 2026/27'] }
  ];
  var bucketOf = {};
  BUCKETS.forEach(function(b) { b.statuses.forEach(function(st) { bucketOf[st] = b.key; }); });
  var statusRank = { 'CAN DO NOW': 0, 'ONGOING TRACKING': 0, 'NEEDS PARTS': 1, 'URGENT SERVICE': 2, 'NEEDS INVESTIGATION': 2, 'LEAKING — NEEDS BOOKING': 2, 'NEEDS BOOKING': 2, 'SHOP JOB (Pending)': 2, 'BROKEN — REPLACE': 2 };
  var statusTag = {
    'CAN DO NOW': 'tag-green', 'ONGOING TRACKING': 'tag-green',
    'NEEDS PARTS': 'tag-amber', 'LEAKING — NEEDS BOOKING': 'tag-red', 'URGENT SERVICE': 'tag-red', 'BROKEN — REPLACE': 'tag-red',
    'NEEDS INVESTIGATION': 'tag-blue', 'NEEDS BOOKING': 'tag-blue', 'SHOP JOB (Pending)': 'tag-blue',
    'PLANNING QUOTE': 'tag-blue', 'DEFERRED TO REBUILD': 'tag-blue', 'SCHEDULED 2026/27': 'tag-blue'
  };

  var all = [];
  phases.forEach(function(p, pi) {
    var m = /PHASE\s+(\d+)/i.exec(p.phase || '');
    var tag = m ? 'P' + m[1] : 'P' + (pi + 1);
    p.tasks.forEach(function(t) { all.push({ t: t, tag: tag, phase: p.phase, order: pi }); });
  });
  var open = all.filter(function(x) { return x.t.priority !== 'done'; });
  var done = all.filter(function(x) { return x.t.priority === 'done'; });
  var urgent = open.filter(function(x) { return x.t.priority === 'urgent'; });
  var sum = function(list) { return list.reduce(function(n, x) { return n + (x.t.cost_cad || 0); }, 0); };
  var money = function(n) { return n ? '~$' + n.toLocaleString() : '$0'; };
  var pct = all.length ? Math.round(done.length / all.length * 100) : 0;
  var isLater = function(x) { return (bucketOf[x.t.status] || 'later') === 'later'; };
  var todo = open.filter(function(x) { return !isLater(x); });
  var later = open.filter(isLater);

  var row = function(x, i) {
    var t = x.t;
    var isDone = t.priority === 'done';
    var prio = isDone ? 'done' : t.priority === 'urgent' ? 'urgent' : 'low';
    var metaBits = [t.who];
    if (t.time && t.time !== '—') {
      var timeBit = t.time;
      Object.keys(meta).forEach(function(k) {
        var m = /^labour_rate_(\w+)_cad_hr$/.exec(k);
        if (m && (t.who || '').toLowerCase().indexOf(m[1].toLowerCase()) !== -1 && /\d/.test(t.time)) timeBit += ' @ $' + meta[k] + '/hr';
      });
      metaBits.push(timeBit);
    }
    return '<div class="task-row status-' + prio + '" data-task="' + t.id + '" data-prio="' + t.priority + '">' +
      '<label class="task-check"><input type="checkbox" data-strat="' + t.id + '"' + (isDone ? ' checked' : '') + '></label>' +
      '<span class="task-num">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
      '<span class="bi-status dot dot-' + prio + '"></span>' +
      '<div class="task-body">' +
      '<div class="bi-name">' + t.task + '</div>' +
      '<div class="bi-meta">' + metaBits.join(' · ') + '</div>' +
      '<div class="bi-cost">Est: ' + money(t.cost_cad) + '</div>' +
      (t.still_needed ? '<div class="bi-need">Needs: ' + t.still_needed + '</div>' : '') +
      ((t.notes || t.on_hand) ? '<details class="bi-more"><summary>Notes</summary>' +
        (t.notes ? '<p>' + t.notes + '</p>' : '') +
        (t.on_hand ? '<p><strong>On hand:</strong> ' + t.on_hand + '</p>' : '') +
        '</details>' : '') +
      '</div>' +
      '<div class="task-tags">' +
      '<span class="bi-tag tag-phase" title="' + x.phase + '">' + x.tag + '</span>' +
      (t.status && !isDone ? '<span class="bi-tag ' + (statusTag[t.status] || 'tag-blue') + '">' + t.status + '</span>' : '') +
      '</div></div>';
  };

  var html = '<div class="strat">' +
    '<header class="strat-head">' +
    '<div><div class="strat-eyebrow">Sneaky Pete · ' + (meta.vehicle || '1993 Toyota Land Cruiser HDJ81') + ' · 1HD-T</div>' +
    '<h1 class="strat-title">2026 Strategy</h1></div>' +
    '<div class="strat-facts">' +
    '<div><div class="strat-fact-label">Odometer</div><div class="strat-fact-val">' + (meta.odometer_km ? meta.odometer_km.toLocaleString() + ' km' : '—') + '</div></div>' +
    '<div><div class="strat-fact-label">Revised</div><div class="strat-fact-val">' + (meta.updated || '—') + '</div></div>' +
    '</div></header>' +
    '<div class="strat-vitals strat-stats">' +
    '<div class="stat stat-dark"><div class="stat-label">Progress</div><div class="stat-row"><span class="stat-big">' + done.length + '/' + all.length + '</span><span class="stat-sub">done</span></div><div class="stat-bar"><div class="stat-bar-fill" style="width:' + pct + '%"></div></div></div>' +
    '<div class="stat"><div class="stat-label">Open</div><div class="stat-row"><span class="stat-big">' + todo.length + '</span><span class="stat-sub">open</span></div><div class="stat-foot">2026 to-do · ' + later.length + ' more in the 2027 rebuild</div></div>' +
    '<div class="stat"><div class="stat-label">Urgent</div><div class="stat-row"><span class="stat-big stat-red">' + urgent.length + '</span><span class="stat-sub">urgent</span></div><div class="stat-foot">' + (urgent.length ? urgent[0].t.task.toLowerCase() : 'nothing on fire') + '</div></div>' +
    '<div class="stat"><div class="stat-label">Est. outstanding 2026</div><div class="stat-row"><span class="stat-big">' + money(sum(todo)) + '</span></div><div class="stat-foot">rebuild ' + money(sum(later)) + ' budgeted separately below</div></div>' +
    '</div>' +
    '<div id="strategyBody"><div class="board">';

  BUCKETS.forEach(function(b) {
    var items = open.filter(function(x) { return (bucketOf[x.t.status] || 'later') === b.key; });
    items.sort(function(p, q) {
      var pu = p.t.priority === 'urgent' ? 0 : 1, qu = q.t.priority === 'urgent' ? 0 : 1;
      var ps = statusRank[p.t.status] || 0, qs = statusRank[q.t.status] || 0;
      return pu - qu || ps - qs || p.order - q.order;
    });
    if (b.key === 'later') {
      html += '<header class="strat-head strat-head-2027"><div><div class="strat-eyebrow">Deferred · only if symptoms worsen</div><h1 class="strat-title strat-title-sm">2027 Rebuild</h1></div>' +
        '<div class="strat-facts"><div><div class="strat-fact-label">Est. budget</div><div class="strat-fact-val">' + money(sum(items)) + '</div></div></div></header>';
    }
    html += '<section class="strat-col col col-' + b.key + '"><div class="strat-col-head"><span class="strat-col-title">' + b.title + '</span><span class="col-count">' + items.length + ' tasks</span><span class="strat-col-cost">' + money(sum(items)) + '</span></div>';
    html += items.length ? items.map(row).join('') : '<div class="col-empty">Nothing here</div>';
    html += '</section>';
  });
  html += '</div>';

  if (done.length) {
    html += '<section class="strat-col strat-done"><div class="strat-col-head"><span class="strat-col-title">Done</span><span class="col-count">' + done.length + ' tasks</span></div><div class="done-list">' + done.map(row).join('') + '</div></section>';
  }
  html += '</div>' +
    '<footer class="strat-legend">' +
    '<span><i class="dot dot-done"></i>Done</span><span><i class="dot dot-urgent"></i>Urgent / critical</span><span><i class="dot dot-low"></i>Standard</span>' +
    '<span><i class="bi-tag tag-amber">Needs parts</i></span><span><i class="bi-tag tag-blue">Planned / deferred</i></span><span><i class="bi-tag tag-green">Can do now</i></span>' +
    '</footer></div>';
  document.getElementById('tab-2026-Strategy').innerHTML = html;
  bindTaskCheckboxes();
}

var DONE_KEY = 'lc80:done:';
function paintTaskRow(row, done) {
  var prio = row.getAttribute('data-prio');
  row.classList.remove('status-done', 'status-urgent', 'status-low');
  row.classList.add(done ? 'status-done' : prio === 'urgent' ? 'status-urgent' : 'status-low');
  var dot = row.querySelector('.bi-status');
  if (dot) { dot.classList.remove('dot-done', 'dot-urgent', 'dot-low'); dot.classList.add(done ? 'dot-done' : prio === 'urgent' ? 'dot-urgent' : 'dot-low'); }
  var name = row.querySelector('.bi-name');
  if (name) name.classList.toggle('installed', done);
}
export function bindTaskCheckboxes() {
  var store = null;
  try { store = window.localStorage; } catch (e) { store = null; }
  Array.from(document.querySelectorAll('#strategyBody input[data-strat]')).forEach(function(cb) {
    var row = cb.closest('.task-row');
    var id = cb.getAttribute('data-strat');
    var fromData = row.getAttribute('data-prio') === 'done';
    var saved = store ? store.getItem(DONE_KEY + id) : null;
    if (saved === 'true' || saved === 'false') {
      cb.checked = saved === 'true';
      if (cb.checked !== fromData) { paintTaskRow(row, cb.checked); row.classList.add('local-override'); }
    }
    cb.addEventListener('change', function() {
      paintTaskRow(row, cb.checked);
      row.classList.toggle('local-override', cb.checked !== fromData);
      if (!store) return;
      if (cb.checked === fromData) store.removeItem(DONE_KEY + id);
      else store.setItem(DONE_KEY + id, String(cb.checked));
    });
  });
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

export function renderMaintenanceLog(entries) {
  var key = function(e) { return e.date || ''; };
  var rows = entries.slice().sort(function(a, b) {
    if (!key(a) && !key(b)) return 0;
    if (!key(a)) return 1;
    if (!key(b)) return -1;
    return key(b).localeCompare(key(a));
  });
  var html = '<table><thead>' +
    '<tr><th colspan="5">📒 SNEAKY PETE — Maintenance Log | newest first</th></tr>' +
    '<tr><th>Date</th><th>Odometer</th><th>Item</th><th>What was done</th><th>Who</th></tr>' +
    '</thead><tbody>';
  for (var i = 0; i < rows.length; i++) {
    var e = rows[i];
    html += '<tr' + (e.date ? '' : ' class="status-low"') + '>' +
      '<td class="log-date">' + (e.date || 'Date unknown') + '</td>' +
      '<td class="log-km">' + (e.km ? '~' + e.km.toLocaleString() + ' km' : '—') + '</td>' +
      '<td class="log-item">' + e.item + '</td>' +
      '<td>' + (e.detail || '') + '</td>' +
      '<td>' + (e.who || '') + '</td></tr>';
  }
  html += '</tbody></table>';
  document.getElementById('tab-Maintenance-Log').innerHTML = html;
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
