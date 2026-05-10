'use strict';
const { Router } = require('express');
const router = Router();
const { version } = require('../../package.json');

router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version,
  });
});

module.exports = router;
