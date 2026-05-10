'use strict';

const { v4: uuidv4 } = require('uuid');

function correlationId(req, res, next) {
  req.correlationId = req.header('x-correlation-id') || uuidv4();
  res.setHeader('X-Correlation-Id', req.correlationId);
  next();
}

module.exports = correlationId;
