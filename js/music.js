// --- MUSIC TAB ---
// Renders the Music subtab: categorised list of tracks.
// Each item has a loop toggle. "Add to queue" generates `play <audioId> [true]`.

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
          <button class="btn btn-sm" title="Preview (stub)">▶ PREVIEW</button>
          <div class="effects-controls">
            <label class="loop-toggle" title="Loop this track">
              <input type="checkbox" class="loop-input">
              LOOP
            </label>
          </div>
          <button class="btn btn-add btn-sm music-add-btn"
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

  // ADD → push `play <audioId>` or `play <audioId> true` to global queue
  containerEl.querySelectorAll('.music-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row     = btn.closest('.audio-item');
      const loop    = row.querySelector('.loop-input').checked;
      const audioId = btn.dataset.audioid;
      const cmd     = loop ? `play ${audioId} true` : `play ${audioId}`;
      addToCommandQueue(cmd);
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
