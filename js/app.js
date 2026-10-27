/**
 * app.js — entry point for the workspace.
 * Wires the tabs, the map view, the section, the panel and the inputs
 * to the project store, and decides which map to open on start.
 */

import { initI18n, onLangChange, t } from './i18n.js';
import {
  getProject, getImageBlob, subscribe, update, setQuiet, loadProject, restore,
  blankProject, undo, redo, canUndo, canRedo, newId,
} from './core/state.js';
import { get, del, PENDING_MAP } from './core/storage.js';
import { createMapView } from './ui/map-view.js';
import { renderSection, renderSectionExtras } from './ui/section-view.js';
import { initNetView, renderNetView } from './ui/net-view.js';
import { initTablesView, renderTablesView, columnSVG, legendSVG } from './ui/tables-view.js';
import { saveProjectFile, readProjectFile, download, baseName } from './core/project-file.js';
import { initPanel, renderPanel } from './ui/panel.js';
import { renderSampleMap, SAMPLE_NAME, SAMPLE_BEDS } from './ui/sample-map.js';

const $ = (id) => document.getElementById(id);

initI18n();

/* ---- Tabs (fixed regions, contents swap) ---- */
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((b) => {
    const on = b === tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    $(b.getAttribute('aria-controls')).hidden = !on;
  });
  renderVisibleTab();
}

/** Tabs B and C are drawn only while visible (they size to their panel). */
function renderVisibleTab() {
  if (!$('panel-section').hidden) {
    renderSection($('secb-svg'), { fitWidth: $('secb-scroll').clientWidth, meta: $('secb-meta'), note: $('secb-note') });
    renderSectionExtras($('secb-key'), $('secb-table'));
  }
  if (!$('panel-net').hidden) renderNetView();
  if (!$('panel-tables').hidden) renderTablesView();
}
new ResizeObserver(() => renderVisibleTab()).observe(document.body);
tabs.forEach((b, i) => {
  b.addEventListener('click', () => selectTab(b));
  b.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    next.focus();
    selectTab(next);
  });
});

/* ---- Inputs in the panel ---- */
const elev = $('elev');
const interval = $('interval');
const barLen = $('bar-len');
const ve = $('ve');

const getElevation = () => parseFloat(elev.value);
const getBarLength = () => Math.max(1, parseFloat(barLen.value) || 500);

function stepElevation(dir) {
  const k = parseFloat(interval.value) || 100;
  elev.value = (parseFloat(elev.value) || 0) + dir * k;
  map.render();
}
$('elev-up').addEventListener('click', () => stepElevation(1));
$('elev-down').addEventListener('click', () => stepElevation(-1));
elev.addEventListener('input', () => map.render());

interval.addEventListener('change', () => {
  const v = parseFloat(interval.value);
  if (v > 0) update('interval', (d) => { d.interval = v; });
});
barLen.addEventListener('change', () => {
  const v = parseFloat(barLen.value);
  if (v > 0 && getProject().scale) update('scale-len', (d) => { d.scale.length = v; });
});
for (const input of [ve, $('ve-b')]) {
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    if (v >= 0.5 && v <= 10) setQuiet('ve', (p) => { p.ve = v; });
  });
}

/* ---- Map view ---- */
const note = $('note');
const map = createMapView({
  viewport: $('viewport'),
  stage: $('stage'),
  overlay: $('overlay'),
  getElevation,
  getBarLength,
  setNote: (s) => { note.textContent = s; },
  onZoom: (s) => {
    $('zoom-fit').textContent = `${Math.round(s * 100)}%`;
    scheduleSection();
  },
});

document.querySelectorAll('[data-tool]').forEach((b) => {
  b.addEventListener('click', () => chooseTool(b.dataset.tool));
});
function chooseTool(name) {
  document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === name)));
  map.setTool(name);
}

$('zoom-in').addEventListener('click', () => map.zoomIn());
$('zoom-out').addEventListener('click', () => map.zoomOut());
$('zoom-fit').addEventListener('click', () => map.fit());

/* ---- Section (redrawn after zoom settles) ---- */
let sectionTimer = null;
function scheduleSection() {
  clearTimeout(sectionTimer);
  sectionTimer = setTimeout(drawSection, 60);
}
function drawSection() {
  renderSection($('section-svg'), { zoom: map.zoom, meta: $('sec-meta'), note: $('sec-note') });
}

/* ---- Undo / redo ---- */
function syncHistory() {
  $('undo').disabled = !canUndo();
  $('redo').disabled = !canRedo();
}
$('undo').addEventListener('click', () => undo());
$('redo').addEventListener('click', () => redo());

