const modules = import.meta.glob("../lib/calculators/functions/*.js");
const id = document.body.dataset.toolId;
const load = modules["../lib/calculators/functions/" + id + ".js"];
if (load) {
  const { calculate } = await load();
  const button = document.getElementById("calculate");
  const run = async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await calculate();
    } catch {
      const result = document.getElementById("result");
      if (result) result.textContent = "无法计算，请检查输入后重试";
    } finally {
      button.disabled = false;
    }
  };
  button?.addEventListener("click", run);
  if (id === "mattress-size")
    document.getElementById("size")?.addEventListener("change", run);
  document.querySelector(".tool-form")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      e.preventDefault();
      run();
    }
  });
}
