const request = require('supertest');
const app     = require('../../app');
const db      = require('../../db');

const ORG_ID     = 'a1000000-0000-4000-8000-000000000001';
const PROJECT_ID = 'c1000000-0000-4000-8000-000000000001';
const USER_ID    = 'b1000000-0000-4000-8000-000000000001';
const ORG2_ID     = 'a2000000-0000-4000-8000-000000000002';
const PROJECT2_ID = 'c2000000-0000-4000-8000-000000000002';
const USER2_ID    = 'b2000000-0000-4000-8000-000000000002';

function randomUuid() {
  return 'f0000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0');
}

async function seedSecondTenant() {
  await db('organizations').insert({ id: ORG2_ID, name: 'Beirut Corp', slug: 'beirut-corp', created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
  await db('users').insert({ id: USER2_ID, email: 'user2@beirut.example', first_name: 'Ali', last_name: 'Hassan', password_hash: 'hash', role: 'member', organization_id: ORG2_ID, created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
  await db('projects').insert({ id: PROJECT2_ID, name: 'Project Beta', status: 'active', owner_id: USER2_ID, organization_id: ORG2_ID, created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
}

beforeEach(async () => {
  await db('tasks').del();
  await db('projects').del();
  await db('users').del();
  await db('organizations').del();

  await db('organizations').insert({ id: ORG_ID, name: 'Acme Corp', slug: 'acme-corp', created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
  await db('users').insert({ id: USER_ID, email: 'member@acme.example', first_name: 'Layla', last_name: 'Hassan', password_hash: 'hash', role: 'member', organization_id: ORG_ID, created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
  await db('projects').insert({ id: PROJECT_ID, name: 'Project Alpha', status: 'active', owner_id: USER_ID, organization_id: ORG_ID, created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
});

afterAll(async () => {
  await db.destroy();
});

describe('POST /api/tasks', () => {
  it('201 — creates a task and returns the expected shape', async () => {
    const payload = { title: 'Write integration tests', project_id: PROJECT_ID, priority: 'high' };
    const res = await request(app).post('/api/tasks').set('X-User-Id', USER_ID).send(payload).expect(201);
    const body = res.body;
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(body.title).toBe(payload.title);
    expect(body.organization_id).toBe(ORG_ID);
    expect(body.created_by).toBe(USER_ID);
    expect(body.created_at).toBeTruthy();
    expect(body.updated_at).toBeTruthy();
    expect(body.deleted_at).toBeNull();
    const [row] = await db('tasks').where({ id: body.id });
    expect(row).toBeDefined();
    expect(row.organization_id).toBe(ORG_ID);
  });

  it('401 — no X-User-Id header', async () => {
    await request(app).post('/api/tasks').send({ title: 'Ghost', project_id: PROJECT_ID }).expect(401);
  });

  it('422 — missing title returns validation_error shape', async () => {
    const res = await request(app).post('/api/tasks').set('X-User-Id', USER_ID).send({ project_id: PROJECT_ID }).expect(422);
    expect(res.body).toMatchObject({ status: 422, error: 'validation_error', message: expect.any(String), fields: { title: expect.any(String) } });
  });

  it('404 — project_id belongs to a different org', async () => {
    await seedSecondTenant();
    await request(app).post('/api/tasks').set('X-User-Id', USER_ID).send({ title: 'Sneaky', project_id: PROJECT2_ID }).expect(404);
  });
});

describe('GET /api/tasks/:id', () => {
  async function seedTask(overrides = {}) {
    const task = { id: 'd1000000-0000-4000-8000-000000000001', title: 'Seeded task', status: 'todo', priority: 'medium', project_id: PROJECT_ID, organization_id: ORG_ID, created_by: USER_ID, created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null, ...overrides };
    await db('tasks').insert(task);
    const [row] = await db('tasks').where({ id: task.id });
    return row;
  }

  it('200 — returns the seeded task', async () => {
    const seeded = await seedTask();
    const res = await request(app).get(`/api/tasks/${seeded.id}`).set('X-User-Id', USER_ID).expect(200);
    expect(res.body.id).toBe(seeded.id);
    expect(res.body.title).toBe(seeded.title);
    expect(res.body.organization_id).toBe(ORG_ID);
  });

  it('401 — no X-User-Id header', async () => {
    const seeded = await seedTask();
    await request(app).get(`/api/tasks/${seeded.id}`).expect(401);
  });

  it('404 — random UUID that does not exist', async () => {
    await request(app).get(`/api/tasks/${randomUuid()}`).set('X-User-Id', USER_ID).expect(404);
  });

  it('404 — task owned by different org is invisible', async () => {
    await seedSecondTenant();
    const task2Id = 'd2000000-0000-4000-8000-000000000002';
    await db('tasks').insert({ id: task2Id, title: 'Secret', status: 'todo', priority: 'low', project_id: PROJECT2_ID, organization_id: ORG2_ID, created_by: USER2_ID, created_at: db.fn.now(), updated_at: db.fn.now(), deleted_at: null });
    await request(app).get(`/api/tasks/${task2Id}`).set('X-User-Id', USER_ID).expect(404);
  });
});
