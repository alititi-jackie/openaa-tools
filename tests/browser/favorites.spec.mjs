import { test, expect } from "./fixtures.mjs";
import fs from "node:fs";

const tools = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
test("all catalog cards have favorites and DMV favorites persist", async ({ page }) => {
  await page.goto("/");
  // +1 为 DMV 分组首张外链推荐卡（dmv-quiz）的星标
  await expect(page.locator("#tool-groups .fav-star-btn")).toHaveCount(
    tools.length + 1,
  );
  const dmvTools = tools.filter((tool) => tool.category === "dmv");
  for (const tool of dmvTools) {
    const star = page.locator(`#tool-groups a[href="${tool.path}"] .fav-star-btn`);
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL("http://127.0.0.1:4321/");
    await expect(page.locator(`#engage-fav-grid a[href="${tool.path}"]`)).toBeVisible();
  }
  await page.reload();
  for (const tool of dmvTools) {
    const star = page.locator(`#tool-groups a[href="${tool.path}"] .fav-star-btn`);
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(`#engage-fav-grid a[href="${tool.path}"]`)).toBeHidden();
  }
  await expect(page.locator("#engage-fav")).toBeHidden();
});

test("external DMV quiz card star toggles and opens in new tab from favorites", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator(
    '#tool-groups .tool-card[data-external="true"]',
  );
  await expect(card).toHaveCount(1);
  const star = card.locator(".fav-star-btn");
  await expect(star).toHaveCount(1);
  await star.click();
  await expect(star).toHaveAttribute("aria-pressed", "true");
  const favCard = page.locator('#engage-fav-grid .tool-card[href^="https://dmv.openaa.com/"]');
  await expect(favCard).toBeVisible();
  await expect(favCard).toHaveAttribute("target", "_blank");
  await star.click();
  await expect(star).toHaveAttribute("aria-pressed", "false");
  await expect(favCard).toBeHidden();
});

test("ledger tabs share a favorite with the tool library home", async ({ page }) => {
  const path = "/usa/life-ledger/";
  await page.goto(path);
  const star = page.locator('[data-fav-toggle="life-ledger"]');
  await page.setViewportSize({ width: 390, height: 500 });
  await page.evaluate(() => {
    const ledger = document.querySelector("#ledger");
    // The guide list follows the ledger. Scroll within the ledger itself:
    // a sticky child should not remain pinned once its parent has ended.
    window.scrollTo(0, ledger.getBoundingClientRect().top + window.scrollY + 350);
  });
  await expect.poll(() => page.evaluate(() => {
    const bottom = document.querySelector(".site-header").getBoundingClientRect().bottom;
    const tabs = document.querySelector("#ledger .book").getBoundingClientRect();
    const trail = document.querySelector(".ledger-trail").getBoundingClientRect();
    return trail.bottom <= bottom && Math.abs(tabs.top - bottom) <= 1;
  })).toBe(true);
  await star.click();
  for (const book of ["income", "remittance", "summary", "expense"]) {
    await page.locator(`[data-book="${book}"]`).click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
  }
  await page.reload();
  await expect(star).toHaveText("★");
  const home = page.getByRole("link", { name: "全部工具", exact: true });
  await home.click();
  const favorite = page.locator(`#engage-fav-grid a[href="${path}"]`);
  await favorite.locator("h3").click();
  await star.click();
  await expect(star).toHaveText("☆");
  await home.click();
  await expect(favorite).toHaveCount(0);
});
