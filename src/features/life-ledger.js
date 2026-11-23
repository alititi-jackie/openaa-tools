import { installLedger, isInstalled } from "../lib/install-ledger.js";
import {
  normalize, checkEdit, recoverBook,
  totals,
  backup,
  detectBackup,
  restorableBooks,
  load,
  save,
  importRows,
  restore,
  readBooks,
  balances,
  fullBackup,
  importBooks,
  clearBooks,
  reportXlsx,
} from "../lib/ledger.js";
import {
  FX_FIELDS,
  calculateFxTarget,
  roundFx,
  rateNeedsReview,
} from "../lib/fx-calculator.js";
import { showFeedback, copyText, showCopyResult } from "../lib/feedback.js";
import { shareFileOrDownload } from "../lib/share-file.js";

const root = document.querySelector("#ledger");
const names = {
  expense: "开支",
  income: "收入",
  remittance: "汇款",
  summary: "汇总",
};
const actions = { form: "记一笔", view: "查看", export: "导出／分享" };
const categories = ["购物", "餐饮", "交通", "房屋", "账单", "其它"];
const periods = { month: "月份", year: "年度", all: "汇总" };
const fxNames = { usd: "美元金额", rate: "汇率", cny: "人民币金额" };
const icons = {
  form: '<path d="M12 5v14M5 12h14"/>',
  view: '<path d="M4 5h16v15H4zM4 10h16M8 2v5m8-5v5"/>',
  export: '<path d="M12 15V3m-5 5 5-5 5 5M4 14v6h16v-6"/>',
};
const escape = (v) =>
  String(v ?? "").replace(
    /[<>&"']/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n, p = "$") =>
  (n < 0 ? "-" : "") + p +
  Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
const displayModeKey = "openaa_life_ledger_display_mode_v1";
const validDisplayModes = ["full", "expense", "income", "remittance"];
function savedDisplayMode() {
  try {
    const value = localStorage.getItem(displayModeKey);
    return validDisplayModes.includes(value) ? value : "full";
  } catch {
    return "full";
  }
}
let displayMode = savedDisplayMode();
let kind = displayMode !== "full" ? displayMode : "expense",
  page = "home",
  scope = "current",
  editing = null,
  preview = null,
  target = "cny",
  lastManual = "rate";
const filters = Object.fromEntries(
  Object.keys(names).map((k) => [
    k,
    { mode: "month", month: today().slice(0, 7), year: today().slice(0, 4) },
  ]),
);
const filter = () => filters[kind];
const prefix = () => (filter().mode === "all" ? "" : filter()[filter().mode]);
const selected = (k) =>
  load(k)
    .filter((r) => r.date.startsWith(prefix()))
    .sort((a, b) => b.date.localeCompare(a.date));
const periodName = () =>
  filter().mode === "all"
    ? "全部"
    : prefix().replace("-", " 年 ") +
      (filter().mode === "month" ? " 月" : " 年");
const button = (action, label, more = "") =>
  `<button type="button" data-action="${action}" ${more}>${label}</button>`;
function nav(labels, attr, current, title) {
  return `<nav class="${attr}" aria-label="${title}">${Object.entries(labels)
    .map(
      ([k, v]) =>
        `<button type="button" data-${attr}="${k}" aria-current="${k === current ? "page" : "false"}">${v}</button>`,
    )
    .join("")}</nav>`;
}
function safetyNote(title, message) {
  return `<div class="expense-safety-note" role="note" aria-label="${title}"><svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg><div><strong>${title}</strong><p>${message}</p></div></div>`;
}
function modeSwitcher() {
  return `<div class="ledger-mode-section"><p class="ledger-mode-title">选择适合你的账本模式</p><p class="ledger-mode-description">如果只需记录某一类账目，可以选择对应版本，界面更简洁。所有版本共用同一份数据，随时可以切换。</p><nav class="ledger-mode" aria-label="账本显示版本">${[
    ["full", "完整账本"],
    ["expense", "开支版"],
    ["income", "收入版"],
    ["remittance", "汇款版"],
  ].map(([value, label]) => `<button type="button" data-display-mode="${value}" aria-pressed="${displayMode === value}">${label}</button>`).join("")}</nav></div>`;
}
function ledgerFaq() {
  return `<section class="ledger-faq" aria-labelledby="ledger-faq-title">
    <h2 id="ledger-faq-title">常见问题</h2>
    <h3>完整账本、开支版、收入版和汇款版有什么区别？</h3>
    <p>四个版本使用同一份账目。完整账本可以切换开支、收入、汇款和汇总；开支版只显示开支功能；收入版只显示收入功能；汇款版只显示汇款功能。切换版本不会删除其他账目。</p>
    <h3>下次打开还会保留我选择的版本吗？</h3>
    <p>会。同一浏览器保留网站数据时，会记住上次选择。清除网站数据或换设备后会恢复默认的完整账本。</p>
    <h3>开支版可以导入含收入和汇款的完整备份吗？</h3>
    <p>可以。导入时会显示开支、收入和汇款各自的笔数，合并或覆盖按原规则处理。覆盖三个账本会替换三本账的数据，包括备份里为零笔的账本；切回完整账本即可查看其他记录。</p>
    <h3>数据会上传服务器或自动同步到其他手机吗？</h3>
    <p>不会。记录只保存在当前浏览器，不能自动同步到其他设备或不同域名的网站。建议定期下载 JSON 备份；Excel 主要用于查看和分享。</p>
    <h3>换手机或清除浏览器数据前怎么办？</h3>
    <p>先在「导出／分享」选择「全部记录」，下载完整 JSON 备份并确认文件已保存；到新设备打开账本后再导入。仅保存 Excel 不能代替用于恢复数据的 JSON 备份。</p>
  </section>`;
}
function home() {
  const subtitles = {
    form:
      kind === "remittance"
        ? "记录美元、汇率和人民币"
        : kind === "expense"
          ? "记录金额、支付方式和分类"
          : "记录金额和收款方式",
    view: "按月份、年度查看明细",
    export: "Excel 表格、备份和汇总",
  };
  return `<h1>${names[kind]}账本</h1><div class="home-cards">${Object.entries(
    actions,
  )
    .map(
      ([k, v]) =>
        `<button class="home-card" data-page="${k}"><span class="icon ${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${icons[k]}</svg></span><span><strong>${v}</strong><small>${subtitles[k]}</small></span><span class="chev" aria-hidden="true">›</span></button>`,
    )
    .join(
      "",
    )}</div>${button("install", "添加到手机主屏幕", `class="install-entry" ${isInstalled() ? "hidden" : ""}`)}<small class="install-tip">添加后，使用「生活账本」就更方便。</small>${currentMonthCard()}${safetyNote("数据安全说明", "OpenAA 重视用户隐私与数据安全。本工具不会上传、存储或同步任何记录到服务器，所有数据仅保存在您当前使用的浏览器中。清理缓存、清除网站数据、重装浏览器或更换设备前，请先下载 JSON 备份。Excel 用于查看和打印。")}<p class="storage-note">账目仅保存在当前浏览器。清除网站数据或换手机前，请先下载备份。 <a href="./guide/">使用说明</a></p>${modeSwitcher()}${ledgerFaq()}`;
}
const input = (name, label, type, value, extra = "") =>
  `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" ${extra}></label>`;
function currentMonthCard() {
  const month = today().slice(0, 7);
  const rows = load(kind).filter(row => row.date.startsWith(month));
  const content = rows.length
    ? statGrid(stats(kind, rows))
    : '<p class="panel month-empty">本月暂无记录，<button type="button" class="month-add" data-action="month-add">去记一笔</button></p>';
  return `<section><h2>本月数据</h2>${content}</section>`;
}

function radios(name, label, values, current) {
  return `<fieldset data-choice><legend>${label}</legend><div class="choices">${Object.entries(
    values,
  )
    .map(
      ([v, l]) =>
        `<label><input type="radio" name="${name}" aria-describedby="error-${name}" value="${escape(v)}" ${current === v ? "checked" : ""} required><span>${escape(l)}</span></label>`,
    )
    .join(
      "",
    )}</div><small id="error-${name}" class="choice-error" role="alert"></small></fieldset>`;
}
function form() {
  const r = editing || {};
  const decimal = (name, label, val, step) =>
    input(
      name,
      label,
      "number",
      val,
      `inputmode="decimal" step="${step}" min="${step}" required ${name === "rate" ? 'aria-describedby="rate-warning"' : ""}`,
    );
  return `<h1>${editing ? "编辑" : "记一笔"}${names[kind]}</h1><form class="panel">
 ${input("date", "日期", "date", r.date || today(), "required")}
 ${kind === "remittance" ? '<label>记录类型<select name="type"><option value="add">汇出</option><option value="subtract" ' + (r.type === "subtract" ? "selected" : "") + '>减去（冲正）</option></select></label>' : ""}
 ${decimal("usd", "美元金额（USD）", r.amount == null ? "" : Math.abs(r.amount), 0.01)}
 ${kind === "remittance" ? decimal("rate", "汇率（1 美元兑换人民币）", r.rate?.toFixed(3) ?? "", 0.001) + `<small id="rate-warning" aria-live="polite">${rateNeedsReview(r.rate) ? "⚠ 汇率可能有误，请核对。" : ""}</small>` + decimal("cny", "人民币金额（CNY）", r.cny == null ? "" : Math.abs(r.cny), 0.01) + `<fieldset><legend>计算哪一项</legend><div class="calc">${FX_FIELDS.map((k) => button("target", fxNames[k], `data-field="${k}"`)).join("")}</div></fieldset>` : radios("method", kind === "income" ? "收款方式" : "支付方式", { cash: "现金", card: "银行卡" }, r.method)}
 ${kind === "expense" ? radios("category", "开支分类", Object.fromEntries([...new Set([...categories, r.category].filter(Boolean))].map((x) => [x, x])), r.category) : ""}
 <label>备注（选填）<textarea name="note" maxlength="10000" rows="2">${escape(r.note)}</textarea></label>
 <div class="controls">${button("cancel", "取消")}<button class="primary" type="submit">保存</button></div></form>`;
}
function picker() {
  const f = filter();
  const rows =
    kind === "summary"
      ? Object.keys(names)
          .filter((k) => k !== "summary")
          .flatMap(load)
      : load(kind);
  const years = [
    ...new Set([
      today().slice(0, 4),
      f.year,
      ...rows.map((r) => r.date.slice(0, 4)),
    ]),
  ]
    .sort()
    .reverse();
  return (
    nav(periods, "period", f.mode, "查看范围") +
    (f.mode === "month"
      ? input("month", "选择月份", "month", f.month, "required")
      : f.mode === "year"
        ? `<label>选择年份<select name="year">${years.map((y) => `<option ${y === f.year ? "selected" : ""}>${y}</option>`).join("")}</select></label>`
        : "")
  );
}
const netTone = n => n < 0 ? "expense" : n > 0 ? "income" : "zero";
function stats(k, rows) {
  const t = totals(k, rows);
  return k === "remittance"
    ? [
        ["净汇出美元", money(t.usd), netTone(t.usd)],
        ["折合人民币", money(t.cny, "¥"), netTone(t.cny)],
        ["平均汇率", t.count ? t.rate.toFixed(3) : "—"],
        ["汇款笔数", t.count + " 笔"],
      ]
    : [
        [names[k] + "总额", money(t.usd), k],
        ["现金", money(t.cash)],
        ["银行卡", money(t.card)],
        ["记录笔数", t.count + " 笔"],
      ];
}
const statItem = ([label, value, tone]) =>
  `<div><dt>${label}</dt><dd${tone ? ` class="amount-${tone}"` : ""}>${value}</dd></div>`;
const statGrid = (pairs) =>
  `<dl class="stats">${pairs.map(statItem).join("")}</dl>`;
function details(rows) {
  return rows
    .map(
      (r) =>
        `<article class="record"><div><b>${escape(r.category || (kind === "remittance" ? (r.type === "subtract" ? "汇款冲正" : "汇款") : r.method === "cash" ? "现金收入" : "银行卡收入"))}</b><span>${money(r.amount)}</span></div><small>${escape(r.date)} · ${kind === "remittance" ? money(r.cny, "¥") + " · 汇率 " + r.rate.toFixed(3) : r.method === "cash" ? "现金" : "银行卡"}</small>${r.note ? `<p>${escape(r.note)}</p>` : ""}<footer>${button("edit", "编辑", `data-id="${escape(r.id)}"`)}${button("delete", "删除", `data-id="${escape(r.id)}"`)}</footer></article>`,
    )
    .join("");
}
function view() {
  const rows = selected(kind),
    groups = new Map();
  const month = filter().mode === "month";
  for (const row of rows) {
    const key = row.date.slice(0, filter().mode === "year" ? 7 : 4);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return `<h1>${names[kind]}记录</h1>${picker()}${statGrid(stats(kind, rows))}<h2>${periodName()}${names[kind]}明细</h2><section class="panel list">${!rows.length ? '<p class="empty">这个时段暂无记录</p>' : month ? details(rows) : [...groups].map(([group, items]) => `<details><summary>${group} · ${items.length} 笔 <b>${money(totals(kind, items).usd)}</b></summary>${details(items)}</details>`).join("")}</section>`;
}
function balancePairs(books, mode) {
  const [income, expense, first, usd, net, cny] = balances(books);
  const span = { month: "本月", year: "本年", all: "累计" }[mode];
  return [
    ["收入", money(income), "income"],
    ["生活开支", money(-expense), "expense"],
    ["扣除开支后剩余", money(first), first < 0 ? "expense" : "neutral"],
    ["汇出美元", money(-usd)],
    [span + "结余", money(net), netTone(net)],
    ["汇款折合人民币", money(cny, "¥")],
  ];
}
function periodBooks() {
  return Object.fromEntries(
    ["expense", "income", "remittance"].map((k) => [k, selected(k)]),
  );
}
function summary() {
  const pairs = balancePairs(periodBooks(), filter().mode);
  return `<h1>收支总览</h1>${picker()}<h2>${periodName()}收支</h2><dl class="panel balance">${pairs.map(statItem).join("")}</dl><div class="controls"><button type="button" data-page="export">导出／分享</button></div>`;
}
function exportInfo() {
  const all = scope === "all";
  const period = all ? "全部年份" : periodName();
  const emptyPeriod = period === "全部" ? "全部年份" : period;
  if (all || kind === "summary") {
    const books = all ? readBooks() : periodBooks();
    return {
      title: period + "收支总览",
      pairs: balancePairs(books, all ? "all" : filter().mode),
      emptyMessage: Object.values(books).some(rows => rows.length)
        ? "" : emptyPeriod + "暂无记录。",
      fileLabel: all ? "全部记录" : "全部年份收支总览",
    };
  }
  const rows = selected(kind);
  return {
    title: period + names[kind] + "汇总",
    pairs: stats(kind, rows),
    emptyMessage: rows.length ? "" : emptyPeriod + "暂无" + names[kind] + "记录。",
    fileLabel: names[kind] + "记录",
  };
}
const bookLabel = (k) => (k === "all" ? "三个账本" : names[k]);
const counts = (books) =>
  Object.entries(books)
    .map(([k, rows]) => names[k] + " " + rows.length + " 笔")
    .join("、");
function exportsPage() {
  const all = scope === "all",
    overview = kind === "summary";
  const current = overview ? "收支总览" : names[kind] + "记录";
  const { title, emptyMessage, fileLabel } = exportInfo();
  const backupLabel = all ? "完整" : names[kind];
  const backupScope = all
    ? "包含开支、收入和汇款三个账本的全部年份。"
    : "包含全部年份的" + names[kind] + "记录。";
  const clearTarget = overview ? "all" : kind;
  return `<h1>${overview ? "收支总览" : names[kind]}导出／分享</h1>
  ${safetyNote("数据保存说明", "数据仅保存在当前浏览器。Excel 可用于查看和分享。清除网站数据、换浏览器或换手机前，请先选择「全部记录」，下载完整数据备份（JSON），以便恢复账目。")}
  ${nav({ current, all: "全部记录" }, "scope", scope, "导出范围")}
  <section class="panel"><h2>汇总文字</h2>${emptyMessage ? `<p>${escape(emptyMessage)}</p>` : button("copy", "复制" + escape(title))}</section>
  <section class="panel"><h2>Excel 表格</h2><p>${all ? "一份 Excel 包含开支、收入、汇款各自的汇总、明细、月度和年度汇总，以及收支总览、收支月度和年度汇总。" : overview ? "逐年列出收支和结余，末行列出全部年份合计。" : "包含本账本全部年份的总合计、逐笔明细、月度汇总和年度汇总。"}</p><div class="controls">${button("excel", "下载" + fileLabel + " Excel")}${button("shareExcel", "分享" + fileLabel + " Excel")}</div></section>
  ${all || !overview ? `<section class="panel"><h2>${backupLabel}备份</h2><p>${backupScope}清除网站数据、重装浏览器或换手机前，请下载 JSON 备份并确认文件已保存。</p><div class="controls">${button("backup", "下载" + backupLabel + "备份")}${button("shareBackup", "分享" + backupLabel + "备份")}</div></section>` : ""}
  <details class="panel import-fold" ${preview ? "open" : ""}><summary>导入备份</summary><label class="file">选择 JSON 备份文件<input type="file" name="file" accept=".json,.backup,application/json"></label>${preview ? importPanel() : ""}${restorableBooks().map(k => button("restore", "恢复" + names[k] + "导入前的记录", `data-restore="${k}"`)).join("")}</details>
  ${!overview || all ? `<div class="clear-section">${button("clear", overview ? "清空三个账本" : "清空" + names[kind] + "记录", `data-clear="${clearTarget}" class="clear-entry"`)}</div>` : ""}`;
}
function backupFile(target) {
  const data =
    target === "all" ? fullBackup(readBooks()) : backup(target, load(target));
  return new Blob([JSON.stringify(data)], { type: "application/json" });
}
function confirmClear(target) {
  const kinds =
    target === "all" ? ["expense", "income", "remittance"] : [target];
  const current = () => Object.fromEntries(kinds.map((k) => [k, load(k)]));
  const initial = current();
  const dialog = document.createElement("dialog");
  dialog.className = "transfer-confirm clear-dialog";
  const label = bookLabel(target);
  dialog.setAttribute("aria-labelledby", "clear-title");
  dialog.innerHTML = `<h2 id="clear-title">清空${label}${target === "all" ? "" : "全部记录"}？</h2><p>将删除此浏览器中全部年份的记录（${counts(initial)}），以及对应账本的导入前记录。${target === "all" ? "" : "其他账本保留。"}收支总览会重新计算。</p><p>如需以后恢复，请先下载 JSON 备份，并确认文件已保存。</p><div class="controls"><button type="button" data-download>下载${target === "all" ? "完整" : label}备份</button></div><p role="status"></p><form method="dialog" class="controls"><button autofocus value="cancel">取消</button><button class="danger" value="clear">确认清空${label}</button></form>`;
  dialog.querySelector("[data-download]").onclick = guarded(() => {
    download(
      backupFile(target),
      "OpenAA-" + label + "备份-" + today() + ".json",
    );
    dialog.querySelector("[role=status]").textContent =
      "已请求下载，请确认文件已保存。";
  });
  document.body.append(dialog);
  dialog.addEventListener(
    "close",
    guarded(() => {
      dialog.remove();
      if (dialog.returnValue !== "clear") return;
      if (JSON.stringify(current()) !== JSON.stringify(initial))
        throw new Error("记录已发生变化，请重新核对后再清空。");
      clearBooks(kinds);
      preview = null;
      render();
      showFeedback("已清空" + label + "记录");
    }),
    { once: true },
  );
  dialog.showModal();
}
function importPanel() {
  if (preview.books)
    return `<section class="panel" id="import-preview"><h2>完整备份导入预览</h2><p>${escape(preview.filename)}</p><p>${counts(preview.books)}</p><p>合并会保留已有记录并跳过重复编号。覆盖会替换三个账本，包括备份中为零笔的账本。</p><div class="controls">${button("merge", "合并导入")}${button("replace", "覆盖三个账本")}${button("abort", "取消")}</div></section>`;
  const pick = preview.legacy && preview.kind === "remittance";
  const amounts = pick ? preview.rows.reduce((sum, row) => {
    sum[row.type === "subtract" ? 1 : 0] += Math.round(row.amount * 100);
    return sum;
  }, [0, 0]) : [];
  return `<section class="panel" id="import-preview"><h2>${names[preview.kind]}导入预览</h2><p>${escape(preview.filename)}</p><p>可导入 ${preview.rows.length} 笔。</p>${pick ? `<p>汇出 ${money(amounts[0] / 100)}，冲正 ${money(amounts[1] / 100)}。勾选要导入的记录。</p><p data-import-net aria-live="polite">已选 0 笔，净额 $0.00</p>` : ""}<div class="preview-list">${preview.rows.map((r, i) => `<label>${pick ? `<input type="checkbox" data-import="${i}">` : ""}${escape(r.date)} · ${money(r.amount)} ${escape(r.note)}</label>`).join("")}</div><div class="controls">${button("merge", "合并导入")}${button("replace", "覆盖导入")}${button("abort", "取消")}</div></section>`;
}
function render() {
  try {
    renderLedger();
  } catch (error) {
    if (!error.kind && error.name !== "SecurityError") throw error;
    if (!error.kind) {
      root.textContent = "浏览器禁止访问本地存储。请允许此网站使用本地存储，然后刷新。";
      return;
    }
    const label = names[error.kind];
    root.innerHTML = `<section class="panel"><h1>${label}账本读取失败</h1><p>原始数据已保留。可以先下载原始数据，再选择 JSON 备份恢复这个账本。</p><button type="button" data-raw>下载原始数据</button><label>从 JSON 备份恢复<input type="file" accept=".json,.backup" data-recover></label></section>`;
    root.querySelector("[data-raw]").onclick = () => download(new Blob([error.raw]), label + "-原始数据.json");
    root.querySelector("[data-recover]").onchange = guarded(async event => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 16 * 1024 * 1024) throw Error("备份超过 16 MB。");
      const parsed = detectBackup(await file.text());
      const rows = parsed.books?.[error.kind] ?? (parsed.kind === error.kind ? parsed.rows : null);
      if (!rows) throw Error("请选择包含" + label + "记录的备份。");
      if (!confirm("确认用 " + rows.length + " 笔记录恢复" + label + "账本？")) return;
      recoverBook(error.kind, error.raw, rows);
      render();
    });
  }
}
function renderLedger() {
  root.innerHTML =
    '<div class="ledger-title">OpenAA 生活收支账本<p>记下每一笔收支和汇款，随时看看还剩多少。</p></div>' +
    (displayMode === "full" ? nav(names, "book", kind, "账本导航") : "") +
    `<div class="ledger-content">${page !== "home" ? button("back", kind === "summary" ? "‹ 返回收支总览" : "‹ 返回" + names[kind] + "账本", 'class="back"') : ""}${page === "export" ? exportsPage() : kind === "summary" ? summary() : { home, view, form, export: exportsPage }[page]()}</div><output id="site-status" role="status" aria-live="polite"></output>`;
  if (page === "form") markTarget();
}
function markTarget() {
  root
    .querySelectorAll("[data-field]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.field === target)),
    );
}
function updateRateWarning(form, defer = false) {
  const warning = form.querySelector("#rate-warning");
  const unusual = rateNeedsReview(roundFx(Number(form.elements.rate.value), 3));
  if (!defer || !unusual)
    warning.textContent = unusual ? "⚠ 汇率可能有误，请核对。" : "";
}
function calc(form) {
  const values = Object.fromEntries(
    FX_FIELDS.map((k) => [k, form.elements[k].value]),
  );
  const n = calculateFxTarget(target, values);
  if (n !== null) form.elements[target].value = n;
  if (target === "rate") updateRateWarning(form);
  markTarget();
}
// Native required groups prevent submission; show a visible reminder beside each missing group.
root.addEventListener(
  "invalid",
  (event) => {
    const group = event.target.closest("[data-choice]");
    if (group && event.target.validity.valueMissing) {
      const message = group.querySelector(".choice-error");
      if (!message.textContent)
        message.textContent =
          "请选择" + group.querySelector("legend").textContent;
    }
  },
  true,
);
root.addEventListener("change", (event) => {
  const group = event.target.closest("[data-choice]");
  if (group) group.querySelector(".choice-error").textContent = "";
});
root.addEventListener("input", (e) => {
  if (kind !== "remittance" || !FX_FIELDS.includes(e.target.name)) return;
  const field = e.target.name,
    form = e.target.form,
    filled = FX_FIELDS.filter((k) => form.elements[k].value !== "");
  if (!e.target.value) target = field;
  else if (filled.length === 2) {
    target = FX_FIELDS.find((k) => !filled.includes(k));
    calc(form);
  } else if (filled.length === 3) {
    if (field === target)
      target =
        lastManual !== field
          ? lastManual
          : { usd: "cny", rate: "cny", cny: "rate" }[field];
    calc(form);
  }
  updateRateWarning(form, field === "rate");
  lastManual = field;
  markTarget();
});
root.addEventListener("focusout", (e) => {
  if (
    kind !== "remittance" ||
    !FX_FIELDS.includes(e.target.name) ||
    !e.target.value
  )
    return;
  const digits = e.target.name === "rate" ? 3 : 2;
  const original = e.target.value;
  const v = roundFx(Number(original), digits);
  if (Number.isFinite(v)) {
    e.target.value = v.toFixed(digits);
    if (e.target.name !== target && v !== Number(original)) calc(e.target.form);
    updateRateWarning(e.target.form);
  }
});
function go(next, top = true) {
  page = next;
  scope = "current";
  preview = null;
  render();
  if (top) window.scrollTo(0, 0);
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function guarded(fn) {
  return async (e) => {
    try {
      await fn(e);
    } catch (error) {
      alert(error.message || "操作未完成，请重试。");
    }
  };
}
function confirmTransfer(messages) {
  const dialog = document.createElement("dialog");
  dialog.className = "transfer-confirm";
  dialog.setAttribute("aria-labelledby", "transfer-confirm-title");
  dialog.innerHTML =
    '<h2 id="transfer-confirm-title">请核对汇款记录</h2><p></p><form method="dialog" class="controls"><button value="revise" autofocus>返回修改</button><button value="save" class="primary">确认保存</button></form>';
  dialog.querySelector("p").textContent = messages.join("\n");
  document.body.append(dialog);
  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        const accepted = dialog.returnValue === "save";
        dialog.remove();
        resolve(accepted);
      },
      { once: true },
    );
    dialog.showModal();
  });
}
root.addEventListener(
  "submit",
  guarded(async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target));
    const row = normalize(kind, {
      ...values,
      id: editing?.id,
      createdAt: editing?.createdAt,
      amount: values.usd,
    });
    const unusualExpense =
      kind === "expense" && (row.amount < 1 || row.amount > 10000);
    if (unusualExpense && !confirm("金额或汇率超出常用范围，是否仍然保存？"))
      return;
    if (kind === "remittance") {
      const warnings = [];
      if (Math.abs(row.amount) < 20 || Math.abs(row.amount) > 100000)
        warnings.push(`汇款金额为 ${money(row.amount)}，请核对金额。`);
      if (rateNeedsReview(row.rate))
        warnings.push(
          `当前汇率为 ${row.rate.toFixed(3)}，可能有误。确认按此汇率保存吗？`,
        );
      if (warnings.length && !(await confirmTransfer(warnings))) return;
    }
    const rows = load(kind);
    if (editing) checkEdit(editing, rows);
    save(
      kind,
      editing
        ? rows.map((r) => (r.id === editing.id ? row : r))
        : [...rows, row],
    );
    const dest = editing ? "view" : "home";
    editing = null;
    go(dest);
    showFeedback("已保存");
  }),
);
root.addEventListener(
  "change",
  guarded(async (e) => {
    const field = e.target;
    if (field.matches("[data-import]") && preview?.rows) {
      const checked = [...root.querySelectorAll("[data-import]:checked")];
      const cents = checked.reduce((sum, box) => sum + Math.round(preview.rows[Number(box.dataset.import)].amount * 100), 0);
      root.querySelector("[data-import-net]").textContent = "已选 " + checked.length + " 笔，净额 " + money(cents / 100);
    }
    if (["month", "year"].includes(field.name) && field.value) {
      filter()[field.name] = field.value;
      render();
    }
    if (field.name === "file") {
      preview = null;
      root.querySelector("#import-preview")?.remove();
      if (!field.files[0]) return;
      const current = kind,
        initialScope = scope,
        file = field.files[0];
      const limit = 16;
      if (file.size > limit * 1024 * 1024)
        throw new Error("备份超过 " + limit + " MB。");
      const contents = await file.text();
      if (
        current !== kind ||
        scope !== initialScope ||
        page !== "export" ||
        field.files[0] !== file ||
        !field.isConnected
      )
        return;
      const parsed = detectBackup(contents);
      preview = { ...parsed, filename: file.name };
      render();
      root.querySelector("#import-preview").scrollIntoView();
    }
  }),
);
root.addEventListener(
  "click",
  guarded(async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.displayMode) {
      const next = b.dataset.displayMode;
      if (!validDisplayModes.includes(next)) return;
      const previous = kind;
      displayMode = next;
      if (next !== "full") kind = next;
      else if (previous === "expense" || previous === "income" || previous === "remittance") kind = previous;
      else kind = "expense";
      editing = null;
      try { localStorage.setItem(displayModeKey, displayMode); } catch { /* Browsers may block storage. */ }
      go("home", false);
      return;
    }
    if (b.dataset.book) {
      kind = b.dataset.book;
      editing = null;
      go("home");
      return;
    }
    if (b.dataset.period) {
      filter().mode = b.dataset.period;
      render();
      return;
    }
    if (b.dataset.scope) {
      scope = b.dataset.scope;
      preview = null;
      render();
      return;
    }
    if (b.dataset.page || b.dataset.action === "month-add") {
      editing = null;
      target = "cny";
      lastManual = "rate";
      go(b.dataset.page || "form");
      return;
    }
    const a = b.dataset.action,
      id = b.dataset.id;
    if (a === "back" || a === "cancel") {
      const dest = editing ? "view" : "home";
      editing = null;
      go(dest);
      return;
    }
    if (a === "install") return installLedger();
    if (a === "target") {
      target = b.dataset.field;
      calc(root.querySelector("form"));
      return;
    }
    if (a === "edit") {
      editing = load(kind).find((r) => r.id === id);
      target = "cny";
      lastManual = "rate";
      go("form");
      return;
    }
    if (a === "delete" && confirm("删除这笔" + names[kind] + "？")) {
      save(
        kind,
        load(kind).filter((r) => r.id !== id),
      );
      render();
      showFeedback("已删除");
      return;
    }
    if (a === "clear") {
      confirmClear(b.dataset.clear);
      return;
    }
    if (a === "copy") {
      const { title, pairs, emptyMessage } = exportInfo();
      if (emptyMessage) {
        render();
        return;
      }
      const text = [title, ...pairs.map(([k, v]) => k + "　" + v)].join("\n");
      showCopyResult(await copyText(text), text, title);
      return;
    }
    if (["excel", "backup", "shareExcel", "shareBackup"].includes(a)) {
      const sheet = a.toLowerCase().includes("excel"),
        target = scope === "all" ? "all" : kind;
      const { fileLabel } = exportInfo();
      const blob = sheet
        ? reportXlsx(target, target === "all" || target === "summary" ? readBooks() : { [target]: load(target) })
        : backupFile(target);
      const filename =
        "OpenAA-" +
        fileLabel +
        (sheet ? "" : "备份") +
        "-" +
        today() +
        (sheet ? ".xlsx" : ".json");
      if (a.startsWith("share"))
        await shareFileOrDownload(blob, filename, fileLabel, download);
      else {
        download(blob, filename);
        showFeedback("已开始下载");
      }
      return;
    }
    if (a === "restore" && confirm("将" + names[b.dataset.restore] + "账本恢复到上次导入前？")) {
      restore(b.dataset.restore);
      preview = null;
      render();
      showFeedback("已恢复");
      return;
    }
    if (a === "abort") {
      preview = null;
      render();
      return;
    }
    if (a === "merge" || a === "replace") {
      if (!preview) return;
      if (preview.books) {
        if (
          a === "replace" &&
          !confirm(`确认用「${preview.filename}」覆盖三个账本？备份包含${counts(preview.books)}。`)
        )
          return;
        const before = JSON.stringify(readBooks());
        const changed = JSON.stringify(importBooks(preview.books, a)) !== before;
        preview = null;
        render();
        showFeedback(changed ? "三个账本已完成导入" : "账目没有变化");
        return;
      }
      let rows = preview.rows;
      if (preview.legacy && preview.kind === "remittance") {
        rows = [...root.querySelectorAll("[data-import]:checked")].map(
          (c) => rows[Number(c.dataset.import)],
        );
        if (!rows.length) throw new Error("请先勾选要导入的汇款。");
      }
      if (
        a === "replace" &&
        !confirm(`确认用「${preview.filename}」的 ${rows.length} 笔记录覆盖全部${names[preview.kind]}记录？`)
      )
        return;
      const before = JSON.stringify(load(preview.kind));
      const changed = JSON.stringify(importRows(preview.kind, rows, a)) !== before;
      preview = null;
      render();
      showFeedback(changed ? "已完成导入" : "账目没有变化");
    }
  }),
);
window.addEventListener("storage", () => {
  if (kind === "summary" || page === "view" || page === "home") render();
});
render();
