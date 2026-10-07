import { test, expect } from "./fixtures.mjs";
import fs from "node:fs";

const catalog = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
const order = ["usa", "life", "image", "dmv", "auto", "convert", "finance"];
test("homepage groups all tools in the requested order", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator("[data-group]")).toHaveCount(7);
  expect(
    await page
      .locator("[data-group]")
      .evaluateAll((groups) => groups.map((g) => g.dataset.group)),
  ).toEqual(order);
  const counts = order.map(
    (category) => catalog.filter((tool) => tool.category === category).length,
  );
  for (let i = 0; i < order.length; i++) {
    await expect(
      page.locator(`[data-group=${order[i]}] .tool-card`),
    ).toHaveCount(counts[i]);
    await expect(
      page.locator(`[data-group=${order[i]}] [data-group-count]`),
    ).toHaveText(counts[i] + " 个工具");
  }
  await expect(page.locator("#tool-groups .tool-card")).toHaveCount(catalog.length);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("grouped-home.png") });
  await page.locator("[data-filter=usa]").click();
  await expect(page.locator("[data-group]:visible")).toHaveCount(1);
  await expect(page).toHaveURL(/\/\?category=usa$/);
  await page.reload();
  await expect(page.locator("[data-group]:visible")).toHaveAttribute(
    "data-group",
    "usa",
  );
  await page.locator("[data-filter=all]").click();
  await expect(page.locator("[data-group]:visible")).toHaveCount(7);
});
test("search keeps matching groups and returns from a tool with state intact", async ({
  page,
}) => {
  await page.goto("/?category=convert&q=%E6%B8%A9%E5%BA%A6");
  await expect(page.locator("#tool-search")).toHaveValue("温度");
  await expect(page.locator("[data-group]:visible")).toHaveCount(1);
  await expect(
    page.locator("[data-group=convert] [data-group-count]"),
  ).toHaveText("1 个工具");
  await page.locator('a[href="/tools/temperature/"]').click();
  await page.locator("[data-go-back]").click();
  await expect(page.locator("#tool-search")).toHaveValue("温度");
  await expect(page.locator("#tool-groups .tool-card:visible")).toHaveCount(1);
  await page.locator("#tool-search").fill("no-such-tool");
  await expect(page.locator("[data-group]:visible")).toHaveCount(0);
  await expect(page.locator("#empty-state")).toBeVisible();
  await page.locator("#clear-search").click();
  await expect(page.locator("[data-group]:visible")).toHaveCount(7);
  await expect(page.locator("#tool-groups .tool-card:visible")).toHaveCount(
    catalog.length,
  );
});
