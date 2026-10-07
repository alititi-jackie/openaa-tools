import { test, expect } from "./fixtures.mjs";
test("clear recent tools preserves favorites and tool data", async ({ page }) => {
  const recentKey = "openaa_tools_recent_v1";
  const preserved = {
    openaa_tools_fav_v1: '["qr-generator"]',
    openaa_expense_records_v1: '[{"id":"keep"}]',
    openaa_tools_hist_qr_generator_v1: '[{"text":"keep"}]',
  };
  await page.goto("/");
  await page.evaluate(({ recentKey, preserved }) => {
    localStorage.setItem(recentKey, JSON.stringify(["qr-generator", "real-id-checker"]));
    for (const [key, value] of Object.entries(preserved)) localStorage.setItem(key, value);
  }, { recentKey, preserved });
  await page.reload();
  await expect(page.locator("#engage-recent-grid .fav-star-btn")).toHaveCount(2);
  await page.getByRole("button", { name: "清空最近使用" }).click();
  await expect(page.locator("#engage-recent")).toBeHidden();
  await expect(page.locator("#engage-recent-grid .tool-card")).toHaveCount(0);
  await expect(page.locator("#site-status")).toHaveText("已清空最近使用");
  await page.reload();
  await expect(page.locator("#engage-fav")).toBeVisible();
  await expect(page.locator("#engage-recent")).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), recentKey)).toBeNull();
  for (const [key, value] of Object.entries(preserved)) {
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(value);
  }
  await page.goto("/tools/qr-generator/");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]"), recentKey)).toEqual(["qr-generator"]);
  await page.goto("/");
  await expect(page.locator("#engage-recent-grid .fav-star-btn")).toHaveCount(1);
});
