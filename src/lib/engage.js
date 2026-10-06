/**
 * OpenAA 工具库留存功能（纯前端，localStorage，无需登录）。
 * - 收藏：工具页面包屑旁 ★ 按钮 + 首页工具卡片右上角 ★，存 tool id 列表
 * - 最近使用：访问工具页即记录，首页展示最近 8 个
 * - 最近计算：监听 #result 变化，存最近 5 条（输入摘要 + 结果摘要 + 时间），展示在结果区下方
 */
const FAV_KEY = "openaa_tools_fav_v1";
const RECENT_KEY = "openaa_tools_recent_v1";
const MAX_RECENT = 8;
const MAX_HISTORY = 5;
// 自带更丰富历史记录（可点击恢复）的工具：跳过通用自动记录，避免重复
const NO_AUTO_HISTORY = new Set(["qr-generator"]);
const histKey = (id) => `openaa_tools_hist_${id}_v1`;

function readList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* 存储不可用时静默跳过 */
  }
}
function getFavs() {
  return readList(FAV_KEY);
}
function isFav(id) {
  return getFavs().includes(id);
}
function toggleFav(id) {
  let fav = getFavs();
  fav = fav.includes(id) ? fav.filter((x) => x !== id) : [id, ...fav];
  writeList(FAV_KEY, fav.slice(0, 50));
  document.dispatchEvent(new CustomEvent("openaa-fav-change"));
  return fav.includes(id);
}
function paintFavButton(btn, on) {
  btn.classList.toggle("is-fav", on);
  btn.setAttribute("aria-pressed", String(on));
  const icon = btn.querySelector(".fav-star-icon");
  if (icon) icon.textContent = on ? "★" : "☆";
}

/** 首页工具索引（index.astro 内嵌的 JSON），用于重建卡片 */
function toolIndex() {
  try {
    const el = document.getElementById("openaa-tool-index");
    if (!el) return [];
    const arr = JSON.parse(el.textContent || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function toolCardHTML(t) {
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return `<a class="tool-card" href="${esc(t.path)}"><span class="tool-icon" aria-hidden="true">${esc(t.icon)}</span><div><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p></div><span class="card-arrow" aria-hidden="true">↗</span></a>`;
}
function renderHomeSections() {
  const index = toolIndex();
  if (!index.length) return;
  const byId = new Map(index.map((t) => [t.id, t]));
  const render = (sectionId, gridId, ids) => {
    const section = document.getElementById(sectionId);
    const grid = document.getElementById(gridId);
    if (!section || !grid) return;
    const items = ids.map((id) => byId.get(id)).filter(Boolean);
    if (!items.length) {
      section.hidden = true;
      return;
    }
    grid.innerHTML = items.map(toolCardHTML).join("");
    grid.querySelectorAll(".tool-card").forEach(addCardStar);
    section.hidden = false;
  };
  render("engage-recent", "engage-recent-grid", readList(RECENT_KEY));
  render("engage-fav", "engage-fav-grid", getFavs());
}

/** 首页工具卡片右上角 ★（阻止冒泡，避免触发卡片跳转） */
function addCardStar(card) {
  if (card.querySelector(".fav-star-btn")) return;
  const id = cardLinkToId(card);
  if (!id) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "fav-star-btn";
  btn.setAttribute("aria-label", "收藏这个工具");
  const icon = document.createElement("span");
  icon.className = "fav-star-icon";
  icon.setAttribute("aria-hidden", "true");
  btn.appendChild(icon);
  paintFavButton(btn, isFav(id));
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    paintFavButton(btn, toggleFav(id));
  });
  card.appendChild(btn);
}
function cardLinkToId(card) {
  const href = card.getAttribute("href") || "";
  const m = href.match(/^\/tools\/([^/]+)\/$/);
  return m ? m[1] : null;
}

/** 工具页：面包屑旁的 ★ 收藏按钮（服务端渲染，JS 只绑定行为） */
function setupToolFav(toolId) {
  document.querySelectorAll("[data-fav-toggle]").forEach((btn) => {
    const id = btn.dataset.favToggle || toolId;
    paintFavButton(btn, isFav(id));
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      paintFavButton(btn, toggleFav(id));
    });
  });
}

/** 工具页：记录访问 + 最近计算历史 */
function setupToolPage(toolId) {
  // 最近使用
  const recent = readList(RECENT_KEY).filter((id) => id !== toolId);
  recent.unshift(toolId);
  writeList(RECENT_KEY, recent.slice(0, MAX_RECENT));

  setupToolFav(toolId);

  // 自带富历史记录的工具自己管理历史（同存储键），跳过通用监听
  if (NO_AUTO_HISTORY.has(toolId)) return;

  // 最近计算：监听结果区变化
  const result =
    ["#result", "#realIdResult"]
      .map((sel) => document.querySelector(sel))
      .find(Boolean) || null;
  if (!result) return;
  let lastSaved = "";
  const snapshot = () => {
    const form = document.querySelector(".tool-form");
    let inputs = "";
    if (form) {
      inputs = [...form.querySelectorAll("input, select")]
        .map((el) => {
          const label = el.id && form.querySelector(`label[for="${el.id}"]`);
          const name = ((label && label.textContent) || el.name || el.id || "").trim();
          return `${name}=${el.value}`;
        })
        .join(" ");
    }
    return {
      t: Date.now(),
      inputs: inputs.replace(/\s+/g, " ").trim().slice(0, 120),
      result: (result.innerText || result.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120),
    };
  };
  const renderHistory = () => {
    let section = document.getElementById("calc-history");
    let list;
    try {
      list = JSON.parse(localStorage.getItem(histKey(toolId))) || [];
    } catch {
      list = [];
    }
    if (!Array.isArray(list) || !list.length) {
      if (section) section.remove();
      return;
    }
    if (!section) {
      section = document.createElement("section");
      section.id = "calc-history";
      section.className = "calc-history";
      section.setAttribute("aria-label", "最近计算");
      const anchor =
        document.getElementById("copy-result-btn") || result;
      anchor.insertAdjacentElement("afterend", section);
    }
    section.innerHTML =
      "<h2>最近计算</h2><ul>" +
      list
        .map(
          (h) =>
            `<li><time>${new Date(h.t).toLocaleString("zh-CN", { hour12: false })}</time>${escapeHtml(h.inputs)} → <strong>${escapeHtml(h.result)}</strong></li>`,
        )
        .join("") +
      "</ul>";
  };
  const escapeHtml = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const observer = new MutationObserver(() => {
    const snap = snapshot();
    const key = snap.inputs + "|" + snap.result;
    if (!snap.result || key === lastSaved) return;
    lastSaved = key;
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(histKey(toolId))) || [];
    } catch {
      list = [];
    }
    list.unshift(snap);
    try {
      localStorage.setItem(histKey(toolId), JSON.stringify(list.slice(0, MAX_HISTORY)));
    } catch {
      /* 忽略 */
    }
    renderHistory();
  });
  observer.observe(result, { childList: true, characterData: true, subtree: true });
  renderHistory();
}

export function setupEngage() {
  const toolId = document.body.dataset.toolId;
  if (toolId) {
    setupToolPage(toolId);
  } else {
    // 首页：卡片 ★（工具页的 ★ 由服务端渲染）
    document
      .querySelectorAll("#tool-groups .tool-card")
      .forEach(addCardStar);
  }
  renderHomeSections();
  document.addEventListener("openaa-fav-change", renderHomeSections);
}
