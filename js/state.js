// --- STATE ---

export const state = {
  // { cmd: string, delay: number|null }[] — delay is seconds before this cmd runs
  commandQueue: [],
  aethisQueue:  [],   // { name, audioId, delay }[]

  currentTab:    'audios',
  currentSubtab: 'aethis',
  statusMode:    null,

  data: {
    aethis:        null,
    music:         null,
    effects:       null,
    statuses:      null,
    morphs:        null,
    announcements: null,
    credits:       null,
    myMorphs:      null
  }
};