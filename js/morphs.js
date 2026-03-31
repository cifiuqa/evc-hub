export async function loadMorphs(container) {
  const data = await fetch("data/morphs.json").then(r => r.json());

  const input = document.createElement("input");
  input.placeholder = "Person";

  container.appendChild(input);

  data.categories.forEach(cat => {
    const section = document.createElement("div");

    section.innerHTML = `<h3>${cat.name}</h3>`;

    cat.items.forEach(item => {
      const el = document.createElement("div");

      el.innerHTML = `
        <img src="images/morphs/${cat.name}/${item.file}.png">
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
        <button>Copy</button>
      `;

      el.querySelector("button").onclick = () => {
        const cmd = item.commands
          .map(c => c.replace("<person>", input.value))
          .join(" & ");

        navigator.clipboard.writeText(`run ${cmd}`);
      };

      section.appendChild(el);
    });

    container.appendChild(section);
  });
}