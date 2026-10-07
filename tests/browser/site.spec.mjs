import { test, expect } from "./fixtures.mjs";
import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
for (const tool of catalog) {
  test("tool route " + tool.id, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const missing = [];
    page.on("response", (r) => {
      if (r.url().startsWith("http://127.0.0.1:4321") && r.status() >= 400)
        missing.push(r.url());
    });
    await page.goto(tool.path);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("header.site-header")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    if (
      tool.modules.includes("calculator") &&
      ![
        "area-code",
        "zip-code",
        "china-us-time",
        "age",
        "date-difference",
      ].includes(tool.id)
    ) {
      await page.locator("#calculate").click();
      await expect(page.locator("#result")).not.toBeEmpty();
    }
    expect(errors).toEqual([]);
    expect(missing).toEqual([]);
  });
}
test("home and catalog search", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#tool-groups .tool-card")).toHaveCount(catalog.length);
  await page.locator("#tool-search").fill("温度");
  await expect(page.locator("#tool-groups .tool-card:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await expect(page.locator("#tool-groups .tool-card:visible")).toHaveCount(
    catalog.length,
  );
  await page.locator("[data-filter=dmv]").click();
  await expect(page.locator("#tool-groups .tool-card:visible")).toHaveCount(4);
  await page.reload();
  await expect(page.locator("#tool-groups .tool-card:visible")).toHaveCount(4);
  await page.locator("#tool-search").fill("not-a-tool");
  await expect(page.locator("#empty-state")).toBeVisible();
});
test("calculator output and invalid values", async ({ page }) => {
  await page.goto("/tools/tip-calculator/");
  await page.locator("#bill").fill("100");
  await page.locator("#people").fill("2");
  await page.locator("#calculate").click();
  await expect(page.locator("#result")).toContainText("$60.00");
  await page.locator("#bill").fill("");
  await page.locator("#calculate").click();
  await expect(page.locator("#result")).toContainText("请输入");
});
test("DMV controls", async ({ page }) => {
  await page.goto("/usa/dmv/document-checker.html");
  await page.locator("[data-action=checkDmvDocs]").click();
  await expect(page.locator("#dmvResult")).toContainText("请先选择");
  for (const [value, title] of [
    ["standard", "Standard"],
    ["real", "REAL ID"],
    ["enhanced", "Enhanced"],
  ]) {
    const radio = page.locator(`input[name="docType"][value="${value}"]`);
    // Click the visible label, as users do with these custom radio cards.
    await page.locator(".doc-type-options label").filter({ has: radio }).click();
    await expect(radio).toBeChecked();
    await page.locator("[data-action=checkDmvDocs]").click();
    await expect(page.locator("#dmvResult")).toContainText(`${title} 材料清单`);
    await expect(page.locator("#dmvResult")).toContainText("6 Points");
  }
  await page.goto("/usa/dmv/real-id-checker.html");
  const checkRealIdButton = page.locator("[data-action=checkRealId]");
  await expect(checkRealIdButton).toHaveAttribute("data-ready", "true");
  await checkRealIdButton.click();
  await expect(page.locator("#realIdResult")).toContainText("你可能还缺");
});
test("network query success and failure", async ({ page }) => {
  await page.route("https://api.zippopotam.us/**", (r) =>
    r.fulfill({
      json: {
        places: [{ "place name": "New York", "state abbreviation": "NY" }],
      },
    }),
  );
  await page.goto("/tools/zip-code/");
  await page.locator("#zip").fill("10001");
  await page.locator("#calculate").click();
  await expect(page.locator("#result")).toContainText("New York");
  await page.route("https://areacode.fyi/**", (r) => r.abort());
  await page.goto("/tools/area-code/");
  await page.locator("#areaCode").fill("212");
  await page.locator("#calculate").click();
  await expect(page.locator("#result")).toContainText("查询服务暂时不可用");
});
for (const app of ["expense-record", "usd-rmb"])
  test("records round-trip " + app, async ({ page }) => {
    const expense = app === "expense-record";
    const key = expense
      ? "openaa_expense_records_v1"
      : "openaa_usd_rmb_records_v1";
    await page.goto("/usa/" + app + "/");
    await page.waitForLoadState("networkidle");
    const record = expense
      ? {
          id: "legacy",
          date: "2026-09-28",
          amount: 12.5,
          payment: "现金",
          category: "购物",
          note: "旧记录兼容",
          createdAt: "2026-09-28T10:00:00Z",
        }
      : {
          id: "legacy",
          date: "2026-09-28",
          usd: 100,
          rate: 7,
          note: "旧记录兼容",
          createdAt: "2026-09-28T10:00:00Z",
        };
    await page.evaluate(
      ({ key, record }) => localStorage.setItem(key, JSON.stringify([record])),
      { key, record },
    );
    await page.reload();
    await page.waitForLoadState("networkidle");
    if (expense) {
      await page.locator("[data-expense-goto=input]").first().click();
      await page.locator("#expenseAmount").fill("25.80");
      await page.locator("[data-payment]").first().click();
      await page.locator("[data-category]").first().click();
      await page.locator("#expenseNote").fill("浏览器测试");
      await page.locator("#expenseForm button[type=submit]").click();
    } else {
      await page.locator("[data-goto=input]").first().click();
      await page.locator("#fxUsd").fill("100");
      await page.locator("#fxRate").fill("6.70");
      await page.locator("#fxNote").fill("浏览器测试");
      await page.locator("#fxForm button[type=submit]").click();
    }
    await expect
      .poll(() =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)).length,
          key,
        ),
      )
      .toBe(2);
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key))[0].id,
        key,
      ),
    ).toBe("legacy");
    if (expense) {
      await page.locator("[data-expense-goto=export]").first().click();
      await page.locator("#expenseBackupBtn").click();
    } else {
      await page.locator("[data-goto=export]").first().click();
      await page.locator("#backupFileBtn").click();
    }
    const downloadPromise = page.waitForEvent("download");
    await page
      .locator(expense ? "#expenseDownloadBackupBtn" : "#downloadBackupBtn")
      .click();
    const download = await downloadPromise;
    const data = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    expect(data.records).toHaveLength(2);
    // Existing backup format remains accepted; clear only this isolated test context.
    await page.evaluate((key) => localStorage.removeItem(key), key);
    await page.reload();
    await page.waitForLoadState("networkidle");
    page.on("dialog", (d) =>
      d.type() === "prompt" ? d.accept("1") : d.accept(),
    );
    await page
      .locator(expense ? "#expenseImportInput" : "#importBackupInput")
      .setInputFiles({
        name: "records.backup",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(data)),
      });
    await expect
      .poll(() =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key) || "[]").length,
          key,
        ),
      )
      .toBe(2);
  });
test("offline records keep other tool caches", async ({ page, context }) => {
  await page.goto("/usa/expense-record/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await caches.open("unrelated-tool-cache");
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator("[data-expense-goto=input]").first().click();
  await expect(page.locator("#expenseForm")).toBeVisible();
  expect(await page.evaluate(() => caches.has("unrelated-tool-cache"))).toBe(
    true,
  );
  await context.setOffline(false);
});
