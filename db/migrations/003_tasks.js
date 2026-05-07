'use strict';

const TABLE_TASKS    = 'tasks';
const TABLE_ORGS     = 'organizations';
const TABLE_PROJECTS = 'projects';
const TABLE_USERS    = 'users';

exports.up = async function up(knex) {
  await knex.schema.createTable(TABLE_TASKS, (t) => {
    t.uuid('id').primary().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('organization_id').notNullable();
    t.foreign('organization_id').references('id').inTable(TABLE_ORGS).onDelete('RESTRICT').onUpdate('CASCADE');
    t.uuid('project_id').notNullable();
    t.foreign('project_id').references('id').inTable(TABLE_PROJECTS).onDelete('RESTRICT').onUpdate('CASCADE');
    t.string('title', 200).notNullable();
    t.text('description').nullable();
    t.string('status', 15).notNullable().defaultTo('todo');
    t.check('?? IN (\'todo\', \'in_progress\', \'done\')', ['status'], 'tasks_status_check');
    t.string('priority', 10).notNullable().defaultTo('medium');
    t.check('?? IN (\'low\', \'medium\', \'high\')', ['priority'], 'tasks_priority_check');
    t.uuid('assigned_to').nullable().defaultTo(null);
    t.foreign('assigned_to').references('id').inTable(TABLE_USERS).onDelete('SET NULL').onUpdate('CASCADE');
    t.timestamp('due_date', { useTz: true }).nullable().defaultTo(null);
    t.uuid('created_by').notNullable();
    t.foreign('created_by').references('id').inTable(TABLE_USERS).onDelete('RESTRICT').onUpdate('CASCADE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null);
  });

  await knex.schema.table(TABLE_TASKS, (t) => {
    t.index(['organization_id'], 'tasks_organization_id_idx');
    t.index(['project_id'], 'tasks_project_id_idx');
    t.index(['assigned_to'], 'tasks_assigned_to_idx');
    t.index(['created_by'], 'tasks_created_by_idx');
  });

  await knex.schema.table(TABLE_TASKS, (t) => {
    t.index(['project_id', 'organization_id'], 'tasks_project_id_organization_id_idx');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_TASKS);
};
