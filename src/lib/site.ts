import { setupInstall } from "./install.js";
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
  const url = new URL(
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ||
      location.href,
  );
  if (location.pathname === "/") {
    const params = new URLSearchParams(location.search);
    for (const key of ["category", "q"]) {
      const value = params.get(key);
      if (value) url.searchParams.set(key, value);
    }
  }
  const data = {
    title: document.title,
    url: url.href,
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

setupInstall(notify);
document
  .querySelectorAll<HTMLButtonElement>("[data-import-file]")
  .forEach((button) => {
    button.addEventListener("click", () =>
      document.getElementById(button.dataset.importFile || "")?.click(),
    );
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
