'use strict';
const service = require('./service');

async function list(req, res, next) {
  try {
    const { project_id } = req.query;
    const tasks = await service.listForUser(req.user, { projectId: project_id }, req.db);
    return res.status(200).json({ data: tasks });
  } catch (err) {
    return next(err);
  }
}

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

module.exports = { list, create, getById };