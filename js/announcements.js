// --- ANNOUNCEMENTS TAB ---
// Categorised list of pre-made announcements. Each has a command to copy/queue,
// and optionally a linked audio ID to play alongside it.

import { state }                       from './state.js';
import { copyToClipboard, buildTOC }   from './utils.js';
import { addToCommandQueue }           from './queue.js';
import { probeAudioIds, togglePreview } from './audio-preview.js';

export async function renderAnnouncementsTab() {
  const containerEl = document.getElementById('subtab-announcements');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.announcements) return;

  const { categories } = state.data.announcements;

  // Probe audio IDs that are non-empty
  const audioIds = categories
    .flatMap(c => c.items.map(i => i.audioId))
    .filter(Boolean);
  const available = await probeAudioIds(audioIds);

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} announcement${cat.items.length !== 1 ? 's' : ''}</span>
      </div>
      ${cat.items.map((item, itemIndex) => {
        const hasAudio = item.audioId && available.has(item.audioId);
        return `
          <div class="announcement-item" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}">
            <div class="announcement-info">
              <div class="announcement-name">${escapeHtml(item.name)}</div>
              <div class="announcement-desc">${escapeHtml(item.description)}</div>
              <div class="announcement-cmd" title="${escapeAttr(item.command)}">${escapeHtml(item.command)}</div>
            </div>
            <div class="announcement-actions">
              ${item.audioId ? `
                <button class="btn btn-sm btn-preview ${hasAudio ? '' : 'no-audio'}"
                        data-audioid="${escapeAttr(item.audioId)}"
                        ${hasAudio ? '' : 'disabled'}
                        title="${hasAudio ? 'Preview audio' : 'No audio file'}">
                  ▶ PREVIEW
                </button>
              ` : ''}
              <button class="btn btn-sm ann-copy-btn"
                      data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}"
                      title="Copy command">COPY</button>
              <button class="btn btn-add btn-sm ann-add-btn"
                      data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}"
                      title="Add to command queue">+ ADD</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  containerEl.querySelectorAll('.btn-preview:not(.no-audio)').forEach(btn => {
    btn.addEventListener('click', () => {
      const audioId = btn.dataset.audioid;
      const result  = togglePreview(audioId);
      btn.classList.toggle('playing', result === 'playing');
      btn.textContent = result === 'playing' ? '■ STOP' : '▶ AUDIO';
    });
  });

  containerEl.querySelectorAll('.ann-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === btn.dataset.cat);
      const item = cat?.items[parseInt(btn.dataset.item, 10)];
      if (item) copyToClipboard(item.command);
    });
  });

  containerEl.querySelectorAll('.ann-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === btn.dataset.cat);
      const item = cat?.items[parseInt(btn.dataset.item, 10)];
      if (item) addToCommandQueue(item.command);
    });
  });

  buildTOC(categories, tocListEl, contentEl);
}

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }
