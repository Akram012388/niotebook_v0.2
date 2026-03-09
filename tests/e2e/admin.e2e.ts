import { expect, test } from "@playwright/test";

test.describe("Admin console", () => {
  test("admin page loads", async ({ page }) => {
    await page.goto("/admin");
    // With E2E preview mode, AdminGuard is bypassed
    await page.waitForURL(/\/(admin|courses|sign-in)/, { timeout: 10000 });
  });

  // SKIP: requires a non-admin Clerk account in E2E fixtures and the
  // dev-auth bypass disabled so AdminGuard can actually redirect the user.
  test.skip("non-admin is redirected away from /admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/(courses|sign-in)/, { timeout: 10000 });
    expect(page.url()).not.toContain("/admin");
  });

  test("admin sidebar navigation works", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });

    // Verify sidebar links exist
    for (const label of [
      "Dashboard",
      "Users",
      "Invites",
      "Feedback",
      "Analytics",
    ]) {
      await expect(page.getByText(label).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("admin pages render without errors", async ({ page }) => {
    const pages = [
      "/admin",
      "/admin/users",
      "/admin/invites",
      "/admin/feedback",
      "/admin/analytics",
    ];

    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
      // No error boundary or crash
      const body = await page.textContent("body");
      expect(body).not.toContain("Application error");
    }
  });
});
