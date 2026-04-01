// --- STATE ---
// Single source of truth for all mutable runtime data.

export const state = {
  commandQueue: [],   // string[] — raw command strings for the global queue
  aethisQueue:  [],   // { name, audioId, delay }[] — AETHIS-specific queue

  currentTab:    'audios',
  currentSubtab: 'aethis',
  statusMode:    null,  // 'SERIOUS' | 'SEMI-SERIOUS' | 'CASUAL' | null

  data: {
    aethis:   null,
    music:    null,
    effects:  null,
    statuses: null,
    morphs:   null
  }
};
