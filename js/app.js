import { loadAudios } from './audios.js';
import { loadStatuses } from './statuses.js';
import { loadMorphs } from './morphs.js';
import { initQueue } from './queue.js';
import { initAethis } from './aethis.js';

const content = document.getElementById("content");

const tabs = {
  audios: loadAudios,
  statuses: loadStatuses,
  morphs: loadMorphs
};

// tab switching
document.querySelectorAll("#navbar button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#navbar button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    content.innerHTML = "";
    tabs[btn.dataset.tab](content);
  };
});

// init systems
initQueue();
initAethis();

// warn before leaving
window.onbeforeunload = () => {
  if (window.queue.length > 0) return "Queue not empty";
};