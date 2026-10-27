/**
 * planes.js — the planes the stereonet works with.
 * Two sources: every bed whose strike/dip was measured on the map, and
 * planes typed in by hand (a reading from the handout, a fault, …).
 * All strikes are right-hand rule (dip direction = strike + 90°).
 */

import { getProject, derived } from './state.js';
import { toRightHand, intersection } from '../geo/stereonet.js';

/** Every plane available to the net, in a stable order. */
export function allPlanes() {
  const p = getProject();
  const D = derived();
  const fromBeds = D.attitudes.map((a) => {
    const bed = p.beds.find((b) => b.id === a.bed);
    return { id: `bed:${a.bed}`, name: bed?.name ?? '', strike: a.strike, dip: a.dip, color: bed?.color, source: 'map', bed: a.bed };
  });
  const typed = p.planes
    .filter((q) => Number.isFinite(q.strike) && Number.isFinite(q.dip) && q.dip >= 0 && q.dip <= 90)
    .map((q) => ({ id: q.id, name: q.name, ...toRightHand(q.strike, q.dip, q.q), color: q.color, source: 'typed' }));
  return [...fromBeds, ...typed];
}

/** The chosen pair and their line of intersection (or null). */
export function chosenIntersection() {
  const p = getProject();
  const planes = allPlanes();
  const A = planes.find((q) => q.id === p.netA);
  const B = planes.find((q) => q.id === p.netB);
  if (!A || !B || A.id === B.id) return { A, B, line: null };
  return { A, B, line: intersection(A, B) };
}
