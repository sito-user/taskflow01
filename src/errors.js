'use strict';

class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class ValidationError extends Error {
  /**
   * @param {string} message
   * @param {Record<string, string>} fields  – per-field messages
   */
  constructor(message = 'Validation failed', fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = 422;
    this.fields = fields;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

module.exports = { NotFoundError, ValidationError, UnauthorizedError };