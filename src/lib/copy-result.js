/**
 * 在计算器结果区后注入"复制结果"按钮。
 * 通用方案：找到标准的 #result（或 #realIdResult）结果区，在其后插入按钮；
 * 点击后复制"工具名：结果摘要 + 页面 URL"。无 #result 的工具页自动跳过，
 * 不改动任何工具的计算逻辑与布局。
 */
const RESULT_SELECTORS = ["#result", "#realIdResult"];

export function setupCopyResult() {
  const result =
    RESULT_SELECTORS.map((sel) => document.querySelector(sel)).find(Boolean) ||
    null;
  if (!result || document.getElementById("copy-result-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "copy-result-btn";
  btn.className = "copy-result-btn";
  btn.textContent = "复制结果";
  btn.setAttribute("aria-label", "复制计算结果");

  btn.addEventListener("click", async () => {
    const h1 = document.querySelector("main h1");
    const toolName = ((h1 && h1.textContent) || document.title).trim();
    const summary = (result.innerText || result.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
    const text = `${toolName}：${summary} ${location.href}`;
    const done = (ok) => {
      btn.textContent = ok ? "已复制 ✓" : "复制失败";
      setTimeout(() => {
        btn.textContent = "复制结果";
      }, 2000);
    };
    try {
      await navigator.clipboard.writeText(text);
      done(true);
    } catch {
      // 非安全上下文降级方案
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        done(document.execCommand("copy"));
      } catch {
        done(false);
      }
      ta.remove();
    }
  });

  result.insertAdjacentElement("afterend", btn);
}
