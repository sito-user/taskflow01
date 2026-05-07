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

const app = express();

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

module.exports = app;