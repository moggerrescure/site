'use strict';

const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const trim = (v) => (v || '').trim();

let _client = null;
let _checked = false;
let _enabled = false;
let _bucket = '';
let _publicBase = '';

function ensureChecked() {
    if (_checked) return;
    _checked = true;

    const bucket          = trim(process.env.S3_BUCKET);
    const endpoint        = trim(process.env.S3_ENDPOINT);
    const region          = trim(process.env.S3_REGION) || 'auto';
    const accessKeyId     = trim(process.env.S3_ACCESS_KEY_ID);
    const secretAccessKey = trim(process.env.S3_SECRET_ACCESS_KEY);
    const publicBase      = trim(process.env.S3_PUBLIC_URL_BASE);

    const isAscii = (s) => /^[\x20-\x7E]*$/.test(s);

    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey || !publicBase) {
        console.log('[s3] disabled — missing S3_* env vars (using local /uploads)');
        return;
    }
    if (!isAscii(accessKeyId) || !isAscii(secretAccessKey)) {
        console.warn('[s3] disabled — S3 credentials contain non-ASCII chars (placeholder?); using local /uploads');
        return;
    }

    _client = new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
    _bucket = bucket;
    _publicBase = publicBase.replace(/\/+$/, '');
    _enabled = true;
    console.log(`[s3] enabled — bucket=${bucket}, public=${_publicBase}`);
}

function isEnabled() {
    ensureChecked();
    return _enabled;
}

async function uploadBuffer(filename, buffer, mimeType) {
    ensureChecked();
    if (!_enabled) throw new Error('[s3] not enabled');
    const key = `media/${filename}`;
    await _client.send(new PutObjectCommand({
        Bucket: _bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
    }));
    return `${_publicBase}/${key}`;
}

async function deleteByUrl(url) {
    ensureChecked();
    if (!_enabled || !url) return false;
    if (!url.startsWith(_publicBase + '/')) return false;
    const key = url.slice(_publicBase.length + 1);
    try {
        await _client.send(new DeleteObjectCommand({ Bucket: _bucket, Key: key }));
        return true;
    } catch (e) {
        console.warn('[s3] delete failed:', e.name, '-', e.message);
        return false;
    }
}

async function uploadStream(filename, readable, mimeType) {
    ensureChecked();
    if (!_enabled) throw new Error('[s3] not enabled');
    const key = `media/${filename}`;
    const uploader = new Upload({
        client: _client,
        params: {
            Bucket: _bucket,
            Key: key,
            Body: readable,
            ContentType: mimeType || 'application/octet-stream',
        },
        queueSize: 4,
        partSize: 8 * 1024 * 1024,
        leavePartsOnError: false,
    });
    await uploader.done();
    return `${_publicBase}/${key}`;
}

function publicUrlForKey(key) {
    ensureChecked();
    if (!_enabled) throw new Error('[s3] not enabled');
    return `${_publicBase}/${key}`;
}

async function getPresignedPutUrl({ key, mimeType, expiresIn = 300 }) {
    ensureChecked();
    if (!_enabled) throw new Error('[s3] not enabled');
    if (!key) throw new Error('[s3] key required');
    const fullKey = key.startsWith('media/') ? key : `media/${key}`;
    const cmd = new PutObjectCommand({
        Bucket: _bucket,
        Key: fullKey,
        ContentType: mimeType || 'application/octet-stream',
    });
    const uploadUrl = await getSignedUrl(_client, cmd, { expiresIn });
    return { uploadUrl, key: fullKey, publicUrl: `${_publicBase}/${fullKey}`, expiresIn };
}

async function headObject(key) {
    ensureChecked();
    if (!_enabled) throw new Error('[s3] not enabled');
    try {
        const res = await _client.send(new HeadObjectCommand({ Bucket: _bucket, Key: key }));
        return {
            contentLength: Number(res.ContentLength || 0),
            contentType: res.ContentType || '',
        };
    } catch (e) {
        const code = e && (e.name || e.Code);
        const status = e && e.$metadata && e.$metadata.httpStatusCode;
        if (code === 'NotFound' || code === 'NoSuchKey' || status === 404) return null;
        throw e;
    }
}

async function deleteKey(key) {
    ensureChecked();
    if (!_enabled) return false;
    try {
        await _client.send(new DeleteObjectCommand({ Bucket: _bucket, Key: key }));
        return true;
    } catch (e) {
        console.warn('[s3] deleteKey failed:', e.name, '-', e.message);
        return false;
    }
}

module.exports = {
    isEnabled,
    uploadBuffer,
    uploadStream,
    deleteByUrl,
    deleteKey,
    headObject,
    getPresignedPutUrl,
    publicUrlForKey,
};
