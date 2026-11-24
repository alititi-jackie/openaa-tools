import { installLedger, isInstalled } from "../lib/install-ledger.js";
import {
  normalize, checkEdit, recoverBook,
  totals,
  restorableBooks,
  load,
  save,
  restore,
  readBooks,
  balances,
  clearBooks,
  reportXlsx,
  templateXlsx,
  parseLedgerXlsx,
  importExcelBooks,
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
    <p>可以。导入时会显示文件中包含的开支、收入和汇款各自的笔数。合并按记录编号跳过重复，覆盖只替换文件中包含的账本，其他账本不动；切回完整账本即可查看其他记录。</p>
    <h3>数据会上传服务器或自动同步到其他手机吗？</h3>
    <p>不会。记录只保存在当前浏览器，不能自动同步到其他设备或不同域名的网站。建议定期下载「全部记录」的 Excel 备份；Excel 既可查看、分享，也可导回恢复账目。</p>
    <h3>换手机或清除浏览器数据前怎么办？</h3>
    <p>先在「导出／分享」选择「全部记录」，下载完整账本 Excel 并确认文件已保存；到新设备打开账本后，再从「导入备份」选择这个文件导入恢复。</p>
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
    )}</div>${button("install", "添加到手机主屏幕", `class="install-entry" ${isInstalled() ? "hidden" : ""}`)}<small class="install-tip">添加后，使用「生活账本」就更方便。</small>${currentMonthCard()}${safetyNote("数据安全说明", "OpenAA 重视用户隐私与数据安全。本工具不会上传、存储或同步任何记录到服务器，所有数据仅保存在您当前使用的浏览器中。清理缓存、清除网站数据、重装浏览器或更换设备前，请先下载 Excel 备份。Excel 用于查看、打印和恢复账目。")}<p class="storage-note">账目仅保存在当前浏览器。清除网站数据或换手机前，请先下载备份。 <a href="./guide/">使用说明</a></p>${modeSwitcher()}${ledgerFaq()}`;
}
const input = (name, label, type, value, extra = "") =>
  `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" ${extra}></label>`;
