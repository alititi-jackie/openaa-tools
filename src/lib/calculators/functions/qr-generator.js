import qrcode from "../../vendor/qrcode-generator.js";
import { $, bad } from "../standard.js";

/* 二维码生成器（多功能版）
 * 7 种内容类型（链接/文本/WiFi/名片/电话/短信/邮件）-> QR 矩阵 -> canvas PNG + SVG 字符串
 * QR 矩阵由 vendored 的 qrcode-generator（MIT）计算；全程浏览器本地，无网络请求。
 * 历史记录复用站内 engage.js 的存储键（openaa_tools_hist_qr-generator_v1），
 * 本工具自带可点击恢复的富历史，因此在 engage.js 中关闭了通用自动记录（NO_AUTO_HISTORY）。
 */

const TYPE_LABELS = {
  url: "链接",
  text: "文本",
  wifi: "WiFi",
  vcard: "名片",
  tel: "电话",
  sms: "短信",
  email: "邮件",
};
const TYPE_EMPTY_MSG = {
  url: "请输入链接地址",
  text: "请输入文本内容",
  wifi: "请输入 WiFi 名称",
  vcard: "请至少填写姓名、手机、邮箱中的一项",
  tel: "请输入电话号码",
  sms: "请输入接收号码",
  email: "请输入收件邮箱",
};
const TYPE_FIELDS = {
  url: ["qr-url"],
  text: ["qr-text"],
  wifi: ["qr-wifi-ssid", "qr-wifi-sec", "qr-wifi-pwd"],
  vcard: ["qr-vcard-name", "qr-vcard-tel", "qr-vcard-email", "qr-vcard-org", "qr-vcard-url"],
  tel: ["qr-tel"],
  sms: ["qr-sms-tel", "qr-sms-body"],
  email: ["qr-email-to", "qr-email-sub", "qr-email-body"],
};
const HIST_KEY = "openaa_tools_hist_qr-generator_v1";
const MAX_HIST = 8;

let currentType = "url";
let logoImg = null; // HTMLImageElement | null
let debounceTimer = 0;

const val = (id) => ($(id)?.value || "").trim();
const clampNum = (v, lo, hi, dflt) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};
const escHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ---------------- payload 构建 ---------------- */

