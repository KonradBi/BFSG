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
