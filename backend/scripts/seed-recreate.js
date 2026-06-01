'use strict';
/* One-off: recreate admin + public memorial profiles linked 1:1 to existing /uploads photos. */
require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs');
const sharp = (() => { try { return require('sharp'); } catch { return null; } })();
const prisma = require('../lib/prisma');
const auth = require('../auth');
const { generateUniqueSlug } = require('../lib/slug');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const FIRST = {
  aleksey:'Алексей', andrey:'Андрей', anna:'Анна', artem:'Артём', daria:'Дарья',
  dina:'Дина', dmitry:'Дмитрий', ekaterina:'Екатерина', elena:'Елена', evgeny:'Евгений',
  fedor:'Фёдор', igor:'Игорь', ilya:'Илья', irina:'Ирина', ivan:'Иван', julia:'Юлия',
  kirill:'Кирилл', klavdia:'Клавдия', maksim:'Максим', maria:'Мария', marina:'Марина',
  mikhail:'Михаил', natalia:'Наталья', nikolay:'Николай', olga:'Ольга', pavel:'Павел',
  petr:'Пётр', roman:'Роман', sergey:'Сергей', sofia:'София', tatiana:'Татьяна',
  valentina:'Валентина', veronika:'Вероника', vladimir:'Владимир',
};
const LAST = {
  morozov:'Морозов', morozova:'Морозова', sokolov:'Соколов', sokolova:'Соколова',
  volkov:'Волков', volkova:'Волкова',
};
const SKIP = new Set(['sr','jr','gen0','gen1','gen2','gen3','gen4']);
const CITIES = ['Минск','Гомель','Брест','Витебск','Могилёв','Гродно'];
const BIOS = [
  'Светлой памяти дорогого человека. Прожил(а) достойную жизнь, наполненную трудом и любовью к близким.',
  'Добрый, отзывчивый человек, которого помнят и любят родные. Память о нём(ней) живёт в наших сердцах.',
  'Всю жизнь посвятил(а) семье и любимому делу. Оставил(а) после себя светлую память.',
  'Человек большой души. Его(её) теплота и забота навсегда останутся с нами.',
];

async function main() {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f));
  // admin
  const email = 'admin@admin.local';
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', passwordHash: auth.hashPassword('qwer2609') },
    create: {
      email, displayName: 'admin', role: 'ADMIN',
      passwordHash: auth.hashPassword('qwer2609'),
      acceptedTermsAt: new Date(),
    },
    select: { id: true, email: true, role: true },
  });
  console.log('[admin]', admin.email, admin.role, admin.id);

  let created = 0, skipped = 0, i = 0;
  for (const file of files) {
    const base = file.replace(/\.[^.]+$/, '');
    const parts = base.split(/[_-]/).filter(Boolean);
    const fKey = parts[0];
    const lKey = parts[1];
    const first = FIRST[fKey];
    const last = LAST[lKey];
    if (!first || !last) { console.log('[skip non-name]', file); skipped++; continue; }
    const isSenior = parts.includes('sr') || parts.includes('gen0') || parts.includes('gen1');
    const fullName = `${last} ${first}`;
    const born = isSenior ? 1915 + (i % 20) : 1945 + (i % 35);
    const died = born + 55 + (i % 25);
    const url = `/uploads/${file}`;

    // media (reuse if exists)
    let media = await prisma.media.findFirst({ where: { url } });
    if (!media) {
      let w = null, h = null, mime = 'image/webp';
      try { if (sharp) { const m = await sharp(path.join(UPLOADS_DIR, file)).metadata(); w = m.width||null; h = m.height||null; } } catch {}
      const stat = fs.statSync(path.join(UPLOADS_DIR, file));
      media = await prisma.media.create({
        data: { kind:'IMAGE', url, originalName:file, mimeType:mime, sizeBytes:stat.size, width:w, height:h, uploadedById: admin.id },
      });
    }

    const slug = await generateUniqueSlug(fullName, prisma);
    await prisma.profile.create({
      data: {
        slug, fullName,
        birthDate: new Date(Date.UTC(born, 4, 12)),
        deathDate: new Date(Date.UTC(Math.min(died, 2024), 9, 3)),
        burialPlace: CITIES[i % CITIES.length],
        bio: BIOS[i % BIOS.length],
        gender: /a$/.test(lKey) ? 'FEMALE' : 'MALE',
        visibility: 'PUBLIC',
        ownerId: admin.id,
        coverPhotoId: media.id,
      },
    });
    created++; i++;
    console.log('[ok]', fullName, '←', file);
  }
  console.log(`\n=== ИТОГ: создано ${created}, пропущено ${skipped} ===`);
  await prisma.$disconnect();
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
