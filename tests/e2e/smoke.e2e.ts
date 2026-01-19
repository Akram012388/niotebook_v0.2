import { expect, test } from "@playwright/test";

const lessonId = process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
const lessonPath = lessonId
  ? `/?lessonId=${encodeURIComponent(lessonId)}`
  : "/";

test("home page loads", async ({ page }): Promise<void> => {
  await page.goto(lessonPath);
  await expect(page.getByText("Code workspace")).toBeVisible();
  await expect(page.getByText("Lesson video")).toBeVisible();
  await expect(page.getByText("Assistant")).toBeVisible();
});

test("chat, resume, and snapshot persist", async ({ page }): Promise<void> => {
  await page.goto(lessonPath);

  const chatInput = page.getByPlaceholder("Ask about the lesson...");
  await expect(chatInput).toBeVisible();
  await chatInput.fill("hello e2e");
  await chatInput.press("Enter");
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
