/* OpenAA 图片转文字：浏览器端 OCR，图片不上传服务器。 */
(function initOpenAAImageOCR() {
  if (window.__openaa_imageOCR) return;
  window.__openaa_imageOCR = true;

  const $ = (id) => document.getElementById(id);
  const drop = $("ocr-drop");
  const input = $("ocr-file");
  const runBtn = $("ocr-run");
  const language = $("ocr-language");
  const info = $("ocr-file-info");
  const previewWrap = $("ocr-preview-wrap");
  const preview = $("ocr-preview");
  const clearImageBtn = $("ocr-clear-image");
  const progressWrap = $("ocr-progress-wrap");
  const progressBar = $("ocr-progress-bar");
  const progressText = $("ocr-progress-text");
  const status = $("ocr-status");
  const result = $("ocr-result-text");
  const copyBtn = $("ocr-copy");
  const downloadBtn = $("ocr-download");
  const resetBtn = $("ocr-reset");
  if (!runBtn || !input || !result) return;

  const MAX_BYTES = 10 * 1024 * 1024;
  let file = null;
  let previewUrl = "";
  let worker = null;
  let busy = false;

  function setStatus(title, message) {
    status.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = title;
    const span = document.createElement("span");
    span.textContent = message;
    status.append(strong, span);
  }
  function setProgress(value, message) {
    progressWrap.hidden = false;
    progressBar.style.width = Math.max(0, Math.min(100, value)) + "%";
    progressText.textContent = message;
  }
  function revokePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    preview.removeAttribute("src");
  }
  function setFile(next) {
    if (!next || busy) return;
    if (!next.type || !next.type.startsWith("image/")) {
      setStatus("文件格式不支持", "请选择 JPG、PNG、WebP 等图片文件。");
      return;
    }
    if (next.size > MAX_BYTES) {
      setStatus("图片太大", "单张图片请控制在 10 MB 以内。");
      return;
    }
    file = next;
    revokePreview();
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    previewWrap.hidden = false;
    info.textContent = file.name + " · " + (file.size / 1024 / 1024).toFixed(2) + " MB";
    runBtn.disabled = false;
    setStatus("图片已准备好", "确认识别语言，然后点击“开始识别文字”。");
    progressWrap.hidden = true;
  }
  function clearImage() {
    if (busy) return;
    file = null;
    input.value = "";
    revokePreview();
    previewWrap.hidden = true;
    info.textContent = "尚未选择图片";
    runBtn.disabled = true;
    progressWrap.hidden = true;
  }
  function syncActions() {
    const hasText = result.value.trim().length > 0;
    copyBtn.disabled = !hasText;
    downloadBtn.disabled = !hasText;
  }
  let tesseractLoadPromise = null;
  async function loadTesseract() {
    if (window.Tesseract && window.Tesseract.createWorker) return window.Tesseract;
    if (!tesseractLoadPromise) {
      tesseractLoadPromise = (async () => {
        const cdns = [
          { base: "https://cdn.jsdelivr.net/npm", src: "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js" },
          { base: "https://unpkg.com", src: "https://unpkg.com/tesseract.js@6.0.1/dist/tesseract.min.js" }
        ];
        let lastError;
        for (const cdn of cdns) {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = cdn.src;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => {
                script.remove();
                reject(new Error("无法加载 OCR 脚本：" + cdn.src));
              };
              document.head.appendChild(script);
            });
            if (window.Tesseract && window.Tesseract.createWorker) {
              window.Tesseract.__openaaCdnBase = cdn.base;
              return window.Tesseract;
            }
            throw new Error("OCR 脚本已加载，但识别引擎未初始化。");
          } catch (error) {
            lastError = error;
          }
        }
        throw lastError || new Error("所有 OCR 资源地址均加载失败。");
      })();
    }
    return tesseractLoadPromise.catch((error) => {
      // Allow a later user retry after transient CDN/network failures.
      tesseractLoadPromise = null;
      throw error;
    });
  }

  // Improve OCR input on mobile photos and screenshots: enlarge small text and
  // normalize grayscale/contrast without uploading the image anywhere.
  async function prepareImageForOCR(sourceFile) {
    const bitmap = await createImageBitmap(sourceFile);
    try {
      const maxSide = 4200;
      const scale = Math.min(2, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frame.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const gray = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
        // A gentle contrast stretch improves faint print while retaining anti-aliasing.
        const enhanced = Math.max(0, Math.min(255, (gray - 128) * 1.18 + 128));
        pixels[i] = enhanced;
        pixels[i + 1] = enhanced;
        pixels[i + 2] = enhanced;
      }
      ctx.putImageData(frame, 0, 0);
      return canvas;
    } finally {
      bitmap.close();
    }
  }

  async function recognize() {
    if (!file || busy) return;
    busy = true;
    runBtn.disabled = true;
    language.disabled = true;
    input.disabled = true;
    clearImageBtn.disabled = true;
    resetBtn.disabled = true;
    runBtn.textContent = "识别中…";
    result.value = "";
    syncActions();
    setProgress(2, "正在加载识别程序…");
    setStatus("正在准备", "首次使用需要下载识别程序和语言数据，请保持页面打开。");
    try {
      // Use the browser UMD build instead of importing the ESM bundle dynamically.
      // The ESM bundle can fail on mobile browsers/CDN module resolution before OCR starts.
      const tesseract = await loadTesseract();
      const lang = language.value;
      const cdnBase = tesseract.__openaaCdnBase || "https://cdn.jsdelivr.net/npm";
      worker = await tesseract.createWorker(lang, 1, {
        logger: (message) => {
          if (!message) return;
          if (typeof message.progress === "number") {
            const progress = Math.round(message.progress * 100);
            const labels = {
              loading_tesseract_core: "正在加载识别引擎",
              initializing_tesseract: "正在初始化识别引擎",
              loading_language_traineddata: "正在下载语言模型",
              initializing_api: "正在初始化语言模型",
              recognizing_text: "正在识别图片文字"
            };
            const label = labels[message.status] || "正在处理";
            setProgress(Math.max(3, progress), label + " · " + progress + "%");
          } else {
            setProgress(5, "正在准备识别环境…");
          }
        },
        workerPath: cdnBase + "/tesseract.js@6.0.1/dist/worker.min.js",
        corePath: cdnBase + "/tesseract.js-core@6.0.0",
        langPath: "https://tessdata.projectnaptha.com/4.0.0"
      });
      setProgress(8, "正在优化图片…");
      const preparedImage = await prepareImageForOCR(file);
      // A single uniform text block is the common case for screenshots and documents.
      // This avoids Tesseract treating each line as unrelated fragments.
      await worker.setParameters({ tessedit_pageseg_mode: "6" });
      setProgress(12, "正在识别图片文字…");
      const { data } = await worker.recognize(preparedImage);
      result.value = (data && data.text ? data.text : "").trim();
      syncActions();
      setProgress(100, "识别完成");
      if (result.value) {
        setStatus("识别完成", "请检查文字，特别是数字、日期、地址和专有名称。");
      } else {
        setStatus("没有识别到文字", "尝试使用更清晰、光线更好或文字更大的图片。");
      }
    } catch (error) {
      console.error("OpenAA OCR error:", error);
      setProgress(0, "识别未完成");
      const detail = error && error.message ? String(error.message).slice(0, 180) : "未知错误";
      setStatus("识别失败", "识别引擎或语言模型加载失败。请稍后重试；图片不会上传。错误信息：" + detail);
    } finally {
      if (worker) {
        try { await worker.terminate(); } catch (_) {}
        worker = null;
      }
      busy = false;
      runBtn.disabled = !file;
      runBtn.textContent = "开始识别文字";
      language.disabled = false;
      input.disabled = false;
      clearImageBtn.disabled = false;
      resetBtn.disabled = false;
    }
  }

  input.addEventListener("change", () => {
    if (input.files && input.files[0]) setFile(input.files[0]);
    input.value = "";
  });
  ["dragenter", "dragover"].forEach((eventName) => drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.add("dragover");
  }));
  ["dragleave", "drop"].forEach((eventName) => drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.remove("dragover");
  }));
  drop.addEventListener("drop", (event) => {
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) setFile(event.dataTransfer.files[0]);
  });
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });
  clearImageBtn.addEventListener("click", clearImage);
  runBtn.addEventListener("click", recognize);
  result.addEventListener("input", syncActions);
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(result.value);
      setStatus("已复制", "识别结果已复制到剪贴板。");
    } catch (_) {
      result.focus();
      result.select();
      setStatus("请手动复制", "浏览器未允许自动复制，请使用系统复制功能。");
    }
  });
  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([result.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file && file.name ? file.name.replace(/\.[^.]+$/, "") : "openaa-ocr") + ".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  resetBtn.addEventListener("click", () => {
    clearImage();
    result.value = "";
    syncActions();
    setStatus("已清空", "选择图片后即可重新开始。");
  });
  window.addEventListener("pagehide", () => {
    revokePreview();
    if (worker) worker.terminate().catch(() => {});
  });
})();