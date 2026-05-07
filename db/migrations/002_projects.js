'use strict';

const TABLE_PROJECTS = 'projects';
const TABLE_ORGS     = 'organizations';
const TABLE_USERS    = 'users';

exports.up = async function up(knex) {
  await knex.schema.createTable(TABLE_PROJECTS, (t) => {
    t.uuid('id').primary().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('organization_id').notNullable();
    t.foreign('organization_id').references('id').inTable(TABLE_ORGS).onDelete('RESTRICT').onUpdate('CASCADE');
    t.string('name', 255).notNullable();
    t.text('description').nullable();
    t.string('status', 10).notNullable().defaultTo('active');
    t.check('?? IN (\'active\', \'archived\')', ['status'], 'projects_status_check');
    t.uuid('owner_id').notNullable();
    t.foreign('owner_id').references('id').inTable(TABLE_USERS).onDelete('RESTRICT').onUpdate('CASCADE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null);
  });

  await knex.schema.table(TABLE_PROJECTS, (t) => {
    t.index(['organization_id'], 'projects_organization_id_idx');
    t.index(['owner_id'], 'projects_owner_id_idx');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_PROJECTS);
};
