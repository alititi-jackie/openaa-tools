/* 美国联邦假期日历：2026/2027 数据硬编码（已按 OPM 核实），直接操作 DOM */
(function initUsHolidays() {
  const $ = (id) => document.getElementById(id);

  // 数据来源：OPM Federal Holidays（见 NOTES.md）。obs = 逢周末时的顺延放假日。
  const DATA = {
    2026: [
      { cn: "元旦", en: "New Year's Day", date: "2026-01-01" },
      {
        cn: "马丁·路德·金纪念日",
        en: "Birthday of Martin Luther King, Jr.",
        date: "2026-01-19",
      },
      {
        cn: "总统日（华盛顿诞辰）",
        en: "Washington's Birthday (Presidents' Day)",
        date: "2026-02-16",
      },
      { cn: "阵亡将士纪念日", en: "Memorial Day", date: "2026-05-25" },
      {
        cn: "六月节（黑奴解放日）",
        en: "Juneteenth National Independence Day",
        date: "2026-06-19",
      },
      {
        cn: "独立日（国庆日）",
        en: "Independence Day",
        date: "2026-07-04",
        obs: "2026-07-03",
      },
      { cn: "劳动节", en: "Labor Day", date: "2026-09-07" },
      { cn: "哥伦布日", en: "Columbus Day", date: "2026-10-12" },
      { cn: "退伍军人节", en: "Veterans Day", date: "2026-11-11" },
      { cn: "感恩节", en: "Thanksgiving Day", date: "2026-11-26" },
      { cn: "圣诞节", en: "Christmas Day", date: "2026-12-25" },
    ],
    2027: [
      { cn: "元旦", en: "New Year's Day", date: "2027-01-01" },
      {
        cn: "马丁·路德·金纪念日",
        en: "Birthday of Martin Luther King, Jr.",
        date: "2027-01-18",
      },
      {
        cn: "总统日（华盛顿诞辰）",
        en: "Washington's Birthday (Presidents' Day)",
        date: "2027-02-15",
      },
      { cn: "阵亡将士纪念日", en: "Memorial Day", date: "2027-05-31" },
      {
        cn: "六月节（黑奴解放日）",
        en: "Juneteenth National Independence Day",
        date: "2027-06-19",
        obs: "2027-06-18",
      },
      {
        cn: "独立日（国庆日）",
        en: "Independence Day",
        date: "2027-07-04",
        obs: "2027-07-05",
      },
      { cn: "劳动节", en: "Labor Day", date: "2027-09-06" },
      { cn: "哥伦布日", en: "Columbus Day", date: "2027-10-11" },
      { cn: "退伍军人节", en: "Veterans Day", date: "2027-11-11" },
      { cn: "感恩节", en: "Thanksgiving Day", date: "2027-11-25" },
      {
        cn: "圣诞节",
        en: "Christmas Day",
        date: "2027-12-25",
        obs: "2027-12-24",
      },
    ],
  };

  const WEEKS = ["日", "一", "二", "三", "四", "五", "六"];

  function parseLocal(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function fmtMD(ymd) {
    const [, m, d] = ymd.split("-").map(Number);
    return `${m}月${d}日`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function todayLocal() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  const listEl = $("hol-list");
  const nextEl = $("result");
  let year = 2026;

  function render() {
    const today = todayLocal();
    const items = DATA[year];
    let next = null;

    listEl.innerHTML = items
      .map((h) => {
        const offDate = parseLocal(h.obs || h.date);
        const past = offDate < today;
        const diffDays = Math.round((offDate - today) / 86400000);
        if (!past && !next) next = { h, diffDays };
        const week = WEEKS[parseLocal(h.date).getDay()];
        const obsHtml = h.obs
          ? `<span class="hol-obs">逢周${week}，顺延至 ${fmtMD(
              h.obs,
            )}（周${WEEKS[parseLocal(h.obs).getDay()]}）放假</span>`
          : "";
        return (
          `<li class="hol-item${past ? " hol-past" : ""}">` +
          `<span class="hol-date">${fmtMD(h.date)}</span>` +
          `<span class="hol-name"><span class="cn">${escapeHtml(
            h.cn,
          )}</span><span class="en">${escapeHtml(h.en)}</span>${obsHtml}</span>` +
          `<span class="hol-week">周${week}</span>` +
          `</li>`
        );
      })
      .join("");

    if (next) {
      const label =
        next.diffDays === 0
          ? `就是今天 🎉`
          : `还有 ${next.diffDays} 天`;
      nextEl.textContent = `下一个联邦假日：${next.h.cn}（${fmtMD(
        next.h.obs || next.h.date,
      )}），${label}`;
    } else {
      nextEl.textContent = `${year} 年的联邦假日已过完，看看 ${year + 1} 年吧`;
    }
  }

  document.querySelectorAll("[data-hol-year]").forEach((tab) => {
    tab.addEventListener("click", () => {
      year = Number(tab.dataset.holYear);
      document.querySelectorAll("[data-hol-year]").forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      render();
    });
  });

  render();
})();
