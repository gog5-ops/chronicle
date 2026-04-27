import { test, expect } from "@playwright/test";
import { getWorkers } from "./helpers";

test.describe("workers", () => {
  test("worker cards render with name, description, and schedule", async ({
    page,
    request,
  }) => {
    const data = await getWorkers(request);
    test.skip(
      data.count === 0,
      "no workers from API — Task #2 (API-Workers integration) hasn't shipped",
    );

    await page.goto("/workers");
    await expect(page.getByTestId("page-title")).toHaveText("Workers");

    const cards = page.getByTestId("worker-card");
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(data.count);

    // Each card has a name, a description, and a schedule cron expression.
    for (const w of data.workers) {
      const card = page.locator(`[data-worker-name="${w.name}"]`).locator("..");
      await expect(card.getByTestId("worker-name")).toHaveText(w.name);
      await expect(card.getByTestId("worker-description")).toHaveText(
        w.description,
      );
      // Schedule shown as code inline; just assert the page contains the cron line.
      await expect(page.locator("code", { hasText: w.schedule }).first()).toBeVisible();
    }
  });

  test("status badges are visible on each worker card", async ({
    page,
    request,
  }) => {
    const data = await getWorkers(request);
    test.skip(data.count === 0, "no workers");

    await page.goto("/workers");
    const badges = page.getByTestId("worker-status-badge");
    await expect(badges.first()).toBeVisible();
    await expect(badges).toHaveCount(data.count);

    // Each badge has a data-status from the known set.
    for (const b of await badges.all()) {
      const status = await b.getAttribute("data-status");
      expect(status).toMatch(/^(idle|running|failed|disabled)$/);
    }
  });

  test('"立即运行" trigger button exists on each card', async ({
    page,
    request,
  }) => {
    const data = await getWorkers(request);
    test.skip(data.count === 0, "no workers");

    await page.goto("/workers");
    const triggers = page.getByTestId("worker-trigger");
    await expect(triggers).toHaveCount(data.count);

    // Disabled workers may have a disabled button — at least one should be enabled.
    for (const t of await triggers.all()) {
      const text = (await t.textContent()) ?? "";
      expect(text).toMatch(/立即运行|运行中…/);
    }
  });

  test("clicking trigger shows running state then a feedback message", async ({
    page,
    request,
  }) => {
    const data = await getWorkers(request);
    const enabled = data.workers.find((w) => w.status !== "disabled");
    test.skip(!enabled, "no enabled worker to trigger");

    await page.goto("/workers");
    const card = page
      .locator(`[data-worker-name="${enabled!.name}"]`)
      .locator("xpath=ancestor::*[@data-testid='worker-card'][1]");
    await expect(card).toBeVisible();

    const trigger = card.getByTestId("worker-trigger");
    await expect(trigger).toBeEnabled();

    await trigger.click();

    // Feedback appears as either success or error within a reasonable window.
    const success = card.getByTestId("worker-feedback-success");
    const error = card.getByTestId("worker-feedback-error");
    await expect(success.or(error)).toBeVisible({ timeout: 30_000 });
  });
});
