// --- COMMAND QUEUE PANEL ---
// Manages the bottom-left global command queue.

import { state }           from './state.js';
import { copyToClipboard, showToast } from './utils.js';

// Joins all queued commands into a single run command string.
function buildRunCommand(queue) {
  if (queue.length === 0) return '';
  return `run ${queue.join(' & ')}`;
}

// Re-renders the queue list in the DOM.
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
    .map((cmd, i) => `
      <div class="queue-item">
        <span class="queue-item-index">${i + 1}</span>
        <span class="queue-item-text" title="${escapeAttr(cmd)}">${escapeHtml(cmd)}</span>
        <button class="queue-item-remove" data-index="${i}" title="Remove">×</button>
      </div>
    `)
    .join('');

  // Wire up remove buttons
  listEl.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      state.commandQueue.splice(idx, 1);
      renderCommandQueue();
    });
  });

  // Click item text to copy that individual command
  listEl.querySelectorAll('.queue-item-text').forEach((el, i) => {
    el.addEventListener('click', () => copyToClipboard(state.commandQueue[i]));
  });
}

// Appends a command string to the queue and re-renders.
export function addToCommandQueue(command) {
  const trimmed = command.trim();
  if (!trimmed) return;
  state.commandQueue.push(trimmed);
  renderCommandQueue();
}

// Initialises all panel controls (copy, clear, collapse, manual add).
export function initCommandQueuePanel() {
  const copyBtn     = document.getElementById('cmd-copy-btn');
  const clearBtn    = document.getElementById('cmd-clear-btn');
  const collapseBtn = document.getElementById('cmd-collapse-btn');
  const addBtn      = document.getElementById('cmd-add-btn');
  const inputEl     = document.getElementById('cmd-manual-input');
  const bodyEl      = document.getElementById('cmd-queue-body');

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

  collapseBtn.addEventListener('click', () => {
    const collapsed = bodyEl.classList.toggle('collapsed');
    collapseBtn.textContent = collapsed ? '▲' : '▼';
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


// --- HELPERS ---

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}
