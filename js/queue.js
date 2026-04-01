// --- COMMAND QUEUE PANEL ---
// Each queue entry is { cmd: string, delay: number|null }.
// delay > 0 means "insert a `delay <n>` before this command in the output".
// The queue supports drag-and-drop reorder.

import { state }                      from './state.js';
import { copyToClipboard, showToast } from './utils.js';

let dragFromIndex = null;

// --- OUTPUT BUILD ---

// Builds the full run command string from the queue.
// In a Roblox run command, all commands start at the same time unless separated
// by `delay <n>`. Delays inserted here accumulate so the intent is clear.
export function buildRunCommand(queue) {
  if (queue.length === 0) return '';

  const parts = [];
  queue.forEach(entry => {
    if (entry.delay && entry.delay > 0) {
      parts.push(`delay ${entry.delay}`);
    }
    parts.push(entry.cmd);
  });

  return `run ${parts.join(' & ')}`;
}


// --- RENDER ---

export function renderCommandQueue() {
  const listEl  = document.getElementById('cmd-queue-list');
  const countEl = document.getElementById('cmd-count');
  if (!listEl) return;

  const count = state.commandQueue.length;
  countEl.textContent = count === 0 ? 'empty' : `${count} cmd${count !== 1 ? 's' : ''}`;

  if (count === 0) {
    listEl.innerHTML = '<div class="empty-state">No commands queued</div>';
    return;
  }

  listEl.innerHTML = state.commandQueue
    .map((entry, i) => `
      <div class="queue-item" draggable="true" data-index="${i}">
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <span class="queue-item-index">${i + 1}</span>
        <span class="queue-item-text" title="${escapeAttr(entry.cmd)}">${escapeHtml(entry.cmd)}</span>
        <span class="queue-delay-label">+</span>
        <input class="queue-delay-input"
               type="number" min="0" step="0.5"
               value="${entry.delay ?? ''}"
               placeholder="delay"
               title="Delay in seconds before this command runs"
               data-index="${i}">
        <span class="queue-delay-label">s</span>
        <button class="queue-item-remove" data-index="${i}" title="Remove">×</button>
      </div>
    `)
    .join('');

  // Delay input → update entry immediately
  listEl.querySelectorAll('.queue-delay-input').forEach(input => {
    input.addEventListener('change', () => {
      const idx = parseInt(input.dataset.index, 10);
      const val = parseFloat(input.value);
      state.commandQueue[idx].delay = isNaN(val) || val <= 0 ? null : val;
    });
  });

  // Remove buttons
  listEl.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      state.commandQueue.splice(idx, 1);
      renderCommandQueue();
    });
  });

  // Click text → copy that single command
  listEl.querySelectorAll('.queue-item-text').forEach((el, i) => {
    el.addEventListener('click', () => copyToClipboard(state.commandQueue[i].cmd));
  });

  // Drag-and-drop
  listEl.querySelectorAll('.queue-item[draggable]').forEach(el => {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover',  onDragOver);
    el.addEventListener('drop',      onDrop);
    el.addEventListener('dragend',   onDragEnd);
    el.addEventListener('dragleave', onDragLeave);
  });
}


// --- MUTATIONS ---

export function addToCommandQueue(cmd, delay = null) {
  const trimmed = cmd.trim();
  if (!trimmed) return;
  state.commandQueue.push({ cmd: trimmed, delay });
  renderCommandQueue();
}


// --- INIT ---

export function initCommandQueuePanel() {
  const copyBtn  = document.getElementById('cmd-copy-btn');
  const clearBtn = document.getElementById('cmd-clear-btn');
  const addBtn   = document.getElementById('cmd-add-btn');
  const inputEl  = document.getElementById('cmd-manual-input');

  copyBtn.addEventListener('click', () => {
    const output = buildRunCommand(state.commandQueue);
    if (!output) { showToast('Queue is empty', true); return; }
    copyToClipboard(output);
  });

  clearBtn.addEventListener('click', () => {
    if (state.commandQueue.length === 0) return;
    state.commandQueue = [];
    renderCommandQueue();
  });

  const addCommand = () => {
    const val = inputEl.value.trim();
    if (!val) return;
    addToCommandQueue(val);
    inputEl.value = '';
    inputEl.focus();
  };

  addBtn.addEventListener('click', addCommand);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') addCommand();
  });

  renderCommandQueue();
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
  document.getElementById('cmd-queue-list')
    ?.querySelectorAll('.queue-item')
    .forEach(el => el.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDragLeave() {
  this.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const toIndex = parseInt(this.dataset.index, 10);
  if (dragFromIndex === null || dragFromIndex === toIndex) return;

  const moved = state.commandQueue.splice(dragFromIndex, 1)[0];
  state.commandQueue.splice(toIndex, 0, moved);
  renderCommandQueue();
}

function onDragEnd() {
  this.classList.remove('dragging');
  dragFromIndex = null;
  document.getElementById('cmd-queue-list')
    ?.querySelectorAll('.queue-item')
    .forEach(el => el.classList.remove('drag-over'));
}


// --- HELPERS ---

function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeAttr(str) { return str.replace(/"/g, '&quot;'); }
