export function initAethis() {
  window.aethis = [];

  const list = document.getElementById("aethisList");

  document.getElementById("clearAethis").onclick = () => {
    window.aethis = [];
    render();
  };

  function render() {
    list.innerHTML = "";

    window.aethis.forEach((item, i) => {
      const div = document.createElement("div");
      div.draggable = true;
      div.textContent = `${item.name} (${item.delay})`;

      div.ondragstart = e => e.dataTransfer.setData("i", i);
      div.ondrop = e => {
        const from = e.dataTransfer.getData("i");
        [window.aethis[from], window.aethis[i]] =
        [window.aethis[i], window.aethis[from]];
        render();
      };
      div.ondragover = e => e.preventDefault();

      list.appendChild(div);
    });
  }

  window.addAethis = (item) => {
    window.aethis.push(item);
    render();
  };
}