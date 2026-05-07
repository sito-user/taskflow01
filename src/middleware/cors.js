/**
 * CORS middleware (CLAUDE.md Security Rule 6)
 *
 * Origin allow-list is driven entirely by environment variables — no
 * wildcard '*' is ever used in production.
 *
 * Expected env vars
 * -----------------
 * CORS_ORIGIN   Comma-separated list of allowed origins.
 *               Production example : "https://app.taskflow.io,https://www.taskflow.io"
 *               Development example: "http://localhost:3000,http://localhost:5173"
 *
 * NODE_ENV      "production" | "development" | "test"
 *
 * Behaviour by environment
 * ------------------------
 * production  — CORS_ORIGIN MUST be set. The process exits (fail-loud) if it
 *               is absent or empty, so a mis-deployed instance never silently
 *               accepts requests from unintended origins.
 *
 * development — If CORS_ORIGIN is not set, a safe localhost fallback list is
 *               used so developers can start without extra env-var ceremony.
 *               Common Vite (5173), CRA (3000), and plain Node (4000) ports
 *               are included.
 *
 * test        — Follows the same logic as development; the test runner sets
 *               its own CORS_ORIGIN when cross-origin behaviour must be tested.
 */

'use strict';

const cors = require('cors');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Build the allowed-origin list
// ---------------------------------------------------------------------------

/** Parse and trim a comma-separated origin string, filtering empty entries. */
function parseOrigins(raw) {
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Localhost variants used as a development fallback.
 * Covers the three most common frontend dev-server ports.
 */
const DEV_LOCALHOST_FALLBACK = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:5173',
];

function resolveAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN;

  if (IS_PRODUCTION) {
    if (!raw || raw.trim() === '') {
      // Fail loudly — a missing allow-list in production is a mis-deployment,
      // not a situation we should silently paper over.
      throw new Error(
        '[CORS] CORS_ORIGIN environment variable is not set. ' +
        'Refusing to start in production without an explicit origin allow-list. ' +
        'Set CORS_ORIGIN to a comma-separated list of allowed origins, e.g. ' +
        '"https://app.taskflow.io,https://www.taskflow.io".',
      );
    }
    return parseOrigins(raw);
  }

  // Development / test: use CORS_ORIGIN if provided, otherwise fall back to
  // localhost variants so the dev experience requires zero extra setup.
  if (raw && raw.trim() !== '') {
    return parseOrigins(raw);
  }

  console.warn(
    '[CORS] CORS_ORIGIN is not set. ' +
    `Falling back to localhost variants: ${DEV_LOCALHOST_FALLBACK.join(', ')}`,
  );
  return DEV_LOCALHOST_FALLBACK;
}

const allowedOrigins = resolveAllowedOrigins();

// ---------------------------------------------------------------------------
// Origin validation callback
// ---------------------------------------------------------------------------

/**
 * cors() accepts a function for `origin` so we can inspect each request's
 * Origin header and either approve it or reject it with an explicit error.
 *
 * Passing `false` to the callback blocks the request (no ACAO header emitted).
 * Passing `true` echoes the Origin back, effectively allowing it.
 */
function originValidator(requestOrigin, callback) {
  // Allow requests with no Origin header (same-origin, server-to-server, curl).
  if (!requestOrigin) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(requestOrigin)) {
    return callback(null, true);
  }

  callback(
    new Error(
      `[CORS] Origin "${requestOrigin}" is not in the allow-list. ` +
      'Add it to the CORS_ORIGIN environment variable if this is intentional.',
    ),
  );
}

// ---------------------------------------------------------------------------
// Assembled CORS middleware
// ---------------------------------------------------------------------------

const corsMiddleware = cors({
  origin: originValidator,

  // Required so the browser sends the httpOnly auth cookie cross-origin.
  credentials: true,

  // Explicit method list — OPTIONS is included so pre-flight requests succeed.
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers the client is allowed to send.
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],

  // Headers the browser JS is allowed to read from the response.
  exposedHeaders: ['X-Request-ID'],

  // Cache the pre-flight response for 10 minutes to reduce extra round-trips.
  maxAge: 600,
});

module.exports = corsMiddleware;