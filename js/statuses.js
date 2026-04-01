// --- STATUSES TAB ---
// Renders the Statuses tab. User must select a mode before adding.
// Each card previews gradient text and generates sideinfo/subsideinfo commands.

import { state }             from './state.js';
import { copyToClipboard, showToast, gradientStyle } from './utils.js';
import { addToCommandQueue } from './queue.js';

// Resolves the display text for a status line, inserting the mode prefix.
function resolveText(template, mode, modeLabels) {
  const prefix = modeLabels[mode] ?? '';
  return template.replace('{mode}', prefix).trim();
}

// Builds the full two-command output string for a status card.
function buildStatusCommand(item, mode, modeLabels) {
  const sideText = resolveText(item.sideinfo.text, mode, modeLabels);
  const subText  = resolveText(item.subsideinfo.text, mode, modeLabels);

  const [slR, slG, slB] = item.sideinfo.gradientLeft;
  const [srR, srG, srB] = item.sideinfo.gradientRight;
  const [ulR, ulG, ulB] = item.subsideinfo.gradientLeft;
  const [urR, urG, urB] = item.subsideinfo.gradientRight;

  const sideCmd = `sideinfo ${sideText} ${slR} ${slG} ${slB} ${srR} ${srG} ${srB}`;
  const subCmd  = `subsideinfo ${subText} ${ulR} ${ulG} ${ulB} ${urR} ${urG} ${urB}`;

  return `${sideCmd} & ${subCmd}`;
}

// Updates preview text in existing cards to reflect the current mode.
function refreshCardPreviews() {
  if (!state.data.statuses) return;

  const { items, modeLabels } = state.data.statuses;
  const mode = state.statusMode;

  document.querySelectorAll('.status-card').forEach((card, i) => {
    const item = items[i];
    if (!item) return;

    const sideLine = card.querySelector('.status-preview-line:not(.sub)');
    const subLine  = card.querySelector('.status-preview-line.sub');

    if (sideLine) {
      sideLine.textContent = mode
        ? resolveText(item.sideinfo.text, mode, modeLabels)
        : item.sideinfo.text.replace('{mode}', '…').trim();
    }

    if (subLine) {
      subLine.textContent = resolveText(
        item.subsideinfo.text,
        mode ?? 'CASUAL',
        modeLabels
      );
    }
  });
}

export function renderStatusesTab() {
  const containerEl = document.getElementById('tab-statuses');
  if (!containerEl || !state.data.statuses) return;

  const { items, modeLabels } = state.data.statuses;

  containerEl.innerHTML = `
    <div class="status-mode-bar">
      <span class="status-mode-label">MODE:</span>
      <button class="mode-btn" data-mode="SERIOUS">SERIOUS</button>
      <button class="mode-btn" data-mode="SEMI-SERIOUS">SEMI-SERIOUS</button>
      <button class="mode-btn" data-mode="CASUAL">CASUAL</button>
      <span class="mode-warning" id="mode-warning">&#9888; SELECT A MODE TO ENABLE ADDING</span>
    </div>
    <div class="status-grid">
      ${items.map((item, i) => {
        const sideGrad = gradientStyle(item.sideinfo.gradientLeft, item.sideinfo.gradientRight);
        const subGrad  = gradientStyle(item.subsideinfo.gradientLeft, item.subsideinfo.gradientRight);
        const sideText = escapeHtml(item.sideinfo.text.replace('{mode}', '…').trim());
        const subText  = escapeHtml(item.subsideinfo.text);

        return `
          <div class="status-card" data-index="${i}">
            <div class="status-preview">
              <span class="status-preview-line"
                    style="background: ${sideGrad}; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${sideText}
              </span>
              <span class="status-preview-line sub"
                    style="background: ${subGrad}; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${subText}
              </span>
            </div>
            <div class="status-card-footer">
              <button class="btn btn-sm" data-copy-index="${i}" title="Copy command">COPY</button>
              <button class="btn btn-add btn-sm" data-add-index="${i}" title="Add to command queue">+ ADD</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Mode selection
  containerEl.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      containerEl.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.statusMode = btn.dataset.mode;
      document.getElementById('mode-warning').classList.remove('visible');
      refreshCardPreviews();
    });
  });

  // Re-apply mode if already selected
  if (state.statusMode) {
    const activeBtn = containerEl.querySelector(`.mode-btn[data-mode="${state.statusMode}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    refreshCardPreviews();
  }

  // COPY buttons
  containerEl.querySelectorAll('[data-copy-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.statusMode) { showModeWarning(); return; }
      const item    = items[parseInt(btn.dataset.copyIndex, 10)];
      const command = buildStatusCommand(item, state.statusMode, modeLabels);
      copyToClipboard(`run ${command}`);
    });
  });

  // ADD buttons
  containerEl.querySelectorAll('[data-add-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.statusMode) { showModeWarning(); return; }
      const item    = items[parseInt(btn.dataset.addIndex, 10)];
      const command = buildStatusCommand(item, state.statusMode, modeLabels);
      addToCommandQueue(command);
    });
  });
}

function showModeWarning() {
  const warningEl = document.getElementById('mode-warning');
  if (warningEl) warningEl.classList.add('visible');
  showToast('Select a mode first', true);
}


// --- HELPERS ---

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
