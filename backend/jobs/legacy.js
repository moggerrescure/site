'use strict';

const legacyContactService = require('../services/legacyContactService');

/**
 * Daily legacy tasks:
 *   1) triggerInactive() — отметить ACTIVE контакты, у владельцев которых
 *      lastSeenAt старше inactivityDays → status=TRIGGERED + audit log.
 *   2) expireOldClaims() — PENDING claims с expiresAt < now → EXPIRED + audit.
 */
async function runLegacyTasks() {
  const startedAt = Date.now();
  console.log('[legacy-cron] starting daily legacy tasks...');
  let triggered = { count: 0 }, expired = { count: 0 };
  try {
    triggered = await legacyContactService.triggerInactive();
  } catch (e) {
    console.error('[legacy-cron] triggerInactive error:', e.message);
  }
  try {
    expired = await legacyContactService.expireOldClaims();
  } catch (e) {
    console.error('[legacy-cron] expireOldClaims error:', e.message);
  }
  console.log(`[legacy-cron] done in ${Date.now() - startedAt}ms (triggered=${triggered.count || 0}, expired=${expired.count || 0})`);
  return { triggered, expired };
}

module.exports = { runLegacyTasks };
