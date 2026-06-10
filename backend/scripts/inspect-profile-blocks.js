'use strict';

const prisma = require('../lib/prisma');

async function run() {
  const profiles = await prisma.profile.findMany({
    include: {
      blocks: {
        include: {
          photo: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  });

  console.log(`Found ${profiles.length} profiles:`);
  for (const profile of profiles) {
    console.log(`\nProfile: ${profile.fullName} (slug: ${profile.slug})`);
    if (profile.blocks.length === 0) {
      console.log('  No biography blocks.');
      continue;
    }
    for (const block of profile.blocks) {
      const photoUrl = block.photo ? block.photo.url : 'None';
      console.log(`  - Block [${block.type}] (order: ${block.order}): Title="${block.title || 'N/A'}", Photo="${photoUrl}"`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
