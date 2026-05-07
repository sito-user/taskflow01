'use strict';

const jwt = require('../auth/jwt');
const db  = require('../db');

const UNAUTHORIZED = {
  status:  401,
  error:   'unauthorized',
  message: 'Authentication required',
};

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.taskflow_session;
    if (!token) return res.status(401).json(UNAUTHORIZED);

    let payload;
    try {
      payload = jwt.verify(token);
    } catch {
      return res.status(401).json(UNAUTHORIZED);
    }

    const { user_id } = payload;
    if (!user_id) return res.status(401).json(UNAUTHORIZED);

    const user = await db('users')
      .whereNull('deleted_at')
      .where({ id: user_id })
      .first(['id','organization_id','email','role','created_at','updated_at']);

    if (!user) return res.status(401).json(UNAUTHORIZED);

    req.user = user;
    return next();
  } catch (err) {
    console.error('[authenticate] unexpected error:', err);
    return res.status(401).json(UNAUTHORIZED);
  }
}

module.exports = authenticate;
