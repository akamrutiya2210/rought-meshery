import { expect, test as setup } from '@playwright/test';
import { ENV } from './env';

const authFile = 'playwright/.auth/user.json';
async function waitForServer(url, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (e) {
      // Ignore errors and retry
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
}

setup('authenticate', async ({ page }) => {
  try {
    console.log("Navigating to provider selection URL");
    await waitForServer(ENV.PROVIDER_SELECTION_URL);

    await page.getByLabel('Select Provider').click();
    await page.getByRole('menuitem', { name: 'Meshery' }).click();
    await page.getByLabel('E-Mail').fill(ENV.REMOTE_PROVIDER_USER.email);
    await page.getByLabel('Password').fill(ENV.REMOTE_PROVIDER_USER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(async () => {
      const url = page.url();
      const redirect_urls = new Set([ENV.MESHERY_SERVER_URL + '/', ENV.REMOTE_PROVIDER_URL + '/']);
      const redirected = redirect_urls.has(url);
      return expect(redirected).toBeTruthy();
    }).toPass();

    console.log("Authentication successful");
    await page.context().storageState({ path: authFile });
  } catch (error) {
    console.error("Error during authentication:", error);
    throw error;
  }
});