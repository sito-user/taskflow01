/**
 * src/auth/auth.controller.js
 *
 * Route handlers for authentication.
 * Layer: controller — calls service, sets cookies, never touches DB directly.
 *
 * Mount in app.js:
 *   const authController = require('./auth/auth.controller');
 *   app.use('/api/auth', authController);
 */

'use strict';

const express = require('express');

const authService               = require('./auth.service');
const { signupSchema, loginSchema, validate } = require('./auth.validation');
const authenticate              = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'taskflow_session';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Cookie options aligned with CLAUDE.md Security Rule 1.
 *
 * In production we MUST use SameSite=None + Secure because the SPA and the
 * API live on different subdomains of onrender.com (treated as cross-site
 * by browsers because onrender.com is on the Public Suffix List).
 *
 * In development we use SameSite=Lax over plain HTTP.
 */
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    path:     '/',
  };
}

function setSessionCookie(res, _req, token) {
  res.cookie(COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(res) {
  // IMPORTANT: clearCookie must use the SAME attributes as the set call
  // (httpOnly, secure, sameSite, path) or the browser silently ignores the
  // Set-Cookie response — which is exactly what was breaking logout in prod.
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { value, error } = validate(signupSchema, req.body);
    if (error) return res.status(422).json(error);

    const { email, password, organization_name } = value;
    const { user, token, project_id } = await authService.signup(email, password, organization_name);

    setSessionCookie(res, req, token);
    return res.status(201).json({ user, project_id });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { value, error } = validate(loginSchema, req.body);
    if (error) return res.status(422).json(error);

    const { email, password } = value;
    const { user, token } = await authService.login(email, password);

    setSessionCookie(res, req, token);
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.status(204).end();
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

router.get('/me', authenticate, async (req, res) => {
  try {
    const db = require('../db');
    const project = await db('projects')
      .whereNull('deleted_at')
      .where({ organization_id: req.user.organization_id })
      .first(['id']);

    return res.status(200).json({
      user: req.user,
      project_id: project?.id ?? null
    });
  } catch (err) {
    return res.status(200).json({ user: req.user, project_id: null });
  }
});

// ---------------------------------------------------------------------------
// Error handler scoped to auth routes
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err.name === 'ConflictError') {
    return res.status(409).json({
      status:  409,
      error:   'conflict',
      message: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status:  401,
      error:   'unauthorized',
      message: err.message,
    });
  }

  next(err);
});

module.exports = router;