/**
 * src/auth/auth.validation.js
 *
 * Joi schemas for authentication endpoints.
 * Validated at the route boundary per CLAUDE.md Security Rule 4.
 */

'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

const emailSchema = Joi.string().email().max(255).lowercase().trim().required();

// Password rules: min 12 chars, ≥1 uppercase, ≥1 digit, ≥1 special character.
const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{12,}$/;

const strongPasswordSchema = Joi.string()
  .min(12)
  .max(128) // sane upper bound; bcrypt only uses first 72 bytes
  .pattern(STRONG_PASSWORD_REGEX)
  .required()
  .messages({
    'string.min':     'password must be at least 12 characters',
    'string.pattern.base':
      'password must contain at least 1 uppercase letter, 1 number, and 1 special character',
  });

// ---------------------------------------------------------------------------
// signupSchema
// ---------------------------------------------------------------------------

const signupSchema = Joi.object({
  email: emailSchema,

  password: strongPasswordSchema,

  organization_name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'organization_name must be at least 2 characters',
    'string.max': 'organization_name must be at most 100 characters',
  }),
}).options({ abortEarly: false }); // collect all field errors in one pass

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------

const loginSchema = Joi.object({
  email:    emailSchema,
  password: Joi.string().required(), // any value — strength is only enforced on signup
}).options({ abortEarly: false });

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

/**
 * Validate data against a schema and return a normalised result.
 *
 * @param {Joi.Schema} schema
 * @param {unknown}    data
 * @returns {{ value: object } | { error: { status: number, error: string, details: Array } }}
 */
function validate(schema, data) {
  const { value, error } = schema.validate(data);

  if (!error) return { value };

  return {
    error: {
      status:  422,
      error:   'validation_error',
      message: 'Request validation failed',
      details: error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message,
      })),
    },
  };
}

module.exports = { signupSchema, loginSchema, validate };