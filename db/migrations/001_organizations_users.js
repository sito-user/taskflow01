'use strict';

const TABLE_ORGS  = 'organizations';
const TABLE_USERS = 'users';

exports.up = async function up(knex) {
  await knex.schema.createTable(TABLE_ORGS, (t) => {
    t.uuid('id').primary().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 255).notNullable();
    t.string('slug', 100).notNullable();
    t.unique(['slug'], { indexName: 'organizations_slug_unique' });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null);
  });

  await knex.schema.createTable(TABLE_USERS, (t) => {
    t.uuid('id').primary().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('organization_id').notNullable();
    t.foreign('organization_id').references('id').inTable(TABLE_ORGS).onDelete('RESTRICT').onUpdate('CASCADE');
    t.string('email', 255).notNullable();
    t.string('first_name', 255).notNullable();
    t.string('last_name', 255).notNullable();
    t.string('password_hash', 255).notNullable();
    t.string('role', 10).notNullable();
    t.check('?? IN (\'admin\', \'member\')', ['role'], 'users_role_check');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null);
  });

  await knex.schema.table(TABLE_USERS, (t) => {
    t.index(['organization_id'], 'users_organization_id_idx');
  });

  await knex.schema.table(TABLE_USERS, (t) => {
    t.unique(['organization_id', 'email'], { indexName: 'users_organization_id_email_unique' });
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_USERS);
  await knex.schema.dropTableIfExists(TABLE_ORGS);
};
