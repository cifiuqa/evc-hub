// --- NAV CONTROLLER ---
// Manages tab and subtab switching; shows/hides the correct panels.

import { state }              from './state.js';
import { renderAethisTab }    from './aethis.js';
import { renderMusicTab }     from './music.js';
import { renderEffectsTab }   from './effects.js';
import { renderStatusesTab }  from './statuses.js';
import { renderMorphsTab }    from './morphs.js';

const TAB_PANELS = {
  audios:   document.getElementById('tab-audios'),
  statuses: document.getElementById('tab-statuses'),
  morphs:   document.getElementById('tab-morphs')
};

const SUBTAB_PANELS = {
  aethis:  document.getElementById('subtab-aethis'),
  music:   document.getElementById('subtab-music'),
  effects: document.getElementById('subtab-effects')
};

// Tracks which tabs/subtabs have been rendered so we don't re-render on
// every switch — only render once on first visit.
const rendered = {
  aethis:   false,
  music:    false,
  effects:  false,
  statuses: false,
  morphs:   false
};

// Switches the main tab to the given id.
export function switchTab(tabId) {
  state.currentTab = tabId;

  // Show/hide panels
  Object.entries(TAB_PANELS).forEach(([id, el]) => {
    if (el) el.style.display = id === tabId ? '' : 'none';
  });

  // Toggle subtab bar visibility (audios only)
  const subtabBar = document.getElementById('subtab-bar');
  if (subtabBar) subtabBar.classList.toggle('hidden', tabId !== 'audios');

  // Update nav tab active state
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Render tab content if first visit
  if (tabId === 'audios') {
    switchSubtab(state.currentSubtab);
  } else if (tabId === 'statuses') {
    updateTOC(false);
    if (!rendered.statuses) {
      renderStatusesTab();
      rendered.statuses = true;
    }
  } else if (tabId === 'morphs') {
    updateTOC(true);
    if (!rendered.morphs) {
      renderMorphsTab();
      rendered.morphs = true;
    }
  }

  // Scroll main content back to top on tab change
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.scrollTop = 0;
}

// Switches the audio subtab to the given id.
export function switchSubtab(subtabId) {
  state.currentSubtab = subtabId;

  // Show/hide subtab panels
  Object.entries(SUBTAB_PANELS).forEach(([id, el]) => {
    if (el) el.style.display = id === subtabId ? '' : 'none';
  });

  // Update subtab button active state
  document.querySelectorAll('.subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === subtabId);
  });

  // Render and show TOC
  updateTOC(true);

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

  // Re-build TOC after render (categories may have just been inserted into DOM)
  // Slight delay so the DOM has been updated before we query it
  requestAnimationFrame(() => {
    if (subtabId === 'aethis' && state.data.aethis) {
      rebuildActiveTOC(state.data.aethis.categories);
    } else if (subtabId === 'music' && state.data.music) {
      rebuildActiveTOC(state.data.music.categories);
    } else if (subtabId === 'effects' && state.data.effects) {
      rebuildActiveTOC(state.data.effects.categories);
    }
  });
}

// Shows or hides the TOC sidebar.
function updateTOC(visible) {
  const tocPanel = document.getElementById('toc-panel');
  if (tocPanel) tocPanel.classList.toggle('hidden', !visible);
}

// Re-builds the TOC nav list for the given categories.
// Scrolling is scoped to the main-content overflow container.
function rebuildActiveTOC(categories) {
  const tocListEl  = document.getElementById('toc-list');
  const contentEl  = document.getElementById('main-content');

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
