/* ═══════════════════════════════════════════════
   DATABASE — node:sqlite (built-in Node 24)
   ═══════════════════════════════════════════════ */
'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs   = require('node:fs');

const DB_DIR  = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'memory.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH, { open: true });

/* ── SCHEMA ── */
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'member',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS people (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    born       TEXT NOT NULL,
    died       TEXT NOT NULL DEFAULT '',
    city       TEXT NOT NULL DEFAULT '',
    bio        TEXT NOT NULL DEFAULT '',
    photo      TEXT NOT NULL DEFAULT '',
    burial     TEXT NOT NULL DEFAULT '',
    burial_query TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         TEXT PRIMARY KEY,
    person_id  TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    author     TEXT NOT NULL,
    text       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS candles (
    id    INTEGER PRIMARY KEY CHECK (id = 1),
    count INTEGER NOT NULL DEFAULT 0
  );

  INSERT OR IGNORE INTO candles (id, count) VALUES (1, 237);

  CREATE TABLE IF NOT EXISTS person_codes (
    person_id  TEXT PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
