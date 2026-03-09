import { expect, test } from "@playwright/test";

/**
 * BYOK — "no API key" flow
 *
 * Requires a live Convex backend with NO user API key configured.
 * The stub preview path (NIOTEBOOK_E2E_PREVIEW=true) bypasses the BYOK
 * check and always returns a success response, so this test is skipped
 * when only the stub is available.
 *
 * Full run requires: Convex backend + Clerk auth (or dev auth bypass) + no
 * BYOK key stored for the test user.
 */

const lessonId = process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
const lessonPath = lessonId
  ? `/workspace?lessonId=${encodeURIComponent(lessonId)}`
  : null;

const isStubPreview =
  process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true" ||
  process.env.NIOTEBOOK_E2E_PREVIEW === "true";

const hasConvex = Boolean(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL,
);

test.describe("BYOK — no API key flow", () => {
  test.beforeEach(() => {
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    // Stub preview mode returns a success response — NO_API_KEY is never emitted.
    test.skip(isStubPreview, "Stub preview bypasses BYOK check");
    // A live Convex backend is required to resolve (or reject) the API key.
    test.skip(!hasConvex, "Requires Convex backend");
  });

  test("shows no-api-key prompt after sending a message without a key", async ({
    page,
  }) => {
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });

    // Wait for the chat input to appear — it is hidden when noApiKey is already set.
    const chatInput = page.getByPlaceholder("Ask about the lesson...");
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    // Type and submit a test message.
    await chatInput.fill("Hello Nio");
    await chatInput.press("Enter");

    // The no-API-key banner should appear once the SSE error event arrives.
    const banner = page.getByText(
      "Add an API key in",
      { exact: false },
    );
    await expect(banner).toBeVisible({ timeout: 20000 });

    // The Settings button inside the banner must be present and clickable.
    const settingsButton = page.getByRole("button", { name: "Settings" });
    await expect(settingsButton).toBeVisible();

    // Clicking Settings dispatches niotebook:open-settings.
    // Verify the event fires (no exception thrown, no navigation away).
    await settingsButton.click();

    // The page should still be on /workspace — settings is an in-app overlay.
    await expect(page).toHaveURL(/\/workspace/);
  });

  test("Settings button dispatches open-settings event", async ({ page }) => {
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });

    const chatInput = page.getByPlaceholder("Ask about the lesson...");
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    await chatInput.fill("test");
    await chatInput.press("Enter");

    const settingsButton = page.getByRole("button", { name: "Settings" });
    await expect(settingsButton).toBeVisible({ timeout: 20000 });

    // Intercept the custom DOM event.
    await page.evaluate(() => {
      window.addEventListener("niotebook:open-settings", () => {
        document.body.setAttribute("data-settings-opened", "true");
      });
    });

    await settingsButton.click();

    await expect(page.locator("body")).toHaveAttribute(
      "data-settings-opened",
      "true",
    );
  });
});
