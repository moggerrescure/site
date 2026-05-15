/* ═══════════════════════════════════════════════
   AUTH helpers — JWT + password hashing
   Pure Node.js crypto, no external deps
   ═══════════════════════════════════════════════ */
'use strict';

const crypto = require('node:crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'memory-site-secret-change-in-prod';
const JWT_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/* ── JWT (HS256) ── */
function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJWT(payload) {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + JWT_EXPIRY }));
  const sig     = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  } catch { return null; }
}

/* ── Password hashing (PBKDF2) ── */
const ITERATIONS = 100_000;
const KEYLEN     = 64;
const DIGEST     = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}

/* ── Express middleware ── */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyJWT(token);
  if (!payload) return res.json({ ok: false, error: 'Unauthorized' }, 401);
  req.user = payload;
  next();
}

module.exports = { signJWT, verifyJWT, hashPassword, verifyPassword, requireAuth };
