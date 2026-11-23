import { test, expect } from "./fixtures.mjs";

test("ledger modes stay on one row, persist, and restore full navigation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 680 });
  await page.goto("/usa/life-ledger/");
  const selector = page.locator(".ledger-mode [data-display-mode]");
  await expect(selector).toHaveCount(4);
  await expect(page.locator('[data-display-mode="full"]')).toHaveAttribute("aria-pressed", "true");
  const rects = await selector.evaluateAll(items => items.map(item => {
    const r = item.getBoundingClientRect();
    return { top: r.top, left: r.left, right: r.right };
  }));
  expect(rects.every(r => Math.abs(r.top - rects[0].top) <= 1)).toBe(true);
  expect(rects[3].right).toBeLessThanOrEqual(320);
  await expect(page.locator("#ledger .book button")).toHaveCount(4);

  for (const [mode, heading] of [
    ["expense", "开支账本"],
    ["income", "收入账本"],
    ["remittance", "汇款账本"],
  ]) {
    await page.locator('[data-display-mode="' + mode + '"]').click();
    await expect(page.locator(".ledger-content h1").first()).toHaveText(heading);
    await expect(page.locator("#ledger .book")).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-display-mode="' + mode + '"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".ledger-content h1").first()).toHaveText(heading);
  }

  await page.locator('[data-display-mode="full"]').click();
  await expect(page.locator("#ledger .book button")).toHaveCount(4);
  await expect(page.locator(".ledger-content h1").first()).toHaveText("汇款账本");
  await page.locator('[data-book="income"]').click();
  await expect(page.locator(".ledger-content h1").first()).toHaveText("收入账本");
  await expect(page.locator(".ledger-related .related-guides-list a")).toHaveCount(10);
});
