'use strict';
/* One-off: build a family tree from existing public profiles (Морозовы/Соколовы/Волковы). */
require('dotenv').config();
const prisma = require('../lib/prisma');

const CLAN_DEFS = [
  { key: 'Морозов', name: 'Морозовы', color: '#c0392b', icon: '❦' },
  { key: 'Соколов', name: 'Соколовы', color: '#2980b9', icon: '✶' },
  { key: 'Волков',  name: 'Волковы',  color: '#27ae60', icon: '✦' },
];

function clanKeyForLast(last) {
  if (/Морозов/.test(last)) return 'Морозов';
  if (/Соколов/.test(last)) return 'Соколов';
  if (/Волков/.test(last))  return 'Волков';
  return null;
}
// 5 поколений: 0 — старшие (низ, ч/б), 4 — молодёжь (верх)
const NUM_GENS = 5;
const GEN_BOTTOM = NUM_GENS - 1;          // индекс самого нижнего ряда по Y
const GEN_YEARS = { 0: 1912, 1: 1936, 2: 1958, 3: 1978, 4: 1998 };
const ROW_H = 280;

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@admin.local' }, select: { id: true } });
  if (!admin) throw new Error('admin not found');

  // чистим прошлые попытки
  await prisma.familyTree.deleteMany({ where: { ownerId: admin.id } });

  const tree = await prisma.familyTree.create({
    data: {
      name: 'Морозовы · Соколовы · Волковы',
      description: 'Родовое древо трёх семей, восстановлено из страниц памяти.',
      ownerId: admin.id,
      visibility: 'PUBLIC',
    },
  });

  // кланы
  const clanByKey = {};
  for (const c of CLAN_DEFS) {
    const clan = await prisma.familyClan.create({
      data: { treeId: tree.id, name: c.name, color: c.color, icon: c.icon },
    });
    clanByKey[c.key] = clan.id;
  }

  const profiles = await prisma.profile.findMany({
    where: { ownerId: admin.id, deletedAt: null },
    select: { id: true, fullName: true, gender: true, coverPhotoId: true, birthDate: true },
  });

  // группируем по роду
  const byClan = {};
  for (const p of profiles) {
    const last = p.fullName.split(' ')[0];
    const clanKey = clanKeyForLast(last);
    if (!clanKey) continue;
    (byClan[clanKey] = byClan[clanKey] || []).push(p);
  }

  // создаём узлы: внутри рода равномерно раскидываем по 5 поколениям (старшие = gen0 = низ)
  const nodes = []; // {id, clanKey, gen, gender}
  const colCounter = {};
  for (const c of CLAN_DEFS) {
    const list = (byClan[c.key] || []).slice().sort((a, b) => {
      const ya = a.birthDate ? a.birthDate.getUTCFullYear() : 0;
      const yb = b.birthDate ? b.birthDate.getUTCFullYear() : 0;
      return ya - yb; // старшие первыми → gen0
    });
    const n = list.length;
    const clanIdx = CLAN_DEFS.findIndex(x => x.key === c.key);
    for (let idx = 0; idx < n; idx++) {
      const p = list[idx];
      const gen = n <= 1 ? GEN_BOTTOM : Math.min(NUM_GENS - 1, Math.floor((idx / n) * NUM_GENS));
      const [last, first] = p.fullName.split(' ');
      const ck = `${c.key}:${gen}`;
      colCounter[ck] = (colCounter[ck] || 0);
      const posX = clanIdx * 1400 + colCounter[ck] * 240;
      const posY = (GEN_BOTTOM - gen) * ROW_H; // gen0 (старшие) — внизу, gen4 (молодёжь) — вверху
      colCounter[ck]++;

      const node = await prisma.familyNode.create({
        data: {
          treeId: tree.id,
          firstName: first || p.fullName,
          lastName: last || null,
          gender: p.gender || 'UNKNOWN',
          photoId: p.coverPhotoId || null,
          clanId: clanByKey[c.key],
          generation: gen,
          posX, posY,
        },
      });
      // синхронизируем годы жизни с поколением
      const by = GEN_YEARS[gen];
      await prisma.profile.update({
        where: { id: p.id },
        data: {
          familyNodeId: node.id,
          birthDate: new Date(Date.UTC(by, 4, 12)),
          deathDate: gen <= 2 ? new Date(Date.UTC(Math.min(by + 72, 2023), 9, 3)) : null,
        },
      });
      nodes.push({ id: node.id, clanKey: c.key, gen, gender: p.gender });
    }
  }

  // родительские связи: каждый узел gen>min получает родителя из gen-1 того же клана (round-robin)
  let parentLinks = 0;
  for (const c of CLAN_DEFS) {
    const clanNodes = nodes.filter(n => n.clanKey === c.key);
    const byGen = {};
    for (const n of clanNodes) (byGen[n.gen] = byGen[n.gen] || []).push(n);
    const gens = Object.keys(byGen).map(Number).sort((a, b) => a - b);
    for (let gi = 1; gi < gens.length; gi++) {
      const parents = byGen[gens[gi - 1]];
      const children = byGen[gens[gi]];
      if (!parents.length) continue;
      let pIdx = 0;
      for (const child of children) {
        const parent = parents[pIdx % parents.length];
        pIdx++;
        try {
          await prisma.familyConnection.create({
            data: { fromNodeId: parent.id, toNodeId: child.id, type: 'PARENT' },
          });
          parentLinks++;
        } catch (e) { if (e.code !== 'P2002') throw e; }
      }
    }
  }

  // брачные связи между родами: в каждом поколении женим М одного клана на Ж другого
  let spouseLinks = 0;
  const maxGen = Math.max(...nodes.map(n => n.gen));
  for (let g = 0; g <= maxGen; g++) {
    const males = nodes.filter(n => n.gen === g && n.gender === 'MALE');
    const females = nodes.filter(n => n.gen === g && n.gender === 'FEMALE');
    const pairs = Math.min(males.length, females.length, 2); // максимум 2 пары на поколение
    let used = 0;
    for (let i = 0; i < males.length && used < pairs; i++) {
      const m = males[i];
      const f = females.find(x => x.clanKey !== m.clanKey && !x._wed);
      if (!f) continue;
      m._wed = true; f._wed = true; used++;
      for (const [a, b] of [[m, f], [f, m]]) {
        try {
          await prisma.familyConnection.create({ data: { fromNodeId: a.id, toNodeId: b.id, type: 'SPOUSE' } });
        } catch (e) { if (e.code !== 'P2002') throw e; }
      }
      spouseLinks++;
    }
  }

  console.log(`[tree] ${tree.name}`);
  console.log(`[tree] узлов: ${nodes.length}, родительских связей: ${parentLinks}, браков: ${spouseLinks}`);
  await prisma.$disconnect();
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
