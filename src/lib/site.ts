const status = document.getElementById("site-status");
import { normalizeBackup, saveImportedRecords } from "./backup.js";
document
  .querySelectorAll<HTMLButtonElement>("[data-restore-import]")
  .forEach((button) => {
    const kind = button.dataset.restoreImport;
    const key =
      kind === "expense"
        ? "openaa_expense_records_v1"
        : "openaa_usd_rmb_records_v1";
    const update = () => {
      try {
        button.hidden = localStorage.getItem(key + "_before_import") === null;
      } catch {
        button.hidden = true;
      }
    };
    update();
    window.addEventListener("records-imported", update);
    button.addEventListener("click", () => {
      try {
        const raw = localStorage.getItem(key + "_before_import");
        if (raw === null) return;
        const data = JSON.parse(raw);
        const rows =
          Array.isArray(data) && data.length === 0
            ? []
            : normalizeBackup(data, kind);
        if (!confirm("恢复到上次导入前的记录？当前记录也会保留为恢复快照。"))
          return;
        saveImportedRecords(key, rows);
        location.reload();
      } catch {
        notify("恢复失败，未能恢复记录。请先导出当前数据并检查存储空间。");
      }
    });
  });
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

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
let installPrompt: InstallPromptEvent | null = null;
const installButtons = document.querySelectorAll<HTMLButtonElement>("[data-install]");
const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event as InstallPromptEvent;
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  notify("OpenAA 工具库已添加到桌面");
});
installButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (isInstalled()) {
      notify("OpenAA 工具库已经安装到桌面");
      return;
    }
    if (installPrompt) {
      await installPrompt.prompt();
      try {
        await installPrompt.userChoice;
      } catch {}
      installPrompt = null;
      return;
    }
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      notify("Safari：点击分享按钮，再选择“添加到主屏幕”");
      return;
    }
    if (/Android/i.test(ua)) {
      notify("Chrome：打开右上角菜单，选择“安装应用”或“添加到主屏幕”");
      return;
    }
    if (/Edg\//.test(ua)) {
      notify("Edge：右上角“…” → 应用 → 将此站点安装为应用");
      return;
    }
    if (/Chrome\//.test(ua)) {
      notify("Chrome：点击地址栏安装图标，或菜单中的“将网页安装为应用”");
      return;
    }
    notify("请使用浏览器菜单中的“安装应用”或“添加到主屏幕”");
  });
});

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
