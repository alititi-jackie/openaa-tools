let feedbackTimer;

// The site already provides a fixed, accessible status element. Both record
// tools use it instead of adding an unstyled .toast element to the page.
export function showFeedback(message) {
  const status = document.getElementById("site-status");
  if (!status) return;
  status.textContent = message;
  status.classList.add("visible");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => status.classList.remove("visible"), 3500);
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Some in-app browsers deny clipboard access; try a selected text field.
  }

  const area = document.createElement("textarea");
  const previousFocus = document.activeElement;
  area.value = text;
  area.readOnly = true;
  area.setAttribute("aria-hidden", "true");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "1px";
  area.style.height = "1px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  let copied = false;
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    copied = document.execCommand("copy") === true;
  } catch {
    copied = false;
  } finally {
    area.remove();
    if (previousFocus?.isConnected && previousFocus.focus)
      previousFocus.focus();
  }
  return copied;
}

export function showCopyResult(copied, text, label) {
  if (copied) {
    showFeedback("已复制，可到微信粘贴发送");
    alert(`${label}已复制。请打开微信聊天窗口，长按输入框粘贴发送。`);
    return;
  }
  showFeedback("自动复制失败，请手动复制");
  prompt("浏览器未允许自动复制。请手动复制以下汇总内容：", text);
}
