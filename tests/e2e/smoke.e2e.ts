import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }): Promise<void> => {
  await page.goto("/");
  await expect(page.getByText("Code workspace")).toBeVisible();
  await expect(page.getByText("Lesson video")).toBeVisible();
  await expect(page.getByText("Assistant")).toBeVisible();
});

test("chat, resume, and snapshot persist", async ({ page }): Promise<void> => {
  await page.goto("/");

  await page.getByPlaceholder("Ask about the lesson...").fill("hello e2e");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByTestId("chat-message").first()).toContainText(
    "hello e2e",
  );

  await page.getByTestId("code-editor").fill("console.log('e2e')");
  await page.getByRole("button", { name: "Save snapshot" }).click();

  await page.getByRole("button", { name: "+10s" }).click();

  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId("chat-message").first()).toContainText(
    "hello e2e",
  );
  await expect(page.getByTestId("code-editor")).toHaveValue(
    "console.log('e2e')",
  );
  await expect(page.getByText("Seeking to 0:10")).toBeVisible();
});
