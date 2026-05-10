'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const db  = require('../db');
const jwt = require('./jwt');

const BCRYPT_COST = 12;

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name   = 'ConflictError';
    this.status = 409;
  }
}

class UnauthorizedError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name   = 'UnauthorizedError';
    this.status = 401;
  }
}

function sanitiseUser(user) {
  const { password_hash, deleted_at, ...safe } = user;
  return safe;
}

async function signup(email, password, organization_name) {
  const existing = await db('users').whereNull('deleted_at').where({ email }).first();
  if (existing) throw new ConflictError('An account with that email address already exists');

  const password_hash = await bcrypt.hash(password, BCRYPT_COST);

  const { user, project_id } = await db.transaction(async (trx) => {
    const orgId = uuidv4();
    const now   = new Date();

    const slug = organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 90) + '-' + orgId.substring(0, 8);

    await trx('organizations').insert({
      id: orgId, name: organization_name, slug,
      created_at: now, updated_at: now, deleted_at: null,
    });

    const userId = uuidv4();
    const [user] = await trx('users')
      .insert({
        id: userId, organization_id: orgId, email, password_hash,
        first_name: email.split('@')[0], last_name: 'User', role: 'admin',
        created_at: now, updated_at: now, deleted_at: null,
      })
      .returning(['id','organization_id','email','role','created_at','updated_at','deleted_at']);

    const projectId = uuidv4();
    await trx('projects').insert({
      id:              projectId,
      organization_id: orgId,
      owner_id:        userId,
      name:            'Default Project',
      created_at:      now,
      updated_at:      now,
      deleted_at:      null,
    });

    return { user, project_id: projectId };
  });

  const token = jwt.sign({ user_id: user.id, organization_id: user.organization_id, role: user.role });
  return { user: sanitiseUser(user), token, project_id };
}

async function login(email, password) {
  const user = await db('users').whereNull('deleted_at').where({ email })
    .first(['id','organization_id','email','role','password_hash','created_at','updated_at','deleted_at']);

  const DUMMY_HASH = '$2b$12$invalidhashusedfortimingprotection0000000000000000000';
  const passwordValid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !passwordValid) throw new UnauthorizedError();

  const token = jwt.sign({ user_id: user.id, organization_id: user.organization_id, role: user.role });
  return { user: sanitiseUser(user), token };
}

module.exports = { signup, login, ConflictError, UnauthorizedError };