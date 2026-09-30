import { test, expect } from "./fixtures.mjs";

test("share retains catalog filters but excludes unrelated query parameters", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "share", {
      value: async (data) => {
        window.shared = data;
      },
    }),
  );
  await page.goto("/?category=usa&q=记录&tracking=private");
  await page.locator("[data-share]").click();
  await expect
    .poll(() => page.evaluate(() => window.shared?.url))
    .toBe("https://tools.openaa.com/?category=usa&q=%E8%AE%B0%E5%BD%95");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://tools.openaa.com/",
  );
});

test("install prompt consumed only once across buttons and rejected prompt has accessible help", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/usa/expense-record/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    window.promptCalls = 0;
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {
      window.promptCalls++;
    };
    event.userChoice = new Promise((resolve) => {
      window.resolveChoice = resolve;
    });
    window.dispatchEvent(event);
    document.querySelector("[data-install]").click();
    document.getElementById("expenseInstallBtn").click();
  });
  expect(await page.evaluate(() => window.promptCalls)).toBe(1);
  await page.evaluate(() => window.resolveChoice({ outcome: "dismissed" }));
  await page.locator("#expenseInstallBtn").click();
  await expect(page.getByRole("dialog", { name: "添加到桌面" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#expenseInstallBtn")).toBeFocused();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {
      throw Error("unavailable");
    };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  await page.locator("[data-install]").first().click();
  await expect(page.getByRole("dialog", { name: "添加到桌面" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("header controls fit narrow screens with 44px touch targets", async ({
  page,
}) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    for (const selector of ["[data-share]", "[data-install]"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

for (const expense of [true, false]) {
  const kind = expense ? "expense" : "fx";
  const key = expense
    ? "openaa_expense_records_v1"
    : "openaa_usd_rmb_records_v1";
  const path = expense ? "/usa/expense-record/" : "/usa/usd-rmb/";
  const sheet = expense ? "#expenseBackupSheet" : "#backupActionSheet";
  test(`${kind} backup dialog traps focus, closes with Escape and clear removes recovery snapshot`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.evaluate((key) => {
      localStorage.setItem(key + "_before_import", "[]");
      localStorage.setItem("unrelated-records", "keep");
    }, key);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page
      .locator(expense ? "[data-expense-goto=export]" : "[data-goto=export]")
      .first()
      .click();
    const trigger = page.locator(
      expense ? "#expenseBackupBtn" : "#backupFileBtn",
    );
    await trigger.click();
    await expect(page.locator(sheet)).toHaveAttribute("aria-hidden", "false");
    const first = page.locator(sheet + " button").first();
    const last = page.locator(sheet + " button").last();
    await expect(first).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(sheet)).toHaveAttribute("aria-hidden", "true");
    await expect(trigger).toBeFocused();
    page.on("dialog", (d) => d.accept());
    await page.locator(expense ? "#expenseClearBtn" : "#clearDataBtn").click();
    expect(
      await page.evaluate(
        (key) => [
          localStorage.getItem(key),
          localStorage.getItem(key + "_before_import"),
          localStorage.getItem("unrelated-records"),
        ],
        key,
      ),
    ).toEqual([null, null, "keep"]);
    await trigger.click();
    await expect(page.locator(`[data-restore-import=${kind}]`)).toBeHidden();
  });
}
