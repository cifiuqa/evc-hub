// --- AETHIS PANEL ---
// Bottom-right panel. Drag-drop reorder, copy, push to queue, preview all.

import { state }                      from './state.js';
import { copyToClipboard, showToast } from './utils.js';
import { addToCommandQueue }          from './queue.js';
import { stopAll }                    from './audio-preview.js';

const AUDIO_BASE_PATH = 'audios/';

let dragFromIndex  = null;
let previewActive  = false;
let previewTimeout = null;

// --- OUTPUT ---

function buildAethisCommand(queue) {
  if (queue.length === 0) return '';

  const parts = queue.map((item, i) => {
    if (i < queue.length - 1) return `play ${item.audioId} & delay ${item.delay}`;
    return `play ${item.audioId}`;
  });

  return `run ${parts.join(' ')}`;
}


// --- RENDER ---

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

  listEl.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      state.aethisQueue.splice(idx, 1);
      renderAethisPanel();
    });
  });

  listEl.querySelectorAll('.queue-item-text').forEach((el, i) => {
    el.addEventListener('click', () => copyToClipboard(state.aethisQueue[i].audioId));
  });

  listEl.querySelectorAll('.queue-item[draggable]').forEach(el => {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover',  onDragOver);
    el.addEventListener('drop',      onDrop);
    el.addEventListener('dragend',   onDragEnd);
    el.addEventListener('dragleave', onDragLeave);
  });
}


// --- MUTATIONS ---

export function addToAethisQueue(item) {
  state.aethisQueue.push({ name: item.name, audioId: item.audioId, delay: item.delay });
  renderAethisPanel();
}


// --- PREVIEW ALL ---

// Plays each AETHIS sound in sequence using the item's delay value.
// The delay for item N is how long to wait after item N-1 starts before starting item N.
function startPreviewAll(previewBtn) {
  if (state.aethisQueue.length === 0) {
    showToast('AETHIS queue is empty', true);
    return;
  }

  stopPreviewAll(previewBtn);
  previewActive = true;

  previewBtn.textContent = '■ STOP';
  previewBtn.classList.add('playing');

  let accumulatedMs = 0;

  state.aethisQueue.forEach((item, i) => {
    const delayMs = i === 0 ? 0 : state.aethisQueue[i - 1].delay * 1000;
    accumulatedMs += delayMs;

    const t = setTimeout(() => {
      if (!previewActive) return;

      // Stop any currently playing preview
      stopAll();

      const audio = new Audio(`${AUDIO_BASE_PATH}${item.audioId}.ogg`);
      audio.play().catch(() => {});

      // When this is the last item, reset the button when it ends
      if (i === state.aethisQueue.length - 1) {
        audio.addEventListener('ended', () => {
          previewActive = false;
          previewBtn.textContent = '▶ PREVIEW ALL';
          previewBtn.classList.remove('playing');
        });
      }
    }, accumulatedMs);

    // Track all timeouts so we can cancel
    if (!window._aethisPreviewTimers) window._aethisPreviewTimers = [];
    window._aethisPreviewTimers.push(t);
  });
}

function stopPreviewAll(previewBtn) {
  previewActive = false;

  if (window._aethisPreviewTimers) {
    window._aethisPreviewTimers.forEach(t => clearTimeout(t));
    window._aethisPreviewTimers = [];
  }

  stopAll();

  if (previewBtn) {
    previewBtn.textContent = '▶ PREVIEW ALL';
    previewBtn.classList.remove('playing');
  }
}


// --- INIT ---

export function initAethisPanel() {
  const copyBtn      = document.getElementById('aethis-copy-btn');
  const clearBtn     = document.getElementById('aethis-clear-btn');
  const toQueueBtn   = document.getElementById('aethis-to-queue-btn');
  const previewBtn   = document.getElementById('aethis-preview-btn');

  copyBtn.addEventListener('click', () => {
    const output = buildAethisCommand(state.aethisQueue);
    if (!output) { showToast('AETHIS queue is empty', true); return; }
    copyToClipboard(output);
  });

  clearBtn.addEventListener('click', () => {
    if (state.aethisQueue.length === 0) return;
    stopPreviewAll(previewBtn);
    state.aethisQueue = [];
    renderAethisPanel();
  });

  // Push full AETHIS sequence as a single entry into the command queue.
  // The inner part (without "run ") is stored, and a null delay means
  // it runs at t=0 within the run command alongside other entries.
  toQueueBtn.addEventListener('click', () => {
    const output = buildAethisCommand(state.aethisQueue);
    if (!output) { showToast('AETHIS queue is empty', true); return; }
    addToCommandQueue(output.slice(4)); // strip "run "
    showToast('AETHIS sequence added to queue');
  });

  previewBtn.addEventListener('click', () => {
    if (previewActive) {
      stopPreviewAll(previewBtn);
    } else {
      startPreviewAll(previewBtn);
    }
  });

  renderAethisPanel();
}


// --- DRAG AND DROP ---

function onDragStart(e) {
  dragFromIndex = parseInt(this.dataset.index, 10);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragFromIndex.toString());
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.getElementById('aethis-queue-list')
    ?.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDragLeave() { this.classList.remove('drag-over'); }

function onDrop(e) {
  e.preventDefault();
  const toIndex = parseInt(this.dataset.index, 10);
  if (dragFromIndex === null || dragFromIndex === toIndex) return;

  const moved = state.aethisQueue.splice(dragFromIndex, 1)[0];
  state.aethisQueue.splice(toIndex, 0, moved);
  renderAethisPanel();
}

function onDragEnd() {
  this.classList.remove('dragging');
  dragFromIndex = null;
  document.getElementById('aethis-queue-list')
    ?.querySelectorAll('.queue-item').forEach(el => el.classList.remove('drag-over'));
}


// --- HELPERS ---

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }
