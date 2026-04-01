// --- AETHIS TAB ---
// Clicking an item adds it to the AETHIS queue. Preview button plays .ogg if present.

import { state }               from './state.js';
import { copyToClipboard, buildTOC } from './utils.js';
import { addToAethisQueue }    from './aethis-panel.js';
import { probeAudioIds, togglePreview, isPlaying } from './audio-preview.js';

export async function renderAethisTab() {
  const containerEl = document.getElementById('subtab-aethis');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.aethis) return;

  const { categories } = state.data.aethis;

  // Collect all audio IDs and probe which .ogg files exist
  const allIds = categories.flatMap(c => c.items.map(i => i.audioId));
  const available = await probeAudioIds(allIds);

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} sound${cat.items.length !== 1 ? 's' : ''}</span>
      </div>
      ${cat.items.map((item, itemIndex) => {
        const hasAudio = available.has(item.audioId);
        return `
          <div class="audio-item" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}">
            <span class="audio-name"
                  title="Click to copy audio ID: ${escapeAttr(item.audioId)}"
                  data-audioid="${escapeAttr(item.audioId)}">
              ${escapeHtml(item.name)}
            </span>
            <span class="audio-id-hint">${item.audioId}</span>
            <span class="audio-delay-badge" title="Fixed delay after this sound">⏱ ${item.delay}s</span>
            <button class="btn btn-sm btn-preview ${hasAudio ? '' : 'no-audio'}"
                    data-audioid="${escapeAttr(item.audioId)}"
                    ${hasAudio ? '' : 'disabled'}
                    title="${hasAudio ? 'Preview audio' : 'No audio file found'}">
              ▶ PREVIEW
            </button>
            <button class="btn btn-add btn-sm aethis-add-btn"
                    data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}"
                    title="Add to AETHIS queue">+ ADD</button>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  // Click name → copy audio ID
  containerEl.querySelectorAll('.audio-name').forEach(el => {
    el.addEventListener('click', () => copyToClipboard(el.dataset.audioid));
  });

  // Preview buttons
  containerEl.querySelectorAll('.btn-preview:not(.no-audio)').forEach(btn => {
    btn.addEventListener('click', () => {
      const audioId = btn.dataset.audioid;
      const state   = togglePreview(audioId);
      btn.classList.toggle('playing', state === 'playing');
      btn.textContent = state === 'playing' ? '■ STOP' : '▶ PREVIEW';
    });
  });

  // ADD buttons
  containerEl.querySelectorAll('.aethis-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === btn.dataset.cat);
      const item = cat?.items[parseInt(btn.dataset.item, 10)];
      if (item) addToAethisQueue(item);
    });
  });

  buildTOC(categories, tocListEl, contentEl);
}

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }