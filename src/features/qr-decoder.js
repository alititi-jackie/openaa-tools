import { $, bad } from "../lib/calculators/standard.js";

/* 二维码解码（Pattern B，自包含 module）
 * 图片/截图 -> canvas -> vendored jsQR（Apache-2.0）解码 -> 文本；
 * URL 内容渲染为可点击链接（仅 http/https，DOM 方式创建防 XSS）。
 * jsQR 以 gzip+base64 形式存放于 public/vendor/jsQR.js.gz.b64（61KB 文本，
 * push 通道不支持二进制），首次解码时懒加载、DecompressionStream 解压后经
 * Blob URL 动态 import；全程浏览器本地处理，不上传服务器。
 */
let jsQRPromise = null;
function loadJsQR() {
  if (!jsQRPromise) {
    jsQRPromise = (async () => {
      if (typeof DecompressionStream === "undefined")
        throw new Error("no-decompression");
      const res = await fetch("/vendor/jsQR.js.gz.b64");
      if (!res.ok) throw new Error("fetch-failed");
      const b64 = (await res.text()).trim();
      const bin = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
      const text = await new Response(
        new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).text();
      const mod = await import(
        URL.createObjectURL(new Blob([text], { type: "text/javascript" }))
      );
      return mod.default || mod;
    })();
  }
  return jsQRPromise;
}

if ($("qr-file")) {
  const fileInput = $("qr-file");
  const drop = $("qr-drop");
  const preview = $("qr-preview");
  const MAX_DIM = 1600; // 解码前最大边，兼顾速度与识别率
  const MAX_SIZE = 10 * 1024 * 1024;

  const renderResult = (text) => {
    const e = $("result");
    e.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = "✅ 已识别";
    const span = document.createElement("span");
    span.textContent = text;
    e.append(strong, span);
    const t = text.trim();
    if (/^https?:\/\/[^\s]+$/i.test(t)) {
      const a = document.createElement("a");
      a.href = t;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "在新标签页打开链接 ↗";
      a.style.display = "block";
      a.style.marginTop = "8px";
      e.append(a);
    }
  };

  const toBitmap = (file) =>
    createImageBitmap(file).catch(
      () =>
        new Promise((resolve, reject) => {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("image load failed"));
          };
          img.src = url;
        }),
    );

  const decode = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return bad("请选择图片文件（JPG / PNG / 截图都可以）");
    if (file.size > MAX_SIZE)
      return bad("图片超过 10MB，请换张小一点的图片试试");

    try {
      const bmp = await toBitmap(file);
      const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(bmp, 0, 0, w, h);
      if (typeof bmp.close === "function") bmp.close();

      preview.src = canvas.toDataURL("image/png");
      preview.hidden = false;

      const imageData = ctx.getImageData(0, 0, w, h);
      let jsQR;
      try {
        jsQR = await loadJsQR();
      } catch {
        return bad("解码组件加载失败，请检查网络后重试（需较新版浏览器）");
      }
      const code = jsQR(imageData.data, w, h, {
        inversionAttempts: "attemptBoth", // 兼容黑底白码
      });
      if (code && code.data) renderResult(code.data);
      else bad("没识别到二维码，换张更清晰的图片试试");
    } catch {
      bad("图片读取失败，请换一张图片试试");
    }
  };

  const pick = (file) => {
    fileInput.value = ""; // 允许重复选择同一文件
    decode(file);
  };

  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", () => pick(fileInput.files[0]));

  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("dragging");
    }),
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("dragging");
    }),
  );
  drop.addEventListener("drop", (e) => {
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (file) pick(file);
  });

  // 截图后直接粘贴
  document.addEventListener("paste", (e) => {
    if (!$("qr-file") || !document.contains(drop)) return;
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) pick(file);
        break;
      }
    }
  });
}
