'use strict';

const crypto = require('crypto');
const repository = require('./repository');
const { NotFoundError } = require('../../errors');

const PROJECT_COLUMNS = ['id', 'organization_id'];

async function assertProjectBelongsToOrg(db, projectId, organizationId) {
  const project = await db('projects').select(PROJECT_COLUMNS).where({ id: projectId }).whereNull('deleted_at').first();
  if (!project || project.organization_id !== organizationId) throw new NotFoundError('Project not found');
}

async function create(user, payload, db) {
  await assertProjectBelongsToOrg(db, payload.project_id, user.organization_id);
  const fields = {
    id: crypto.randomUUID(),
    organization_id: user.organization_id,
    project_id: payload.project_id,
    title: payload.title,
    status: payload.status ?? 'todo',
    priority: payload.priority ?? 'medium',
    created_by: user.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  return repository.create(db, fields);
}

async function getByIdForUser(user, id, db) {
  const task = await repository.findById(db, id);
  if (!task) throw new NotFoundError('Task not found');
  if (task.organization_id !== user.organization_id) throw new NotFoundError('Task not found');
  return task;
}

module.exports = { create, getByIdForUser };
