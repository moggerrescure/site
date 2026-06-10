'use strict';

const prisma = require('../lib/prisma');

const THROTTLE_MS = parseInt(process.env.LAST_SEEN_THROTTLE_MS || String(5 * 60 * 1000), 10);
const cache = new Map(); // userId → last-update timestamp (ms)

/**
 * Throttled update User.lastSeenAt. Fire-and-forget — никогда не блокирует запрос.
 * Используется внутри requireAuth/optionalAuth после установки req.user.
 */
function touch(userId) {
  if (!userId) return;
  const now = Date.now();
  const last = cache.get(userId) || 0;
  if (now - last < THROTTLE_MS) return;
  cache.set(userId, now);
  prisma.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date(now) } })
    .catch((e) => console.error('[lastSeen]', e.message));
}

function _resetCache() { cache.clear(); }

module.exports = { touch, _resetCache, THROTTLE_MS };
