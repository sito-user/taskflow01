'use strict';

const rateLimit = require('express-rate-limit');

const buildHandler = (message) => (req, res) => {
  const retryAfterSec = req.rateLimit?.resetTime
    ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
    : 900;

  res.status(429).json({
    status: 429,
    error: 'rate_limit_exceeded',
    message,
    retry_after: retryAfterSec,
  });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === 'test',
  handler: buildHandler('Too many attempts. Please try again later.'),
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: buildHandler('Too many requests. Please try again later.'),
});

module.exports = { authLimiter, apiLimiter };