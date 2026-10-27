/**
 * net-view.js — the Stereonet tab: plane list, net drawing, the
 * intersection of two chosen planes and the switch that puts that
 * line on the map.
 */

import { getProject, update, setQuiet, newId, BED_COLORS } from '../core/state.js';
import { allPlanes, chosenIntersection } from '../core/planes.js';
import { greatCircle, smallCircle, pole, project } from '../geo/stereonet.js';
import { bearing3, compass } from '../geo/structure.js';
import { t } from '../i18n.js';

const $ = (id) => document.getElementById(id);
const R = 170;
const QUADS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#14181d');
const toSvg = (q) => [q.x * R, -q.y * R];
const pathOf = (pts) => pts.map((q, i) => { const [x, y] = toSvg(q); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('');

/** Fixed graticule, drawn once. */
let graticule = '';
function buildGraticule() {
  const g = [];
  g.push(`<circle r="${R}" fill="#fbfcfb"/>`);
  g.push('<g fill="none" stroke="#c3cbc8" stroke-width=".6">');
  for (let d = 10; d < 90; d += 10) g.push(`<path d="${pathOf(greatCircle(0, d))}"/><path d="${pathOf(greatCircle(180, d))}"/>`);
  for (let c = 10; c < 180; c += 10) if (c !== 90) g.push(`<path d="${pathOf(smallCircle(c))}"/>`);
  g.push(`<line x1="${-R}" x2="${R}" y1="0" y2="0"/><line x1="0" x2="0" y1="${-R}" y2="${R}"/></g>`);
  g.push(`<circle r="${R}" fill="none" stroke="#14181d" stroke-width="1.4"/>`);
  for (const [a, n] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
    const s = Math.sin((a * Math.PI) / 180), c = -Math.cos((a * Math.PI) / 180);
    g.push(`<line x1="${s * R}" y1="${c * R}" x2="${s * (R + 7)}" y2="${c * (R + 7)}" stroke="#14181d" stroke-width="1.4"/>`);
    g.push(`<text x="${s * (R + 17)}" y="${c * (R + 17) + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#14181d">${n}</text>`);
  }
  return g.join('');
}

export function initNetView() {
  graticule = buildGraticule();

  $('add-plane').addEventListener('click', () => {
    update('plane', (d) => {
      const used = new Set([...d.beds.map((b) => b.color), ...d.planes.map((q) => q.color)]);
      const color = BED_COLORS.find((c) => !used.has(c)) || '#14181d';
      d.planes.push({ id: newId('pl'), name: t('netTab.planeDefault', { n: d.planes.length + 1 }), strike: 0, dip: 30, q: 'E', color });
    });
  });

  // Typed planes: edit in place.
  $('planes').addEventListener('change', (e) => {
    const row = e.target.closest('[data-plane]');
    if (!row) return;
    const id = row.dataset.plane;
    const field = e.target.name;
    if (field === 'del') return;
    update('plane-edit', (d) => {
      const q = d.planes.find((x) => x.id === id);
      if (!q) return;
      if (field === 'strike' || field === 'dip') q[field] = parseFloat(e.target.value);
      else if (field === 'q') q.q = e.target.value;
      else if (field === 'name') q.name = e.target.value.trim() || q.name;
      else if (field === 'color') q.color = e.target.value;
    });
  });
  $('planes').addEventListener('click', (e) => {
    const del = e.target.closest('[name="del"]');
    if (!del) return;
    const id = del.closest('[data-plane]').dataset.plane;
    update('plane-del', (d) => {
      d.planes = d.planes.filter((x) => x.id !== id);
      if (d.netA === id) d.netA = null;
      if (d.netB === id) d.netB = null;
    });
  });

  $('pick-a').addEventListener('change', (e) => update('net-pick', (d) => { d.netA = e.target.value || null; }));
  $('pick-b').addEventListener('change', (e) => update('net-pick', (d) => { d.netB = e.target.value || null; }));
  $('show-poles').addEventListener('change', (e) => setQuiet('net-poles', (p) => { p.showPoles = e.target.checked; }));
  $('show-on-map').addEventListener('change', (e) => update('net-map', (d) => { d.lineOnMap = e.target.checked; }));
}

export function renderNetView() {
  const p = getProject();
  const planes = allPlanes();

  // Default pair: the first two planes available.
  if ((!p.netA || !planes.some((q) => q.id === p.netA)) && planes[0]) p.netA = planes[0].id;
  if ((!p.netB || !planes.some((q) => q.id === p.netB) || p.netB === p.netA) && planes[1]) p.netB = planes.find((q) => q.id !== p.netA)?.id ?? null;

  renderPlaneList(planes);
  renderPickers(planes);

  const { A, B, line } = chosenIntersection();
  const out = [graticule];
  for (const q of planes) {
    const c = safeColor(q.color);
    const chosen = q.id === A?.id || q.id === B?.id;
    out.push(`<path d="${pathOf(greatCircle(q.strike, q.dip))}" fill="none" stroke="${c}" stroke-width="${chosen ? 2.6 : 1.4}"${chosen ? '' : ' stroke-dasharray="5 4"'}/>`);
    if (p.showPoles) {
      const pl = pole(q.strike, q.dip);
      const [x, y] = toSvg(project(pl.trend, pl.plunge));
      out.push(`<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${c}"/>`);
    }
  }
  if (line) {
    const [x, y] = toSvg(project(line.trend, line.plunge));
    const r = Math.hypot(x, y);
    const u = r > 20 ? { x: x / r, y: y / r } : { x: 0.707, y: -0.707 };
    const side = u.x >= 0 ? 1 : -1;
    const ex = x + u.x * 24, ey = y + u.y * 24;
    out.push(`<circle cx="${x}" cy="${y}" r="6.5" fill="#14181d" stroke="#ffffff" stroke-width="2"/>`);
    out.push(`<path d="M${x} ${y}L${ex} ${ey}L${ex + side * 16} ${ey}" fill="none" stroke="#14181d"/>`);
    out.push(`<text x="${ex + side * 20}" y="${ey + 5}" text-anchor="${side > 0 ? 'start' : 'end'}" font-size="15" font-weight="700" class="mono halo-net" fill="#14181d">${lineLabel(line)}</text>`);
  }
  $('netw').innerHTML = out.join('');

  // Result.
  $('inter-out').textContent = line ? lineLabel(line) : '—';
  $('inter-explain').textContent = !A || !B
    ? t('netTab.needTwo')
    : !line
      ? t('net.parallel')
      : t('netTab.explain', {
        a: A.name, b: B.name,
        sa: `${bearing3(A.strike)}/${Math.round(A.dip)} ${compass(A.strike + 90)}`,
        sb: `${bearing3(B.strike)}/${Math.round(B.dip)} ${compass(B.strike + 90)}`,
        trend: Math.round(line.trend), plunge: Math.round(line.plunge),
      });
  const sw = $('show-on-map');
  sw.checked = !!p.lineOnMap;
  sw.disabled = !line;
  $('show-poles').checked = !!p.showPoles;
}

export const lineLabel = (l) => `${bearing3(l.trend)}/${String(Math.round(l.plunge)).padStart(2, '0')}`;

function renderPlaneList(planes) {
  const p = getProject();
  const ul = $('planes');
  if (ul.contains(document.activeElement) && document.activeElement.matches('input')) return; // keep typing
  const rows = planes.map((q) => {
    const c = safeColor(q.color);
    if (q.source === 'map') {
      return `<li class="plane-row plane-row--map"><span class="plane-row__sw" style="border-color:${c}"></span><span class="plane-row__name">${esc(q.name)}</span><span class="num plane-row__att">${bearing3(q.strike)}/${Math.round(q.dip)} ${compass(q.strike + 90)}</span><span class="plane-row__src">${t('netTab.fromMap')}</span></li>`;
    }
    const raw = p.planes.find((x) => x.id === q.id);
    return `<li class="plane-row" data-plane="${q.id}">
      <input type="color" name="color" class="bed__color" value="${c}" aria-label="${t('app.bedColor')}">
      <input name="name" class="bed__name" value="${esc(raw.name)}" aria-label="${t('netTab.planeName')}">
      <input name="strike" class="input input--tiny" inputmode="numeric" value="${raw.strike}" aria-label="Strike">
      <input name="dip" class="input input--tiny" inputmode="numeric" value="${raw.dip}" aria-label="Dip">
      <select name="q" class="select select--tiny" aria-label="${t('net.towards')}">${QUADS.map((d) => `<option${d === raw.q ? ' selected' : ''}>${d}</option>`).join('')}</select>
      <button type="button" name="del" class="bed__del">${t('app.delete')}</button>
    </li>`;
  });
  // Rows for typed planes that are currently invalid still need to show.
  for (const raw of p.planes) {
    if (!planes.some((q) => q.id === raw.id)) {
      rows.push(`<li class="plane-row" data-plane="${raw.id}"><input type="color" name="color" class="bed__color" value="${safeColor(raw.color)}"><input name="name" class="bed__name" value="${esc(raw.name)}"><input name="strike" class="input input--tiny" aria-invalid="true" value="${Number.isFinite(raw.strike) ? raw.strike : ''}"><input name="dip" class="input input--tiny" aria-invalid="true" value="${Number.isFinite(raw.dip) ? raw.dip : ''}"><select name="q" class="select select--tiny">${QUADS.map((d) => `<option${d === raw.q ? ' selected' : ''}>${d}</option>`).join('')}</select><button type="button" name="del" class="bed__del">${t('app.delete')}</button></li>`);
    }
  }
  ul.innerHTML = rows.join('') || `<li class="planes__empty">${t('netTab.empty')}</li>`;
}

function renderPickers(planes) {
  const p = getProject();
  for (const [id, val] of [['pick-a', p.netA], ['pick-b', p.netB]]) {
    const sel = $(id);
    sel.innerHTML = `<option value="">—</option>` + planes.map((q) => `<option value="${q.id}"${q.id === val ? ' selected' : ''}>${esc(q.name)} · ${bearing3(q.strike)}/${Math.round(q.dip)}</option>`).join('');
  }
}
