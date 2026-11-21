import { makeWorkbook } from "./workbook.js";

const kinds = ["expense", "income", "remittance"];
const app = "OpenAA Life Ledger";
const legacyApps = {
  expense: "OpenAA Expense Records",
  remittance: "OpenAA USD RMB Rate Records",
};
const maxBytes = 5 * 1024 * 1024;
function check(ok, message) {
  if (!ok) throw new Error(message);
}
function key(kind) {
  check(kinds.includes(kind), "未知账本。");
  return "openaa_life_ledger_v1_" + kind;
}
function positive(value, digits, label) {
  check(
    typeof value === "number" || (typeof value === "string" && value.trim()),
    "请输入" + label,
  );
  const n = Number(value);
  const scaled = Math.round((n + Number.EPSILON) * 10 ** digits);
  check(Number.isSafeInteger(scaled) && scaled > 0, label + "必须是有效正数。");
  return scaled / 10 ** digits;
}
export function normalize(kind, r) {
  key(kind);
  const date = r?.date;
  const parsed = new Date(date + "T12:00:00Z");
  check(
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(+parsed) &&
      parsed.toISOString().slice(0, 10) === date,
    "请输入有效日期。",
  );
  const id = String(r.id ?? crypto.randomUUID());
  check(id.length > 0 && id.length <= 200, "记录编号无效。");
  const note = r.note ?? "";
  check(typeof note === "string" && note.length <= 10000, "备注格式不正确。");
  const row = { id, date, amount: positive(r.amount, 2, "美元金额"), note };
  if (kind === "remittance") {
    row.rate = positive(r.rate, 3, "汇率");
    row.cny = positive(r.cny, 2, "人民币金额");
  } else {
    check(["cash", "card"].includes(r.method), "请选择现金或银行卡。");
    row.method = r.method;
    if (kind === "expense") {
      check(
        typeof r.category === "string" &&
          r.category.trim() &&
          r.category.length <= 100,
        "请选择开支分类。",
      );
      row.category = r.category;
    }
  }
  return row;
}
export function totals(kind, rows) {
  key(kind);
  let usd = 0,
    cny = 0,
    cash = 0,
    card = 0;
  for (const row of rows) {
    const cents = Math.round(row.amount * 100);
    usd += cents;
    if (row.method === "cash") cash += cents;
    if (row.method === "card") card += cents;
    if (kind === "remittance") cny += Math.round(row.cny * 100);
  }
  return {
    usd: usd / 100,
    cny: cny / 100,
    cash: cash / 100,
    card: card / 100,
    count: rows.length,
    rate: usd ? cny / usd : 0,
  };
}
function checked(kind, records) {
  check(
    Array.isArray(records) && records.length <= 10000,
    "每本账最多 10000 条记录。",
  );
  const rows = records.map((r) => {
    check(r?.id != null, "记录缺少编号。");
    return normalize(kind, r);
  });
  check(new Set(rows.map((r) => r.id)).size === rows.length, "记录编号重复。");
  return rows;
}
export function backup(kind, rows) {
  const data = {
    app,
    version: 1,
    kind,
    exportedAt: new Date().toISOString(),
    records: checked(kind, rows),
  };
  check(new Blob([JSON.stringify(data)]).size <= maxBytes, "备份超过 5 MB。");
  return data;
}
export function detectBackup(text) {
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error("文件不是有效的 JSON 备份。"); }
  if (data?.app === app && data.kind === "all")
    return { kind: "all", books: parseFullBackup(text) };
  let kind;
  if (data?.app === app) kind = data.kind;
  else if (Array.isArray(data) && data.length) {
    const expense = data.every(r => r?.payment != null && r.category != null && r.amount != null);
    const remit = data.every(r => r?.usd != null && r.rate != null);
    if (expense !== remit) kind = expense ? "expense" : "remittance";
  } else kind = Object.keys(legacyApps).find(k => legacyApps[k] === data?.app);
  check(kinds.includes(kind), "无法识别备份类型，请选择账本导出的 JSON 文件。");
  return { kind, ...parseBackup(kind, text) };
}
export function restorableBooks() {
  return kinds.filter(k => localStorage.getItem(key(k) + "_before_import") !== null);
}
export function parseBackup(kind, input) {
  key(kind);
  const text = typeof input === "string" ? input : JSON.stringify(input);
  check(new Blob([text]).size <= maxBytes, "备份超过 5 MB。");
  const data = JSON.parse(text);
  if (data?.app === app) {
    check(data.kind === kind && data.version === 1, "备份账本或版本不匹配。");
    return { rows: checked(kind, data.records), legacy: false, skipped: 0 };
  }
  const bare = Array.isArray(data);
  check(
    kind !== "income" && (bare || data?.app === legacyApps[kind]),
    "请选择当前账本的备份。",
  );
  const records = bare ? data : data.records;
  check(Array.isArray(records) && records.length <= 10000, "备份格式无效。");
  let skipped = 0;
  const rows = [];
  for (const r of records) {
    check(r && typeof r === "object", "旧记录格式无效。");
    const id = r.id ?? "legacy-auto-" + crypto.randomUUID();
    if (kind === "expense") {
      rows.push({
        ...r,
        id,
        method: { 现金: "cash", 银行卡: "card" }[r.payment],
      });
    } else {
      check(r.usd != null && r.rate != null, "请选择汇款备份。");
      if (Number(r.usd) < 0 || r.type === "subtract") {
        skipped++;
        continue;
      }
      rows.push({
        ...r,
        id,
        amount: r.usd,
        cny: r.cny ?? Number(r.usd) * Number(r.rate),
      });
    }
  }
  return { rows: checked(kind, rows), legacy: true, skipped };
}
export function mergeRows(existing, incoming) {
  const incomingIds = new Set(incoming.map((row) => row.id));
  const existingIds = new Set(existing.map((row) => row.id));
  // Include identifiers generated by older releases for ID-less legacy rows.
  const generated = (id) => /^legacy-(auto-|(?:expense|remittance)-\d+-\d{4}-\d{2}-\d{2}$)/.test(id);
  const signature = (r) => JSON.stringify([
    r.date, r.amount, r.note, r.method, r.category, r.rate, r.cny,
  ]);
  const unmatched = new Map();
  for (const row of existing) {
    if (!generated(row.id) || incomingIds.has(row.id)) continue;
    const key = signature(row);
    unmatched.set(key, (unmatched.get(key) || 0) + 1);
  }
  const result = [...existing];
  for (const row of incoming) {
    if (existingIds.has(row.id)) continue;
    const key = signature(row);
    const count = unmatched.get(key) || 0;
    if (generated(row.id) && count) unmatched.set(key, count - 1);
    else result.push(row);
  }
  return result;
}
export function load(kind) {
  const raw = localStorage.getItem(key(kind));
  return raw === null ? [] : checked(kind, JSON.parse(raw));
}
export function save(kind, rows) {
  const records = backup(kind, rows).records;
  localStorage.setItem(key(kind), JSON.stringify(records));
  return records;
}
export function importRows(kind, rows, mode = "merge") {
  check(["merge", "replace"].includes(mode), "请选择合并或覆盖。");
  const old = load(kind);
  const next = mode === "merge" ? mergeRows(old, rows) : rows;
  const normalized = backup(kind, next).records;
  const snap = key(kind) + "_before_import";
  const prior = localStorage.getItem(snap);
  localStorage.setItem(snap, JSON.stringify(old));
  try {
    return save(kind, normalized);
  } catch (e) {
    if (prior === null) localStorage.removeItem(snap);
    else localStorage.setItem(snap, prior);
    throw e;
  }
}
export function restore(kind) {
  const snap = key(kind) + "_before_import";
  const raw = localStorage.getItem(snap);
  check(raw !== null, "没有可恢复的导入前记录。");
  const result = save(kind, JSON.parse(raw));
  localStorage.removeItem(snap);
  return result;
}
function table(kind, rows) {
  const fx = kind === "remittance",
    expense = kind === "expense";
  return [
    fx
      ? ["日期", "美元", "汇率", "人民币", "备注"]
      : ["日期", "美元", "收付方式", ...(expense ? ["分类"] : []), "备注"],
    ...[...rows]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) =>
        fx
          ? [r.date, r.amount, r.rate, r.cny, r.note]
          : [
              r.date,
              r.amount,
              r.method === "cash" ? "现金" : "银行卡",
              ...(expense ? [r.category] : []),
              r.note,
            ],
      ),
  ];
}
function grouped(kind, rows, length) {
  const groups = new Map();
  for (const row of rows) {
    const period = row.date.slice(0, length);
    if (!groups.has(period)) groups.set(period, []);
    groups.get(period).push(row);
  }
  const fx = kind === "remittance";
  const sheets = [
    [
      length === 7 ? "月份" : "年度",
      "笔数",
      "美元",
      ...(fx ? ["人民币", "平均汇率"] : ["现金", "银行卡"]),
    ],
  ];
  for (const period of [...groups.keys()].sort().reverse()) {
    const t = totals(kind, groups.get(period));
    sheets.push([
      period,
      t.count,
      t.usd,
      ...(fx ? [t.cny, Number(t.rate.toFixed(3))] : [t.cash, t.card]),
    ]);
  }
  return sheets;
}
export function xlsx(kind, rows) {
  return makeWorkbook([
    ["全部记录", table(kind, rows)],
    ["月度记录", grouped(kind, rows, 7)],
    ["年度记录", grouped(kind, rows, 4)],
  ]);
}
export function csv(kind, rows) {
  function escape(value) {
    let s = String(value);
    if (typeof value === "string" && /^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return (
    "\uFEFF" +
    table(kind, rows)
      .map((row) => row.map(escape).join(","))
      .join("\r\n")
  );
}

function mapBooks(fn) {
  return Object.fromEntries(kinds.map((kind) => [kind, fn(kind)]));
}
export function readBooks() {
  return mapBooks(load);
}
export function balances(books) {
  const { expense, income, remittance } = mapBooks((kind) =>
    totals(kind, books[kind]),
  );
  const after = Math.round(income.usd * 100) - Math.round(expense.usd * 100);
  return [
    income.usd,
    expense.usd,
    after / 100,
    remittance.usd,
    (after - Math.round(remittance.usd * 100)) / 100,
    remittance.cny,
  ];
}
export function fullBackup(books) {
  return {
    app,
    version: 1,
    kind: "all",
    exportedAt: new Date().toISOString(),
    books: mapBooks((kind) => backup(kind, books[kind]).records),
  };
}
export function parseFullBackup(input) {
  const text = typeof input === "string" ? input : JSON.stringify(input);
  check(new Blob([text]).size <= 3 * maxBytes + 1024, "整本备份文件过大。");
  const data = JSON.parse(text);
  check(
    data?.app === app &&
      data.kind === "all" &&
      data.version === 1 &&
      data.books,
    "请选择整本账本备份。",
  );
  return fullBackup(data.books).books;
}
// Apply all validated writes together, restoring prior values if a quota error interrupts them.
function commitStorage(changes) {
  const undo = [];
  try {
    for (const [k, value] of changes) {
      const previous = localStorage.getItem(k);
      if (value === null) localStorage.removeItem(k);
      else localStorage.setItem(k, value);
      undo.push([k, previous]);
    }
  } catch (error) {
    for (const [k, old] of undo.reverse()) {
      if (old === null) localStorage.removeItem(k);
      else localStorage.setItem(k, old);
    }
    throw error;
  }
}
export function importBooks(books, mode = "merge") {
  check(["merge", "replace"].includes(mode), "请选择合并或覆盖。");
  const normalized = fullBackup(books).books;
  const old = readBooks();
  const next = mapBooks(
    (kind) =>
      backup(
        kind,
        mode === "merge"
          ? mergeRows(old[kind], normalized[kind])
          : normalized[kind],
      ).records,
  );
  const changes = [];
  for (const kind of kinds) {
    changes.push(
      [key(kind) + "_before_import", JSON.stringify(old[kind])],
      [key(kind), JSON.stringify(next[kind])],
    );
  }
  commitStorage(changes);
  return next;
}
export function clearBooks(selected) {
  check(Array.isArray(selected) && selected.length > 0, "请选择要清除的账本。");
  const changes = [];
  for (const kind of new Set(selected)) {
    changes.push([key(kind) + "_before_import", null], [key(kind), null]);
  }
  commitStorage(changes);
}
const bookNames = { expense: "开支", income: "收入", remittance: "汇款" };
const balanceLabels = [
  "收入（美元）",
  "开支（美元）",
  "扣除开支后剩余（美元）",
  "汇出（美元）",
  "扣除汇款后结余（美元）",
  "汇款折合人民币",
];
// Workbook style 4 is the bold red total amount style.
const amountTotal = (value) => ({ v: value, s: 4 });
function balancePeriods(books, length) {
  const groups = new Map();
  for (const kind of kinds) {
    for (const row of books[kind]) {
      const period = row.date.slice(0, length);
      if (!groups.has(period)) groups.set(period, mapBooks(() => []));
      groups.get(period)[kind].push(row);
    }
  }
  const rows = [[length === 4 ? "年度" : "月份", ...balanceLabels]];
  for (const period of [...groups.keys()].sort().reverse()) {
    rows.push([period, ...balances(groups.get(period))]);
  }
  rows.push(["全部年份合计", ...balances(books).map(amountTotal)]);
  return rows;
}
export function reportXlsx(kind, books) {
  if (kind === "summary")
    return makeWorkbook([["收支汇总", balancePeriods(books, 4)]]);
  if (kind === "all") {
    const annual = balancePeriods(books, 4);
    const sheets = [["收支总览", annual]];
    for (const k of kinds) sheets.push(...bookSheets(k, books[k]));
    sheets.push(["收支月度汇总", balancePeriods(books, 7)], ["收支年度汇总", annual]);
    return makeWorkbook(sheets);
  }
  key(kind);
  return makeWorkbook(bookSheets(kind, books[kind]));
}
function bookSheets(kind, rows) {
  const t = totals(kind, rows);
  const stats = [
    ["统计范围", "全部年份"],
    ["记录笔数", t.count],
    ["美元合计", amountTotal(t.usd)],
    ...(kind === "remittance"
      ? [
          ["人民币合计", amountTotal(t.cny)],
          ["平均汇率", +t.rate.toFixed(3)],
        ]
      : [
          ["现金", amountTotal(t.cash)],
          ["银行卡", amountTotal(t.card)],
        ]),
  ];
  const fx = kind === "remittance";
  const details = table(kind, rows);
  details.push(fx ? ["合计", amountTotal(t.usd), "", amountTotal(t.cny)] : ["合计", amountTotal(t.usd)]);
  function periods(length) {
    return [...grouped(kind, rows, length), [
      "合计", t.count, amountTotal(t.usd),
      ...(fx ? [amountTotal(t.cny), Number(t.rate.toFixed(3))] : [amountTotal(t.cash), amountTotal(t.card)]),
    ]];
  }
  const name = bookNames[kind];
  return [
    [name + "汇总", stats], [name + "明细", details],
    [name + "月度汇总", periods(7)], [name + "年度汇总", periods(4)],
  ];
}
