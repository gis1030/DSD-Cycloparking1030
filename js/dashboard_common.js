// ═══════════════════════════════════════════════════════════════
//  GIS1030 · dashboard_common.js
//  Fonctions partagées par tous les dashboards de la Commune de Schaerbeek
//  NE PAS MODIFIER — éditer uniquement le fichier dashboard_XXXX.js métier
// ═══════════════════════════════════════════════════════════════

// ── PALETTE P6 (fixe — standard GIS1030) ──────────────────────
const P6 = ['#E3256B','#A2C426','#EE7937','#FDC200','#CF7A87','#1BAEA1'];

// Applique P6[i] avec opacité alpha (0–1)
function P6a(i, a) {
  const h = P6[i % P6.length];
  const al = Math.round((a || 0.8) * 255).toString(16).padStart(2, '0');
  return h + al;
}

// ── FORMAT NUMÉRIQUE fr-BE ─────────────────────────────────────
// Séparateur milliers = "." · décimales = ","
const _fr = (n, d = 0) =>
  isNaN(n) ? '—' : n.toFixed(d).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function fN(v)  { return _fr(Math.round(v)); }          // entier
function fP(v)  { return _fr(v, 1) + ' %'; }            // pourcentage
function fA(v)  { return _fr(v, 1) + ' ans'; }          // années

// ── COULEURS CANVAS (résout les variables CSS) ─────────────────
// Utiliser systématiquement gTC() pour les couleurs Chart.js
// Les variables CSS ne sont PAS résolues dans Canvas 2D
function gTC() {
  const l = document.body.classList.contains('light');
  return {
    t1:   l ? '#0b1929'               : '#e8f4f8',
    t2:   l ? '#3d6a82'               : '#7aa8c0',
    t3:   l ? '#7aa8c0'               : '#4a7a98',
    bd:   l ? '#c5dde8'               : '#1e3a52',
    card: l ? '#ffffff'               : '#0f2337',
    grid: l ? 'rgba(197,221,232,.5)'  : 'rgba(30,58,82,.7)'
  };
}

// ── THEME CLAIR / SOMBRE ───────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('light');
  const light = document.body.classList.contains('light');
  document.getElementById('themeBtn').textContent = light ? '☀️' : '🌙';
  if (typeof renderAll === 'function') renderAll();
}

// ── SIDEBAR TOGGLE ─────────────────────────────────────────────
let sbOpen = true;
function toggleSB() {
  sbOpen = !sbOpen;
  document.getElementById('sb').classList.toggle('collapsed', !sbOpen);
  document.getElementById('sbToggle').textContent = sbOpen ? '☰' : '›';
  if (typeof renderAll !== 'function') return;
  const cvs = document.querySelectorAll('#main canvas');
  cvs.forEach(c => { c.style.opacity = '0'; });
  const run = () => { renderAll(); cvs.forEach(c => { c.style.opacity = '1'; }); };
  document.getElementById('main').addEventListener('transitionend', run, { once: true });
  setTimeout(run, 350);
}

// ── RESIZE RÉACTIF ─────────────────────────────────────────────
function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
window.addEventListener('resize', debounce(() => {
  if (typeof renderAll === 'function') renderAll();
}, 150));

// ── OPTIONS CHART.JS PARTAGÉES ─────────────────────────────────
function baseScales(extra) {
  const { t2, grid } = gTC();
  return Object.assign({
    x: { grid: { color: grid }, ticks: { color: t2 } },
    y: { grid: { color: grid }, ticks: { color: t2 } }
  }, extra || {});
}

function basePlugins(extra) {
  const { t2, bd, card } = gTC();
  return Object.assign({
    legend: {
      labels: { color: t2, boxWidth: 10, padding: 12, font: { family: 'Lexend Deca' } }
    },
    tooltip: {
      backgroundColor: card, borderColor: bd, borderWidth: 1,
      titleColor: t2, bodyColor: t2, padding: 10, cornerRadius: 8, boxPadding: 4
    }
  }, extra || {});
}

