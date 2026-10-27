/**
 * site.js — entry point for the landing page.
 * Language toggle, mobile menu, "Load your map", the worked example
 * and the stereonet.
 */

import { initI18n, t } from './i18n.js';
import { put, PENDING_MAP } from './core/storage.js';
import { initHeroDemo } from './ui/hero-demo.js';
import { initNet } from './ui/net-figure.js';

initI18n();

/* ---- Mobile menu ---- */
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('site-nav');
if (menuBtn && nav) {
  const setOpen = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  menuBtn.addEventListener('click', () => setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

/* ---- Load your map: hand the image to the workspace ---- */
const input = document.getElementById('map-input');
const status = document.getElementById('map-status');
input?.addEventListener('change', async () => {
  const file = input.files && input.files[0];
  if (!file) return;
  const fail = (key) => {
    status.textContent = t(key);
    status.classList.add('is-error');
    input.value = '';
  };
  if (!file.type.startsWith('image/')) return fail('map.error');

  status.classList.remove('is-error');
  status.textContent = t('map.loading');
  try {
    await put(PENDING_MAP, { name: file.name, type: file.type, blob: file, at: Date.now() });
    window.location.href = 'app.html';
  } catch {
    fail('map.storeError');
  }
});

/* ---- Worked example and stereonet ---- */
initHeroDemo(document.getElementById('demo'));
initNet(document.getElementById('net'), document.getElementById('net-form'));
