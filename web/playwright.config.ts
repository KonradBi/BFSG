import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
    headless: true,
  },
  webServer: {
    command: `cd ${JSON.stringify(path.resolve(__dirname))} && PLAYWRIGHT_TEST=1 TEST_SCAN_FIXTURES=1 PORT=${PORT} NEXTAUTH_URL=${BASE_URL} NEXT_PUBLIC_APP_URL=${BASE_URL} RETENTION_DAYS=30 STRIPE_SECRET_KEY=dummy STRIPE_WEBHOOK_SECRET=dummy npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
