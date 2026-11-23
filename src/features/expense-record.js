import { makeWorkbook, sheetStyle, currencyCell } from "../lib/workbook.js";
import {
  openDialog as openSheet,
  closeDialog as closeSheets,
} from "../lib/dialog.js";
import { localDate, readRecords, writeRecords } from "../lib/records.js";
import {
  showFeedback as showToast,
  copyText,
  showCopyResult,
} from "../lib/feedback.js";
import { shareFileOrDownload } from "../lib/share-file.js";
import {
  readBackupFile,
  mergeRows,
  saveImportedRecords,
  serializeBackup,
  clearRecords,
} from "../lib/backup.js";
/* OpenAA 工具库 生活开支记录工具：本地保存 + 汇总 + 导出备份 */
(function initExpenseApp() {
  const KEY = "openaa_expense_records_v1";
  const CATEGORIES = ["购物", "餐饮", "交通", "房屋", "账单", "其它"];
  const CATEGORY_ICONS = {
    购物: "🛒",
    餐饮: "🍜",
    交通: "🚗",
    房屋: "🏠",
    账单: "📱",
    其它: "📦",
  };
  const $ = (id) => document.getElementById(id);
  const views = () =>
    Array.from(document.querySelectorAll("#expenseApp .expense-view"));
  const num = (v) => Number.parseFloat(v) || 0;
  const money = (n) =>
    "$" +
    (Number(n) || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const today = () => localDate();
  const monthNow = () => today().slice(0, 7);
  function load() {
    return readRecords(KEY);
  }
  function save(rows) {
    writeRecords(KEY, rows);
  }
  function sorted() {
    return load().sort(
      (a, b) =>
        String(b.date).localeCompare(String(a.date)) ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
  }
  function escapeText(str) {
    return String(str || "").replace(
      /[&<>\"]/g,
      (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[s],
    );
  }
  function startOfWeek(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return localDate(d);
  }
  function inRange(row, range) {
    const d = String(row.date || "");
    if (range === "week") return startOfWeek(d) === startOfWeek(today());
    if (range === "month") return d.slice(0, 7) === monthNow();
    if (range === "year") return d.slice(0, 4) === today().slice(0, 4);
    return true;
  }
  function summarize(rows) {
    const total = rows.reduce((s, r) => s + num(r.amount), 0);
    const cash = rows
      .filter((r) => r.payment === "现金")
      .reduce((s, r) => s + num(r.amount), 0);
    const card = rows
      .filter((r) => r.payment === "银行卡")
      .reduce((s, r) => s + num(r.amount), 0);
    const byCategory = Object.create(null);
    CATEGORIES.forEach((c) => (byCategory[c] = 0));
    rows.forEach((r) => {
      byCategory[r.category || "其它"] =
        (byCategory[r.category || "其它"] || 0) + num(r.amount);
    });
    return { total, cash, card, count: rows.length, byCategory };
  }
  function summaryHtml(s) {
    return [
      ["开支总金额", money(s.total)],
      ["记录笔数", s.count + " 笔"],
      ["现金总额", money(s.cash)],
      ["银行卡总额", money(s.card)],
    ]
      .map(
        (x) =>
          '<div class="expense-stat"><span>' +
          x[0] +
          "</span><strong>" +
          x[1] +
          "</strong></div>",
      )
      .join("");
  }
  function categorySummaryHtml(s) {
    const items = Object.entries(s.byCategory).filter(
      (x) => x[1] > 0,
    );
    if (!items.length) return '<div class="expense-empty">暂无分类数据</div>';
    return items
      .map(
        ([c, v]) =>
          '<div class="expense-category-stat"><span>' +
          (Object.hasOwn(CATEGORY_ICONS, c) ? CATEGORY_ICONS[c] : "📦") +
          " " +
          escapeText(c) +
          "</span><strong>" +
          money(v) +
          "</strong></div>",
      )
      .join("");
  }
  function recordHtml(r) {
    return (
      '<div class="expense-record"><div class="expense-record-top"><div class="expense-record-date">' +
      escapeText(r.date) +
      '</div><div class="expense-record-money">' +
      money(r.amount) +
      '</div></div><div class="expense-record-meta">' +
      (CATEGORY_ICONS[r.category] || "📦") +
      " " +
      escapeText(r.category || "其它") +
      " ｜ " +
      escapeText(r.payment || "") +
      (r.note ? " ｜ " + escapeText(r.note) : "") +
      '</div><div class="expense-record-actions"><button class="expense-chip-btn" type="button" data-expense-edit="' +
      escapeText(r.id) +
      '">编辑</button><button class="expense-chip-btn" type="button" data-expense-delete="' +
      escapeText(r.id) +
      '">删除</button></div></div>'
    );
  }
  function renderList(id, rows, emptyText) {
    const box = $(id);
    if (!box) return;
    box.innerHTML = rows.length
      ? rows.map(recordHtml).join("")
      : '<div class="expense-empty">' + emptyText + "</div>";
  }
  function updateCopyPeriod(rows) {
    const picker = $("copyPeriod");
    const months = [...new Set([today().slice(0, 7), ...rows.map(r => r.date.slice(0, 7))])].sort().reverse();
    const selected = picker.value || today().slice(0, 7);
    picker.replaceChildren(new Option("全部记录", "all"), ...months.map(m => new Option(m.replace("-", "年") + "月", m)));
    picker.value = months.includes(selected) || selected === "all" ? selected : today().slice(0, 7);
    const all = picker.value === "all";
    const label = all ? "全部" : picker.value.replace("-", "年") + "月";
    const hasRows = rows.some(r => all || r.date.startsWith(picker.value));
    const button = $("expenseCopySummaryBtn");
    button.disabled = !hasRows;
    button.textContent = hasRows ? "📋 复制" + label + "汇总" : all ? "暂无记录" : label + "暂无记录";
  }
  $("copyPeriod").addEventListener("change", () => updateCopyPeriod(sorted()));
  $("backupBeforeClear").addEventListener("click", () => $("expenseDownloadBackupBtn").click());
  function render() {
    const rows = sorted();
    updateCopyPeriod(rows);
    const month = $("expenseMonthPicker")?.value || monthNow();
    const monthRows = rows.filter(
      (r) => String(r.date || "").slice(0, 7) === month,
    );
    if ($("homeMonthSummary"))
      $("homeMonthSummary").innerHTML = summaryHtml(
        summarize(
          rows.filter((r) => String(r.date || "").slice(0, 7) === monthNow()),
        ),
      );
    if ($("homeCategorySummary"))
      $("homeCategorySummary").innerHTML = categorySummaryHtml(
        summarize(
          rows.filter((r) => String(r.date || "").slice(0, 7) === monthNow()),
        ),
      );
    if ($("recordsSummary"))
      $("recordsSummary").innerHTML = summaryHtml(summarize(monthRows));
    renderList("recordsList", monthRows, "这个月份暂无记录。");
    const activeRange =
      document.querySelector(".expense-tab.active")?.dataset.summaryRange ||
      "week";
    const rangeRows = rows.filter((r) => inRange(r, activeRange));
    if ($("summaryStats"))
      $("summaryStats").innerHTML = summaryHtml(summarize(rangeRows));
    if ($("summaryCategoryStats"))
      $("summaryCategoryStats").innerHTML = categorySummaryHtml(
        summarize(rangeRows),
      );
    renderList("summaryList", rangeRows, "暂无记录。");
  }
  function goto(name) {
    views().forEach((v) =>
      v.classList.toggle("active", v.dataset.view === name),
    );
    const sectionTitleRow = $("expenseSectionTitleRow");
    if (sectionTitleRow) sectionTitleRow.hidden = name !== "home";
    if (name === "input" && !$("expenseEditId").value)
      $("expenseDate").value = $("expenseDate").value || today();
    if (
      name === "records" &&
      $("expenseMonthPicker") &&
      !$("expenseMonthPicker").value
    )
      $("expenseMonthPicker").value = monthNow();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setChoice(kind, value) {
    const id = kind === "payment" ? "expensePayment" : "expenseCategory";
    const selector = kind === "payment" ? "[data-payment]" : "[data-category]";
    $(id).value = value;
    document.querySelectorAll(selector).forEach((btn) => {
      const active =
        (kind === "payment" ? btn.dataset.payment : btn.dataset.category) ===
        value;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }
  function resetForm() {
    $("expenseEditId").value = "";
    $("expenseInputTitle").textContent = "记一笔";
    $("expenseDate").value = today();
    $("expenseAmount").value = "";
    $("expenseNote").value = "";
    $("expensePayment").value = "";
    $("expenseCategory").value = "";
    document
      .querySelectorAll(
        "#expensePaymentGrid .expense-choice-card, #expenseCategoryGrid .expense-choice-card",
      )
      .forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
    validateAmount();
  }
  function validateAmount() {
    const amount = num($("expenseAmount")?.value);
    const raw = String($("expenseAmount")?.value || "").trim();
    const warn = raw && (amount < 1 || amount > 10000 || amount < 0);
    $("expenseAmountWarning")?.classList.toggle("show", !!warn);
    return !!warn;
  }
  function editRecord(id) {
    const r = load().find((x) => x.id === id);
    if (!r) return;
    $("expenseEditId").value = r.id;
    $("expenseInputTitle").textContent = "编辑记录";
    $("expenseDate").value = r.date;
    $("expenseAmount").value = r.amount;
    $("expenseNote").value = r.note || "";
    setChoice("payment", r.payment || "");
    setChoice("category", r.category || "其它");
    validateAmount();
    goto("input");
  }
  function deleteRecord(id) {
    const r = load().find(item => item.id === id);
    if (!r || !confirm("删除 " + r.date + " 的" + r.category + " " + money(r.amount) + "？")) return;
    save(load().filter((r) => r.id !== id));
    render();
    showToast("已删除");
  }
  function headerRow(labels) {
    return labels.map((v) => ({ v, s: 1 }));
  }
  function blankRow() {
    return ["", "", "", "", ""];
  }
  function recordRowXlsx(r) {
    return [
      { v: r.date, s: 0 },
      { v: r.payment || "", s: 0 },
      { v: r.category || "", s: 0 },
      currencyCell(num(r.amount), "usd"),
      { v: r.note || "", s: 0 },
    ];
  }
  function summaryRowsXlsx(title, rows) {
    const s = summarize(rows);
    const out = [
      [{ v: title, s: sheetStyle.bold }, "", "", "", ""],
      [
        { v: "开支总金额", s: sheetStyle.total },
        currencyCell(Number(s.total.toFixed(2)), "usd", "Negative", true),
        "",
        "",
        "",
      ],
      [{ v: "记录笔数", s: sheetStyle.total }, { v: s.count, s: sheetStyle.bold }, "", "", ""],
      [
        { v: "现金总额", s: sheetStyle.total },
        currencyCell(Number(s.cash.toFixed(2)), "usd", "Neutral", true),
        "",
        "",
        "",
      ],
      [
        { v: "银行卡总额", s: sheetStyle.total },
        currencyCell(Number(s.card.toFixed(2)), "usd", "Neutral", true),
        "",
        "",
        "",
      ],
      ["", "", "", "", ""],
      [{ v: "分类", s: 1 }, { v: "金额", s: 1 }, "", "", ""],
    ];
    Object.keys(s.byCategory).forEach((c) =>
      out.push([
        { v: c, s: sheetStyle.total },
        currencyCell(Number((s.byCategory[c] || 0).toFixed(2)), "usd"),
        "",
        "",
        "",
      ]),
    );
    return out;
  }
  function groupByMonthRows(rows) {
    const map = {};
    rows.forEach((r) => {
      const k = String(r.date || "").slice(0, 7);
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    return Object.keys(map)
      .sort()
      .reverse()
      .map((k) => ({
        period: k,
        rows: map[k].sort((a, b) =>
          String(b.date).localeCompare(String(a.date)),
        ),
      }));
  }
  function buildAllSheetRows(rows) {
    const out = [headerRow(["日期", "支付方式", "分类", "金额", "备注"])];
    rows.forEach((r) => out.push(recordRowXlsx(r)));
    out.push(blankRow(), ...summaryRowsXlsx("总汇总", rows));
    return out;
  }
  function buildMonthSheetRows(rows) {
    const groups = groupByMonthRows(rows);
    const out = [];
    groups.forEach((g, idx) => {
      if (idx) out.push(blankRow());
      out.push(
        [{ v: g.period + " 月度记录", s: sheetStyle.bold }, "", "", "", ""],
        headerRow(["日期", "支付方式", "分类", "金额", "备注"]),
      );
      g.rows.forEach((r) => out.push(recordRowXlsx(r)));
      out.push(blankRow(), ...summaryRowsXlsx(g.period + " 汇总", g.rows));
    });
    if (!out.length) out.push([{ v: "暂无记录", s: sheetStyle.bold }, "", "", "", ""]);
    return out;
  }
  function buildYearSheetRows(rows) {
    const groups = groupByMonthRows(rows);
    const out = [
      headerRow(["月份", "开支总金额", "记录笔数", "现金总额", "银行卡总额"]),
    ];
    groups.forEach((g) => {
      const s = summarize(g.rows);
      out.push([
        { v: g.period, s: 0 },
        currencyCell(Number(s.total.toFixed(2)), "usd", "Negative", false),
        { v: s.count + " 笔", s: 0 },
        currencyCell(Number(s.cash.toFixed(2)), "usd", "Neutral", false),
        currencyCell(Number(s.card.toFixed(2)), "usd", "Neutral", false),
      ]);
    });
    out.push(blankRow(), ...summaryRowsXlsx("年度/全部汇总", rows));
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
  function blob(name, content, type) {
    return new Blob([content], { type });
  }
  function downloadBlob(b, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
  async function shareBlob(b, name, title) {
    await shareFileOrDownload(b, name, title, downloadBlob);
  }
  function excelBlob() {
    return makeXlsxBlob();
  }
  function backupBlob() {
    return blob(
      "expense.backup",
      serializeBackup(load(), "expense"),
      "application/json;charset=utf-8",
    );
  }
  function fname(ext) {
    return "生活开支记录_" + today().replaceAll("-", "") + ext;
  }
  async function importBackup(file) {
    try {
      const rows = await readBackupFile(file, "expense");
      if (!rows.length) {
        alert("备份中没有可导入的开支记录。");
        return;
      }
      const current = load();
      if (current.length) {
        const choice = prompt(
          `可导入 ${rows.length} 笔开支记录。` + "当前浏览器已有数据。请输入导入方式：\n1 = 覆盖当前数据\n2 = 合并数据\n0 = 取消",
        );
        if (choice === "1") saveImportedRecords(KEY, rows);
        else if (choice === "2")
          saveImportedRecords(KEY, mergeRows(current, rows));
        else return;
      } else {
        if (!confirm(`可导入 ${rows.length} 笔开支记录，确认导入吗？`)) return;
        saveImportedRecords(KEY, rows);
      }
      showToast("导入成功");
      render();
      goto("home");
    } catch (e) {
      alert(
        "导入失败：" + (e instanceof Error ? e.message : "请检查备份文件。"),
      );
    }
  }
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-expense-goto]");
    if (go) {
      if (go.dataset.expenseGoto === "input") resetForm();
      goto(go.dataset.expenseGoto);
    }
    const pay = e.target.closest("[data-payment]");
    if (pay) setChoice("payment", pay.dataset.payment);
    const cat = e.target.closest("[data-category]");
    if (cat) setChoice("category", cat.dataset.category);
    const edit = e.target.closest("[data-expense-edit]");
    if (edit) editRecord(edit.dataset.expenseEdit);
    const del = e.target.closest("[data-expense-delete]");
    if (del) deleteRecord(del.dataset.expenseDelete);
    if (e.target.closest("[data-expense-close-sheet]")) closeSheets();
  });
  document.querySelectorAll(".expense-sheet-backdrop").forEach((sheet) =>
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) closeSheets();
    }),
  );
  $("expenseAmount")?.addEventListener("input", validateAmount);
  $("expenseForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("expensePayment").value) {
      alert("请选择支付方式。");
      return;
    }
    if (!$("expenseCategory").value) {
      alert("请选择开支分类。");
      return;
    }
    if (validateAmount() && !confirm("金额看起来可能有误。\n\n是否仍然保存？"))
      return;
    const rows = load();
    const id =
      $("expenseEditId").value ||
      "r_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    const row = {
      id,
      date: $("expenseDate").value,
      amount: num($("expenseAmount").value),
      payment: $("expensePayment").value,
      category: $("expenseCategory").value,
      note: $("expenseNote").value.trim(),
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
  $("expenseContinueBtn")?.addEventListener("click", () => {
    resetForm();
    goto("input");
  });
  $("expenseMonthPicker")?.addEventListener("change", render);
  $("expenseThisMonthBtn")?.addEventListener("click", () => {
    $("expenseMonthPicker").value = monthNow();
    render();
  });
  document.querySelectorAll(".expense-tab").forEach((btn) =>
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".expense-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    }),
  );
  $("expenseExcelBtn")?.addEventListener("click", () =>
    openSheet("expenseExcelSheet"),
  );
  $("expenseBackupBtn")?.addEventListener("click", () =>
    openSheet("expenseBackupSheet"),
  );
  $("expenseDownloadExcelBtn")?.addEventListener("click", () => {
    downloadBlob(excelBlob(), fname(".xlsx"));
    closeSheets();
    showToast("已尝试下载 Excel，请查看浏览器下载记录");
  });
  $("expenseShareExcelBtn")?.addEventListener("click", async () => {
    await shareBlob(excelBlob(), fname(".xlsx"), "生活开支记录");
    closeSheets();
  });
  $("expenseDownloadBackupBtn")?.addEventListener("click", () => {
    downloadBlob(backupBlob(), fname(".backup"));
    closeSheets();
    showToast("已尝试下载数据备份，请查看浏览器下载记录");
  });
  $("expenseShareBackupBtn")?.addEventListener("click", async () => {
    await shareBlob(backupBlob(), fname(".backup"), "生活开支数据备份");
    closeSheets();
  });
  $("expenseImportInput")?.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      closeSheets();
      await importBackup(f);
    }
    e.target.value = "";
  });
  $("expenseClearBtn")?.addEventListener("click", () => {
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
  $("expenseCopySummaryBtn")?.addEventListener("click", async () => {
    const month = $("copyPeriod").value;
    const label = month === "all" ? "全部" : month.replace("-", "年") + "月";
    const rows = sorted().filter(r => month === "all" || r.date.startsWith(month));
    const s = summarize(rows);
    const categories = Object.keys(s.byCategory).filter((c) => s.byCategory[c] > 0)
      .map((c) => c + "：" + money(s.byCategory[c]))
      .join("\n");
    const text =
      label +
      "生活开支汇总\n\n开支总金额：" +
      money(s.total) +
      "\n记录笔数：" +
      s.count +
      " 笔\n现金总额：" +
      money(s.cash) +
      "\n银行卡总额：" +
      money(s.card) +
      (categories ? "\n\n分类开支：\n" + categories : "");
    const copied = await copyText(text);
    showCopyResult(copied, text, label + "汇总内容");
  });
  // Signal readiness only after import handlers and the rest of the UI are bound.
  $("expenseImportInput")?.setAttribute("data-ready", "true");
  resetForm();
  if ($("expenseMonthPicker")) $("expenseMonthPicker").value = monthNow();
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
