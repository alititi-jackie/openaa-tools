import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFxTarget,
  fxRoundingDifference,
  roundFx,
} from "../src/lib/fx-calculator.js";
import { normalizeBackup, serializeBackup } from "../src/lib/backup.js";

test("any two USD/RMB values calculate the third with the intended precision", () => {
  assert.equal(
    calculateFxTarget("cny", { usd: "100", rate: "7.235", cny: "" }),
    "723.50",
  );
  assert.equal(
    calculateFxTarget("rate", { usd: "100", rate: "", cny: "725" }),
    "7.250",
  );
  assert.equal(
    calculateFxTarget("usd", { usd: "", rate: "7.200", cny: "720" }),
    "100.00",
  );
  assert.equal(
    calculateFxTarget("usd", { usd: "", rate: "0", cny: "10" }),
    null,
  );
  assert.equal(
    calculateFxTarget("rate", { usd: "0", rate: "", cny: "0" }),
    null,
  );
  assert.equal(roundFx(-1.005, 2), -1.01);
});

test("amounts entered by the user are kept despite rounding the inverse rate", () => {
  assert.equal(
    calculateFxTarget("rate", { usd: "100", rate: "", cny: "725.33" }),
    "7.253",
  );
  assert.equal(
    fxRoundingDifference({ usd: "100", rate: "7.253", cny: "725.33" }),
    0.03,
  );
});

test("FX backups keep exact CNY and accept old records without CNY", () => {
  const oldRow = { id: "old", date: "2026-11-19", usd: 100, rate: 7.2345 };
  const newRow = {
    id: "new",
    date: "2026-11-19",
    usd: -100,
    rate: 7.253,
    cny: -725.33,
    type: "subtract",
  };
  const backup = JSON.parse(serializeBackup([oldRow, newRow], "fx"));
  assert.equal(backup.version, 2);
  assert.equal(backup.records[0].cny, undefined);
  assert.equal(backup.records[0].rate, 7.2345);
  assert.equal(backup.records[1].cny, -725.33);
  assert.equal(normalizeBackup(backup, "fx")[1].cny, -725.33);
  assert.throws(() =>
    normalizeBackup([{ ...newRow, cny: "not-a-number" }], "fx"),
  );
  assert.throws(() => normalizeBackup([{ ...newRow, cny: 725.33 }], "fx"));
});
