import lunarLib from "../lib/vendor/lunar.js";

const { Solar, Lunar, LunarYear } = lunarLib;

/* 公历农历双向转换：直接操作 DOM，无外部依赖（除自研紧凑 lunar.js，12KB，1900-2100） */
(function initLunarCalendar() {
  const $ = (id) => document.getElementById(id);

  /* ---------- 方向切换 ---------- */
  const tabs = Array.from(document.querySelectorAll("[data-lc-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-lc-panel]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((p) => {
        p.hidden = p.dataset.lcPanel !== tab.dataset.lcTab;
      });
    });
  });

  const CN_WEEK = ["日", "一", "二", "三", "四", "五", "六"];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- 公历 → 农历 ---------- */
  const solarInput = $("lc-solar-date");
  const solarResult = $("result");

  function renderSolar() {
    const v = solarInput.value;
    if (!v) {
      solarResult.innerHTML =
        "<strong>—</strong><span>选择公历日期后显示农历</span>";
      return;
    }
    try {
      const [y, m, d] = v.split("-").map(Number);
      const solar = Solar.fromYmd(y, m, d);
      const lunar = solar.getLunar();
      const jieqi = lunar.getJieQi();
      const tradFest = [...lunar.getFestivals(), ...lunar.getOtherFestivals()];
      const solarFest = [...solar.getFestivals(), ...solar.getOtherFestivals()];
      const week = solar.getWeekInChinese();

      let html = `<strong>农历${escapeHtml(
        lunar.getMonthInChinese() + "月" + lunar.getDayInChinese(),
      )}</strong>`;
      html += `<dl class="lc-kv">`;
      html += `<dt>公历</dt><dd>${y}年${m}月${d}日 星期${escapeHtml(
        week,
      )}</dd>`;
      html += `<dt>农历年份</dt><dd>${escapeHtml(
        lunar.getYearInGanZhi(),
      )}年 · ${escapeHtml(lunar.getYearShengXiao())}年</dd>`;
      html += `<dt>生肖</dt><dd>${escapeHtml(lunar.getYearShengXiao())}</dd>`;
      html += `<dt>干支纪年</dt><dd>${escapeHtml(
        lunar.getYearInGanZhi(),
      )}</dd>`;
      html += `</dl>`;
      let tags = "";
      if (jieqi)
        tags += `<span class="lc-jieqi">节气 · ${escapeHtml(jieqi)}</span>`;
      tradFest.forEach(
        (f) =>
          (tags += `<span class="lc-fest">传统节日 · ${escapeHtml(f)}</span>`),
      );
      solarFest.forEach(
        (f) => (tags += `<span class="lc-fest">${escapeHtml(f)}</span>`),
      );
      if (tags) html += `<div style="margin-top:8px">${tags}</div>`;
      solarResult.innerHTML = html;
    } catch {
      solarResult.innerHTML =
        "<strong>—</strong><span>日期无效，请重新选择</span>";
    }
  }

  solarInput.addEventListener("change", renderSolar);
  solarInput.addEventListener("input", renderSolar);

  /* ---------- 农历 → 公历 ---------- */
  const yearInput = $("lc-lunar-year");
  const monthSel = $("lc-lunar-month");
  const daySel = $("lc-lunar-day");
  const leapWrap = $("lc-leap-wrap");
  const leapBox = $("lc-lunar-leap");
  const lunarResult = $("lc-lunar-result");
  const runBtn = $("lc-lunar-run");

  // 日下拉：1–30
  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    daySel.appendChild(opt);
  }

  function validYear() {
    const y = Number(yearInput.value);
    return Number.isInteger(y) && y >= 1900 && y <= 2100 ? y : null;
  }

  // 该年该月是否有闰月 → 决定是否显示闰月勾选
  function refreshLeap() {
    const y = validYear();
    const m = Number(monthSel.value);
    let hasLeap = false;
    if (y !== null) {
      try {
        hasLeap = LunarYear.fromYear(y).getLeapMonth() === m;
      } catch {
        hasLeap = false;
      }
    }
    leapWrap.hidden = !hasLeap;
    if (!hasLeap) leapBox.checked = false;
  }

  function renderLunar() {
    const y = validYear();
    if (y === null) {
      lunarResult.innerHTML =
        "<strong>—</strong><span>请输入 1900–2100 之间的农历年份</span>";
      return;
    }
    const m = Number(monthSel.value);
    const d = Number(daySel.value);
    const leap = leapBox.checked && !leapWrap.hidden;
    try {
      const lunar = Lunar.fromYmd(y, leap ? -m : m, d);
      const solar = lunar.getSolar();
      const sy = solar.getYear();
      const sm = solar.getMonth();
      const sd = solar.getDay();
      const date = new Date(sy, sm - 1, sd);
      const week = CN_WEEK[date.getDay()];
      lunarResult.innerHTML =
        `<strong>公历${sy}年${sm}月${sd}日</strong>` +
        `<dl class="lc-kv">` +
        `<dt>星期</dt><dd>星期${week}</dd>` +
        `<dt>农历</dt><dd>${escapeHtml(
          lunar.getYearInGanZhi(),
        )}年${escapeHtml(lunar.getMonthInChinese())}月${escapeHtml(
          lunar.getDayInChinese(),
        )}</dd>` +
        `<dt>生肖</dt><dd>${escapeHtml(lunar.getYearShengXiao())}</dd>` +
        `</dl>`;
    } catch {
      lunarResult.innerHTML =
        "<strong>—</strong><span>该农历月没有这一天，请检查日期</span>";
    }
  }

  yearInput.addEventListener("input", () => {
    refreshLeap();
    renderLunar();
  });
  monthSel.addEventListener("change", () => {
    refreshLeap();
    renderLunar();
  });
  daySel.addEventListener("change", renderLunar);
  leapBox.addEventListener("change", renderLunar);
  runBtn.addEventListener("click", renderLunar);

  /* ---------- 初始化 ---------- */
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  solarInput.value = `${today.getFullYear()}-${pad(
    today.getMonth() + 1,
  )}-${pad(today.getDate())}`;
  renderSolar();
  refreshLeap();
  renderLunar();
})();
