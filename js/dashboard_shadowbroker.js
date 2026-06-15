// ═══════════════════════════════════════════════════════════════
//  Cycloparking 1030 — dashboard_shadowbroker.js
//  Demandes de stationnement vélo · Schaerbeek · Juin 2026
//  Données : dispositif_demandes_20260611151427.js (Rama C GeoJSON)
// ═══════════════════════════════════════════════════════════════

// ── NORMALISER RECORDS (Rama C GeoJSON) ───────────────────────
const RECORDS = Array.isArray(DATA)
  ? DATA
  : DATA.features.map(f => ({
      ...f.properties,
      lon: f.geometry?.coordinates?.[0],
      lat: f.geometry?.coordinates?.[1]
    }));

const CHARTS = {};
let filtered = [...RECORDS];
let g9N = 10, g10N = 10;

// Normalise n'importe quel format de date → "YYYY-MM-DD" ou null
// Formats supportés : "YYYY-MM-DD", "YYYY-MM-DD HH:MM:SS", "DD/MM/YYYY"
function parseDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const bel = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (bel) return `${bel[3]}-${bel[2]}-${bel[1]}`;
  return null;
}
function getYear(s) { const d = parseDate(s); return d ? d.substring(0, 4) : null; }
const _allYears = RECORDS.map(r => getYear(r.demande_requestdate)).filter(Boolean).map(Number);
const YR_MIN = _allYears.length ? Math.min(..._allYears) : 2017;
const YR_MAX = _allYears.length ? Math.max(..._allYears) : 2026;

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildFilters();
  applyFilters();
});

// ── CONSTRUCTION DES FILTRES ───────────────────────────────────
function buildFilters() {
  const qtiers = [...new Set(RECORDS.map(r => r.localisation_quartier).filter(Boolean))].sort();
  const selQ = document.getElementById('fQtier');
  qtiers.forEach(q => { const o = document.createElement('option'); o.value = o.textContent = q; selQ.appendChild(o); });

  const typeLabels = {
    homeClassic: 'Domicile Classique', poiClassic: 'POI Classique',
    homeCargo: 'Domicile Cargo',       poiCargo: 'POI Cargo',
    otherClassic: 'Autre Classique'
  };
  const types = [...new Set(RECORDS.map(r => r.demande_type).filter(Boolean))].sort();
  const tw = document.getElementById('fTypeWrap');
  types.forEach(t => {
    const l = document.createElement('label'); l.className = 'cb-row';
    l.innerHTML = `<input type="checkbox" class="chk-type" value="${t}" checked onchange="applyFilters()"><span>${typeLabels[t] || t}</span>`;
    tw.appendChild(l);
  });

  const cw = document.getElementById('fCouvrWrap');
  ['Bien couvert', 'Couverture partielle', 'Zone déficitaire'].forEach(c => {
    const l = document.createElement('label'); l.className = 'cb-row';
    l.innerHTML = `<input type="checkbox" class="chk-couv" value="${c}" checked onchange="applyFilters()"><span>${c}</span>`;
    cw.appendChild(l);
  });

  const dTypes = [...new Set(RECORDS.map(r => r.dispositif_type_fr).filter(Boolean))].sort();
  const dw = document.getElementById('fDispWrap');
  dTypes.forEach(t => {
    const l = document.createElement('label'); l.className = 'cb-row';
    l.innerHTML = `<input type="checkbox" class="chk-disp" value="${t}" checked onchange="applyFilters()"><span>${t}</span>`;
    dw.appendChild(l);
  });

  const sits = [...new Set(RECORDS.map(r => r.dispositif_situation_fr).filter(Boolean))].sort();
  const selS = document.getElementById('fSit');
  sits.forEach(s => { const o = document.createElement('option'); o.value = o.textContent = s; selS.appendChild(o); });

  ['slMin','slMax'].forEach(id => {
    const el = document.getElementById(id);
    el.min = YR_MIN; el.max = YR_MAX;
    el.value = id === 'slMin' ? YR_MIN : YR_MAX;
  });
  document.getElementById('slMinV').textContent = YR_MIN;
  document.getElementById('slMaxV').textContent = YR_MAX;
}

