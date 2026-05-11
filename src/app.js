'use strict';

const express         = require('express');
const cookieParser    = require('cookie-parser');
const securityHeaders = require('./middleware/security-headers');
const corsMiddleware  = require('./middleware/cors');

const db           = require('./db');
const taskRoutes   = require('./routes/tasks');
const authRoutes   = require('./auth/auth.controller');
const { errorHandler } = require('./middleware/error-handler');
const { apiLimiter }   = require('./middleware/rate-limit');
const healthcheck = require('./observability/healthcheck');
const logger        = require('./observability/logger');
const correlationId = require('./middleware/correlation-id');

const app = express();

// ---------------------------------------------------------------------------
// Trust the Render reverse proxy (FIRST — must come before rate-limit, cookies)
// ---------------------------------------------------------------------------
// Render terminates TLS at its edge and forwards via X-Forwarded-* headers.
// Without this, every request looks like it comes from the same proxy IP and
// the rate limiter locks out *all* users after a handful of failed attempts.
// `1` = trust the first hop only (Render's edge proxy).
app.set('trust proxy', 1);

app.use(correlationId);

app.use(healthcheck);

// 1. Security headers — FIRST
app.use(securityHeaders);

// 2. CORS — SECOND
app.use(corsMiddleware);
app.options('*', corsMiddleware);

// 3. Body parsers + cookie
app.use(express.json());
app.use(cookieParser());

// 4. DB on request
app.use((req, _res, next) => {
  req.db = db;
  next();
});

// 5. Rate limit + routes
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 6. Error handler — LAST
app.use(errorHandler);

// Test-only utilities
if (process.env.NODE_ENV === 'test_e2e') {
  const testResetRouter = require('./test-utils/reset');
  app.use('/api/test', testResetRouter);
  console.info('[app] test-utils router mounted at /api/test');
}

module.exports = app;

// ---------------------------------------------------------------------------
// Boot the HTTP server when this file is the entry point (e.g. `node src/app.js`
// or Render's default start command). When app.js is `require()`-d by tests or
// by server.js, `require.main !== module` and we skip listening — that avoids
// the double-listen / EADDRINUSE crash you had before.
// ---------------------------------------------------------------------------
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`TaskFlow API listening on port ${PORT}`));
}