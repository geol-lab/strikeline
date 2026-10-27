/**
 * structure.js — strike and dip from structure contours.
 *
 * A structure contour is a straight line joining points of one surface
 * (a bed contact) at one elevation. Its bearing is the strike. Two
 * contours of the same surface at different elevations give the dip:
 *
 *     tan(dip) = Δh / d
 *
 * where Δh is the elevation difference and d the horizontal,
 * perpendicular spacing between the two lines. The surface dips
 * towards the lower line.
 */

import { DEG, wrap360, azimuth, lineDistance } from './vector.js';

const QUADRANTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Compass letter(s) for an azimuth, e.g. 88 → "E". */
export const compass = (deg) => QUADRANTS[Math.round(wrap360(deg) / 45) % 8];

/** Zero-padded three-digit bearing, e.g. 8 → "008". */
export const bearing3 = (deg) => String(Math.round(wrap360(deg)) % 360).padStart(3, '0');

/**
 * Strike and dip of a surface from two of its structure contours.
 * @param {{elevation:number, fit:{centroid, dir}}} upper  any contour
 * @param {{elevation:number, fit:{centroid, dir}}} lower  another contour
 * @returns {{ strike, dip, dipDirection, spacing, label } | null}
 *   strike follows the right-hand rule (dip direction = strike + 90°).
 */
export function strikeDip(c1, c2) {
  const dh = c1.elevation - c2.elevation;
  if (!dh) return null;

  // Use the mean direction of both lines (they are rarely exactly parallel).
  let d1 = c1.fit.dir, d2 = c2.fit.dir;
  if (d1.x * d2.x + d1.y * d2.y < 0) d2 = { x: -d2.x, y: -d2.y };
  const dir = { x: d1.x + d2.x, y: d1.y + d2.y };

  // Perpendicular spacing: distance from the 2nd line's centroid to the 1st line.
  const spacing = Math.abs(lineDistance(c2.fit.centroid, c1.fit.centroid, dir));
  if (spacing < 1e-9) return null;

  // Dip direction: perpendicular to strike, pointing from the higher line to the lower.
  const hi = dh > 0 ? c1 : c2;
  const lo = dh > 0 ? c2 : c1;
  const v = { x: lo.fit.centroid.x - hi.fit.centroid.x, y: lo.fit.centroid.y - hi.fit.centroid.y };
  const l = Math.hypot(dir.x, dir.y);
  const n = { x: dir.y / l, y: -dir.x / l };
  const sign = v.x * n.x + v.y * n.y >= 0 ? 1 : -1;
  const dipDirection = azimuth({ x: n.x * sign, y: n.y * sign });

  const dip = Math.atan(Math.abs(dh) / spacing) / DEG;
  const strike = wrap360(dipDirection - 90);
  return { strike, dip, dipDirection, spacing, label: formatStrikeDip(strike, dip, dipDirection) };
}

/** Lab-sheet notation: "358/12 E". */
export function formatStrikeDip(strike, dip, dipDirection) {
  return `${bearing3(strike)}/${Math.round(dip)} ${compass(dipDirection)}`;
}

/**
 * Apparent dip seen in a section line that makes angle beta with strike:
 *     tan(apparent) = tan(true) · sin(beta)
 */
export function apparentDip(trueDip, strike, sectionAzimuth) {
  const beta = (sectionAzimuth - strike) * DEG;
  return Math.atan(Math.tan(trueDip * DEG) * Math.abs(Math.sin(beta))) / DEG;
}
