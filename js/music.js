// --- MUSIC TAB ---
// Renders the Music subtab: categorised list of music tracks.
// "Add to queue" adds a `play <audioId>` command to the global command queue.

import { state }                       from './state.js';
import { copyToClipboard, buildTOC }   from './utils.js';
import { addToCommandQueue }           from './queue.js';

export function renderMusicTab() {
  const containerEl = document.getElementById('subtab-music');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.music) return;

  const { categories } = state.data.music;

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} track${cat.items.length !== 1 ? 's' : ''}</span>
      </div>
      ${cat.items.map((item, itemIndex) => `
        <div class="audio-item" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}">
          <span class="audio-name"
                title="Click to copy audio ID: ${escapeAttr(item.audioId)}"
                data-audioid="${escapeAttr(item.audioId)}">
            ${escapeHtml(item.name)}
          </span>
          <span class="audio-id-hint">${item.audioId}</span>
          <button class="btn btn-sm" title="Preview (stub — no Roblox playback)">▶ PREVIEW</button>
          <button class="btn btn-add btn-sm"
                  data-audioid="${escapeAttr(item.audioId)}"
                  title="Add play command to queue">+ ADD</button>
        </div>
      `).join('')}
    </div>
  `).join('');

  // Click audio name → copy audio ID
  containerEl.querySelectorAll('.audio-name').forEach(el => {
    el.addEventListener('click', () => copyToClipboard(el.dataset.audioid));
  });

  // ADD button → push `play <audioId>` to global command queue
  containerEl.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => addToCommandQueue(`play ${btn.dataset.audioid}`));
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
