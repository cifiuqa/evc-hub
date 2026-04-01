// --- UTILITIES ---

const TOAST_DURATION_MS = 1800;

let toastTimer = null;

// Copies text to clipboard and shows a toast confirmation.
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied!');
  } catch {
    showToast('Copy failed — check browser permissions', true);
  }
}

// Shows a brief floating notification.
export function showToast(message, isError = false) {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = message;
  el.classList.toggle('toast-error', isError);
  el.classList.add('visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), TOAST_DURATION_MS);
}

// Builds a TOC nav inside tocListEl. Clicking a link scrolls contentEl
// to the corresponding [data-category-id] section.
export function buildTOC(categories, tocListEl, contentEl) {
  tocListEl.innerHTML = '';

  categories.forEach(cat => {
    const link = document.createElement('a');
    link.className = 'toc-category';
    link.textContent = cat.name;
    link.href = '#';

    link.addEventListener('click', e => {
      e.preventDefault();
      const target = contentEl.querySelector(`[data-category-id="${cat.id}"]`);
      if (!target) return;

      // scrollIntoView accounts for sticky headers; offsetTop arithmetic does not
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Highlight active TOC entry briefly
      tocListEl.querySelectorAll('.toc-category').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    });

    tocListEl.appendChild(link);
  });
}

// Formats a gradient CSS value from an [r, g, b] array.
export function gradientStyle(leftRGB, rightRGB) {
  return `linear-gradient(to right, rgb(${leftRGB.join(',')}), rgb(${rightRGB.join(',')}))`;
}
