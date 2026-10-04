import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const origin = process.env.PRODUCTION_URL || "https://tools.openaa.com";
const expected = process.env.GITHUB_SHA;
const guides = JSON.parse(fs.readFileSync("src/data/seo-guides.json", "utf8"));
const tools = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8")).filter(
  (t) => t.category === "dmv",
);
// Pages/CDN publication can lag the successful deploy operation. Poll the real release, bounded to 2 minutes.
let release;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const response = await fetch(
      `${origin}/release.json?verify=${expected || Date.now()}`,
      { cache: "no-store" },
    );
    assert.equal(response.status, 200);
    release = await response.json();
    if (!expected || release.commit === expected) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 10000));
}
assert.ok(release, "Production release.json unavailable");
if (expected)
  assert.equal(
    release.commit,
    expected,
    "Production commit differs from deployed commit",
  );
assert.equal(release.guides, 40);
const urls = [
  ...tools.map((t) => t.path),
  ...guides.map((g) => `/usa/dmv/${g.slug}/`),
];
const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
for (const path of urls) {
  const r = await fetch(origin + path);
  assert.equal(r.status, 200, path);
  const html = await r.text();
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path);
  assert.ok(html.includes(`href="${origin}${path}"`), `canonical ${path}`);
  assert.ok(sitemap.includes(origin + path), `sitemap ${path}`);
  assert.ok(!html.includes("Site Unavailable"), path);
}
const robots = await (await fetch(`${origin}/robots.txt`)).text();
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const notfound = await fetch(`${origin}/usa/dmv/this-page-must-not-exist/`);
assert.equal(notfound.status, 404, "unknown article must be HTTP 404");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [],
      missing = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.url().startsWith(origin) && r.status() >= 400)
        missing.push(r.url());
    });
    for (const t of tools) {
      await page.goto(origin + t.path);

      if (t.id === "6-points-calculator") {
        await page.locator('input[data-id="foreign-passport"]').check();
        await page.locator('input[data-id="bank"]').check();
        await page.locator('input[data-id="utility"]').check();
        assert.equal(await page.locator("#dmvScore").textContent(), "6");
      }
      if (t.id === "real-id-checker") {
        await page
          .locator("[data-action=checkRealId][data-ready=true]")
          .waitFor();
        for (const [name, value] of Object.entries({
          sixpoints: "yes",
          identity: "yes",
          ssn: "number",
          residency: "2",
        }))
          await page
            .locator(`label:has(input[name="${name}"][value="${value}"])`)
            .click();
        await page.locator("[data-action=checkRealId]").click();
        assert.match(
          await page.locator("#realIdResult").innerText(),
          /主要条件基本满足/,
        );
      }
      if (t.id === "document-checker") {
        await page
          .locator("[data-action=checkDmvDocs][data-ready=true]")
          .waitFor();
        for (const value of ["standard", "real", "enhanced"]) {
          await page
            .locator(`label:has(input[name="docType"][value="${value}"])`)
            .click();
          await page.locator("[data-action=checkDmvDocs]").click();
          assert.match(
            await page.locator("#dmvResult").innerText(),
            /材料清单/,
          );
        }
      }
      assert.deepEqual(
        await page.locator(".dmv-tool-nav a").allTextContents(),
        [
          "首页",
          "① 6 Points",
          "② REAL ID 检查",
          "③ 我能办哪种",
          "④ 材料清单",
          "模拟考试 ↗",
        ],
      );
      assert.equal(
        await page
          .locator(".dmv-tool-nav [aria-current=page]")
          .getAttribute("href"),
        t.path,
      );
      assert.equal(
        await page.locator(".related-tools").first().locator("a").count(),
        10,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    await page.goto(origin + "/usa/dmv/real-id-vs-standard-vs-enhanced.html");
    await page.locator("#ridChoose[data-ready=true]").waitFor();
    const selections = {
      purpose: "license",
      citizen: "no",
      identity: "green",
      sixpoints: "yes",
      dob: "yes",
      ssn: "number",
      residency: "1",
      documents: "yes",
    };
    for (const [n, v] of Object.entries(selections))
      await page.locator(`label:has(input[name="${n}"][value="${v}"])`).click();
    await page.locator("#ridChoose").click();
    assert.match(
      await page.locator('[data-eligibility="Standard"]').innerText(),
      /✅ 基本符合/,
    );
    assert.match(
      await page.locator('[data-eligibility="REAL ID"]').innerText(),
      /还缺1份纽约地址证明/,
    );
    assert.match(
      await page.locator('[data-eligibility="Enhanced"]').innerText(),
      /❌ 不适用/,
    );
    for (const g of guides) {
      await page.goto(`${origin}/usa/dmv/${g.slug}/`);
      assert.equal(await page.locator("h1").textContent(), g.title);
      assert.equal(
        await page.locator(".guide-tool a").getAttribute("href"),
        `/usa/dmv/${g.toolIds[0]}.html`,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    await page.close();
    console.log(
      `Production browser ${width}px: four tools, forty guides, eligibility, navigation and assets passed.`,
    );
  }
} finally {
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      status: "passed",
      origin,
      commit: release.commit,
      tools: 4,
      guides: 40,
      checkedUrls: 44,
      viewports: [390, 1280],
    },
    null,
    2,
  ),
);
