/* ═══════════════════════════════════════════════
   FILE UPLOAD — multipart/form-data parser
   Pure Node.js, no multer dependency
   ═══════════════════════════════════════════════ */
'use strict';

const fs   = require('node:fs');
const path = require('node:path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_SIZE   = 8 * 1024 * 1024; // 8 MB
const ALLOWED    = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * Parse a multipart/form-data request and save the first file field.
 * Returns the saved filename.
 */
function parseUpload(req, prefix) {
  return new Promise((resolve, reject) => {
    const ct = req.headers['content-type'] || '';
    const boundaryMatch = ct.match(/boundary=([^\s;]+)/);
    if (!boundaryMatch) return reject(new Error('Not a multipart request'));

    const boundary = '--' + boundaryMatch[1];
    const chunks = [];
    let totalSize = 0;

    req.on('data', chunk => {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE) { req.destroy(); return reject(new Error('File too large (max 8MB)')); }
      chunks.push(chunk);
    });

    req.on('error', reject);

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const bodyStr = body.toString('binary');

        // Split by boundary
        const parts = bodyStr.split(boundary).slice(1); // first is empty before first boundary

        for (const part of parts) {
          if (part.startsWith('--')) continue; // final boundary

          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;

          const headers  = part.slice(0, headerEnd);
          const fileData = part.slice(headerEnd + 4, part.length - 2); // strip trailing \r\n

          const cdMatch   = headers.match(/Content-Disposition:[^\r\n]*filename="([^"]+)"/i);
          if (!cdMatch) continue; // not a file field

          const origName = cdMatch[1];
          const ext      = path.extname(origName).toLowerCase();
          if (!ALLOWED.has(ext)) { return reject(new Error(`File type not allowed: ${ext}`)); }

          const safeName = `${prefix}-${Date.now()}${ext}`;
          const savePath = path.join(UPLOAD_DIR, safeName);

          // Write binary-encoded string back to buffer
          fs.writeFileSync(savePath, Buffer.from(fileData, 'binary'));
          return resolve(safeName);
        }
        reject(new Error('No file found in request'));
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { parseUpload };
