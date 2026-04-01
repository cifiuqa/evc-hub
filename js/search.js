// --- SEARCH ---
// Filters visible items in the active tab/subtab by matching against
// item names (and descriptions for statuses/morphs/announcements).
// Operates purely on CSS classes — no re-rendering.

const DEBOUNCE_MS = 120;

let debounceTimer = null;

export function initSearch() {
  const input    = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.trim();

    clearBtn.classList.toggle('hidden', query === '');

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applySearch(query), DEBOUNCE_MS);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    applySearch('');
    input.focus();
  });
}

// Clears search state when switching tabs/subtabs so stale filters don't persist.
export function clearSearch() {
  const input    = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  applySearch('');
}

function applySearch(query) {
  const needle = query.toLowerCase();

  // Find all searchable item rows currently in the DOM
  filterItems('.audio-item',        getAudioItemText,        needle);
  filterItems('.effects-item',      getAudioItemText,        needle);
  filterItems('.announcement-item', getAnnouncementItemText, needle);
  filterItems('.status-card',       getStatusCardText,       needle);
  filterItems('.morph-card',        getMorphCardText,        needle);

  // After filtering, hide/show category sections that are now entirely empty
  document.querySelectorAll('.category-section, .morphs-category-section').forEach(section => {
    const visibleItems = section.querySelectorAll(
      '.audio-item:not(.search-hidden), .effects-item:not(.search-hidden), .announcement-item:not(.search-hidden)'
    );
    section.classList.toggle('search-hidden', visibleItems.length === 0);
  });

  // Status grid — hide empty grid (no sections, just cards)
  const statusGrid = document.querySelector('.status-grid');
  if (statusGrid) {
    const visibleCards = statusGrid.querySelectorAll('.status-card:not(.search-hidden)');
    showNoResults(statusGrid, visibleCards.length === 0, needle);
  }

  // Morphs — hide empty grids
  document.querySelectorAll('.morphs-grid').forEach(grid => {
    const visibleCards = grid.querySelectorAll('.morph-card:not(.search-hidden)');
    const section = grid.closest('.morphs-category-section');
    if (section) section.classList.toggle('search-hidden', visibleCards.length === 0);
  });
}

function filterItems(selector, textFn, needle) {
  document.querySelectorAll(selector).forEach(el => {
    if (!needle) {
      el.classList.remove('search-hidden');
      return;
    }
    const text = textFn(el).toLowerCase();
    el.classList.toggle('search-hidden', !text.includes(needle));
  });
}

function showNoResults(container, isEmpty, needle) {
  let msgEl = container.parentElement?.querySelector('.search-no-results');

  if (isEmpty && needle) {
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.className = 'search-no-results';
      container.insertAdjacentElement('afterend', msgEl);
    }
    msgEl.textContent = `No results for "${needle}"`;
    msgEl.style.display = '';
  } else if (msgEl) {
    msgEl.style.display = 'none';
  }
}


// --- TEXT EXTRACTORS ---

function getAudioItemText(el) {
  return (
    (el.querySelector('.audio-name')?.textContent ?? '') + ' ' +
    (el.querySelector('.audio-id-hint')?.textContent ?? '') + ' ' +
    (el.querySelector('.announcement-name')?.textContent ?? '') + ' ' +
    (el.querySelector('.announcement-desc')?.textContent ?? '')
  );
}

function getAnnouncementItemText(el) {
  return (
    (el.querySelector('.announcement-name')?.textContent ?? '') + ' ' +
    (el.querySelector('.announcement-desc')?.textContent ?? '') + ' ' +
    (el.querySelector('.announcement-cmd')?.textContent ?? '')
  );
}

function getStatusCardText(el) {
  return (
    (el.querySelector('.status-preview-line:not(.sub)')?.textContent ?? '') + ' ' +
    (el.querySelector('.status-description')?.textContent ?? '')
  );
}

function getMorphCardText(el) {
  return (
    (el.querySelector('.morph-name')?.textContent ?? '') + ' ' +
    (el.querySelector('.morph-description')?.textContent ?? '')
  );
}
