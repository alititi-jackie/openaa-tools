import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const guides = JSON.parse(readFileSync(new URL("../src/data/tool-guides/life-ledger.json", import.meta.url), "utf8"));

test("life ledger has ten distinct, complete SEO guides", () => {
  assert.equal(guides.length, 10);
  assert.equal(new Set(guides.map(g => g.slug)).size, 10);
  for (const guide of guides) {
    assert.deepEqual(guide.toolIds, ["life-ledger"]);
    assert.match(guide.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(guide.title.length >= 16, guide.slug);
    assert.ok(guide.description.length >= 20, guide.slug);
    assert.ok(guide.sections.length >= 5, guide.slug);
    assert.ok(guide.faq.length >= 4, guide.slug);
    assert.ok(guide.sections.every(section => section.heading && section.html.includes("<p>")), guide.slug);
    assert.ok(guide.sources.length >= 1, guide.slug);
  }
});
