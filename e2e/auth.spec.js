const { test, expect } = require('@playwright/test');

const EMAIL    = 'lina@plateaudigital.ci';
const PASSWORD = 'TaskFlow2026!';
const ORG_NAME = 'Plateau Digital';

async function resetDb(request) {
  const res = await request.post('http://localhost:4000/api/test/reset-db');
  if (!res.ok()) throw new Error(`reset-db failed: ${res.status()}`);
}

test.beforeEach(async ({ request }) => {
  await resetDb(request);
});

test.describe('Auth flows', () => {

  test('signup — creates account and redirects to dashboard', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/organization/i).fill(ORG_NAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 8000 });
  });

  test('login — authenticates existing user', async ({ page }) => {
    // Signup first
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/organization/i).fill(ORG_NAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Clear cookies to simulate new session
    await page.context().clearCookies();

    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 8000 });
  });

  test('logout — clears session and protects dashboard', async ({ page }) => {
    // Signup first
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/organization/i).fill(ORG_NAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:5173\/?$/);

    // Dashboard should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

});