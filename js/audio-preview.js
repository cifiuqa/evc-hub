// --- AUDIO PREVIEW ---
// Manages browser Audio instances for previewing .ogg files from the audios/ folder.
// Each audio ID gets at most one Audio object. Clicking preview toggles play/stop.

const AUDIO_BASE_PATH = 'audios/';

// Map of audioId → { audio: Audio, playing: boolean }
const audioCache = new Map();

// Checks whether an audio file is likely present by attempting a HEAD request.
// Returns a promise resolving to true/false.
export async function checkAudioExists(audioId) {
  try {
    const res = await fetch(`${AUDIO_BASE_PATH}${audioId}.ogg`, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// Probes all audio IDs in a list and returns a Set of those that exist.
export async function probeAudioIds(audioIds) {
  const results = await Promise.all(
    audioIds.map(async id => ({ id, exists: await checkAudioExists(id) }))
  );
  const found = new Set();
  results.forEach(r => { if (r.exists) found.add(r.id); });
  return found;
}

// Toggles playback for a given audioId. Returns 'playing' | 'stopped'.
export function togglePreview(audioId) {
  if (!audioCache.has(audioId)) {
    const audio = new Audio(`${AUDIO_BASE_PATH}${audioId}.ogg`);
    audio.addEventListener('ended', () => {
      const entry = audioCache.get(audioId);
      if (entry) entry.playing = false;
      notifyButtonStopped(audioId);
    });
    audioCache.set(audioId, { audio, playing: false });
  }

  const entry = audioCache.get(audioId);

  if (entry.playing) {
    entry.audio.pause();
    entry.audio.currentTime = 0;
    entry.playing = false;
    return 'stopped';
  } else {
    // Stop all other previews first
    stopAll(audioId);
    entry.audio.play().catch(() => {});
    entry.playing = true;
    return 'playing';
  }
}

// Stops all currently playing previews (optionally except one).
export function stopAll(exceptId = null) {
  audioCache.forEach((entry, id) => {
    if (id !== exceptId && entry.playing) {
      entry.audio.pause();
      entry.audio.currentTime = 0;
      entry.playing = false;
      notifyButtonStopped(id);
    }
  });
}

// Returns whether a given audioId is currently playing.
export function isPlaying(audioId) {
  return audioCache.get(audioId)?.playing ?? false;
}

// Updates the visual state of all preview buttons for a given audioId.
function notifyButtonStopped(audioId) {
  document.querySelectorAll(`.btn-preview[data-audioid="${audioId}"]`).forEach(btn => {
    btn.classList.remove('playing');
    btn.textContent = '▶ PREVIEW';
  });
}
