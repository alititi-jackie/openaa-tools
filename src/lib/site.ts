const status = document.getElementById("site-status");
let timer: ReturnType<typeof setTimeout>;
export function notify(message: string) {
  if (!status) return;
  status.textContent = message;
  status.classList.add("visible");
  clearTimeout(timer);
  timer = setTimeout(() => status.classList.remove("visible"), 3500);
}
async function share() {
  const data = {
    title: document.title,
    url:
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ||
      location.href,
  };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    notify("链接已复制，可以粘贴分享");
  } catch {
    window.prompt("请复制这个链接进行分享", data.url);
  }
}
document
  .querySelectorAll("[data-share]")
  .forEach((b) => b.addEventListener("click", share));
const modules = import.meta.glob("../features/*.js");
for (const name of (document.body.dataset.modules || "")
  .split(",")
  .filter(Boolean)) {
  const load = modules[`../features/${name}.js`];
  if (load) load().catch(() => notify("工具加载失败，请刷新页面重试"));
}

document
  .querySelectorAll("[data-print]")
  .forEach((b) => b.addEventListener("click", () => window.print()));
