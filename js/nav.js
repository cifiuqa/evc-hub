// --- NAV CONTROLLER ---
// Manages tab and subtab switching, panel visibility, and TOC wiring.

import { state }              from './state.js';
import { renderAethisTab }    from './aethis.js';
import { renderMusicTab }     from './music.js';
import { renderEffectsTab }   from './effects.js';
import { renderStatusesTab }  from './statuses.js';
import { renderMorphsTab }    from './morphs.js';

// Track which tabs have been initially rendered (avoid unnecessary re-renders).
// Statuses and Morphs re-render on every visit so mode/person state stays fresh.
const rendered = {
  aethis:  false,
  music:   false,
  effects: false
};

// Switches the main tab to the given id.
export function switchTab(tabId) {
  state.currentTab = tabId;

  // Show/hide main panels
  ['audios', 'statuses', 'morphs'].forEach(id => {
    const el = document.getElementById(`tab-${id}`);
    if (el) el.style.display = id === tabId ? '' : 'none';
  });

  // Subtab bar only visible on Audios
  const subtabBar = document.getElementById('subtab-bar');
  if (subtabBar) subtabBar.classList.toggle('hidden', tabId !== 'audios');

  // Update nav tab active state
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  if (tabId === 'audios') {
    updateTOC(true);
    switchSubtab(state.currentSubtab);
  } else if (tabId === 'statuses') {
    updateTOC(false);
    // Always re-render statuses so mode state is reflected
    renderStatusesTab();
  } else if (tabId === 'morphs') {
    // Always rebuild the TOC with morphs categories — regardless of whether
    // we've visited before. This fixes the stale audio-TOC bug.
    updateTOC(true);
    renderMorphsTab();
    requestAnimationFrame(() => {
      if (state.data.morphs) rebuildTOC(state.data.morphs.categories);
    });
  }

  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.scrollTop = 0;
}

// Switches the audio subtab to the given id.
export function switchSubtab(subtabId) {
  state.currentSubtab = subtabId;

  ['aethis', 'music', 'effects'].forEach(id => {
    const el = document.getElementById(`subtab-${id}`);
    if (el) el.style.display = id === subtabId ? '' : 'none';
  });

  document.querySelectorAll('.subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === subtabId);
  });

  if (subtabId === 'aethis' && !rendered.aethis) {
    renderAethisTab();
    rendered.aethis = true;
  } else if (subtabId === 'music' && !rendered.music) {
    renderMusicTab();
    rendered.music = true;
  } else if (subtabId === 'effects' && !rendered.effects) {
    renderEffectsTab();
    rendered.effects = true;
  }

  // Always rebuild TOC for the active audio subtab so it's correct after
  // returning from another main tab.
  requestAnimationFrame(() => {
    const dataMap = {
      aethis:  state.data.aethis,
      music:   state.data.music,
      effects: state.data.effects
    };
    const data = dataMap[subtabId];
    if (data) rebuildTOC(data.categories);
  });
}

// Shows or hides the TOC sidebar.
function updateTOC(visible) {
  const tocPanel = document.getElementById('toc-panel');
  if (tocPanel) tocPanel.classList.toggle('hidden', !visible);
}

// Rebuilds the TOC nav list for the given categories array.
function rebuildTOC(categories) {
  const tocListEl = document.getElementById('toc-list');
  const contentEl = document.getElementById('main-content');
  if (!tocListEl || !contentEl) return;

  tocListEl.innerHTML = '';

  categories.forEach(cat => {
    const link = document.createElement('a');
    link.className   = 'toc-category';
    link.textContent = cat.name;
    link.href        = '#';

    link.addEventListener('click', e => {
      e.preventDefault();
      const target = contentEl.querySelector(`[data-category-id="${cat.id}"]`);
      if (!target) return;

      contentEl.scrollTo({ top: target.offsetTop - 2, behavior: 'smooth' });

      tocListEl.querySelectorAll('.toc-category').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    tocListEl.appendChild(link);
  });
}

// Wires up all nav tab and subtab click handlers.
export function initNav() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.subtab').forEach(btn => {
    btn.addEventListener('click', () => switchSubtab(btn.dataset.subtab));
  });
}
