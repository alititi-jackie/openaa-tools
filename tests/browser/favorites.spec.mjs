import { test, expect } from "./fixtures.mjs";
import fs from "node:fs";

const tools = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
test("all catalog cards have favorites and DMV favorites persist", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#tool-groups .fav-star-btn")).toHaveCount(tools.length);
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
