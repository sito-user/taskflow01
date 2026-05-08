'use strict';

const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');

const router = express.Router();

const SEED_ORG_ID     = '00000000-1234-4000-8000-000000000001';
const SEED_USER_ID    = '00000000-1234-4000-8000-000000000003';
const SEED_PROJECT_ID = '00000000-1234-4000-8000-000000000002';

const TENANT_TABLES = ['tasks', 'projects', 'users', 'organizations'];

router.post('/reset-db', async (req, res) => {
  try {
    await db.transaction(async (trx) => {
      for (const table of TENANT_TABLES) {
        await trx.raw('TRUNCATE TABLE ?? CASCADE', [table]);
      }

      const now  = new Date();
      const hash = await bcrypt.hash('SeedPass123!', 10);

      await trx('organizations').insert({
        id: SEED_ORG_ID, name: 'Seed Org', slug: 'seed-org',
        created_at: now, updated_at: now, deleted_at: null,
      });

      await trx('users').insert({
        id: SEED_USER_ID, organization_id: SEED_ORG_ID,
        email: 'seed@test.internal', password_hash: hash,
        first_name: 'Seed', last_name: 'User', role: 'admin',
        created_at: now, updated_at: now, deleted_at: null,
      });

      await trx('projects').insert({
        id: SEED_PROJECT_ID, organization_id: SEED_ORG_ID,
        owner_id: SEED_USER_ID, name: 'Default Project',
        created_at: now, updated_at: now, deleted_at: null,
      });
    });

    return res.status(200).json({
      ok: true,
      org_id: SEED_ORG_ID,
      project_id: SEED_PROJECT_ID,
    });
  } catch (error) {
    console.error('[test-utils/reset-db] error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;