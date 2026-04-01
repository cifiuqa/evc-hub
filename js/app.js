// --- APP ENTRY POINT ---
// Loads all JSON data, initialises panels, and kicks off navigation.

import { state }                from './state.js';
import { initCommandQueuePanel } from './queue.js';
import { initAethisPanel }      from './aethis-panel.js';
import { initNav, switchTab }   from './nav.js';

const DATA_FILES = {
  aethis:   'data/aethis.json',
  music:    'data/music.json',
  effects:  'data/effects.json',
  statuses: 'data/statuses.json',
  morphs:   'data/morphs.json'
};

// --- DATA LOADING ---

async function loadAllData() {
  await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, path]) => {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.data[key] = await res.json();
      } catch (err) {
        console.error(`Failed to load ${path}:`, err);
      }
    })
  );
}


// --- BEFOREUNLOAD GUARD ---

function initLeaveGuard() {
  window.addEventListener('beforeunload', e => {
    const hasQueue  = state.commandQueue.length > 0;
    const hasAethis = state.aethisQueue.length > 0;

    if (hasQueue || hasAethis) {
      e.preventDefault();
      e.returnValue = 'You have unsaved commands in your queue. Leave anyway?';
    }
  });
}


// --- INIT ---

async function init() {
  await loadAllData();

  initCommandQueuePanel();
  initAethisPanel();
  initNav();
  initLeaveGuard();

  // Start on the AETHIS subtab
  switchTab('audios');
}

document.addEventListener('DOMContentLoaded', init);
