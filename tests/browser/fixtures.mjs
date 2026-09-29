import { test as base, expect } from "@playwright/test";
// A serverless Chromium executable cannot reliably reuse a browser after closing
// an isolated context. Use a fresh process for each local test; CI uses stock Chromium.
export const test = process.env.CHROMIUM_PATH
  ? base.extend({
      context: async (
        {
          playwright,
          browserName,
          launchOptions,
          contextOptions,
          viewport,
          baseURL,
        },
        use,
      ) => {
        const browser = await playwright[browserName].launch(launchOptions);
        const context = await browser.newContext({
          ...contextOptions,
          viewport,
          baseURL,
        });
        await use(context);
        await context.close();
        await browser.close();
      },
    })
  : base;
export { expect };
