// --- MY MORPHS TAB ---

import { copyToClipboard } from './utils.js';
import { addToCommandQueue } from './queue.js';

const STORAGE_KEY = 'evc_my_morphs';

// --- STORAGE ---

function loadMorphs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
}

function saveMorphs(morphs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(morphs));
}

function generateId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// --- VARIABLES ---

function extractVariables(commands) {
  const constant = new Set();
  const dynamic = new Set();

  commands.forEach(cmd => {
    (cmd.match(/\{\!([a-zA-Z0-9_]+)\}/g) || []).forEach(v => {
      constant.add(v.slice(2, -1));
    });

    (cmd.match(/\{([a-zA-Z0-9_]+)\}/g) || []).forEach(v => {
      if (!v.startsWith('{!')) dynamic.add(v.slice(1, -1));
    });
  });

  return { constant: [...constant], dynamic: [...dynamic] };
}

function applyVars(cmd, vars) {
  return cmd.replace(/\{!?([a-zA-Z0-9_]+)\}/g, (_, key) => {
    return vars[key]?.trim() || `{${key}}`;
  });
}

// --- RENDER ---

export function renderMyMorphsTab() {
  const container = document.getElementById('tab-my-morphs');
  if (!container) return;

  const morphs = loadMorphs();

  container.innerHTML = `
    <div class="my-morphs-toolbar">
      <button class="btn btn-primary btn-sm" id="mm-new-btn">+ NEW MORPH</button>
      <span>${morphs.length} morph${morphs.length !== 1 ? 's' : ''}</span>
    </div>

    <div class="my-morphs-list">
      ${morphs.length ? morphs.map(renderMorphCard).join('') : `<div>No morphs yet</div>`}
    </div>

    ${renderEditorModal()}
  `;

  document.getElementById('mm-new-btn').onclick = () => openEditor(null);

  wireCardEvents(container);
  wireModal();
}

// --- CARD ---

function renderCommandPreview(cmds) {
  return cmds.map((cmd, i) => `
    <div class="mm-cmd-line">
      <span class="mm-cmd-index">${i + 1}</span>
      <span class="mm-cmd-text">${cmd}</span>
    </div>
  `).join('');
}

function renderMorphCard(morph) {
  const vars = { ...(morph.constantVars || {}), ...(morph.dynamicVars || {}) };

  const preview = morph.commands.map(cmd => applyVars(cmd, vars));

  return `
    <div class="mm-card" data-id="${morph.id}">
      <div class="mm-card-header">
        <span>${escHtml(morph.name)}</span>
      </div>

      <div class="mm-cmd-preview">
        ${renderCommandPreview(preview)}
      </div>

      <div class="mm-card-actions">
        <button class="mm-copy-btn">COPY</button>
        <button class="mm-add-btn">ADD</button>
        <button class="mm-edit-btn">EDIT</button>
        <button class="mm-delete-btn">DELETE</button>
      </div>
    </div>
  `;
}

// --- EVENTS ---

function wireCardEvents(container) {
  const morphs = loadMorphs();

  container.querySelectorAll('.mm-card').forEach(card => {
    const id = card.dataset.id;
    const morph = morphs.find(m => m.id === id);

    card.querySelector('.mm-copy-btn').onclick = () => {
      const vars = { ...morph.constantVars, ...morph.dynamicVars };
      const resolved = morph.commands.map(c => applyVars(c, vars));
      copyToClipboard(`run ${resolved.join(' & ')}`);
    };

    card.querySelector('.mm-add-btn').onclick = () => {
      const vars = { ...morph.constantVars, ...morph.dynamicVars };
      morph.commands.forEach(c => addToCommandQueue(applyVars(c, vars)));
    };

    card.querySelector('.mm-edit-btn').onclick = () => openEditor(morph);

    card.querySelector('.mm-delete-btn').onclick = () => {
      if (!confirm(`Delete "${morph.name}"?`)) return;

      const newMorphs = morphs.filter(m => m.id !== id);
      saveMorphs(newMorphs);
      renderMyMorphsTab();
    };
  });
}

// --- MODAL ---

let editingId = null;

function renderEditorModal() {
  return `
    <div class="mm-modal-backdrop hidden" id="mm-modal-backdrop">
      <div class="mm-modal">
        <div class="mm-modal-header">
          <span>MORPH</span>
          <button id="mm-modal-close">×</button>
        </div>

        <input id="mm-name-input" placeholder="Name">

        <div id="mm-var-container"></div>

        <textarea id="mm-cmds-input" placeholder="Commands..."></textarea>

        <div class="mm-modal-footer">
          <button id="mm-cancel-btn">Cancel</button>
          <button id="mm-save-btn">Save</button>
        </div>
      </div>
    </div>
  `;
}

function openEditor(morph) {
  editingId = morph?.id ?? null;

  document.getElementById('mm-modal-backdrop').classList.remove('hidden');

  document.getElementById('mm-name-input').value = morph?.name ?? '';
  document.getElementById('mm-cmds-input').value = morph?.commands.join('\n') ?? '';

  updateVarUI(morph);
}

function closeEditor() {
  document.getElementById('mm-modal-backdrop').classList.add('hidden');
}

function updateVarUI(morph = null) {
  const cmds = document.getElementById('mm-cmds-input').value.split('\n');
  const vars = extractVariables(cmds);

  const values = {
    ...(morph?.constantVars || {}),
    ...(morph?.dynamicVars || {})
  };

  const container = document.getElementById('mm-var-container');

  container.innerHTML = `
    ${renderVarInputs('CONSTANT', vars.constant, values)}
    ${renderVarInputs('DYNAMIC', vars.dynamic, values)}
  `;
}

function renderVarInputs(label, vars, values) {
  if (!vars.length) return '';

  return `
    <div>
      <div>${label}</div>
      <div class="mm-vars">
        ${vars.map(v => `
          <input class="mm-var-input" data-var="${v}" value="${values[v] || ''}" placeholder="${v}">
        `).join('')}
      </div>
    </div>
  `;
}

// --- MODAL EVENTS ---

function wireModal() {
  const backdrop = document.getElementById('mm-modal-backdrop');

  document.getElementById('mm-modal-close').onclick = closeEditor;
  document.getElementById('mm-cancel-btn').onclick = closeEditor;

  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeEditor();
  };

  document.getElementById('mm-cmds-input').oninput = () => updateVarUI();

  document.getElementById('mm-save-btn').onclick = () => {
    const name = document.getElementById('mm-name-input').value.trim();
    const commands = document.getElementById('mm-cmds-input').value.split('\n').filter(Boolean);

    const vars = extractVariables(commands);

    const inputs = document.querySelectorAll('.mm-var-input');

    const constantVars = {};
    const dynamicVars = {};

    inputs.forEach(input => {
      const key = input.dataset.var;
      if (vars.constant.includes(key)) constantVars[key] = input.value;
      else dynamicVars[key] = input.value;
    });

    const morphs = loadMorphs();

    if (editingId) {
      const m = morphs.find(x => x.id === editingId);
      if (m) {
        m.name = name;
        m.commands = commands;
        m.constantVars = constantVars;
        m.dynamicVars = dynamicVars;
      }
    } else {
      morphs.push({
        id: generateId(),
        name,
        commands,
        constantVars,
        dynamicVars
      });
    }

    saveMorphs(morphs);
    closeEditor();
    renderMyMorphsTab();
  };
}

// --- HELPERS ---

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}