// ── TÉLÉCHARGER GRAPHIQUE EN PNG ───────────────────────────────
// Nécessite que le dashboard métier expose : const CHARTS = {};
function dlChart(id) {
  if (typeof CHARTS === 'undefined' || !CHARTS[id]) return;
  const a = document.createElement('a');
  a.href = CHARTS[id].toBase64Image();
  a.download = 'gis1030_' + id + '.png';
  a.click();
}

// ── HEATMAP CSS GRID (helper) ──────────────────────────────────
// Usage : buildHeatmapGrid(containerId, cols, rows, matrix, opts)
// opts : { colorRgb, minAlpha, maxAlpha, emptyLabel }
function buildHeatmapGrid(containerId, colHeaders, rowHeaders, matrix, opts) {
  const o = Object.assign({ colorRgb: '27,174,161', minAlpha: 0.15, maxAlpha: 0.90, emptyLabel: '—' }, opts || {});
  const light = document.body.classList.contains('light');
  const t2c   = light ? '#3d6a82' : '#7aa8c0';
  const bgEmp = light ? 'rgba(197,221,232,.25)' : 'rgba(30,58,82,.4)';
  const N = colHeaders.length;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.style.display = 'grid';
  container.style.gridTemplateColumns = '170px repeat(' + N + ',1fr)';
  container.style.gap = '3px';
  container.style.minWidth = (170 + N * 80) + 'px';
  container.innerHTML = '';

  // Calculer min/max (valeurs > 0)
  const flat = matrix.flat().filter(v => v > 0);
  const vMin = flat.length ? Math.min(...flat) : 0;
  const vMax = flat.length ? Math.max(...flat) : 1;

  const mk = (cls, txt, tip) => {
    const e = document.createElement('div');
    e.className = 'hmc ' + cls;
    if (txt != null) e.textContent = txt;
    if (tip) e.title = tip;
    return e;
  };

  // En-tête
  container.appendChild(mk('hmh', ''));
  colHeaders.forEach(h => container.appendChild(mk('hmh', h)));

  // Lignes
  rowHeaders.forEach((row, ri) => {
    container.appendChild(mk('hmdl', row, row));
    colHeaders.forEach((col, ci) => {
      const v = matrix[ri][ci];
      const e = document.createElement('div');
      e.className = 'hmc';
      if (!v) {
        e.style.background = bgEmp; e.textContent = o.emptyLabel; e.style.color = t2c;
      } else {
        const t = (v - vMin) / (vMax - vMin || 1);
        e.style.background = 'rgba(' + o.colorRgb + ',' + (o.minAlpha + t * (o.maxAlpha - o.minAlpha)).toFixed(3) + ')';
        e.style.color = t > 0.55 ? '#fff' : '#0b4a6a';
        e.textContent = fN(v);
        e.title = row + ' · ' + col + ' : ' + fN(v);
      }
      container.appendChild(e);
    });
  });
}

// ── TABLEAU TOP-N (helper) ─────────────────────────────────────
// Usage : buildTopNTable(containerId, rows, dimLabel, sortState)
// rows : [{k, n, ...extras}]  |  extras : objets {label, value, pct}
function buildTopNTable(containerId, rows, dimLabel, extras) {
  const ex = extras || [];
  const maxN = rows[0]?.n || 1;
  let html = '<table class="topn-table"><thead><tr>';
  html += '<th>#</th><th>' + dimLabel + '</th><th>Effectif</th>';
  ex.forEach(e => { html += '<th>' + e.label + '</th>'; });
  html += '</tr></thead><tbody>';
  rows.forEach((r, i) => {
    const pct = r.n / maxN * 100;
    const rk  = i < 3 ? ['r1','r2','r3'][i] : '';
    html += '<tr>';
    html += '<td><span class="rank-badge ' + rk + '">' + (i + 1) + '</span></td>';
    html += '<td style="font-weight:500">' + r.k + '</td>';
    html += '<td><span style="font-family:\'DM Mono\',monospace;font-weight:600;color:var(--p1)">' + fN(r.n) + '</span>'
          + '<div class="tpbar"><div class="tpbar-fill" style="width:' + pct + '%"></div></div></td>';
    ex.forEach(e => { html += '<td>' + e.render(r) + '</td>'; });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById(containerId).innerHTML = html;
}
