const db = require('../db');

module.exports = async function authenticate(req, res, next) {
  const userId = req.header('X-User-Id');
  if (!userId) return next({ status: 401, error: 'unauthorized', message: 'Missing X-User-Id header' });
  const user = await db('users').where({ id: userId }).whereNull('deleted_at').first();
  if (!user) return next({ status: 401, error: 'unauthorized', message: 'Invalid user' });
  req.user = user;
  next();
};
