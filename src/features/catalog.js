const input = document.getElementById("tool-search");
const cards = [...document.querySelectorAll("#tool-grid .tool-card")];
const filters = [...document.querySelectorAll("[data-filter]")];
let category = "all";
function restore() {
  const p = new URLSearchParams(location.search);
  input.value = p.get("q") || p.get("search") || "";
  const value = p.get("category") || "all";
  category = filters.some((a) => a.dataset.filter === value) ? value : "all";
  render(false);
}
function render(update = true) {
  const q = input.value.trim().toLowerCase();
  let count = 0;
  cards.forEach((card) => {
    card.hidden = !(
      (category === "all" || category === card.dataset.category) &&
      (!q || card.dataset.search.includes(q))
    );
    if (!card.hidden) count++;
  });
  document.getElementById("tool-count").textContent =
    `显示 ${count} / ${cards.length} 个工具`;
  document.getElementById("empty-state").hidden = count !== 0;
  filters.forEach((a) =>
    a.setAttribute("aria-current", String(a.dataset.filter === category)),
  );
  if (update) {
    const p = new URLSearchParams();
    if (q) p.set("q", input.value.trim());
    if (category !== "all") p.set("category", category);
    history.replaceState(null, "", "/tools/" + (p.size ? "?" + p : ""));
  }
}
filters.forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    category = a.dataset.filter;
    render();
  }),
);
input.addEventListener("input", () => render());
document.getElementById("clear-search").addEventListener("click", () => {
  input.value = "";
  category = "all";
  render();
  input.focus();
});
window.addEventListener("popstate", restore);
restore();
