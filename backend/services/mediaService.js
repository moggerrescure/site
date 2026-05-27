'use strict';
const path = require('node:path');
const fs   = require('node:fs');
const crypto = require('node:crypto');
const sharp = (() => { try { return require('sharp'); } catch { return null; } })();
const prisma = require('../lib/prisma');
const { ApiError } = require('../middleware/errors');
const s3 = require('../lib/s3');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_BYTES = {
  IMAGE: 16 * 1024 * 1024,
  AUDIO: 32 * 1024 * 1024,
  VIDEO: 64 * 1024 * 1024,
};

const EXT_TO_KIND = {
  '.jpg': 'IMAGE', '.jpeg': 'IMAGE', '.png': 'IMAGE',
  '.webp': 'IMAGE', '.gif': 'IMAGE',
  '.mp3': 'AUDIO', '.wav': 'AUDIO', '.m4a': 'AUDIO',
  '.ogg': 'AUDIO', '.aac': 'AUDIO',
  '.mp4': 'VIDEO', '.mov': 'VIDEO', '.webm': 'VIDEO',
  '.m4v': 'VIDEO', '.avi': 'VIDEO',
};

function pickKind(originalName, requested) {
  if (requested && ['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'].includes(requested)) return requested;
  const ext = path.extname(originalName || '').toLowerCase();
  return EXT_TO_KIND[ext] || null;
}

/**
 * Сохранить файл и создать запись Media.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimetype
 * @param {object} opts { prefix?, uploadedById?, requestedKind? }
 */
async function saveFile(buffer, originalName, mimetype, opts = {}) {
  if (!buffer || !buffer.length) throw new ApiError('Пустой файл', 400);

  const kind = pickKind(originalName, opts.requestedKind);
  if (!kind) throw new ApiError(`Тип файла не поддерживается: ${originalName}`, 400);

  const limit = MAX_BYTES[kind] || MAX_BYTES.IMAGE;
  if (buffer.length > limit) {
    throw new ApiError(`Файл превышает лимит ${(limit / 1024 / 1024).toFixed(0)} МБ`, 413);
  }

  const ext = path.extname(originalName).toLowerCase();
  let outBuf = buffer;
  let outExt = ext || '';
  let outMime = mimetype || '';

  // Картинки → WebP через sharp
  if (sharp && kind === 'IMAGE' && ext !== '.gif') {
    try {
      outBuf = await sharp(buffer)
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      outExt = '.webp';
      outMime = 'image/webp';
    } catch (e) {
      console.warn('[media] sharp failed, fallback to original:', e.message);
    }
  }

  const filename = `${opts.prefix || 'file'}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${outExt}`;
  let storageUrl;
  if (s3.isEnabled()) {
    storageUrl = await s3.uploadBuffer(filename, outBuf, outMime);
  } else {
    await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), outBuf);
    storageUrl = `/uploads/${filename}`;
  }

  let width = null, height = null;
  if (sharp && kind === 'IMAGE') {
    try {
      const meta = await sharp(outBuf).metadata();
      width  = meta.width  || null;
      height = meta.height || null;
    } catch {}
  }

  const url = storageUrl;
  const media = await prisma.media.create({
    data: {
      url,
      kind,
      originalName: originalName || null,
      mimeType:     outMime || 'application/octet-stream',
      sizeBytes:    outBuf.length,
      width, height,
      uploadedById: opts.uploadedById || null,
    },
  });
  return media;
}

/**
 * Удалить физические файлы по URL'ам (best-effort, не throw).
 * /uploads/* -> fs.unlink в UPLOAD_DIR
 * else if s3.isEnabled() -> s3.deleteByUrl
 */
async function deleteMediaFiles(urls) {
    const stats = { r2: 0, local: 0, skipped: 0, failed: 0 };
    for (const url of urls || []) {
        if (!url || typeof url !== 'string') { stats.skipped++; continue; }
        try {
            if (url.startsWith('/uploads/')) {
                const filename = path.basename(url);
                const filePath = path.join(UPLOAD_DIR, filename);
                try {
                    await fs.promises.unlink(filePath);
                    stats.local++;
                } catch (e) {
                    if (e && e.code === 'ENOENT') stats.skipped++;
                    else { stats.failed++; console.warn('[mediaService] unlink failed:', filePath, e && e.message); }
                }
                continue;
            }
            if (s3.isEnabled()) {
                const ok = await s3.deleteByUrl(url);
                if (ok) stats.r2++; else stats.skipped++;
                continue;
            }
            stats.skipped++;
        } catch (e) {
            stats.failed++;
            console.warn('[mediaService] deleteMediaFiles error:', url, e && e.message);
        }
    }
    return stats;
}

async function purgeOrphanMedia({ limit = 1000 } = {}) {
    const candidates = await prisma.media.findMany({
        take: limit,
        select: {
            id: true,
            url: true,
            profileCover:      { select: { id: true } },
            blockPhotos:       { select: { id: true }, take: 1 },
            nodePhotos:        { select: { id: true }, take: 1 },
            galleryItems:      { select: { id: true }, take: 1 },
            memoryAttachments: { select: { id: true }, take: 1 },
        },
    });
    const orphan = candidates.filter((m) =>
        !m.profileCover &&
        (m.blockPhotos || []).length === 0 &&
        (m.nodePhotos || []).length === 0 &&
        (m.galleryItems || []).length === 0 &&
        (m.memoryAttachments || []).length === 0
    );
    if (orphan.length === 0) return { mediaRows: 0, files: { r2: 0, local: 0, skipped: 0, failed: 0 } };
    const urls = orphan.map((m) => m.url);
    const ids = orphan.map((m) => m.id);
    const fileStats = await deleteMediaFiles(urls);
    let mediaRows = 0;
    try {
        const res = await prisma.media.deleteMany({ where: { id: { in: ids } } });
        mediaRows = res.count;
    } catch (e) {
        console.warn('[mediaService] purgeOrphanMedia deleteMany failed:', e && e.message);
    }
    console.log('[mediaService] purgeOrphanMedia: rows=' + mediaRows, 'r2=' + fileStats.r2, 'local=' + fileStats.local, 'skipped=' + fileStats.skipped, 'failed=' + fileStats.failed);
    return { mediaRows, files: fileStats };
}

module.exports = { saveFile, UPLOAD_DIR, deleteMediaFiles, purgeOrphanMedia };