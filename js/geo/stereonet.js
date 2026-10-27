/**
 * stereonet.js — equal-area (Schmidt) lower-hemisphere projection.
 *
 * Planes are given as strike/dip with the right-hand rule
 * (dip direction = strike + 90°). Lines are trend/plunge.
 * Internal vectors are [east, north, up].
 */

import { DEG, wrap360, cross3, norm3 } from './vector.js';

/** Convert a lab reading like strike 178, dip 58, quadrant "W" to RHR strike. */
export function toRightHand(strike, dip, quadrant) {
  if (!quadrant) return { strike: wrap360(strike), dip };
  const dd = wrap360(strike + 90);
  const target = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[quadrant.toUpperCase()];
  if (target === undefined) return { strike: wrap360(strike), dip };
  const diff = Math.abs(((dd - target + 540) % 360) - 180);
  return { strike: diff <= 90 ? wrap360(strike) : wrap360(strike + 180), dip };
}

/** Unit vector of a line (trend, plunge), pointing down. */
export function lineVector(trend, plunge) {
  const t = trend * DEG, p = plunge * DEG;
  return [Math.cos(p) * Math.sin(t), Math.cos(p) * Math.cos(t), -Math.sin(p)];
}

/** Trend/plunge of a vector, flipped into the lower hemisphere. */
export function vectorToLine(v) {
  let [e, n, u] = norm3(v);
  if (u > 0) { e = -e; n = -n; u = -u; }
  return { trend: wrap360(Math.atan2(e, n) / DEG), plunge: Math.asin(-u) / DEG };
}

/** Pole (normal) to a plane, as trend/plunge. */
export function pole(strike, dip) {
  return { trend: wrap360(strike + 270), plunge: 90 - dip };
}

/** Line of intersection of two planes (e.g. a fold axis from two limbs). */
export function intersection(p1, p2) {
  const a = pole(p1.strike, p1.dip), b = pole(p2.strike, p2.dip);
  const v = cross3(lineVector(a.trend, a.plunge), lineVector(b.trend, b.plunge));
  if (Math.hypot(...v) < 1e-9) return null; // parallel planes
  return vectorToLine(v);
}

/** Project a line to net coordinates (unit circle; y up = north). */
export function project(trend, plunge) {
  const r = Math.SQRT2 * Math.sin(((90 - plunge) * DEG) / 2);
  return { x: r * Math.sin(trend * DEG), y: r * Math.cos(trend * DEG) };
}

/** Points along a plane's great circle, in net coordinates. */
export function greatCircle(strike, dip, steps = 90) {
  const s = strike * DEG, dd = (strike + 90) * DEG, d = dip * DEG;
  const sv = [Math.sin(s), Math.cos(s), 0];
  const dv = [Math.cos(d) * Math.sin(dd), Math.cos(d) * Math.cos(dd), -Math.sin(d)];
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const r = (i / steps) * Math.PI;
    const v = [0, 1, 2].map((k) => Math.cos(r) * sv[k] + Math.sin(r) * dv[k]);
    const l = vectorToLine(v);
    out.push(project(l.trend, l.plunge));
  }
  return out;
}

/** Small circle of constant angle `cone` around the N–S axis (net graticule). */
export function smallCircle(cone, steps = 60) {
  const a = cone * DEG, out = [];
  for (let i = 0; i <= steps; i++) {
    const f = (i / steps) * Math.PI;
    const v = [Math.sin(a) * Math.cos(f), Math.cos(a), -Math.sin(a) * Math.sin(f)];
    const l = vectorToLine(v);
    out.push(project(l.trend, l.plunge));
  }
  return out;
}
