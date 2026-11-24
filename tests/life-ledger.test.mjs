import test from "node:test";
import assert from "node:assert/strict";
import {
  backup,
  normalize,
  totals,
  save,
  load,
  importRows,
  mergeRows,
  restore,
  readBooks,
  balances,
  clearBooks,
  reportXlsx,
  templateXlsx,
  parseLedgerXlsx,
  importExcelBooks,
  checkEdit,
} from "../src/lib/ledger.js";
import { makeWorkbook } from "../src/lib/ledger-workbook.js";
const expense = {
  id: "x",
  date: "2026-11-20",
  method: "cash",
  category: "餐饮",
  amount: 0.1,
  note: "午餐",
};
const remit = {
  id: "r",
  date: expense.date,
  amount: 100,
  rate: 7.155,
  cny: 715.47,
  note: "",
};
const remitBack = { ...remit, id: "r2", amount: -50, cny: -350, rate: 7, type: "subtract" };
function mockStorage(failKey = "") {
  const m = new Map();
  globalThis.localStorage = {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      if (k === failKey) throw Error("quota");
      m.set(k, v);
    },
    removeItem: (k) => m.delete(k),
  };
  return m;
}
const byId = (rows) => [...rows].sort((a, b) => a.id.localeCompare(b.id));

test("strict dates, cents and weighted exchange", () => {
  assert.throws(() => normalize("expense", { ...expense, date: "2026-02-30" }));
  assert.equal(
    totals("expense", [expense, { ...expense, amount: 0.2 }]).usd,
    0.3,
  );
  assert.equal(
    totals("remittance", [remit, { ...remit, amount: 200, cny: 1400 }]).rate,
    211547 / 30000,
  );
  assert.throws(() => backup("expense", [{ ...expense, id: undefined }]), /编号/);
});

test("merge, overwrite, undo, independent books", () => {
  mockStorage();
  save("expense", [expense]);
  save("remittance", [remit]);
  importRows("expense", [expense, { ...expense, id: "y" }]);
  assert.equal(load("expense").length, 2);
  importRows("expense", [], "replace");
  assert.equal(load("expense").length, 0);
  assert.equal(restore("expense").length, 2);
  assert.equal(load("remittance").length, 1);
});

test("export layout matches the account ledger: sheet sets and order", async () => {
  const books = {
    expense: [expense],
    income: [{ ...expense, id: "i", date: "2025-12-31", amount: 438 }],
    remittance: [remit],
  };
  const xml = async (blob) => new TextDecoder().decode(await blob.arrayBuffer());
  const sheetNames = (text) => [...text.matchAll(/<sheet name="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(sheetNames(await xml(reportXlsx("expense", books))), [
    "开支汇总", "开支月度汇总", "开支年度汇总", "开支明细",
  ]);
  assert.deepEqual(sheetNames(await xml(reportXlsx("all", books))), [
    "收支汇总", "月度汇总", "年度汇总",
    "开支汇总", "开支月度汇总", "开支年度汇总", "开支明细",
    "收入汇总", "收入月度汇总", "收入年度汇总", "收入明细",
    "汇款汇总", "汇款月度汇总", "汇款年度汇总", "汇款明细",
  ]);
  assert.deepEqual(sheetNames(await xml(reportXlsx("summary", books))), ["收支汇总"]);
  const summary = await xml(reportXlsx("summary", books));
  assert.ok(summary.includes("<v>337.9</v>"));
  assert.ok(summary.includes("<v>715.47</v>"));
  assert.ok(summary.includes("全部年份合计"));
  assert.deepEqual(sheetNames(await xml(templateXlsx())), [
    "填写说明", "开支明细", "收入明细", "汇款明细",
  ]);
});

test("Excel round trip preserves records, including remittance reversal", async () => {
  const books = {
    expense: [expense],
    income: [{ ...expense, id: "i", amount: 5000 }],
    remittance: [remit, remitBack],
  };
  const parsed = await parseLedgerXlsx(
    new Uint8Array(await reportXlsx("all", books).arrayBuffer()),
  );
  assert.equal(parsed.partial, false);
  for (const kind of ["expense", "income", "remittance"])
    assert.deepEqual(
      byId(parsed.books[kind]),
      byId(backup(kind, books[kind]).records),
    );
  const back = parsed.books.remittance.find((r) => r.id === "r2");
  assert.equal(back.type, "subtract");
  assert.equal(back.amount, -50);
  assert.equal(back.cny, -350);
});

