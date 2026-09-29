import assert from "node:assert/strict";
import { localDate, readRecords, writeRecords } from "../src/lib/records.js";
let stored = '[{"id":"existing","amount":25}]';
let message = "";
globalThis.alert = (text) => (message = text);
globalThis.localStorage = {
  getItem: () => stored,
  setItem: (_key, value) => {
    stored = value;
  },
};
assert.equal(localDate(new Date(2026, 8, 28, 23, 45)), "2026-09-28");
assert.equal(readRecords("test")[0].id, "existing");
writeRecords("test", [{ id: "new", amount: 35 }]);
assert.equal(readRecords("test")[0].amount, 35);
stored = "{corrupt";
assert.throws(() => readRecords("test"));
assert.match(message, /无法读取/);
assert.equal(stored, "{corrupt");
localStorage.setItem = () => {
  throw new Error("QuotaExceeded");
};
assert.throws(() => writeRecords("test", []));
assert.match(message, /保存失败/);
console.log(
  "Record compatibility, corrupted storage, failed writes and local dates passed.",
);
