/* ═══════════════════════════════════════════════
   ORPHANED UPLOADS CLEANUP UTILITY
   Finds and deletes uploaded files no longer
   referenced in the database.
   ═══════════════════════════════════════════════ */
'use strict';

const path = require('node:path');
const fs   = require('node:fs');
const db   = require('./db');

/**
 * Scans server/uploads/ and deletes any files that are not referenced in
 * people.photo, reviews.photo_url, or family_nodes.photo_url.
 */
function runCleanup() {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    console.log('[Cleanup] Uploads directory does not exist. Skipping.');
    return 0;
  }

  // 1. Gather all referenced files from the database (case-insensitive checks)
  const referencedFiles = new Set();

  try {
    // From people
    const people = db.prepare('SELECT photo FROM people').all();
    for (const row of people) {
      if (row.photo) {
        const file = path.basename(row.photo);
        if (file) referencedFiles.add(file.toLowerCase());
      }
    }

    // From reviews
    const reviews = db.prepare('SELECT photo_url FROM reviews').all();
    for (const row of reviews) {
      if (row.photo_url) {
        const file = path.basename(row.photo_url);
        if (file) referencedFiles.add(file.toLowerCase());
      }
    }

    // From family_nodes
    const nodes = db.prepare('SELECT photo_url FROM family_nodes').all();
    for (const row of nodes) {
      if (row.photo_url) {
        const file = path.basename(row.photo_url);
        if (file) referencedFiles.add(file.toLowerCase());
      }
    }
  } catch (err) {
    console.error('[Cleanup] Error gathering referenced files from DB:', err);
    throw err;
  }

  console.log(`[Cleanup] Gathered ${referencedFiles.size} unique referenced files from database.`);

  // 2. Scan uploads directory and delete orphaned files
  let deletedCount = 0;
  try {
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      const fullPath = path.join(uploadDir, file);
      
      // Ignore subdirectories and dotfiles/system files (e.g. .gitignore)
      if (!fs.statSync(fullPath).isFile() || file.startsWith('.')) {
        continue;
      }

      if (!referencedFiles.has(file.toLowerCase())) {
        console.log(`[Cleanup] Deleting orphaned file: ${file}`);
        fs.unlinkSync(fullPath);
        deletedCount++;
      }
    }
    console.log(`[Cleanup] Uploads cleanup completed. Deleted ${deletedCount} orphaned files.`);
  } catch (err) {
    console.error('[Cleanup] Error cleaning up uploads directory:', err);
    throw err;
  }

  return deletedCount;
}

// Execute directly if run via CLI
if (require.main === module) {
  try {
    runCleanup();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

module.exports = { runCleanup };
