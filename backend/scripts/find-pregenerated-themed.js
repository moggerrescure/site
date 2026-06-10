'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BRAIN_DIR = 'C:\\Users\\ivan-\\.gemini\\antigravity\\brain';

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const p = path.join(dir, file);
      const stat = fs.statSync(p);
      if (stat && stat.isDirectory()) {
        results = results.concat(walkDir(p));
      } else {
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) && stat.size > 20000) {
          results.push({ path: p, name: file, size: stat.size });
        }
      }
    }
  } catch (err) {
    // Ignore errors
  }
  return results;
}

async function run() {
  console.log(`Scanning all subdirectories of: ${BRAIN_DIR}...`);
  if (!fs.existsSync(BRAIN_DIR)) {
    console.error('Brain directory not found!');
    return;
  }

  const allImages = walkDir(BRAIN_DIR);
  console.log(`Found ${allImages.length} images in total.`);

  // Print all image files containing keywords in their filename
  const keywords = [
    'forge', 'blacksmith', 'military', 'soldier', 'labor', 'peasant', 'village',
    'childhood', 'hearth', 'samovar', 'embroidery', 'sewing', 'atelier', 'grandchildren',
    'mtz', 'tractor', 'evening_school', 'classroom', 'accounting', 'abacus',
    'mother', 'flowers', 'garden', 'driver', 'chauffeur', 'frontline', 'medical',
    'stethoscope', 'knitting', 'rare_book', 'library', 'maz', 'factory', 'dacha',
    'drafting', 'blueprint', 'office', 'typewriter', 'truck', 'road_stories', 'dig', 'archaeology'
  ];

  console.log('\n--- Match results ---');
  let matchCount = 0;
  for (const img of allImages) {
    const lowerName = img.name.toLowerCase();
    const matches = keywords.filter(kw => lowerName.includes(kw));
    if (matches.length > 0) {
      console.log(`[Match] ${img.path} (${img.size} bytes) - Matches: ${matches.join(', ')}`);
      matchCount++;
    }
  }
  console.log(`Total matching images: ${matchCount}`);
}

run().catch(console.error);
