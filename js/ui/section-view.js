/**
 * section-view.js — the cross-section along X–Y, drawn beneath the map.
 *
 * Horizontal scale = the map's: one image pixel of the map is one pixel
 * of section at the same zoom. Vertical scale is the same, times the
 * vertical exaggeration. The height comes from the points on the line:
 * ground marks (topography) and the crossings of structure contours.
 */

import { getProject, derived } from '../core/state.js';
import { t, fmt } from '../i18n.js';
import { apparentDip, bearing3, compass } from '../geo/structure.js';

const MARGIN = { l: 54, r: 28, t: 30, b: 34 };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#14181d');

export function renderSection(svg, { zoom, fitWidth, meta, note }) {
  const p = getProject();
  const D = derived();
  const sec = D.section;

  if (!p.section || !D.mpp) {
    svg.innerHTML = '';
    svg.setAttribute('width', 0);
    svg.setAttribute('height', 0);
    meta.textContent = '';
    note.textContent = !D.mpp ? t('sec.needScale') : t('sec.needLine');
    return;
  }

  const contacts = sec.contacts;
  const ground = [...sec.ground].sort((a, b) => a.d - b.d);
  const all = [...contacts.map((c) => c.h), ...ground.map((g) => g.h)];

  meta.textContent = t('sec.meta', { len: fmt(sec.lengthM), ve: fmt(p.ve, p.ve % 1 ? 1 : 0) });

  if (!all.length) {
    svg.innerHTML = '';
    svg.setAttribute('width', 0);
    svg.setAttribute('height', 0);
    note.textContent = t('sec.needPoints');
    return;
  }

  // Vertical range from the points on the line, padded to the contour interval.
  const step = p.interval || 100;
  const zMin = Math.floor((Math.min(...all) - step / 2) / step) * step;
  const zMax = Math.ceil((Math.max(...all) + step / 2) / step) * step;

  // Pixels per metre on screen: same as the map at this zoom,
  // or, on the full-width tab, whatever makes X–Y fill the width.
  if (fitWidth) zoom = Math.max(0.05, (fitWidth - MARGIN.l - MARGIN.r) / (sec.lengthM / D.mpp));
  const kx = zoom / D.mpp;
  const ky = kx * p.ve;
  const W = sec.lengthM * kx;
  const H = (zMax - zMin) * ky;
  const X = (d) => MARGIN.l + d * kx;
  const Y = (z) => MARGIN.t + (zMax - z) * ky;

  svg.setAttribute('width', Math.ceil(W + MARGIN.l + MARGIN.r));
  svg.setAttribute('height', Math.ceil(H + MARGIN.t + MARGIN.b));

  const out = [];
  const txt = (x, y, s, a = {}) => out.push(`<text x="${x}" y="${y}" font-size="${a.size || 11}" font-weight="${a.weight || 500}" text-anchor="${a.anchor || 'middle'}" fill="${a.fill || '#434d56'}"${a.mono !== false ? ' class="mono"' : ''}>${esc(s)}</text>`);

  // Grid and axes.
  out.push(`<rect x="${X(0)}" y="${Y(zMax)}" width="${W}" height="${H}" fill="#fbfcfb" stroke="#14181d"/>`);
  for (let z = zMin; z <= zMax; z += step) {
    out.push(`<line x1="${X(0)}" x2="${X(sec.lengthM)}" y1="${Y(z)}" y2="${Y(z)}" stroke="#c3cbc8" stroke-width=".8"/>`);
    txt(X(0) - 8, Y(z) + 4, z, { anchor: 'end' });
  }
  const dSteps = [50, 100, 250, 500, 1000, 2000, 5000];
  const dStep = dSteps.find((s) => s * kx >= 70) || 5000;
  for (let d = 0; d <= sec.lengthM + 1e-6; d += dStep) {
    out.push(`<line x1="${X(d)}" x2="${X(d)}" y1="${Y(zMin)}" y2="${Y(zMin) + 5}" stroke="#14181d"/>`);
    txt(X(d), Y(zMin) + 18, fmt(d));
  }
  txt(X(0), MARGIN.t - 10, 'X', { size: 15, weight: 750, fill: '#14181d', mono: false });
  txt(X(sec.lengthM), MARGIN.t - 10, 'Y', { size: 15, weight: 750, fill: '#14181d', mono: false });
  txt(X(0) - 8, MARGIN.t - 12, 'm', { anchor: 'end' });

  // Contacts: one polyline per bed through its points, apparent dips between them.
  const findings = [];
  for (const bed of p.beds) {
    const pts = contacts.filter((c) => c.bed === bed.id).sort((a, b) => a.d - b.d);
    if (!pts.length) continue;
    const c = safeColor(bed.color);
    if (pts.length > 1) out.push(`<polyline fill="none" stroke="${c}" stroke-width="2.2" points="${pts.map((q) => `${X(q.d)},${Y(q.h)}`).join(' ')}"/>`);
    pts.forEach((q, i) => {
      out.push(`<circle cx="${X(q.d)}" cy="${Y(q.h)}" r="4" fill="${c}" stroke="#ffffff" stroke-width="1.5"/>`);
      if (i > 0) {
        const a = pts[i - 1];
        const dd = q.d - a.d, dz = a.h - q.h;
        if (dd > 1) {
          const ang = (Math.atan(Math.abs(dz) / dd) * 180) / Math.PI;
          const towards = dz > 0 ? ' →' : dz < 0 ? ' ←' : '';
          txt((X(a.d) + X(q.d)) / 2, (Y(a.h) + Y(q.h)) / 2 + 16, `${Math.round(ang)}°${towards}`, { fill: c, weight: 700 });
        }
      }
      // Hinges: a local high or low along the contact.
      if (i > 0 && i < pts.length - 1) {
        const hi = q.h > pts[i - 1].h && q.h >= pts[i + 1].h;
        const lo = q.h < pts[i - 1].h && q.h <= pts[i + 1].h;
        if (hi || lo) {
          const y = Y(q.h) + (hi ? -12 : 12);
          out.push(`<path d="M${X(q.d) - 5} ${y + (hi ? 4 : -4)}L${X(q.d)} ${y + (hi ? -4 : 4)}L${X(q.d) + 5} ${y + (hi ? 4 : -4)}" fill="none" stroke="${c}" stroke-width="1.6"/>`);
          findings.push(t(hi ? 'sec.antiform' : 'sec.synform', { bed: bed.name, d: fmt(q.d) }));
        }
      }
    });
  }

  // Topography through the ground marks.
  if (ground.length > 1) {
    out.push(`<polyline fill="none" stroke="#14181d" stroke-width="2" stroke-linejoin="round" points="${ground.map((g) => `${X(g.d)},${Y(g.h)}`).join(' ')}"/>`);
  }
  for (const g of ground) {
    out.push(`<path d="M${X(g.d)} ${Y(g.h) - 6}L${X(g.d) + 5} ${Y(g.h) + 3}L${X(g.d) - 5} ${Y(g.h) + 3}Z" fill="#a0653a"/>`);
  }

  svg.innerHTML = out.join('');

  const notes = [];
  if (ground.length < 2) notes.push(t('sec.needGround'));
  notes.push(...findings);
  if (findings.length) notes.push(t('sec.interpret'));
  note.textContent = notes.join(' ');
}

