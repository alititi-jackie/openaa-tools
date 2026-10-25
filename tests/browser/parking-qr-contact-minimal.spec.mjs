import { test, expect } from "./fixtures.mjs";

test("scanned parking QR page shows all three languages without selector or related content", async ({ page }) => {
  await page.goto("/tools/parking-qr/#phone=%2B16468897111");
  await expect(page.locator("#parking-contact")).toBeVisible();
  await expect(page.locator("#parking-contact-heading")).toBeVisible().catch(() => {});
  await expect(page.getByText("如需挪车，请联系车主")).toBeVisible();
  await expect(page.getByText("Need this vehicle moved? Please contact the owner.")).toBeVisible();
  await expect(page.getByText("¿Necesitas mover este vehículo? Contacta al propietario.")).toBeVisible();
  await expect(page.locator("#parking-contact-language")).toHaveCount(0);
  await expect(page.locator(".related-tools")).toBeHidden();
  await expect(page.locator(".eco-card")).toBeHidden();
  await expect(page.locator("#parking-contact-number")).toHaveText("+16468897111");
  await expect(page.locator("#parking-call")).toHaveAttribute("href", "tel:+16468897111");
  await expect(page.locator("#parking-sms")).toHaveAttribute("href", "sms:+16468897111");
  const createLinks = page.locator(".parking-create-link");
  await expect(createLinks).toHaveCount(3);
  await expect(createLinks.nth(0)).toHaveText("Make my own parking QR code");
  await expect(createLinks.nth(1)).toHaveText("Crear mi propio código QR de estacionamiento");
  await expect(createLinks.nth(2)).toHaveText("制作我的挪车二维码 →");
  for (let i = 0; i < 3; i++) {
    await expect(createLinks.nth(i)).toHaveAttribute("href", "https://tools.openaa.com/tools/parking-qr/");
  }
  await expect(page.locator(".parking-contact-footer > p a")).toHaveText("OpenAA.com");
});
