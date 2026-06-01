'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const prisma = require('../lib/prisma');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

function getHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

async function verify() {
  console.log('🔍 Starting Seeding Self-Verification...\n');

  // 1. Check files on disk
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f !== '.gitkeep');
  console.log(`📁 Files found in backend/uploads/: ${files.length}`);

  let belowSizeLimit = 0;
  let invalidFormat = 0;
  const hashToFiles = {};
  const sizeToFiles = {};
  let duplicates = 0;

  for (const f of files) {
    const p = path.join(UPLOADS_DIR, f);
    const stat = fs.statSync(p);
    
    // Check Size > 15 KB (15360 bytes)
    if (stat.size <= 15360) {
      console.error(`❌ File ${f} is too small: ${stat.size} bytes`);
      belowSizeLimit++;
    }

    // Check format
    const ext = path.extname(f).toLowerCase();
    if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
      console.error(`❌ File ${f} has invalid format: ${ext}`);
      invalidFormat++;
    }

    // Uniqueness checks (size & hash)
    const hash = getHash(p);
    if (hashToFiles[hash]) {
      console.error(`❌ DUPLICATE HASH: ${f} matches ${hashToFiles[hash]}`);
      duplicates++;
    } else {
      hashToFiles[hash] = f;
    }
  }

  // 2. Check Database Media records
  const mediaRows = await prisma.media.findMany({});
  console.log(`📊 Media rows in DB: ${mediaRows.length}`);

  let nullDimensionsCount = 0;
  for (const m of mediaRows) {
    if (!m.width || !m.height) {
      console.error(`❌ Media record ${m.id} (${m.url}) has null dimensions (width: ${m.width}, height: ${m.height})`);
      nullDimensionsCount++;
    }
  }

  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`1. Files size check: ${belowSizeLimit === 0 ? '✅ PASS (All > 15KB)' : `❌ FAIL (${belowSizeLimit} small files)`}`);
  console.log(`2. File format check: ${invalidFormat === 0 ? '✅ PASS (All webp/jpg/png)' : `❌ FAIL (${invalidFormat} bad formats)`}`);
  console.log(`3. Hash uniqueness check: ${duplicates === 0 ? '✅ PASS (No identical files)' : `❌ FAIL (${duplicates} duplicates)`}`);
  console.log(`4. Database Media Count: ${mediaRows.length >= 59 ? `✅ PASS (${mediaRows.length} rows >= 59)` : `❌ FAIL (${mediaRows.length} rows)`}`);
  console.log(`5. Database Media Dimensions: ${nullDimensionsCount === 0 ? '✅ PASS (All populated)' : `❌ FAIL (${nullDimensionsCount} null dimensions)`}`);
  console.log('---------------------------\n');

  if (belowSizeLimit || invalidFormat || duplicates || mediaRows.length < 59 || nullDimensionsCount) {
    console.error('❌ SELF-VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('🎉 SELF-VERIFICATION COMPLETED SUCCESSFULLY!');
    process.exit(0);
  }
}

verify().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
