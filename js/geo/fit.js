/**
 * fit.js — straight-line fitting for structure contours.
 *
 * Uses orthogonal (total) least squares: the line minimises the
 * perpendicular distance of every marked point, so it works equally
 * well for N–S, E–W or diagonal lines (ordinary y-on-x regression
 * breaks down for near-vertical lines, which strike lines often are).
 */

import { dist } from './vector.js';

/**
 * Fit a straight line through two or more points.
 * @param {{x:number,y:number}[]} pts
 * @returns {{ centroid, dir, a, b, length, rms, maxDev } | null}
 *   dir     unit direction vector of the line
 *   a, b    end points: the extreme projections of the input points
 *   length  |a–b| in the same units as the input
 *   rms     root-mean-square perpendicular deviation of the points
 *   maxDev  largest perpendicular deviation (to flag a bad mark)
 */
export function fitLine(pts) {
  if (!pts || pts.length < 2) return null;
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p.x, 0) / n;
  const cy = pts.reduce((s, p) => s + p.y, 0) / n;

  // Covariance matrix of the centred points.
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) {
    const dx = p.x - cx, dy = p.y - cy;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }

  // Principal axis = direction of greatest spread.
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const dir = { x: Math.cos(theta), y: Math.sin(theta) };

  // Project points onto the axis to find the line's extent and residuals.
  let tMin = Infinity, tMax = -Infinity, sq = 0, maxDev = 0;
  for (const p of pts) {
    const dx = p.x - cx, dy = p.y - cy;
    const t = dx * dir.x + dy * dir.y;
    const d = Math.abs(dx * dir.y - dy * dir.x);
    tMin = Math.min(tMin, t); tMax = Math.max(tMax, t);
    sq += d * d; maxDev = Math.max(maxDev, d);
  }

  const a = { x: cx + dir.x * tMin, y: cy + dir.y * tMin };
  const b = { x: cx + dir.x * tMax, y: cy + dir.y * tMax };
  return {
    centroid: { x: cx, y: cy },
    dir,
    a,
    b,
    length: dist(a, b),
    rms: Math.sqrt(sq / n),
    maxDev,
  };
}
