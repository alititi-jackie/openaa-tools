import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBackup,
  readBackupFile,
  saveImportedRecords,
  serializeBackup,
  clearRecords,
} from "../src/lib/backup.js";
import { resolveLocalTime } from "../src/lib/zoned-time.js";
import { queryError } from "../src/lib/calculators/advanced.js";
import { writeRecords } from "../src/lib/records.js";
const row = {
  id: "old",
  date: "2026-09-28",
  amount: 12.5,
  category: "购物",
  payment: "现金",
  note: '<img src=x onerror="alert(1)">',
};
test("zero and empty backups round-trip; save and merged imports enforce limits atomically", async () => {
  for (const [kind, records] of [
    ["expense", [{ ...row, amount: 0 }]],
    ["fx", [{ id: "zero", date: row.date, usd: 0, rate: 0 }]],
    ["expense", []],
    ["fx", []],
  ]) {
    const text = serializeBackup(records, kind);
    const restored = await readBackupFile(new Blob([text]), kind);
    assert.deepEqual(restored, JSON.parse(text).records);
  }
  assert.throws(() =>
    serializeBackup([{ ...row, note: "a".repeat(10001) }], "expense"),
  );
  const rows = Array.from({ length: 10000 }, (_, i) => ({
    ...row,
    id: String(i),
    note: "中".repeat(200),
  }));
  assert.throws(() => serializeBackup(rows, "expense"), /5 MB/);
  const key = "openaa_expense_records_v1";
  const data = new Map([
    [key, JSON.stringify([row])],
    [key + "_before_import", "[]"],
    ["unrelated", "keep"],
  ]);
  globalThis.localStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
  globalThis.alert = () => {};
  writeRecords(key, [{ ...row, amount: 0 }]);
  const exported = serializeBackup(JSON.parse(data.get(key)), "expense");
  saveImportedRecords(
    key,
    await readBackupFile(new Blob([exported]), "expense"),
  );
  assert.equal(JSON.parse(data.get(key))[0].amount, 0);
  const before = data.get(key);
  assert.throws(() => writeRecords(key, [{ ...row, note: "a".repeat(10001) }]));
  assert.equal(data.get(key), before);
  data.set(key, JSON.stringify([row]));
  data.set(key + "_before_import", "[]");
  assert.throws(() =>
    saveImportedRecords(
      key,
      Array.from({ length: 10001 }, (_, i) => ({ ...row, id: String(i) })),
    ),
  );
  assert.equal(data.get(key), JSON.stringify([row]));
  assert.equal(data.get(key + "_before_import"), "[]");
  const set = localStorage.setItem;
  localStorage.setItem = (k, v) => {
    if (k === key) throw Error("quota");
    set(k, v);
  };
  assert.throws(() => saveImportedRecords(key, []), /quota/);
  assert.equal(data.get(key + "_before_import"), "[]");
  localStorage.setItem = set;
  clearRecords(key);
  assert.equal(data.has(key), false);
  assert.equal(data.has(key + "_before_import"), false);
  assert.equal(data.get("unrelated"), "keep");
});
test("backup validation rejects malformed rows before saving", async () => {
  assert.equal(
    normalizeBackup({ records: [row] }, "expense")[0].note,
    row.note,
  );
  for (const rows of [
    [null],
    [{ ...row, date: "2026-02-30" }],
    [{ ...row, amount: Infinity }],
    [{ ...row, category: "unknown" }],
    [row, row],
  ])
    assert.throws(() => normalizeBackup(rows, "expense"));
  assert.throws(() =>
    normalizeBackup([{ id: "fx", date: row.date, usd: 100, rate: -1 }], "fx"),
  );
  assert.equal(
    normalizeBackup([{ id: "fx", date: row.date, usd: -100, rate: 7 }], "fx")[0]
      .type,
    "subtract",
  );
  await assert.rejects(
    readBackupFile({ size: 6 * 1024 * 1024 }, "expense"),
    /5 MB/,
  );
});
test("import saves recovery snapshot and does not replace records if snapshot fails", () => {
  const data = new Map([["test", JSON.stringify([row])]]);
  globalThis.localStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
  saveImportedRecords("test", [{ ...row, id: "new" }]);
  assert.equal(JSON.parse(data.get("test_before_import"))[0].id, "old");
  assert.equal(JSON.parse(data.get("test"))[0].id, "new");
  localStorage.setItem = () => {
    throw Error("quota");
  };
  assert.throws(() => saveImportedRecords("test", []));
  assert.equal(JSON.parse(data.get("test"))[0].id, "new");
});
test("DST gaps and repeated hours handled in all four US zones", () => {
  for (const zone of [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
  ]) {
    assert.equal(resolveLocalTime("2026-03-08T02:30", zone).length, 0);
    const repeated = resolveLocalTime("2026-11-01T01:30", zone);
    assert.equal(repeated.length, 2);
    assert.equal(repeated[1] - repeated[0], 3600000);
    assert.equal(resolveLocalTime("2026-09-28T12:00", zone).length, 1);
  }
  assert.equal(
    new Date(
      resolveLocalTime("2026-01-01T12:00", "America/New_York")[0],
    ).toISOString(),
    "2026-01-01T17:00:00.000Z",
  );
  assert.equal(
    resolveLocalTime("2026-02-30T12:00", "America/New_York").length,
    0,
  );
});
test("query failures distinguish absent data from unavailable service", () => {
  assert.match(queryError({ status: 404 }, "区号"), /没有找到/);
  assert.match(queryError({ status: 500 }, "区号"), /暂时不可用/);
  assert.match(queryError({ status: 429 }, "区号"), /过于频繁/);
  assert.match(queryError({ name: "AbortError" }, "区号"), /超时/);
});
