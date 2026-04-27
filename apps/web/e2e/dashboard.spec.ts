import { test, expect } from "@playwright/test";
import { getStats, getChronicle } from "./helpers";

test.describe("dashboard", () => {
  test("page header renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("page-title")).toHaveText("Dashboard");
    await expect(page.getByTestId("page-header")).toContainText("系统概览");
  });

  test("stats cards render numbers, not loading or error placeholders", async ({
    page,
    request,
  }) => {
    const stats = await getStats(request);
    await page.goto("/");

    const entries = page.getByTestId("stat-entries");
    const workers = page.getByTestId("stat-workers");
    const actors = page.getByTestId("stat-actors");

    await expect(entries).toHaveAttribute("data-state", "ready");
    await expect(actors).toHaveAttribute("data-state", "ready");
    // workers card is also ready once /api/workers resolves
    await expect(workers).toHaveAttribute("data-state", /ready|error/);

    await expect(page.getByTestId("stat-entries-value")).toHaveText(
      String(stats.totalEntries),
    );
    await expect(page.getByTestId("stat-actors-value")).toHaveText(
      String(stats.uniqueActors),
    );

    // Should NOT show the loading "…" or error "!" sentinel
    for (const card of [entries, workers, actors]) {
      await expect(card).not.toContainText(/^…$/);
      await expect(card).not.toHaveText(/^!$/);
    }
  });

  test("recent activity section shows entries", async ({ page, request }) => {
    const chron = await getChronicle(request);
    test.skip(chron.count === 0, "no chronicle entries to render");

    await page.goto("/");
    const recent = page.getByTestId("recent-activity");
    await expect(recent).toBeVisible();
    await expect(recent).toContainText("最近活动");

    const entries = recent.getByTestId("chronicle-entry");
    await expect(entries.first()).toBeVisible();

    const renderedCount = await entries.count();
    // Dashboard shows up to 5 most recent
    expect(renderedCount).toBeGreaterThan(0);
    expect(renderedCount).toBeLessThanOrEqual(5);
  });

  test("health panel shows service names", async ({ page }) => {
    await page.goto("/");
    const health = page.getByTestId("health-panel");
    await expect(health).toBeVisible();

    await expect(page.getByTestId("health-slack")).toBeVisible();
    await expect(page.getByTestId("health-telegram")).toBeVisible();
    await expect(page.getByTestId("health-hermes")).toBeVisible();

    // Each row has a status indicator (running or down)
    const services = page.getByTestId("health-services").locator("li");
    await expect(services).toHaveCount(3);
    for (const row of await services.all()) {
      await expect(row).toContainText(/running|down/);
    }
  });

  test("entry cards on dashboard are expandable", async ({ page, request }) => {
    const chron = await getChronicle(request);
    const expandable = chron.entries
      .slice(0, 5)
      .find((e) => /\S/.test((e as { id: string }).id));
    test.skip(!expandable, "no entries to expand");

    await page.goto("/");
    const recent = page.getByTestId("recent-activity");
    await expect(recent.getByTestId("chronicle-entry").first()).toBeVisible();

    const firstWithToggle = recent
      .getByTestId("chronicle-entry")
      .filter({ has: page.getByTestId("entry-expand-toggle") })
      .first();

    const toggleCount = await recent.getByTestId("entry-expand-toggle").count();
    test.skip(toggleCount === 0, "no entries on dashboard have details to expand");

    await expect(firstWithToggle).toHaveAttribute("data-expanded", "false");
    await firstWithToggle.getByTestId("entry-expand-toggle").click();
    await expect(firstWithToggle).toHaveAttribute("data-expanded", "true");
    await expect(firstWithToggle.getByTestId("entry-details")).toBeVisible();

    // Click again collapses
    await firstWithToggle.getByTestId("entry-expand-toggle").click();
    await expect(firstWithToggle).toHaveAttribute("data-expanded", "false");
  });
});
