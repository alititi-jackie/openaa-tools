const input = document.getElementById("tool-search");
const cards = [...document.querySelectorAll("#tool-groups .tool-card")];
const groups = [...document.querySelectorAll("[data-group]")];
const filters = [...document.querySelectorAll("[data-filter]")];
let category = "all";
function restore() {
  const p = new URLSearchParams(location.search);
  input.value = p.get("q") || "";
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
  groups.forEach((group) => {
    const visible = [...group.querySelectorAll(".tool-card")].filter(
      (card) => !card.hidden,
    ).length;
    group.hidden = visible === 0;
    group.querySelector("[data-group-count]").textContent = visible + " 个工具";
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
    history.replaceState(null, "", "/" + (p.size ? "?" + p : ""));
  }
}
filters.forEach((a) =>
  a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
window.addEventListener("pageshow", restore);
restore();
