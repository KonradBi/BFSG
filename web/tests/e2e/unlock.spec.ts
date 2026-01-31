import { test, expect, request as playwrightRequest } from "@playwright/test";

test("paid unlock shows full report UI (token-gated)", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("missing baseURL");

  // Create a scan via API (fixture mode)
  const api = await playwrightRequest.newContext({ baseURL });
  const create = await api.post("/api/scan", {
    data: { url: "https://example.com", authorizedToScan: true },
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  expect(create.ok()).toBeTruthy();
  const created = (await create.json()) as { scanId: string; scanToken: string };
  expect(created.scanId).toBeTruthy();
  expect(created.scanToken).toBeTruthy();

  // Mark it paid via webhook bypass
  const paid = await api.post("/api/stripe/webhook", {
    headers: { "x-test-bypass-signature": "1" },
    data: { scanId: created.scanId, tier: "mini" },
  });
  expect(paid.ok()).toBeTruthy();

  // Without token, paid scan details must be forbidden
  const forbidden = await api.get(`/api/scans/get?scanId=${encodeURIComponent(created.scanId)}`);
  expect(forbidden.status()).toBe(403);

  // Load scan page with scanId + token (Stripe redirect behavior)
  await page.goto(`/scan?scanId=${encodeURIComponent(created.scanId)}&token=${encodeURIComponent(created.scanToken)}`);

  await expect(page.getByText(/Freigeschaltet/i)).toBeVisible();
  await expect(page.getByText(/Vollreport/i)).toBeVisible();
  await expect(page.getByText(/Priorisierte Findings/i)).toBeVisible();
});

test("re-scan diff summary appears after rerun (test helper completes scans)", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("missing baseURL");

  const api = await playwrightRequest.newContext({ baseURL });

  // Create + pay a PLUS scan
  const create = await api.post("/api/scan", {
    data: { url: "https://example.com", authorizedToScan: true },
    headers: { "x-forwarded-for": "5.6.7.8" },
  });
  const created = (await create.json()) as { scanId: string; scanToken: string };

  await api.post("/api/stripe/webhook", {
    headers: { "x-test-bypass-signature": "1" },
    data: { scanId: created.scanId, tier: "plus" },
  });

  // Force-complete initial paid scan with fixture A
  await api.post("/api/test/completeScan", {
    headers: { "x-test-bypass": "1" },
    data: { scanId: created.scanId, kind: "A" },
  });

  // Open UI
  await page.goto(`/scan?scanId=${encodeURIComponent(created.scanId)}&token=${encodeURIComponent(created.scanToken)}`);
  await expect(page.getByText(/Freigeschaltet/i)).toBeVisible();

  // Trigger rerun
  await page.getByRole("button", { name: "Re-Scan" }).click();

  // New scanId will load; we complete it with fixture B (different findings) via test helper
  // Grab scanId from URL
  await page.waitForURL(/scan\?scanId=/);
  const url = new URL(page.url());
  const newScanId = url.searchParams.get("scanId");
  expect(newScanId).toBeTruthy();

  await api.post("/api/test/completeScan", {
    headers: { "x-test-bypass": "1" },
    data: { scanId: newScanId as string, kind: "B" },
  });

  // Reload record (UI fetches); expect diff summary
  await page.reload();
  await expect(page.getByText(/Re-Scan Vergleich:/i)).toBeVisible();
});
