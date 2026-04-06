// --- MY MORPHS TAB ---

import { state }             from './state.js';
import { copyToClipboard }   from './utils.js';
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


// --- DIALOG ---
// Custom replacements for alert() and confirm() that match the site theme.

function showAlert(message) {
  return new Promise(resolve => {
    const backdrop = _createDialogBackdrop(`
      <div class="mm-dialog-message">${escHtml(message)}</div>
      <div class="mm-dialog-footer">
        <button class="btn btn-primary btn-sm mm-dialog-ok">OK</button>
      </div>
    `);

    backdrop.querySelector('.mm-dialog-ok').onclick = () => {
      backdrop.remove();
      resolve();
    };
  });
}

// Returns true if confirmed, false if cancelled.
function showConfirm(message) {
  return new Promise(resolve => {
    const backdrop = _createDialogBackdrop(`
      <div class="mm-dialog-message">${escHtml(message)}</div>
      <div class="mm-dialog-footer">
        <button class="btn btn-danger btn-sm mm-dialog-cancel">CANCEL</button>
        <button class="btn btn-primary btn-sm mm-dialog-ok">CONFIRM</button>
      </div>
    `);

    backdrop.querySelector('.mm-dialog-ok').onclick = () => {
      backdrop.remove();
      resolve(true);
    };

    backdrop.querySelector('.mm-dialog-cancel').onclick = () => {
      backdrop.remove();
      resolve(false);
    };

    backdrop.onclick = e => {
      if (e.target === backdrop) {
        backdrop.remove();
        resolve(false);
      }
    };
  });
}