// ── FILTRES ────────────────────────────────────────────────────
function applyFilters() {
  const qtier      = document.getElementById('fQtier').value;
  const sit        = document.getElementById('fSit').value;
  const yMin       = +document.getElementById('slMin').value;
  const yMax       = +document.getElementById('slMax').value;
  const chkTypes   = [...document.querySelectorAll('.chk-type:checked')].map(c => c.value);
  const chkCouvs   = [...document.querySelectorAll('.chk-couv:checked')].map(c => c.value);
  const chkDisps   = [...document.querySelectorAll('.chk-disp:checked')].map(c => c.value);

  filtered = RECORDS.filter(r => {
    if (qtier && r.localisation_quartier !== qtier)          return false;
    if (sit   && r.dispositif_situation_fr !== sit)           return false;
    const y = +getYear(r.demande_requestdate) || 0;
    if (y < yMin || y > yMax)                                return false;
    if (!chkTypes.includes(r.demande_type))                  return false;
    if (!chkCouvs.includes(r.cycloparking_couverture))       return false;
    if (!chkDisps.includes(r.dispositif_type_fr))            return false;
    return true;
  });

  document.getElementById('hdrBadge').textContent = fN(filtered.length) + ' enregistrements';
  updateChips({ qtier, sit, yMin, yMax });
  renderAll();
}

function sliderInput() {
  let mn = +document.getElementById('slMin').value;
  let mx = +document.getElementById('slMax').value;
  if (mn > mx) {
    [mn, mx] = [mx, mn];
    document.getElementById('slMin').value = mn;
    document.getElementById('slMax').value = mx;
  }
  document.getElementById('slMinV').textContent = mn;
  document.getElementById('slMaxV').textContent = mx;
  applyFilters();
}

function resetFilters() {
  document.getElementById('fQtier').value = '';
  document.getElementById('fSit').value   = '';
  document.getElementById('slMin').value  = YR_MIN;
  document.getElementById('slMax').value  = YR_MAX;
  document.getElementById('slMinV').textContent = YR_MIN;
  document.getElementById('slMaxV').textContent = YR_MAX;
  document.querySelectorAll('.chk-type,.chk-couv,.chk-disp').forEach(c => c.checked = true);
  applyFilters();
}

function updateChips({ qtier, sit, yMin, yMax }) {
  const area = document.getElementById('chipsArea');
  area.innerHTML = '';
  const chip = (lbl, fn) => {
    const s = document.createElement('span'); s.className = 'chip';
    s.innerHTML = `${lbl} <span class="rm" onclick="(${fn.toString()})()">×</span>`;
    area.appendChild(s);
  };
  if (qtier) chip(qtier, () => { document.getElementById('fQtier').value = ''; applyFilters(); });
  if (sit)   chip(sit,   () => { document.getElementById('fSit').value   = ''; applyFilters(); });
  if (yMin > YR_MIN || yMax < YR_MAX) chip(`${yMin}–${yMax}`, () => {
    document.getElementById('slMin').value = YR_MIN; document.getElementById('slMax').value = YR_MAX;
    document.getElementById('slMinV').textContent = YR_MIN; document.getElementById('slMaxV').textContent = YR_MAX;
    applyFilters();
  });
}