// WiFi 扫码格式：WIFI:T:WPA;S:ssid;P:password;;  特殊字符 \ ; , : " 前加反斜杠转义
const escWifi = (s) => s.replace(/([\\;,:"])/g, "\\$1");
// vCard 字段：去掉换行，避免破坏格式
const cleanField = (s) => s.replace(/[\r\n]+/g, " ").trim();

function buildPayload() {
  switch (currentType) {
    case "url": {
      let u = val("qr-url");
      if (!u) return { empty: true };
      if (u.length > 1200) return { error: "链接过长，请控制在 1200 字符以内" };
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
      return { payload: u, summary: u.length > 46 ? u.slice(0, 46) + "…" : u };
    }
    case "text": {
      const t = val("qr-text");
      if (!t) return { empty: true };
      if (t.length > 1200) return { error: "内容过长，请控制在 1200 字以内" };
      return { payload: t, summary: t.length > 40 ? t.slice(0, 40) + "…" : t };
    }
    case "wifi": {
      const ssid = val("qr-wifi-ssid");
      const sec = $("qr-wifi-sec")?.value || "WPA";
      const pwd = val("qr-wifi-pwd");
      if (!ssid) return { empty: true };
      if (ssid.length > 64) return { error: "WiFi 名称过长" };
      let payload = `WIFI:T:${sec};S:${escWifi(ssid)};`;
      if (sec !== "nopass") {
        if (!pwd) return { error: "请输入 WiFi 密码（或把加密方式选为「无密码」）" };
        payload += `P:${escWifi(pwd)};`;
      }
      payload += ";";
      return { payload, summary: `WiFi: ${ssid}` };
    }
    case "vcard": {
      const name = cleanField(val("qr-vcard-name"));
      const tel = cleanField(val("qr-vcard-tel"));
      const email = cleanField(val("qr-vcard-email"));
      const org = cleanField(val("qr-vcard-org"));
      let url = cleanField(val("qr-vcard-url"));
      if (!name && !tel && !email) return { empty: true };
      if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];
      if (name) lines.push(`N:${name}`, `FN:${name}`);
      if (tel) lines.push(`TEL;TYPE=CELL:${tel}`);
      if (email) lines.push(`EMAIL:${email}`);
      if (org) lines.push(`ORG:${org}`);
      if (url) lines.push(`URL:${url}`);
      lines.push("END:VCARD");
      const payload = lines.join("\n");
      if (payload.length > 1200) return { error: "名片内容过长，请精简" };
      return { payload, summary: `名片: ${name || tel || email}` };
    }
    case "tel": {
      const n = val("qr-tel");
      if (!n) return { empty: true };
      if (!/^[+\d][\d\s\-()]{1,29}$/.test(n)) return { error: "电话号码格式不正确" };
      return { payload: `tel:${n.replace(/[\s\-()]/g, "")}`, summary: `电话: ${n}` };
    }
    case "sms": {
      const n = val("qr-sms-tel");
      const body = val("qr-sms-body");
      if (!n) return { empty: true };
      if (!/^[+\d][\d\s\-()]{1,29}$/.test(n)) return { error: "接收号码格式不正确" };
      let payload = `smsto:${n.replace(/[\s\-()]/g, "")}`;
      if (body) payload += `:${body}`;
      if (payload.length > 1200) return { error: "短信内容过长" };
      return { payload, summary: `短信: ${n}` };
    }
    case "email": {
      const to = val("qr-email-to");
      if (!to) return { empty: true };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: "邮箱格式不正确" };
      const sub = val("qr-email-sub");
      const body = val("qr-email-body");
      let payload = `mailto:${to}`;
      const qs = [];
      if (sub) qs.push(`subject=${encodeURIComponent(sub)}`);
      if (body) qs.push(`body=${encodeURIComponent(body)}`);
      if (qs.length) payload += `?${qs.join("&")}`;
      if (payload.length > 1200) return { error: "邮件内容过长" };
      return { payload, summary: `邮件: ${to}` };
    }
    default:
      return { empty: true };
  }
}

/* ---------------- 生成 ---------------- */

function setPlaceholder() {
  const result = $("result");
  if (!result) return;
  result.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = "—";
  const span = document.createElement("span");
  span.textContent = "输入内容后自动生成";
  result.append(strong, span);
}

function currentStyle() {
  let ec = ($("qr-ec")?.value || "M").toUpperCase();
  if (!"LMQH".includes(ec)) ec = "M";
  const fg = $("qr-fg")?.value || "#000000";
  const bg = $("qr-bg")?.value || "#ffffff";
  if (logoImg) ec = "H"; // 有 logo 时强制最高纠错，保证可扫
  return { ec, fg, bg, size: clampNum($("qr-size")?.value, 240, 1200, 600) };
}

// 圆角矩形（含旧浏览器 fallback）
function rr(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function drawLogo(ctx, px) {
  const ls = Math.round(px * 0.22);
  const x = (px - ls) / 2;
  const y = (px - ls) / 2;
  const rad = Math.round(ls * 0.2);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  rr(ctx, x, y, ls, ls, rad);
  ctx.fill();
  rr(ctx, x, y, ls, ls, rad);
  ctx.clip();
  const pad = Math.round(ls * 0.12);
  const iw = logoImg.naturalWidth || 1;
  const ih = logoImg.naturalHeight || 1;
  const s = Math.min((ls - pad * 2) / iw, (ls - pad * 2) / ih);
  const dw = Math.max(1, Math.round(iw * s));
  const dh = Math.max(1, Math.round(ih * s));
  ctx.drawImage(logoImg, Math.round(x + (ls - dw) / 2), Math.round(y + (ls - dh) / 2), dw, dh);
  ctx.restore();
}

function buildSVG(qr, count, margin, fg, bg) {
  const n = count + margin * 2;
  let d = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
    }
  }
  let logoSvg = "";
  if (logoImg && logoImg.dataset.url) {
    const ls = n * 0.22;
    const x = (n - ls) / 2;
    const y = (n - ls) / 2;
    const rad = ls * 0.2;
    const f = (v) => v.toFixed(2);
    logoSvg =
      `<rect x="${f(x)}" y="${f(y)}" width="${f(ls)}" height="${f(ls)}" rx="${f(rad)}" fill="#ffffff"/>` +
      `<image href="${logoImg.dataset.url}" x="${f(x)}" y="${f(y)}" width="${f(ls)}" height="${f(ls)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="600" height="600">` +
    `<rect width="${n}" height="${n}" fill="${bg}"/>` +
    `<path d="${d}" fill="${fg}"/>${logoSvg}</svg>`
  );
}

function downloadLink(href, filename, text) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.className = "btn";
  a.style.cssText = "display:inline-block;text-decoration:none;width:auto;padding:10px 22px;";
  a.textContent = text;
  return a;
}