function _createDialogBackdrop(innerHtml) {
  const backdrop = document.createElement('div');
  backdrop.className = 'mm-modal-backdrop mm-dialog-backdrop';
  backdrop.innerHTML = `
    <div class="mm-modal mm-dialog">
      <div class="mm-modal-header">
        <span class="mm-modal-title">EVC HUB</span>
      </div>
      <div class="mm-modal-body mm-dialog-body">
        ${innerHtml}
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  // Remove 'hidden' class if present (the main modal uses it)
  backdrop.classList.remove('hidden');
  return backdrop;
}


// --- VARIABLES ---
// {!varname} = constant (set once, saved with the morph — e.g. your own codename)
// {varname}  = dynamic  (filled in each time you use the morph — e.g. a target player)

function extractVariables(commands) {
  const constant = new Set();
  const dynamic  = new Set();
  commands.forEach(cmd => {
    (cmd.match(/\{\!([a-zA-Z0-9_]+)\}/g) ?? []).forEach(v => constant.add(v.slice(2, -1)));
    (cmd.match(/\{([^!][a-zA-Z0-9_]*)\}/g) ?? []).forEach(v => dynamic.add(v.slice(1, -1)));
  });
  return { constant: [...constant], dynamic: [...dynamic] };
}

function applyVars(cmd, vars) {
  return cmd.replace(/\{!?([a-zA-Z0-9_]+)\}/g, (_, key) => vars[key]?.trim() || `{${key}}`);
}

function collectVarInputs(container, constantKeys, dynamicKeys) {
  const constantVars = {};
  const dynamicVars  = {};
  container.querySelectorAll('.mm-var-input').forEach(input => {
    const key = input.dataset.var;
    if (constantKeys.includes(key)) constantVars[key] = input.value;
    else dynamicVars[key] = input.value;
  });
  return { constantVars, dynamicVars };
}


// --- RENDER ---

export function renderMyMorphsTab() {
  const container = document.getElementById('tab-my-morphs');
  if (!container) return;

  const morphs  = loadMorphs();
  const presets = state.data.myMorphs?.presets ?? [];

  container.innerHTML = `
    <div class="my-morphs-toolbar">
      <button class="btn btn-primary btn-sm" id="mm-new-btn">+ NEW MORPH</button>
      <span class="my-morphs-hint">${morphs.length} saved morph${morphs.length !== 1 ? 's' : ''}</span>
    </div>

    ${presets.length ? `
      <div class="mm-presets-section">
        <div class="mm-presets-header">
          <span class="mm-presets-title">PRESETS</span>
          <span class="mm-presets-sub">Click USE to load a preset into a new morph</span>
        </div>
        <div class="mm-presets-grid">
          ${presets.map(p => `
            <div class="mm-preset-card">
              <div class="mm-preset-name">${escHtml(p.name)}</div>
              <div class="mm-preset-desc">${escHtml(p.description ?? '')}</div>
              <div class="mm-preset-cmds">
                ${p.commands.map(c => `<div class="mm-preset-cmd">${escHtml(c)}</div>`).join('')}
              </div>
              <button class="btn btn-sm mm-preset-use-btn" data-preset-id="${escHtml(p.id)}">USE PRESET</button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="my-morphs-list">
      ${morphs.length ? morphs.map(renderMorphCard).join('') : `
        <div class="mm-empty">
          <div class="mm-empty-icon">◈</div>
          <div class="mm-empty-title">NO MORPHS SAVED</div>
          <div class="mm-empty-sub">
            Click <strong>+ NEW MORPH</strong> or use a preset above.<br>
            Use <code>{varname}</code> for dynamic inputs (e.g. target player)
            and <code>{!varname}</code> for constants saved with the morph (e.g. your codename).
          </div>
        </div>
      `}
    </div>

    <div class="mm-modal-backdrop hidden" id="mm-modal-backdrop">
      <div class="mm-modal">
        <div class="mm-modal-header">
          <span class="mm-modal-title" id="mm-modal-title">NEW MORPH</span>
          <button class="mcp-close" id="mm-modal-close">×</button>
        </div>
        <div class="mm-modal-body">
          <div class="mm-field-label">NAME</div>
          <input class="mm-field-input" id="mm-name-input" placeholder="Morph name…">

          <div class="mm-field-label" style="margin-top:16px">
            COMMANDS
            <span class="mm-field-hint">one per line · use {variable} or {!constant}</span>
          </div>
          <textarea class="mm-field-textarea" id="mm-cmds-input"
                    placeholder="morph {person} remove&#10;hat {person} 12345&#10;permntag me {!codename}"></textarea>

          <div id="mm-var-preview-area"></div>
        </div>
        <div class="mm-modal-footer">
          <button class="btn btn-danger btn-sm" id="mm-cancel-btn">CANCEL</button>
          <button class="btn btn-primary btn-sm" id="mm-save-btn" style="margin-left:auto">SAVE</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mm-new-btn').onclick = () => openEditor(null);

  container.querySelectorAll('.mm-preset-use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = presets.find(p => p.id === btn.dataset.presetId);
      if (preset) openEditor(null, preset);
    });
  });

  wireCardEvents(container, morphs);
  wireModal();
}


// --- CARD RENDER ---

