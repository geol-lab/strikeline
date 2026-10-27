/**
 * map-view.js — the map: pan and zoom, the drawing tools, and the
 * overlay of everything the student marked or the project derived.
 *
 * All overlay geometry is in image pixels; sizes of marks and lettering
 * are divided by the zoom so they stay the same size on screen.
 */

import { getProject, update, derived, mpp, newId, snapToSection } from '../core/state.js';
import { t, fmt } from '../i18n.js';
import { bearing3, compass } from '../geo/structure.js';
import { chosenIntersection } from '../core/planes.js';
import { lineLabel } from './net-view.js';

const TAP_SLOP = 5;          // px of movement before a press becomes a drag
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 12;

/** Escape text for SVG markup. */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** Accept only #rrggbb colours from the project file. */
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#14181d');

export function createMapView({ viewport, stage, overlay, getElevation, getBarLength, setNote, onZoom }) {
  const img = document.createElement('img');
  img.alt = '';
  img.draggable = false;
  img.hidden = true;
  stage.prepend(img);

  const view = { s: 1, tx: 0, ty: 0, w: 0, h: 0 };
  let tool = 'pan';
  let temp = null;      // first click of a two-click tool
  let hover = null;     // pointer position in image px (mouse only)
  let shiftKey = false;

  /* ---- Transform ---- */

  function applyTransform() {
    stage.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`;
    onZoom?.(view.s);
  }

  let needsFit = false;
  function fit() {
    if (!view.w) return;
    const r = viewport.getBoundingClientRect();
    if (!r.width || !r.height) { needsFit = true; return; } // hidden tab: fit when shown
    needsFit = false;
    view.s = Math.min(r.width / view.w, r.height / view.h) * 0.94;
    view.tx = (r.width - view.w * view.s) / 2;
    view.ty = (r.height - view.h * view.s) / 2;
    applyTransform();
    render();
  }

  function zoomAt(factor, cx, cy) {
    const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.s * factor));
    const k = s / view.s;
    view.tx = cx - (cx - view.tx) * k;
    view.ty = cy - (cy - view.ty) * k;
    view.s = s;
    applyTransform();
    render();
  }

  const toImage = (clientX, clientY) => {
    const r = viewport.getBoundingClientRect();
    return { x: (clientX - r.left - view.tx) / view.s, y: (clientY - r.top - view.ty) / view.s };
  };

  /* ---- Image ---- */

  function setImage(blob) {
    return new Promise((resolve) => {
      if (!blob) { img.hidden = true; view.w = 0; render(); resolve(); return; }
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        view.w = img.naturalWidth;
        view.h = img.naturalHeight;
        img.width = view.w;
        img.height = view.h;
        img.hidden = false;
        overlay.setAttribute('viewBox', `0 0 ${view.w} ${view.h}`);
        overlay.setAttribute('width', view.w);
        overlay.setAttribute('height', view.h);
        fit();
        resolve();
      };
      img.src = url;
    });
  }

  /* ---- Pointer input: tap, drag-to-pan, pinch, wheel ---- */

  const pointers = new Map();
  let gesture = null;

  viewport.addEventListener('pointerdown', (e) => {
    if (!view.w) return;
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      gesture = { type: 'press', x0: e.clientX, y0: e.clientY, tx: view.tx, ty: view.ty, button: e.button };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: view.s, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, tx: view.tx, ty: view.ty };
    }
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!view.w) return;
    shiftKey = e.shiftKey;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (gesture?.type === 'pinch' && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = viewport.getBoundingClientRect();
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (gesture.s0 * d) / gesture.d0));
      const k = s / gesture.s0;
      const m0 = { x: gesture.mid.x - r.left, y: gesture.mid.y - r.top };
      view.s = s;
      view.tx = mid.x - (m0.x - gesture.tx) * k;
      view.ty = mid.y - (m0.y - gesture.ty) * k;
      applyTransform();
      return;
    }

    if (gesture && (gesture.type === 'press' || gesture.type === 'pan')) {
      const dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
      if (gesture.type === 'press' && Math.hypot(dx, dy) > TAP_SLOP) gesture.type = 'pan';
      if (gesture.type === 'pan') {
        view.tx = gesture.tx + dx;
        view.ty = gesture.ty + dy;
        viewport.classList.add('is-dragging');
        applyTransform();
        return;
      }
    }

    if (e.pointerType === 'mouse') {
      hover = toImage(e.clientX, e.clientY);
      if (tool !== 'pan') render();
    }
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (gesture?.type === 'press' && pointers.size === 0 && gesture.button === 0) tap(toImage(e.clientX, e.clientY), e);
    if (gesture?.type === 'pinch' || gesture?.type === 'pan') render();
    if (pointers.size === 0) { gesture = null; viewport.classList.remove('is-dragging'); }
  };
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); gesture = null; });
  viewport.addEventListener('pointerleave', () => { hover = null; if (tool !== 'pan') render(); });

  viewport.addEventListener('wheel', (e) => {
    if (!view.w) return;
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  new ResizeObserver(() => { if (view.w && needsFit) fit(); }).observe(viewport);

  /* ---- Tools ---- */

  function setTool(next) {
    tool = next;
    temp = null;
    viewport.dataset.tool = next;
    setNote(toolNote());
    render();
  }

  function toolNote() {
    const p = getProject();
    if (!view.w) return t('note.noMap');
    if (tool === 'point' && !p.beds.length) return t('note.point.noBed');
    if (tool === 'ground' && !p.section) return t('note.ground.noSection');
    if (tool === 'scale' && temp) return t('note.scale.second');
    if (tool === 'section' && temp) return t('note.section.second');
    return t(`note.tool.${tool}`);
  }

  function tap(pt, e) {
    const p = getProject();
    if (pt.x < 0 || pt.y < 0 || pt.x > view.w || pt.y > view.h) return;

    if (tool === 'scale') {
      if (!temp) { temp = pt; setNote(toolNote()); render(); return; }
      const b = e.shiftKey ? pt : { x: pt.x, y: temp.y };   // snap level unless Shift
      const length = getBarLength();
      const a = temp;
      temp = null;
      if (Math.hypot(b.x - a.x, b.y - a.y) < 4) { setNote(t('note.scale.tooShort')); render(); return; }
      update('scale', (d) => { d.scale = { a, b, length }; });
      const k = mpp();
      setNote(t('note.scale.done', { len: fmt(length), px: fmt(Math.hypot(b.x - a.x, b.y - a.y)), mpp: fmt(k, 2) }));
      return;
    }

    if (tool === 'section') {
      if (!temp) { temp = pt; setNote(toolNote()); render(); return; }
      const a = temp;
      temp = null;
      update('section', (d) => { d.section = { a, b: pt }; });
      const k = mpp();
      setNote(k ? t('note.section.done', { len: fmt(Math.hypot(pt.x - a.x, pt.y - a.y) * k) }) : t('note.section.doneNoScale'));
      return;
    }

    if (tool === 'point') {
      const h = getElevation();
      if (!Number.isFinite(h)) { setNote(t('note.point.noElev')); return; }
      let bedId = p.activeBed;
      update('point', (d) => {
        if (!d.beds.length) {
          bedId = newId('b');
          d.beds.push({ id: bedId, name: t('app.bedDefault', { n: 1 }), color: '#b5432e' });
          d.activeBed = bedId;
        }
        if (!d.beds.some((b) => b.id === bedId)) bedId = d.activeBed = d.beds[0].id;
        d.points.push({ id: newId('p'), bed: bedId, h, x: pt.x, y: pt.y });
      });
      const ln = derived().lines.find((l) => l.bed === bedId && l.h === h);
      setNote(ln && ln.pts.length >= 2
        ? t('note.point.line', { n: ln.pts.length, h, len: ln.lengthM != null ? fmt(ln.lengthM) : '—' })
        : t('note.point.first', { h }));
      return;
    }

    if (tool === 'ground') {
      if (!p.section) { setNote(t('note.ground.noSection')); return; }
      const h = getElevation();
      if (!Number.isFinite(h)) { setNote(t('note.point.noElev')); return; }
      const s = snapToSection(pt);
      update('ground', (d) => { d.ground.push({ id: newId('g'), h, x: s.x, y: s.y }); });
      setNote(t('note.ground.done', { h }));
      return;
    }

    if (tool === 'erase') {
      const hit = nearest(pt, 12 / view.s);
      if (!hit) { setNote(t('note.erase.miss')); return; }
      update('erase', (d) => {
        d.points = d.points.filter((q) => q.id !== hit.id);
        d.ground = d.ground.filter((q) => q.id !== hit.id);
      });
      setNote(t('note.erase.done'));
    }
  }

  /** Nearest mark (contact point or ground mark) within r image px. */
  function nearest(pt, r) {
    const p = getProject();
    let best = null, bd = r;
    for (const q of [...p.points, ...p.ground]) {
      const d = Math.hypot(q.x - pt.x, q.y - pt.y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  /* ---- Overlay ---- */

  function render() {
    overlay.innerHTML = view.w && view.s > 0 ? build(1 / view.s, true) : '';
  }

  /**
   * Overlay markup. u = one screen pixel in image px (1 / zoom on screen;
   * larger for export so lettering scales with the image).
   */
  function build(u, live) {
    const p = getProject();
    const D = derived();
    const color = (bedId) => safeColor(p.beds.find((b) => b.id === bedId)?.color);
    const out = [];
    const text = (x, y, str, { size = 12, weight = 600, fill = '#14181d', anchor = 'middle', mono = false } = {}) =>
      out.push(`<text x="${x}" y="${y}" font-size="${size * u}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}" stroke-width="${3.5 * u}" class="halo${mono ? ' mono' : ''}">${esc(str)}</text>`);
    const line = (a, b, stroke, w, dash = '') =>
      out.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" stroke-width="${w * u}"${dash ? ` stroke-dasharray="${dash.split(' ').map((v) => v * u).join(' ')}"` : ''}/>`);
    const dot = (c, r, fill, stroke, w = 1.5) =>
      out.push(`<circle cx="${c.x}" cy="${c.y}" r="${r * u}" fill="${fill}" stroke="${stroke}" stroke-width="${w * u}"/>`);

    // Scale measurement.
    if (p.scale) {
      const { a, b, length } = p.scale;
      line(a, b, '#2847a8', 2);
      for (const q of [a, b]) line({ x: q.x, y: q.y - 9 * u }, { x: q.x, y: q.y + 9 * u }, '#2847a8', 2);
      text((a.x + b.x) / 2, Math.min(a.y, b.y) - 12 * u, `${fmt(length)} m`, { fill: '#2847a8', mono: true });
    }

    // Section line with distance ticks from X.
    if (p.section) {
      const { a, b } = p.section;
      line(a, b, '#14181d', 1.6, '9 5');
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
      const k = D.mpp;
      if (k) {
        const steps = [50, 100, 250, 500, 1000, 2000, 5000];
        const step = steps.find((s) => (s / k) * view.s >= 70) || 5000;
        for (let m = 0; m <= L * k + 1e-6; m += step) {
          const c = { x: a.x + (ux * m) / k, y: a.y + (uy * m) / k };
          line({ x: c.x + uy * 5 * u, y: c.y - ux * 5 * u }, { x: c.x - uy * 5 * u, y: c.y + ux * 5 * u }, '#14181d', 1.2);
          text(c.x + uy * 13 * u, c.y - ux * 13 * u, fmt(m), { size: 10.5, weight: 500, mono: true });
        }
      }
      for (const [q, n] of [[a, 'X'], [b, 'Y']]) {
        dot(q, 3.5, '#14181d', '#ffffff', 1);
        const out = n === 'X' ? -1 : 1;   // letter beyond the end of the line
        text(q.x + ux * out * 16 * u, q.y + uy * out * 16 * u + 5 * u, n, { size: 16, weight: 750 });
      }
    }

    // Structure contours, each straight and in its bed's colour.
    for (const ln of D.lines) {
      if (!ln.fit) continue;
      const c = color(ln.bed);
      const { a, b, dir, length } = ln.fit;
      const ext = Math.max(length * 0.06, 14 * u);
      const A = { x: a.x - dir.x * ext, y: a.y - dir.y * ext };
      const B = { x: b.x + dir.x * ext, y: b.y + dir.y * ext };
      line(A, B, c, 2);
      const top = A.y < B.y ? A : B;
      const off = top === A ? -1 : 1;
      const lab = { x: top.x + dir.x * off * 14 * u, y: top.y + dir.y * off * 14 * u };
      text(lab.x, lab.y + 4 * u, ln.lengthM != null ? `${ln.h} m · ${fmt(ln.lengthM)} m` : `${ln.h} m`, { fill: c, size: 12, mono: true });
      if (ln.onSection) {
        const q = ln.onSection.point;
        line({ x: q.x, y: q.y - 8 * u }, { x: q.x, y: q.y + 8 * u }, c, 2.4);
        if (ln.onSection.dM != null) text(q.x + 4 * u, q.y + 22 * u, fmt(ln.onSection.dM), { fill: c, size: 11.5, weight: 700, mono: true });
      }
    }

    // Strike/dip symbol per bed, between its first pair of contours.
    for (const att of D.attitudes) {
      const pair = att.pairs[0];
      const c1 = pair.upper.fit.centroid, c2 = pair.lower.fit.centroid;
      const m = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
      const sv = { x: Math.sin((att.strike * Math.PI) / 180), y: -Math.cos((att.strike * Math.PI) / 180) };
      const dv = { x: Math.sin((att.dipDirection * Math.PI) / 180), y: -Math.cos((att.dipDirection * Math.PI) / 180) };
      const c = color(att.bed);
      out.push(`<rect x="${m.x - 22 * u}" y="${m.y - 22 * u}" width="${118 * u}" height="${44 * u}" fill="#ffffff" fill-opacity=".86"/>`);
      line({ x: m.x - sv.x * 18 * u, y: m.y - sv.y * 18 * u }, { x: m.x + sv.x * 18 * u, y: m.y + sv.y * 18 * u }, '#14181d', 2.6);
      line(m, { x: m.x + dv.x * 9 * u, y: m.y + dv.y * 9 * u }, '#14181d', 2.6);
      text(m.x + 16 * u, m.y + 5 * u, `${bearing3(att.strike)}/${Math.round(att.dip)} ${compass(att.dipDirection)}`, { anchor: 'start', size: 13, weight: 700, mono: true, fill: c });
    }

    // Line of intersection from the stereonet, when switched on.
    if (p.lineOnMap) {
      const { A, B, line: L } = chosenIntersection();
      if (L) {
        const src = p.points.filter((q) => q.bed === A?.bed || q.bed === B?.bed);
        const c = src.length
          ? { x: src.reduce((s2, q) => s2 + q.x, 0) / src.length, y: src.reduce((s2, q) => s2 + q.y, 0) / src.length }
          : { x: view.w / 2, y: view.h / 2 };
        const v = { x: Math.sin((L.trend * Math.PI) / 180), y: -Math.cos((L.trend * Math.PI) / 180) };
        const tail = { x: c.x - v.x * 30 * u, y: c.y - v.y * 30 * u };
        const tip = { x: c.x + v.x * 30 * u, y: c.y + v.y * 30 * u };
        const n = { x: -v.y, y: v.x };
        out.push(`<rect x="${c.x - 38 * u}" y="${c.y - 38 * u}" width="${76 * u}" height="${76 * u}" fill="#ffffff" fill-opacity=".8" stroke="#14181d" stroke-width="${u}" stroke-dasharray="${3 * u} ${3 * u}"/>`);
        line(tail, tip, '#14181d', 2.6);
        out.push(`<path d="M${tip.x} ${tip.y}L${tip.x - v.x * 10 * u + n.x * 5 * u} ${tip.y - v.y * 10 * u + n.y * 5 * u}L${tip.x - v.x * 10 * u - n.x * 5 * u} ${tip.y - v.y * 10 * u - n.y * 5 * u}Z" fill="#14181d"/>`);
        text(c.x, c.y + 52 * u, lineLabel(L), { size: 13, weight: 700, mono: true });
      }
    }

    // Marks.
    for (const pt of p.points) {
      dot(pt, 5, '#ffffff', color(pt.bed), 2.4);
      text(pt.x + 8 * u, pt.y - 7 * u, pt.h, { anchor: 'start', size: 10, weight: 600, mono: true, fill: color(pt.bed) });
    }
    for (const g of p.ground) {
      out.push(`<path d="M${g.x} ${g.y - 7 * u}L${g.x + 6 * u} ${g.y + 4 * u}L${g.x - 6 * u} ${g.y + 4 * u}Z" fill="#a0653a" stroke="#ffffff" stroke-width="${1 * u}"/>`);
      text(g.x, g.y - 11 * u, g.h, { size: 10, weight: 600, mono: true, fill: '#7d4a24' });
    }

    if (!live) return out.join('');

    // Previews: dashed until the click commits.
    if (temp && (tool === 'scale' || tool === 'section')) {
      dot(temp, 4, tool === 'scale' ? '#2847a8' : '#14181d', '#ffffff', 1);
      if (hover) {
        const end = tool === 'scale' && !shiftKey ? { x: hover.x, y: temp.y } : hover;
        line(temp, end, tool === 'scale' ? '#2847a8' : '#14181d', 1.4, '5 4');
        const k = D.mpp;
        const len = Math.hypot(end.x - temp.x, end.y - temp.y);
        text(end.x + 10 * u, end.y - 10 * u, k && tool === 'section' ? `${fmt(len * k)} m` : `${fmt(len)} px`, { anchor: 'start', size: 11, mono: true });
      }
    }
    if (hover && tool === 'point') {
      const h = getElevation();
      const same = p.points.filter((q) => q.bed === p.activeBed && q.h === h);
      const c = color(p.activeBed);
      if (same.length) {
        const nearestPt = same.reduce((a, b) => (Math.hypot(b.x - hover.x, b.y - hover.y) < Math.hypot(a.x - hover.x, a.y - hover.y) ? b : a));
        line(nearestPt, hover, c, 1.4, '4 4');
      }
      dot(hover, 5, 'none', c, 1.5);
    }
    if (hover && tool === 'ground' && p.section) {
      const s = snapToSection(hover);
      out.push(`<path d="M${s.x} ${s.y - 7 * u}L${s.x + 6 * u} ${s.y + 4 * u}L${s.x - 6 * u} ${s.y + 4 * u}Z" fill="none" stroke="#a0653a" stroke-width="${1.5 * u}"/>`);
    }
    if (hover && tool === 'erase') {
      const hit = nearest(hover, 12 / view.s);
      if (hit) dot(hit, 9, 'none', '#b5432e', 2);
    }

    return out.join('');
  }

  return {
    setImage, fit, render, setTool,
    getTool: () => tool,
    cancel() { temp = null; setNote(toolNote()); render(); },
    zoomIn() { const r = viewport.getBoundingClientRect(); zoomAt(1.25, r.width / 2, r.height / 2); },
    zoomOut() { const r = viewport.getBoundingClientRect(); zoomAt(0.8, r.width / 2, r.height / 2); },
    get zoom() { return view.s; },
    /** Map image + overlay as one PNG blob, lettering sized for print. */
    async exportPNG() {
      if (!view.w) return null;
      const u = Math.max(1, view.w / 1600);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${view.w}" height="${view.h}" viewBox="0 0 ${view.w} ${view.h}"><style>text{font-family:Arial,Helvetica,sans-serif}.mono{font-family:Menlo,Consolas,monospace}.halo{paint-order:stroke;stroke:#fff;stroke-linejoin:round}</style>${build(u, false)}</svg>`;
      const over = new Image();
      await new Promise((ok, fail) => { over.onload = ok; over.onerror = fail; over.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
      const c = document.createElement('canvas');
      c.width = view.w; c.height = view.h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      ctx.drawImage(over, 0, 0);
      return new Promise((ok) => c.toBlob(ok, 'image/png'));
    },
    refreshNote() { setNote(toolNote()); },
  };
}
