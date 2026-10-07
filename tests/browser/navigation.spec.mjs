import { test, expect } from "./fixtures.mjs";
test("floating controls threshold, back history and reduced motion", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-go-back]")).toBeVisible();
  await expect(page.locator("[data-scroll-top]")).toBeHidden();
  await page.evaluate(() => scrollTo(0, 1000));
  await expect(page.locator("[data-scroll-top]")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("floating-navigation.png"),
  });
  await page.locator("[data-scroll-top]").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.locator('a[href="/tools/tip-calculator/"]').first().click();
  await expect(page.locator("[data-go-back]")).toHaveAttribute("href", "/");
  await page.locator("[data-go-back]").click();
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4321\/$/);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".floating-navigation")).toBeHidden();
});
test("invalid import preserves records and valid import can be restored", async ({
  page,
}) => {
  const key = "openaa_expense_records_v1";
  const row = {
    id: "old",
    date: "2026-09-28",
    amount: 12,
    payment: "现金",
    category: "购物",
    note: "原记录",
  };
  await page.goto("/usa/expense-record/");
  await page.evaluate(
    ({ key, row }) => localStorage.setItem(key, JSON.stringify([row])),
    { key, row },
  );
  await page.reload();
  await expect(page.locator("#expenseImportInput")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const messages = [];
  page.on("dialog", async (d) => {
    messages.push(d.message());
    if (d.type() === "prompt") await d.accept("1");
    else await d.accept();
  });
  await page.locator("#expenseImportInput").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("[null]"),
  });
  await expect.poll(() => messages.length).toBe(1);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key))[0].id,
      key,
    ),
  ).toBe("old");
  await page.locator("#expenseImportInput").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([
        { ...row, id: "new", note: '<img src=x onerror="alert(1)">' },
      ]),
    ),
  });
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))[0].id, key),
    )
    .toBe("new");
  await page.locator("[data-expense-goto=export]").first().click();
  await page.locator("#expenseBackupBtn").click();
  await expect(page.locator(".floating-navigation")).toBeHidden();
  await page.locator("[data-restore-import=expense]").click();
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))[0].id, key),
    )
    .toBe("old");
});
