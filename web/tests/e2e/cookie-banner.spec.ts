import { test, expect } from "@playwright/test";

test("cookie banner stays dismissed across navigations", async ({ page }) => {
  await page.goto("/ratgeber/wcag-kontrastwerte-pruefen-einfach-erklaert");

  const bannerHeading = page.getByText("Cookies & Datenschutz");
  await expect(bannerHeading).toBeVisible();

  await page.getByRole("button", { name: "Akzeptieren" }).click();
  await expect(bannerHeading).not.toBeVisible();

  await page.goto("/");
  await expect(bannerHeading).not.toBeVisible();

  await page.goto("/ratgeber");
  await expect(bannerHeading).not.toBeVisible();
});

test("cookie banner stays dismissed on client-side navigation (app pages)", async ({ page }) => {
  await page.goto("/");

  const bannerHeading = page.getByText("Cookies & Datenschutz");
  await expect(bannerHeading).toBeVisible();

  await page.getByRole("button", { name: "Akzeptieren" }).click();
  await expect(bannerHeading).not.toBeVisible();

  // Home -> scans (dashboard-like)
  await page.getByRole("link", { name: "Übersicht" }).first().click();
  await page.waitForURL("**/scans");
  await expect(bannerHeading).not.toBeVisible();

  // scans -> scan (analysis-like)
  await page.getByRole("link", { name: "+ Neuer Scan" }).click();
  await page.waitForURL("**/scan");
  await expect(bannerHeading).not.toBeVisible();
});
