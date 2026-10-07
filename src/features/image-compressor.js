/* 图片压缩工具：多选 + 拖拽，canvas 本地压缩 JPG/PNG/WebP，无外部依赖 */
(function initImageCompressor() {
  if (window.__openaa_imageCompressor) return;
  window.__openaa_imageCompressor = true;

  var $ = function (id) {
    return document.getElementById(id);
  };
  var drop = $("ic-drop"),
    input = $("ic-files"),
    runBtn = $("ic-run"),
    countEl = $("ic-count"),
    listEl = $("ic-list"),
    resultEl = $("ic-result"),
    qRange = $("ic-quality"),
    qVal = $("ic-qval"),
    fmtSel = $("ic-format"),
    maxSel = $("ic-maxsize");
  if (!runBtn) return; // 片段未挂载

  var MAX_FILES = 20;
  var BIG_FILE = 20 * 1024 * 1024; // 20MB
  var files = [];
  var liveUrls = []; // 需要释放的 object URL（缩略图 + 压缩结果）
  var resultUrls = []; // 上一轮压缩结果的 URL，重跑时先释放

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

  function fmtBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }
  function baseName(name) {
    var b = String(name || "image").replace(/\.[^/.]+$/, "");
    return b || "image";
  }
  function safeName(name) {
    return baseName(name).replace(/[\\/:*?"<>|]/g, "_");
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
      // type 为空的（如某些系统文件）先收下，解码失败再提示
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
      item.className = "ic-item";
      item.setAttribute("data-idx", String(i));

      var thumb = document.createElement("img");
      thumb.className = "ic-thumb";
      thumb.alt = "";
      var turl = URL.createObjectURL(f);
      liveUrls.push(turl);
      thumb.src = turl;

      var meta = document.createElement("div");
      meta.className = "ic-meta";
      var name = document.createElement("div");
      name.className = "ic-name";
      name.textContent = f.name || "未命名图片";
      var sizes = document.createElement("div");
      sizes.className = "ic-sizes";
      sizes.textContent = "原体积 " + fmtBytes(f.size) + " · 等待压缩";
      meta.appendChild(name);
      meta.appendChild(sizes);

      var dl = document.createElement("a");
      dl.className = "btn ic-dl";
      dl.hidden = true;
      dl.textContent = "下载";

      item.appendChild(thumb);
      item.appendChild(meta);
      item.appendChild(dl);
      listEl.appendChild(item);
    });
  }

  // ---------- 压缩核心 ----------
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
  function drawScaled(img, maxEdge) {
    var w = img.naturalWidth,
      h = img.naturalHeight;
    if (maxEdge > 0 && Math.max(w, h) > maxEdge) {
      var s = maxEdge / Math.max(w, h);
      w = Math.max(1, Math.round(w * s));
      h = Math.max(1, Math.round(h * s));
    }
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return c;
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
  function resolveMime(file, choice) {
    if (choice === "jpeg") return "image/jpeg";
    if (choice === "png") return "image/png";
    if (choice === "webp") return "image/webp";
    if (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp"
    )
      return file.type;
    return "image/webp"; // 其它原格式（如 GIF/BMP）统一转 WebP
  }
  function extFor(mime) {
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/png") return "png";
    return "webp";
  }

  function updateCard(i, kind, data) {
    var item = listEl.querySelector('[data-idx="' + i + '"]');
    if (!item) return;
    var sizes = item.querySelector(".ic-sizes");
    var meta = item.querySelector(".ic-meta");
    var dl = item.querySelector(".ic-dl");
    // 清掉旧的提示行
    Array.prototype.forEach.call(
      meta.querySelectorAll(".ic-tip"),
      function (t) {
        t.remove();
      }
    );
    if (kind === "working") {
      sizes.textContent = "原体积 " + fmtBytes(data.orig) + " · 压缩中…";
      dl.hidden = true;
      return;
    }
    if (kind === "error") {
      sizes.innerHTML = "";
      var e = document.createElement("span");
      e.className = "ic-err";
      e.textContent = "原体积 " + fmtBytes(data.orig) + " · " + data.msg;
      sizes.appendChild(e);
      dl.hidden = true;
      return;
    }
    // done
    var pct = Math.round((1 - data.out / data.orig) * 100);
    sizes.innerHTML = "";
    var t1 = document.createTextNode(
      "原体积 " + fmtBytes(data.orig) + " → 压缩后 " + fmtBytes(data.out) + " · "
    );
    sizes.appendChild(t1);
    var tag = document.createElement("span");
    if (data.out < data.orig) {
      tag.className = "ic-save";
      tag.textContent = "节省 " + pct + "%";
    } else {
      tag.className = "ic-warn";
      tag.textContent =
        pct === 0 ? "体积基本不变" : "体积反而增大 " + Math.abs(pct) + "%";
    }
    sizes.appendChild(tag);
    if (data.tip) {
      var tip = document.createElement("div");
      tip.className = "ic-tip";
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
    var quality = parseFloat(qRange.value) || 0.8;
    var choice = fmtSel.value;
    var maxEdge = parseInt(maxSel.value, 10) || 0;
    revokeResultUrls(); // 释放上一轮的下载链接
    runBtn.disabled = true;
    runBtn.textContent = "压缩中…";
    setResult("压缩中", "正在逐张处理，请稍候…");

    var totalOrig = 0,
      totalOut = 0,
      okCount = 0;
    var idx = 0;

    function next() {
      if (idx >= files.length) {
        runBtn.disabled = false;
        runBtn.textContent = "开始压缩";
        if (okCount > 0) {
          var pct = Math.round((1 - totalOut / totalOrig) * 100);
          setResult(
            "压缩完成",
            okCount +
              " 张 · " +
              fmtBytes(totalOrig) +
              " → " +
              fmtBytes(totalOut) +
              "，共节省 " +
              pct +
              "%"
          );
        } else {
          setResult("压缩失败", "图片都无法处理，请换一批图片试试。");
        }
        return;
      }
      var i = idx++;
      var f = files[i];
      totalOrig += f.size;
      updateCard(i, "working", { orig: f.size });
      var tip = null;
      if (f.size > BIG_FILE) tip = "文件超过 20MB，处理可能较慢，请耐心等待。";
      var mime = resolveMime(f, choice);
      if (mime === "image/jpeg" && f.type === "image/png")
        tip = (tip ? tip + " " : "") + "PNG 转 JPEG 会丢失透明背景。";
      if (f.type === "image/gif")
        tip = (tip ? tip + " " : "") + "动图将转为静态首帧。";

      loadImage(f)
        .then(function (img) {
          var canvas = drawScaled(img, maxEdge);
          var q = mime === "image/png" ? undefined : quality;
          return canvasToBlob(canvas, mime, q);
        })
        .then(function (blob) {
          if (!blob) throw new Error("encode");
          var url = URL.createObjectURL(blob);
          liveUrls.push(url);
          resultUrls.push(url);
          totalOut += blob.size;
          okCount++;
          updateCard(i, "done", {
            orig: f.size,
            out: blob.size,
            tip: tip,
            url: url,
            name: safeName(f.name) + "-compressed." + extFor(mime),
          });
          next();
        })
        .catch(function (err) {
          updateCard(i, "error", {
            orig: f.size,
            msg:
              err && err.message === "encode"
                ? "浏览器不支持输出该格式"
                : "图片无法解码（可能是 HEIC 或已损坏）",
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
