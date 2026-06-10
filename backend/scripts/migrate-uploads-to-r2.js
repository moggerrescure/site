'use strict';

/**
 * Миграция старых /uploads/* файлов из локального диска в R2 / S3.
 *
 * Запуск:
 *   docker compose exec backend node scripts/migrate-uploads-to-r2.js              # DRY-RUN
 *   docker compose exec backend node scripts/migrate-uploads-to-r2.js --apply      # реально мигрировать
 *   docker compose exec backend node scripts/migrate-uploads-to-r2.js --apply --delete-local  # + удалить с диска после успеха
 */

const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../lib/prisma');
const s3 = require('../lib/s3');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function parseArgs(argv) {
    const out = { dryRun: true, apply: false, deleteLocal: false };
    for (const a of argv) {
        if (a === '--apply')        { out.apply = true; out.dryRun = false; }
        if (a === '--dry-run')      { out.dryRun = true; out.apply = false; }
        if (a === '--delete-local') { out.deleteLocal = true; }
    }
    return out;
}

function inferMimeType(filename, dbMime) {
    if (dbMime && dbMime !== 'application/octet-stream') return dbMime;
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg', '.aac': 'audio/aac',
        '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
    };
    return map[ext] || 'application/octet-stream';
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    console.log('[migrate] mode:', args.apply ? 'APPLY' : 'DRY-RUN');
    console.log('[migrate] delete-local after success:', args.deleteLocal);
    console.log('[migrate] uploads dir:', UPLOADS_DIR);

    if (!s3.isEnabled()) {
        console.error('[migrate] ✗ S3 disabled — set S3_BUCKET in .env first');
        process.exit(1);
    }

    const rows = await prisma.media.findMany({
        where: { url: { startsWith: '/uploads/' } },
        select: {
            id: true, url: true, kind: true,
            mimeType: true, sizeBytes: true, createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    console.log(`[migrate] found ${rows.length} DB records with /uploads/* URL`);

    if (rows.length === 0) {
        console.log('[migrate] nothing to migrate');
        await prisma.$disconnect();
        return;
    }

    let migrated = 0, missing = 0, failed = 0, skipped = 0;
    const startTs = Date.now();

    for (const [i, row] of rows.entries()) {
        const filename = path.basename(row.url);
        const localPath = path.join(UPLOADS_DIR, filename);
        const prefix = `[${i + 1}/${rows.length}] ${row.id}`;

        if (!fs.existsSync(localPath)) {
            missing++;
            console.warn(`  ${prefix} [MISSING] file not on disk: ${filename}`);
            continue;
        }

        let stat;
        try {
            stat = fs.statSync(localPath);
        } catch (e) {
            failed++;
            console.error(`  ${prefix} [FAIL] stat: ${e.message}`);
            continue;
        }

        const mime = inferMimeType(filename, row.mimeType);

        if (args.dryRun) {
            console.log(`  ${prefix} [DRY] ${filename} (${stat.size}B, ${mime}) → R2`);
            continue;
        }

        try {
            const buffer = fs.readFileSync(localPath);
            const newUrl = await s3.uploadBuffer(filename, buffer, mime);

            await prisma.media.update({
                where: { id: row.id },
                data: {
                    url: newUrl,
                    mimeType: mime,
                    sizeBytes: buffer.length,
                },
            });

            migrated++;
            console.log(`  ${prefix} [OK] → ${newUrl}`);

            if (args.deleteLocal) {
                try {
                    fs.unlinkSync(localPath);
                    console.log(`        local deleted`);
                } catch (e) {
                    console.warn(`        local delete failed: ${e.message}`);
                }
            }
        } catch (e) {
            failed++;
            console.error(`  ${prefix} [FAIL] ${e.name}: ${e.message}`);
        }
    }

    const sec = ((Date.now() - startTs) / 1000).toFixed(1);
    console.log();
    console.log('═══════════════════════════════════════════');
    console.log(`[migrate] summary (${sec}s):`);
    console.log(`  migrated: ${migrated}`);
    console.log(`  missing:  ${missing}`);
    console.log(`  failed:   ${failed}`);
    console.log(`  skipped:  ${skipped}`);
    console.log(`  total:    ${rows.length}`);
    console.log('═══════════════════════════════════════════');

    if (args.dryRun) {
        console.log('DRY-RUN: no DB or S3 changes were made.');
        console.log('To apply: docker compose exec backend node scripts/migrate-uploads-to-r2.js --apply');
    }

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error('[migrate] fatal:', e);
    try { await prisma.$disconnect(); } catch {}
    process.exit(1);
});
