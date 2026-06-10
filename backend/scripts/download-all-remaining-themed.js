'use strict';

const fs = require('node:fs');
const path = require('node:path');
const execSync = require('child_process').execSync;

const REMAINING_IMAGES = [
  { target: 'photo_ivan_g0_2.webp', keyword: 'Soviet military helmet', gen: 0 },
  { target: 'photo_maria_g0_2.webp', keyword: 'grandmother reading book to children', gen: 0 },
  { target: 'photo_olga_g1_2.webp', keyword: 'mother and child vintage', gen: 1 },
  { target: 'photo_nina_g1_1.webp', keyword: 'vintage classroom blackboard', gen: 1 },
  { target: 'photo_nina_g1_2.webp', keyword: 'watering can flowers garden', gen: 1 },
  { target: 'photo_sergey_g1_1.webp', keyword: 'old truck dashboard', gen: 1 },
  { target: 'photo_sergey_g1_2.webp', keyword: 'military letters vintage', gen: 1 },
  { target: 'photo_valentina_g1_1.webp', keyword: 'vintage stethoscope glass bottles', gen: 1 },
  { target: 'photo_valentina_g1_2.webp', keyword: 'hands knitting needles wool', gen: 1 },
  { target: 'photo_tatiana_g1_1.webp', keyword: 'rare old books library shelves', gen: 1 },
  { target: 'photo_tatiana_g1_2.webp', keyword: 'university library book stacks', gen: 1 },
  { target: 'photo_nikolay_g1_1.webp', keyword: 'soviet truck factory', gen: 1 },
  { target: 'photo_nikolay_g1_2.webp', keyword: 'soviet dacha garden', gen: 1 },
  { target: 'photo_viktor_g2_1.webp', keyword: 'truck highway windshield', gen: 2 },
  { target: 'photo_viktor_g2_2.webp', keyword: 'travel journal map thermos', gen: 2 },
  { target: 'photo_mikhail_g2_1.webp', keyword: 'classroom blackboard history map', gen: 2 },
  { target: 'photo_mikhail_g2_2.webp', keyword: 'archaeological excavation site tools', gen: 2 }
];

async function run() {
  const downloadScript = path.join(__dirname, 'download-wikimedia-image.js');
  console.log(`Starting bulk download and processing for ${REMAINING_IMAGES.length} remaining images...`);

  for (let i = 0; i < REMAINING_IMAGES.length; i++) {
    const item = REMAINING_IMAGES[i];
    console.log(`\n==================================================`);
    console.log(`Progress: [${i + 1}/${REMAINING_IMAGES.length}] - ${item.target}`);
    console.log(`==================================================`);

    try {
      execSync(`node "${downloadScript}" "${item.keyword}" "${item.target}" ${item.gen}`, { stdio: 'inherit' });
      console.log(`✓ Successfully completed: ${item.target}`);
    } catch (err) {
      console.error(`✗ Failed to download/process: ${item.target}. Error: ${err.message}`);
      // Continue to next image even if one fails
    }
  }

  console.log('\nBulk processing completed.');
}

run();
