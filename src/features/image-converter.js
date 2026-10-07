/* 图片格式转换工具：多选 + 拖拽，canvas 本地转 JPEG/PNG/WebP，无外部依赖 */
(function initImageConverter() {
  if (window.__openaa_imageConverter) return;
  window.__openaa_imageConverter = true;

  var $ = function (id) {
    return document.getElementById(id);
  };
  var drop = $("iv-drop"),
    input = $("iv-files"),
    runBtn = $("iv-run"),
    countEl = $("iv-count"),
    listEl = $("iv-list"),
    resultEl = $("iv-result"),
    qRange = $("iv-quality"),
    qVal = $("iv-qval"),
    targetSel = $("iv-target");
  if (!runBtn) return; // 片段未挂载

  var MAX_FILES = 20;
  var BIG_FILE = 20 * 1024 * 1024; // 20MB
  var files = [];
  var liveUrls = []; // 需要释放的 object URL（缩略图 + 转换结果）
  var resultUrls = []; // 上一轮转换结果的 URL，重跑时先释放

  function revokeResultUrls() {
    var dead = resultUrls;
    resultUrls = [];
    liveUrls = liveUrls.filter(function (u) {
      return dead.indexOf(u) === -1;
    });
    dead.forEach(function (u) {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    });
  }

  var MIME = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  var EXT = { jpeg: "jpg", png: "png", webp: "webp" };
  var LABEL = { jpeg: "JPEG", png: "PNG", webp: "WebP" };

  function fmtBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }
  function srcLabel(type) {
    if (type === "image/jpeg") return "JPEG";
    if (type === "image/png") return "PNG";
    if (type === "image/webp") return "WebP";
    if (type === "image/gif") return "GIF";
    if (type === "image/bmp") return "BMP";
    return "原格式";
  }
  function safeName(name) {
    var b = String(name || "image").replace(/\.[^/.]+$/, "") || "image";
    return b.replace(/[\\/:*?"<>|]/g, "_");
  }
  function revokeAll() {
    liveUrls.forEach(function (u) {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    });
    liveUrls = [];
    resultUrls = [];
  }
  function setResult(strong, text) {
    resultEl.innerHTML = "";
    var s = document.createElement("strong");
    s.textContent = strong;
    var sp = document.createElement("span");
    sp.textContent = text;
    resultEl.appendChild(s);
    resultEl.appendChild(sp);
  }

  // ---------- 文件收集 ----------
  function addFiles(fileList) {
    var added = 0,
      skipped = 0;
    Array.prototype.forEach.call(fileList, function (f) {
      if (files.length >= MAX_FILES) {
        skipped++;
        return;
      }
      if (f.type && f.type.indexOf("image/") !== 0) {
        skipped++;
        return;
      }
      files.push(f);
      added++;
    });
    if (added || skipped) {
      renderPending();
      runBtn.disabled = files.length === 0;
      var msg = files.length
        ? "已选择 " + files.length + " 张图片"
        : "尚未选择图片";
      if (skipped) msg += "（跳过 " + skipped + " 个非图片或超量文件）";
      countEl.textContent = msg;
      if (files.length === 0 && skipped)
        setResult("未添加图片", "请选择图片文件（JPG / PNG / WebP 等）。");
    }
  }

  // ---------- 待处理列表 ----------
  function renderPending() {
    revokeAll();
    listEl.innerHTML = "";
    files.forEach(function (f, i) {
      var item = document.createElement("div");
      item.className = "iv-item";
      item.setAttribute("data-idx", String(i));

      var thumb = document.createElement("img");
      thumb.className = "iv-thumb";
      thumb.alt = "";
      var turl = URL.createObjectURL(f);
      liveUrls.push(turl);
      thumb.src = turl;

      var meta = document.createElement("div");
      meta.className = "iv-meta";
      var name = document.createElement("div");
      name.className = "iv-name";
      name.textContent = f.name || "未命名图片";
      var sizes = document.createElement("div");
      sizes.className = "iv-sizes";
      sizes.textContent =
        srcLabel(f.type) + " · " + fmtBytes(f.size) + " · 等待转换";
      meta.appendChild(name);
      meta.appendChild(sizes);

      var dl = document.createElement("a");
      dl.className = "btn iv-dl";
      dl.hidden = true;
      dl.textContent = "下载";

      item.appendChild(thumb);
      item.appendChild(meta);
      item.appendChild(dl);
      listEl.appendChild(item);
    });
  }

  // ---------- 转换核心 ----------
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("decode"));
      };
      img.src = url;
    });
  }
  function canvasToBlob(canvas, mime, quality) {
    return new Promise(function (resolve) {
      try {
        canvas.toBlob(function (b) {
          resolve(b);
        }, mime, quality);
      } catch (e) {
        resolve(null);
      }
    });
  }

  function updateCard(i, kind, data) {
    var item = listEl.querySelector('[data-idx="' + i + '"]');
    if (!item) return;
    var sizes = item.querySelector(".iv-sizes");
    var meta = item.querySelector(".iv-meta");
    var dl = item.querySelector(".iv-dl");
    Array.prototype.forEach.call(
      meta.querySelectorAll(".iv-tip"),
      function (t) {
        t.remove();
      }
    );
    if (kind === "working") {
      sizes.textContent = srcLabel(data.type) + " · 转换中…";
      dl.hidden = true;
      return;
    }
    if (kind === "error") {
      sizes.innerHTML = "";
      var e = document.createElement("span");
      e.className = "iv-err";
      e.textContent = data.msg;
      sizes.appendChild(e);
      dl.hidden = true;
      return;
    }
    // done
    sizes.textContent =
      data.from + " → " + data.to + " · " + fmtBytes(data.size);
    if (data.tip) {
      var tip = document.createElement("div");
      tip.className = "iv-tip";
      tip.textContent = data.tip;
      meta.appendChild(tip);
    }
    dl.href = data.url;
    dl.download = data.name;
    dl.hidden = false;
  }

  function run() {
    if (!files.length) {
      setResult("请先选择图片", "点击上方区域或拖拽图片进来。");
      return;
    }
    var target = targetSel.value;
    var mime = MIME[target];
    var quality = parseFloat(qRange.value) || 0.9;
    revokeResultUrls(); // 释放上一轮的下载链接
    runBtn.disabled = true;
    runBtn.textContent = "转换中…";
    setResult("转换中", "正在逐张处理，请稍候…");

    var okCount = 0;
    var idx = 0;

    function next() {
      if (idx >= files.length) {
        runBtn.disabled = false;
        runBtn.textContent = "开始转换";
        if (okCount > 0) {
          setResult(
            "转换完成",
            okCount + " 张图片已转为 " + LABEL[target] + "，可逐张下载。"
          );
        } else {
          setResult("转换失败", "图片都无法处理，请换一批图片试试。");
        }
        return;
      }
      var i = idx++;
      var f = files[i];
      updateCard(i, "working", { type: f.type });
      var tip = null;
      if (f.size > BIG_FILE) tip = "文件超过 20MB，处理可能较慢，请耐心等待。";
      if (target === "jpeg" && f.type === "image/png")
        tip = (tip ? tip + " " : "") + "透明背景将变为不透明底色。";
      if (f.type === "image/gif")
        tip = (tip ? tip + " " : "") + "动图将转为静态首帧。";

      loadImage(f)
        .then(function (img) {
          var canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext("2d").drawImage(img, 0, 0);
          var q = target === "png" ? undefined : quality;
          return canvasToBlob(canvas, mime, q);
        })
        .then(function (blob) {
          if (!blob) throw new Error("encode");
          var url = URL.createObjectURL(blob);
          liveUrls.push(url);
          resultUrls.push(url);
          okCount++;
          updateCard(i, "done", {
            from: srcLabel(f.type),
            to: LABEL[target],
            size: blob.size,
            tip: tip,
            url: url,
            name: safeName(f.name) + "-converted." + EXT[target],
          });
          next();
        })
        .catch(function (err) {
          updateCard(i, "error", {
            msg:
              err && err.message === "encode"
                ? "浏览器不支持输出该格式"
                : "图片无法解码（HEIC 等格式浏览器不支持）",
          });
          next();
        });
    }
    next();
  }

  // ---------- 事件 ----------
  qRange.addEventListener("input", function () {
    qVal.textContent = parseFloat(qRange.value).toFixed(2);
  });
  input.addEventListener("change", function () {
    addFiles(input.files);
    input.value = ""; // 允许重复选择同一文件
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      drop.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      drop.classList.remove("dragover");
    });
  });
  drop.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });
  drop.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });
  runBtn.addEventListener("click", run);
})();
