'use strict';

const prisma = require('../lib/prisma');

const PROFILE_HARD_DELETE_DAYS = parseInt(process.env.PROFILE_HARD_DELETE_DAYS || '30', 10);
const AUDIT_RETENTION_DAYS     = parseInt(process.env.AUDIT_RETENTION_DAYS     || '90', 10);

/**
 * Hard-delete profiles soft-deleted больше N дней назад (по умолчанию 30).
 * Каскадно подчистит ContentBlock, ProfileAccess, ProfileAccessCode и т.д.
 * через onDelete: Cascade в Prisma schema.
 */
async function hardDeleteOldSoftDeletedProfiles() {
    const cutoff = new Date(Date.now() - PROFILE_HARD_DELETE_DAYS * 24 * 60 * 60 * 1000);
    const result = await prisma.profile.deleteMany({
        where: { deletedAt: { lt: cutoff } },
    });
    console.log(`[cleanup] hard-deleted ${result.count} profiles older than ${PROFILE_HARD_DELETE_DAYS}d (cutoff=${cutoff.toISOString()})`);
    return result.count;
}

/**
 * Удалить записи аудита старше N дней (по умолчанию 90).
 */
async function purgeOldAuditLogs() {
    const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });
    console.log(`[cleanup] purged ${result.count} audit logs older than ${AUDIT_RETENTION_DAYS}d (cutoff=${cutoff.toISOString()})`);
    return result.count;
}

async function runAllCleanupTasks() {
    const startedAt = Date.now();
    console.log('[cleanup] starting daily cleanup tasks...');
    let profiles = 0, audits = 0;
    try {
        profiles = await hardDeleteOldSoftDeletedProfiles();
    } catch (e) {
        console.error('[cleanup] hardDeleteOldSoftDeletedProfiles error:', e.message);
    }
    try {
        audits = await purgeOldAuditLogs();
    } catch (e) {
        console.error('[cleanup] purgeOldAuditLogs error:', e.message);
    }
    console.log(`[cleanup] done in ${Date.now() - startedAt}ms (profiles=${profiles}, audits=${audits})`);
}

module.exports = {
    hardDeleteOldSoftDeletedProfiles,
    purgeOldAuditLogs,
    runAllCleanupTasks,
    PROFILE_HARD_DELETE_DAYS,
    AUDIT_RETENTION_DAYS,
};
