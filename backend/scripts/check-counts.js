'use strict';

const prisma = require('../lib/prisma');

async function run() {
  const allNodes = await prisma.familyNode.findMany({
    select: { id: true, firstName: true, lastName: true, deathDate: true, profile: true }
  });
  console.log('Total nodes:', allNodes.length);
  console.log('Nodes sample:', allNodes.slice(0, 5));
  
  const allProfiles = await prisma.profile.findMany();
  console.log('Total profiles:', allProfiles.length);
  if (allProfiles.length > 0) {
    console.log('Profiles sample:', allProfiles.slice(0, 5));
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
