// --- MY MORPHS TAB ---
// Personal morph templates stored in localStorage.
// Each morph: { id, name, commands: string[], variables: { key: savedValue } }
// {varname} placeholders in commands are extracted, displayed as inputs, and
// their last-used values are saved back to localStorage automatically.
//
// A static PRESETS section sits above user morphs — clicking USE pre-fills
// the editor so the user can customise and save it as their own.

import { copyToClipboard } from './utils.js';
import { addToCommandQueue } from './queue.js';

const STORAGE_KEY = 'evc_my_morphs';

// Preset templates — shown read-only above the user's saved morphs.
// These are never stored in localStorage; they live here as code.
const PRESETS = [
  {
    id: 'preset_duty',
    name: 'Standard Duty Loadout',
    description: 'Sets your nametag, rank tag, and tag colours for going on duty.',
    commands: [
      'permntag me {codename}',
      'prtag me {ranktag}',
      'cntag me {nameR} {nameG} {nameB}',
      'crtag me {tagR} {tagG} {tagB}'
    ]
  },
  {
    id: 'preset_morph',
    name: 'Basic Morph + Scale',
    description: 'Applies a morph, sets scale, and heals.',
    commands: [
      'morph me {morphName}',
      'scale me {scale}',
      'heal me'
    ]
  },
  {
    id: 'preset_shirt',
    name: 'Shirt + Pants',
    description: 'Applies a shirt and pants asset to yourself.',
    commands: [
      'shirt me {shirtId} {pantsId}'
    ]
  },
  {
    id: 'preset_hat',
    name: 'Hat Stack',
    description: 'Equips one or more hat asset IDs.',
    commands: [
      'hat me {hatIds}'
    ]
  },
  {
    id: 'preset_maxhealth',
    name: 'Health + Heal',
    description: 'Sets max health and fully heals.',
    commands: [
      'maxhealth me {maxHp}',
      'heal me'
    ]
  },
  {
    id: 'preset_full',
    name: 'Full Duty Setup',
    description: 'Morph, shirt, hat, scale, nametag, rank tag, colours, and heal — all in one.',
    commands: [
      'morph me {morphName}',
      'shirt me {shirtId} {pantsId}',
      'hat me {hatIds}',
      'scale me {scale}',
      'permntag me {codename}',
      'prtag me {ranktag}',
      'cntag me {nameR} {nameG} {nameB}',
      'crtag me {tagR} {tagG} {tagB}',
      'heal me'
    ]
  }
];


// --- STORAGE ---

function loadMorphs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveMorphs(morphs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(morphs));
}

function generateId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Extracts unique {varname} placeholders from a list of command strings.
function extractVarNames(commands) {
  const found = new Set();
  for (const cmd of commands) {
    for (const match of cmd.matchAll(/\{(\w+)\}/g)) {
      found.add(match[1]);
    }
  }
  return [...found];
}

function resolveCommands(commands, varValues) {
  return commands.map(cmd =>
    cmd.replace(/\{(\w+)\}/g, (_, key) => varValues[key]?.trim() || `{${key}}`)
  );
}


// --- RENDER ---

export function renderMyMorphsTab() {
  const containerEl = document.getElementById('tab-my-morphs');
  if (!containerEl) return;

  const morphs = loadMorphs();

  containerEl.innerHTML = `
    ${renderPresetsSection()}
    <div class="my-morphs-toolbar">
      <button class="btn btn-primary btn-sm" id="mm-new-btn">+ NEW MORPH</button>
      <span class="my-morphs-hint">${morphs.length} saved morph${morphs.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="my-morphs-list" id="mm-list">
      ${morphs.length === 0 ? renderEmptyState() : morphs.map(renderMorphCard).join('')}
    </div>
    ${renderEditorModal()}
  `;

  document.getElementById('mm-new-btn').addEventListener('click', () => openEditor(null));
  wireCardEvents(containerEl);
  wirePresetEvents(containerEl);
  wireModal(containerEl);
}

