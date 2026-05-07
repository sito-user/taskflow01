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

/**
 * Cookie options aligned with CLAUDE.md Security Rule 1:
 * httpOnly, Secure (production only), SameSite=Lax.
 *
 * We do NOT use SameSite=Strict because that breaks OAuth redirect flows
 * and external deep-links — Lax is the right default for a SaaS app.
 */
function cookieOptions(req) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms (matches JWT expiry)
    path:     '/',
  };
}

function setSessionCookie(res, req, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions(req));
}

function clearSessionCookie(res) {
  // Clearing requires matching path; maxAge:0 / expires in the past clears it.
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
  });
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { value, error } = validate(signupSchema, req.body);
    if (error) return res.status(422).json(error);

    const { email, password, organization_name } = value;
    const { user, token } = await authService.signup(email, password, organization_name);

    setSessionCookie(res, req, token);
    return res.status(201).json({ user });
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

router.get('/me', authenticate, (req, res) => {
  // authenticate middleware has already attached req.user
  return res.status(200).json({ user: req.user });
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
      message: err.message, // always "Invalid credentials"
    });
  }

  // Unhandled — forward to global error handler
  next(err);
});

module.exports = router;