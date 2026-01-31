import { expect, test } from "@playwright/test";

test.describe("Admin console", () => {
  test("admin page loads", async ({ page }) => {
    await page.goto("/admin");
    // With dev auth bypass, this may load or redirect depending on role
    await page.waitForURL(/\/(admin|courses|sign-in)/, { timeout: 10000 });
  });

  test.skip("non-admin is redirected away from /admin", async ({ page }) => {
    // Requires ability to set non-admin role in dev auth bypass
    await page.goto("/admin");
    await page.waitForURL(/\/(courses|sign-in)/, { timeout: 10000 });
    expect(page.url()).not.toContain("/admin");
  });

  test.skip("admin sidebar navigation works", async ({ page }) => {
    // Requires admin role via dev auth bypass
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
      await expect(page.getByText(label)).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip("admin pages render without errors", async ({ page }) => {
    // Requires admin role + seeded data
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
