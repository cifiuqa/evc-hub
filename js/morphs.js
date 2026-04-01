// --- MORPHS TAB ---
// Renders categorised morph cards with image, description, and command copy.
// The user sets a <person> via a sticky text input. Commands copy only (no queue).

import { state }                     from './state.js';
import { copyToClipboard, buildTOC } from './utils.js';

const IMAGE_BASE_PATH = 'images/morphs';

// Resolves {person} in a command string, falling back to a literal placeholder.
function resolveCommand(cmd, person) {
  const target = person.trim() || '{person}';
  return cmd.replace(/\{person\}/g, target);
}

// Builds the final joined run string for all of a morph's commands.
function buildMorphCopyString(item, person) {
  const resolved = item.commands.map(c => resolveCommand(c, person));
  return `run ${resolved.join(' & ')}`;
}

export function renderMorphsTab() {
  const containerEl = document.getElementById('tab-morphs');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.morphs) return;

  const { categories } = state.data.morphs;

  containerEl.innerHTML = `
    <div class="morphs-header">
      <label for="morph-person-input">TARGET PLAYER:</label>
      <input type="text"
             id="morph-person-input"
             class="morph-person-input"
             placeholder="username or . for self..."
             value="">
    </div>
    ${categories.map(cat => `
      <div class="morphs-category-section" data-category-id="${cat.id}">
        <div class="section-header">
          <h2>${escapeHtml(cat.name)}</h2>
          <span class="item-count">${cat.items.length} morph${cat.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="morphs-grid">
          ${cat.items.map((item, itemIndex) => {
            const imgPath = IMAGE_BASE_PATH + '/' + cat.id + '/' + item.imageFile;
            return `
              <div class="morph-card">
                <img class="morph-image"
                     src="${imgPath}"
                     alt="${escapeAttr(item.name)}"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="morph-image-placeholder" style="display:none;">NO IMAGE</div>
                <div class="morph-info">
                  <div class="morph-name">${escapeHtml(item.name)}</div>
                  <div class="morph-description">${escapeHtml(item.description)}</div>
                  <div class="morph-commands">
                    ${item.commands.map(c => `<span class="morph-cmd-line" title="${escapeAttr(c)}">${escapeHtml(c)}</span>`).join('')}
                  </div>
                </div>
                <div class="morph-card-footer">
                  <button class="btn btn-primary btn-sm copy-morph-btn"
                          data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}"
                          title="Copy run command with target player">
                    COPY COMMAND
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;

  // COPY COMMAND buttons — read person input at click time
  containerEl.querySelectorAll('.copy-morph-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === btn.dataset.cat);
      const item = cat?.items[parseInt(btn.dataset.item, 10)];
      if (!item) return;

      const person  = document.getElementById('morph-person-input').value;
      const command = buildMorphCopyString(item, person);
      copyToClipboard(command);
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
