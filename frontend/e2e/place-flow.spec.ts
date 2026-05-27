import { expect, test } from '@playwright/test';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:8000';

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${apiBase}/__test/reset`);
  expect(response.ok()).toBeTruthy();
});

test('creates a place, adds a visit, and deletes the place', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('No places found. Try adjusting filters or add a new place.')).toBeVisible();

  await page.getByRole('link', { name: /add place/i }).click();
  await page.getByLabel('Name').fill('E2E Cafe');
  await page.getByLabel('Location summary').fill('London');
  await page.getByLabel('Location (lat,lon)').fill('51.500000,-0.100000');
  await page.getByLabel('Description').fill('Created by the Playwright happy path.');
  await page.getByLabel('Cost').selectOption('1');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'E2E Cafe' })).toBeVisible();
  await expect(page.getByText('Created by the Playwright happy path.')).toBeVisible();

  await page.getByLabel('Date').fill('2026-05-27');
  await page.getByLabel('Rating').selectOption('5');
  await page.getByLabel('Notes').fill('Lovely visit');
  await page.getByRole('button', { name: 'Add Visit' }).click();

  await expect(page.getByText('Rating: 5/5')).toBeVisible();
  await expect(page.getByText('Lovely visit')).toBeVisible();

  await page.goto('/');
  await expect(page.getByText('E2E Cafe')).toBeVisible();

  await page.getByText('E2E Cafe').click();
  await page.getByRole('button', { name: 'Delete' }).first().click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('No places found. Try adjusting filters or add a new place.')).toBeVisible();
});
