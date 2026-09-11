import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for AI Factory.
 *
 * Strategy:
 *  - The dev server (Vite + air-jam-server) is started by the test runner.
 *  - Tests run in a single Chromium browser and open multiple pages/contexts
 *    to simulate Host + 5 Controllers talking to the same live server.
 *  - Timeout is generous (90 s) because the dev server cold-start can be slow.
 *
 * Run:   pnpm run test:e2e
 * Debug: pnpm exec playwright test --ui
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,     // game tests depend on shared server state
  workers: 1,               // one worker — all pages in one process
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the full dev server before any test runs.
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
