/* ═══════════════════════════════════════════════
   MEMORY SITE — Node.js HTTP Server
   No external dependencies — pure Node 24
   ═══════════════════════════════════════════════ */
'use strict';

/* Load .env if present */
const fs   = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');

const { runBackup } = require('./backup');
const { runCleanup } = require('./cleanup');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const [k, ...v] = line.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    });
}

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, '..'); // serve frontend from site/

// Папка с данными Telegram-бота (WebP + JSON страниц)
const BOT_DATA_DIR = path.join(__dirname, '..', '..', 'memorial-bot', 'data');

const { dispatch, seedIfEmpty, seedFamilyDefaultIfEmpty } = require('./router');

/* ── Seed database on first run ── */
seedIfEmpty();
seedFamilyDefaultIfEmpty();

/* ── MIME types ── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

function serveStatic(req, res) {
  const url      = new URL(req.url, 'http://localhost');
  let   pathname = decodeURIComponent(url.pathname);
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const supportsGzip = acceptEncoding.includes('gzip');

  // uploads from server/uploads/
  if (pathname.startsWith('/uploads/')) {
    const file = path.join(__dirname, 'uploads', path.basename(pathname));
    if (fs.existsSync(file)) {
      const ext  = path.extname(file).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(404); return res.end('Not found');
  }

  // default to index.html for SPA-like navigation
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const file = path.join(STATIC_DIR, pathname);

  if (!file.startsWith(STATIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }

  const fallback = path.join(STATIC_DIR, 'index.html');
  const targetFile = fs.existsSync(file) ? file : (fs.existsSync(fallback) ? fallback : null);

  if (!targetFile) {
    res.writeHead(404); return res.end('Not found');
  }

  const ext  = path.extname(targetFile).toLowerCase();
  const mime = MIME[ext] || 'text/plain';
  
  // Compress text assets (HTML, CSS, JS, JSON, SVG)
  const compressible = /^(text\/|application\/javascript|application\/json|image\/svg\+xml)/.test(mime);

  if (supportsGzip && compressible) {
    res.writeHead(200, { 
      'Content-Type': mime,
      'Content-Encoding': 'gzip'
    });
    return fs.createReadStream(targetFile).pipe(zlib.createGzip()).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': mime });
    return fs.createReadStream(targetFile).pipe(res);
  }
}

/* ── Main request handler ── */
const server = http.createServer((req, res) => {
  // Inject standard security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    return dispatch(req, res);
  }

  // Раздаём файлы из папки бота: /bot-data/* → memorial-bot/data/*
  if (url.pathname.startsWith('/bot-data/')) {
    const rel  = decodeURIComponent(url.pathname.slice('/bot-data/'.length));
    const file = path.join(BOT_DATA_DIR, rel);
    if (!file.startsWith(BOT_DATA_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext  = path.extname(file).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    return fs.createReadStream(file).pipe(res);
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🕯️  Memory Site Server                ║
║  http://localhost:${PORT}                 ║
║  API: http://localhost:${PORT}/api/       ║
╚════════════════════════════════════════╝
  `);

  // Run database backup and file cleanup checks on startup
  try {
    console.log('[Startup] Executing automatic database backup...');
    runBackup();
  } catch (err) {
    console.error('[Startup] Automatic backup failed:', err.message);
  }

  try {
    console.log('[Startup] Executing automatic uploads cleanup...');
    runCleanup();
  } catch (err) {
    console.error('[Startup] Automatic cleanup failed:', err.message);
  }

  // Schedule background backups and cleanups every 24 hours
  const INTERVAL_24H = 24 * 60 * 60 * 1000;
  setInterval(() => {
    try {
      console.log('[Scheduled] Running scheduled database backup...');
      runBackup();
    } catch (err) {
      console.error('[Scheduled] Scheduled backup failed:', err.message);
    }

    try {
      console.log('[Scheduled] Running scheduled uploads cleanup...');
      runCleanup();
    } catch (err) {
      console.error('[Scheduled] Scheduled cleanup failed:', err.message);
    }
  }, INTERVAL_24H);
});

server.on('error', err => {
  console.error('Server error:', err.message);
  process.exit(1);
});
