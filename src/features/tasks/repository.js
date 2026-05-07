'use strict';

const TASK_COLUMNS = [
  'id',
  'organization_id',
  'project_id',
  'title',
  'status',
  'priority',
  'created_by',
  'created_at',
  'updated_at',
  'deleted_at',
];

/**
 * Insert a new task row and return the created record.
 *
 * @param {import('knex').Knex} db
 * @param {object} fields
 * @returns {Promise<object>}
 */
async function create(db, fields) {
  const [row] = await db('tasks').insert(fields).returning(TASK_COLUMNS);
  return row;
}

/**
 * Fetch a single non-deleted task by primary key.
 * Returns null when not found or soft-deleted.
 *
 * @param {import('knex').Knex} db
 * @param {string} id  UUID
 * @returns {Promise<object|null>}
 */
async function findById(db, id) {
  const row = await db('tasks')
    .select(TASK_COLUMNS)
    .where({ id })
    .whereNull('deleted_at')
    .first();

  return row ?? null;
}

module.exports = { create, findById };