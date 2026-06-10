const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BLOCKS = [
  {
    type: 'CHILDHOOD',
    title: 'Детство и ранние годы',
    body: 'Родился в теплой и дружной семье, где с ранних лет воспитывалось уважение к труду и близким. Детские годы прошли в окружении верных друзей, книг и активных игр на свежем воздухе. С самого раннего возраста проявлял живой интерес к устройству мира и всегда стремился узнать что-то новое.'
  },
  {
    type: 'EDUCATION',
    title: 'Образование',
    body: 'С отличием окончил среднюю школу, после чего поступил в высшее учебное заведение. В студенческие годы не только прилежно учился, но и активно участвовал в общественной жизни. Преподаватели всегда отмечали его целеустремленность, острый ум и умение находить нестандартные решения сложных задач.'
  },
  {
    type: 'CAREER',
    title: 'Профессиональный путь',
    body: 'Посвятил своей профессии более тридцати лет жизни. Прошел путь от молодого специалиста до уважаемого руководителя и наставника. Коллеги ценили его за высочайший профессионализм, принципиальность, готовность всегда прийти на помощь и поддержать добрым словом или мудрым советом.'
  },
  {
    type: 'FAMILY',
    title: 'Семья и близкие',
    body: 'Был преданным супругом и невероятно заботливым родителем. Семья всегда была для него главным приоритетом в жизни, тихой гаванью и надежной опорой. Стремился дать детям лучшее воспитание, научить их честности, доброте и взаимовыручке. Дом всегда был открыт для гостей.'
  },
  {
    type: 'LEGACY',
    title: 'Наследие и память',
    body: 'Оставил после себя светлый след в сердцах всех, кто его знал. Его дела, мудрые мысли и бескорыстная помощь людям продолжают жить в памяти детей, внуков, коллег и многочисленных друзей. Жизненный путь этого человека — прекрасный ориентир для будущих поколений.'
  }
];

const QUOTES = [
  "Помним, любим, скорбим. Ты навсегда останешься в нашей памяти самым светлым, добрым и понимающим человеком.",
  "Твоя мудрость, доброта и поддержка согревали нас в самые трудные минуты. Спасибо за всё, что ты для нас сделал.",
  "Светлая память о прекрасном человеке. Твой жизненный путь — пример чести, трудолюбия и любви к людям.",
  "Человек живет до тех пор, пока жива память о нем. В наших сердцах ты будешь жить вечно.",
  "Ты ушел, но оставил после себя тепло, которое продолжает согревать наши души. Нам очень тебя не хватает."
];

const AUTHORS = [
  "Семья и близкие",
  "Дети и внуки",
  "Друзья и коллеги",
  "Любящие родные",
  "С благодарностью и любовью"
];

async function main() {
  console.log('Starting seed details script...');
  const profiles = await prisma.profile.findMany({
    where: { deletedAt: null }
  });

  console.log(`Found ${profiles.length} profiles to update.`);

  let updatedBlocks = 0;
  let updatedMemories = 0;

  for (const p of profiles) {
    if (p.fullName === 'Новая страница') continue;

    // Check content blocks
    const blockCount = await prisma.contentBlock.count({
      where: { profileId: p.id }
    });

    if (blockCount === 0) {
      // Create 3 to 5 blocks (randomly choose)
      const numBlocks = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
      const chosenBlocks = BLOCKS.slice(0, numBlocks);

      for (let order = 0; order < chosenBlocks.length; order++) {
        const b = chosenBlocks[order];
        await prisma.contentBlock.create({
          data: {
            profileId: p.id,
            type: b.type,
            title: b.title,
            body: b.body,
            order: order,
            isHidden: false
          }
        });
        updatedBlocks++;
      }
    }

    // Check guest memories (quotes)
    const memoryCount = await prisma.guestMemory.count({
      where: { profileId: p.id, isApproved: true }
    });

    if (memoryCount === 0) {
      const quoteText = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      const authorName = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];

      await prisma.guestMemory.create({
        data: {
          profileId: p.id,
          authorName: authorName,
          text: quoteText,
          type: 'TEXT',
          isApproved: true,
          approvedAt: new Date()
        }
      });
      updatedMemories++;
    }
  }

  console.log(`Seeding complete. Created ${updatedBlocks} blocks and ${updatedMemories} quotes.`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
