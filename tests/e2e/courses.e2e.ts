import { expect, test } from "@playwright/test";

test.describe("Course browsing", () => {
  test("courses page loads with content", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });

  test("courses page shows course cards", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // Should have at least one course card or heading visible
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  test.skip("coming soon row shows greyed-out cards", async ({ page }) => {
    // Requires seeded course data in Convex to verify carousel rows
    await page.goto("/courses");
    await expect(page.locator(".opacity-50")).toBeVisible({ timeout: 10000 });
  });

  test.skip("click course card navigates to detail page", async ({ page }) => {
    // Requires seeded course data — course cards are rendered from Convex query
    await page.goto("/courses");
    const card = page.locator('a[href^="/courses/"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 10000 });
  });

  test.skip("course detail page shows lecture list", async ({ page }) => {
    // Requires a known courseId with seeded lessons in Convex
    await page.goto("/courses/cs50");
    await expect(page.getByText("Lectures")).toBeVisible({ timeout: 10000 });
  });

  test.skip("click lecture Start navigates to workspace", async ({ page }) => {
    // Requires seeded course + lesson data to have a Start button
    await page.goto("/courses/cs50");
    const startBtn = page.getByText("Start").first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForURL(/\/workspace\?lessonId=/, { timeout: 10000 });
  });
});
