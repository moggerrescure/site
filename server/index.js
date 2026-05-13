/* ═══════════════════════════════════════════════
   MEMORY SITE — Node.js HTTP Server
   No external dependencies — pure Node 24
   ═══════════════════════════════════════════════ */
'use strict';

/* Load .env if present */
const fs   = require('node:fs');
const path = require('node:path');
const http = require('node:http');

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

const { dispatch, seedIfEmpty } = require('./router');

/* ── Seed database on first run ── */
seedIfEmpty();

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

/* ── Static file server ── */
function serveStatic(req, res) {
  const url      = new URL(req.url, 'http://localhost');
  let   pathname = decodeURIComponent(url.pathname);

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

  if (!fs.existsSync(file)) {
    // Try index.html fallback
    const fallback = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(fallback).pipe(res);
    }
    res.writeHead(404); return res.end('Not found');
  }

  const ext  = path.extname(file).toLowerCase();
  const mime = MIME[ext] || 'text/plain';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(file).pipe(res);
}

/* ── Main request handler ── */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    return dispatch(req, res);
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
});

server.on('error', err => {
  console.error('Server error:', err.message);
  process.exit(1);
});
