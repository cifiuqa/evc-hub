// --- MORPHS TAB ---
// Clicking a morph card opens a floating command panel to its right.
// Commands are shown with {person} resolved from the target input.
// Categories may optionally contain `subcategories` — each with their own
// id, name, and items array. If absent, items sit directly on the category.

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

  positionPanel(panel, card);
  panel.classList.remove('mcp-hiding');
  panel.classList.add('mcp-visible');
}

function positionPanel(panel, card) {
  const mainContent = document.getElementById('main-content');
  const cardRect    = card.getBoundingClientRect();
  const mainRect    = mainContent.getBoundingClientRect();

  const PANEL_W    = 300;
  const GAP        = 8;
  const spaceRight = mainRect.right - cardRect.right;

  let left, top;

  if (spaceRight >= PANEL_W + GAP) {
    left = cardRect.right + GAP;
    top  = cardRect.top;
  } else {
    left = mainRect.right - PANEL_W - 8;
    top  = cardRect.top;
  }

  const viewH   = window.innerHeight;
  const panelH  = Math.min(400, viewH - top - 16);
  top           = Math.max(mainRect.top + 8, Math.min(top, viewH - panelH - 16));

  panel.style.left      = `${left}px`;
  panel.style.top       = `${top}px`;
  panel.style.maxHeight = `${panelH}px`;
}


// --- HELPERS ---

// Returns a flat list of { catId, subId, subName, items } blocks for rendering.
// If a category has subcategories, each sub becomes a block.
// If not, the category's own items form a single block with subId/subName null.
function getItemBlocks(cat) {
  if (cat.subcategories && cat.subcategories.length > 0) {
    return cat.subcategories.map(sub => ({
      catId:   cat.id,
      subId:   sub.id,
      subName: sub.name,
      items:   sub.items
    }));
  }
  return [{ catId: cat.id, subId: null, subName: null, items: cat.items }];
}

// Renders the morph grid for a list of items, returning HTML string.
function renderMorphGrid(items, catId) {
  return `
    <div class="morphs-grid">
      ${items.map((item, itemIndex) => {
        const imgPath = `${IMAGE_BASE_PATH}/${catId}/${item.imageFile}`;
        return `
          <div class="morph-card" data-cat="${escapeAttr(catId)}"
               data-name="${escapeAttr(item.name)}"
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
  `;
}


// --- RENDER ---

export function renderMorphsTab() {
  const containerEl = document.getElementById('tab-morphs');
  const tocListEl   = document.getElementById('toc-list');
  const contentEl   = document.getElementById('main-content');

  if (!containerEl || !state.data.morphs) return;

  closePanel();

  const { categories } = state.data.morphs;

  containerEl.innerHTML = `
    <div class="morphs-header">
      <label for="morph-person-input">TARGET PLAYER:</label>
      <input type="text" id="morph-person-input" class="morph-person-input"
             placeholder="username or target(s)" value="">
    </div>
    ${categories.map(cat => {
      const blocks = getItemBlocks(cat);
      const totalItems = blocks.reduce((sum, b) => sum + b.items.length, 0);

      return `
        <div class="morphs-category-section" data-category-id="${cat.id}">
          <div class="section-header">
            <h2>${escapeHtml(cat.name)}</h2>
            <span class="item-count">${totalItems} morph${totalItems !== 1 ? 's' : ''}</span>
          </div>
          ${blocks.map(block => `
            ${block.subName ? `
              <div class="morphs-subcategory-header" data-subcategory-id="${escapeAttr(block.catId + '-' + block.subId)}">
                <span class="morphs-subcategory-name">${escapeHtml(block.subName)}</span>
                <span class="item-count">${block.items.length} morph${block.items.length !== 1 ? 's' : ''}</span>
              </div>
            ` : ''}
            ${renderMorphGrid(block.items, block.catId)}
          `).join('')}
        </div>
      `;
    }).join('')}
  `;

  // Wire up card clicks — look up item by name across all items in the category
  containerEl.querySelectorAll('.morph-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat  = categories.find(c => c.id === card.dataset.cat);
      if (!cat) return;

      const allItems = getAllItemsForCategory(cat);
      const item     = allItems.find(i => i.name === card.dataset.name);
      if (item) openPanel(card, item, categories);
    });
  });

  contentEl.addEventListener('click', e => {
    const panel = document.getElementById('morph-cmd-panel');
    if (!panel?.classList.contains('mcp-visible')) return;
    if (!e.target.closest('.morph-card') && !e.target.closest('#morph-cmd-panel')) {
      closePanel();
    }
  }, { capture: false });

  contentEl.addEventListener('scroll', () => {
    const panel = document.getElementById('morph-cmd-panel');
    if (panel?.classList.contains('mcp-visible') && activeMorphCard) {
      positionPanel(panel, activeMorphCard);
    }
  }, { passive: true });

  buildMorphsTOC(categories, tocListEl, contentEl);
}

// Flattens all items across subcategories (or direct items) for a category.
function getAllItemsForCategory(cat) {
  if (cat.subcategories && cat.subcategories.length > 0) {
    return cat.subcategories.flatMap(sub => sub.items);
  }
  return cat.items;
}


// --- TOC ---

// Builds a two-level TOC: categories at top level, subcategories indented below.
function buildMorphsTOC(categories, tocListEl, contentEl) {
  tocListEl.innerHTML = '';

  categories.forEach(cat => {
    const catLink = document.createElement('a');
    catLink.className   = 'toc-category';
    catLink.textContent = cat.name;
    catLink.href        = '#';

    catLink.addEventListener('click', e => {
      e.preventDefault();
      const target = contentEl.querySelector(`[data-category-id="${cat.id}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      clearTOCActive(tocListEl);
      catLink.classList.add('active');
    });

    tocListEl.appendChild(catLink);

    // Subcategory entries — indented, only if present
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories.forEach(sub => {
        const subLink = document.createElement('a');
        subLink.className   = 'toc-subcategory';
        subLink.textContent = sub.name;
        subLink.href        = '#';

        subLink.addEventListener('click', e => {
          e.preventDefault();
          const subId = `${cat.id}-${sub.id}`;
          const target = contentEl.querySelector(`[data-subcategory-id="${subId}"]`);
          if (!target) return;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          clearTOCActive(tocListEl);
          subLink.classList.add('active');
        });

        tocListEl.appendChild(subLink);
      });
    }
  });
}

function clearTOCActive(tocListEl) {
  tocListEl.querySelectorAll('.toc-category, .toc-subcategory').forEach(a => a.classList.remove('active'));
}


// --- HELPERS ---

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }