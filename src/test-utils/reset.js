'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

const SEED_ORG_ID = '00000000-1234-4000-8000-000000000001';

const TENANT_TABLES = [
  'tasks',
  'projects',
  'users',
  'organizations',
];

router.post('/reset-db', async (req, res) => {
  try {
    await db.transaction(async (trx) => {
      for (const table of TENANT_TABLES) {
        await trx.raw('TRUNCATE TABLE ?? CASCADE', [table]);
      }

      const now = new Date();
      await trx('organizations').insert({
        id:         SEED_ORG_ID,
        name:       'Seed Org (test fixture)',
        slug:       'seed-org-fixture',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    });

    return res.status(200).json({ ok: true, org_id: SEED_ORG_ID });
  } catch (error) {
    console.error('[test-utils/reset-db] error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
