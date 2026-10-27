/**
 * tables-view.js — tab D: the stratigraphic table, the column drawn
 * from it, and the legend template.
 *
 * Rows are units, youngest first. A row can be linked to a bed (the
 * contact at its base); then its colour follows the bed, and its
 * thickness can be estimated from the map: the horizontal distance d
 * between two contacts' structure contours of the same elevation,
 * times the sine of the dip, t = d · sin δ.
 */

import { getProject, update, derived, newId } from '../core/state.js';
import { lineDistance } from '../geo/vector.js';
import { t, fmt } from '../i18n.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#c3cbc8');

/** Lithologies: weathering width for the column and an SVG fill pattern. */
export const LITHS = {
  limestone:    { w: 0.95, pat: '<path d="M0 .5H16M0 5.5H16M4 .5V5.5M12 5.5V10.5" fill="none" stroke="#14181d" stroke-opacity=".5" stroke-width=".8"/>', size: [16, 10] },
  sandstone:    { w: 0.9,  pat: '<circle cx="2" cy="2" r=".8" fill="#14181d" fill-opacity=".55"/><circle cx="7" cy="4.5" r=".8" fill="#14181d" fill-opacity=".55"/><circle cx="3.5" cy="8" r=".8" fill="#14181d" fill-opacity=".55"/>', size: [10, 10] },
  conglomerate: { w: 1,    pat: '<circle cx="4.5" cy="4" r="2.2" fill="none" stroke="#14181d" stroke-opacity=".5" stroke-width=".8"/><circle cx="12" cy="10.5" r="1.6" fill="none" stroke="#14181d" stroke-opacity=".5" stroke-width=".8"/>', size: [16, 14] },
  siltstone:    { w: 0.75, pat: '<path d="M1 2H6M9 6H14" stroke="#14181d" stroke-opacity=".5" stroke-width=".8"/><circle cx="11" cy="2" r=".7" fill="#14181d" fill-opacity=".55"/><circle cx="3" cy="6" r=".7" fill="#14181d" fill-opacity=".55"/>', size: [16, 8] },
  shale:        { w: 0.6,  pat: '<path d="M1 1.5H7M8 4.5H13" stroke="#14181d" stroke-opacity=".5" stroke-width=".8"/>', size: [14, 6] },
  mudstone:     { w: 0.55, pat: '<path d="M0 2.5H14" stroke="#14181d" stroke-opacity=".35" stroke-width=".8"/>', size: [14, 5] },
  coal:         { w: 0.5,  pat: '<rect width="8" height="8" fill="#14181d" fill-opacity=".75"/>', size: [8, 8] },
  igneous:      { w: 1,    pat: '<path d="M4 2V6M2 4H6M12 8V12M10 10H14" stroke="#14181d" stroke-opacity=".55" stroke-width=".9"/>', size: [16, 14] },
  other:        { w: 0.8,  pat: '', size: [10, 10] },
};

/** Pattern definitions for an exported or on-page SVG. */
export function lithDefs() {
  return '<defs>' + Object.entries(LITHS).map(([id, l]) =>
    `<pattern id="lith-${id}" width="${l.size[0]}" height="${l.size[1]}" patternUnits="userSpaceOnUse">${l.pat}</pattern>`).join('') + '</defs>';
}

/** Guess a lithology from a bed's name (EN or RU). */
function guessLith(name) {
  const n = name.toLowerCase();
  const map = [
    ['conglomerate', /conglom|конглом/], ['sandstone', /sandst|песчан/], ['siltstone', /siltst|алевр/],
    ['shale', /shale|сланец|аргиллит/], ['mudstone', /mudst|глин/], ['limestone', /limest|известн/],
    ['coal', /coal|угол|уголь/], ['igneous', /granit|basalt|igneous|гранит|базальт/],
  ];
  return (map.find(([, re]) => re.test(n)) || ['other'])[0];
}

