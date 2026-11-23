import { makeWorkbook, sheetStyle, currencyCell } from "../lib/workbook.js";
import {
  openDialog as openActionSheet,
  closeDialog as closeActionSheets,
} from "../lib/dialog.js";
import { localDate, readRecords, writeRecords } from "../lib/records.js";
import {
  showFeedback as showToast,
  copyText,
  showCopyResult,
} from "../lib/feedback.js";
import { shareFileOrDownload } from "../lib/share-file.js";
import {
  FX_FIELDS,
  calculateFxTarget,
  fxRoundingDifference,
  roundFx,
} from "../lib/fx-calculator.js";
import {
  readBackupFile,
  mergeRows,
  saveImportedRecords,
  serializeBackup,
  clearRecords,
} from "../lib/backup.js";
/* 美元人民币汇率记录工具：本地保存 + 导出分享 */
(function initFxApp() {
  const KEY = "openaa_usd_rmb_records_v1";
  const $ = (id) => document.getElementById(id);
  const fxInputs = { usd: "fxUsd", rate: "fxRate", cny: "fxCny" };
  const fxLabels = { usd: "美金金额", rate: "汇率", cny: "人民币金额" };
  let calculationTarget = "cny";
  let lastManualField = "rate";
  const touchedFields = new Set();
  const views = () => Array.from(document.querySelectorAll("#fxApp .fx-view"));
  const money = (n, prefix = "") =>
    prefix +
    (Number(n) || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fixedRate = (n) =>
    (Number(n) || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  const num = (v) => Number.parseFloat(v) || 0;
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const today = () => localDate();
  function load() {
    return readRecords(KEY).map(row => {
      const subtract = recordType(row) === "subtract";
      return { ...row, usd: subtract ? -Math.abs(row.usd) : row.usd,
        ...(subtract && row.cny != null ? { cny: -Math.abs(row.cny) } : {}) };
    });
  }
  function save(rows) {
    writeRecords(KEY, rows);
  }
  function calcCny(row) {
    if (row.cny !== undefined && row.cny !== null && row.cny !== "") {
      const saved = Number(row.cny);
      if (Number.isFinite(saved)) return roundFx(saved, 2);
    }
    return +(num(row.usd) * num(row.rate)).toFixed(2);
  }
  function sorted() {
    return load().sort(
      (a, b) =>
        String(b.date).localeCompare(String(a.date)) ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
  }
  function latestMonth(rows) {
    const months = Array.from(
      new Set(
        (rows || sorted())
          .map((r) => String(r.date || "").slice(0, 7))
          .filter(Boolean),
      ),
    )
      .sort()
      .reverse();
    return months[0] || "";
  }
  function summarize(rows) {
    const addRows = rows.filter((r) => num(r.usd) >= 0);
    const subtractRows = rows.filter((r) => num(r.usd) < 0);
    const addUsd = addRows.reduce((s, r) => s + Math.abs(num(r.usd)), 0);
    const subtractUsd = subtractRows.reduce(
      (s, r) => s + Math.abs(num(r.usd)),
      0,
    );
    const netUsd = roundFx(addUsd - subtractUsd, 2);
    const addCny = addRows.reduce((s, r) => s + Math.abs(calcCny(r)), 0);
    const subtractCny = subtractRows.reduce(
      (s, r) => s + Math.abs(calcCny(r)),
      0,
    );
    const netCny = roundFx(addCny - subtractCny, 2);
    const totalAbsUsd = addUsd + subtractUsd;
    const totalAbsCny = addCny + subtractCny;
    const rateAvg = totalAbsUsd > 0 ? totalAbsCny / totalAbsUsd : 0;
    const months = new Set(
      rows.map((r) => String(r.date || "").slice(0, 7)).filter(Boolean),
    );
    const monthCount = months.size;
    const monthAvgUsd = monthCount ? netUsd / monthCount : 0;
    const monthAvgCny = monthCount ? netCny / monthCount : 0;
    return {
      count: rows.length,
      addUsd,
      subtractUsd,
      netUsd,
      addCny,
      subtractCny,
      netCny,
      usd: netUsd,
      cny: netCny,
      rateAvg,
      monthCount,
      monthAvgUsd,
      monthAvgCny,
    };
  }
  function signedMoneyText(n, prefix = "") {
    const value = Number(n) || 0;
    const sign = value < 0 ? "-" : "";
    return (
      sign +
      prefix +
      Math.abs(value).toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  function hasSubtractSummary(s) {
    return (
      Math.abs(Number(s.subtractUsd) || 0) > 0 ||
      Math.abs(Number(s.subtractCny) || 0) > 0
    );
  }
  const netClass = n => n < 0 ? "fx-negative" : n > 0 ? "fx-positive" : "fx-zero";
  function summaryHtml(s, includeMonthlyAverage = true) {
    const hasSubtract = hasSubtractSummary(s);
    const items = [];
    if (hasSubtract) {
      items.push(
        ["新增美金总金额", money(s.addUsd, "$"), ""],
        [
          "减去美金总金额",
          signedMoneyText(-Math.abs(s.subtractUsd || 0), "$"),
          "fx-negative",
        ],
      );
    }
    items.push(
      [
        "美金净金额",
        signedMoneyText(s.netUsd, "$"),
        netClass(s.netUsd),
      ],
      ["平均汇率", fixedRate(s.rateAvg), ""],
    );
    if (hasSubtract) {
      items.push(
        ["新增人民币总金额", money(s.addCny, "¥"), ""],
        [
          "减去人民币总金额",
          signedMoneyText(-Math.abs(s.subtractCny || 0), "¥"),
          "fx-negative",
        ],
      );
    }
    items.push(
      [
        "人民币净金额",
        signedMoneyText(s.netCny, "¥"),
        netClass(s.netCny),
      ],
      ["记录行数", s.count + " 行", ""],
    );
    if (includeMonthlyAverage) {
      items.push(
        ["有记录月份", (s.monthCount || 0) + " 个月", ""],
        [
          "每月平均美金",
          signedMoneyText(s.monthAvgUsd, "$"),
          s.monthAvgUsd < 0 ? "fx-negative" : "",
        ],
        [
          "每月平均人民币",
          signedMoneyText(s.monthAvgCny, "¥"),
          s.monthAvgCny < 0 ? "fx-negative" : "",
        ],
      );
    }
    return items
      .map(
        (x) =>
          '<div class="fx-stat"><span>' +
          x[0] +
          '</span><strong class="' +
          (x[2] || "") +
          '">' +
          x[1] +
          "</strong></div>",
      )
      .join("");
  }
  function empty(text) {
    return '<div class="fx-empty">' + text + "</div>";
  }
  function recordType(row) {
    return num(row.usd) < 0 || row.type === "subtract" ? "subtract" : "add";
  }
  function recordTypeLabel(row) {
    return recordType(row) === "subtract" ? "减去" : "新增";
  }
  function recordHtml(r) {
    const type = recordType(r);
    const isSub = type === "subtract";
    const badge =
      '<span class="fx-type-badge ' +
      (isSub ? "subtract" : "") +
      '">' +
      recordTypeLabel(r) +
      "</span>";
    const amountClass = isSub ? " fx-negative" : "";
    return (
      '<div class="fx-record"><div class="fx-record-top"><div class="fx-record-date">' +
      escapeHtml(r.date) +
      badge +
      '</div><div class="fx-record-money' +
      amountClass +
      '">' +
      signedMoneyText(calcCny(r), "¥") +
      '</div></div><div class="fx-record-meta">美金：<span class="' +
      (isSub ? "fx-negative" : "") +
      '">' +
      signedMoneyText(num(r.usd), "$") +
      "</span> ｜ 汇率：" +
      fixedRate(r.rate) +
      (r.note ? " ｜ " + escapeHtml(r.note) : "") +
      '</div><div class="fx-record-actions"><button class="fx-chip-btn" type="button" data-edit="' +
      escapeHtml(r.id) +
      '">编辑</button><button class="fx-chip-btn" type="button" data-delete="' +
      escapeHtml(r.id) +
      '">删除</button></div></div>'
    );
  }
  function renderList(containerId, rows, emptyText) {
    const box = $(containerId);
    if (!box) return;
    box.innerHTML = rows.length
      ? rows.map(recordHtml).join("")
      : empty(emptyText);
  }
  function updateCopyPeriod(rows) {
    const picker = $("copyPeriod");
    const months = [...new Set([today().slice(0, 7), ...rows.map(r => r.date.slice(0, 7))])].sort().reverse();
    const selected = picker.value || "all";
    picker.replaceChildren(new Option("全部记录", "all"), ...months.map(m => new Option(m.replace("-", "年") + "月", m)));
    picker.value = months.includes(selected) || selected === "all" ? selected : "all";
    const all = picker.value === "all";
    const label = all ? "全部" : picker.value.replace("-", "年") + "月";
    const hasRows = rows.some(r => all || r.date.startsWith(picker.value));
    const button = $("copySummaryBtn");
    button.disabled = !hasRows;
    button.textContent = hasRows ? "📋 复制" + label + "汇总" : all ? "暂无记录" : label + "暂无记录";
  }
  $("copyPeriod").addEventListener("change", () => updateCopyPeriod(sorted()));
  $("backupBeforeClear").addEventListener("click", () => $("downloadBackupBtn").click());
  function render() {
    const rows = sorted();
    updateCopyPeriod(rows);
    const allS = summarize(rows);
    if ($("homeSummary")) $("homeSummary").innerHTML = summaryHtml(allS);
    if ($("allSummary")) $("allSummary").innerHTML = summaryHtml(allS);
    renderList("allList", rows, "暂无记录，请先输入一条数据。");

    let m = $("monthPicker")?.value || "";
    if (!m) {
      m = latestMonth(rows);
      if ($("monthPicker")) $("monthPicker").value = m;
    }
    const monthRows = m
      ? rows.filter((r) => String(r.date).slice(0, 7) === m)
      : [];
    if ($("monthSummary"))
      $("monthSummary").innerHTML = summaryHtml(summarize(monthRows), false);
    renderList("monthList", monthRows, m ? "这个月份暂无数据。" : "暂无记录。");

    const y = String($("yearPicker")?.value || "").trim();
    const yearRows = y
      ? rows.filter((r) => String(r.date).slice(0, 4) === y)
      : rows;
    if ($("yearSummary"))
      $("yearSummary").innerHTML = summaryHtml(summarize(yearRows));
    renderList("yearList", yearRows, y ? "这个年份暂无数据。" : "暂无记录。");
  }
  function goto(name) {
    views().forEach((v) =>
      v.classList.toggle("active", v.dataset.view === name),
    );
    const sectionTitleRow = $("fxSectionTitleRow");
    if (sectionTitleRow) sectionTitleRow.hidden = name !== "home";
    if (name === "input" && !$("editId").value) {
      $("fxDate").value = $("fxDate").value || today();
    }
    if (name === "month" && $("monthPicker") && !$("monthPicker").value) {
      $("monthPicker").value = latestMonth(sorted());
    }
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setRecordType(type) {
    const value = type === "subtract" ? "subtract" : "add";
    const input = $("fxType");
    if (input) input.value = value;
    document.querySelectorAll(".fx-type-btn").forEach((btn) => {
      const active = btn.dataset.typeValue === value;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    updateCalculationState();
  }
  function resetForm() {
    $("editId").value = "";
    document.querySelector("#fxApp .fx-type-toggle").hidden = false;
    $("inputTitle").textContent = "输入记录";
    $("fxDate").value = today();
    $("fxUsd").value = "";
    $("fxRate").value = "";
    $("fxCny").value = "";
    $("fxNote").value = "";
    calculationTarget = "cny";
    lastManualField = "rate";
    touchedFields.clear();
    setRecordType("add");
  }
  function currentFxValues() {
    return Object.fromEntries(
      FX_FIELDS.map((field) => [field, $(fxInputs[field]).value]),
    );
  }
  function updateCalculationState() {
    const values = currentFxValues();
    document.querySelectorAll("[data-calc-target]").forEach((button) => {
      const active = button.dataset.calcTarget === calculationTarget;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-calc-field]").forEach((field) => {
      field.classList.toggle(
        "is-calculated",
        field.dataset.calcField === calculationTarget,
      );
    });
    const hint = $("fxCalcHint");
    if (hint)
      hint.textContent =
        FX_FIELDS.filter((field) => values[field] !== "").length < 2
          ? "任意输入两项，自动计算第三项。"
          : "当前自动计算：" + fxLabels[calculationTarget] + "（也可直接修改）";
    const roundingNote = $("fxRoundingNote");
    if (roundingNote) {
      const difference =
        calculationTarget === "cny" ? 0 : fxRoundingDifference(values);
      roundingNote.hidden = difference < 0.01;
      roundingNote.textContent = roundingNote.hidden
        ? ""
        : `汇率按三位小数显示，换算差额 ¥${difference.toFixed(2)}；你输入的人民币金额会原样保存。`;
    }
    updateInputWarnings();
  }
  function calculateSelectedField() {
    const result = calculateFxTarget(calculationTarget, currentFxValues());
    if (result !== null) $(fxInputs[calculationTarget]).value = result;
    updateCalculationState();
  }
  function onFxInput(field) {
    touchedFields.add(field);
    const values = currentFxValues();
    const filled = FX_FIELDS.filter((id) => values[id] !== "");
    if (values[field] === "") {
      // Keep a field blank while it is being cleared or replaced.
      calculationTarget = field;
    } else if (filled.length === 2) {
      calculationTarget = FX_FIELDS.find((id) => values[id] === "");
      calculateSelectedField();
    } else if (filled.length === 3) {
      if (field === calculationTarget) {
        // A user changed the computed value: keep the earlier manual input,
        // and recalculate the other previously entered value instead.
        calculationTarget =
          lastManualField !== field
            ? lastManualField
            : { usd: "cny", rate: "cny", cny: "rate" }[field];
      }
      calculateSelectedField();
    }
    lastManualField = field;
    updateCalculationState();
  }
  function normalizeTouchedInput(field) {
    if (!touchedFields.has(field)) return;
    const input = $(fxInputs[field]);
    if (!input.value || !Number.isFinite(Number(input.value))) return;
    const decimals = field === "rate" ? 3 : 2;
    const rounded = roundFx(Number(input.value), decimals);
    if (!Number.isFinite(rounded) || rounded < 0) return;
    const formatted = rounded.toFixed(decimals);
    if (input.value !== formatted) {
      input.value = formatted;
      if (calculationTarget !== field) calculateSelectedField();
    }
    updateCalculationState();
  }
  function getInputWarnings() {
    const warnings = [];
    const usdRaw = String($("fxUsd")?.value || "").trim();
    const rateRaw = String($("fxRate")?.value || "").trim();
    const usd = Number.parseFloat(usdRaw);
    const rate = Number.parseFloat(rateRaw);
    if (
      usdRaw &&
      Number.isFinite(usd) &&
      (usd < 20 || usd > 100000 || usd < 0)
    ) {
      warnings.push("美金金额看起来可能有误，请确认是否输入正确。");
    }
    if (
      rateRaw &&
      Number.isFinite(rate) &&
      (rate < 5 || rate > 10 || rate <= 0)
    ) {
      warnings.push("汇率看起来可能有误，请确认是否输入正确。");
    }
    return warnings;
  }
  function updateInputWarnings() {
    const usdRaw = String($("fxUsd")?.value || "").trim();
    const rateRaw = String($("fxRate")?.value || "").trim();
    const usd = Number.parseFloat(usdRaw);
    const rate = Number.parseFloat(rateRaw);
    const usdWarning = $("fxUsdWarning");
    const rateWarning = $("fxRateWarning");
    if (usdWarning)
      usdWarning.classList.toggle(
        "show",
        !!usdRaw &&
          Number.isFinite(usd) &&
          (usd < 20 || usd > 100000 || usd < 0),
      );
    if (rateWarning)
      rateWarning.classList.toggle(
        "show",
        !!rateRaw &&
          Number.isFinite(rate) &&
          (rate < 5 || rate > 10 || rate <= 0),
      );
  }
  function confirmInputWarnings() {
    const warnings = getInputWarnings();
    if (!warnings.length) return true;
    return confirm(
      "输入数据看起来可能有误。\n\n" +
        warnings.map((w) => "• " + w).join("\n") +
        "\n\n点击“取消”返回修改，点击“确定”仍然保存。",
    );
  }
  function editRecord(id) {
    const r = load().find((x) => x.id === id);
    if (!r) return;
    $("editId").value = r.id;
    document.querySelector("#fxApp .fx-type-toggle").hidden = true;
    $("inputTitle").textContent = "编辑记录";
    $("fxDate").value = r.date;
    $("fxUsd").value = Math.abs(num(r.usd));
    $("fxRate").value = r.rate;
    $("fxCny").value = Math.abs(calcCny(r)).toFixed(2);
    $("fxNote").value = r.note || "";
    calculationTarget = "cny";
    lastManualField = "rate";
    touchedFields.clear();
    setRecordType(recordType(r));
    goto("input");
  }
  function deleteRecord(id) {
    const r = load().find(item => item.id === id);
    if (!r || !confirm("删除 " + r.date + " 的" + recordTypeLabel(r) + " " + signedMoneyText(r.usd, "$") + " / " + signedMoneyText(calcCny(r), "¥") + "？")) return;
    save(load().filter((r) => r.id !== id));
    render();
    showToast("已删除");
  }
  function exportRows() {
    const rows = sorted();
    const months = groupSummary(rows, 7);
    const years = groupSummary(rows, 4);
    return { rows, months, years };
  }
  function groupSummary(rows, len) {
    const map = {};
    rows.forEach((r) => {
      const k = String(r.date).slice(0, len);
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    return Object.keys(map)
      .sort()
      .reverse()
      .map((k) => ({ period: k, ...summarize(map[k]) }));
  }
  function monthLabel(period) {
    const parts = String(period || "").split("-");
    const y = parts[0] || "";
    const m = Number(parts[1] || 0);
    return y && m ? y + "年" + m + "月" : String(period || "");
  }
  function headerRow(labels) {
    return labels.map((v) => ({ v, s: 1 }));
  }
  function blankRow() {
    return ["", "", "", "", "", "", "", "", ""];
  }
  function summaryRows(title, summary, includeMonthlyAverage) {
    const rows = [[{ v: title, s: sheetStyle.bold }]];
    const item = (label, value) => rows.push([{ v: label, s: sheetStyle.total }, value]);
    function amounts(currency, unit, added, subtracted, net) {
      if (hasSubtractSummary(summary)) {
        item("新增" + unit + "总金额", currencyCell(added, currency, "Neutral", true));
        item("减去" + unit + "总金额", currencyCell(-subtracted, currency, "Negative", true));
      }
      item(unit + "净金额", currencyCell(net, currency, "Net", true));
    }
    amounts("usd", "美金", summary.addUsd, summary.subtractUsd, summary.netUsd);
    item("平均汇率", { v: summary.rateAvg, s: sheetStyle.rate });
    amounts("cny", "人民币", summary.addCny, summary.subtractCny, summary.netCny);
    item("记录行数", summary.count);
    if (includeMonthlyAverage) {
      item("有记录月份", summary.monthCount);
      item("每月平均美金", currencyCell(summary.monthAvgUsd, "usd"));
      item("每月平均人民币", currencyCell(summary.monthAvgCny, "cny"));
    }
    return rows;
  }
  function recordRow(r) {
    const tone = recordType(r) === "subtract" ? "Negative" : "Neutral";
    return [recordTypeLabel(r), r.date, currencyCell(r.usd, "usd", tone),
      { v: Number(r.rate), s: sheetStyle.rate }, currencyCell(calcCny(r), "cny", tone), r.note || ""];
  }
  function buildAllSheetRows(rows) {
    const out = [headerRow(["类型", "日期", "美金", "汇率", "人民币", "备注"])];
    rows.forEach((r) => out.push(recordRow(r)));
    out.push(blankRow());
    out.push(...summaryRows("总汇总", summarize(rows), true));
    return out;
  }
  function buildMonthSheetRows(rows) {
    const groups = {};
    rows.forEach((r) => {
      const key = String(r.date).slice(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    const months = Object.keys(groups).sort().reverse();
    const out = [];
    months.forEach((month, idx) => {
      if (idx > 0) out.push(blankRow());
      out.push([{ v: monthLabel(month), s: sheetStyle.bold }, "", "", "", ""]);
      out.push(headerRow(["类型", "日期", "美金", "汇率", "人民币", "备注"]));
      groups[month]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .forEach((r) => out.push(recordRow(r)));
      out.push(blankRow());
      out.push(
        ...summaryRows(
          monthLabel(month) + "汇总",
          summarize(groups[month]),
          false,
        ),
      );
    });
    if (!out.length) out.push([{ v: "暂无记录", s: sheetStyle.bold }, "", "", "", ""]);
    return out;
  }
  function buildYearSheetRows(rows) {
    const months = groupSummary(rows, 7);
    const hasSubtract = hasSubtractSummary(summarize(rows));
    const headers = hasSubtract
      ? [
          "月份",
          "新增美金总金额",
          "减去美金总金额",
          "美金净金额",
          "平均汇率",
          "新增人民币总金额",
          "减去人民币总金额",
          "人民币净金额",
          "记录行数",
        ]
      : ["月份", "美金净金额", "平均汇率", "人民币净金额", "记录行数"];
    const out = [headerRow(headers)];
    months.forEach((r) => {
      const netUsd = currencyCell(r.netUsd, "usd", "Net");
      const netCny = currencyCell(r.netCny, "cny", "Net");
      const rate = { v: r.rateAvg, s: sheetStyle.rate };
      out.push(hasSubtract ? [monthLabel(r.period), currencyCell(r.addUsd, "usd"),
        currencyCell(-r.subtractUsd, "usd", "Negative"), netUsd, rate, currencyCell(r.addCny, "cny"),
        currencyCell(-r.subtractCny, "cny", "Negative"), netCny, r.count]
        : [monthLabel(r.period), netUsd, rate, netCny, r.count]);
    });
    out.push(blankRow());
    out.push(...summaryRows("年度总汇总", summarize(rows), true));
    return out;
  }
  function makeXlsxBlob() {
    const rows = sorted();
    return makeWorkbook([
      ["全部记录", buildAllSheetRows(rows)],
      ["月度记录", buildMonthSheetRows(rows)],
      ["年度记录", buildYearSheetRows(rows)],
    ]);
  }
  function makeCsvBlob() {
    const rows = sorted();
    const csv = ["日期,美金,汇率,人民币,备注"]
      .concat(
        rows.map((r) =>
          [
            r.date,
            num(r.usd).toFixed(2),
            fixedRate(r.rate),
            calcCny(r).toFixed(2),
            '"' + String(r.note || "").replace(/"/g, '""') + '"',
          ].join(","),
        ),
      )
      .join("\n");
    return new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  }
  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
  async function shareBlob(blob, name, title) {
    await shareFileOrDownload(blob, name, title, downloadBlob);
  }
  function filename(ext) {
    return "美元换人民币记录本_" + today().replaceAll("-", "") + ext;
  }

  function backupFilename() {
    return "汇率数据备份_" + today().replaceAll("-", "") + ".json";
  }
  function makeBackupBlob() {
    return new Blob([serializeBackup(load(), "fx")], {
      type: "application/json;charset=utf-8",
    });
  }
  async function importBackupFile(file) {
    try {
      const incoming = await readBackupFile(file, "fx");
      if (!incoming.length) {
        alert("备份中没有可导入的换汇记录。");
        return;
      }
      const current = load();
      if (current.length) {
        const choice = prompt(
          "检测到当前浏览器已有 " +
            current.length +
            " 条记录，可导入 " +
            incoming.length +
            " 条记录。\n\n请输入导入方式：\n1 = 覆盖当前数据\n2 = 合并数据\n0 = 取消",
        );
        if (choice === "1") {
          saveImportedRecords(KEY, incoming);
          showToast("已覆盖导入");
        } else if (choice === "2") {
          saveImportedRecords(KEY, mergeRows(current, incoming));
          showToast("已合并导入");
        } else {
          showToast("已取消导入");
          return;
        }
      } else {
        if (!confirm(`可导入 ${incoming.length} 笔换汇记录，确认导入吗？`)) return;
        saveImportedRecords(KEY, incoming);
        showToast("导入成功");
      }
      render();
      goto("home");
    } catch (err) {
      alert(
        "导入失败：" +
          (err instanceof Error ? err.message : "请检查备份文件。"),
      );
    }
  }

  async function shareBackupFile() {
    await shareBlob(makeBackupBlob(), backupFilename(), "汇率数据备份");
  }

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-goto]");
    if (go) {
      if (go.dataset.goto === "input") resetForm();
      goto(go.dataset.goto);
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) editRecord(edit.dataset.edit);
    const del = e.target.closest("[data-delete]");
    if (del) deleteRecord(del.dataset.delete);
  });
  FX_FIELDS.forEach((field) => {
    $(fxInputs[field])?.addEventListener("input", () => onFxInput(field));
    $(fxInputs[field])?.addEventListener("blur", () =>
      normalizeTouchedInput(field),
    );
  });
  document.querySelectorAll("[data-calc-target]").forEach((button) =>
    button.addEventListener("click", () => {
      calculationTarget = button.dataset.calcTarget;
      calculateSelectedField();
    }),
  );
  document
    .querySelectorAll(".fx-type-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => setRecordType(btn.dataset.typeValue)),
    );
  $("fxForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    FX_FIELDS.forEach(normalizeTouchedInput);
    const usdValue = Number($("fxUsd").value);
    const rateValue = Number($("fxRate").value);
    const cnyValue = Number($("fxCny").value);
    if (
      ![usdValue, rateValue, cnyValue].every(Number.isFinite) ||
      usdValue < 0 ||
      rateValue <= 0 ||
      cnyValue < 0 ||
      (usdValue === 0 && cnyValue !== 0)
    ) {
      alert("请输入有效金额和大于零的汇率，不能用零美金反算非零人民币。");
      return;
    }
    updateInputWarnings();
    if (!confirmInputWarnings()) return;
    const rows = load();
    const id =
      $("editId").value ||
      "r_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    const type = $("fxType")?.value === "subtract" ? "subtract" : "add";
    const sign = type === "subtract" ? -1 : 1;
    const signedUsd = usdValue * sign;
    const row = {
      id,
      type,
      date: $("fxDate").value,
      usd: signedUsd,
      rate: rateValue,
      cny: roundFx(cnyValue * sign, 2),
      note: $("fxNote").value.trim(),
      createdAt: new Date().toISOString(),
    };
    const idx = rows.findIndex((r) => r.id === id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...row, createdAt: rows[idx].createdAt ?? "" };
    else rows.push(row);
    save(rows);
    resetForm();
    goto("saved");
    showToast("保存成功");
  });
  $("continueAddBtn")?.addEventListener("click", () => {
    resetForm();
    goto("input");
  });
  $("monthPicker")?.addEventListener("change", render);
  $("yearPicker")?.addEventListener("input", render);
  $("clearYearBtn")?.addEventListener("click", () => {
    $("yearPicker").value = "";
    render();
  });
  $("excelFileBtn")?.addEventListener("click", () =>
    openActionSheet("excelActionSheet"),
  );
  $("backupFileBtn")?.addEventListener("click", () =>
    openActionSheet("backupActionSheet"),
  );
  document
    .querySelectorAll("[data-close-sheet]")
    .forEach((btn) => btn.addEventListener("click", closeActionSheets));
  document.querySelectorAll(".fx-sheet-backdrop").forEach((sheet) =>
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) closeActionSheets();
    }),
  );
  $("downloadXlsBtn")?.addEventListener("click", () => {
    downloadBlob(makeXlsxBlob(), filename(".xlsx"));
    closeActionSheets();
    showToast("已尝试下载 Excel，请查看浏览器下载记录");
  });
  $("shareXlsBtn")?.addEventListener("click", async () => {
    await shareBlob(makeXlsxBlob(), filename(".xlsx"), "美元换人民币记录本");
    closeActionSheets();
  });
  async function copySummary() {
    const month = $("copyPeriod").value;
    const s = summarize(sorted().filter(r => month === "all" || r.date.startsWith(month)));
    const text =
      (month === "all" ? "全部" : month.replace("-", "年") + "月") + "美元人民币汇率记录\n\n新增美金总金额：$" +
      money(s.addUsd) +
      "\n减去美金总金额：" +
      signedMoneyText(-Math.abs(s.subtractUsd || 0), "$") +
      "\n美金净金额：" +
      signedMoneyText(s.netUsd, "$") +
      "\n平均汇率：" +
      fixedRate(s.rateAvg) +
      "\n新增人民币总金额：¥" +
      money(s.addCny) +
      "\n减去人民币总金额：" +
      signedMoneyText(-Math.abs(s.subtractCny || 0), "¥") +
      "\n人民币净金额：" +
      signedMoneyText(s.netCny, "¥") +
      "\n记录行数：" +
      s.count +
      " 行\n有记录月份：" +
      (s.monthCount || 0) +
      " 个月\n每月平均美金：" +
      signedMoneyText(s.monthAvgUsd, "$") +
      "\n每月平均人民币：" +
      signedMoneyText(s.monthAvgCny, "¥");
    const copied = await copyText(text);
    showCopyResult(copied, text, "全部汇总内容");
  }
  $("copySummaryBtn")?.addEventListener("click", copySummary);
  $("downloadBackupBtn")?.addEventListener("click", () => {
    downloadBlob(makeBackupBlob(), backupFilename());
    closeActionSheets();
    showToast("已尝试下载数据备份，请查看浏览器下载记录");
  });
  $("shareBackupBtn")?.addEventListener("click", async () => {
    await shareBackupFile();
    closeActionSheets();
  });
  $("importBackupInput")?.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      closeActionSheets();
      await importBackupFile(file);
    }
    e.target.value = "";
  });
  $("clearDataBtn")?.addEventListener("click", () => {
    if (confirm("确定清空全部 " + load().length + " 笔记录吗？如需保留，请取消并先下载备份。")) {
      try {
        clearRecords(KEY);
      } catch {
        alert("清空失败，请检查浏览器存储权限后重试。");
        return;
      }
      render();
      showToast("已清空");
    }
  });
  resetForm();
  if ($("monthPicker")) $("monthPicker").value = latestMonth(sorted());
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
