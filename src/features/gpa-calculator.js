/* GPA 计算器（Pattern B 自包含模块）
 * 标准美国 4.0 制换算（已核实为最通用版本）：
 * A+ 4.0 / A 4.0 / A- 3.7 / B+ 3.3 / B 3.0 / B- 2.7 /
 * C+ 2.3 / C 2.0 / C- 1.7 / D+ 1.3 / D 1.0 / D- 0.7 / F 0
 * 百分制区间：97-100 A+，93-96 A，90-92 A-，87-89 B+，83-86 B，
 * 80-82 B-，77-79 C+，73-76 C，70-72 C-，67-69 D+，63-66 D，60-62 D-，<60 F
 */
(function initGpa() {
  const $ = (id) => document.getElementById(id);
  const rowsEl = $("gpa-rows");
  const resultEl = $("result");
  if (!rowsEl || !resultEl) return;

  const LETTERS = [
    "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F",
  ];
  const POINTS = {
    "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, "D-": 0.7, F: 0,
  };
  // 百分制 -> 绩点（下限区间）
  const PCT = [
    [97, 4.0, "A+"], [93, 4.0, "A"], [90, 3.7, "A-"], [87, 3.3, "B+"],
    [83, 3.0, "B"], [80, 2.7, "B-"], [77, 2.3, "C+"], [73, 2.0, "C"],
    [70, 1.7, "C-"], [67, 1.3, "D+"], [63, 1.0, "D"], [60, 0.7, "D-"],
    [0, 0, "F"],
  ];

  let mode = "percent";
  let rowSeq = 0;

  function gradeCell() {
    if (mode === "percent") {
      return `<input type="number" inputmode="decimal" min="0" max="100" step="any" placeholder="85" aria-label="百分制成绩" />`;
    }
    if (mode === "letter") {
      const opts = LETTERS.map((l) => `<option value="${l}">${l}</option>`).join("");
      return `<select aria-label="Letter 成绩"><option value="">—</option>${opts}</select>`;
    }
    return `<input type="number" inputmode="decimal" min="0" max="4" step="0.1" placeholder="3.0" aria-label="绩点" />`;
  }

  function addRow() {
    rowSeq += 1;
    const div = document.createElement("div");
    div.className = "gpa-row";
    div.innerHTML =
      `<div><label>课程名（可选）</label><input type="text" maxlength="40" placeholder="课程 ${rowSeq}" aria-label="课程名" /></div>` +
      `<div><label>学分</label><input type="number" inputmode="decimal" min="0" max="20" step="0.5" placeholder="3" aria-label="学分" data-credits /></div>` +
      `<div><label>成绩</label><span data-grade>${gradeCell()}</span></div>` +
      `<div><label>&nbsp;</label><button type="button" class="gpa-del" aria-label="删除这门课">×</button></div>`;
    div.querySelector(".gpa-del").addEventListener("click", () => {
      if (rowsEl.querySelectorAll(".gpa-row").length <= 1) {
        setResult("⚠️", "至少保留一门课程");
        return;
      }
      div.remove();
    });
    rowsEl.appendChild(div);
  }

  function setResult(strong, span) {
    const s = document.createElement("strong");
    const p = document.createElement("span");
    s.textContent = strong;
    p.textContent = span;
    resultEl.replaceChildren(s, p);
  }

  function pctToGpa(score) {
    for (const [min, gp, letter] of PCT) {
      if (score >= min) return { gp, letter };
    }
    return { gp: 0, letter: "F" };
  }

  function rowGrade(row) {
    const input = row.querySelector("[data-grade] input, [data-grade] select");
    if (!input || input.value === "") return null;
    if (mode === "percent") {
      const v = Number(input.value);
      if (!Number.isFinite(v) || v < 0 || v > 100) return undefined;
      return pctToGpa(v).gp;
    }
    if (mode === "letter") {
      return POINTS[input.value] ?? null;
    }
    const v = Number(input.value);
    if (!Number.isFinite(v) || v < 0 || v > 4.3) return undefined;
    return v;
  }

  function calculate() {
    const rows = Array.from(rowsEl.querySelectorAll(".gpa-row"));
    let totalPoints = 0;
    let totalCredits = 0;
    let counted = 0;
    for (const row of rows) {
      const cRaw = row.querySelector("[data-credits]").value;
      if (cRaw === "") continue;
      const credits = Number(cRaw);
      if (!Number.isFinite(credits) || credits <= 0 || credits > 20) {
        setResult("⚠️", "学分请输入 0–20 之间的有效数字");
        return;
      }
      const gp = rowGrade(row);
      if (gp === undefined) {
        setResult("⚠️", "成绩格式有误，请检查输入");
        return;
      }
      if (gp === null) continue; // 这门课没填成绩，跳过
      totalPoints += gp * credits;
      totalCredits += credits;
      counted += 1;
    }
    if (counted === 0 || totalCredits === 0) {
      setResult("⚠️", "请至少填写一门课的学分和成绩");
      return;
    }
    const gpa = totalPoints / totalCredits;
    setResult(
      gpa.toFixed(2),
      `共 ${counted} 门课 · 总学分 ${totalCredits} · 标准 4.0 制`,
    );
  }

  // 模式切换
  document.querySelectorAll(".gpa-mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".gpa-mode").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      mode = btn.dataset.mode;
      rowsEl.querySelectorAll("[data-grade]").forEach((cell) => {
        cell.innerHTML = gradeCell();
      });
    });
  });

  $("gpa-add").addEventListener("click", addRow);
  $("gpa-calc").addEventListener("click", calculate);

  // 百分制快速换算
  $("gpa-quick-btn").addEventListener("click", () => {
    const v = Number($("gpa-quick-score").value);
    const outEl = $("gpa-quick-out");
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      outEl.textContent = "请输入 0–100 的分数";
      return;
    }
    const { gp, letter } = pctToGpa(v);
    outEl.textContent = `${v} 分 → ${letter}（${gp.toFixed(1)}）`;
  });

  addRow();
  addRow();
  addRow();
})();
