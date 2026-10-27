/**
 * panel.js — the project panel: map name, scale readout, beds list
 * (name, colour, active bed, attitude) and the structure-contour table.
 */

import { getProject, update, setQuiet, derived, newId, BED_COLORS } from '../core/state.js';
import { t, fmt } from '../i18n.js';
import { bearing3, compass } from '../geo/structure.js';

const $ = (id) => document.getElementById(id);
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#14181d');

export function initPanel() {
  const beds = $('beds');

  $('add-bed').addEventListener('click', () => {
    update('bed', (d) => {
      const id = newId('b');
      const used = new Set(d.beds.map((b) => b.color));
      const color = BED_COLORS.find((c) => !used.has(c)) || BED_COLORS[d.beds.length % BED_COLORS.length];
      d.beds.push({ id, name: t('app.bedDefault', { n: d.beds.length + 1 }), color });
      d.activeBed = id;
    });
    const inputs = beds.querySelectorAll('.bed__name');
    inputs[inputs.length - 1]?.select();
  });

  // Delegated events on the beds list.
  beds.addEventListener('click', (e) => {
    const row = e.target.closest('.bed');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest('.bed__use')) setQuiet('active', (p) => { p.activeBed = id; });
    const del = e.target.closest('.bed__del');
    if (del) {
      if (del.dataset.armed !== 'true') {
        del.dataset.armed = 'true';
        del.textContent = t('app.delConfirm');
        return;
      }
      update('bed-del', (d) => {
        d.beds = d.beds.filter((b) => b.id !== id);
        d.points = d.points.filter((q) => q.bed !== id);
        if (d.activeBed === id) d.activeBed = d.beds[0]?.id ?? null;
      });
    }
  });
  beds.addEventListener('change', (e) => {
    const row = e.target.closest('.bed');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.matches('.bed__name')) {
      const name = e.target.value.trim() || t('app.bedDefault', { n: 1 });
      update('bed-name', (d) => { d.beds.find((b) => b.id === id).name = name; });
    }
    if (e.target.matches('.bed__color')) {
      const color = e.target.value;
      update('bed-color', (d) => { d.beds.find((b) => b.id === id).color = color; });
    }
  });
}

/** Re-render the panel from the project. */
export function renderPanel() {
  const p = getProject();
  const D = derived();

  $('map-name').textContent = p.mapName || '—';

  const out = $('scale-out');
  if (D.mpp) {
    out.dataset.empty = 'false';
    out.textContent = t('app.scaleOut', { mpp: fmt(D.mpp, 2), len: fmt(p.scale.length) });
  } else {
    out.dataset.empty = 'true';
    out.textContent = t('app.scaleNone');
  }

  // Beds.
  const beds = $('beds');
  beds.dataset.empty = t('app.noBeds');
  const focused = document.activeElement?.closest?.('.bed')?.dataset.id;
  if (focused && document.activeElement.matches('.bed__name')) return renderLines(); // don't clobber typing
  beds.replaceChildren(...p.beds.map((bed) => {
    const li = document.createElement('li');
    li.className = 'bed';
    li.dataset.id = bed.id;
    li.setAttribute('aria-current', String(bed.id === p.activeBed));

    const color = document.createElement('input');
    color.type = 'color';
    color.className = 'bed__color';
    color.value = safeColor(bed.color);
    color.setAttribute('aria-label', t('app.bedColor'));

    const name = document.createElement('input');
    name.className = 'bed__name';
    name.value = bed.name;
    name.setAttribute('aria-label', t('app.bedName'));

    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'btn btn--small bed__use';
    use.textContent = bed.id === p.activeBed ? t('app.bedActive') : t('app.bedUse');
    use.setAttribute('aria-pressed', String(bed.id === p.activeBed));

    const meta = document.createElement('div');
    meta.className = 'bed__meta';
    const nPts = p.points.filter((q) => q.bed === bed.id).length;
    const nLines = D.lines.filter((l) => l.bed === bed.id && l.fit).length;
    const att = D.attitudes.find((a) => a.bed === bed.id);
    const counts = document.createElement('span');
    counts.textContent = t('app.bedCounts', { p: nPts, l: nLines });
    const attitude = document.createElement('span');
    attitude.className = 'bed__attitude';
    attitude.textContent = att ? `${bearing3(att.strike)}/${Math.round(att.dip)} ${compass(att.dipDirection)}` : '';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'bed__del';
    del.textContent = t('app.delete');
    meta.append(counts, attitude, del);

    li.append(color, name, use, meta);
    return li;
  }));

  renderLines();
}

/** Structure-contour table: elevation, points, length, position on X–Y, fit. */
function renderLines() {
  const p = getProject();
  const D = derived();
  const table = $('lines-table');
  const rows = D.lines.filter((l) => l.fit).sort((a, b) => {
    const ia = p.beds.findIndex((x) => x.id === a.bed), ib = p.beds.findIndex((x) => x.id === b.bed);
    return ia - ib || b.h - a.h;
  });
  if (!rows.length) {
    table.innerHTML = `<caption>${t('app.noLines')}</caption>`;
    return;
  }
  const head = `<thead><tr><th>${t('app.colH')}</th><th>${t('app.colN')}</th><th>${t('app.colLen')}</th><th>${t('app.colXY')}</th><th>${t('app.colDev')}</th></tr></thead>`;
  const body = rows.map((l) => {
    const c = safeColor(p.beds.find((b) => b.id === l.bed)?.color);
    const dev = l.rmsM != null ? fmt(l.rmsM, 1) : '—';
    const warn = l.rmsM != null && l.lengthM && l.rmsM > l.lengthM * 0.03;
    return `<tr><td><span class="sw" style="border-color:${c}"></span>${l.h}</td><td>${l.pts.length}</td><td>${l.lengthM != null ? fmt(l.lengthM) : '—'}</td><td>${l.onSection?.dM != null ? fmt(l.onSection.dM) : '—'}</td><td${warn ? ' class="warn"' : ''}>${dev}</td></tr>`;
  }).join('');
  table.innerHTML = `${head}<tbody>${body}</tbody><caption>${t('app.linesCaption')}</caption>`;
}
