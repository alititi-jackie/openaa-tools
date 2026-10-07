/* 衣服尺码对照（Pattern B 自包含模块）
 * Tab 切换 + 尺码反查高亮。表格数据为静态 HTML，全部逻辑在本地。
 */
(function initClothingSize() {
  const tabs = Array.from(document.querySelectorAll(".size-tab"));
  const panels = Array.from(document.querySelectorAll(".size-panel"));
  const sel = document.getElementById("size-lookup-sel");
  const clearBtn = document.getElementById("size-lookup-clear");
  if (!tabs.length || !panels.length || !sel) return;

  // 每个 tab 的反查选项：[value, 显示文字]
  const OPTIONS = {
    tops: [
      ["", "选你的美国上装尺码…"],
      ["XXS", "美国 XXS"],
      ["XS", "美国 XS"],
      ["S", "美国 S"],
      ["M", "美国 M"],
      ["L", "美国 L"],
      ["XL", "美国 XL"],
    ],
    bottoms: [
      ["", "选你的裤装尺码…"],
      ["28", "男款美码 28″"],
      ["30", "男款美码 30″"],
      ["32", "男款美码 32″"],
      ["34", "男款美码 34″"],
      ["36", "男款美码 36″"],
      ["38", "男款美码 38″"],
      ["0", "女款美码 0"],
      ["2", "女款美码 2–4"],
      ["4", "女款美码 4–6"],
      ["8", "女款美码 8"],
      ["10", "女款美码 10"],
      ["12", "女款美码 12"],
      ["14", "女款美码 14"],
    ],
    kids: [
      ["", "选孩子的美国童装码…"],
      ["2T", "2T"],
      ["4T", "4T"],
      ["6", "6（XS）"],
      ["8", "8（S）"],
      ["10", "10（M）"],
      ["12", "12（L）"],
      ["14", "14（XL）"],
    ],
  };
  function fillOptions(tab) {
    sel.replaceChildren();
    for (const [v, label] of OPTIONS[tab]) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      sel.appendChild(o);
    }
  }

  function highlight() {
    const v = sel.value;
    document.querySelectorAll(".size-table tbody tr").forEach((tr) => {
      tr.classList.toggle("is-hit", v !== "" && tr.dataset.us === v);
    });
    if (v !== "") {
      const hit = document.querySelector(
        `.size-panel:not([hidden]) tr.is-hit`,
      );
      hit?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function switchTab(tab) {
    tabs.forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.panel !== tab;
    });
    fillOptions(tab);
    highlight();
  }

  tabs.forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)),
  );
  sel.addEventListener("change", highlight);
  clearBtn.addEventListener("click", () => {
    sel.value = "";
    highlight();
  });

  fillOptions("tops");
})();