/**
 * Key and attitude table for the full-width section tab: each bed's
 * true dip and the apparent dip it shows in this section line.
 */
export function renderSectionExtras(keyEl, tableEl) {
  const p = getProject();
  const D = derived();
  keyEl.innerHTML = p.beds.map((b) => `<li><span class="sw" style="border-color:${safeColor(b.color)}"></span>${esc(b.name)}</li>`).join('')
    + `<li><span class="sw sw--ground"></span>${esc(t('secTab.ground'))}</li>`;

  if (!p.section || !D.attitudes.length) {
    tableEl.innerHTML = `<caption>${esc(t('secTab.noAtt'))}</caption>`;
    return;
  }
  // Section bearing in map terms (image y points down).
  const az = ((Math.atan2(p.section.b.x - p.section.a.x, -(p.section.b.y - p.section.a.y)) * 180) / Math.PI + 360) % 360;
  const rows = D.attitudes.map((a) => {
    const bed = p.beds.find((b) => b.id === a.bed);
    const app = apparentDip(a.dip, a.strike, az);
    return `<tr><td><span class="sw" style="border-color:${safeColor(bed?.color)}"></span>${esc(bed?.name ?? '')}</td><td>${bearing3(a.strike)}/${Math.round(a.dip)} ${compass(a.dipDirection)}</td><td>${fmt(app, 1)}°</td></tr>`;
  }).join('');
  tableEl.innerHTML = `<thead><tr><th>${esc(t('secTab.bed'))}</th><th>${esc(t('secTab.true'))}</th><th>${esc(t('secTab.apparent'))}</th></tr></thead><tbody>${rows}</tbody><caption>${esc(t('secTab.azimuth', { az: bearing3(az) }))}</caption>`;
}
