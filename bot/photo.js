/**
 * photo.js — Скачивание фото из Telegram и конвертация в WebP
 * 
 * 1. Получает file_id из Telegram
 * 2. Скачивает файл через Bot API
 * 3. Конвертирует в WebP через sharp
 * 4. Сохраняет в server/uploads/
 * 5. Возвращает URL /uploads/filename.webp
 */

'use strict';

const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, '..', 'server', 'uploads');

// Создаём папку если нет
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Скачивает файл по URL и возвращает Buffer
 */
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Скачивает фото из Telegram по file_id, конвертирует в WebP, сохраняет
 * @param {object} ctx - Telegraf context (нужен ctx.telegram.getFileLink)
 * @param {string} fileId - Telegram file_id
 * @returns {string} URL вида /uploads/xxxxx.webp
 */
async function downloadAndConvert(ctx, fileId) {
  // 1. Получаем ссылку на файл от Telegram
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const url = fileLink.href || fileLink.toString();

  // 2. Скачиваем
  const buffer = await downloadBuffer(url);

  // 3. Конвертируем в WebP с ресайзом (макс. 1200px по длинной стороне)
  const webpBuffer = await sharp(buffer)
    .rotate() // авто-поворот по EXIF
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  // 4. Сохраняем
  const filename = crypto.randomUUID() + '.webp';
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, webpBuffer);

  // 5. Возвращаем URL
  return '/uploads/' + filename;
}

module.exports = { downloadAndConvert };
