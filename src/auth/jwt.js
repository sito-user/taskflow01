/**
 * src/auth/jwt.js
 *
 * Thin, testable wrappers around jsonwebtoken.
 * All secrets come from environment variables (CLAUDE.md Security Rule 7).
 */

'use strict';

const jsonwebtoken = require('jsonwebtoken');

// Fail loudly at startup if the secret is missing — never silently use a weak default.
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
      'Set it to a long random string before starting the server.',
    );
  }
  return secret;
}

/**
 * Sign a JWT.
 *
 * @param {{ user_id: string, organization_id: string, role: string }} payload
 * @returns {string} Signed JWT string
 */
function sign(payload) {
  const { user_id, organization_id, role } = payload;

  if (!user_id || !organization_id || !role) {
    throw new Error('jwt.sign: payload must include user_id, organization_id, and role');
  }

  return jsonwebtoken.sign(
    { user_id, organization_id, role },
    getSecret(),
    {
      expiresIn:  '7d',
      algorithm:  'HS256',
    },
  );
}

/**
 * Verify and decode a JWT.
 *
 * @param {string} token
 * @returns {{ user_id: string, organization_id: string, role: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError} on invalid / expired token
 */
function verify(token) {
  return jsonwebtoken.verify(token, getSecret(), { algorithms: ['HS256'] });
}

module.exports = { sign, verify };