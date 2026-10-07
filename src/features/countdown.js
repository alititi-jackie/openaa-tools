/* 倒计时：多个纪念日，localStorage 持久化（key: openaa_countdown_v1） */
(function initCountdown() {
  const $ = (id) => document.getElementById(id);
  const KEY = "openaa_countdown_v1";

  const nameInput = $("cd-name");
  const dateInput = $("cd-date");
  const addBtn = $("cd-add");
  const listEl = $("cd-list");
  const emptyEl = $("cd-empty");

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr)
        ? arr.filter(
            (it) =>
              it &&
              typeof it.name === "string" &&
              typeof it.date === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(it.date),
          )
        : [];
    } catch {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // 存储空间不足等：静默失败，页面本次仍可用
    }
  }

  function parseLocal(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function diffDays(target) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86400000);
  }

  function fmtMD(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return `${y}年${m}月${d}日`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function statusText(diff) {
    if (diff > 0) return { text: `还有 ${diff} 天`, cls: "" };
    if (diff === 0) return { text: "就是今天 🎉", cls: "today" };
    return { text: `已过去 ${-diff} 天`, cls: "past" };
  }

  function render() {
    const items = load().sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    emptyEl.style.display = items.length ? "none" : "";
    listEl.innerHTML = items
      .map((it) => {
        const diff = diffDays(parseLocal(it.date));
        const st = statusText(diff);
        return (
          `<li class="cd-item" data-date="${escapeHtml(it.date)}">` +
          `<div class="cd-main"><div class="cd-title">${escapeHtml(
            it.name,
          )}</div><div class="cd-date">${fmtMD(it.date)}</div></div>` +
          `<span class="cd-days ${st.cls}">${st.text}</span>` +
          `<button type="button" class="cd-del" data-del="${escapeHtml(
            it.date,
          )}|${escapeHtml(it.name)}">删除</button>` +
          `</li>`
        );
      })
      .join("");
  }

  function add() {
    const name = nameInput.value.trim();
    const date = dateInput.value;
    if (!name) {
      nameInput.focus();
      nameInput.placeholder = "请先输入名称，例如：妈妈生日";
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateInput.focus();
      return;
    }
    const items = load();
    items.push({ name: name.slice(0, 40), date });
    save(items);
    nameInput.value = "";
    nameInput.placeholder = "例如：妈妈生日、结婚纪念日";
    render();
  }

  // 删除：用事件委托，同一天同名多条时只删第一条
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    const [date, ...nameParts] = btn.dataset.del.split("|");
    const name = nameParts.join("|");
    const items = load();
    const idx = items.findIndex(
      (it) => it.date === date && it.name === name,
    );
    if (idx >= 0) {
      items.splice(idx, 1);
      save(items);
      render();
    }
  });

  addBtn.addEventListener("click", add);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  });
  dateInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  });

  render();
})();
