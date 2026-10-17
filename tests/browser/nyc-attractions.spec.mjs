import { test, expect } from "./fixtures.mjs";

test("NYC address page keeps cards compact, promotes only representative brand stores, and includes Chinese-neighborhood subway stops", async ({ page }) => {
  await page.goto("/usa/nyc-attractions/");
  await expect(page.locator("#placeList .nyc-card").first()).toBeVisible();
  await page.locator('[data-category="品牌店"]').click();
  await expect(page.locator("#placeList .nyc-card")).toHaveCount(8);
  await expect(page.getByText("Apple Fifth Avenue 苹果第五大道旗舰店")).toBeVisible();
  await expect(page.getByText("Apple Grand Central 苹果中央车站店")).toHaveCount(0);
  await expect(page.getByText("Samsung Experience Store Queens Center 三星皇后中心体验店")).toBeVisible();
  await expect(page.locator(".nyc-card-actions .nyc-copy").first()).toBeVisible();
  await expect(page.locator(".nyc-card-actions a[href*='brand-stores']")).toBeVisible();

  await page.goto("/usa/brand-stores/#apple-stores");
  await expect(page.locator("#storeList .nyc-card")).toHaveCount(10);
  await expect(page.getByText("Apple Grand Central 苹果中央车站店")).toBeVisible();
  await page.locator('[data-brand="samsung"]').click();
  await expect(page.locator("#storeList .nyc-card")).toHaveCount(2);

  await page.goto("/usa/nyc-attractions/");
  await page.locator("#searchInput").fill("法拉盛");
  await expect(page.locator("#placeList .nyc-card")).toHaveCount(1);
  await expect(page.getByText("法拉盛缅街地铁站 Flushing–Main Street")).toBeVisible();
});
