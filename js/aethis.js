// --- AETHIS TAB ---
// Renders the AETHIS subtab: categorised list of sounds.
// Clicking an item adds it to the AETHIS queue.

import { state }               from './state.js';
import { copyToClipboard, buildTOC } from './utils.js';
import { addToAethisQueue }    from './aethis-panel.js';

export function renderAethisTab() {
  const containerEl = document.getElementById('subtab-aethis');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.aethis) return;

  const { categories } = state.data.aethis;

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} sound${cat.items.length !== 1 ? 's' : ''}</span>
      </div>
      ${cat.items.map((item, itemIndex) => `
        <div class="audio-item" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}">
          <span class="audio-name"
                title="Click to copy audio ID: ${escapeAttr(item.audioId)}"
                data-audioid="${escapeAttr(item.audioId)}">
            ${escapeHtml(item.name)}
          </span>
          <span class="audio-id-hint">${item.audioId}</span>
          <span class="audio-delay-badge" title="Fixed delay after this sound">⏱ ${item.delay}s</span>
          <button class="btn btn-sm" data-audioid="${escapeAttr(item.audioId)}"
                  title="Preview (stub — no Roblox playback)">▶ PREVIEW</button>
          <button class="btn btn-add btn-sm"
                  data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}"
                  title="Add to AETHIS queue">+ ADD</button>
        </div>
      `).join('')}
    </div>
  `).join('');

  // Click audio name → copy audio ID
  containerEl.querySelectorAll('.audio-name').forEach(el => {
    el.addEventListener('click', () => copyToClipboard(el.dataset.audioid));
  });

  // Preview button — stub
  containerEl.querySelectorAll('[data-audioid].btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (item.audioFile) {
        const a = new Audio(item.audioFile);
        a.play();
      }
    });
  });

  // ADD button → add to AETHIS queue
  containerEl.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === btn.dataset.cat);
      const item = cat?.items[parseInt(btn.dataset.item, 10)];
      if (item) addToAethisQueue(item);
    });
  });

  buildTOC(categories, tocListEl, contentEl);
}


// --- HELPERS ---

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}
