import { test, expect } from "./fixtures.mjs";

const expenseKey = "openaa_expense_records_v1";
const fxKey = "openaa_usd_rmb_records_v1";

// A page.click() remains pending while a native alert/prompt is open. Handle
// the dialog in parallel with the click so the browser test cannot deadlock.
async function clickAndHandleDialog(page, selector, action = "accept") {
  const dialogHandled = page.waitForEvent("dialog").then(async (dialog) => {
    const result = { type: dialog.type(), message: dialog.message() };
    if (action === "dismiss") await dialog.dismiss();
    else await dialog.accept();
    return result;
  });
  const [, result] = await Promise.all([
    page.locator(selector).click(),
    dialogHandled,
  ]);
  return result;
}

test("expense copies the chosen month with categories and a clear confirmation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedSummary = text;
        },
      },
    });
  });
  await page.goto("/usa/expense-record/");
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: "a",
          date: "2026-10-02",
          amount: 10,
          payment: "现金",
          category: "购物",
          note: "",
        },
        {
          id: "b",
          date: "2026-10-11",
          amount: 15,
          payment: "银行卡",
          category: "餐饮",
          note: "",
        },
        {
          id: "c",
          date: "2026-11-02",
          amount: 20,
          payment: "现金",
          category: "交通",
          note: "",
        },
      ]),
    );
  }, expenseKey);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator("[data-expense-goto=records]").first().click();
  await page.locator("#expenseMonthPicker").fill("2026-10");
  await page.locator("[data-expense-goto=home]:visible").first().click();
  await page.locator("[data-expense-goto=export]").first().click();
  await expect(page.locator("#expenseCopySummaryBtn")).toHaveText(
    /2026年10月汇总/,
  );
  const dialog = await clickAndHandleDialog(page, "#expenseCopySummaryBtn");
  expect(dialog.type).toBe("alert");
  expect(dialog.message).toContain("已复制");
  const copied = await page.evaluate(() => window.copiedSummary);
  expect(copied).toContain("2026年10月生活开支汇总");
  expect(copied).toContain("开支总金额：$25.00");
  expect(copied).toContain("购物：$10.00");
  expect(copied).toContain("餐饮：$15.00");
  expect(copied).not.toContain("交通：$20.00");
});

test("fx copy preserves the total summary and reports success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedSummary = text;
        },
      },
    });
  });
  await page.goto("/usa/usd-rmb/");
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: "a",
          date: "2026-11-01",
          usd: 100,
          rate: 7.2,
          cny: 720,
          type: "add",
          note: "",
        },
        {
          id: "b",
          date: "2026-11-02",
          usd: -50,
          rate: 7.2,
          cny: -360,
          type: "subtract",
          note: "",
        },
      ]),
    );
  }, fxKey);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator("[data-goto=export]").first().click();
  await expect(page.locator("#copySummaryBtn")).toHaveText(/全部汇总/);
  const dialog = await clickAndHandleDialog(page, "#copySummaryBtn");
  expect(dialog.type).toBe("alert");
  expect(await page.evaluate(() => window.copiedSummary)).toContain(
    "美金净金额：$50.00",
  );
});

test("clipboard denial never claims success and offers manual text", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    });
    document.execCommand = () => false;
  });
  await page.goto("/usa/expense-record/");
  await page.waitForLoadState("networkidle");
  await page.locator("[data-expense-goto=export]").first().click();
  const dialog = await clickAndHandleDialog(
    page,
    "#expenseCopySummaryBtn",
    "dismiss",
  );
  expect(dialog.type).toBe("prompt");
  expect(dialog.message).toContain("手动复制");
  await expect(page.locator("#site-status")).toHaveText(
    "自动复制失败，请手动复制",
  );
});

for (const [name, path, dateSelector] of [
  ["expense", "/usa/expense-record/", "#expenseDate"],
  ["fx", "/usa/usd-rmb/", "#fxDate"],
]) {
  test(`${name} form fits narrow screens and shows the shared share-card arrow`, async ({
    page,
  }) => {
    for (const width of [320, 375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(
        page.locator(
          name === "fx" ? ".fx-share-arrow" : ".expense-share-arrow",
        ),
      ).toHaveCount(1);
      await page
        .locator(
          name === "fx" ? "[data-goto=input]" : "[data-expense-goto=input]",
        )
        .first()
        .click();
      const dateBox = await page.locator(dateSelector).boundingBox();
      const formBox = await page
        .locator(name === "fx" ? "#fxForm" : "#expenseForm")
        .boundingBox();
      expect(dateBox.x).toBeGreaterThanOrEqual(formBox.x);
      expect(dateBox.x + dateBox.width).toBeLessThanOrEqual(
        formBox.x + formBox.width + 1,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
  });
}
