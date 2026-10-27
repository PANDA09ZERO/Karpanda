import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5175",
    ...devices["Desktop Chrome"],
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev -- --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: false,
      env: { VITE_DEMO_MODE: "true" },
    },
    {
      command: "npm run dev -- --port 5176 --strictPort",
      url: "http://127.0.0.1:5176",
      reuseExistingServer: false,
      env: {
        VITE_DEMO_MODE: "false",
        VITE_SUPABASE_URL: "https://mock-supabase.test",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
      },
    },
  ],
});
