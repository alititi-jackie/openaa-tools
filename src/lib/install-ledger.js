const standalone = window.matchMedia("(display-mode: standalone)");
let installPrompt;
let installed = false;
function hideInstallButton() {
  const button = document.querySelector("[data-action=install]");
  if (button) button.hidden = isInstalled();
}
export function isInstalled() {
  return installed || standalone.matches || navigator.standalone === true;
}
standalone.addEventListener("change", hideInstallButton);
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener("appinstalled", () => {
  installed = true;
  installPrompt = null;
  hideInstallButton();
});

export async function installLedger() {
  if (isInstalled()) return;
  const ua = navigator.userAgent;
  const wechat = /MicroMessenger/i.test(ua);
  if (installPrompt && !wechat) {
    const event = installPrompt;
    installPrompt = null;
    try {
      await event.prompt();
      await event.userChoice;
      return;
    } catch {
      // The browser may withdraw an install prompt. Show manual steps.
    }
  }
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const steps = wechat
    ? ["点微信右上角的「···」。", ios ? "选择在 Safari 中打开，再点 Safari 的分享按钮。" : "选择在浏览器中打开，再点「添加到手机主屏幕」。", ...(ios ? ["选择「添加到主屏幕」，再点「添加」。"] : [])]
    : ios
      ? ["在 Safari 中打开本页，点浏览器的分享按钮（方框向上箭头）。", "在分享菜单中选择「添加到主屏幕」。", "确认名称为「生活账本」，再点「添加」。"]
      : /Android/i.test(ua)
        ? ["点浏览器菜单「⋮」。", "选择「安装应用」或「添加到主屏幕」，按屏幕提示确认。"]
        : ["用手机浏览器打开本页，再点「添加到手机主屏幕」。"];
  const dialog = document.createElement("dialog");
  dialog.className = "transfer-confirm install-guide";
  dialog.setAttribute("aria-labelledby", "install-heading");
  dialog.innerHTML = '<h2 id="install-heading">添加到手机主屏幕</h2><ol></ol><form method="dialog" class="controls"><button class="primary">知道了</button></form>';
  for (const text of steps) {
    const item = document.createElement("li");
    item.textContent = text;
    dialog.querySelector("ol").append(item);
  }
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), {once:true});
  dialog.showModal();
}
