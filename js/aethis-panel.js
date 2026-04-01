// --- AETHIS PANEL ---
// Bottom-right panel for the AETHIS audio queue.
// Supports adding (with duplicates), drag-and-drop reorder, remove, clear, copy.

import { state }           from './state.js';
import { copyToClipboard, showToast } from './utils.js';

let dragFromIndex = null;

// Builds the AETHIS run command from the current queue.
function buildAethisCommand(queue) {
  if (queue.length === 0) return '';

  const parts = queue.map((item, i) => {
    if (i < queue.length - 1) {
      return `play ${item.audioId} & delay ${item.delay}`;
    }
    return `play ${item.audioId}`;
  });

  return `run ${parts.join(' ')}`;
}

// Re-renders the AETHIS queue list.
export function renderAethisPanel() {
  const listEl  = document.getElementById('aethis-queue-list');
  const countEl = document.getElementById('aethis-count');

  if (!listEl) return;

  const count = state.aethisQueue.length;
  countEl.textContent = count === 0 ? 'empty' : `${count} item${count !== 1 ? 's' : ''}`;

  if (count === 0) {
    listEl.innerHTML = '<div class="empty-state">No sounds queued · click items to add</div>';
    return;
  }

  listEl.innerHTML = state.aethisQueue
    .map((item, i) => `
      <div class="queue-item" draggable="true" data-index="${i}">
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <span class="queue-item-index">${i + 1}</span>
        <span class="queue-item-text" title="${escapeAttr(item.name)} · ${item.audioId}">
          ${escapeHtml(item.name)}
        </span>
        <span class="audio-delay-badge">${item.delay}s</span>
        <button class="queue-item-remove" data-index="${i}" title="Remove">×</button>
      </div>
    `)
    .join('');

  // Wire up remove buttons
  listEl.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      state.aethisQueue.splice(idx, 1);
      renderAethisPanel();
    });
  });

  // Click item text to copy audio ID
  listEl.querySelectorAll('.queue-item-text').forEach((el, i) => {
    el.addEventListener('click', () => copyToClipboard(state.aethisQueue[i].audioId));
  });

  // Drag-and-drop reorder
  listEl.querySelectorAll('.queue-item[draggable]').forEach(el => {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover',  onDragOver);
    el.addEventListener('drop',      onDrop);
    el.addEventListener('dragend',   onDragEnd);
    el.addEventListener('dragleave', onDragLeave);
  });
}

// Appends an item to the AETHIS queue and re-renders.
export function addToAethisQueue(item) {
  state.aethisQueue.push({ name: item.name, audioId: item.audioId, delay: item.delay });
  renderAethisPanel();
}

// Initialises panel controls.
export function initAethisPanel() {
  const copyBtn     = document.getElementById('aethis-copy-btn');
  const clearBtn    = document.getElementById('aethis-clear-btn');
  const collapseBtn = document.getElementById('aethis-collapse-btn');
  const bodyEl      = document.getElementById('aethis-queue-body');

  copyBtn.addEventListener('click', () => {
    const output = buildAethisCommand(state.aethisQueue);
    if (!output) { showToast('AETHIS queue is empty', true); return; }
    copyToClipboard(output);
  });

  clearBtn.addEventListener('click', () => {
    if (state.aethisQueue.length === 0) return;
    state.aethisQueue = [];
    renderAethisPanel();
  });

  collapseBtn.addEventListener('click', () => {
    const collapsed = bodyEl.classList.toggle('collapsed');
    collapseBtn.textContent = collapsed ? '▲' : '▼';
  });

  renderAethisPanel();
}


// --- DRAG AND DROP HANDLERS ---

function onDragStart(e) {
  dragFromIndex = parseInt(this.dataset.index, 10);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragFromIndex.toString());
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const listEl = document.getElementById('aethis-queue-list');
  listEl.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDragLeave() {
  this.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const toIndex = parseInt(this.dataset.index, 10);

  if (dragFromIndex === null || dragFromIndex === toIndex) return;

  // Reorder the queue array
  const moved = state.aethisQueue.splice(dragFromIndex, 1)[0];
  state.aethisQueue.splice(toIndex, 0, moved);

  renderAethisPanel();
}

function onDragEnd() {
  this.classList.remove('dragging');
  dragFromIndex = null;

  const listEl = document.getElementById('aethis-queue-list');
  if (listEl) {
    listEl.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
  }
}


// --- HELPERS ---

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}