const DEFAULT_LEGEND = ['contact', 'contour', 'structure', 'section', 'strike', 'axis', 'anticline', 'syncline'];
const defaultLegend = () => ({
  title: t('tabD.legendDefault'),
  items: DEFAULT_LEGEND.map((kind) => ({ kind, label: t(`leg.${kind}`), on: !['anticline', 'syncline'].includes(kind) })),
});

/* ---------------------------------------------------------------- events */

export function initTablesView() {
  $('col-fill').addEventListener('click', fillFromBeds);
  $('col-add').addEventListener('click', () => update('col-add', (d) => {
    d.column.unshift({ id: newId('u'), name: t('tabD.unitDefault'), lith: 'other', age: '', thick: null, desc: '', color: '#c3cbc8', bed: null, legend: true });
  }));

  const table = $('strat-table');
  table.addEventListener('change', (e) => {
    const row = e.target.closest('[data-row]');
    if (!row) return;
    const id = row.dataset.row, f = e.target.name;
    update('col-edit', (d) => {
      const r = d.column.find((x) => x.id === id);
      if (!r) return;
      if (f === 'thick') r.thick = e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value));
      else if (f === 'legend') r.legend = e.target.checked;
      else r[f] = e.target.value;
    });
  });
  table.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('[data-row]').dataset.row;
    const act = btn.dataset.act;
    update('col-move', (d) => {
      const i = d.column.findIndex((x) => x.id === id);
      if (act === 'up' && i > 0) [d.column[i - 1], d.column[i]] = [d.column[i], d.column[i - 1]];
      if (act === 'down' && i < d.column.length - 1) [d.column[i + 1], d.column[i]] = [d.column[i], d.column[i + 1]];
      if (act === 'del') d.column.splice(i, 1);
      if (act === 'est') {
        const est = estimateThickness(d.column[i]);
        if (est) d.column[i].thick = Math.round(est);
      }
    });
  });

  $('legend-title').addEventListener('change', (e) => update('leg-title', (d) => {
    d.legend = d.legend || defaultLegend();
    d.legend.title = e.target.value;
  }));
  $('legend-items').addEventListener('change', (e) => {
    const li = e.target.closest('[data-kind]');
    if (!li) return;
    update('leg-item', (d) => {
      d.legend = d.legend || defaultLegend();
      const it = d.legend.items.find((x) => x.kind === li.dataset.kind);
      if (e.target.name === 'on') it.on = e.target.checked;
      if (e.target.name === 'label') it.label = e.target.value;
    });
  });
  $('legend-reset').addEventListener('click', () => update('leg-reset', (d) => { d.legend = null; }));
}

/** Add a row for every bed not yet in the table, plus the unit below the oldest contact. */
function fillFromBeds() {
  update('col-fill', (d) => {
    const base = (name) => name.replace(/^(base of|подошва:?)\s+/i, '');
    const linked = new Set(d.column.map((r) => r.bed).filter(Boolean));
    // Beds are listed oldest contact first; the table is youngest first.
    for (const bed of [...d.beds].reverse()) {
      if (linked.has(bed.id)) continue;
      const raw = base(bed.name);
      const name = raw.charAt(0).toUpperCase() + raw.slice(1);
      d.column.push({ id: newId('u'), name, lith: guessLith(name), age: '', thick: null, desc: '', color: bed.color, bed: bed.id, legend: true });
    }
    if (d.beds.length && !d.column.some((r) => r.below)) {
      d.column.push({ id: newId('u'), name: t('tabD.below'), lith: 'other', age: '', thick: null, desc: '', color: '#c3cbc8', bed: null, legend: true, below: true });
    }
    // Keep linked rows in the beds' order (youngest first), unlinked ones where they are.
    const order = [...d.beds].reverse().map((b) => b.id);
    d.column.sort((a, b) => {
      const ia = a.bed ? order.indexOf(a.bed) : a.below ? 1e6 : -1;
      const ib = b.bed ? order.indexOf(b.bed) : b.below ? 1e6 : -1;
      return ia === -1 || ib === -1 ? 0 : ia - ib;
    });
  });
}

/**
 * True thickness of a linked unit: its base contact against the next
 * contact above it, compared at every elevation both have a line for.
 */
function estimateThickness(row) {
  if (!row?.bed) return null;
  const p = getProject();
  const D = derived();
  if (!D.mpp) return null;
  const i = p.beds.findIndex((b) => b.id === row.bed);
  const above = p.beds[i + 1];
  if (!above) return null;
  const att = D.attitudes.find((a) => a.bed === row.bed) || D.attitudes.find((a) => a.bed === above.id);
  if (!att) return null;
  const ds = [];
  for (const lo of D.lines.filter((l) => l.bed === row.bed && l.fit)) {
    const hi = D.lines.find((l) => l.bed === above.id && l.h === lo.h && l.fit);
    if (hi) ds.push(Math.abs(lineDistance(hi.fit.centroid, lo.fit.centroid, lo.fit.dir)) * D.mpp);
  }
  if (!ds.length) return null;
  const d = ds.reduce((a, b) => a + b, 0) / ds.length;
  return d * Math.sin((att.dip * Math.PI) / 180);
}

/* ---------------------------------------------------------------- render */

export function renderTablesView() {
  const p = getProject();
  // Linked rows take their bed's colour.
  for (const r of p.column) {
    const bed = r.bed && p.beds.find((b) => b.id === r.bed);
    if (bed) r.color = bed.color;
  }
  renderTable();
  setSvg($('column-svg'), columnSVG());
  renderLegendEditor();
  setSvg($('legend-svg'), legendSVG());
}

function setSvg(svg, { w, h, body }) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.innerHTML = body;
}

function renderTable() {
  const p = getProject();
  const table = $('strat-table');
  if (table.contains(document.activeElement) && document.activeElement.matches('input:not([type=checkbox]), textarea')) return;
  if (!p.column.length) {
    table.innerHTML = `<caption>${esc(t('tabD.empty'))}</caption>`;
    return;
  }
  const opts = (v) => Object.keys(LITHS).map((k) => `<option value="${k}"${k === v ? ' selected' : ''}>${esc(t(`lith.${k}`))}</option>`).join('');
  const head = `<thead><tr><th></th><th>${esc(t('tabD.cName'))}</th><th>${esc(t('tabD.cLith'))}</th><th>${esc(t('tabD.cAge'))}</th><th>${esc(t('tabD.cThick'))}</th><th>${esc(t('tabD.cDesc'))}</th><th>${esc(t('tabD.cLegend'))}</th><th></th></tr></thead>`;
  const rows = p.column.map((r, i) => {
    const est = estimateThickness(r);
    const estBtn = est && Math.round(est) !== r.thick ? `<button type="button" class="est" data-act="est" title="t = d · sin δ">≈ ${fmt(est)}</button>` : '';
    return `<tr data-row="${r.id}">
      <td><input type="color" name="color" class="bed__color" value="${safeColor(r.color)}"${r.bed ? ' disabled title="' + esc(t('tabD.linked')) + '"' : ''} aria-label="${esc(t('app.bedColor'))}"></td>
      <td><input name="name" class="cell" value="${esc(r.name)}" aria-label="${esc(t('tabD.cName'))}"></td>
      <td><select name="lith" class="select select--tiny" aria-label="${esc(t('tabD.cLith'))}">${opts(r.lith)}</select></td>
      <td><input name="age" class="cell" value="${esc(r.age)}" placeholder="${esc(t('tabD.agePh'))}" aria-label="${esc(t('tabD.cAge'))}"></td>
      <td class="thick"><input name="thick" class="cell cell--num" inputmode="decimal" value="${r.thick ?? ''}" aria-label="${esc(t('tabD.cThick'))}">${estBtn}</td>
      <td><input name="desc" class="cell cell--wide" value="${esc(r.desc)}" aria-label="${esc(t('tabD.cDesc'))}"></td>
      <td><input type="checkbox" name="legend"${r.legend !== false ? ' checked' : ''} aria-label="${esc(t('tabD.cLegend'))}"></td>
      <td class="row-acts">
        <button type="button" data-act="up" aria-label="${esc(t('tabD.up'))}"${i === 0 ? ' disabled' : ''}><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 8 6 4l4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
        <button type="button" data-act="down" aria-label="${esc(t('tabD.down'))}"${i === p.column.length - 1 ? ' disabled' : ''}><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
        <button type="button" data-act="del" class="bed__del">${esc(t('app.delete'))}</button>
      </td>
    </tr>`;
  }).join('');
  table.innerHTML = head + `<tbody>${rows}</tbody>`;
}