function renderResult(qr, style, built) {
  const { fg, bg, size } = style;
  const count = qr.getModuleCount();
  const margin = 4;
  const scale = Math.max(2, Math.floor(size / (count + margin * 2)));
  const px = (count + margin * 2) * scale;

  // PNG（canvas）
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = fg;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
    }
  }
  if (logoImg) drawLogo(ctx, px);
  const pngUrl = canvas.toDataURL("image/png");

  // SVG（矢量）
  const svg = buildSVG(qr, count, margin, fg, bg);

  const result = $("result");
  result.replaceChildren();
  const wrap = document.createElement("div");
  wrap.style.textAlign = "center";
  const img = document.createElement("img");
  img.src = pngUrl;
  img.alt = "生成的二维码";
  const show = Math.min(px, 300);
  img.width = show;
  img.height = show;
  img.style.cssText =
    "image-rendering:pixelated;border:1px solid #e5e7eb;border-radius:12px;background:#fff;display:block;margin:0 auto";
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap";
  const pngA = downloadLink(pngUrl, "qrcode.png", "下载 PNG");
  const svgA = downloadLink(
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
    "qrcode.svg",
    "下载 SVG",
  );
  // 下载是最强的"想要这个"信号：点下载即记一条历史（saveHistory 自带去重）
  pngA.addEventListener("click", () => saveHistory(built));
  svgA.addEventListener("click", () => saveHistory(built));
  btnRow.append(pngA, svgA);
  const tip = document.createElement("p");
  tip.className = "note";
  tip.style.marginTop = "10px";
  tip.textContent =
    "SVG 为矢量格式，放大印刷不模糊；PNG 通用性最好。长按/右键图片也可以另存。二维码在本地生成，内容不会上传。";
  wrap.append(img, btnRow, tip);
  result.append(wrap);
}

function generate(opts = {}) {
  const { fromAuto = false, forceSave = false } = opts;
  const result = $("result");
  if (!result) return;
  const built = buildPayload();
  if (built.empty) {
    if (fromAuto) setPlaceholder();
    else bad(TYPE_EMPTY_MSG[currentType] || "请输入内容");
    return;
  }
  if (built.error) {
    bad(built.error);
    return;
  }
  const style = currentStyle();
  if (style.fg.toLowerCase() === style.bg.toLowerCase()) {
    bad("前景色和背景色不能相同，请重新选择");
    return;
  }
  try {
    const qr = qrcode(0, style.ec);
    qr.addData(built.payload);
    qr.make();
    renderResult(qr, style, built);
    if (forceSave) {
      saveHistory(built);
    }
  } catch {
    bad("生成失败，内容可能过长，请缩短后重试");
  }
}

/* ---------------- 历史记录（复用 engage.js 存储键，可点击恢复） ---------------- */

