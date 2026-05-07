'use strict';

const { NotFoundError, ValidationError, UnauthorizedError } = require('../errors');

function errorHandler(err, _req, res, _next) {
  if (err && typeof err === 'object' && !(err instanceof Error)) {
    const status = typeof err.status === 'number' ? err.status : 500;
    return res.status(status).json({ status, error: err.error ?? 'error', message: err.message ?? 'An error occurred', ...(err.fields ? { fields: err.fields } : {}) });
  }
  if (err instanceof NotFoundError) return res.status(404).json({ status: 404, error: 'not_found', message: err.message });
  if (err instanceof ValidationError) return res.status(422).json({ status: 422, error: 'validation_error', message: err.message, fields: err.fields });
  if (err instanceof UnauthorizedError) return res.status(401).json({ status: 401, error: 'unauthorized', message: err.message });

  console.error('[ERROR]', err.message, err.stack);
  return res.status(500).json({ status: 500, error: 'internal_server_error', message: err.message });
}

module.exports = { errorHandler };
