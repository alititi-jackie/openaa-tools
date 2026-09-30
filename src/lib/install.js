export function setupInstall(notify) {
  let pending = null;
  let busy = false;
  let installed = false;
  let help;
  const showHelp = () => {
    if (!help) {
      help = document.createElement("dialog");
      help.className = "install-help-dialog";
      help.setAttribute("aria-labelledby", "install-help-title");
      const title = document.createElement("h2");
      title.id = "install-help-title";
      title.textContent = "添加到桌面";
      const text = document.createElement("p");
      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      text.textContent = ios
        ? "请用 Safari 打开本页，点击分享按钮，再选择“添加到主屏幕”。"
        : "请打开浏览器菜单，选择“安装应用”“添加到主屏幕”或“创建快捷方式”。不同浏览器支持情况可能不同。";
      const offline = document.createElement("p");
      offline.textContent =
        "添加到桌面不代表全站可离线使用；在线查询等功能仍需网络。";
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "知道了";
      close.addEventListener("click", () => help.close());
      help.append(title, text, offline, close);
      help.addEventListener("click", (event) => {
        if (event.target === help) {
          const r = help.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            help.close();
        }
      });
      document.body.append(help);
    }
    if (!help.open) help.showModal();
  };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pending = event;
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    pending = null;
    help?.close();
    notify("已添加到桌面");
  });
  document.querySelectorAll("[data-install]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (busy) return;
      if (
        installed ||
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true
      ) {
        notify("当前应用已经安装到桌面");
        return;
      }
      if (!pending) {
        showHelp();
        return;
      }
      const event = pending;
      pending = null;
      busy = true;
      try {
        await event.prompt();
        const choice = await event.userChoice;
        notify(
          choice.outcome === "accepted"
            ? "已提交安装请求，请按浏览器提示完成"
            : "已取消安装，可稍后从浏览器菜单添加",
        );
      } catch {
        showHelp();
      } finally {
        busy = false;
      }
    });
  });
}
