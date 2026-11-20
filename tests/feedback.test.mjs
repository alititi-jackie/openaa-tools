import assert from "node:assert/strict";
import { test } from "node:test";
import { copyText } from "../src/lib/feedback.js";

function setupClipboard({ writeText, commandResult = true }) {
  const state = { copied: "", selected: false, removed: false, focused: false };
  const area = {
    value: "",
    style: {},
    readOnly: false,
    setAttribute() {},
    focus() {
      state.focused = true;
    },
    select() {
      state.selected = true;
    },
    setSelectionRange() {},
    remove() {
      state.removed = true;
    },
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { clipboard: writeText ? { writeText } : undefined },
  });
  globalThis.document = {
    activeElement: { isConnected: true, focus() {} },
    createElement: () => area,
    body: { appendChild() {} },
    execCommand: () => {
      state.copied = area.value;
      return commandResult;
    },
  };
  return state;
}

test("modern clipboard copies without using the fallback", async () => {
  let copied;
  const state = setupClipboard({
    writeText: async (value) => {
      copied = value;
    },
  });
  assert.equal(await copyText("美金金额：$20.00"), true);
  assert.equal(copied, "美金金额：$20.00");
  assert.equal(state.focused, false);
});

test("missing clipboard API falls back to selected text", async () => {
  const state = setupClipboard({});
  assert.equal(await copyText("生活开支汇总"), true);
  assert.equal(state.copied, "生活开支汇总");
  assert.equal(state.selected, true);
  assert.equal(state.removed, true);
});

test("denied clipboard uses fallback but does not report false success", async () => {
  const state = setupClipboard({
    writeText: async () => {
      throw new Error("Permission denied");
    },
    commandResult: false,
  });
  assert.equal(await copyText("复制失败内容"), false);
  assert.equal(state.copied, "复制失败内容");
  assert.equal(state.removed, true);
});
