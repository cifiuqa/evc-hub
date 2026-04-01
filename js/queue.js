// --- COMMAND QUEUE PANEL ---
// Manages the bottom-left global command queue.

import { state }                       from './state.js';
import { copyToClipboard, showToast }  from './utils.js';

function buildRunCommand(queue) {
  if (queue.length === 0) return '';
  return `run ${queue.join(' & ')}`;
}

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

  listEl.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      state.commandQueue.splice(idx, 1);
      renderCommandQueue();
    });
  });

  listEl.querySelectorAll('.queue-item-text').forEach((el, i) => {
    el.addEventListener('click', () => copyToClipboard(state.commandQueue[i]));
  });
}

export function addToCommandQueue(command) {
  const trimmed = command.trim();
  if (!trimmed) return;
  state.commandQueue.push(trimmed);
  renderCommandQueue();
}

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


// --- HELPERS ---

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}
