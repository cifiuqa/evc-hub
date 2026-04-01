// --- EFFECTS TAB ---
// Each item has a type toggle (playsound / play). play type hides vol/range inputs.

import { state }                       from './state.js';
import { copyToClipboard, buildTOC }   from './utils.js';
import { addToCommandQueue }           from './queue.js';
import { probeAudioIds, togglePreview } from './audio-preview.js';

export async function renderEffectsTab() {
  const containerEl = document.getElementById('subtab-effects');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.effects) return;

  const { categories } = state.data.effects;

  const allIds    = categories.flatMap(c => c.items.map(i => i.audioId));
  const available = await probeAudioIds(allIds);

  containerEl.innerHTML = categories.map(cat => `
    <div class="category-section" data-category-id="${cat.id}">
      <div class="section-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="item-count">${cat.items.length} effect${cat.items.length !== 1 ? 's' : ''}</span>
      </div>
      ${cat.items.map((item, itemIndex) => {
        const hasAudio  = available.has(item.audioId);
        const isPlay    = (item.type ?? 'playsound') === 'play';
        return `
          <div class="effects-item" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}">
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

            <div class="type-toggle">
              <button class="type-toggle-btn ${isPlay ? '' : 'active'}" data-type="playsound">PLAYSOUND</button>
              <button class="type-toggle-btn ${isPlay ? 'active' : ''}" data-type="play">PLAY</button>
            </div>

            <div class="effects-controls playsound-controls" ${isPlay ? 'style="display:none"' : ''}>
              <span class="effects-label">VOL</span>
              <input class="effects-input vol-input" type="number"
                     min="0" max="10" step="0.1"
                     value="${item.defaults.volume}" title="Volume (0–10)">
              <span class="effects-label">RANGE</span>
              <input class="effects-input range-input" type="number"
                     min="0" max="9999" step="1"
                     value="${item.defaults.range}" title="Range (studs)">
              <label class="loop-toggle" title="Loop">
                <input type="checkbox" class="loop-input" ${item.defaults.loop ? 'checked' : ''}> LOOP
              </label>
            </div>

            <button class="btn btn-add btn-sm effects-add-btn"
                    data-audioid="${escapeAttr(item.audioId)}"
                    title="Add command to queue">+ ADD</button>
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

  // Type toggle — show/hide vol/range controls
  containerEl.querySelectorAll('.type-toggle').forEach(toggleEl => {
    toggleEl.querySelectorAll('.type-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleEl.querySelectorAll('.type-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const row       = toggleEl.closest('.effects-item');
        const controls  = row.querySelector('.playsound-controls');
        const isPlay    = btn.dataset.type === 'play';
        controls.style.display = isPlay ? 'none' : '';
      });
    });
  });

  // ADD button — builds command based on current toggle state
  containerEl.querySelectorAll('.effects-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row       = btn.closest('.effects-item');
      const audioId   = btn.dataset.audioid;
      const activeType = row.querySelector('.type-toggle-btn.active')?.dataset.type ?? 'playsound';

      let cmd;
      if (activeType === 'play') {
        cmd = `play ${audioId}`;
      } else {
        const volume = row.querySelector('.vol-input').value;
        const range  = row.querySelector('.range-input').value;
        const loop   = row.querySelector('.loop-input').checked;
        cmd = `playsound me ${audioId} ${loop} ${volume} ${range}`;
      }

      addToCommandQueue(cmd);
    });
  });

  buildTOC(categories, tocListEl, contentEl);
}

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }