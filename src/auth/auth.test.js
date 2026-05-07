/**
 * src/auth/auth.test.js
 *
 * Integration tests for JWT authentication.
 * Written FIRST per CLAUDE.md Testing Rule 1 (Red → Green → Refactor).
 *
 * Runs against taskflow_test — never the dev database.
 * Requires: NODE_ENV=test, TEST_DATABASE_URL pointing at taskflow_test.
 */

'use strict';

const request = require('supertest');
const app     = require('../app');
const db      = require('../db');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the Set-Cookie header and return the raw cookie string. */
function extractCookie(res, name) {
  const cookies = res.headers['set-cookie'] ?? [];
  return cookies.find((c) => c.startsWith(`${name}=`)) ?? null;
}

/** Strip a cookie value out of a raw Set-Cookie header entry. */
function cookieValue(cookieStr) {
  return cookieStr?.split(';')[0].split('=').slice(1).join('=') ?? null;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Ensure we are NEVER touching the dev database.
  const connStr = db.client.config.connection?.database
    ?? db.client.config.connection; // could be a URL string
  const dbName = typeof connStr === 'string'
    ? connStr.split('/').pop().split('?')[0]
    : connStr;

  if (dbName && !String(dbName).includes('test')) {
    throw new Error(
      `Refusing to run tests against non-test database: "${dbName}". ` +
      'Set TEST_DATABASE_URL to a *_test database.',
    );
  }

  await db.migrate.latest();
});

beforeEach(async () => {
  await db('tasks').del();
  await db('projects').del();
  await db('users').del();
  await db('organizations').del();
});

afterAll(async () => {
  await db.destroy();
});

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------

describe('POST /api/auth/signup', () => {
  const VALID_PAYLOAD = {
    email:             'alice@example.com',
    password:          'Str0ng!Password99',
    organization_name: 'Acme Corp',
  };

  // ── 1. Happy path ──────────────────────────────────────────────────────

  it('201 — creates org + admin user, sets httpOnly cookie, returns user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(VALID_PAYLOAD)
      .expect(201);

    // Response shape
    expect(res.body).toMatchObject({
      user: {
        email: 'alice@example.com',
        role:  'admin',
      },
    });
    // No password hash in response
    expect(res.body.user.password_hash).toBeUndefined();

    // Cookie set
    const cookie = extractCookie(res, 'taskflow_session');
    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    // Secure flag is set in production; in test NODE_ENV it may be absent —
    // assert the attribute is present when NODE_ENV is 'production'.
    if (process.env.NODE_ENV === 'production') {
      expect(cookie).toMatch(/Secure/i);
    }

    // Rows created in DB
    const [org] = await db('organizations')
      .whereNull('deleted_at')
      .select('id', 'name');
    expect(org.name).toBe('Acme Corp');

    const [user] = await db('users')
      .whereNull('deleted_at')
      .where({ email: 'alice@example.com' })
      .select('id', 'role', 'organization_id', 'password_hash');

    expect(user.role).toBe('admin');
    expect(user.organization_id).toBe(org.id);
    // Password must be hashed — never stored in plain text
    expect(user.password_hash).not.toBe(VALID_PAYLOAD.password);
    expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
  });

  // ── 2. Duplicate email ─────────────────────────────────────────────────

  it('409 — duplicate email within same org returns conflict', async () => {
    await request(app).post('/api/auth/signup').send(VALID_PAYLOAD).expect(201);

    const res = await request(app)
      .post('/api/auth/signup')
      .send(VALID_PAYLOAD)
      .expect(409);

    expect(res.body).toMatchObject({ status: 409, error: 'conflict' });
  });

  // ── 3. Weak password ───────────────────────────────────────────────────

  it('422 — weak password returns field-level error on `password`', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...VALID_PAYLOAD, password: 'tooshort' })
      .expect(422);

    expect(res.body).toMatchObject({ status: 422, error: 'validation_error' });
    expect(Array.isArray(res.body.details)).toBe(true);

    const passwordError = res.body.details.find((d) => d.field === 'password');
    expect(passwordError).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  const SIGNUP = {
    email:             'bob@example.com',
    password:          'C0rrect!H0rseBattery',
    organization_name: 'Beta Inc',
  };

  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(SIGNUP).expect(201);
  });

  // ── 4. Happy path ──────────────────────────────────────────────────────

  it('200 — valid credentials set cookie and return user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SIGNUP.email, password: SIGNUP.password })
      .expect(200);

    expect(res.body).toMatchObject({
      user: { email: SIGNUP.email, role: 'admin' },
    });
    expect(res.body.user.password_hash).toBeUndefined();

    const cookie = extractCookie(res, 'taskflow_session');
    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/HttpOnly/i);
  });

  // ── 5. Wrong password — generic 401 ───────────────────────────────────

  it('401 — wrong password returns generic message with no field hint', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SIGNUP.email, password: 'Wr0ng!Password99' })
      .expect(401);

    expect(res.body).toMatchObject({
      status:  401,
      error:   'unauthorized',
      message: 'Invalid credentials',
    });

    // The error must NOT reveal which field (email or password) was wrong.
    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toMatch(/email/);
    expect(body).not.toMatch(/password/);
    expect(body).not.toMatch(/not found/);
    expect(body).not.toMatch(/does not exist/);
    expect(body).not.toMatch(/incorrect/);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  it('204 — clears the taskflow_session cookie', async () => {
    const res = await request(app).post('/api/auth/logout').expect(204);

    const cookie = extractCookie(res, 'taskflow_session');
    // Cookie must be present in Set-Cookie with empty/expired value
    expect(cookie).not.toBeNull();
    const val = cookieValue(cookie);
    expect(val === '' || val === 'taskflow_session').toBe(true);

    // Expires must be in the past (cleared)
    expect(cookie).toMatch(/Expires=/i);
    const expiresPart = cookie.split(';').find((p) => p.trim().startsWith('Expires='));
    if (expiresPart) {
      const expDate = new Date(expiresPart.split('=')[1]);
      expect(expDate.getTime()).toBeLessThan(Date.now());
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

describe('GET /api/auth/me', () => {
  const SIGNUP = {
    email:             'carol@example.com',
    password:          'M3gaS3cure!Pass',
    organization_name: 'Gamma LLC',
  };

  // ── 6. No cookie → 401 ────────────────────────────────────────────────

  it('401 — missing cookie returns authentication-required error', async () => {
    const res = await request(app).get('/api/auth/me').expect(401);

    expect(res.body).toMatchObject({
      status:  401,
      error:   'unauthorized',
      message: 'Authentication required',
    });
  });

  // ── 7. Valid cookie → 200 ─────────────────────────────────────────────

  it('200 — valid cookie returns user payload', async () => {
    // Sign up to obtain a session cookie
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send(SIGNUP)
      .expect(201);

    const cookieHeader = extractCookie(signupRes, 'taskflow_session');
    expect(cookieHeader).not.toBeNull();

    // Use only the name=value portion when sending Cookie header
    const cookieSend = cookieHeader.split(';')[0];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookieSend)
      .expect(200);

    expect(meRes.body).toMatchObject({
      user: {
        email: SIGNUP.email,
        role:  'admin',
      },
    });
    expect(meRes.body.user.password_hash).toBeUndefined();
    expect(meRes.body.user.id).toBeDefined();
    expect(meRes.body.user.organization_id).toBeDefined();
  });
});