function renderMorphCard(morph) {
  const allVars    = { ...morph.constantVars, ...morph.dynamicVars };
  const hasDynamic = Object.keys(morph.dynamicVars ?? {}).length > 0;

  return `
    <div class="mm-card" data-id="${morph.id}">
      <div class="mm-card-header">
        <span class="mm-card-name">${escHtml(morph.name)}</span>
        <div class="mm-card-actions">
          <button class="btn btn-sm mm-edit-btn">EDIT</button>
          <button class="btn btn-sm btn-danger mm-delete-btn">DEL</button>
        </div>
      </div>

      ${hasDynamic ? `
        <div class="mm-vars">
          ${Object.keys(morph.dynamicVars).map(v => `
            <div class="mm-var-row">
              <span class="mm-var-label">{${v}}</span>
              <input class="mm-var-input" data-var="${escHtml(v)}"
                     value="${escHtml(morph.dynamicVars[v] ?? '')}"
                     placeholder="${escHtml(v)}">
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="mm-cmd-preview">
        ${morph.commands.map((cmd, i) => {
          const rendered = applyVars(cmd, allVars);
          return `
            <div class="mm-cmd-line">
              <span class="mm-cmd-index">${i + 1}</span>
              <span class="mm-cmd-text" title="${escHtml(rendered)}">${escHtml(rendered)}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="mm-card-footer">
        <span class="mm-cmd-count">${morph.commands.length} cmd${morph.commands.length !== 1 ? 's' : ''}</span>
        <button class="btn btn-sm mm-copy-btn">COPY</button>
        <button class="btn btn-add btn-sm mm-add-btn">+ ADD</button>
      </div>
    </div>
  `;
}


// --- CARD EVENTS ---

function wireCardEvents(container, morphs) {
  container.querySelectorAll('.mm-card').forEach(card => {
    const id    = card.dataset.id;
    const morph = morphs.find(m => m.id === id);
    if (!morph) return;

    card.querySelectorAll('.mm-var-input').forEach(input => {
      input.addEventListener('input', () => {
        morph.dynamicVars[input.dataset.var] = input.value;
        saveMorphs(morphs);
        refreshCardPreview(card, morph);
      });
    });

    card.querySelector('.mm-copy-btn').onclick = () => {
      const vars     = getLiveVars(card, morph);
      const resolved = morph.commands.map(c => applyVars(c, vars));
      copyToClipboard(`run ${resolved.join(' & ')}`);
    };

    card.querySelector('.mm-add-btn').onclick = () => {
      const vars = getLiveVars(card, morph);
      morph.commands.forEach(c => addToCommandQueue(applyVars(c, vars)));
    };

    card.querySelector('.mm-edit-btn').onclick  = () => openEditor(morph);
    card.querySelector('.mm-delete-btn').onclick = async () => {
      const confirmed = await showConfirm(`Delete "${morph.name}"?`);
      if (!confirmed) return;
      saveMorphs(morphs.filter(m => m.id !== id));
      renderMyMorphsTab();
    };
  });
}

function getLiveVars(card, morph) {
  const vars = { ...morph.constantVars };
  card.querySelectorAll('.mm-var-input').forEach(input => {
    vars[input.dataset.var] = input.value;
  });
  return vars;
}

function refreshCardPreview(card, morph) {
  const vars    = getLiveVars(card, morph);
  const preview = card.querySelector('.mm-cmd-preview');
  if (!preview) return;
  preview.innerHTML = morph.commands.map((cmd, i) => {
    const rendered = applyVars(cmd, vars);
    return `
      <div class="mm-cmd-line">
        <span class="mm-cmd-index">${i + 1}</span>
        <span class="mm-cmd-text" title="${escHtml(rendered)}">${escHtml(rendered)}</span>
      </div>
    `;
  }).join('');
}


// --- MODAL ---

let editingId    = null;
// Holds the active preset's variable metadata map while the editor is open.
// Shape: { [varName]: { description?: string, default?: string } }
let activeVarMeta = {};

function openEditor(morph, preset = null) {
  editingId    = morph?.id ?? null;
  activeVarMeta = preset?.variables ?? {};

  const backdrop = document.getElementById('mm-modal-backdrop');
  backdrop.classList.remove('hidden');

  document.getElementById('mm-modal-title').textContent = morph ? 'EDIT MORPH' : 'NEW MORPH';
  document.getElementById('mm-name-input').value = morph?.name ?? preset?.name ?? '';
  document.getElementById('mm-cmds-input').value = (morph?.commands ?? preset?.commands ?? []).join('\n');

  updateVarPreview(morph ?? { constantVars: {}, dynamicVars: {} });
}

function closeEditor() {
  document.getElementById('mm-modal-backdrop').classList.add('hidden');
  editingId     = null;
  activeVarMeta = {};
}

// Renders the variable input rows inside the modal.
// Merges existing saved values with preset defaults and descriptions from activeVarMeta.
function updateVarPreview(existingMorph = null) {
  const cmds = document.getElementById('mm-cmds-input').value
    .split('\n').filter(Boolean);
  const { constant, dynamic } = extractVariables(cmds);

  const existing = {
    ...(existingMorph?.constantVars ?? {}),
    ...(existingMorph?.dynamicVars  ?? {})
  };

  const area = document.getElementById('mm-var-preview-area');
  if (!area) return;

  if (!constant.length && !dynamic.length) { area.innerHTML = ''; return; }

  area.innerHTML = `
    ${constant.length ? `
      <div style="margin-top:14px">
        <div class="mm-field-label">
          CONSTANTS
          <span class="mm-field-hint">saved with the morph — set once</span>
        </div>
        <div class="mm-vars">
          ${constant.map(v => renderVarInput(v, existing[v], true)).join('')}
        </div>
      </div>
    ` : ''}
    ${dynamic.length ? `
      <div style="margin-top:10px">
        <div class="mm-field-label">
          DYNAMIC
          <span class="mm-field-hint">filled in each time you use the morph</span>
        </div>
        <div class="mm-vars">
          ${dynamic.map(v => renderVarInput(v, existing[v], false)).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

// Renders a single variable input row, pulling description/default from activeVarMeta.
// Layout: label → input → description
function renderVarInput(varName, savedValue, isConstant) {
  const meta        = activeVarMeta[varName] ?? {};
  const displayName = isConstant ? `{!${varName}}` : `{${varName}}`;

  // Saved value wins over preset default; preset default wins over empty string.
  const inputValue = savedValue ?? meta.default ?? '';

  return `
    <div class="mm-var-row">
      <span class="mm-var-label">${escHtml(displayName)}</span>
      <input class="mm-var-input mm-modal-var" data-var="${escHtml(varName)}"
             value="${escHtml(inputValue)}" placeholder="${escHtml(varName)}">
      ${meta.description ? `<span class="mm-var-meta-desc">${parseDescriptionHtml(meta.description)}</span>` : ''}
    </div>
  `;
}

function wireModal() {
  document.getElementById('mm-modal-close').onclick = closeEditor;
  document.getElementById('mm-cancel-btn').onclick  = closeEditor;

  document.getElementById('mm-modal-backdrop').onclick = e => {
    if (e.target.id === 'mm-modal-backdrop') closeEditor();
  };

  document.getElementById('mm-cmds-input').oninput = () => updateVarPreview();

  document.getElementById('mm-save-btn').onclick = async () => {
    const name     = document.getElementById('mm-name-input').value.trim();
    const commands = document.getElementById('mm-cmds-input').value
      .split('\n').map(l => l.trim()).filter(Boolean);

    if (!name)            { await showAlert('Please enter a name.'); return; }
    if (!commands.length) { await showAlert('Please enter at least one command.'); return; }

    const { constant, dynamic } = extractVariables(commands);
    const { constantVars, dynamicVars } = collectVarInputs(
      document.getElementById('mm-var-preview-area'),
      constant,
      dynamic
    );

    const morphs = loadMorphs();

    if (editingId) {
      const morph = morphs.find(x => x.id === editingId);
      if (morph) Object.assign(morph, { name, commands, constantVars, dynamicVars });
    } else {
      morphs.push({ id: generateId(), name, commands, constantVars, dynamicVars });
    }

    saveMorphs(morphs);
    closeEditor();
    renderMyMorphsTab();
  };
}


// --- HELPERS ---

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escapes a description string for safe HTML injection, then converts
// [text](url) markdown links into <a> tags. Only http/https URLs are allowed.
function parseDescriptionHtml(str) {
  return escHtml(String(str)).replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (_, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener" class="mm-var-desc-link">${text}</a>`
  );
}