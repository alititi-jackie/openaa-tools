import { test, expect } from "./fixtures.mjs";

test("parking QR link opens the contact view and displays the encoded phone", async ({ page }) => {
  await page.goto("/tools/parking-qr/#phone=%2B16468897111");
  await expect(page.locator("#parking-contact")).toBeVisible();
  await expect(page.locator("#parking-builder")).toBeHidden();
  await expect(page.locator("#parking-contact-number")).toHaveText("+1 646 889 7111");
  await expect(page.locator("#parking-call")).toHaveAttribute("href", "tel:+16468897111");
  await expect(page.locator("#parking-sms")).toHaveAttribute("href", "sms:+16468897111");
});

test("parking QR contact view responds to hash changes", async ({ page }) => {
  await page.goto("/tools/parking-qr/");
  await page.evaluate(() => { window.location.hash = "phone=%2B16468897111"; });
  await expect(page.locator("#parking-contact")).toBeVisible();
  await expect(page.locator("#parking-contact-number")).toHaveText("+1 646 889 7111");
});

test.describe("parking QR builder language (en-US browser)", () => {
  test.use({ locale: "en-US" });
  test("auto-detects English; manual switch to Spanish persists across reload", async ({ page }) => {
    await page.goto("/tools/parking-qr/");
    await expect(page.locator(".parking-title-row h1")).toHaveText("Parking QR Code");
    await expect(page.locator("#parking-generate")).toHaveText("Create my parking QR");
    await expect(page.locator(".parking-other-qr")).toHaveText("More QR codes →");
    await page.selectOption("[data-parking-language-select]", "es");
    await expect(page.locator(".parking-title-row h1")).toHaveText("Código QR de estacionamiento");
    await expect(page.locator("#parking-generate")).toHaveText("Crear mi código QR");
    await page.reload();
    await expect(page.locator(".parking-title-row h1")).toHaveText("Código QR de estacionamiento");
    await expect(page.locator("[data-parking-language-select]")).toHaveValue("es");
  });
});

test.describe("parking QR builder language (es-ES browser)", () => {
  test.use({ locale: "es-ES" });
  test("auto-detects Spanish", async ({ page }) => {
    await page.goto("/tools/parking-qr/");
    await expect(page.locator(".parking-title-row h1")).toHaveText("Código QR de estacionamiento");
    await expect(page.locator("#parking-generate")).toHaveText("Crear mi código QR");
  });
});
