import { test, expect } from "./fixtures.mjs";

test("parking QR link opens the contact view and displays the encoded US phone", async ({ page }) => {
  await page.goto("/tools/parking-qr/#phone=%2B16468897111");
  await expect(page.locator("#parking-contact")).toBeVisible();
  await expect(page.locator("#parking-builder")).toBeHidden();
  await expect(page.locator("#parking-contact-number")).toHaveText("+1 646 889 7111");
  await expect(page.locator("#parking-call")).toHaveAttribute("href", "tel:+16468897111");
  await expect(page.locator("#parking-sms")).toHaveAttribute("href", "sms:+16468897111");
});

test("parking QR contact view responds to hash changes using the canonical phone format", async ({ page }) => {
  await page.goto("/tools/parking-qr/");
  await page.evaluate(() => { window.location.hash = "phone=%2B16468897111"; });
  await expect(page.locator("#parking-contact")).toBeVisible();
  await expect(page.locator("#parking-contact-number")).toHaveText("+1 646 889 7111");
});
