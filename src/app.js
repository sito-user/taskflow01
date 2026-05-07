'use strict';

const express = require('express');
const db = require('./db');
const taskRoutes = require('./routes/tasks');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  req.db = db;
  next();
});

app.use('/api/tasks', taskRoutes);
app.use(errorHandler);

module.exports = app;
