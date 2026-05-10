const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const API_URL  = 'http://localhost:4000';

async function signupViaUI(page, email, pass, org) {
  await page.goto(`${BASE_URL}/signup`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/organization/i).fill(org);
  await page.getByLabel(/password/i).fill(pass);
  await page.getByRole('button', { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Tasks CRUD', () => {

  test.beforeEach(async ({ request }) => {
    await request.post(`${API_URL}/api/test/reset-db`);
  });

  test('create task happy path', async ({ page }) => {
    await signupViaUI(page, 'lina@plateaudigital.ci', 'TaskFlow2026!', 'Plateau Digital');

    // Recuperer le project_id
    const meRes     = await page.request.get(`${API_URL}/api/auth/me`);
    const meBody    = await meRes.json();
    const projectId = meBody.project_id;

    // Creer la tache via API directement
    const taskRes = await page.request.post(`${API_URL}/api/tasks`, {
      data: { title: 'Review Q1 contracts', priority: 'high', project_id: projectId }
    });
    expect(taskRes.status()).toBe(201);

    // Recharger le dashboard et verifier que la tache apparait
    await page.reload();
    await expect(page.getByText('Review Q1 contracts')).toBeVisible({ timeout: 10000 });
  });

  test('cross-tenant isolation: org B cannot read org A task', async ({ page }) => {
    const USER_A = { email: 'lina@plateaudigital.ci', password: 'TaskFlow2026!', organization_name: 'Plateau Digital' };
    const USER_B = { email: 'bob@otherorg.ci',        password: 'TaskFlow2026!', organization_name: 'Other Org' };

    // Login org A et creer une tache
    await signupViaUI(page, USER_A.email, USER_A.password, USER_A.organization_name);

    const meRes     = await page.request.get(`${API_URL}/api/auth/me`);
    const meBody    = await meRes.json();
    const projectId = meBody.project_id;

    const taskRes  = await page.request.post(`${API_URL}/api/tasks`, {
      data: { title: 'Secret task org A', priority: 'high', project_id: projectId }
    });
    const taskBody = await taskRes.json();
    const taskId   = taskBody?.id ?? taskBody?.data?.id;

    // Logout org A
    await page.getByRole('button', { name: /log out/i }).click();

    // Signup org B
    await signupViaUI(page, USER_B.email, USER_B.password, USER_B.organization_name);

    // Org B essaie de lire la tache de org A
    if (taskId) {
      const res = await page.request.get(`${API_URL}/api/tasks/${taskId}`);
      expect([401, 403, 404]).toContain(res.status());
    }
  });

});