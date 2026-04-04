// --- APP ENTRY POINT ---

import { state }                 from './state.js';
import { initCommandQueuePanel } from './queue.js';
import { initAethisPanel }       from './aethis-panel.js';
import { initNav, switchTab }    from './nav.js';
import { initResizablePanels }   from './resize.js';
import { initSearch }            from './search.js';

const DATA_FILES = {
  aethis:        'data/aethis.json',
  music:         'data/music.json',
  effects:       'data/effects.json',
  statuses:      'data/statuses.json',
  morphs:        'data/morphs.json',
  announcements: 'data/announcements.json',
  credits:       'data/credits.json',
  myMorphs:      'data/my-morphs.json',
};

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

function initLeaveGuard() {
  window.addEventListener('beforeunload', e => {
    if (state.commandQueue.length > 0 || state.aethisQueue.length > 0) {
      e.preventDefault();
      e.returnValue = 'You have unsaved commands in your queue. Leave anyway?';
    }
  });
}

async function init() {
  await loadAllData();
  initCommandQueuePanel();
  initAethisPanel();
  initResizablePanels();
  initSearch();
  initNav();
  initLeaveGuard();
  switchTab('audios');
}

document.addEventListener('DOMContentLoaded', init);