export async function loadAudios(container) {
  const sub = document.getElementById("subtabs");

  sub.innerHTML = `
    <button data-sub="aethis">AETHIS</button>
    <button data-sub="music">MUSIC</button>
    <button data-sub="effects">EFFECTS</button>
  `;

  sub.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => loadSub(btn.dataset.sub, container);
  });
}

async function loadSub(type, container) {
  const data = await fetch(`data/${type}.json`).then(r => r.json());
  container.innerHTML = "";

  data.categories.forEach(cat => {
    const section = document.createElement("div");

    section.innerHTML = `<h3>${cat.name}</h3>`;

    cat.items.forEach(item => {
      const el = document.createElement("div");

      // EFFECTS (special case)
      if (type === "effects") {
        el.innerHTML = `
          <span>${item.name}</span>
          <input type="number" value="${item.volume}">
          <input type="number" value="${item.range}">
          <input type="checkbox" ${item.loop ? "checked" : ""}>
          <button>Add</button>
       `;

        el.querySelector("button").onclick = () => {
          const v = el.children[1].value;
          const r = el.children[2].value;
          const l = el.children[3].checked;

          window.queue.push(
            `playsound me ${item.id} ${l} ${v} ${r}`
          );
        };
      }

      // NORMAL AUDIO
      else {
        el.innerHTML = `
          <span>${item.name}</span>
          <button>Add</button>
        `;

        el.querySelector("button").onclick = () => {
          if (type === "aethis") {
            window.addAethis(item);
          } else {
            window.queue.push(`play ${item.id}`);
          }
        };
      }

      section.appendChild(el);
    });

    container.appendChild(section);
  });
}