function readHist() {
  try {
    const v = JSON.parse(localStorage.getItem(HIST_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeHist(list) {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, MAX_HIST)));
  } catch {
    /* 存储不可用时静默跳过 */
  }
}
function collectState() {
  const fields = {};
  for (const id of TYPE_FIELDS[currentType] || []) fields[id] = $(id)?.value || "";
  return {
    type: currentType,
    fields,
    fg: $("qr-fg")?.value || "#000000",
    bg: $("qr-bg")?.value || "#ffffff",
    ec: $("qr-ec")?.value || "M",
    size: $("qr-size")?.value || "600",
  };
}
function saveHistory(built) {
  const list = readHist();
  if (list[0] && list[0].payload === built.payload) return; // 去重
  list.unshift({
    t: Date.now(),
    type: currentType,
    label: TYPE_LABELS[currentType] || "",
    summary: built.summary || "",
    payload: built.payload,
    state: collectState(),
  });
  writeHist(list);
  renderHistory();
}
function renderHistory() {
  const list = readHist();
  let section = document.getElementById("calc-history");
  if (!list.length) {
    if (section) section.remove();
    return;
  }
  if (!section) {
    section = document.createElement("section");
    section.id = "calc-history";
    section.className = "calc-history";
    section.setAttribute("aria-label", "最近生成");
    $("result")?.insertAdjacentElement("afterend", section);
  }
  section.innerHTML =
    "<h2>最近生成</h2><ul>" +
    list
      .map(
        (h, i) =>
          `<li><button type="button" class="qr-hist-btn" data-hist="${i}"><time>${new Date(h.t).toLocaleString("zh-CN", { hour12: false })}</time><span class="qr-hist-type">${escHtml(h.label)}</span>${escHtml(h.summary)}</button></li>`,
      )
      .join("") +
    "</ul>";
  section.querySelectorAll(".qr-hist-btn").forEach((b) =>
    b.addEventListener("click", () => restoreHistory(Number(b.dataset.hist))),
  );
}
function restoreHistory(i) {
  const h = readHist()[i];
  if (!h || !h.state) return;
  const st = h.state;
  setType(st.type && TYPE_LABELS[st.type] ? st.type : "url", { silent: true });
  for (const [id, v] of Object.entries(st.fields || {})) {
    const el = $(id);
    if (el) el.value = v;
  }
  if ($("qr-fg")) $("qr-fg").value = st.fg || "#000000";
  if ($("qr-bg")) $("qr-bg").value = st.bg || "#ffffff";
  if ($("qr-ec")) $("qr-ec").value = st.ec || "M";
  if ($("qr-size")) $("qr-size").value = st.size || "600";
  clearLogo({ silent: true }); // 文件无法持久化，恢复时清空 logo
  syncWifiPwd();
  generate({ fromAuto: false, forceSave: true });
  $("result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------------- 交互 ---------------- */

function setType(type, opts = {}) {
  if (!TYPE_LABELS[type]) return;
  currentType = type;
  document.querySelectorAll(".qr-tab").forEach((b) => {
    const on = b.dataset.qrtype === type;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".qr-panel").forEach((p) => {
    p.hidden = p.dataset.panel !== type;
  });
  if (!opts.silent) generate({ fromAuto: true });
}

function syncWifiPwd() {
  const sec = $("qr-wifi-sec")?.value;
  const wrap = $("qr-wifi-pwd-wrap");
  if (wrap) wrap.style.display = sec === "nopass" ? "none" : "";
}

function onLogoFile(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (!f.type.startsWith("image/")) {
    bad("请选择图片文件作为 Logo");
    e.target.value = "";
    return;
  }
  if (f.size > 2 * 1024 * 1024) {
    bad("Logo 图片请小于 2MB");
    e.target.value = "";
    return;
  }
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      logoImg = img;
      img.dataset.url = String(rd.result);
      const ecSel = $("qr-ec");
      if (ecSel) ecSel.value = "H";
      const note = $("qr-logo-note");
      if (note) note.textContent = "已上传 Logo，纠错级别已自动设为 H（最高），保证加 Logo 后仍可扫描。";
      const clear = $("qr-logo-clear");
      if (clear) clear.hidden = false;
      generate({ fromAuto: true });
    };
    img.onerror = () => bad("图片读取失败，请换一张");
    img.src = String(rd.result);
  };
  rd.onerror = () => bad("图片读取失败，请换一张");
  rd.readAsDataURL(f);
}

function clearLogo(opts = {}) {
  logoImg = null;
  const inp = $("qr-logo");
  if (inp) inp.value = "";
  const clear = $("qr-logo-clear");
  if (clear) clear.hidden = true;
  const note = $("qr-logo-note");
  if (note) note.textContent = "上传后自动使用 H 级纠错，保证可扫。";
  if (!opts.silent) generate({ fromAuto: true });
}

function bindRealtime() {
  const form = document.querySelector(".tool-form");
  if (!form) return;
  // 输入即生成（debounce 300ms）
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.id === "qr-logo") return;
    if (t.id === "qr-ec" && logoImg) t.value = "H"; // 有 logo 时锁定 H
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => generate({ fromAuto: true }), 300);
  });
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.id === "qr-wifi-sec") syncWifiPwd();
    if (t.tagName === "SELECT" && t.id !== "qr-logo") generate({ fromAuto: true });
  });
  document.querySelectorAll(".qr-tab").forEach((b) =>
    b.addEventListener("click", () => setType(b.dataset.qrtype || "url")),
  );
  document.querySelectorAll(".qr-preset").forEach((b) =>
    b.addEventListener("click", () => {
      if ($("qr-fg")) $("qr-fg").value = b.dataset.fg || "#000000";
      if ($("qr-bg")) $("qr-bg").value = b.dataset.bg || "#ffffff";
      generate({ fromAuto: true });
    }),
  );
  $("qr-logo")?.addEventListener("change", onLogoFile);
  $("qr-logo-clear")?.addEventListener("click", () => clearLogo());
  syncWifiPwd();
}

// 手动"生成二维码"按钮（由 src/features/calculator.js 统一绑定）
export const calculate = () => {
  clearTimeout(debounceTimer);
  generate({ fromAuto: false, forceSave: true });
};

bindRealtime();
renderHistory();