function currentMonthCard() {
  const month = today().slice(0, 7);
  const rows = load(kind).filter(row => row.date.startsWith(month));
  if (!rows.length)
    return `<section><h2>本月数据</h2><p class="panel month-empty">本月暂无记录，<button type="button" class="month-add" data-action="month-add">去记一笔</button></p></section>`;
  const recent = rows
    .map((row, index) => [row, index])
    .sort((a, b) => b[0].date.localeCompare(a[0].date) || b[1] - a[1])
    .slice(0, 3)
    .map(([row]) => row);
  return `<section><h2>本月数据</h2>${statGrid(stats(kind, rows))}<h3>本月最近三笔</h3><section class="panel list">${details(recent, false)}</section></section>`;
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
function details(rows, withActions = true) {
  return rows
    .map(
      (r) =>
        `<article class="record"><div><b>${escape(r.category || (kind === "remittance" ? (r.type === "subtract" ? "汇款冲正" : "汇款") : r.method === "cash" ? "现金收入" : "银行卡收入"))}</b><span>${money(r.amount)}</span></div><small>${escape(r.date)} · ${kind === "remittance" ? money(r.cny, "¥") + " · 汇率 " + r.rate.toFixed(3) : r.method === "cash" ? "现金" : "银行卡"}</small>${r.note ? `<p>${escape(r.note)}</p>` : ""}${withActions ? `<footer>${button("edit", "编辑", `data-id="${escape(r.id)}"`)}${button("delete", "删除", `data-id="${escape(r.id)}"`)}</footer>` : ""}</article>`,
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
  const clearTarget = overview ? "all" : kind;
  return `<h1>${overview ? "收支总览" : names[kind]}导出／分享</h1>
  ${safetyNote("数据保存说明", "数据仅保存在当前浏览器。清除网站数据、换浏览器或换手机前，请先选择「全部记录」，下载完整账本 Excel，以便恢复账目。")}
  ${nav({ current, all: "全部记录" }, "scope", scope, "导出范围")}
  <section class="panel"><h2>汇总文字</h2>${emptyMessage ? `<p>${escape(emptyMessage)}</p>` : button("copy", "复制" + escape(title))}</section>
  <section class="panel"><h2>Excel 表格</h2><p>${all ? "一份 Excel 包含收支汇总、月度汇总、年度汇总，以及开支、收入、汇款各自的汇总、明细、月度和年度汇总，与 OpenAA 账号版账本格式相同，可互相导入。" : overview ? "逐年列出收支和结余，末行列出全部年份合计。" : "包含本账本全部年份的汇总、逐笔明细、月度汇总和年度汇总。"}</p><div class="controls">${button("excel", "下载" + fileLabel + " Excel")}${button("shareExcel", "分享" + fileLabel + " Excel")}</div></section>
  <section class="panel"><h2>Excel 记账模板</h2><p>空白模板，第一张表是填写说明。在 Excel 里填好后，回到这里展开「导入备份」，选择填好的文件即可导入。</p><div class="controls">${button("template", "下载记账模板")}${button("shareTemplate", "分享记账模板")}</div></section>
  <details class="panel import-fold" ${preview ? "open" : ""}><summary>导入备份</summary><label class="file">选择 Excel 文件<input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label>${preview ? importPanel() : ""}${restorableBooks().map(k => button("restore", "恢复" + names[k] + "导入前的记录", `data-restore="${k}"`)).join("")}</details>
  ${!overview || all ? `<div class="clear-section">${button("clear", overview ? "清空三个账本" : "清空" + names[kind] + "记录", `data-clear="${clearTarget}" class="clear-entry"`)}</div>` : ""}`;
}
function showNotice({ title, body }) {
  const dialog = document.createElement("dialog");
  dialog.className = "transfer-confirm ask-confirm";
  dialog.setAttribute("aria-labelledby", "notice-title");
  dialog.innerHTML = `<h2 id="notice-title"></h2><p></p><form method="dialog" class="controls"><button value="ok" class="primary" style="flex:1" autofocus>知道了</button></form>`;
  dialog.querySelector("h2").textContent = title;
  dialog.querySelector("p").textContent = body;
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
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
  const totalCount = kinds.reduce((n, k) => n + initial[k].length, 0);
  if (!totalCount) {
    showNotice({
      title: "暂无" + (target === "all" ? "记录" : names[target] + "记录"),
      body: "当前没有任何记录，无需清空。",
    });
    return;
  }
  dialog.innerHTML = `<h2 id="clear-title">清空${target === "all" ? "三个账本" : names[target] + "记录"}？</h2><p>${target === "all" ? `将删除此浏览器中全部年份的记录，共 ${totalCount} 笔（${counts(initial)}）。` : `将删除此浏览器中全部年份的${names[target]}记录，共 ${initial[target].length} 笔。其他账本保留。`}对应的导入前记录也会删除。清空后无法撤销。建议先下载 Excel 备份，并确认文件已保存。</p><button type="button" class="clear-download" data-download>下载备份</button><p role="status"></p><form method="dialog" class="clear-actions"><button autofocus value="cancel" class="clear-cancel">取消</button><button class="clear-confirm" value="clear">确认清空</button></form>`;
  dialog.querySelector("[data-download]").onclick = guarded(() => {
    download(
      target === "all"
        ? reportXlsx("all", readBooks())
        : reportXlsx(target, { [target]: load(target) }),
      "OpenAA-" +
        (target === "all" ? "完整账本" : names[target] + "记录") +
        "-" +
        today() +
        ".xlsx",
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
  return `<section class="panel" id="import-preview"><h2>Excel 导入预览</h2><p>${escape(preview.filename)}</p><p>${counts(preview.books)}</p><p>合并会保留已有记录，并按记录编号跳过重复；覆盖只替换文件中包含的账本，其他账本不动。${preview.partial ? "这是分卷文件，请逐个用合并导入。" : ""}</p><div class="controls">${button("merge", "合并导入")}${button("replace", "覆盖导入")}${button("abort", "取消")}</div></section>`;
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
    root.innerHTML = `<section class="panel"><h1>${label}账本读取失败</h1><p>原始数据已保留。可以先下载原始数据，再选择 Excel 备份恢复这个账本。</p><button type="button" data-raw>下载原始数据</button><label>从 Excel 备份恢复<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-recover></label></section>`;
    root.querySelector("[data-raw]").onclick = () => download(new Blob([error.raw]), label + "-原始数据.json");
    root.querySelector("[data-recover]").onchange = guarded(async event => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 16 * 1024 * 1024) throw Error("文件超过 16 MB。");
      const parsed = await parseLedgerXlsx(await file.arrayBuffer());
      const rows = parsed.books[error.kind];
      if (!rows) throw Error("请选择包含" + label + "记录的 Excel 文件。");
      if (
        !(await askConfirm({
          title: "恢复" + label + "账本？",
          body: "将用文件中的 " + rows.length + " 笔记录替换当前" + label + "账本。",
          confirmLabel: "恢复",
          danger: true,
        }))
      )
        return;
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
function askConfirm({ title, body, confirmLabel, danger = false }) {
  const dialog = document.createElement("dialog");
  dialog.className = "transfer-confirm ask-confirm";
  dialog.setAttribute("aria-labelledby", "ask-confirm-title");
  dialog.innerHTML = `<h2 id="ask-confirm-title"></h2><p></p><form method="dialog" class="controls"><button value="cancel" autofocus>取消</button><button value="ok" class="${danger ? "danger" : "primary"}"></button></form>`;
  dialog.querySelector("h2").textContent = title;
  dialog.querySelector("p").textContent = body;
  dialog.querySelector('[value="ok"]').textContent = confirmLabel;
  document.body.append(dialog);
  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        const accepted = dialog.returnValue === "ok";
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
    if (
      unusualExpense &&
      !(await askConfirm({
        title: "金额超出常用范围",
        body: "金额或汇率超出常用范围，是否仍然保存？",
        confirmLabel: "仍然保存",
      }))
    )
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
        throw new Error("文件超过 " + limit + " MB。");
      const parsed = await parseLedgerXlsx(await file.arrayBuffer());
      if (
        current !== kind ||
        scope !== initialScope ||
        page !== "export" ||
        field.files[0] !== file ||
        !field.isConnected
      )
        return;
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
    if (a === "delete") {
      const row = load(kind).find((r) => r.id === id);
      const tag =
        kind === "remittance"
          ? row?.type === "subtract"
            ? "冲正"
            : "汇出"
          : row?.category || "";
      const summary = row
        ? [row.date, money(Math.abs(row.amount)), tag, row.note || ""]
            .filter(Boolean)
            .join(" · ")
        : "";
      if (
        !(await askConfirm({
          title: "删除这笔" + names[kind] + "？",
          body: (summary ? summary + "。" : "") + "删除后无法撤销。",
          confirmLabel: "删除",
          danger: true,
        }))
      )
        return;
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
    if (["excel", "shareExcel", "template", "shareTemplate"].includes(a)) {
      const isTemplate = a.toLowerCase().includes("template"),
        target = scope === "all" ? "all" : kind;
      const { fileLabel } = exportInfo();
      const blob = isTemplate
        ? templateXlsx()
        : reportXlsx(target, target === "all" || target === "summary" ? readBooks() : { [target]: load(target) });
      const filename = isTemplate
        ? "OpenAA-记账模板-" + today() + ".xlsx"
        : "OpenAA-" +
          (target === "all"
            ? "完整账本"
            : target === "summary"
              ? "收支总览"
              : names[target] + "记录") +
          "-" +
          today() +
          ".xlsx";
      if (a.startsWith("share"))
        await shareFileOrDownload(blob, filename, isTemplate ? "记账模板" : fileLabel, download);
      else {
        download(blob, filename);
        showFeedback("已开始下载");
      }
      return;
    }
    if (a === "restore") {
      if (
        !(await askConfirm({
          title: "恢复" + names[b.dataset.restore] + "账本？",
          body: "将把" + names[b.dataset.restore] + "账本恢复到上次导入前的状态，导入后新增或修改的记录会被替换。",
          confirmLabel: "恢复",
          danger: true,
        }))
      )
        return;
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
      if (preview.partial && a === "replace")
        throw new Error("分卷文件请用合并导入。");
      if (
        a === "replace" &&
        !(await askConfirm({
          title: "覆盖导入？",
          body: `将用「${preview.filename}」覆盖文件中包含的账本（${counts(preview.books)}）。覆盖后无法撤销。`,
          confirmLabel: "覆盖导入",
          danger: true,
        }))
      )
        return;
      const before = JSON.stringify(readBooks());
      importExcelBooks(preview.books, a, preview.blankIds);
      const changed = JSON.stringify(readBooks()) !== before;
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
