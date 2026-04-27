import { test, expect } from "@playwright/test";
import { getChronicle, getStats } from "./helpers";

test.describe("chronicle", () => {
  test("timeline renders entries grouped by date", async ({ page, request }) => {
    const chron = await getChronicle(request);
    test.skip(chron.count === 0, "no chronicle entries");

    await page.goto("/chronicle");
    await expect(page.getByTestId("page-title")).toHaveText("Chronicle");

    const entries = page.getByTestId("chronicle-entry");
    await expect(entries.first()).toBeVisible();

    const renderedCount = await entries.count();
    expect(renderedCount).toBe(chron.count);

    // Entries are rendered inside a Timeline (sections labelled by date)
    const dateHeadings = page.locator("section h3");
    const headingCount = await dateHeadings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Every heading should match a YYYY-MM-DD pattern
    const headings = await dateHeadings.allTextContents();
    for (const h of headings) {
      expect(h).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("entry count is shown in the filter bar", async ({ page, request }) => {
    const chron = await getChronicle(request);
    await page.goto("/chronicle");
    await expect(page.getByTestId("filter-count")).toHaveText(
      `共 ${chron.count} 条`,
    );
  });

  test("date-from filter reduces visible entries", async ({ page, request }) => {
    const chron = await getChronicle(request);
    test.skip(chron.count === 0, "no entries");

    // Pick a date strictly after the earliest entry, so the filter changes the count.
    const dates = [...new Set(chron.entries.map((e) => e.date))].sort();
    test.skip(
      dates.length < 2,
      "need at least two distinct dates to test the from-filter",
    );
    const cutoff = dates[1]; // anything before this is filtered out

    const filtered = await getChronicle(request, { from: cutoff });

    await page.goto("/chronicle");
    await expect(page.getByTestId("chronicle-entry").first()).toBeVisible();

    await page.getByTestId("filter-from").fill(cutoff);

    await expect(page.getByTestId("filter-count")).toHaveText(
      `共 ${filtered.count} 条`,
    );
    await expect(page.getByTestId("chronicle-entry")).toHaveCount(filtered.count);
    expect(filtered.count).toBeLessThan(chron.count);
  });

  test("actor filter narrows entries", async ({ page, request }) => {
    const stats = await getStats(request);
    test.skip(stats.actors.length === 0, "no actors to filter on");

    const actor = stats.actors[0];
    const filtered = await getChronicle(request, { actor });

    await page.goto("/chronicle");
    await expect(page.getByTestId("chronicle-entry").first()).toBeVisible();
    await page.getByTestId("filter-actor").selectOption(actor);

    await expect(page.getByTestId("filter-count")).toHaveText(
      `共 ${filtered.count} 条`,
    );
    await expect(page.getByTestId("chronicle-entry")).toHaveCount(filtered.count);
  });

  test("clear filters resets to all entries", async ({ page, request }) => {
    const chron = await getChronicle(request);
    test.skip(chron.count === 0, "no entries");

    const dates = [...new Set(chron.entries.map((e) => e.date))].sort();
    test.skip(dates.length < 2, "need two distinct dates");
    const cutoff = dates[1];

    await page.goto("/chronicle");
    await page.getByTestId("filter-from").fill(cutoff);
    await expect(page.getByTestId("filter-clear")).toBeVisible();

    await page.getByTestId("filter-clear").click();

    await expect(page.getByTestId("filter-from")).toHaveValue("");
    await expect(page.getByTestId("filter-count")).toHaveText(
      `共 ${chron.count} 条`,
    );
  });

  test("entry expand shows detail sections", async ({ page, request }) => {
    const chron = await getChronicle(request);
    test.skip(chron.count === 0, "no entries");

    await page.goto("/chronicle");
    await expect(page.getByTestId("chronicle-entry").first()).toBeVisible();

    const expandable = page
      .getByTestId("chronicle-entry")
      .filter({ has: page.getByTestId("entry-expand-toggle") })
      .first();

    const expandableCount = await page.getByTestId("entry-expand-toggle").count();
    test.skip(expandableCount === 0, "no entries have detail content");

    await expect(expandable).toHaveAttribute("data-expanded", "false");
    await expandable.getByTestId("entry-expand-toggle").click();
    await expect(expandable).toHaveAttribute("data-expanded", "true");
    await expect(expandable.getByTestId("entry-details")).toBeVisible();
  });

  test("issue links are rendered and clickable for entries that reference an issue", async ({
    page,
    request,
  }) => {
    const chron = await getChronicle(request);
    const withIssue = chron.entries.find((e) => e.issue);
    test.skip(!withIssue, "no entries reference an issue");

    await page.goto("/chronicle");
    await expect(page.getByTestId("chronicle-entry").first()).toBeVisible();

    const entry = page.locator(
      `[data-testid="chronicle-entry"][data-entry-id="${withIssue!.id}"]`,
    );
    await expect(entry).toBeVisible();
    const link = entry.getByTestId("entry-issue-link");
    await expect(link).toBeVisible();

    // Must have a non-empty href and target="_blank" so it opens externally.
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("opshub#N issue references resolve to a GitHub URL", async ({
    page,
    request,
  }) => {
    const chron = await getChronicle(request);
    // Real chronicle data writes issues as "opshub#NN" or bare "#NN" / "NN".
    // All three should resolve to a full GitHub URL with label "#NN".
    const canonical = chron.entries.find(
      (e) => e.issue && /^(?:opshub)?#?\d+$/.test(e.issue),
    );
    test.skip(!canonical, "no entries with a canonical issue reference");

    await page.goto("/chronicle");
    const entry = page.locator(
      `[data-testid="chronicle-entry"][data-entry-id="${canonical!.id}"]`,
    );
    const link = entry.getByTestId("entry-issue-link");
    await expect(link).toBeVisible();

    const href = await link.getAttribute("href");
    expect(href).toMatch(/^https:\/\/github\.com\/gog5-ops\/opshub\/issues\/\d+$/);
    await expect(link).toHaveText(/^#\d+$/);
  });
});
