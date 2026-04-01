// --- EFFECTS TAB ---
// Renders the Effects subtab. Each item has per-row volume, range, and loop inputs
// seeded from config defaults. "Add to queue" generates a `playsound` command.

import { state }                     from './state.js';
import { copyToClipboard, buildTOC } from './utils.js';
import { addToCommandQueue }         from './queue.js';

export function renderEffectsTab() {
  const containerEl = document.getElementById('subtab-effects');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.effects) return;

  const { categories } = state.data.effects;

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} effect${cat.items.length !== 1 ? 's' : ''}</span>
      </div>
      ${cat.items.map((item, itemIndex) => `
        <div class="effects-item" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}">
          <span class="audio-name"
                title="Click to copy audio ID: ${escapeAttr(item.audioId)}"
                data-audioid="${escapeAttr(item.audioId)}">
            ${escapeHtml(item.name)}
          </span>
          <span class="audio-id-hint">${item.audioId}</span>
          <button class="btn btn-sm" title="Preview (stub — no Roblox playback)">▶ PREVIEW</button>
          <div class="effects-controls">
            <span class="effects-label">VOL</span>
            <input class="effects-input vol-input"
                   type="number" min="0" max="10" step="0.1"
                   value="${item.defaults.volume}"
                   title="Volume (0–10)">
            <span class="effects-label">RANGE</span>
            <input class="effects-input range-input"
                   type="number" min="0" max="9999" step="1"
                   value="${item.defaults.range}"
                   title="Range (studs)">
            <label class="loop-toggle" title="Loop">
              <input type="checkbox" class="loop-input"
                     ${item.defaults.loop ? 'checked' : ''}>
              LOOP
            </label>
          </div>
          <button class="btn btn-add btn-sm"
                  data-audioid="${escapeAttr(item.audioId)}"
                  title="Add playsound command to queue">+ ADD</button>
        </div>
      `).join('')}
    </div>
  `).join('');

  // Click audio name → copy audio ID
  containerEl.querySelectorAll('.audio-name').forEach(el => {
    el.addEventListener('click', () => copyToClipboard(el.dataset.audioid));
  });

  // ADD button → read current inputs and build `playsound me` command
  containerEl.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const row      = btn.closest('.effects-item');
      const audioId  = btn.dataset.audioid;
      const volume   = row.querySelector('.vol-input').value;
      const range    = row.querySelector('.range-input').value;
      const loop     = row.querySelector('.loop-input').checked;

      addToCommandQueue(`playsound me ${audioId} ${loop} ${volume} ${range}`);
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
