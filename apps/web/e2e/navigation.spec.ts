import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("sidebar renders 4 nav links", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("sidebar");
    await expect(sidebar).toBeVisible();

    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page.getByTestId("nav-chronicle")).toBeVisible();
    await expect(page.getByTestId("nav-workers")).toBeVisible();
    await expect(page.getByTestId("nav-audit")).toBeVisible();

    await expect(page.getByTestId("nav-dashboard")).toContainText("Dashboard");
    await expect(page.getByTestId("nav-chronicle")).toContainText("Chronicle");
    await expect(page.getByTestId("nav-workers")).toContainText("Workers");
    await expect(page.getByTestId("nav-audit")).toContainText("Audit");

    // Subtitles render too
    await expect(page.getByTestId("nav-dashboard")).toContainText("系统概览");
    await expect(page.getByTestId("nav-chronicle")).toContainText("编年体");
    await expect(page.getByTestId("nav-workers")).toContainText("状态监控");
    await expect(page.getByTestId("nav-audit")).toContainText("审计报告");
  });

  test("clicking each link navigates to the right URL", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("nav-chronicle").click();
    await expect(page).toHaveURL(/\/chronicle$/);
    await expect(page.getByTestId("page-title")).toHaveText("Chronicle");

    await page.getByTestId("nav-workers").click();
    await expect(page).toHaveURL(/\/workers$/);
    await expect(page.getByTestId("page-title")).toHaveText("Workers");

    await page.getByTestId("nav-audit").click();
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.getByTestId("page-title")).toHaveText("Audit");

    await page.getByTestId("nav-dashboard").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("page-title")).toHaveText("Dashboard");
  });

  test("active link is highlighted on the current route", async ({ page }) => {
    await page.goto("/chronicle");
    // The active nav link gets the marker class set in App.tsx.
    const active = page.getByTestId("nav-chronicle");
    await expect(active).toHaveClass(/nav-link-active/);

    // Other links are not active.
    await expect(page.getByTestId("nav-workers")).not.toHaveClass(/nav-link-active/);
    await expect(page.getByTestId("nav-audit")).not.toHaveClass(/nav-link-active/);
    await expect(page.getByTestId("nav-dashboard")).not.toHaveClass(/nav-link-active/);
  });

  test("page title changes when navigating", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("page-title")).toHaveText("Dashboard");

    await page.getByTestId("nav-chronicle").click();
    await expect(page.getByTestId("page-title")).toHaveText("Chronicle");

    await page.getByTestId("nav-workers").click();
    await expect(page.getByTestId("page-title")).toHaveText("Workers");

    await page.getByTestId("nav-audit").click();
    await expect(page.getByTestId("page-title")).toHaveText("Audit");
  });

  test("page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.getByTestId("sidebar")).toBeVisible();

    // Filter out benign noise from external resources.
    const meaningful = errors.filter(
      (m) => !/favicon|net::ERR_|Failed to load resource/i.test(m),
    );
    expect(meaningful).toEqual([]);
  });
});
