/**
 * vector.js — small 2D/3D vector helpers.
 * Pure math, no DOM. Map coordinates are metres: x = east, y = north.
 */

export const DEG = Math.PI / 180;

export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a, k) => ({ x: a.x * k, y: a.y * k });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const len = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const norm = (a) => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
};

/** Normalise an angle in degrees to [0, 360). */
export const wrap360 = (deg) => ((deg % 360) + 360) % 360;

/** Azimuth (bearing clockwise from north, degrees) of a direction vector. */
export const azimuth = (v) => wrap360(Math.atan2(v.x, v.y) / DEG);

/** Unit vector pointing along an azimuth. */
export const fromAzimuth = (deg) => ({ x: Math.sin(deg * DEG), y: Math.cos(deg * DEG) });

/** Signed perpendicular distance from point p to the infinite line (a, dir). */
export function lineDistance(p, a, dir) {
  const d = norm(dir);
  return (p.x - a.x) * d.y - (p.y - a.y) * d.x;
}

/**
 * Intersection of two segments p1–p2 and q1–q2.
 * Returns { point, t, u } (t along p, u along q, both 0..1) or null.
 */
export function segmentIntersection(p1, p2, q1, q2) {
  const r = sub(p2, p1);
  const s = sub(q2, q1);
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const qp = sub(q1, p1);
  const t = (qp.x * s.y - qp.y * s.x) / den;
  const u = (qp.x * r.y - qp.y * r.x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { point: add(p1, scale(r, t)), t, u };
}

/** Intersection of an infinite line (a, dir) with the segment q1–q2, or null. */
export function lineSegmentIntersection(a, dir, q1, q2) {
  const s = sub(q2, q1);
  const den = dir.x * s.y - dir.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const qa = sub(q1, a);
  const t = (qa.x * s.y - qa.y * s.x) / den;
  const u = (qa.x * dir.y - qa.y * dir.x) / den;
  if (u < 0 || u > 1) return null;
  return { point: add(a, scale(dir, t)), t, u };
}

/* ---- 3D (east, north, up) ---- */

export const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm3 = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
