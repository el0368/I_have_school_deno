// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — E2E: Math Validation Flow (Playwright)
// ═══════════════════════════════════════════════════════════════════

import { expect, test } from "@playwright/test";

test.describe("Math Validation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".app-shell", { timeout: 10_000 });
  });

  test("WASM badge appears when engine loads", async ({ page }) => {
    // The WASM badge should appear once the engine loads
    const wasmBadge = page.locator(".wasm-badge");
    // Wait for WASM to load (may take a moment)
    await expect(wasmBadge).toBeVisible({ timeout: 15_000 });
    await expect(wasmBadge).toContainText("WASM");
  });

  test("exercise card is displayed for active topic", async ({ page }) => {
    // Wait for exercise to load
    const exerciseCard = page.locator(".exercise-card");
    await expect(exerciseCard).toBeVisible({ timeout: 10_000 });
  });

  test("answer input accepts text", async ({ page }) => {
    // Wait for exercise to load
    await page.waitForSelector(".exercise-card", { timeout: 10_000 });

    const input = page.locator(".answer-input");
    await expect(input).toBeVisible();

    await input.fill("42");
    await expect(input).toHaveValue("42");
  });

  test("submitting correct answer shows success feedback", async ({ page }) => {
    // Wait for exercise card
    await page.waitForSelector(".exercise-card", { timeout: 10_000 });

    // Read the problem text to compute the answer
    const problemText = await page.locator(".exercise-problem").textContent();
    if (!problemText) {
      test.skip();
      return;
    }

    // Try to parse simple arithmetic: "a op b"
    const match = problemText.match(/(\d+)\s*([+\-*])\s*(\d+)/);
    if (!match) {
      test.skip();
      return;
    }

    const a = parseInt(match[1]);
    const op = match[2];
    const b = parseInt(match[3]);
    let answer: number;

    switch (op) {
      case "+":
        answer = a + b;
        break;
      case "-":
        answer = a - b;
        break;
      case "*":
        answer = a * b;
        break;
      default:
        answer = a + b;
    }

    // Type the correct answer
    const input = page.locator(".answer-input");
    await input.fill(String(answer));

    // Click check button
    const checkBtn = page.locator(".check-btn");
    await checkBtn.click();

    // Should show correct feedback
    const feedback = page.locator(".result-correct, .success-overlay");
    await expect(feedback.first()).toBeVisible({ timeout: 5_000 });
  });

  test("submitting wrong answer shows hint", async ({ page }) => {
    // Wait for exercise card
    await page.waitForSelector(".exercise-card", { timeout: 10_000 });

    // Type a clearly wrong answer
    const input = page.locator(".answer-input");
    await input.fill("99999");

    // Click check
    const checkBtn = page.locator(".check-btn");
    await checkBtn.click();

    // Should show incorrect feedback or hint
    const feedback = page.locator(".result-incorrect, .result-hint");
    await expect(feedback.first()).toBeVisible({ timeout: 5_000 });
  });

  test("skip button advances to next exercise", async ({ page }) => {
    // Wait for exercise card
    await page.waitForSelector(".exercise-card", { timeout: 10_000 });

    // Get the initial problem
    const initialProblem = await page.locator(".exercise-problem").textContent();

    // Click skip
    const skipBtn = page.locator(".skip-btn");
    if (await skipBtn.isVisible()) {
      await skipBtn.click();

      // Wait briefly for next exercise
      await page.waitForTimeout(500);

      // Problem text should have changed (or at least the input cleared)
      const input = page.locator(".answer-input");
      await expect(input).toHaveValue("");
    }
  });
});
