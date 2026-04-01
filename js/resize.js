// --- RESIZE ---
// Handles dragging the vertical resize handle (between content and panels)
// and the horizontal resize handle (between the two bottom panels).

const MIN_PANEL_HEIGHT     = 60;
const MAX_PANEL_HEIGHT_PCT = 0.72;
const MIN_PANEL_WIDTH      = 160;

export function initResizablePanels() {
  initVerticalResize();
  initHorizontalResize();
}


// --- VERTICAL RESIZE (content ↔ panels height) ---

function initVerticalResize() {
  const handle      = document.getElementById('vertical-resize-handle');
  const bottomPanel = document.getElementById('bottom-panels');
  if (!handle || !bottomPanel) return;

  let startY, startHeight;

  handle.addEventListener('pointerdown', e => {
    startY      = e.clientY;
    startHeight = bottomPanel.getBoundingClientRect().height;

    handle.setPointerCapture(e.pointerId);
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
  });

  handle.addEventListener('pointermove', e => {
    if (!handle.hasPointerCapture(e.pointerId)) return;

    const delta  = startY - e.clientY;   // drag up → bigger panels
    const maxH   = window.innerHeight * MAX_PANEL_HEIGHT_PCT;
    const newH   = Math.min(maxH, Math.max(MIN_PANEL_HEIGHT, startHeight + delta));

    document.documentElement.style.setProperty('--panel-h', `${newH}px`);
  });

  handle.addEventListener('pointerup', () => {
    handle.classList.remove('dragging');
    document.body.style.userSelect = '';
  });
}


// --- HORIZONTAL RESIZE (left panel ↔ right panel width) ---

function initHorizontalResize() {
  const handle      = document.getElementById('horizontal-resize-handle');
  const leftPanel   = document.getElementById('cmd-queue-panel');
  const rightPanel  = document.getElementById('aethis-queue-panel');
  const container   = document.getElementById('bottom-panels');

  if (!handle || !leftPanel || !rightPanel || !container) return;

  let startX, startLeftWidth;

  handle.addEventListener('pointerdown', e => {
    startX         = e.clientX;
    startLeftWidth = leftPanel.getBoundingClientRect().width;

    handle.setPointerCapture(e.pointerId);
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';

    // Switch from flex:1 to explicit widths so we can resize freely
    leftPanel.style.flex  = 'none';
    rightPanel.style.flex = 'none';
    rightPanel.style.width = (
      container.getBoundingClientRect().width
      - startLeftWidth
      - handle.getBoundingClientRect().width
    ) + 'px';
  });

  handle.addEventListener('pointermove', e => {
    if (!handle.hasPointerCapture(e.pointerId)) return;

    const containerW   = container.getBoundingClientRect().width;
    const handleW      = handle.getBoundingClientRect().width;
    const available    = containerW - handleW;
    const delta        = e.clientX - startX;
    const newLeftW     = Math.min(
      available - MIN_PANEL_WIDTH,
      Math.max(MIN_PANEL_WIDTH, startLeftWidth + delta)
    );
    const newRightW = available - newLeftW;

    leftPanel.style.width  = `${newLeftW}px`;
    rightPanel.style.width = `${newRightW}px`;
  });

  handle.addEventListener('pointerup', () => {
    handle.classList.remove('dragging');
    document.body.style.userSelect = '';
  });
}
