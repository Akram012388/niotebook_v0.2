import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }): Promise<void> => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "To get started, edit the page.tsx file."
    })
  ).toBeVisible();
});
