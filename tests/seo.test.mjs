import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const guides = JSON.parse(fs.readFileSync("src/data/seo-guides.json"));
test("40 unique article intents and stable simple slugs; exactly ten per core tool", () => {
  assert.equal(guides.length, 40);
  assert.equal(new Set(guides.map((g) => g.slug)).size, 40);
  assert.equal(new Set(guides.map((g) => g.title)).size, 40);
  const counts = {};
  for (const g of guides) {
    counts[g.toolIds[0]] = (counts[g.toolIds[0]] || 0) + 1;
    assert.match(g.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(g.sections.length, 3);
    assert.ok(g.faq[0].answer);
  }
  assert.deepEqual(Object.values(counts), [10, 10, 10, 10]);
  for (const slug of [
    "ny-dmv-6-points",
    "chinese-passport-ny-dmv",
    "ny-dmv-no-ssn",
    "chinese-driver-license-ny",
    "ny-dmv-address-proof",
    "ny-dmv-medicaid-points",
    "ead-ny-dmv-points",
    "green-card-ny-dmv-points",
    "bank-statement-ny-dmv",
    "new-immigrant-ny-driver-license-documents",
  ])
    assert.ok(guides.some((g) => g.slug === slug));
});
