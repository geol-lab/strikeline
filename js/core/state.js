/**
 * state.js — the project: data, derived geometry, undo, autosave.
 *
 * Everything the student marks is stored in image pixels. Metres come
 * from the scale (metres per pixel). Structure contours, strike/dip and
 * section points are derived from the marks every time, never stored,
 * so every number always traces back to the points that produced it.
 */

import { fitLine } from '../geo/fit.js';
import { strikeDip } from '../geo/structure.js';
import { lineSegmentIntersection, dist } from '../geo/vector.js';
import { put, get } from './storage.js';

/** Default bed colours: ICS chart order, then extra distinct hues. */
export const BED_COLORS = ['#b5432e', '#7b3f93', '#13809b', '#3e7f70', '#c07a12', '#2847a8', '#8a5a2b', '#5b6b1f'];

const PROJECT_KEY = 'project';
const IMAGE_KEY = 'project-image';
const HISTORY_LIMIT = 100;

let uid = Date.now() % 100000;
export const newId = (p) => `${p}${(uid++).toString(36)}`;

/** A fresh, empty project. */
export function blankProject(mapName = '') {
  return {
    version: 1,
    mapName,
    image: null,           // { w, h } natural size of the map image
    scale: null,           // { a, b, length } image px + metres
    section: null,         // { a, b } section line X–Y, image px
    interval: 100,         // contour interval, metres
    ve: 1,                 // vertical exaggeration of the section
    beds: [],              // { id, name, color }
    points: [],            // { id, bed, h, x, y } contact × contour marks
    ground: [],            // { id, h, x, y } contour × section line (topography)
    activeBed: null,
    planes: [],            // { id, name, strike, dip, q, color } typed in on the stereonet
    netA: null,            // plane ids for the intersection: 'bed:<id>' or a plane id
    netB: null,
    showPoles: true,
    lineOnMap: false,      // draw the intersection line on the map
    column: [],            // stratigraphic table rows, youngest first
    legend: null,          // { title, items: [{ kind, label, on }] }; null = default template
    sample: false,
  };
}

/* ======================================================================
   Store: holds the project, notifies views, keeps undo history.
   ====================================================================== */

let project = blankProject();
let imageBlob = null;
const undoStack = [];
const redoStack = [];
const listeners = new Set();
let saveTimer = null;

export const getProject = () => project;
export const getImageBlob = () => imageBlob;

/** Subscribe to changes. fn(project, reason). */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(reason) {
  derivedCache = null;
  listeners.forEach((fn) => fn(project, reason));
  scheduleSave();
}

/**
 * Change the project. The mutator edits a draft copy; the previous
 * version goes on the undo stack.
 */
export function update(reason, mutator) {
  const before = JSON.stringify(project);
  const draft = JSON.parse(before);
  mutator(draft);
  if (JSON.stringify(draft) === before) return;
  undoStack.push(before);
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
  project = draft;
  emit(reason);
}

/** Change view-only settings without an undo step (active bed, VE). */
export function setQuiet(reason, mutator) {
  mutator(project);
  emit(reason);
}

export function undo() {
  if (!undoStack.length) return false;
  redoStack.push(JSON.stringify(project));
  project = JSON.parse(undoStack.pop());
  emit('undo');
  return true;
}

export function redo() {
  if (!redoStack.length) return false;
  undoStack.push(JSON.stringify(project));
  project = JSON.parse(redoStack.pop());
  emit('redo');
  return true;
}

export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;

/** Replace the whole project (new map, opened file). Clears history. */
export function loadProject(next, blob) {
  project = next;
  imageBlob = blob;
  undoStack.length = 0;
  redoStack.length = 0;
  emit('load');
  put(IMAGE_KEY, blob).catch(() => {});
}

/* ---- Autosave to IndexedDB (debounced) ---- */

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    put(PROJECT_KEY, JSON.stringify(project)).catch(() => {});
  }, 400);
}

/** Restore the last session, if any. Returns true on success. */
export async function restore() {
  try {
    const [json, blob] = await Promise.all([get(PROJECT_KEY), get(IMAGE_KEY)]);
    if (!json || !blob) return false;
    project = { ...blankProject(), ...JSON.parse(json) };
    imageBlob = blob;
    emit('load');
    return true;
  } catch {
    return false;
  }
}

/* ======================================================================
   Derived geometry
   ====================================================================== */

let derivedCache = null;

