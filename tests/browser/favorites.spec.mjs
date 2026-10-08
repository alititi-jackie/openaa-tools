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
