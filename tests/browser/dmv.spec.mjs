import { test, expect } from "./fixtures.mjs";
import fs from "node:fs";
const paths = [
  "6-points-calculator",
  "real-id-checker",
  "real-id-vs-standard-vs-enhanced",
  "document-checker",
];
test("four tools share exactly ordered navigation and ten guides", async ({
  page,
}) => {
  for (const id of paths) {
    await page.goto(`/usa/dmv/${id}.html`);
    const nav = page.getByRole("navigation", { name: "DMV 工具分类导航" });
    await expect(nav.locator("a")).toHaveText([
      "首页",
      "① 6 Points",
      "② REAL ID 检查",
      "③ 我能办哪种",
      "④ 材料清单",
      "模拟考试 ↗",
    ]);
    await expect(nav.locator("[aria-current=page]")).toHaveAttribute(
      "href",
      `/usa/dmv/${id}.html`,
    );
    await expect(
      page.locator(".related-tools").first().locator("a"),
    ).toHaveCount(10);
  }
});
test("simultaneous eligibility results distinguish documents and citizen status", async ({
  page,
}) => {
  await page.goto("/usa/dmv/real-id-vs-standard-vs-enhanced.html");
  const fill = async (values) => {
    for (const [n, v] of Object.entries(values))
      await page
        .locator(`input[name="${n}"][value="${v}"]`)
        .evaluate((e) => e.click());
    await page.locator("#ridChoose").click();
  };
  await fill({
    purpose: "license",
    citizen: "no",
    identity: "green",
    sixpoints: "yes",
    dob: "yes",
    ssn: "number",
    residency: "1",
    documents: "yes",
  });
  await expect(page.locator('[data-eligibility="Standard"]')).toContainText(
    "✅ 基本符合",
  );
  await expect(page.locator('[data-eligibility="REAL ID"]')).toContainText(
    "还缺1份纽约地址证明",
  );
  await expect(page.locator('[data-eligibility="Enhanced"]')).toContainText(
    "❌ 不适用",
  );
  await fill({ residency: "2" });
  await expect(page.locator('[data-eligibility="REAL ID"]')).toContainText(
    "✅ 基本符合",
  );
  await fill({ identity: "none", ssn: "never" });
  await expect(page.locator('[data-eligibility="Standard"]')).toContainText(
    "✅ 基本符合",
  );
  await expect(page.locator('[data-eligibility="REAL ID"]')).toContainText(
    "lawful status",
  );
  await fill({ purpose: "id" });
  await expect(page.locator('[data-eligibility="Standard"]')).toContainText(
    "⚠️",
  );
});
test("six points removes duplicate bank/Medicaid counting and does not demand extra once sufficient", async ({
  page,
}) => {
  await page.goto("/usa/dmv/6-points-calculator.html");
  for (const id of ["foreign-passport", "bank", "debit", "credit"])
    await page.locator(`input[data-id="${id}"]`).check();
  await expect(page.locator("#dmvScore")).toHaveText("5");
  await page.locator('input[data-id="utility"]').check();
  await expect(page.locator("#dmvStatus")).toHaveText("主要文件基本齐全");
  for (const id of ["medicaid-photo", "medicaid-no-photo"])
    await page.locator(`input[data-id="${id}"]`).check();
  await expect(page.locator("#dmvScore")).toHaveText("≥6");
});
test("all forty articles have first tool CTA, visible FAQ, canonical and mobile fit", async ({
  page,
}) => {
  for (const g of JSON.parse(fs.readFileSync("src/data/seo-guides.json"))) {
    const response = await page.goto(`/usa/dmv/${g.slug}/`);
    expect(response.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(g.title);
    await expect(page.locator(".guide-tool a")).toHaveAttribute(
      "href",
      `/usa/dmv/${g.toolIds[0]}.html`,
    );
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
      "href",
      `https://tools.openaa.com/usa/dmv/${g.slug}/`,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('script[type="application/ld+json"]')
        .allTextContents(),
    ).toHaveLength(3);
  }
});
