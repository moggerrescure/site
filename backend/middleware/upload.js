'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const s3 = require('../lib/s3');
const { ApiError } = require('./errors');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const TMP_UPLOAD_DIR = process.env.TMP_UPLOAD_DIR
    || path.join(os.tmpdir(), 'memorial-uploads');
if (!fs.existsSync(TMP_UPLOAD_DIR)) {
    fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true, mode: 0o700 });
}

const MAX_IMAGE_MB = 8;
const MAX_AUDIO_MB = 25;
const MAX_VIDEO_MB = 200;

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
const AUDIO_MIMES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']);

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, TMP_UPLOAD_DIR); },
    filename: function (req, file, cb) {
        const id = crypto.randomUUID();
        const ext = (path.extname(file.originalname || '') || '').toLowerCase();
        cb(null, id + ext);
    },
});

function buildUpload(opts) {
    const allowedMimes = opts.allowedMimes;
    const maxMb = opts.maxMb;
    const fieldName = opts.fieldName;
    return multer({
        storage: diskStorage,
        limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
        fileFilter: function (req, file, cb) {
            if (!allowedMimes.has(file.mimetype)) {
                return cb(new Error('Недопустимый формат: ' + file.mimetype));
            }
            cb(null, true);
        },
    }).single(fieldName);
}

const uploadImage = buildUpload({ allowedMimes: IMAGE_MIMES, maxMb: MAX_IMAGE_MB, fieldName: 'photo' });
const uploadAudio = buildUpload({ allowedMimes: AUDIO_MIMES, maxMb: MAX_AUDIO_MB, fieldName: 'audio' });
const uploadVideo = buildUpload({ allowedMimes: VIDEO_MIMES, maxMb: MAX_VIDEO_MB, fieldName: 'video' });

async function cleanupTmpFile(file) {
    if (!file || !file.path) return;
    try {
        await fs.promises.unlink(file.path);
    } catch (e) {
        if (!e || e.code !== 'ENOENT') {
            console.warn('[upload] tmp cleanup failed:', file.path, e && e.message);
        }
    }
}

function tmpCleanupMiddleware(req, res, next) {
    let done = false;
    const cleanup = function () {
        if (done) return;
        done = true;
        if (req.file) cleanupTmpFile(req.file);
        if (Array.isArray(req.files)) req.files.forEach(cleanupTmpFile);
    };
    res.on('finish', cleanup);
    res.on('close',  cleanup);
    next();
}

async function saveImageFromPath(filePath, opts) {
    opts = opts || {};
    const maxSize = opts.maxSize || 1600;
    const quality = opts.quality || 78;

    const id = crypto.randomUUID();
    const filename = id + '.webp';
    const outPath  = path.join(UPLOADS_DIR, filename);

    const meta = await sharp(filePath).metadata();

    if (s3.isEnabled()) {
        const processed = await sharp(filePath)
            .rotate()
            .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: quality, effort: 4 })
            .toBuffer({ resolveWithObject: true });
        const outUrl = await s3.uploadBuffer(filename, processed.data, 'image/webp');
        return {
            url: outUrl,
            mimeType: 'image/webp',
            sizeBytes: processed.data.length,
            width: processed.info.width,
            height: processed.info.height,
            originalWidth: meta.width || null,
            originalHeight: meta.height || null,
        };
    }

    const info = await sharp(filePath)
        .rotate()
        .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: quality, effort: 4 })
        .toFile(outPath);

    return {
        url: '/uploads/' + filename,
        mimeType: 'image/webp',
        sizeBytes: info.size,
        width: info.width,
        height: info.height,
        originalWidth: meta.width || null,
        originalHeight: meta.height || null,
    };
}

async function saveRawFromPath(filePath, originalName, mimeType) {
    const ft = await getFileType();
    const detected = await ft.fileTypeFromFile(filePath);
    if (!detected || !RAW_ALLOWED_MIMES.has(detected.mime)) {
        throw ApiError.badRequest('Недопустимый или поддельный файл');
    }

    const id = crypto.randomUUID();
    const ext = (path.extname(originalName || '') || mimeExt(mimeType) || '.bin').toLowerCase();
    const filename = id + ext;
    const stat = await fs.promises.stat(filePath);

    let outUrl;
    if (s3.isEnabled()) {
        // TODO(step 2): switch to s3.uploadStream(filename, fs.createReadStream(filePath))
        const buffer = await fs.promises.readFile(filePath);
        outUrl = await s3.uploadBuffer(filename, buffer, mimeType);
    } else {
        const outPath = path.join(UPLOADS_DIR, filename);
        await fs.promises.copyFile(filePath, outPath);
        outUrl = '/uploads/' + filename;
    }

    return { url: outUrl, mimeType: mimeType, sizeBytes: stat.size };
}

async function saveImageBuffer(buffer, opts) {
    const tmpPath = path.join(TMP_UPLOAD_DIR, crypto.randomUUID() + '.bin');
    await fs.promises.writeFile(tmpPath, buffer);
    try {
        return await saveImageFromPath(tmpPath, opts);
    } finally {
        fs.promises.unlink(tmpPath).catch(function () {});
    }
}

async function saveRawBuffer(buffer, originalName, mimeType) {
    const tmpPath = path.join(TMP_UPLOAD_DIR, crypto.randomUUID() + '.bin');
    await fs.promises.writeFile(tmpPath, buffer);
    try {
        return await saveRawFromPath(tmpPath, originalName, mimeType);
    } finally {
        fs.promises.unlink(tmpPath).catch(function () {});
    }
}

function mimeExt(mime) {
    const map = {
        'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/wav': '.wav',
        'audio/ogg': '.ogg', 'audio/webm': '.webm', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a',
        'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov', 'video/x-matroska': '.mkv',
    };
    return map[mime] || '';
}

const RAW_ALLOWED_MIMES = new Set([
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/opus', 'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
]);

let _fileTypeMod = null;
async function getFileType() {
    if (!_fileTypeMod) _fileTypeMod = await import('file-type');
    return _fileTypeMod;
}

module.exports = {
    uploadImage: uploadImage,
    uploadAudio: uploadAudio,
    uploadVideo: uploadVideo,
    tmpCleanupMiddleware: tmpCleanupMiddleware,
    cleanupTmpFile: cleanupTmpFile,
    TMP_UPLOAD_DIR: TMP_UPLOAD_DIR,
    saveImageFromPath: saveImageFromPath,
    saveRawFromPath: saveRawFromPath,
    saveImageBuffer: saveImageBuffer,
    saveRawBuffer: saveRawBuffer,
};