/** The stratigraphic column, drawn to the table's thicknesses. */
export function columnSVG() {
  const p = getProject();
  const rows = p.column;
  const W = 400, top = 34, colX = 70, colW = 120, maxH = 420;
  if (!rows.length) return { w: W, h: 60, body: `<text x="0" y="30" font-size="13" fill="#434d56">${esc(t('tabD.empty'))}</text>` };
  // Units without a thickness are drawn at the mean known thickness, dashed.
  const knownRows = rows.filter((r) => r.thick > 0);
  const mean = knownRows.length ? knownRows.reduce((s, r) => s + r.thick, 0) / knownRows.length : 1;
  const drawn = rows.map((r) => (r.thick > 0 ? r.thick : mean));
  const kH = maxH / drawn.reduce((a, b) => a + b, 0);
  const heights = drawn.map((v) => Math.max(14, v * kH));
  const allKnown = knownRows.length === rows.length;
  const total = allKnown ? rows.reduce((s, r) => s + r.thick, 0) : 0;
  const H = top + heights.reduce((a, b) => a + b, 0) + 30;

  const out = [lithDefs()];
  out.push(`<text x="0" y="16" font-size="13" font-weight="700" fill="#14181d">${esc(t('tabD.columnTitle'))}</text>`);
  let y = top, cum = total;
  rows.forEach((r, i) => {
    const h = heights[i];
    const w = colW * (LITHS[r.lith]?.w ?? 0.8);
    out.push(`<rect x="${colX}" y="${y}" width="${w}" height="${h}" fill="${safeColor(r.color)}" fill-opacity=".55" stroke="#14181d"${r.thick > 0 ? '' : ' stroke-dasharray="4 3"'}/>`);
    out.push(`<rect x="${colX}" y="${y}" width="${w}" height="${h}" fill="url(#lith-${LITHS[r.lith] ? r.lith : 'other'})"/>`);
    // Thickness scale on the left.
    if (total > 0) out.push(`<text x="${colX - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#434d56" font-family="monospace">${fmt(cum)}</text>`);
    cum -= r.thick || 0;
    // Labels on the right.
    const lx = colX + colW + 14;
    out.push(`<text x="${lx}" y="${y + Math.min(h / 2, 16) + 4}" font-size="12.5" font-weight="650" fill="#14181d">${esc(r.name)}</text>`);
    const sub = [r.age, r.thick > 0 ? `${fmt(r.thick)} m` : ''].filter(Boolean).join(' · ');
    if (sub && h >= 30) out.push(`<text x="${lx}" y="${y + Math.min(h / 2, 16) + 19}" font-size="11" fill="#434d56">${esc(sub)}</text>`);
    y += h;
  });
  if (total > 0) out.push(`<text x="${colX - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#434d56" font-family="monospace">0 m</text>`);
  out.push(`<line x1="${colX}" x2="${colX}" y1="${top}" y2="${y}" stroke="#14181d" stroke-width="1.5"/>`);
  out.push(`<text x="${colX}" y="${y + 22}" font-size="11" fill="#434d56">${esc(t('tabD.colFoot'))}</text>`);
  return { w: W, h: H, body: out.join('') };
}

/** The legend: units from the table, then the switched-on map symbols. */
export function legendSVG() {
  const p = getProject();
  const L = p.legend || defaultLegend();
  const units = p.column.filter((r) => r.legend !== false);
  const items = L.items.filter((i) => i.on);
  const rowH = 30, W = 400;
  const H = 34 + (units.length + items.length) * rowH + 8;
  const out = [lithDefs()];
  out.push(`<text x="0" y="16" font-size="13" font-weight="700" fill="#14181d">${esc(L.title)}</text>`);
  let y = 34;
  const label = (s, sub) => {
    out.push(`<text x="64" y="${y + 14}" font-size="12.5" fill="#14181d">${esc(s)}</text>`);
    if (sub) out.push(`<text x="64" y="${y + 26}" font-size="10.5" fill="#434d56">${esc(sub)}</text>`);
  };
  for (const r of units) {
    out.push(`<rect x=".5" y="${y + 2.5}" width="46" height="20" fill="${safeColor(r.color)}" fill-opacity=".55" stroke="#14181d"/><rect x=".5" y="${y + 2.5}" width="46" height="20" fill="url(#lith-${LITHS[r.lith] ? r.lith : 'other'})"/>`);
    const lith = t(`lith.${r.lith}`);
    label(r.name, [r.age, lith.toLowerCase() === r.name.toLowerCase() ? '' : lith].filter(Boolean).join(' · '));
    y += rowH;
  }
  for (const it of items) {
    out.push(`<g transform="translate(0 ${y + 12})">${symbol(it.kind)}</g>`);
    label(it.label);
    y += rowH;
  }
  return { w: W, h: H, body: out.join('') };
}

/** Map symbols in standard geological-map notation, 46 × 24 box centred on y = 0. */
function symbol(kind) {
  switch (kind) {
    case 'contact': return '<path d="M2 4C14 -6 30 10 44 -2" fill="none" stroke="#b5432e" stroke-width="2"/>';
    case 'contour': return '<path d="M2 4C14 -6 30 10 44 -2" fill="none" stroke="#a0653a" stroke-width="1.2"/>';
    case 'structure': return '<path d="M4 6 42 -6" stroke="#7b3f93" stroke-width="2"/><circle cx="14" cy="2.8" r="2.6" fill="#fff" stroke="#14181d" stroke-width="1.2"/><circle cx="32" cy="-2.9" r="2.6" fill="#fff" stroke="#14181d" stroke-width="1.2"/>';
    case 'section': return '<path d="M2 0H44" stroke="#14181d" stroke-width="1.4" stroke-dasharray="6 3"/>';
    case 'strike': return '<path d="M12 -10V10M12 0H22" stroke="#14181d" stroke-width="2.2"/><text x="25" y="4" font-size="9" fill="#14181d">14</text>';
    case 'axis': return '<path d="M6 0H34" stroke="#14181d" stroke-width="2.2"/><path d="M42 0 32 -5V5Z" fill="#14181d"/>';
    case 'anticline': return '<path d="M2 0H44" stroke="#14181d" stroke-width="1.8"/><path d="M23 0V-9M19 -5 23 -10 27 -5M23 0V9M19 5 23 10 27 5" fill="none" stroke="#14181d" stroke-width="1.4"/>';
    case 'syncline': return '<path d="M2 0H44" stroke="#14181d" stroke-width="1.8"/><path d="M23 -10V-1M19 -5 23 -1 27 -5M23 10V1M19 5 23 1 27 5" fill="none" stroke="#14181d" stroke-width="1.4"/>';
    default: return '';
  }
}

function renderLegendEditor() {
  const p = getProject();
  const L = p.legend || defaultLegend();
  const title = $('legend-title');
  if (document.activeElement !== title) title.value = L.title;
  const ul = $('legend-items');
  if (ul.contains(document.activeElement) && document.activeElement.matches('input[name=label]')) return;
  ul.innerHTML = L.items.map((it) => `<li data-kind="${it.kind}">
    <input type="checkbox" name="on"${it.on ? ' checked' : ''} aria-label="${esc(t('tabD.show'))}">
    <svg viewBox="0 -12 46 24" width="46" height="24" aria-hidden="true">${symbol(it.kind)}</svg>
    <input name="label" class="cell" value="${esc(it.label)}" aria-label="${esc(t('tabD.label'))}">
  </li>`).join('');
}
