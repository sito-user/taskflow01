'use strict';

const service = require('./service');

async function create(req, res, next) {
  try {
    const task = await service.create(req.user, req.body, req.db);
    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const task = await service.getByIdForUser(req.user, req.params.id, req.db);
    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getById };