// ── EXPORT CSV ─────────────────────────────────────────────────
function exportCSV() {
  if (!filtered.length) return;
  const keys = Object.keys(filtered[0]).filter(k => k !== 'output_filename' && k !== 'lon' && k !== 'lat');
  const rows = [
    keys.join(';'),
    ...filtered.map(r => keys.map(k => {
      const v = r[k];
      return v == null ? '' : typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(';'))
  ];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = `demandes_cycloparking_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ── RENDER ALL ─────────────────────────────────────────────────
function renderAll() {
  updateKPIs();
  renderG1(); renderG2(); renderG3();
  renderG4(); renderG5(); renderG6();
  renderG7(); renderG8();
  renderG9(g9N); renderG10(g10N);
  updateSectionKPIs();
  renderGC1(); renderGC2(); renderGC3(); renderGC4(gc4N);
  renderGD1(); renderGD2(); renderGD3(); renderGD4();
  renderGD5(); renderGD6();
}

// ── KPIs ───────────────────────────────────────────────────────
function updateKPIs() {
  document.getElementById('kv0').textContent = fN(filtered.length);
  document.getElementById('ks0').textContent = fN(RECORDS.length) + ' au total';

  const cycloActifs = new Set(
    filtered.filter(r => r.cycloparking_statut_fr === 'En service').map(r => r.cycloparking_id)
  ).size;
  document.getElementById('kv1').textContent = fN(cycloActifs);
  document.getElementById('ks1').textContent = 'sur 139 au total';

  const dispos = new Set(filtered.map(r => r.dispositif_id)).size;
  document.getElementById('kv2').textContent = fN(dispos);
  document.getElementById('ks2').textContent = 'dispositifs publics';

  const occs = filtered.map(r => r.dispositif_occupancy).filter(v => v != null);
  const occMoy = occs.length ? occs.reduce((a, b) => a + b, 0) / occs.length : 0;
  document.getElementById('kv3').textContent = fP(occMoy * 100);
  document.getElementById('ks3').textContent = '>80% = saturé';

  const conv = filtered.filter(r =>
    r.cycloparking_couverture === 'Zone déficitaire' && r.dispositif_public === 'Bien couvert'
  ).length;
  document.getElementById('kv4').textContent = fN(conv);
  document.getElementById('ks4').textContent = 'arceaux → cycloparking';

  const def = filtered.filter(r =>
    r.cycloparking_couverture === 'Zone déficitaire' && r.dispositif_public === 'Zone déficitaire'
  ).length;
  document.getElementById('kv5').textContent = fN(def);
  document.getElementById('ks5').textContent = 'aucune infrastructure';
}

// ── G1 — Demandes par Quartier ─────────────────────────────────
function renderG1() {
  const cnt = {};
  filtered.forEach(r => { if (r.localisation_quartier) cnt[r.localisation_quartier] = (cnt[r.localisation_quartier] || 0) + 1; });
  const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const { t1, t2, grid } = gTC();
  if (CHARTS.g1) CHARTS.g1.destroy();
  CHARTS.g1 = new Chart(document.getElementById('g1'), {
    type: 'bar',
    data: {
      labels: sorted.map(e => e[0]),
      datasets: [{ data: sorted.map(e => e[1]), backgroundColor: P6[0] + 'cc', borderColor: P6[0], borderWidth: 1, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y', maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fN(ctx.raw) + ' demandes' } } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } },
        y: { grid: { display: false }, ticks: { color: t1, font: { family: 'Lexend Deca', size: 11 } } }
      }
    }
  });
}

// ── G2 — Couverture Cycloparking par Quartier ──────────────────
function renderG2() {
  const COUVS  = ['Bien couvert', 'Couverture partielle', 'Zone déficitaire'];
  const COLORS = ['#1BAEA1', '#FDC200', '#E3256B'];
  const qtiers = [...new Set(filtered.map(r => r.localisation_quartier).filter(Boolean))].sort((a, b) =>
    filtered.filter(r => r.localisation_quartier === b).length - filtered.filter(r => r.localisation_quartier === a).length
  );
  const { t1, t2, grid } = gTC();
  if (CHARTS.g2) CHARTS.g2.destroy();
  CHARTS.g2 = new Chart(document.getElementById('g2'), {
    type: 'bar',
    data: {
      labels: qtiers,
      datasets: COUVS.map((c, i) => ({
        label: c,
        data: qtiers.map(q => filtered.filter(r => r.localisation_quartier === q && r.cycloparking_couverture === c).length),
        backgroundColor: COLORS[i] + 'cc', borderColor: COLORS[i], borderWidth: 1
      }))
    },
    options: {
      indexAxis: 'y', maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'top', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } },
      scales: {
        x: { stacked: true, grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } },
        y: { stacked: true, grid: { display: false }, ticks: { color: t1, font: { family: 'Lexend Deca', size: 11 } } }
      }
    }
  });
}

// ── G3 — Évolution annuelle ────────────────────────────────────
function buildQtierSelect(selId) {
  const sel = document.getElementById(selId);
  const current = sel.value;
  sel.innerHTML = '<option value="">Tous les quartiers</option>';
  [...new Set(filtered.map(r => r.localisation_quartier).filter(Boolean))].sort()
    .forEach(q => { const o = document.createElement('option'); o.value = o.textContent = q; sel.appendChild(o); });
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

function renderG3() {
  buildQtierSelect('g3Qtier');
  const qtier = document.getElementById('g3Qtier').value;
  const src = qtier ? filtered.filter(r => r.localisation_quartier === qtier) : filtered;
  const yrs = {};
  src.forEach(r => {
    const y = getYear(r.demande_requestdate); if (y) yrs[y] = (yrs[y] || 0) + 1;
  });
  const labels = Object.keys(yrs).sort();
  const { t2, grid } = gTC();
  if (CHARTS.g3) CHARTS.g3.destroy();
  CHARTS.g3 = new Chart(document.getElementById('g3'), {
    type: 'line',
    data: { labels, datasets: [{ data: labels.map(y => yrs[y]), borderColor: P6[5], backgroundColor: P6[5] + '33', fill: true, tension: 0.4, pointBackgroundColor: P6[5], pointRadius: 5, pointHoverRadius: 7 }] },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fN(ctx.raw) + ' demandes' } } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: t2, font: { family: 'Lexend Deca', size: 11 } } },
        y: { grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } }
      }
    }
  });
}

// ── G4 — 4 Donuts répartition type × couverture cycloparking ──
function renderG4() {
  const DEFS   = [{ id: 'g4a', type: 'homeClassic' }, { id: 'g4b', type: 'poiClassic' }, { id: 'g4c', type: 'homeCargo' }, { id: 'g4d', type: 'poiCargo' }];
  const COUVS  = ['Bien couvert', 'Couverture partielle', 'Zone déficitaire'];
  const COLORS = ['#1BAEA1', '#FDC200', '#E3256B'];
  const { t2 } = gTC();
  DEFS.forEach(def => {
    const sub = filtered.filter(r => r.demande_type === def.type);
    if (CHARTS[def.id]) CHARTS[def.id].destroy();
    CHARTS[def.id] = new Chart(document.getElementById(def.id), {
      type: 'doughnut',
      data: { labels: COUVS, datasets: [{ data: COUVS.map(c => sub.filter(r => r.cycloparking_couverture === c).length), backgroundColor: COLORS.map(c => c + 'cc'), borderColor: COLORS, borderWidth: 2 }] },
      options: { maintainAspectRatio: false, cutout: '65%', plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 9 }, boxWidth: 10 } } } }
    });
  });
}

// ── G5 — Évolution par type de demande ────────────────────────
function renderG5() {
  buildQtierSelect('g5Qtier');
  const qtier = document.getElementById('g5Qtier').value;
  const src = qtier ? filtered.filter(r => r.localisation_quartier === qtier) : filtered;
  const TYPES = ['homeClassic', 'poiClassic', 'homeCargo', 'poiCargo'];
  const TLBLS = { homeClassic: 'Dom.Classic', poiClassic: 'POI Classic', homeCargo: 'Dom.Cargo', poiCargo: 'POI Cargo' };
  const years = [...new Set(src.map(r => getYear(r.demande_requestdate)).filter(Boolean))].sort();
  const { t2, grid } = gTC();
  if (CHARTS.g5) CHARTS.g5.destroy();
  CHARTS.g5 = new Chart(document.getElementById('g5'), {
    type: 'line',
    data: {
      labels: years,
      datasets: TYPES.map((t, i) => ({
        label: TLBLS[t],
        data: years.map(y => src.filter(r => r.demande_type === t && getYear(r.demande_requestdate) === y).length),
        backgroundColor: P6[i] + '55', borderColor: P6[i], borderWidth: 2, fill: true, tension: 0.3
      }))
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'top', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } },
      scales: {
        x: { stacked: true, grid: { color: grid }, ticks: { color: t2, font: { family: 'Lexend Deca', size: 11 } } },
        y: { stacked: true, grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } }
      }
    }
  });
}

// ── G6 — Candidats conversion vs Déficit total par Quartier ───
function renderG6() {
  const qtiers = [...new Set(filtered.map(r => r.localisation_quartier).filter(Boolean))].sort((a, b) =>
    filtered.filter(r => r.localisation_quartier === b).length - filtered.filter(r => r.localisation_quartier === a).length
  );
  const conv = qtiers.map(q => filtered.filter(r => r.localisation_quartier === q && r.cycloparking_couverture === 'Zone déficitaire' && r.dispositif_public === 'Bien couvert').length);
  const def  = qtiers.map(q => filtered.filter(r => r.localisation_quartier === q && r.cycloparking_couverture === 'Zone déficitaire' && r.dispositif_public === 'Zone déficitaire').length);
  const { t1, t2, grid } = gTC();
  if (CHARTS.g6) CHARTS.g6.destroy();
  CHARTS.g6 = new Chart(document.getElementById('g6'), {
    type: 'bar',
    data: {
      labels: qtiers,
      datasets: [
        { label: '🎯 Candidats conversion', data: conv, backgroundColor: P6[2] + 'cc', borderColor: P6[2], borderWidth: 1, borderRadius: 4 },
        { label: '🚨 Déficit total',        data: def,  backgroundColor: P6[0] + 'cc', borderColor: P6[0], borderWidth: 1, borderRadius: 4 }
      ]
    },
    options: {
      indexAxis: 'y', maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'top', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } },
        y: { grid: { display: false }, ticks: { color: t1, font: { family: 'Lexend Deca', size: 11 } } }
      }
    }
  });
}

// ── G7 — Heatmap Quartier × Type de demande ───────────────────
function renderG7() {
  const TYPES = ['homeClassic', 'poiClassic', 'homeCargo', 'poiCargo', 'otherClassic'];
  const TLBLS = { homeClassic: 'Dom.Classic', poiClassic: 'POI Classic', homeCargo: 'Dom.Cargo', poiCargo: 'POI Cargo', otherClassic: 'Autre' };
  const qtiers = [...new Set(filtered.map(r => r.localisation_quartier).filter(Boolean))].sort((a, b) =>
    filtered.filter(r => r.localisation_quartier === b).length - filtered.filter(r => r.localisation_quartier === a).length
  );
  const matrix = qtiers.map(q => TYPES.map(t => filtered.filter(r => r.localisation_quartier === q && r.demande_type === t).length));
  buildHeatmapGrid('g7', TYPES.map(t => TLBLS[t]), qtiers, matrix);
}

// ── G8 — Histogramme distances demande → cycloparking ─────────
function buildG8QtierOptions() {
  const sel = document.getElementById('g8Qtier');
  const current = sel.value;
  sel.innerHTML = '<option value="">Tous les quartiers</option>';
  [...new Set(filtered.map(r => r.localisation_quartier).filter(Boolean))].sort()
    .forEach(q => { const o = document.createElement('option'); o.value = o.textContent = q; sel.appendChild(o); });
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

function renderG8() {
  buildG8QtierOptions();
  const qtier = document.getElementById('g8Qtier').value;
  const src = qtier ? filtered.filter(r => r.localisation_quartier === qtier) : filtered;
  const BINS = ['0–100 m', '100–200 m', '200–300 m', '> 300 m'];
  const data = [
    src.filter(r => r.dist_cycloparking_m < 100).length,
    src.filter(r => r.dist_cycloparking_m >= 100 && r.dist_cycloparking_m < 200).length,
    src.filter(r => r.dist_cycloparking_m >= 200 && r.dist_cycloparking_m < 300).length,
    src.filter(r => r.dist_cycloparking_m >= 300).length
  ];
  const { t2, grid } = gTC();
  if (CHARTS.g8) CHARTS.g8.destroy();
  CHARTS.g8 = new Chart(document.getElementById('g8'), {
    type: 'bar',
    data: { labels: BINS, datasets: [{ data, backgroundColor: P6[1] + 'cc', borderColor: P6[1], borderWidth: 1, borderRadius: 6 }] },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fN(ctx.raw) + ' demandes' } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: t2, font: { family: 'Lexend Deca', size: 11 } } },
        y: { grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } }
      }
    }
  });
}

// ── G9 — Top Rues ──────────────────────────────────────────────
function renderG9(n) {
  g9N = n;
  document.querySelectorAll('#g9pills .pill').forEach(p => p.classList.toggle('active', +p.dataset.n === n));
  const cnt = {};
  filtered.forEach(r => {
    const k = r.localisation_rue_fr; if (!k) return;
    if (!cnt[k]) cnt[k] = { n: 0, q: {} };
    cnt[k].n++;
    const q = r.localisation_quartier; if (q) cnt[k].q[q] = (cnt[k].q[q] || 0) + 1;
  });
  const rows = Object.entries(cnt).sort((a, b) => b[1].n - a[1].n).slice(0, n).map(([k, v]) => ({
    k, n: v.n,
    qtier: Object.entries(v.q).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }));
  buildTopNTable('g9tbl', rows, 'Rue', [{
    label: 'Quartier',
    render: r => `<span style="font-size:.75rem;color:var(--t2)">${r.qtier}</span>`
  }]);
}

// ── G10 — Top BlockParcelles ───────────────────────────────────
function renderG10(n) {
  g10N = n;
  document.querySelectorAll('#g10pills .pill').forEach(p => p.classList.toggle('active', +p.dataset.n === n));
  const cnt = {};
  filtered.forEach(r => {
    const k = r.localisation_blockparcelle; if (!k) return;
    if (!cnt[k]) cnt[k] = { n: 0, rue: {}, couv: {} };
    cnt[k].n++;
    const rue = r.localisation_rue_fr;      if (rue)  cnt[k].rue[rue]   = (cnt[k].rue[rue]   || 0) + 1;
    const couv = r.cycloparking_couverture; if (couv) cnt[k].couv[couv] = (cnt[k].couv[couv] || 0) + 1;
  });
  const rows = Object.entries(cnt).sort((a, b) => b[1].n - a[1].n).slice(0, n).map(([k, v]) => ({
    k, n: v.n,
    rue:  Object.entries(v.rue).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    couv: Object.entries(v.couv).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }));
  const badgeClass = c => c === 'Bien couvert' ? 'badge-green' : c === 'Zone déficitaire' ? 'badge-red' : 'badge-yellow';
  buildTopNTable('g10tbl', rows, 'Bloc parcellaire', [
    { label: 'Rue principale',  render: r => `<span style="font-size:.75rem;color:var(--t2)">${r.rue}</span>` },
    { label: 'Couverture cyclo', render: r => `<span class="couv-badge ${badgeClass(r.couv)}">${r.couv}</span>` }
  ]);
}

// ════════════════════════════════════════════════════════════════
//  KPIs INFRASTRUCTURE (cycloparking + dispositifs)
// ════════════════════════════════════════════════════════════════

function updateSectionKPIs() {
  // ── Cycloparkings — dédupliqués par cycloparking_id ───────────
  const cycloMap = {};
  filtered.forEach(r => { if (r.cycloparking_id != null && !cycloMap[r.cycloparking_id]) cycloMap[r.cycloparking_id] = r; });
  const cyclos = Object.values(cycloMap);
  document.getElementById('kc1v').textContent = fN(cyclos.length);
  document.getElementById('kc2v').textContent = fN(cyclos.reduce((s, r) => s + (+r.cycloparking_capacity_classic || 0), 0));
  document.getElementById('kc3v').textContent = fN(cyclos.reduce((s, r) => s + (+r.cycloparking_capacity_cargo   || 0), 0));

  // ── Dispositifs — dédupliqués par dispositif_id ───────────────
  const dispMap = {};
  filtered.forEach(r => { if (r.dispositif_id != null && !dispMap[r.dispositif_id]) dispMap[r.dispositif_id] = r; });
  const disps = Object.values(dispMap);
  document.getElementById('kd1v').textContent = fN(disps.length);
  document.getElementById('kd2v').textContent = fN(disps.reduce((s, r) => s + (+r.dispositif_capacity || 0), 0));
  document.getElementById('kd3v').textContent = fN(disps.reduce((s, r) => s + (+r.dispositif_nb_velo  || 0), 0));
  document.getElementById('kd4v').textContent = fN(disps.reduce((s, r) => s + (+r.dispositif_nb_cargo || 0), 0));
  document.getElementById('kd5v').textContent = fN(disps.filter(r => (+r.dispositif_occupancy || 0) > 1.0).length);
}

// ════════════════════════════════════════════════════════════════
//  SECTION CYCLOPARKINGS GÉRÉS
// ════════════════════════════════════════════════════════════════

// ── GC1 — Statut (donut) ──────────────────────────────────────
function renderGC1() {
  const map = {};
  filtered.forEach(r => { if (r.cycloparking_statut_fr) map[r.cycloparking_statut_fr] = (map[r.cycloparking_statut_fr] || 0) + 1; });
  const labels = ['En service', 'Hors service'].filter(l => map[l] !== undefined);
  const COLS = { 'En service': P6[1], 'Hors service': P6[0] };
  const { t2 } = gTC();
  if (CHARTS.gc1) CHARTS.gc1.destroy();
  CHARTS.gc1 = new Chart(document.getElementById('gc1'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: labels.map(l => map[l] || 0), backgroundColor: labels.map(l => COLS[l] + 'cc'), borderColor: labels.map(l => COLS[l]), borderWidth: 2 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } }
    }
  });
}

// ── GC2 — Type de cycloparking (donut) ───────────────────────
function renderGC2() {
  const map = {};
  filtered.forEach(r => { if (r.cycloparking_type_fr) map[r.cycloparking_type_fr] = (map[r.cycloparking_type_fr] || 0) + 1; });
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  const { t2 } = gTC();
  if (CHARTS.gc2) CHARTS.gc2.destroy();
  CHARTS.gc2 = new Chart(document.getElementById('gc2'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: labels.map(l => map[l]), backgroundColor: [P6[5] + 'cc', P6[2] + 'cc'], borderColor: [P6[5], P6[2]], borderWidth: 2 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } }
    }
  });
}

// ── GC3 — Statut par Quartier (barras apiladas horiz) ─────────
function renderGC3() {
  const qtiers = [...new Set(filtered.map(r => r.localisation_quartier).filter(Boolean))]
    .sort((a, b) => filtered.filter(r => r.localisation_quartier === b).length - filtered.filter(r => r.localisation_quartier === a).length)
    .slice(0, 12);
  const enSvc   = qtiers.map(q => filtered.filter(r => r.localisation_quartier === q && r.cycloparking_statut_fr === 'En service').length);
  const horsSvc = qtiers.map(q => filtered.filter(r => r.localisation_quartier === q && r.cycloparking_statut_fr === 'Hors service').length);
  const { t2, grid } = gTC();
  if (CHARTS.gc3) CHARTS.gc3.destroy();
  CHARTS.gc3 = new Chart(document.getElementById('gc3'), {
    type: 'bar',
    data: {
      labels: qtiers,
      datasets: [
        { label: 'En service',   data: enSvc,   backgroundColor: P6[1] + 'cc', borderColor: P6[1], borderWidth: 1, borderRadius: 3 },
        { label: 'Hors service', data: horsSvc, backgroundColor: P6[0] + 'cc', borderColor: P6[0], borderWidth: 1, borderRadius: 3 }
      ]
    },
    options: {
      indexAxis: 'y', maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'top', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } },
      scales: {
        x: { stacked: true, grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } },
        y: { stacked: true, grid: { color: grid }, ticks: { color: t2, font: { family: 'Lexend Deca', size: 10 } } }
      }
    }
  });
}

// ── GC4 — Top cycloparkings les plus sollicités (table) ───────
let gc4N = 10;
function renderGC4(n) {
  gc4N = n || gc4N;
  document.querySelectorAll('#gc4pills .pill').forEach(p => p.classList.toggle('active', +p.dataset.n === gc4N));
  const map = {};
  filtered.forEach(r => { if (r.cycloparking_proche) map[r.cycloparking_proche] = (map[r.cycloparking_proche] || 0) + 1; });
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, gc4N)
    .map(([k, n]) => ({ k, n }));
  buildTopNTable('gc4tbl', rows, 'Cycloparking');
}

// ════════════════════════════════════════════════════════════════
//  SECTION DISPOSITIFS PUBLICS
// ════════════════════════════════════════════════════════════════

// Helper — dispositifs uniques depuis src (dédupliqués par dispositif_id)
function uniqDisp(src) {
  const seen = {};
  src.forEach(r => { if (r.dispositif_id != null && !seen[r.dispositif_id]) seen[r.dispositif_id] = r; });
  return Object.values(seen);
}

// ── GD1 — Type de dispositif (donut) ─────────────────────────
function renderGD1() {
  const disps = uniqDisp(filtered);
  const map = {};
  disps.forEach(r => { if (r.dispositif_type_fr) map[r.dispositif_type_fr] = (map[r.dispositif_type_fr] || 0) + 1; });
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  const { t2 } = gTC();
  if (CHARTS.gd1) CHARTS.gd1.destroy();
  CHARTS.gd1 = new Chart(document.getElementById('gd1'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: labels.map(l => map[l]), backgroundColor: [P6[2]+'cc', P6[0]+'cc', P6[5]+'cc'], borderColor: [P6[2], P6[0], P6[5]], borderWidth: 2 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } }
    }
  });
}

// ── GD2 — État des dispositifs (donut) ───────────────────────
function renderGD2() {
  const disps = uniqDisp(filtered);
  const map = {};
  disps.forEach(r => { if (r.dispositif_state_fr) map[r.dispositif_state_fr] = (map[r.dispositif_state_fr] || 0) + 1; });
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  const COLS = {};
  labels.forEach(l => { COLS[l] = l.includes('bon') ? P6[1] : P6[0]; });
  const { t2 } = gTC();
  if (CHARTS.gd2) CHARTS.gd2.destroy();
  CHARTS.gd2 = new Chart(document.getElementById('gd2'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: labels.map(l => map[l]), backgroundColor: labels.map(l => COLS[l] + 'cc'), borderColor: labels.map(l => COLS[l]), borderWidth: 2 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } }
    }
  });
}

// ── GD3 — Couverture météo (donut) ────────────────────────────
function renderGD3() {
  const disps = uniqDisp(filtered);
  const couvert    = disps.filter(r => r.dispositif_cover === 1).length;
  const nonCouvert = disps.filter(r => r.dispositif_cover === 0).length;
  const { t2 } = gTC();
  if (CHARTS.gd3) CHARTS.gd3.destroy();
  CHARTS.gd3 = new Chart(document.getElementById('gd3'), {
    type: 'doughnut',
    data: {
      labels: ['Non couvert', 'Couvert'],
      datasets: [{ data: [nonCouvert, couvert], backgroundColor: [P6[3]+'cc', P6[5]+'cc'], borderColor: [P6[3], P6[5]], borderWidth: 2 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } }
    }
  });
}

// ── GD4 — Opérateur (donut) ───────────────────────────────────
function renderGD4() {
  const disps = uniqDisp(filtered);
  const map = {};
  disps.forEach(r => { if (r.dispositif_operator_fr) map[r.dispositif_operator_fr] = (map[r.dispositif_operator_fr] || 0) + 1; });
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  const COLS = { 'Public': P6[5], 'Privé': P6[4] };
  const { t2 } = gTC();
  if (CHARTS.gd4) CHARTS.gd4.destroy();
  CHARTS.gd4 = new Chart(document.getElementById('gd4'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: labels.map(l => map[l]), backgroundColor: labels.map(l => (COLS[l] || P6[2]) + 'cc'), borderColor: labels.map(l => COLS[l] || P6[2]), borderWidth: 2 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { position: 'bottom', labels: { color: t2, font: { family: 'Lexend Deca', size: 10 }, boxWidth: 12 } } }
    }
  });
}

// ── GD5 — Taux d'occupation (histogramme) ────────────────────
function renderGD5() {
  buildQtierSelect('gd5Qtier');
  const qtier = document.getElementById('gd5Qtier').value;
  const src = qtier ? filtered.filter(r => r.localisation_quartier === qtier) : filtered;
  const disps = uniqDisp(src);
  const TRANCHES = ['0–25 %', '25–50 %', '50–75 %', '75–100 %', '> 100 % (saturé)'];
  const counts = [0, 0, 0, 0, 0];
  disps.forEach(r => {
    const v = r.dispositif_occupancy;
    if (v == null) return;
    if      (v < 0.25) counts[0]++;
    else if (v < 0.50) counts[1]++;
    else if (v < 0.75) counts[2]++;
    else if (v <= 1.0) counts[3]++;
    else               counts[4]++;
  });
  const COLS = [P6[1], P6[3], P6[2], P6[0], P6[4]];
  const { t2, grid } = gTC();
  if (CHARTS.gd5) CHARTS.gd5.destroy();
  CHARTS.gd5 = new Chart(document.getElementById('gd5'), {
    type: 'bar',
    data: {
      labels: TRANCHES,
      datasets: [{ data: counts, backgroundColor: COLS.map(c => c + 'cc'), borderColor: COLS, borderWidth: 1, borderRadius: 4 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fN(ctx.raw) + ' dispositifs' } } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: t2, font: { family: 'Lexend Deca', size: 11 } } },
        y: { grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } }
      }
    }
  });
}

// ── GD6 — Situation géographique (barras horiz) ───────────────
function renderGD6() {
  buildQtierSelect('gd6Qtier');
  const qtier = document.getElementById('gd6Qtier').value;
  const src = qtier ? filtered.filter(r => r.localisation_quartier === qtier) : filtered;
  const disps = uniqDisp(src);
  const map = {};
  disps.forEach(r => { if (r.dispositif_situation_fr) map[r.dispositif_situation_fr] = (map[r.dispositif_situation_fr] || 0) + 1; });
  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
  const { t2, grid } = gTC();
  if (CHARTS.gd6) CHARTS.gd6.destroy();
  CHARTS.gd6 = new Chart(document.getElementById('gd6'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: labels.map(l => map[l]), backgroundColor: P6[5] + 'cc', borderColor: P6[5], borderWidth: 1, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y', maintainAspectRatio: false,
      plugins: { ...basePlugins(), legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fN(ctx.raw) + ' dispositifs' } } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: t2, callback: v => fN(v), font: { family: 'DM Mono' } } },
        y: { grid: { color: grid }, ticks: { color: t2, font: { family: 'Lexend Deca', size: 10 } } }
      }
    }
  });
}
