export function initQueue() {
  window.queue = [];

  const list = document.getElementById("queueList");
  const input = document.getElementById("queueInput");

  document.getElementById("addQueue").onclick = () => {
    if (!input.value.trim()) return;

    window.queue.push(input.value.trim());
    input.value = "";
    render();
  };

  document.getElementById("clearQueue").onclick = () => {
    window.queue = [];
    render();
  };

  function render() {
    list.innerHTML = window.queue.map((cmd, i) => `
      <div>
        ${cmd}
        <button onclick="window.queue.splice(${i},1); location.reload()">x</button>
      </div>
    `).join("");
  }
}