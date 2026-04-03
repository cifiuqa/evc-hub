// --- MORPHS TAB ---
// Clicking a morph card opens a floating command panel to its right.
// Commands are shown with {person} resolved from the target input.

import { state }                     from './state.js';
import { copyToClipboard, buildTOC } from './utils.js';
import { addToCommandQueue }         from './queue.js';

const IMAGE_BASE_PATH = 'images/morphs';

let activeMorphCard = null;

function resolveCommand(cmd, person) {
  const target = person.trim() || '{person}';
  return cmd.replace(/\{person\}/g, target);
}

function buildMorphCopyString(item, person) {
  const resolved = item.commands.map(c => resolveCommand(c, person));
  return `run ${resolved.join(' & ')}`;
}

// --- COMMAND PANEL ---

function getOrCreatePanel() {
  let panel = document.getElementById('morph-cmd-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'morph-cmd-panel';
    panel.className = 'morph-cmd-panel';
    panel.innerHTML = `
      <div class="mcp-header">
        <span class="mcp-title">COMMANDS</span>
        <button class="mcp-close" title="Close">×</button>
      </div>
      <div class="mcp-morph-name"></div>
      <div class="mcp-cmd-list"></div>
      <div class="mcp-footer">
        <button class="btn btn-primary btn-sm mcp-copy-all-btn">COPY ALL</button>
        <button class="btn btn-add btn-sm mcp-add-all-btn">+ ADD ALL</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('.mcp-close').addEventListener('click', closePanel);
    document.addEventListener('keydown', onKeyDown, { capture: true });
  }
  return panel;
}

function closePanel() {
  const panel = document.getElementById('morph-cmd-panel');
  if (panel) {
    panel.classList.remove('mcp-visible');
    panel.classList.add('mcp-hiding');
    panel.addEventListener('animationend', () => panel.classList.remove('mcp-hiding'), { once: true });
  }
  if (activeMorphCard) {
    activeMorphCard.classList.remove('morph-card-active');
    activeMorphCard = null;
  }
}

function onKeyDown(e) {
  if (e.key === 'Escape') closePanel();
}

function openPanel(card, item, categories) {
  // Deactivate previous card
  if (activeMorphCard && activeMorphCard !== card) {
    activeMorphCard.classList.remove('morph-card-active');
  }

  // Toggle: clicking same card closes it
  if (activeMorphCard === card) {
    closePanel();
    return;
  }

  activeMorphCard = card;
  card.classList.add('morph-card-active');

  const panel     = getOrCreatePanel();
  const person    = document.getElementById('morph-person-input')?.value ?? '';
  const resolved  = item.commands.map(c => resolveCommand(c, person));

  panel.querySelector('.mcp-morph-name').textContent = item.name;

  panel.querySelector('.mcp-cmd-list').innerHTML = resolved.map((cmd, i) => `
    <div class="mcp-cmd-row" data-index="${i}">
      <span class="mcp-cmd-index">${i + 1}</span>
      <span class="mcp-cmd-text" title="${escapeAttr(cmd)}">${escapeHtml(cmd)}</span>
      <button class="mcp-cmd-copy" data-index="${i}" title="Copy">⧉</button>
      <button class="mcp-cmd-add"  data-index="${i}" title="Add to queue">+</button>
    </div>
  `).join('');

  // Per-command actions
  panel.querySelectorAll('.mcp-cmd-copy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      copyToClipboard(resolved[parseInt(btn.dataset.index, 10)]);
    });
  });

  panel.querySelectorAll('.mcp-cmd-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      addToCommandQueue(resolved[parseInt(btn.dataset.index, 10)]);
    });
  });

  // Footer actions — re-resolve at click time so input changes are respected
  const copyAllBtn = panel.querySelector('.mcp-copy-all-btn');
  const addAllBtn  = panel.querySelector('.mcp-add-all-btn');

  copyAllBtn.onclick = () => {
    const p = document.getElementById('morph-person-input')?.value ?? '';
    copyToClipboard(buildMorphCopyString(item, p));
  };

  addAllBtn.onclick = () => {
    const p = document.getElementById('morph-person-input')?.value ?? '';
    item.commands.map(c => resolveCommand(c, p)).forEach(cmd => addToCommandQueue(cmd));
  };

  // Position panel to the right of the card
  positionPanel(panel, card);
  panel.classList.remove('mcp-hiding');
  panel.classList.add('mcp-visible');
}

function positionPanel(panel, card) {
  const mainContent = document.getElementById('main-content');
  const cardRect    = card.getBoundingClientRect();
  const mainRect    = mainContent.getBoundingClientRect();

  const PANEL_W   = 300;
  const GAP       = 8;
  const spaceRight = mainRect.right - cardRect.right;

  let left, top;

  if (spaceRight >= PANEL_W + GAP) {
    // Fits to the right of the card
    left = cardRect.right + GAP;
    top  = cardRect.top;
  } else {
    // Not enough room — anchor to right edge of main content
    left = mainRect.right - PANEL_W - 8;
    top  = cardRect.top;
  }

  // Clamp vertically so panel doesn't overflow below viewport
  const viewH      = window.innerHeight;
  const panelH     = Math.min(400, viewH - top - 16);
  top              = Math.max(mainRect.top + 8, Math.min(top, viewH - panelH - 16));

  panel.style.left      = `${left}px`;
  panel.style.top       = `${top}px`;
  panel.style.maxHeight = `${panelH}px`;
}


// --- RENDER ---

export function renderMorphsTab() {
  const containerEl = document.getElementById('tab-morphs');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.morphs) return;

  // Close any open panel when re-rendering
  closePanel();

  const { categories } = state.data.morphs;

  containerEl.innerHTML = `
    <div class="morphs-header">
      <label for="morph-person-input">TARGET PLAYER:</label>
      <input type="text" id="morph-person-input" class="morph-person-input"
             placeholder="username or target(s)" value="">
    </div>
    ${categories.map(cat => `
      <div class="morphs-category-section" data-category-id="${cat.id}">
        <div class="section-header">
          <h2>${escapeHtml(cat.name)}</h2>
          <span class="item-count">${cat.items.length} morph${cat.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="morphs-grid">
          ${cat.items.map((item, itemIndex) => {
            const imgPath = `${IMAGE_BASE_PATH}/${cat.id}/${item.imageFile}`;
            return `
              <div class="morph-card" data-cat="${escapeAttr(cat.id)}" data-item="${itemIndex}"
                   title="Click to view commands">
                <img class="morph-image" src="${imgPath}" alt="${escapeAttr(item.name)}"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="morph-image-placeholder" style="display:none;">NO IMAGE</div>
                <div class="morph-info">
                  <div class="morph-name">${escapeHtml(item.name)}</div>
                  <div class="morph-description">${escapeHtml(item.description)}</div>
                </div>
                <div class="morph-card-footer">
                  <span class="morph-cmd-count">${item.commands.length} cmd${item.commands.length !== 1 ? 's' : ''}</span>
                  <span class="morph-card-hint">click to expand ›</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;

  // Card click → open panel
  containerEl.querySelectorAll('.morph-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === card.dataset.cat);
      const item = cat?.items[parseInt(card.dataset.item, 10)];
      if (item) openPanel(card, item, categories);
    });
  });

  // Close panel when clicking outside
  contentEl.addEventListener('click', e => {
    const panel = document.getElementById('morph-cmd-panel');
    if (!panel?.classList.contains('mcp-visible')) return;
    if (!e.target.closest('.morph-card') && !e.target.closest('#morph-cmd-panel')) {
      closePanel();
    }
  }, { capture: false });

  // Re-position panel if content scrolls
  contentEl.addEventListener('scroll', () => {
    const panel = document.getElementById('morph-cmd-panel');
    if (panel?.classList.contains('mcp-visible') && activeMorphCard) {
      positionPanel(panel, activeMorphCard);
    }
  }, { passive: true });

  buildTOC(categories, tocListEl, contentEl);
}

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }