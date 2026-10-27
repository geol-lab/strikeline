/**
 * net-figure.js — the interactive stereonet on the landing page.
 * Two planes in (strike, dip, dip quadrant), their intersection out.
 */

import { toRightHand, greatCircle, smallCircle, pole, project, intersection } from '../geo/stereonet.js';
import { compass } from '../geo/structure.js';
import { t, onLangChange } from '../i18n.js';

const NS = 'http://www.w3.org/2000/svg';
const R = 160; // net radius in SVG units

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent.appendChild(n);
  return n;
}

// Net coordinates have north up; SVG y grows downward.
const toSvg = (p) => [p.x * R, -p.y * R];
const pathOf = (pts) => pts.map((p, i) => { const [x, y] = toSvg(p); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('');

/** Draw the fixed Schmidt-net graticule (10° spacing). */
function drawGraticule(svg) {
  const g = el('g', { fill: 'none', style: 'stroke:var(--rule)', 'stroke-width': 0.6 }, svg);
  el('circle', { cx: 0, cy: 0, r: R, style: 'fill:var(--paper-raised)' }, g);
  for (let d = 10; d < 90; d += 10) {
    el('path', { d: pathOf(greatCircle(0, d)) }, g);
    el('path', { d: pathOf(greatCircle(180, d)) }, g);
  }
  for (let c = 10; c < 180; c += 10) {
    if (c === 90) continue;
    el('path', { d: pathOf(smallCircle(c)) }, g);
  }
  el('line', { x1: -R, y1: 0, x2: R, y2: 0 }, g);
  el('line', { x1: 0, y1: -R, x2: 0, y2: R }, g);
  el('circle', { cx: 0, cy: 0, r: R, fill: 'none', style: 'stroke:var(--ink)', 'stroke-width': 1.4 }, svg);
  el('line', { x1: 0, y1: -R - 8, x2: 0, y2: -R, style: 'stroke:var(--ink)', 'stroke-width': 1.4 }, svg);
  const n = el('text', { x: 0, y: -R - 12, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, style: 'fill:var(--ink)' }, svg);
  n.textContent = 'N';
}

export function initNet(svg, form) {
  if (!svg || !form) return;
  drawGraticule(svg);
  const layer = el('g', {}, svg);
  const out = document.getElementById('net-out');
  const explain = document.getElementById('net-explain');
  let last = null;

  const read = (i) => {
    const s = parseFloat(form.elements[`s${i}`].value);
    const d = parseFloat(form.elements[`d${i}`].value);
    const q = form.elements[`q${i}`].value;
    const okS = Number.isFinite(s) && s >= 0 && s <= 360;
    const okD = Number.isFinite(d) && d >= 0 && d <= 90;
    form.elements[`s${i}`].setAttribute('aria-invalid', String(!okS));
    form.elements[`d${i}`].setAttribute('aria-invalid', String(!okD));
    return okS && okD ? { ...toRightHand(s, d, q), q } : null;
  };

  function render() {
    const p1 = read(1), p2 = read(2);
    layer.replaceChildren();
    if (!p1 || !p2) {
      out.textContent = '—';
      explain.textContent = t('net.invalid');
      last = null;
      return;
    }

    // Planes as great circles, poles as small squares.
    [[p1, 'var(--bed-2)'], [p2, 'var(--bed-3)']].forEach(([p, c]) => {
      el('path', { d: pathOf(greatCircle(p.strike, p.dip)), fill: 'none', style: `stroke:${c}`, 'stroke-width': 2.2 }, layer);
      const pl = pole(p.strike, p.dip);
      const [x, y] = toSvg(project(pl.trend, pl.plunge));
      el('rect', { x: x - 3.5, y: y - 3.5, width: 7, height: 7, style: `fill:${c}` }, layer);
    });

    const line = intersection(p1, p2);
    if (!line) {
      out.textContent = '—';
      explain.textContent = t('net.parallel');
      last = null;
      return;
    }
    const [x, y] = toSvg(project(line.trend, line.plunge));
    el('circle', { cx: x, cy: y, r: 6, style: 'fill:var(--ink);stroke:var(--paper-raised)', 'stroke-width': 2 }, layer);

    const trend = String(Math.round(line.trend) % 360).padStart(3, '0');
    const plunge = String(Math.round(line.plunge)).padStart(2, '0');

    // Letter the result on the net, joined to its point by a leader line.
    const r = Math.hypot(x, y);
    const u = r > 20 ? { x: x / r, y: y / r } : { x: 0.7071, y: -0.7071 };
    const side = u.x >= 0 ? 1 : -1;
    const elbow = { x: x + u.x * 22, y: y + u.y * 22 };
    const end = { x: elbow.x + side * 16, y: elbow.y };
    el('path', { d: `M${x} ${y}L${elbow.x} ${elbow.y}L${end.x} ${end.y}`, fill: 'none', style: 'stroke:var(--ink)', 'stroke-width': 1 }, layer);
    const tag = el('text', {
      x: end.x + side * 4, y: end.y + 5, 'text-anchor': side > 0 ? 'start' : 'end',
      'font-size': 15, 'font-weight': 700, class: 'halo t-mono', style: 'fill:var(--ink)',
    }, layer);
    tag.textContent = `${trend}/${plunge}`;
    out.textContent = `${trend}/${plunge}`;
    last = { line, trend, plunge, a: compass(p1.strike + 90), b: compass(p2.strike + 90) };
    explainText();
  }

  function explainText() {
    if (!last) return;
    explain.textContent = t('net.explain', {
      a: t(`dir.${last.a}`), b: t(`dir.${last.b}`), trend: last.trend, plunge: Math.round(last.line.plunge),
    });
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  onLangChange(() => (last ? explainText() : render()));
  render();
}
