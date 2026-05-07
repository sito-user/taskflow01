'use strict';

const express      = require('express');
const cookieParser = require('cookie-parser');

const db           = require('./db');
const taskRoutes   = require('./routes/tasks');
const authRoutes   = require('./auth/auth.controller');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use((req, _res, next) => {
  req.db = db;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use(errorHandler);

module.exports = app;