function renderPresetsSection() {
  return `
    <div class="mm-presets-section">
      <div class="mm-presets-header">
        <span class="mm-presets-title">◈ PRESET TEMPLATES</span>
        <span class="mm-presets-sub">Click USE to open a preset in the editor — customise and save it as your own.</span>
      </div>
      <div class="mm-presets-grid">
        ${PRESETS.map(p => `
          <div class="mm-preset-card">
            <div class="mm-preset-name">${escHtml(p.name)}</div>
            <div class="mm-preset-desc">${escHtml(p.description)}</div>
            <div class="mm-preset-cmds">
              ${p.commands.map(c => `<div class="mm-preset-cmd">${escHtml(c)}</div>`).join('')}
            </div>
            <button class="btn btn-sm mm-preset-use-btn" data-preset-id="${escAttr(p.id)}">USE →</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="mm-empty">
      <div class="mm-empty-icon">◈</div>
      <div class="mm-empty-title">No personal morphs yet</div>
      <div class="mm-empty-sub">Click <strong>+ NEW MORPH</strong> to create one, or use a preset above.<br>Use <code>{varname}</code> in commands as placeholders.</div>
    </div>
  `;
}

function renderMorphCard(morph) {
  const varNames  = extractVarNames(morph.commands);
  const varInputs = varNames.map(key => `
    <div class="mm-var-row">
      <label class="mm-var-label">{${escHtml(key)}}</label>
      <input class="mm-var-input"
             type="text"
             data-morph-id="${escAttr(morph.id)}"
             data-var-key="${escAttr(key)}"
             value="${escAttr(morph.variables?.[key] ?? '')}"
             placeholder="value…">
    </div>
  `).join('');

  return `
    <div class="mm-card" data-morph-id="${escAttr(morph.id)}">
      <div class="mm-card-header">
        <span class="mm-card-name">${escHtml(morph.name)}</span>
        <div class="mm-card-actions">
          <button class="btn btn-sm mm-edit-btn" data-morph-id="${escAttr(morph.id)}">EDIT</button>
          <button class="btn btn-sm btn-danger mm-delete-btn" data-morph-id="${escAttr(morph.id)}">✕</button>
        </div>
      </div>
      ${varNames.length > 0 ? `<div class="mm-vars">${varInputs}</div>` : ''}
      <div class="mm-cmd-preview">
        ${morph.commands.map((cmd, i) => `
          <div class="mm-cmd-line">
            <span class="mm-cmd-index">${i + 1}</span>
            <span class="mm-cmd-text">${escHtml(cmd)}</span>
          </div>
        `).join('')}
      </div>
      <div class="mm-card-footer">
        <span class="mm-cmd-count">${morph.commands.length} cmd${morph.commands.length !== 1 ? 's' : ''}</span>
        <button class="btn btn-sm mm-copy-btn" data-morph-id="${escAttr(morph.id)}">COPY ALL</button>
        <button class="btn btn-add btn-sm mm-add-btn" data-morph-id="${escAttr(morph.id)}">+ ADD ALL</button>
      </div>
    </div>
  `;
}

function renderEditorModal() {
  return `
    <div class="mm-modal-backdrop hidden" id="mm-modal-backdrop">
      <div class="mm-modal" id="mm-modal">
        <div class="mm-modal-header">
          <span class="mm-modal-title" id="mm-modal-title">NEW MORPH</span>
          <button class="mcp-close" id="mm-modal-close">×</button>
        </div>
        <div class="mm-modal-body">
          <label class="mm-field-label">MORPH NAME</label>
          <input class="mm-field-input" id="mm-name-input" type="text" placeholder="e.g. Duty Loadout">

          <label class="mm-field-label" style="margin-top:14px">
            COMMANDS
            <span class="mm-field-hint">one per line · use {varname} as placeholders</span>
          </label>
          <textarea class="mm-field-textarea" id="mm-cmds-input"
                    placeholder="morph me TV&#10;permntag me {codename}&#10;heal me"></textarea>

          <div class="mm-var-preview" id="mm-var-preview"></div>
        </div>
        <div class="mm-modal-footer">
          <button class="btn btn-sm btn-danger hidden" id="mm-delete-modal-btn">DELETE</button>
          <div style="flex:1"></div>
          <button class="btn btn-sm" id="mm-cancel-btn">CANCEL</button>
          <button class="btn btn-primary btn-sm" id="mm-save-btn">SAVE</button>
        </div>
      </div>
    </div>
  `;
}


// --- EVENTS ---

function wirePresetEvents(containerEl) {
  containerEl.querySelectorAll('.mm-preset-use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS.find(p => p.id === btn.dataset.presetId);
      if (preset) openEditor(null, preset);
    });
  });
}

function wireCardEvents(containerEl) {
  // Persist var value on every keystroke
  containerEl.querySelectorAll('.mm-var-input').forEach(input => {
    input.addEventListener('input', () => {
      const { morphId, varKey } = input.dataset;
      const morphs = loadMorphs();
      const morph  = morphs.find(m => m.id === morphId);
      if (!morph) return;
      if (!morph.variables) morph.variables = {};
      morph.variables[varKey] = input.value;
      saveMorphs(morphs);
    });
  });

  containerEl.querySelectorAll('.mm-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const morph = loadMorphs().find(m => m.id === btn.dataset.morphId);
      if (!morph) return;
      const resolved = resolveCommands(morph.commands, gatherVarValues(containerEl, morph.id));
      copyToClipboard(`run ${resolved.join(' & ')}`);
    });
  });

  containerEl.querySelectorAll('.mm-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const morph = loadMorphs().find(m => m.id === btn.dataset.morphId);
      if (!morph) return;
      resolveCommands(morph.commands, gatherVarValues(containerEl, morph.id))
        .forEach(cmd => addToCommandQueue(cmd));
    });
  });

  containerEl.querySelectorAll('.mm-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const morph = loadMorphs().find(m => m.id === btn.dataset.morphId);
      if (morph) openEditor(morph);
    });
  });

  containerEl.querySelectorAll('.mm-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = loadMorphs().find(m => m.id === btn.dataset.morphId)?.name;
      if (!confirm(`Delete "${name}"?`)) return;
      deleteMorph(btn.dataset.morphId);
    });
  });
}

// Reads current DOM input values for a morph (may be ahead of localStorage).
function gatherVarValues(containerEl, morphId) {
  const values = {};
  containerEl.querySelectorAll(`.mm-var-input[data-morph-id="${morphId}"]`).forEach(input => {
    values[input.dataset.varKey] = input.value;
  });
  return values;
}

function deleteMorph(id) {
  saveMorphs(loadMorphs().filter(m => m.id !== id));
  renderMyMorphsTab();
}


// --- EDITOR MODAL ---

let editingMorphId = null;

// preset is optional — if passed, pre-fills editor as a new morph from that preset.
function openEditor(morph, preset = null) {
  editingMorphId = morph?.id ?? null;

  const backdrop = document.getElementById('mm-modal-backdrop');
  const title    = document.getElementById('mm-modal-title');
  const nameEl   = document.getElementById('mm-name-input');
  const cmdsEl   = document.getElementById('mm-cmds-input');
  const deleteBtn= document.getElementById('mm-delete-modal-btn');

  if (preset) {
    title.textContent = 'NEW MORPH (from preset)';
    nameEl.value      = preset.name;
    cmdsEl.value      = preset.commands.join('\n');
  } else {
    title.textContent = morph ? 'EDIT MORPH' : 'NEW MORPH';
    nameEl.value      = morph?.name ?? '';
    cmdsEl.value      = morph?.commands.join('\n') ?? '';
  }

  deleteBtn.classList.toggle('hidden', !morph);
  updateVarPreview();
  backdrop.classList.remove('hidden');
  nameEl.focus();
}

function closeEditor() {
  document.getElementById('mm-modal-backdrop').classList.add('hidden');
  editingMorphId = null;
}

function updateVarPreview() {
  const cmdsEl    = document.getElementById('mm-cmds-input');
  const previewEl = document.getElementById('mm-var-preview');
  if (!cmdsEl || !previewEl) return;

  const commands = cmdsEl.value.split('\n').map(l => l.trim()).filter(Boolean);
  const varNames = extractVarNames(commands);

  previewEl.innerHTML = varNames.length === 0 ? '' : `
    <div class="mm-var-preview-label">DETECTED VARIABLES</div>
    <div class="mm-var-chips">
      ${varNames.map(v => `<span class="mm-var-chip">{${escHtml(v)}}</span>`).join('')}
    </div>
  `;
}

function wireModal(containerEl) {
  const backdrop = document.getElementById('mm-modal-backdrop');
  const cmdsEl   = document.getElementById('mm-cmds-input');

  cmdsEl.addEventListener('input', updateVarPreview);
  document.getElementById('mm-modal-close').addEventListener('click', closeEditor);
  document.getElementById('mm-cancel-btn').addEventListener('click', closeEditor);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeEditor(); });

  document.getElementById('mm-save-btn').addEventListener('click', () => {
    const name     = document.getElementById('mm-name-input').value.trim();
    const commands = cmdsEl.value.split('\n').map(l => l.trim()).filter(Boolean);
    if (!name) { document.getElementById('mm-name-input').focus(); return; }

    const morphs   = loadMorphs();
    const varNames = extractVarNames(commands);

    if (editingMorphId) {
      const existing = morphs.find(m => m.id === editingMorphId);
      if (existing) {
        existing.name     = name;
        existing.commands = commands;
        // Keep saved values for vars that still exist; drop removed ones
        const kept = {};
        varNames.forEach(k => { kept[k] = existing.variables?.[k] ?? ''; });
        existing.variables = kept;
      }
    } else {
      const variables = {};
      varNames.forEach(k => { variables[k] = ''; });
      morphs.push({ id: generateId(), name, commands, variables });
    }

    saveMorphs(morphs);
    closeEditor();
    renderMyMorphsTab();
  });

  document.getElementById('mm-delete-modal-btn').addEventListener('click', () => {
    if (!editingMorphId) return;
    const name = loadMorphs().find(m => m.id === editingMorphId)?.name;
    if (!confirm(`Delete "${name}"?`)) return;
    deleteMorph(editingMorphId);
    closeEditor();
  });
}


// --- HELPERS ---

function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(str) { return String(str).replace(/"/g, '&quot;'); }