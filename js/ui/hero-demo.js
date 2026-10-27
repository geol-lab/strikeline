/**
 * hero-demo.js — draws the worked example on the landing page and
 * steps through the construction: scale → marks → structure contours
 * → strike/dip → cross-section.
 */

import { MAP, BEDS, SECTION, CONTACTS, buildDemo, bedAt } from './demo-model.js';
import { fitLine } from '../geo/fit.js';
import { strikeDip } from '../geo/structure.js';
import { t, fmt, onLangChange } from '../i18n.js';

const NS = 'http://www.w3.org/2000/svg';
const STEPS = 5;
const STEP_MS = 1900;

/* ---- Drawing helpers ---- */

function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}

const pathD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
const bedColor = (i) => `var(--bed-${i + 1})`;
const bedFill = (i) => `var(--bed-${i + 1}-fill)`;

/* ---- Geometry: map metres → SVG units ---- */

const W = MAP.w / MAP.mpu;      // map width in SVG units
const H = MAP.h / MAP.mpu;      // map height
const k = 1 / MAP.mpu;          // SVG units per metre, same for the section (no exaggeration)
const px = (x) => x * k;
const py = (y) => (MAP.h - y) * k;

/**
 * Bed masks: one raster per bed, white where that bed crops out.
 * Patterns and colours are then drawn as crisp vectors through the mask.
 */
