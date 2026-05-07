/**
 * Security-headers middleware (CLAUDE.md Security Rule 5)
 *
 * Configures Helmet with project-mandated directives. Helmet must be mounted
 * BEFORE any route so every response — including error responses — carries the
 * full header set.
 *
 * CSP note: inline styles are temporarily permitted via 'unsafe-inline'.
 * Track in issue #TF-SEC-001 and replace with nonces before the next
 * security review.
 */

'use strict';

const helmet = require('helmet');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy directives.
 *
 * - default-src 'self'          → only same-origin resources by default
 * - script-src  'self'          → no inline scripts, no eval
 * - style-src   'self' 'unsafe-inline'  → inline styles allowed (temporary)
 * - img-src     'self' data:    → data URIs needed for small UI assets
 * - font-src    'self'
 * - connect-src 'self'          → XHR / fetch / WebSocket to same origin only
 * - frame-ancestors 'none'      → belt-and-suspenders alongside frameguard
 * - base-uri    'self'          → prevents base-tag hijacking
 * - form-action 'self'          → forms may only POST to same origin
 */
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc:  ["'self'"],
  styleSrc:   ["'self'", "'unsafe-inline'"],
  imgSrc:     ["'self'", 'data:'],
  fontSrc:    ["'self'"],
  connectSrc: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri:    ["'self'"],
  formAction: ["'self'"],
};

/**
 * HSTS is only meaningful over HTTPS, so we only set it in production.
 * In development, forcing HSTS would break plain-HTTP local testing.
 *
 * maxAge: 31 536 000 s = 1 year (matches CLAUDE.md spec exactly)
 */
const hstsOptions = IS_PRODUCTION
  ? { maxAge: 31_536_000, includeSubDomains: true }
  : false; // disabled — Helmet accepts `false` to skip the header

const securityHeaders = helmet({
  // --- CSP ------------------------------------------------------------------
  contentSecurityPolicy: {
    directives: cspDirectives,
  },

  // --- HSTS -----------------------------------------------------------------
  // When false, Helmet omits the Strict-Transport-Security header entirely.
  hsts: hstsOptions,

  // --- Clickjacking protection ----------------------------------------------
  // Emits: X-Frame-Options: DENY
  frameguard: { action: 'deny' },

  // --- MIME-type sniffing ---------------------------------------------------
  // Emits: X-Content-Type-Options: nosniff
  xContentTypeOptions: true,   // helmet key for noSniff (same effect)

  // --- Referrer policy ------------------------------------------------------
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // --- Defaults we keep on --------------------------------------------------
  // X-DNS-Prefetch-Control: off
  dnsPrefetchControl: { allow: false },
  // X-Download-Options: noopen  (IE-era, harmless to keep)
  ieNoOpen: true,
  // X-Permitted-Cross-Domain-Policies: none
  permittedCrossDomainPolicies: false,

  // --- Defaults we leave at Helmet's choice ---------------------------------
  // crossOriginEmbedderPolicy, crossOriginOpenerPolicy,
  // crossOriginResourcePolicy — keep Helmet defaults; revisit when
  // SharedArrayBuffer or cross-origin isolation is needed.
});

module.exports = securityHeaders;