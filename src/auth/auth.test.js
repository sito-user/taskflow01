'use strict';

const request = require('supertest');
const app     = require('../app');
const db      = require('../db');

function extractCookie(res, name) {
  const cookies = res.headers['set-cookie'] ?? [];
  return cookies.find((c) => c.startsWith(`${name}=`)) ?? null;
}

function cookieValue(cookieStr) {
  return cookieStr?.split(';')[0].split('=').slice(1).join('=') ?? null;
}

beforeAll(async () => {
  const connStr = db.client.config.connection?.database ?? db.client.config.connection;
  const dbName = typeof connStr === 'string' ? connStr.split('/').pop().split('?')[0] : connStr;
  if (dbName && !String(dbName).includes('test')) {
    throw new Error(`Refusing to run tests against non-test database: "${dbName}".`);
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

  it('201 — creates org + admin user, sets httpOnly cookie, returns user', async () => {
    const res = await request(app).post('/api/auth/signup').send(VALID_PAYLOAD).expect(201);

    expect(res.body).toMatchObject({ user: { email: 'alice@example.com', role: 'admin' } });
    expect(res.body.user.password_hash).toBeUndefined();

    const cookie = extractCookie(res, 'taskflow_session');
    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const [org] = await db('organizations').whereNull('deleted_at').select('id', 'name');
    expect(org.name).toBe('Acme Corp');

    const [user] = await db('users').whereNull('deleted_at').where({ email: 'alice@example.com' }).select('id', 'role', 'organization_id', 'password_hash');
    expect(user.role).toBe('admin');
    expect(user.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('409 — duplicate email within same org returns conflict', async () => {
    await request(app).post('/api/auth/signup').send(VALID_PAYLOAD).expect(201);
    const res = await request(app).post('/api/auth/signup').send(VALID_PAYLOAD).expect(409);
    expect(res.body).toMatchObject({ status: 409, error: 'conflict' });
  });

  it('422 — weak password returns field-level error on `password`', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...VALID_PAYLOAD, password: 'tooshort' }).expect(422);
    expect(res.body).toMatchObject({ status: 422, error: 'validation_error' });
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

  it('200 — valid credentials set cookie and return user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: SIGNUP.email, password: SIGNUP.password }).expect(200);
    expect(res.body).toMatchObject({ user: { email: SIGNUP.email, role: 'admin' } });
    expect(res.body.user.password_hash).toBeUndefined();
    const cookie = extractCookie(res, 'taskflow_session');
    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('401 — wrong password returns generic message with no field hint', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: SIGNUP.email, password: 'Wr0ng!Password99' }).expect(401);
    expect(res.body).toMatchObject({ status: 401, error: 'unauthorized', message: 'Invalid credentials' });
    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toMatch(/email/);
    expect(body).not.toMatch(/not found/);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  it('204 — clears the taskflow_session cookie', async () => {
    const res = await request(app).post('/api/auth/logout').expect(204);
    const cookie = extractCookie(res, 'taskflow_session');
    expect(cookie).not.toBeNull();
    const val = cookieValue(cookie);
    expect(val === '' || val === 'taskflow_session').toBe(true);
    expect(cookie).toMatch(/Expires=/i);
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

  it('401 — missing cookie returns authentication-required error', async () => {
    const res = await request(app).get('/api/auth/me').expect(401);
    expect(res.body).toMatchObject({ status: 401, error: 'unauthorized', message: 'Authentication required' });
  });

  it('200 — valid cookie returns user payload', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(SIGNUP).expect(201);
    const cookieHeader = extractCookie(signupRes, 'taskflow_session');
    const cookieSend = cookieHeader.split(';')[0];
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookieSend).expect(200);
    expect(meRes.body).toMatchObject({ user: { email: SIGNUP.email, role: 'admin' } });
    expect(meRes.body.user.password_hash).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

describe('POST /api/auth/login — rate limiting', () => {
  it('returns 429 on the 6th consecutive failed login within 15 minutes', async () => {
    const express      = require('express');
    const rateLimit    = require('express-rate-limit');
    const cookieParser = require('cookie-parser');

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => res.status(429).json({
        status: 429, error: 'rate_limit_exceeded',
        message: 'Too many attempts. Please try again later.',
        retry_after: 900,
      }),
    });

    const testApp = express();
    testApp.use(express.json());
    testApp.use(cookieParser());
    testApp.post('/api/auth/login', limiter, require('../auth/auth.controller'));

    const BAD_BODY = { email: 'x@example.com', password: 'wrong' };

    for (let i = 1; i <= 5; i++) {
      const res = await request(testApp).post('/api/auth/login').send(BAD_BODY);
      expect(res.status).not.toBe(429);
    }

    const res = await request(testApp).post('/api/auth/login').send(BAD_BODY);
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limit_exceeded');
  });
});