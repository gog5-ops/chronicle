import { test, expect } from "@playwright/test";
import { getAudit } from "./helpers";

test.describe("audit", () => {
  test("page header renders", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.getByTestId("page-title")).toHaveText("Audit");
    await expect(page.getByTestId("page-header")).toContainText("审计报告");
  });

  test("reports list renders cards or an empty state", async ({
    page,
    request,
  }) => {
    const data = await getAudit(request);
    await page.goto("/audit");

    if (data.count === 0) {
      // Empty state message is rendered by AsyncBoundary
      await expect(page.getByText("暂无审计报告")).toBeVisible();
      return;
    }

    const cards = page.getByTestId("audit-card");
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(data.count);
  });

  test("clicking a card expands it to show findings", async ({
    page,
    request,
  }) => {
    const data = await getAudit(request);
    test.skip(data.count === 0, "no audit reports yet");

    await page.goto("/audit");
    const card = page.getByTestId("audit-card").first();
    await expect(card).toBeVisible();

    // Initially collapsed — no details visible.
    await expect(card.getByTestId("audit-details")).toHaveCount(0);

    await card.getByTestId("audit-toggle").click();
    await expect(card.getByTestId("audit-details")).toBeVisible();

    // Clicking again collapses
    await card.getByTestId("audit-toggle").click();
    await expect(card.getByTestId("audit-details")).toHaveCount(0);
  });

  test("severity badges on findings are styled per severity", async ({
    page,
    request,
  }) => {
    const data = await getAudit(request);
    const withFindings = data.reports.find((r) => r.findingCount > 0);
    test.skip(!withFindings, "no audit report has findings yet");

    await page.goto("/audit");
    const card = page
      .getByTestId("audit-card")
      .filter({
        hasText: String(withFindings!.findingCount),
      })
      .first();

    await card.getByTestId("audit-toggle").click();
    const findings = card.getByTestId("audit-finding");
    await expect(findings.first()).toBeVisible();

    // Each finding declares a severity; the styling is severity-driven via class.
    for (const f of await findings.all()) {
      const severity = await f.getAttribute("data-severity");
      expect(severity).toMatch(/^(info|warning|error)$/);
      const className = (await f.getAttribute("class")) ?? "";
      // Classes diverge by severity (different border/background tints).
      if (severity === "error") {
        expect(className).toMatch(/red/);
      } else if (severity === "warning") {
        expect(className).toMatch(/amber/);
      } else {
        expect(className).toMatch(/gray/);
      }
    }
  });
});
