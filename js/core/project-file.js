/**
 * project-file.js — save and open a project as one JSON file (the map
 * image travels inside it as a data URL), and file downloads.
 */

import { getProject, getImageBlob, blankProject } from './state.js';

const FORMAT = 'strikeline-project';

/** Offer a blob to the user as a download. */
export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const blobToDataURL = (blob) => new Promise((ok, fail) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = fail;
  r.readAsDataURL(blob);
});

/** A file name from the map's name: "lab4-map.png" → "lab4-map". */
export function baseName() {
  const n = getProject().mapName || 'strikeline';
  return n.replace(/\.[a-z0-9]+$/i, '').replace(/[^\w\-а-яё ]+/gi, '').trim().replace(/\s+/g, '-') || 'strikeline';
}

export async function saveProjectFile() {
  const blob = getImageBlob();
  const data = {
    format: FORMAT,
    version: 1,
    savedAt: new Date().toISOString(),
    project: getProject(),
    image: blob ? await blobToDataURL(blob) : null,
  };
  download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${baseName()}.strikeline.json`);
}

/** Read a saved project. Returns { project, blob } or throws with a reason. */
export async function readProjectFile(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { throw new Error('notJson'); }
  if (data?.format !== FORMAT || !data.project) throw new Error('notProject');
  if (!data.image) throw new Error('noImage');
  const blob = await (await fetch(data.image)).blob();
  return { project: { ...blankProject(), ...data.project }, blob };
}
