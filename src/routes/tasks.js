'use strict';

const { Router } = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const controller = require('../features/tasks/controller');

const STATUS_VALUES = ['todo', 'in_progress', 'done'];
const PRIORITY_VALUES = ['low', 'medium', 'high'];

const createTaskSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  project_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  status: Joi.string().valid(...STATUS_VALUES).optional(),
  priority: Joi.string().valid(...PRIORITY_VALUES).optional(),
});

const router = Router();

router.post('/', authenticate, validate(createTaskSchema), controller.create);
router.get('/:id', authenticate, controller.getById);

module.exports = router;