/* ---- Keyboard ---- */
const KEYS = { h: 'pan', s: 'scale', x: 'section', m: 'point', g: 'ground', e: 'erase' };
document.addEventListener('keydown', (e) => {
  const typing = e.target.matches('input, textarea, select');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    if (typing) return;
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
    return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (KEYS[k]) { chooseTool(KEYS[k]); return; }
  if (e.key === 'Escape') map.cancel();
  if (e.key === ']') stepElevation(1);
  if (e.key === '[') stepElevation(-1);
});

/* ---- Loading maps ---- */
async function openImage(blob, name, { sample = false } = {}) {
  const p = blankProject(name);
  p.sample = sample;
  if (sample) {
    p.beds = SAMPLE_BEDS.map((b) => ({ id: newId('b'), name: b.name, color: b.color }));
    p.activeBed = p.beds[0].id;
  }
  loadProject(p, blob);
  await map.setImage(blob);
  chooseTool('scale');
}

$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (!f.type.startsWith('image/')) { note.textContent = t('map.error'); return; }
  await openImage(f, f.name);
});
$('load-sample').addEventListener('click', async () => {
  await openImage(await renderSampleMap(), SAMPLE_NAME, { sample: true });
});

/* ---- React to project changes ---- */
subscribe((p, reason) => {
  map.render();
  renderPanel();
  drawSection();
  syncHistory();
  renderVisibleTab();
  if (reason === 'undo' || reason === 'redo') map.refreshNote();
  if (document.activeElement !== ve) ve.value = p.ve;
  if (document.activeElement !== $('ve-b')) $('ve-b').value = p.ve;
  interval.value = p.interval;
  if (p.scale) barLen.value = p.scale.length;
});
onLangChange(() => { renderPanel(); drawSection(); renderVisibleTab(); map.refreshNote(); });

/* ---- Start: a map handed over from the home page, the last session, or the practice map ---- */
initPanel();
initNetView();
initTablesView();
(async () => {
  let pending = null;
  try { pending = await get(PENDING_MAP); } catch { /* storage blocked */ }
  if (pending?.blob) {
    try { await del(PENDING_MAP); } catch { /* ignore */ }
    await openImage(pending.blob, pending.name);
    return;
  }
  if (await restore()) {
    await map.setImage(getImageBlob());
    chooseTool('pan');
    return;
  }
  await openImage(await renderSampleMap(), SAMPLE_NAME, { sample: true });
})();

/* ---- File menu: open / save project, export pictures ---- */
const menu = $('file-menu');
const closeMenu = () => { menu.open = false; };
document.addEventListener('click', (e) => { if (!menu.contains(e.target)) closeMenu(); });

/** Report on the sheet note of the visible tab. */
function report(msg) {
  note.textContent = msg;
  if ($('panel-map').hidden) $('secb-note').textContent = msg;
}

$('save-project').addEventListener('click', async () => {
  closeMenu();
  await saveProjectFile();
  report(t('file.saved'));
});

$('open-project').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  closeMenu();
  if (!f) return;
  try {
    const { project, blob } = await readProjectFile(f);
    loadProject(project, blob);
    await map.setImage(blob);
    chooseTool('pan');
    report(t('file.opened', { name: project.mapName || f.name }));
  } catch (err) {
    report(t(`file.err.${err.message}`));
  }
});

$('export-map').addEventListener('click', async () => {
  closeMenu();
  const png = await map.exportPNG();
  if (png) { download(png, `${baseName()}-map.png`); report(t('file.exported')); }
});

/** Wrap SVG body markup into a standalone, printable SVG file. */
const svgFile = (w, h, body) => new Blob([
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>text{font-family:Arial,Helvetica,sans-serif}.mono{font-family:Menlo,Consolas,monospace}</style><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`,
], { type: 'image/svg+xml' });

$('export-section').addEventListener('click', () => {
  closeMenu();
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  renderSection(tmp, { fitWidth: 1400, meta: document.createElement('span'), note: document.createElement('p') });
  const w = +tmp.getAttribute('width'), h = +tmp.getAttribute('height');
  if (!w) { report(t('sec.needPoints')); return; }
  download(svgFile(w, h, tmp.innerHTML), `${baseName()}-section.svg`);
  report(t('file.exported'));
});

$('export-column').addEventListener('click', () => {
  closeMenu();
  const c = columnSVG(), l = legendSVG();
  const gap = 40;
  const body = `<g>${c.body}</g><g transform="translate(${c.w + gap} 0)">${l.body}</g>`;
  download(svgFile(c.w + gap + l.w, Math.max(c.h, l.h), body), `${baseName()}-column-legend.svg`);
  report(t('file.exported'));
});
