let mode = null;

export async function loadStatuses(container) {
  const data = await fetch("data/statuses.json").then(r => r.json());

  container.innerHTML = `
    <div>
      <button data-mode="serious">SERIOUS</button>
      <button data-mode="semi">SEMI</button>
      <button data-mode="casual">CASUAL</button>
    </div>
  `;

  container.querySelectorAll("[data-mode]").forEach(btn => {
    btn.onclick = () => mode = btn.dataset.mode;
  });

  data.forEach(status => {
    const div = document.createElement("div");

    div.innerHTML = `
      <div>${status.preview}</div>
      <button>Add</button>
    `;

    div.querySelector("button").onclick = () => {
      if (!mode) {
        alert("Select a mode first");
        return;
      }

      const text = status.text[mode];

      window.queue.push(
        `sideinfo ${text} ${status.left} ${status.right} & subsideinfo ${text}`
      );
    };

    container.appendChild(div);
  });
}