import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node ../api/dist/main.js",
      url: "http://127.0.0.1:3100",
      env: { PORT: "3100" },
      reuseExistingServer: false,
    },
    {
      command: "pnpm dev --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: { LUNAR_API_URL: "http://127.0.0.1:3100" },
      reuseExistingServer: false,
    },
  ],
});
