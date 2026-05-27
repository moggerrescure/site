'use strict';

const cron = require('node-cron');
const cleanup = require('./cleanup');

function startCronJobs() {
    if (process.env.ENABLE_CRON === 'false') {
        console.log('[cron] disabled via ENABLE_CRON=false');
        return;
    }
    const schedule = process.env.CLEANUP_CRON || '0 3 * * *'; // каждый день в 03:00
    const tz = process.env.CRON_TZ || 'Europe/Minsk';
    cron.schedule(schedule, cleanup.runAllCleanupTasks, { timezone: tz });
    console.log(`[cron] cleanup scheduled: ${schedule} (${tz}); retention: profiles=${cleanup.PROFILE_HARD_DELETE_DAYS}d, audit=${cleanup.AUDIT_RETENTION_DAYS}d`);
}

module.exports = { startCronJobs, ...cleanup };
