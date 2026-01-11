import { test, expect } from '@playwright/test';

test.describe('Ocean App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Check for Main Title (Pacific Serenity is the first one)
    // Wait for it to be visible, which implies loading is done
    const title = page.getByRole('heading', { name: /Pacific Serenity/i });
    await expect(title).toBeVisible();
  });

  test('loads the application and renders initial ocean', async ({ page }) => {
    // Check for Description
    const description = page.getByText(/Drifting through calm, pastel waters/i);
    await expect(description).toBeVisible();
  });

  test('can navigate between oceans', async ({ page }) => {
    // Click on the second ocean (Atlantic Drift)
    const atlanticButton = page.getByLabel('Switch to Atlantic Drift');
    await atlanticButton.click();

    // Verify title changes
    const title = page.getByRole('heading', { name: /Atlantic Drift/i });
    await expect(title).toBeVisible();

    // Verify background color changes (implicitly via checking elements or screenshot)
    // Here we just check text content
    const description = page.getByText(/Gentle currents and minty hues/i);
    await expect(description).toBeVisible();
  });

  test('Sound toggle works', async ({ page }) => {
    const toggle = page.getByLabel('Enable sound');
    await expect(toggle).toBeVisible();

    await toggle.click();

    // Label should change to Mute
    const muteToggle = page.getByLabel('Mute sound');
    await expect(muteToggle).toBeVisible();
  });
});
