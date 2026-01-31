import { test, expect } from "@playwright/test";

test("scan teaser flow shows totals (requires authorization checkbox)", async ({ page }) => {
  await page.goto("/scan");

  await page.getByPlaceholder("https://deine-website.de").fill("https://example.com");

  // Must confirm authorization
  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: /scan starten/i }).click();

  // Totals card
  await expect(page.getByText(/Ergebnis für/i)).toBeVisible();
  await expect(page.getByText("P0 Critical")).toBeVisible();
  await expect(page.getByText("P1 High")).toBeVisible();
  await expect(page.getByText("P2 Medium")).toBeVisible();

  // Teaser preview
  await expect(page.getByText(/VORSCHAU-FINDING/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /report freischalten/i })).toBeVisible();
});
