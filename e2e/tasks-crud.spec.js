const { test, expect } = require('@playwright/test');

const BASE_URL  = 'http://localhost:5173';
const API_URL   = 'http://localhost:4000';
const RESET_URL = `${API_URL}/api/test/reset-db`;

async function apiSignup(ctx, { email, password, organization_name }) {
  const res = await ctx.post(`${API_URL}/api/auth/signup`, {
    data: { email, password, organization_name },
  });
  expect(res.status()).toBeLessThan(300);
  return res.json();
}

async function apiLogin(ctx, { email, password }) {
  const res = await ctx.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  expect(res.status()).toBeLessThan(300);
  return res.json();
}

async function apiCreateTask(ctx, { title, priority = 'medium', project_id }) {
  const res = await ctx.post(`${API_URL}/api/tasks`, {
    data: { title, priority, project_id },
  });
  expect(res.status()).toBeLessThan(300);
  return res.json();
}

test.describe('Tasks CRUD', () => {

  test.beforeEach(async ({ request }) => {
    const res = await request.post(RESET_URL);
    expect(res.status()).toBeLessThan(300);
  });

  test('create task happy path', async ({ page }) => {
    const USER = {
      email: 'lina@plateaudigital.ci',
      password: 'TaskFlow2026!',
      organization_name: 'Plateau Digital',
    };

    await apiSignup(page.request, USER);
    await apiLogin(page.request, { email: USER.email, password: USER.password });

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);

    // Utilise l'id exact du champ
    const titleInput = page.locator('#tf-title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Review Q1 contracts');

    await page.locator('#tf-priority').selectOption('high');

    await page.getByRole('button', { name: /add task|create task|submit/i }).click();
    await expect(page.getByText('Review Q1 contracts')).toBeVisible({ timeout: 6000 });
  });

  test('cross-tenant isolation: org B cannot read org A task', async ({ page, request }) => {
    const USER_A = {
      email: 'lina@plateaudigital.ci',
      password: 'TaskFlow2026!',
      organization_name: 'Plateau Digital',
    };
    const USER_B = {
      email: 'bob@otherorg.ci',
      password: 'TaskFlow2026!',
      organization_name: 'Other Org',
    };

    // Signup org A et recuperer son projet via le dashboard
    await apiSignup(request, USER_A);
    await apiLogin(request, { email: USER_A.email, password: USER_A.password });

    // Recuperer le project_id de org A via reset (seed project appartient a seed org)
    // On va creer une tache via UI pour org A
    await apiSignup(page.request, USER_A).catch(() => {}); // deja cree
    await apiLogin(page.request, { email: USER_A.email, password: USER_A.password });

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);

    // Lire le project_id depuis l'URL ou le DOM
    const projectIdAttr = await page.locator('[data-project-id]').getAttribute('data-project-id').catch(() => null);

    // Si pas de data-project-id, on utilise l'API directement
    // On signup org A fresh via request isolé
    const resetRes  = await request.post(RESET_URL);
    const resetBody = await resetRes.json();
    const seedProjectId = resetBody.project_id;

    // Signup org A avec request isolé (pas browser)
    const signupA = await request.post(`${API_URL}/api/auth/signup`, {
      data: USER_A,
    });
    await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USER_A.email, password: USER_A.password },
    });

    const taskRes = await request.post(`${API_URL}/api/tasks`, {
      data: { title: 'Confidential task org A', priority: 'high', project_id: seedProjectId },
    });

    const taskBody = await taskRes.json();
    const taskAId  = taskBody.id ?? taskBody.task?.id ?? taskBody.data?.id;
    expect(taskAId).toBeTruthy();

    // Login org B dans le browser
    await page.context().clearCookies();
    await apiSignup(page.request, USER_B);
    await apiLogin(page.request, { email: USER_B.email, password: USER_B.password });

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);

    // Org B essaie de lire la tache de org A
    const isolationRes = await page.request.get(`${API_URL}/api/tasks/${taskAId}`);
    expect([401, 403, 404]).toContain(isolationRes.status());
  });

});