test("same-day records export newest first", async () => {
  const first = { ...expense, id: "first", note: "先记" };
  const second = { ...expense, id: "second", note: "后记" };
  const xml = await reportXlsx("expense", { expense: [first, second] }).text();
  assert.ok(xml.indexOf("后记") < xml.indexOf("先记"));
  const parsed = await parseLedgerXlsx(
    new Uint8Array(await reportXlsx("expense", { expense: [first, second] }).arrayBuffer()),
  );
  assert.deepEqual(parsed.books.expense.map((r) => r.id), ["second", "first"]);
});

test("template parses empty; filled template rows dedupe on re-import", async () => {
  mockStorage();
  const empty = await parseLedgerXlsx(
    new Uint8Array(await templateXlsx().arrayBuffer()),
  );
  assert.deepEqual(empty.books, { expense: [], income: [], remittance: [] });
  const filled = makeWorkbook([
    {
      name: "开支明细",
      rows: [
        ["日期", "美元", "收付方式", "分类", "汇款类型", "汇率", "人民币", "备注", "记录编号", "版本"],
        ["2026-11-21", 12.5, "现金", "餐饮", "", "", "", "手填", "", ""],
      ],
    },
  ]);
  const parsed = await parseLedgerXlsx(
    new Uint8Array(await filled.arrayBuffer()),
  );
  assert.equal(parsed.books.expense.length, 1);
  assert.equal(parsed.blankIds.size, 1);
  importExcelBooks(parsed.books, "merge", parsed.blankIds);
  importExcelBooks(parsed.books, "merge", parsed.blankIds);
  assert.equal(load("expense").length, 1);
  assert.equal(load("expense")[0].note, "手填");
});

test("Excel import validates rows and rejects bad remittance rates", async () => {
  const bad = makeWorkbook([
    {
      name: "汇款明细",
      rows: [
        ["日期", "美元", "收付方式", "分类", "汇款类型", "汇率", "人民币", "备注", "记录编号", "版本"],
        ["2026-11-21", 100, "", "", "汇出", 0, 700, "", "z", ""],
      ],
    },
  ]);
  await assert.rejects(
    parseLedgerXlsx(new Uint8Array(await bad.arrayBuffer())),
    /第 2 行/,
  );
  await assert.rejects(
    parseLedgerXlsx(new TextEncoder().encode("not a zip")),
    /Excel/,
  );
});

test("Excel import writes roll back on quota failure; replace touches included books only", async () => {
  const books = {
    income: [{ ...expense, id: "i", amount: 5000 }],
    expense: [{ ...expense, amount: 1800 }],
    remittance: [{ ...remit, amount: 1000, cny: 7200 }],
  };
  const normalized = Object.fromEntries(
    Object.entries(books).map(([k, rows]) => [k, backup(k, rows).records]),
  );
  assert.deepEqual(balances(normalized), [5000, 1800, 3200, 1000, 2200, 7200]);
  const m = mockStorage("openaa_life_ledger_v1_remittance");
  assert.throws(() => importExcelBooks(books));
  assert.equal(m.size, 0);
  mockStorage();
  importExcelBooks(books);
  importExcelBooks(books);
  assert.deepEqual(readBooks(), normalized);
  importExcelBooks({ expense: [] }, "replace");
  assert.equal(load("expense").length, 0);
  assert.equal(load("income").length, 1);
  clearBooks(["expense"]);
  assert.throws(() => restore("expense"));
  clearBooks(["income", "remittance"]);
  assert.deepEqual(readBooks(), { expense: [], income: [], remittance: [] });
});

test("year with remittances only has a negative USD balance in summary and full export", async () => {
  const books = { expense: [], income: [], remittance: [remit] };
  const summary = await reportXlsx("summary", books).text();
  assert.ok(summary.includes('<c r="F2" s="2" t="n"><v>-100</v>'));
  assert.ok(summary.includes('<c r="G2" s="3" t="n"><v>715.47</v>'));
  const all = await reportXlsx("all", books).text();
  assert.ok(all.includes('<c r="C5" s="2" t="n"><v>-100</v>'));
  assert.ok(all.includes("<v>715.47</v>"));
});

test("duplicate import preserves undo and stale edits are rejected", () => {
  mockStorage();
  save("expense", [expense]);
  const changed = { ...expense, id: "second" };
  importRows("expense", [changed]);
  importRows("expense", [changed]);
  importExcelBooks(readBooks());
  assert.deepEqual(restore("expense"), [normalize("expense", expense)]);
  assert.throws(() => checkEdit(expense, [{ ...expense, amount: 60 }]), /另一页面/);
  assert.deepEqual(mergeRows([expense], [expense]), [normalize("expense", expense)]);
});
