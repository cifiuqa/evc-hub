// --- MUSIC TAB ---

import { state }                       from './state.js';
import { copyToClipboard, buildTOC }   from './utils.js';
import { addToCommandQueue }           from './queue.js';
import { probeAudioIds, togglePreview } from './audio-preview.js';

export async function renderMusicTab() {
  const containerEl = document.getElementById('subtab-music');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.music) return;

  const { categories } = state.data.music;

  const allIds   = categories.flatMap(c => c.items.map(i => i.audioId));
  const available = await probeAudioIds(allIds);

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} track${cat.items.length !== 1 ? 's' : ''}</span>
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
            <button class="btn btn-sm btn-preview ${hasAudio ? '' : 'no-audio'}"
                    data-audioid="${escapeAttr(item.audioId)}"
                    ${hasAudio ? '' : 'disabled'}
                    title="${hasAudio ? 'Preview audio' : 'No audio file found'}">
              ▶ PREVIEW
            </button>
            <div class="effects-controls">
              <label class="loop-toggle" title="Loop this track">
                <input type="checkbox" class="loop-input"> LOOP
              </label>
            </div>
            <button class="btn btn-add btn-sm music-add-btn"
                    data-audioid="${escapeAttr(item.audioId)}"
                    title="Add play command to queue">+ ADD</button>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  containerEl.querySelectorAll('.audio-name').forEach(el => {
    el.addEventListener('click', () => copyToClipboard(el.dataset.audioid));
  });

  containerEl.querySelectorAll('.btn-preview:not(.no-audio)').forEach(btn => {
    btn.addEventListener('click', () => {
      const audioId = btn.dataset.audioid;
      const result  = togglePreview(audioId);
      btn.classList.toggle('playing', result === 'playing');
      btn.textContent = result === 'playing' ? '■ STOP' : '▶ PREVIEW';
    });
  });

  containerEl.querySelectorAll('.music-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row   = btn.closest('.audio-item');
      const loop  = row.querySelector('.loop-input').checked;
      const cmd   = loop ? `play ${btn.dataset.audioid} true` : `play ${btn.dataset.audioid}`;
      addToCommandQueue(cmd);
    });
  });

  buildTOC(categories, tocListEl, contentEl);
}

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }