// --- CREDITS TAB ---
// Displays contributor cards. Data lives in data/credits.json.
// Profile pictures are loaded from images/credits/<filename>.

import { state } from "./state.js";

const IMAGE_BASE_PATH = "images/credits/";
const FALLBACK_ICON = "◈";

export function renderCreditsTab() {
  const containerEl = document.getElementById("tab-credits");
  if (!containerEl || !state.data.credits) return;

  const { contributors } = state.data.credits;

  if (contributors.length === 0) {
    containerEl.innerHTML = `
      <div class="credits-empty">
        <div class="credits-empty-icon">◈</div>
        <div class="credits-empty-text">No contributors listed yet.</div>
        <div class="credits-empty-sub">Add entries to <code>data/credits.json</code> and place profile images in <code>images/credits/</code>.</div>
      </div>
    `;
    return;
  }

  containerEl.innerHTML = `
    <div class="credits-header">
      <div class="credits-title-block">
        <span class="credits-title-symbol">◈</span>
        <span class="credits-title-text">CONTRIBUTORS</span>
      </div>
      <div class="credits-subtitle">The people behind the assets powering EVC Hub.</div>
    </div>
    <div class="credits-grid">
      ${contributors.map((c, i) => renderCard(c, i)).join("")}
    </div>
  `;
}

function renderCard(c, i) {
  const hasPfp = !!c.profilePicture;
  const imgSrc = hasPfp ? `${IMAGE_BASE_PATH}${c.profilePicture}` : "";
  const hasAliases = c.aliases && c.aliases.length > 0;
  const hasRoblox = !!c.robloxUsername;
  const hasRole = !!c.role;

  return `
    <div class="credits-card" style="--card-index: ${i}">
      <div class="credits-card-pfp-wrap">
        ${
          hasPfp
            ? `<img class="credits-pfp" src="${escapeAttr(imgSrc)}" alt="${escapeAttr(c.codename)}"
                  onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="credits-pfp-fallback" style="display:none">${FALLBACK_ICON}</div>`
            : `<div class="credits-pfp-fallback">${FALLBACK_ICON}</div>`
        }
        <div class="credits-pfp-ring"></div>
      </div>
      <div class="credits-card-body">
        <div class="credits-codename">${escapeHtml(c.codename)}</div>
        ${
          hasAliases
            ? `<div class="credits-aliases">${c.aliases.map((a) => `<span class="credits-alias">${escapeHtml(a)}</span>`).join("")}</div>`
            : ""
        }
        ${
          hasRole ? `<div class="credits-role">${escapeHtml(c.role)}</div>` : ""
        }
        <div class="credits-socials">
          <div class="credits-social-row">
            <span class="credits-social-icon credits-discord-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.081.114 18.105.132 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </span>
            <span class="credits-social-value">${escapeHtml(c.discordUsername)}</span>
          </div>
          ${
            hasRoblox
              ? `
          <div class="credits-social-row">
            <span class="credits-social-icon credits-roblox-icon">
                <svg width="14" height="14" viewBox="0 0 302.7 302.7" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M120.5,271.7c-110.9-28.6-120-31-119.9-31.5C0.7,239.6,62.1,0.5,62.2,0.4c0,0,54,13.8,119.9,30.8s120,30.8,120.1,30.8c0.2,0,0.2,0.4,0.1,0.9c-0.2,1.5-61.5,239.3-61.7,239.5C240.6,302.5,186.5,288.7,120.5,271.7z M174.9,158c3.2-12.6,5.9-23.1,6-23.4c0.1-0.5-2.3-1.2-23.2-6.6c-12.8-3.3-23.5-5.9-23.6-5.8c-0.3,0.3-12.1,46.6-12,46.7c0.2,0.2,46.7,12.2,46.8,12.1C168.9,180.9,171.6,170.6,174.9,158L174.9,158z"/>
                </svg>
            </span>
            <span class="credits-social-value">${escapeHtml(c.robloxUsername)}</span>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(str = "") {
  return String(str).replace(/"/g, "&quot;");
}
