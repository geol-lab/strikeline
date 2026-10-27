/**
 * demo-model.js — the synthetic lab map shown on the landing page.
 *
 * The terrain and three dipping contacts are defined as functions, then
 * the demo runs the same construction a student does in the workspace:
 * mark contact × contour intersections, fit straight structure
 * contours, compute strike/dip, and project everything onto X–Y.
 * Nothing here is hard-coded output: every number shown is computed.
 */

import { DEG } from '../geo/vector.js';
import { isolines } from '../geo/contour.js';
import { fitLine } from '../geo/fit.js';
import { strikeDip } from '../geo/structure.js';
import { segmentIntersection, lineSegmentIntersection, dist } from '../geo/vector.js';

/** Map extent in metres and drawing scale (metres per SVG unit). */
export const MAP = { w: 2000, h: 1000, mpu: 2.5 };

/** Topographic contour interval, metres. */
export const INTERVAL = 100;

/* ---- Synthetic geology ---- */

/** Ground surface: an E–W ridge between two valleys, tilted gently east. */
export function ground(x, y) {
  return (
    320 +
    150 * Math.cos((2 * Math.PI * (y - 520)) / 1000) +
    0.07 * (1000 - x) +
    28 * Math.sin(x / 210 + y / 330)
  );
}

/** True attitude of every contact: strike 002°, dip 14° E. */
const DIP = 14;
const DIP_DIR = 92;
const U = { x: Math.sin(DIP_DIR * DEG), y: Math.cos(DIP_DIR * DEG) };
const TAN = Math.tan(DIP * DEG);

/** Beds from oldest to youngest. A contact is the base of the bed above it. */
export const BEDS = [
  { id: 'a', key: 'bed.limestone', color: 'var(--bed-1)' },
  { id: 'b', key: 'bed.shale', color: 'var(--bed-2)' },
  { id: 'c', key: 'bed.sandstone', color: 'var(--bed-3)' },
  { id: 'd', key: 'bed.conglomerate', color: 'var(--bed-4)' },
];

/** Contacts: elevation of each at the map centre (1000, 500). */
export const CONTACTS = [
  { bed: 1, z0: 290 },
  { bed: 2, z0: 360 },
  { bed: 3, z0: 435 },
];

export const contactZ = (c, x, y) => c.z0 - TAN * ((x - 1000) * U.x + (y - 500) * U.y);

/** Which bed crops out at a ground point. */
export function bedAt(x, y) {
  const z = ground(x, y);
  let bed = 0;
  for (const c of CONTACTS) if (z >= contactZ(c, x, y)) bed = c.bed;
  return bed;
}

/** Section line X–Y (map metres). */
export const SECTION = { X: { x: 60, y: 430 }, Y: { x: 1940, y: 430 } };

/* ---- Construction ---- */

export function buildDemo() {
  const box = { x0: 0, y0: 0, x1: MAP.w, y1: MAP.h };

  // 1. Topographic contours.
  const levels = [];
  for (let h = 100; h <= 600; h += INTERVAL) levels.push(h);
  const topo = levels.map((h) => ({ h, lines: isolines(ground, box, h, 20) })).filter((t) => t.lines.length);

  // 2. Outcrop trace of each contact: where the ground meets the contact.
  const outcrops = CONTACTS.map((c) => ({
    contact: c,
    lines: isolines((x, y) => ground(x, y) - contactZ(c, x, y), box, 0, 12),
  }));

  // 3. Marks: where an outcrop crosses a topographic contour.
  //    That point has a known elevation: the contour's value.
  const marks = [];
  outcrops.forEach((o) => {
    topo.forEach((t) => {
      for (const ol of o.lines) for (const tl of t.lines) {
        for (let i = 0; i < ol.length - 1; i++) for (let j = 0; j < tl.length - 1; j++) {
          const hit = segmentIntersection(ol[i], ol[i + 1], tl[j], tl[j + 1]);
          if (hit) marks.push({ bed: o.contact.bed, h: t.h, x: hit.point.x, y: hit.point.y });
        }
      }
    });
  });

  // 4. Structure contours: fit a straight line through each bed+elevation group.
  const groups = new Map();
  for (const m of marks) {
    const k = `${m.bed}:${m.h}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(m);
  }
  const lines = [];
  for (const [k, pts] of groups) {
    if (pts.length < 2) continue;
    const [bed, h] = k.split(':').map(Number);
    const fit = fitLine(pts);
    if (!fit || fit.length < 150) continue;
    // Where the line crosses the section, measured from X.
    const sx = SECTION.Y.x - SECTION.X.x, sy = SECTION.Y.y - SECTION.X.y;
    const hit = lineSegmentIntersection(fit.centroid, fit.dir, SECTION.X, SECTION.Y);
    lines.push({
      bed, elevation: h, fit, pts,
      onSection: hit ? { point: hit.point, d: hit.u * Math.hypot(sx, sy) } : null,
    });
  }
  lines.sort((a, b) => a.bed - b.bed || b.elevation - a.elevation);

  // 5. Strike/dip per bed from its two most widely spaced contours.
  const attitudes = CONTACTS.map((c) => {
    const own = lines.filter((l) => l.bed === c.bed);
    if (own.length < 2) return null;
    const hi = own[0], lo = own[own.length - 1];
    const sd = strikeDip(hi, lo);
    return sd && { bed: c.bed, ...sd, at: hi.fit.centroid };
  }).filter(Boolean);

  // 6. Section profile along X–Y.
  const L = dist(SECTION.X, SECTION.Y);
  const profile = [];
  for (let d = 0; d <= L; d += 10) {
    const t = d / L;
    const x = SECTION.X.x + (SECTION.Y.x - SECTION.X.x) * t;
    const y = SECTION.X.y + (SECTION.Y.y - SECTION.X.y) * t;
    profile.push({ d, z: ground(x, y), contacts: CONTACTS.map((c) => contactZ(c, x, y)) });
  }
  // Points that sit on the section line set its vertical range.
  const onLine = lines.filter((l) => l.onSection).map((l) => l.elevation);
  const zs = [...onLine, ...profile.map((p) => p.z)];
  const zMin = Math.floor((Math.min(...zs) - 50) / 100) * 100;
  const zMax = Math.ceil((Math.max(...zs) + 20) / 100) * 100;

  return { topo, outcrops, marks, lines, attitudes, profile, section: { L, zMin, zMax } };
}