/** Metres per image pixel, or null until the scale is set. */
export function mpp(p = project) {
  if (!p.scale) return null;
  const px = dist(p.scale.a, p.scale.b);
  return px > 0 ? p.scale.length / px : null;
}

/**
 * Everything computed from the marks:
 *  lines     structure contours (one per bed + elevation with ≥2 points)
 *  attitudes strike/dip per bed and per neighbouring pair of contours
 *  section   section line length, contact and ground points along it
 */
export function derived() {
  if (derivedCache) return derivedCache;
  const p = project;
  const k = mpp(p);

  // Structure contours: group marks by bed and elevation, fit a straight line.
  const groups = new Map();
  for (const pt of p.points) {
    const key = `${pt.bed}|${pt.h}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pt);
  }
  const lines = [];
  for (const [key, pts] of groups) {
    const [bed, h] = key.split('|');
    const fit = pts.length >= 2 ? fitLine(pts) : null;
    lines.push({ id: key, bed, h: Number(h), pts, fit });
  }

  // Where each line crosses the section line, in metres from X.
  const sec = p.section;
  const secLenPx = sec ? dist(sec.a, sec.b) : 0;
  for (const ln of lines) {
    ln.lengthM = ln.fit && k ? ln.fit.length * k : null;
    ln.rmsM = ln.fit && k ? ln.fit.rms * k : null;
    ln.onSection = null;
    if (ln.fit && sec && secLenPx > 0) {
      const hit = lineSegmentIntersection(ln.fit.centroid, ln.fit.dir, sec.a, sec.b);
      if (hit) ln.onSection = { point: hit.point, dPx: hit.u * secLenPx, dM: k ? hit.u * secLenPx * k : null };
    }
  }

  // Strike/dip: pair each contour with the next one below it, same bed.
  // Image y grows downward, so flip y to get map (north-up) coordinates.
  const attitudes = [];
  for (const bed of p.beds) {
    const own = lines.filter((l) => l.bed === bed.id && l.fit).sort((a, b) => b.h - a.h);
    const pairs = [];
    for (let i = 0; i < own.length - 1; i++) {
      if (!k) break;
      const toMap = (ln) => ({
        elevation: ln.h,
        fit: {
          centroid: { x: ln.fit.centroid.x * k, y: -ln.fit.centroid.y * k },
          dir: { x: ln.fit.dir.x, y: -ln.fit.dir.y },
        },
      });
      const sd = strikeDip(toMap(own[i]), toMap(own[i + 1]));
      if (sd) pairs.push({ ...sd, upper: own[i], lower: own[i + 1] });
    }
    if (pairs.length) {
      // Bed attitude: mean of the pairs (vector mean for the dip direction).
      const sx = pairs.reduce((s, q) => s + Math.sin((q.dipDirection * Math.PI) / 180), 0);
      const sy = pairs.reduce((s, q) => s + Math.cos((q.dipDirection * Math.PI) / 180), 0);
      const dd = ((Math.atan2(sx, sy) * 180) / Math.PI + 360) % 360;
      const dip = pairs.reduce((s, q) => s + q.dip, 0) / pairs.length;
      attitudes.push({ bed: bed.id, dip, dipDirection: dd, strike: (dd + 270) % 360, pairs });
    }
  }

  // Section: contact points and ground points along X–Y.
  const section = sec && k ? {
    lengthM: secLenPx * k,
    contacts: lines.filter((l) => l.onSection).map((l) => ({ bed: l.bed, h: l.h, d: l.onSection.dM, line: l })),
    ground: p.ground.map((g) => ({ id: g.id, h: g.h, d: projectOnSection(g, sec) * k })),
  } : null;

  derivedCache = { mpp: k, lines, attitudes, section };
  return derivedCache;
}

/** Distance along the section from X (image px) of a point's projection. */
export function projectOnSection(pt, sec = project.section) {
  const dx = sec.b.x - sec.a.x, dy = sec.b.y - sec.a.y;
  const L = Math.hypot(dx, dy) || 1;
  return ((pt.x - sec.a.x) * dx + (pt.y - sec.a.y) * dy) / L;
}

/** Snap a point onto the section line (for ground marks). */
export function snapToSection(pt, sec = project.section) {
  const dx = sec.b.x - sec.a.x, dy = sec.b.y - sec.a.y;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((pt.x - sec.a.x) * dx + (pt.y - sec.a.y) * dy) / L2));
  return { x: sec.a.x + dx * t, y: sec.a.y + dy * t };
}
