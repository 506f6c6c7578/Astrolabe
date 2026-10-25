import { defineConfig, devices } from "@playwright/test";

const port = 4321;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: "tests/e2e",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: "list",
    use: {
        baseURL,
        locale: "fr-FR",
        timezoneId: "Europe/Paris",
        trace: "retain-on-failure"
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "mobile", use: { ...devices["Pixel 7"] } }
    ],
    webServer: {
        command: "pnpm preview",
        url: baseURL,
        env: { HOST: "127.0.0.1", PORT: String(port) },
        reuseExistingServer: !process.env.CI
    }
});
