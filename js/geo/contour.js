/**
 * contour.js — marching squares: iso-lines of a function sampled on a grid.
 * Used to draw topographic contours and the outcrop trace of a contact
 * on the demo map. Returns polylines in map coordinates (metres).
 */

/**
 * @param {(x:number, y:number) => number} f  field to contour
 * @param {{x0,y0,x1,y1}} box                 extent in metres
 * @param {number} level                       iso value
 * @param {number} step                        grid spacing in metres
 * @returns {{x,y}[][]} polylines
 */
export function isolines(f, box, level, step) {
  const nx = Math.ceil((box.x1 - box.x0) / step);
  const ny = Math.ceil((box.y1 - box.y0) / step);
  const X = (i) => box.x0 + i * step;
  const Y = (j) => box.y0 + j * step;

  // Sample the field once.
  const v = [];
  for (let j = 0; j <= ny; j++) {
    v.push([]);
    for (let i = 0; i <= nx; i++) v[j].push(f(X(i), Y(j)) - level);
  }

  // Interpolated crossing on a cell edge.
  const lerp = (x0, y0, a, x1, y1, b) => {
    const t = a / (a - b);
    return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
  };

  // Collect segments cell by cell.
  const segs = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i];
      const pts = [];
      if ((a < 0) !== (b < 0)) pts.push(lerp(X(i), Y(j), a, X(i + 1), Y(j), b));
      if ((b < 0) !== (c < 0)) pts.push(lerp(X(i + 1), Y(j), b, X(i + 1), Y(j + 1), c));
      if ((c < 0) !== (d < 0)) pts.push(lerp(X(i + 1), Y(j + 1), c, X(i), Y(j + 1), d));
      if ((d < 0) !== (a < 0)) pts.push(lerp(X(i), Y(j + 1), d, X(i), Y(j), a));
      if (pts.length === 2) segs.push(pts);
      else if (pts.length === 4) segs.push([pts[0], pts[1]], [pts[2], pts[3]]);
    }
  }
  return chain(segs);
}

/** Join loose segments that share end points into continuous polylines. */
function chain(segs) {
  const key = (p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
  const ends = new Map();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(i);
    }
  });

  const used = new Set();
  const lines = [];
  const next = (p) => (ends.get(key(p)) || []).find((i) => !used.has(i));

  for (let s = 0; s < segs.length; s++) {
    if (used.has(s)) continue;
    used.add(s);
    const line = [...segs[s]];
    // Grow forward, then backward.
    for (let dir = 0; dir < 2; dir++) {
      for (;;) {
        const tip = line[line.length - 1];
        const i = next(tip);
        if (i === undefined) break;
        used.add(i);
        const [p, q] = segs[i];
        line.push(key(p) === key(tip) ? q : p);
      }
      line.reverse();
    }
    lines.push(line);
  }
  return lines;
}
