'use strict';

/**
 * Express middleware factory.
 * Validates req.body against the supplied Joi schema.
 * On failure, forwards a structured 422 error object to next().
 *
 * @param {import('joi').Schema} joiSchema
 * @returns {import('express').RequestHandler}
 */
function validate(joiSchema) {
  return function validationMiddleware(req, _res, next) {
    const { error, value } = joiSchema.validate(req.body, {
      abortEarly: false,   // collect all errors, not just the first
      stripUnknown: true,  // drop undeclared keys silently
    });

    if (!error) {
      req.body = value; // replace with coerced/stripped value
      return next();
    }

    const fields = {};
    for (const detail of error.details) {
      const key = detail.path.join('.');
      fields[key] = detail.message.replace(/['"]/g, '');
    }

    return next({
      status: 422,
      error: 'validation_error',
      message: 'Request validation failed',
      fields,
    });
  };
}

module.exports = { validate };