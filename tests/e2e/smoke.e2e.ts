import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";

const lessonId = process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
const lessonPath = lessonId
  ? `/?lessonId=${encodeURIComponent(lessonId)}`
  : "/";

const captureDiagnostics = async (page: Page): Promise<void> => {
  const snapshot = {
    baseUrl: process.env.BASE_URL ?? null,
    url: page.url(),
  };

  writeFileSync("test-results/diagnostics.json", JSON.stringify(snapshot), {
    encoding: "utf8",
  });
  writeFileSync("test-results/page.html", await page.content(), {
    encoding: "utf8",
  });
};
test("workspace shell renders", async ({ page }): Promise<void> => {
  await page.goto(lessonPath);

  try {
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText("Lesson video")).toBeVisible();
    await expect(page.getByText("Assistant")).toBeVisible();

    const input = page.getByPlaceholder("Ask about the lesson...");
    const message = `What is a pointer? ${Date.now()}`;
    await input.fill(message);
    await input.press("Enter");

    const messageLocator = page
      .getByTestId("chat-message")
      .filter({ hasText: message })
      .last();
    await expect(messageLocator).toBeVisible({
      timeout: 15000,
    });
  } catch (error) {
    await captureDiagnostics(page);
    throw error;
  }
});
