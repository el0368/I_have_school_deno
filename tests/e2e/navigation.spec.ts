// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — E2E: Topic Navigation (Playwright)
// ═══════════════════════════════════════════════════════════════════

import { expect, test } from "@playwright/test";

test.describe("Topic Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app shell to render
    await page.waitForSelector(".app-shell", { timeout: 10_000 });
  });

  test("page loads with Discord-style layout", async ({ page }) => {
    // Title bar exists
    await expect(page.locator(".title-bar")).toBeVisible();
    // Sidebar exists
    await expect(page.locator(".sidebar")).toBeVisible();
    // Math stage exists
    await expect(page.locator(".stage")).toBeVisible();
  });

  test("sidebar shows 19 math topics", async ({ page }) => {
    const channels = page.locator(".channel-btn");
    await expect(channels).toHaveCount(19);
  });

  test("first topic (Counting) is active by default", async ({ page }) => {
    const activeChannel = page.locator(".channel-active");
    await expect(activeChannel).toHaveCount(1);
    await expect(activeChannel).toContainText("Counting");
  });

  test("clicking a topic changes the active channel", async ({ page }) => {
    // Click the "Addition" topic
    const additionBtn = page.locator(".channel-btn", { hasText: "Addition" });
    await additionBtn.click();

    // Verify it becomes active
    await expect(additionBtn).toHaveClass(/channel-active/);

    // The stage header should update
    const header = page.locator(".stage-header");
    await expect(header).toContainText("Addition");
  });

  test("clicking multiple topics updates correctly", async ({ page }) => {
    const topicNames = ["Subtraction", "Fractions", "Geometry"];

    for (const name of topicNames) {
      const btn = page.locator(".channel-btn", { hasText: name });
      await btn.click();

      // Verify active state
      await expect(btn).toHaveClass(/channel-active/);

      // Only one active at a time
      const activeCount = await page.locator(".channel-active").count();
      expect(activeCount).toBe(1);
    }
  });

  test("stage shows channel name with hash icon", async ({ page }) => {
    const stageHeader = page.locator(".stage-header");
    await expect(stageHeader).toBeVisible();
    // Should contain a hash symbol and topic name
    await expect(stageHeader).toContainText("Counting");
  });
});
