// --- NAV CONTROLLER ---

import { state }                    from './state.js';
import { renderAethisTab }          from './aethis.js';
import { renderMusicTab }           from './music.js';
import { renderEffectsTab }         from './effects.js';
import { renderAnnouncementsTab }   from './announcements.js';
import { renderStatusesTab }        from './statuses.js';
import { renderMorphsTab }          from './morphs.js';
import { renderCreditsTab }         from './credits.js';
import { clearSearch }              from './search.js';

// Audio subtabs render once so input state (vol, range, loop) is preserved.
const rendered = {
  aethis:        false,
  music:         false,
  effects:       false,
  announcements: false
};

const ALL_TABS    = ['audios', 'statuses', 'morphs', 'credits'];
const ALL_SUBTABS = ['aethis', 'music', 'effects', 'announcements'];

export function switchTab(tabId) {
  state.currentTab = tabId;

  ALL_TABS.forEach(id => {
    const el = document.getElementById(`tab-${id}`);
    if (el) el.style.display = id === tabId ? '' : 'none';
  });

  const subtabBar = document.getElementById('subtab-bar');
  if (subtabBar) subtabBar.classList.toggle('hidden', tabId !== 'audios');

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  clearSearch();

  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.scrollTop = 0;

  if (tabId === 'audios') {
    updateTOC(true);
    switchSubtab(state.currentSubtab);
  } else if (tabId === 'statuses') {
    updateTOC(false);
    renderStatusesTab();
  } else if (tabId === 'morphs') {
    updateTOC(true);
    renderMorphsTab();
    requestAnimationFrame(() => {
      if (state.data.morphs) rebuildTOC(state.data.morphs.categories);
    });
  } else if (tabId === 'credits') {
    updateTOC(false);
    renderCreditsTab();
  }
}

export function switchSubtab(subtabId) {
  state.currentSubtab = subtabId;

  ALL_SUBTABS.forEach(id => {
    const el = document.getElementById(`subtab-${id}`);
    if (el) el.style.display = id === subtabId ? '' : 'none';
  });

  document.querySelectorAll('.subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === subtabId);
  });

  clearSearch();

  const renderMap = {
    aethis:        () => renderAethisTab().then(() => rebuildAudioTOC(subtabId)),
    music:         () => renderMusicTab().then(() => rebuildAudioTOC(subtabId)),
    effects:       () => renderEffectsTab().then(() => rebuildAudioTOC(subtabId)),
    announcements: () => renderAnnouncementsTab().then(() => {
      if (state.data.announcements) rebuildTOC(state.data.announcements.categories);
    })
  };

  if (!rendered[subtabId]) {
    renderMap[subtabId]?.();
    rendered[subtabId] = true;
  } else {
    // Already rendered — just rebuild the TOC
    requestAnimationFrame(() => rebuildAudioTOC(subtabId));
  }
}

function rebuildAudioTOC(subtabId) {
  const dataMap = {
    aethis:        state.data.aethis,
    music:         state.data.music,
    effects:       state.data.effects,
    announcements: state.data.announcements
  };
  const data = dataMap[subtabId];
  if (data) rebuildTOC(data.categories);
}

function updateTOC(visible) {
  const tocPanel = document.getElementById('toc-panel');
  if (tocPanel) tocPanel.classList.toggle('hidden', !visible);
}

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
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      tocListEl.querySelectorAll('.toc-category').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    tocListEl.appendChild(link);
  });
}

export function initNav() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.subtab').forEach(btn => {
    btn.addEventListener('click', () => switchSubtab(btn.dataset.subtab));
  });
}