function bedMasks(res = 2) {
  const w = Math.round(W * res), h = Math.round(H * res);
  const idx = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    const y = MAP.h - ((j + 0.5) / h) * MAP.h;
    for (let i = 0; i < w; i++) idx[j * w + i] = bedAt(((i + 0.5) / w) * MAP.w, y);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  return BEDS.map((_, b) => {
    const img = ctx.createImageData(w, h);
    for (let n = 0; n < idx.length; n++) {
      if (idx[n] === b) {
        const o = n * 4;
        img.data[o] = img.data[o + 1] = img.data[o + 2] = img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL('image/png');
  });
}

/** Label position and upright angle partway along a polyline. */
function labelAt(line, frac) {
  const i = Math.max(1, Math.min(line.length - 2, Math.floor(line.length * frac)));
  const a = line[i - 1], b = line[i + 1];
  let ang = (Math.atan2(py(b.y) - py(a.y), px(b.x) - px(a.x)) * 180) / Math.PI;
  if (ang > 90) ang -= 180;
  if (ang < -90) ang += 180;
  return { x: px(line[i].x), y: py(line[i].y), ang };
}

/* ---- Main ---- */

export function initHeroDemo(svg) {
  if (!svg) return;
  const model = buildDemo();
  const { zMin, zMax, L } = model.section;

  // Section geometry, directly under the map at the same scale.
  const ST = H + 58;
  const SH = (zMax - zMin) * k;
  const sx = (d) => px(SECTION.X.x) + d * k;
  const sy = (z) => ST + (zMax - z) * k;

  svg.setAttribute('viewBox', `-48 -16 ${W + 64} ${ST + SH + 56}`);
  const defs = el('defs', {}, svg);

  /* ===== Base map ===== */
  const base = el('g', {}, svg);
  el('clipPath', { id: 'map-clip' }, defs).appendChild(el('rect', { width: W, height: H }));
  el('rect', { width: W, height: H, style: 'fill:var(--paper-raised)' }, base);

  // Bed fills: colour + lithology pattern through each bed's mask.
  const fills = el('g', {}, base);
  bedMasks().forEach((href, b) => {
    const m = el('mask', { id: `bed-mask-${b}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    el('image', { href, width: W, height: H, preserveAspectRatio: 'none' }, m);
    const g = el('g', { mask: `url(#bed-mask-${b})`, opacity: 0.9 }, fills);
    el('rect', { width: W, height: H, style: `fill:${bedFill(b)}` }, g);
    el('rect', { width: W, height: H, fill: `url(#pat-${b + 1})`, opacity: 0.6 }, g);
  });

  // Topographic contours (labels are placed later, above the contacts).
  const topo = el('g', { 'clip-path': 'url(#map-clip)' }, base);
  model.topo.forEach((lvl) => {
    lvl.lines.forEach((line) => {
      el('path', { d: pathD(line.map((p) => [px(p.x), py(p.y)])), fill: 'none', style: 'stroke:var(--contour)', 'stroke-width': 0.9 }, topo);
    });
  });

  // Contacts (outcrop traces): coloured as the bed above the contact.
  const contacts = el('g', { 'clip-path': 'url(#map-clip)' }, base);
  model.outcrops.forEach((o) => {
    o.lines.forEach((line) => {
      el('path', { d: pathD(line.map((p) => [px(p.x), py(p.y)])), fill: 'none', style: `stroke:${bedColor(o.contact.bed)}`, 'stroke-width': 1.9, 'stroke-linejoin': 'round' }, contacts);
    });
  });

  // Unit symbols lettered inside each bed, clear of marks and lines.
  const UNIT = ['Ls', 'Sh', 'Ss', 'Cg'];
  const segDist = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
  };
  const units = el('g', {}, base);
  BEDS.forEach((_, b) => {
    let best = null;
    for (let y = 120; y <= MAP.h - 160; y += 40) {
      for (let x = 120; x <= MAP.w - 120; x += 40) {
        const ring = [[0, 0], [70, 0], [-70, 0], [0, 50], [0, -50], [50, 35], [-50, -35]];
        if (!ring.every(([ox, oy]) => bedAt(x + ox, y + oy) === b)) continue;
        const p = { x, y };
        let score = Math.abs(y - SECTION.X.y);
        for (const m of model.marks) score = Math.min(score, Math.hypot(x - m.x, y - m.y));
        for (const l of model.lines) score = Math.min(score, segDist(p, l.fit.a, l.fit.b) * 1.5);
        if (!best || score > best.score) best = { x, y, score };
      }
    }
    if (best) {
      el('text', { x: px(best.x), y: py(best.y), dy: '0.35em', 'text-anchor': 'middle', 'font-size': 14.5, 'font-weight': 700, class: 'halo', style: `fill:${bedColor(b)}` }, units)
        .textContent = UNIT[b];
    }
  });

  // Contour values lettered along the line, where nothing else is drawn:
  // try spots along every line of a level and keep the one furthest from
  // marks, the section line, the frame and labels already placed.
  const labels = el('g', {}, base);
  const placed = [];
  const xyY = py(SECTION.X.y);
  model.topo.forEach((lvl) => {
    let best = null;
    for (const line of lvl.lines) {
      if (line.length < 8) continue;
      for (let f = 0.12; f <= 0.88; f += 0.04) {
        const pos = labelAt(line, f);
        if (pos.x < 16 || pos.x > W - 16 || pos.y < 12 || pos.y > H - 40) continue;
        let score = Math.abs(pos.y - xyY);
        for (const m of model.marks) score = Math.min(score, Math.hypot(pos.x - px(m.x), pos.y - py(m.y)));
        for (const q of placed) score = Math.min(score, Math.hypot(pos.x - q.x, pos.y - q.y) / 2);
        if (!best || score > best.score) best = { ...pos, score };
      }
    }
    if (!best) return;
    placed.push(best);
    el('text', {
      x: best.x, y: best.y, dy: '0.35em', 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600,
      class: 'halo', style: 'fill:var(--contour-label)',
      transform: `rotate(${best.ang.toFixed(1)} ${best.x.toFixed(1)} ${best.y.toFixed(1)})`,
    }, labels).textContent = lvl.h;
  });

  el('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, fill: 'none', style: 'stroke:var(--ink)', 'stroke-width': 1 }, base);

  // North arrow.
  const north = el('g', { transform: `translate(${W - 22} ${H - 44})` }, base);
  el('path', { d: 'M0 0 5 14 0 11 -5 14Z', style: 'fill:var(--ink)' }, north);
  el('text', { x: 0, y: 26, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700, style: 'fill:var(--ink)' }, north).textContent = 'N';

  // Scale bar: 0–500 m, alternating segments.
  const bar = { x: 18, y: H - 22, len: 500 * k };
  const sb = el('g', {}, base);
  el('rect', { x: bar.x - 8, y: bar.y - 20, width: bar.len + 132, height: 34, style: 'fill:var(--paper-raised)', opacity: 0.92 }, sb);
  el('rect', { x: bar.x, y: bar.y, width: bar.len, height: 4, fill: 'none', style: 'stroke:var(--ink)', 'stroke-width': 0.8 }, sb);
  el('rect', { x: bar.x, y: bar.y, width: bar.len / 2, height: 4, style: 'fill:var(--ink)' }, sb);
  [0, 250, 500].forEach((m) => {
    el('text', { x: bar.x + m * k, y: bar.y - 5, 'text-anchor': 'middle', 'font-size': 13, class: 't-mono', style: 'fill:var(--ink)' }, sb).textContent = m;
  });
  el('text', { x: bar.x + bar.len + 12, y: bar.y - 5, 'font-size': 13, class: 't-mono', style: 'fill:var(--ink)' }, sb).textContent = 'm';

  // Section line X–Y.
  const X = { x: px(SECTION.X.x), y: py(SECTION.X.y) };
  const Y = { x: px(SECTION.Y.x), y: py(SECTION.Y.y) };
  const xy = el('g', {}, base);
  el('line', { x1: X.x, y1: X.y, x2: Y.x, y2: Y.y, style: 'stroke:var(--section-line)', 'stroke-width': 1.3, 'stroke-dasharray': '7 4' }, xy);
  for (const [p, name] of [[X, 'X'], [Y, 'Y']]) {
    el('circle', { cx: p.x, cy: p.y, r: 2.4, style: 'fill:var(--ink)' }, xy);
    el('text', { x: p.x, y: p.y - 7, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, class: 'halo', style: 'fill:var(--ink)' }, xy).textContent = name;
  }

  /* ===== Step groups (DOM order = paint order) ===== */
  const step = (n) => el('g', { class: `st st-${n}` }, svg);
  const gFit = step(3);
  const gMark = step(2);
  const gDip = step(4);
  const gScale = step(1);
  const gSection = step(5);

  // 1 — Scale: both ends of the bar picked, the second snapped level.
  [0, bar.len].forEach((dx) => {
    el('line', { x1: bar.x + dx, y1: bar.y - 1, x2: bar.x + dx, y2: bar.y + 12, style: 'stroke:var(--accent)', 'stroke-width': 1.6 }, gScale);
  });
  el('line', { x1: bar.x, y1: bar.y + 9, x2: bar.x + bar.len, y2: bar.y + 9, style: 'stroke:var(--accent)', 'stroke-width': 0.8, 'stroke-dasharray': '2 2' }, gScale);
  el('text', { x: bar.x + bar.len + 12, y: bar.y + 9, 'font-size': 13, 'font-weight': 600, class: 't-mono halo', style: 'fill:var(--accent)' }, gScale)
    .textContent = `500 m = ${Math.round(bar.len)} px`;

  // 2 — Marks: contact × contour intersections.
  model.marks.forEach((m, i) => {
    el('circle', { cx: px(m.x), cy: py(m.y), r: 3.4, class: 'mark', style: `--i:${i};fill:var(--paper-raised);stroke:var(--ink)`, 'stroke-width': 1.3 }, gMark);
  });

  // 3 — Structure contours: straight lines through equal-elevation marks.
  model.lines.forEach((ln, i) => {
    const { a, b, dir } = ln.fit;
    const ext = 30; // metres beyond the outermost marks
    const A = [px(a.x - dir.x * ext), py(a.y - dir.y * ext)];
    const B = [px(b.x + dir.x * ext), py(b.y + dir.y * ext)];
    const color = bedColor(ln.bed);
    el('path', { d: pathD([A, B]), class: 'ghost', style: `--i:${i};stroke:${color}`, 'stroke-width': 1.3 }, gFit);
    el('path', { d: pathD([A, B]), class: 'rule', pathLength: 1, style: `--i:${i};stroke:${color}`, 'stroke-width': 1.5 }, gFit);

    // Elevation lettered at the northern end.
    const top = A[1] < B[1] ? A : B;
    el('text', { x: top[0], y: top[1] - 5, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700, class: 't-mono halo', style: `fill:${color}` }, gFit)
      .textContent = ln.elevation;

    // Position on X–Y, measured from X.
    if (ln.onSection) {
      const p = ln.onSection.point;
      el('line', { x1: px(p.x), y1: py(p.y) - 5, x2: px(p.x), y2: py(p.y) + 5, style: `stroke:${color}`, 'stroke-width': 1.6 }, gFit);
      el('text', { x: px(p.x) + 3, y: py(p.y) + 15, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600, class: 't-mono halo', style: `fill:${color}` }, gFit)
        .textContent = Math.round(ln.onSection.d);
    }
  });

  // 4 — Strike/dip for the middle contact, with the spacing that produced it.
  const att = model.attitudes.find((a) => a.bed === 2) || model.attitudes[0];
  const own = model.lines.filter((l) => l.bed === att.bed);
  const hi = own[0], lo = own[own.length - 1];
  const yRef = (hi.fit.centroid.y + lo.fit.centroid.y) / 2 + 60;
  const xOn = (ln) => ln.fit.centroid.x + (ln.fit.dir.x * (yRef - ln.fit.centroid.y)) / ln.fit.dir.y;
  const neighbour = own[1] || lo;
  const x1 = px(xOn(hi)), x2 = px(xOn(neighbour)), yd = py(yRef);
  const dimColor = 'var(--ink)';
  el('line', { x1, y1: yd, x2, y2: yd, style: `stroke:${dimColor}`, 'stroke-width': 0.9 }, gDip);
  [x1, x2].forEach((x) => el('line', { x1: x - 3, y1: yd + 3, x2: x + 3, y2: yd - 3, style: `stroke:${dimColor}`, 'stroke-width': 1.3 }, gDip));
  const dSpacing = strikeDip(hi, neighbour).spacing; // measured between the two fitted lines
  el('text', { x: (x1 + x2) / 2, y: yd - 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600, class: 't-mono halo', style: `fill:${dimColor}` }, gDip)
    .textContent = `d = ${Math.round(dSpacing)} m`;
  el('text', { x: (x1 + x2) / 2, y: yd + 12, 'text-anchor': 'middle', 'font-size': 13, class: 't-mono halo', style: `fill:${dimColor}` }, gDip)
    .textContent = `Δh = ${Math.abs(hi.elevation - neighbour.elevation)} m`;

  // The map symbol: long stroke along strike, short tick toward dip.
  const cx = (x1 + x2) / 2 - 30, cy = yd - 36;
  const s = (att.strike * Math.PI) / 180, dd = (att.dipDirection * Math.PI) / 180;
  const sym = el('g', {}, gDip);
  el('rect', { x: cx - 20, y: cy - 20, width: 118, height: 40, style: 'fill:var(--paper-raised)', opacity: 0.88 }, sym);
  el('line', { x1: cx - Math.sin(s) * 15, y1: cy + Math.cos(s) * 15, x2: cx + Math.sin(s) * 15, y2: cy - Math.cos(s) * 15, style: 'stroke:var(--ink)', 'stroke-width': 2.2 }, sym);
  el('line', { x1: cx, y1: cy, x2: cx + Math.sin(dd) * 8, y2: cy - Math.cos(dd) * 8, style: 'stroke:var(--ink)', 'stroke-width': 2.2 }, sym);
  el('text', { x: cx + 12, y: cy + 4, 'font-size': 14.5, 'font-weight': 700, class: 't-mono', style: 'fill:var(--ink)' }, sym)
    .textContent = att.label;

  // 5 — Cross-section beneath the map.
  const guides = el('g', {}, gSection);
  const body = el('g', { class: 'reveal' }, gSection);

  // Points on the section: where each structure contour crosses X–Y, at its elevation.
  const pts = model.lines.filter((l) => l.onSection).map((l) => ({ bed: l.bed, d: l.onSection.d, z: l.elevation, at: l.onSection.point }));
  pts.forEach((p) => {
    el('line', {
      x1: px(p.at.x), y1: py(p.at.y) + 7, x2: sx(p.d), y2: sy(p.z),
      style: `stroke:${bedColor(p.bed)}`, 'stroke-width': 0.7, 'stroke-dasharray': '1.5 2.5', opacity: 0.8,
    }, guides);
  });

  // Elevation grid and frame.
  for (let z = zMin; z <= zMax; z += 100) {
    el('line', { x1: sx(0), y1: sy(z), x2: sx(L), y2: sy(z), style: 'stroke:var(--rule)', 'stroke-width': 0.6 }, body);
    el('text', { x: sx(0) - 6, y: sy(z) + 3, 'text-anchor': 'end', 'font-size': 13, class: 't-mono', style: 'fill:var(--ink-2)' }, body).textContent = z;
  }
  for (let d = 0; d <= L; d += 500) {
    el('text', { x: sx(d), y: sy(zMin) + 13, 'text-anchor': 'middle', 'font-size': 13, class: 't-mono', style: 'fill:var(--ink-2)' }, body).textContent = d;
  }
  el('text', { x: sx(L), y: sy(zMin) + 13, 'text-anchor': 'end', 'font-size': 13, class: 't-mono', style: 'fill:var(--ink-2)' }, body).textContent = `${Math.round(L)} m`;

  // Contacts in the section: a straight line fitted through each bed's points.
  const contactLine = (bed) => {
    const f = fitLine(pts.filter((p) => p.bed === bed).map((p) => ({ x: p.d, y: p.z })));
    if (!f) return null;
    return (d) => f.centroid.y + ((d - f.centroid.x) * f.dir.y) / f.dir.x;
  };
  const lines = CONTACTS.map((c) => contactLine(c.bed));

  // Ground profile and the clip that keeps beds below it.
  const prof = model.profile.map((p) => [sx(p.d), sy(p.z)]);
  const groundD = pathD(prof) + `L${sx(L)} ${sy(zMin)}L${sx(0)} ${sy(zMin)}Z`;
  el('clipPath', { id: 'ground-clip' }, defs).appendChild(el('path', { d: groundD }));

  const beds = el('g', { 'clip-path': 'url(#ground-clip)' }, body);
  const lo0 = (d) => zMin - 50, top = (d) => zMax + 50;
  BEDS.forEach((_, b) => {
    const below = b === 0 ? lo0 : lines[b - 1];
    const above = b === BEDS.length - 1 ? top : lines[b];
    if (!below || !above) return;
    const poly = [[sx(0), sy(below(0))], [sx(L), sy(below(L))], [sx(L), sy(above(L))], [sx(0), sy(above(0))]];
    const d = pathD(poly) + 'Z';
    el('path', { d, style: `fill:${bedFill(b)}` }, beds);
    el('path', { d, fill: `url(#pat-${b + 1})` }, beds);
  });

  // Contacts: dashed where eroded (above ground), solid below.
  CONTACTS.forEach((c, i) => {
    const f = lines[i];
    if (!f) return;
    const d = pathD([[sx(0), sy(f(0))], [sx(L), sy(f(L))]]);
    el('path', { d, style: `stroke:${bedColor(c.bed)}`, 'stroke-width': 0.8, 'stroke-dasharray': '3 3', opacity: 0.55 }, body);
    el('path', { d, style: `stroke:${bedColor(c.bed)}`, 'stroke-width': 1.6, 'clip-path': 'url(#ground-clip)' }, body);
  });

  el('path', { d: pathD(prof), fill: 'none', style: 'stroke:var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, body);
  el('rect', { x: sx(0), y: sy(zMax), width: L * k, height: SH, fill: 'none', style: 'stroke:var(--ink)', 'stroke-width': 0.8 }, body);
  pts.forEach((p) => el('circle', { cx: sx(p.d), cy: sy(p.z), r: 2.7, style: `fill:${bedColor(p.bed)};stroke:var(--paper-raised)`, 'stroke-width': 1 }, body));
  for (const [d, name] of [[0, 'X'], [L, 'Y']]) {
    el('text', { x: sx(d), y: sy(zMax) - 6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, style: 'fill:var(--ink)' }, body).textContent = name;
  }

  /* ===== Stepping ===== */
  const groups = [gScale, gMark, gFit, gDip, gSection];
  const buttons = [...document.querySelectorAll('.demo-steps [data-step]')];
  const note = document.getElementById('demo-note');
  let current = 0;
  let timer = null;

  const dirWord = (deg) => t(`dir.${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]}`);

  function noteFor(n) {
    switch (n) {
      case 1: return t('note.1', { bar: 500, px: Math.round(bar.len), mpp: fmt(MAP.mpu, 2) });
      case 2: return t('note.2', { n: model.marks.length });
      case 3: return t('note.3', { n: model.lines.length });
      case 4: return t('note.4', {
        d: fmt(dSpacing), dh: Math.abs(hi.elevation - neighbour.elevation), dip: Math.round(att.dip),
        strike: String(Math.round(att.strike)).padStart(3, '0'), dir: dirWord(att.dipDirection), label: att.label,
      });
      case 5: return t('note.5', { L: fmt(L), z0: zMin, z1: zMax });
      default: return '';
    }
  }

  // Positions on X–Y per contact: the same numbers as on the map, readable at any width.
  const readout = document.getElementById('demo-readout');
  function renderReadout(n) {
    if (!readout) return;
    readout.hidden = n < 3;
    readout.replaceChildren();
    // From step 4 the headline result stays printed, not only drawn.
    if (n >= 4) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = t('readout.attitude');
      const dd = document.createElement('dd');
      dd.className = 'num';
      dd.textContent = `${att.label} · d = ${fmt(dSpacing)} m, Δh = ${Math.abs(hi.elevation - neighbour.elevation)} m`;
      row.append(dt, dd);
      readout.append(row);
    }
    CONTACTS.forEach((c) => {
      const ds = model.lines.filter((l) => l.bed === c.bed && l.onSection)
        .sort((a, b) => a.onSection.d - b.onSection.d);
      if (!ds.length) return;
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const sw = document.createElement('span');
      sw.className = 'demo-readout__sw';
      sw.style.borderColor = bedColor(c.bed);
      dt.append(sw, document.createTextNode(t('readout.contact', { bed: t(`bed.short.${c.bed}`) })));
      const dd = document.createElement('dd');
      dd.className = 'num';
      ds.forEach((l, i) => {
        const pair = document.createElement('span');
        pair.className = 'demo-readout__pair';
        pair.textContent = `${l.elevation} m → ${fmt(l.onSection.d)}`;
        dd.append(pair, i < ds.length - 1 ? ' · ' : '');
      });
      row.append(dt, dd);
      readout.append(row);
    });
  }

  function show(n) {
    current = n;
    groups.forEach((g, i) => g.classList.toggle('on', i < n));
    buttons.forEach((b) => {
      if (Number(b.dataset.step) === n) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    if (note) note.textContent = noteFor(n);
    renderReadout(n);
  }

  function stop() { clearInterval(timer); timer = null; }

  function play(from = 1) {
    stop();
    show(from);
    timer = setInterval(() => {
      if (current >= STEPS) return stop();
      show(current + 1);
    }, STEP_MS);
  }

  buttons.forEach((b) => b.addEventListener('click', () => { stop(); show(Number(b.dataset.step)); }));
  document.querySelector('.demo-replay')?.addEventListener('click', () => {
    show(0);
    requestAnimationFrame(() => requestAnimationFrame(() => play(1)));
  });
  onLangChange(() => { if (note) note.textContent = noteFor(current); renderReadout(current); });

  // Start when the map scrolls into view; with reduced motion, show the result.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { show(STEPS); return; }
  show(0);
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); setTimeout(() => play(1), 350); }
  }, { threshold: 0.35 });
  io.observe(svg);
}
