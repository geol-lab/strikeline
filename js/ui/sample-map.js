/**
 * sample-map.js — draws the synthetic lab map as a raster image, so the
 * workspace can open with a realistic map to practise on. It is the
 * same geology as the landing-page demo, printed like a lab handout:
 * contours, coloured outcrops, a scale bar and the section line X–Y.
 */

import { MAP, SECTION, bedAt, buildDemo } from './demo-model.js';

const RES = 0.5;              // image pixels per metre (1 px = 2 m)
const PAD = 40;               // white margin around the map face, px
const FILLS = ['#d6e7e1', '#f6ddd4', '#e7dcee', '#d7eef4'];
const LINES = ['#3e7f70', '#b5432e', '#7b3f93', '#13809b'];

export const SAMPLE_NAME = 'Sample map (synthetic)';

/** Bed list matching the sample's contacts, for a new project. */
export const SAMPLE_BEDS = [
  { name: 'Base of shale', color: LINES[1] },
  { name: 'Base of sandstone', color: LINES[2] },
  { name: 'Base of conglomerate', color: LINES[3] },
];

export async function renderSampleMap() {
  const W = MAP.w * RES, H = MAP.h * RES;
  const canvas = document.createElement('canvas');
  canvas.width = W + PAD * 2;
  canvas.height = H + PAD * 2 + 40;
  const ctx = canvas.getContext('2d');
  const X = (x) => PAD + x * RES;
  const Y = (y) => PAD + (MAP.h - y) * RES;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bed fills, pixel by pixel.
  const img = ctx.getImageData(PAD, PAD, W, H);
  const rgb = FILLS.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const c = rgb[bedAt((i + 0.5) / RES, MAP.h - (j + 0.5) / RES)];
      const o = (j * W + i) * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, PAD, PAD);

  const model = buildDemo();
  const stroke = (pts, color, width) => {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))));
    ctx.stroke();
  };

  ctx.save();
  ctx.beginPath(); ctx.rect(PAD, PAD, W, H); ctx.clip();

  // Contours with values.
  ctx.font = '600 13px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  model.topo.forEach((lvl) => {
    lvl.lines.forEach((l) => stroke(l, '#a0653a', 1.3));
    lvl.lines.forEach((l) => {
      if (l.length < 30) return;
      const p = l[Math.floor(l.length * 0.3)];
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff';
      ctx.strokeText(lvl.h, X(p.x), Y(p.y));
      ctx.fillStyle = '#7d4a24';
      ctx.fillText(lvl.h, X(p.x), Y(p.y));
    });
  });

  // Outcrop traces of the contacts.
  model.outcrops.forEach((o) => o.lines.forEach((l) => stroke(l, LINES[o.contact.bed], 2.6)));
  ctx.restore();

  // Frame, section line, labels.
  ctx.strokeStyle = '#14181d'; ctx.lineWidth = 1.5;
  ctx.strokeRect(PAD, PAD, W, H);
  ctx.setLineDash([10, 6]); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(X(SECTION.X.x), Y(SECTION.X.y)); ctx.lineTo(X(SECTION.Y.x), Y(SECTION.Y.y)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#14181d'; ctx.font = '700 18px sans-serif';
  ctx.fillText('X', X(SECTION.X.x), Y(SECTION.X.y) - 16);
  ctx.fillText('Y', X(SECTION.Y.x), Y(SECTION.Y.y) - 16);

  // North arrow.
  ctx.beginPath();
  ctx.moveTo(W + PAD - 24, PAD + 14); ctx.lineTo(W + PAD - 16, PAD + 36); ctx.lineTo(W + PAD - 24, PAD + 31); ctx.lineTo(W + PAD - 32, PAD + 36);
  ctx.closePath(); ctx.fill();
  ctx.font = '700 14px sans-serif'; ctx.fillText('N', W + PAD - 24, PAD + 50);

  // Scale bar below the map: 0–500 m.
  const by = H + PAD + 26, bx = PAD;
  const seg = 250 * RES;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = i ? '#ffffff' : '#14181d';
    ctx.fillRect(bx + i * seg, by, seg, 7);
    ctx.strokeRect(bx + i * seg, by, seg, 7);
  }
  ctx.fillStyle = '#14181d'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  [0, 250, 500].forEach((m, i) => ctx.fillText(m, bx + i * seg, by + 20));
  ctx.textAlign = 'left';
  ctx.fillText('metres', bx + 2 * seg + 14, by + 5);
  ctx.textAlign = 'right';
  ctx.fillText('Contour interval 100 m · synthetic practice map', W + PAD, by + 5);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
