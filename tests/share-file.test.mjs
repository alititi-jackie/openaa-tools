import assert from "node:assert/strict";
import { test } from "node:test";
import { shareFileOrDownload } from "../src/lib/share-file.js";

function setup({ userAgent = "Chrome", canShare, share } = {}) {
  const state = { downloads: [], alerts: [], message: "" };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { userAgent, canShare, share },
  });
  globalThis.document = {
    getElementById: () => ({
      set textContent(value) {
        state.message = value;
      },
      classList: { add() {}, remove() {} },
    }),
  };
  globalThis.alert = (value) => state.alerts.push(value);
  state.download = (_blob, filename) => state.downloads.push(filename);
  return state;
}

test("unsupported file sharing uses download in both tools", async () => {
  const state = setup();
  await shareFileOrDownload(
    new Blob(["backup"]),
    "record.backup",
    "备份",
    state.download,
  );
  assert.deepEqual(state.downloads, ["record.backup"]);
  assert.match(state.message, /已尝试下载/);
});

test("cancelling the native share sheet does not trigger an unwanted download", async () => {
  const state = setup({
    canShare: () => true,
    share: async () => {
      throw Object.assign(new Error("cancel"), { name: "AbortError" });
    },
  });
  await shareFileOrDownload(
    new Blob(["backup"]),
    "record.backup",
    "备份",
    state.download,
  );
  assert.deepEqual(state.downloads, []);
  assert.deepEqual(state.alerts, []);
});

test("in-app WeChat browser receives the same clear download instructions", async () => {
  const state = setup({ userAgent: "MicroMessenger" });
  await shareFileOrDownload(
    new Blob(["backup"]),
    "record.backup",
    "备份",
    state.download,
  );
  assert.deepEqual(state.downloads, ["record.backup"]);
  assert.match(state.alerts[0], /Safari 或 Chrome/);
});
