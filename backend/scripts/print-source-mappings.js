'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BRAIN_DIR = 'C:\\Users\\ivan-\\.gemini\\antigravity\\brain';
const VERIFIED_DIRS = [
  'e54c01d6-d0a5-4258-9841-edbe623f2f57',
  '8937f345-a84b-497b-a539-095f1ef41fa1',
  '3c2d5c98-9ff9-4543-8b37-d5b197b25e8c',
  '8c0cdbeb-391b-4815-8999-7bb19de17ea7',
  '70edde20-506a-4adb-b774-135a83abba2c',
  'aba154b2-a966-4c49-a0c4-baec5ebb1193'
];

const PEOPLE = [
  { key: 'fedor_g0', gender: 'MALE', gen: 0, deceased: true },
  { key: 'anna_g0', gender: 'FEMALE', gen: 0, deceased: true },
  { key: 'ivan_g0', gender: 'MALE', gen: 0, deceased: true },
  { key: 'maria_g0', gender: 'FEMALE', gen: 0, deceased: true },
  { key: 'petr_g1', gender: 'MALE', gen: 1, deceased: true },
  { key: 'olga_g1', gender: 'FEMALE', gen: 1, deceased: true },
  { key: 'nina_g1', gender: 'FEMALE', gen: 1, deceased: true },
  { key: 'sergey_g1', gender: 'MALE', gen: 1, deceased: true },
  { key: 'vladimir_g1', gender: 'MALE', gen: 1, deceased: true },
  { key: 'valentina_g1', gender: 'FEMALE', gen: 1, deceased: true },
  { key: 'tatiana_g1', gender: 'FEMALE', gen: 1, deceased: true },
  { key: 'nikolay_g1', gender: 'MALE', gen: 1, deceased: true },
  { key: 'ivan_g2', gender: 'MALE', gen: 2, deceased: true },
  { key: 'tamara_g2', gender: 'FEMALE', gen: 2, deceased: true },
  { key: 'svetlana_g2', gender: 'FEMALE', gen: 2, deceased: false },
  { key: 'andrey_g2', gender: 'MALE', gen: 2, deceased: false },
  { key: 'larisa_g2', gender: 'FEMALE', gen: 2, deceased: false },
  { key: 'viktor_g2', gender: 'MALE', gen: 2, deceased: true },
  { key: 'raisa_g2', gender: 'FEMALE', gen: 2, deceased: false },
  { key: 'mikhail_g2', gender: 'MALE', gen: 2, deceased: true },
  { key: 'zoya_g2', gender: 'FEMALE', gen: 2, deceased: false },
  { key: 'sergey_g3', gender: 'MALE', gen: 3, deceased: false },
  { key: 'alena_g3', gender: 'FEMALE', gen: 3, deceased: false },
  { key: 'natalia_g3', gender: 'FEMALE', gen: 3, deceased: false },
  { key: 'artem_g3', gender: 'MALE', gen: 3, deceased: false },
  { key: 'yulia_g3', gender: 'FEMALE', gen: 3, deceased: false },
  { key: 'daria_g3', gender: 'FEMALE', gen: 3, deceased: false },
  { key: 'dmitry_g3', gender: 'MALE', gen: 3, deceased: false },
  { key: 'marina_g3', gender: 'FEMALE', gen: 3, deceased: false },
  { key: 'roman_g3', gender: 'MALE', gen: 3, deceased: false },
  { key: 'oksana_g3', gender: 'FEMALE', gen: 3, deceased: false },
  { key: 'timur_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'polina_g4', gender: 'FEMALE', gen: 4, deceased: false },
  { key: 'nikita_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'maksim_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'veronika_g4', gender: 'FEMALE', gen: 4, deceased: false },
  { key: 'gleb_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'kirill_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'alisa_g4', gender: 'FEMALE', gen: 4, deceased: false },
  { key: 'egor_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'eva_g4', gender: 'FEMALE', gen: 4, deceased: false },
  { key: 'vladislav_g4', gender: 'MALE', gen: 4, deceased: false },
  { key: 'sofia_g4', gender: 'FEMALE', gen: 4, deceased: false }
];

function getHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const p = path.join(dir, file);
    try {
      const stat = fs.statSync(p);
      if (stat && stat.isDirectory()) {
        results = results.concat(walkDir(p));
      } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(p).toLowerCase()) && stat.size > 100000) {
        results.push({ path: p, name: file, size: stat.size });
      }
    } catch (_) {}
  }
  return results;
}

function main() {
  let allImages = [];
  for (const d of VERIFIED_DIRS) {
    const fullPath = path.join(BRAIN_DIR, d);
    allImages = allImages.concat(walkDir(fullPath));
  }
  
  const excludes = ['screenshot', 'stress', 'chart', 'test', 'builder_in_hardhat', 'cat_', 'hand_drawn', 'feature_'];
  const filtered = allImages.filter(img => {
    const name = img.name.toLowerCase();
    const isTempMedia = img.path.includes('.tempmediaStorage');
    return !excludes.some(ex => name.includes(ex)) && !isTempMedia;
  });

  const uniqueMap = {};
  for (const img of filtered) {
    try {
      const hash = getHash(img.path);
      if (!uniqueMap[hash]) {
        uniqueMap[hash] = img;
      }
    } catch (_) {}
  }

  const pool = Object.values(uniqueMap);

  const vintageMales = [];
  const vintageFemales = [];
  const modernMales = [];
  const modernFemales = [];
  const boys = [];
  const girls = [];

  for (const img of pool) {
    const name = img.name.toLowerCase();
    const pStr = img.path.toLowerCase();

    let isFemale = false;
    let isMale = false;

    if (name.includes('woman') || name.includes('girl') || name.includes('anna') || name.includes('maria') || name.includes('olga') || name.includes('nina') || name.includes('valentina') || name.includes('tatiana') || name.includes('tamara') || name.includes('svetlana') || name.includes('larisa') || name.includes('raisa') || name.includes('zoya') || name.includes('alena') || name.includes('natalia') || name.includes('yulia') || name.includes('daria') || name.includes('marina') || name.includes('oksana') || name.includes('polina') || name.includes('veronika') || name.includes('alisa') || name.includes('eva') || name.includes('sofia') || name.includes('irina') || name.includes('elena') || name.includes('klavdia') || name.includes('morozova') || name.includes('sokolova') || name.includes('volkova') || name.includes('petrova')) {
      isFemale = true;
    } else if (name.includes('man') || name.includes('boy') || name.includes('fedor') || name.includes('ivan') || name.includes('petr') || name.includes('sergey') || name.includes('vladimir') || name.includes('nikolay') || name.includes('viktor') || name.includes('mikhail') || name.includes('artem') || name.includes('dmitry') || name.includes('roman') || name.includes('timur') || name.includes('nikita') || name.includes('maksim') || name.includes('gleb') || name.includes('kirill') || name.includes('egor') || name.includes('vladislav') || name.includes('pavel') || name.includes('evgeny') || name.includes('worker') || name.includes('morozov') || name.includes('sokolov') || name.includes('volkov') || name.includes('petrov')) {
      isMale = true;
    }

    const isVintage = pStr.includes('e54c') || pStr.includes('8937') || name.includes('soviet') || name.includes('retro') || name.includes('vintage') || name.includes('old') || name.includes('senior');
    const isKid = name.includes('child') || name.includes('boy') || name.includes('girl') || name.includes('timur') || name.includes('polina') || name.includes('nikita') || name.includes('maksim') || name.includes('veronika') || name.includes('gleb') || name.includes('kirill') || name.includes('alisa') || name.includes('egor') || name.includes('eva') || name.includes('vladislav') || name.includes('sofia');

    if (isKid) {
      if (isMale) boys.push(img);
      else if (isFemale) girls.push(img);
      else boys.push(img);
    } else if (isVintage) {
      if (isFemale) vintageFemales.push(img);
      else vintageMales.push(img);
    } else {
      if (isFemale) modernFemales.push(img);
      else modernMales.push(img);
    }
  }

  const usedPaths = new Set();
  
  function popUnique(poolList, genderFallbackList, generalFallbackList) {
    for (const img of poolList) {
      if (!usedPaths.has(img.path)) {
        usedPaths.add(img.path);
        return img;
      }
    }
    for (const img of genderFallbackList) {
      if (!usedPaths.has(img.path)) {
        usedPaths.add(img.path);
        return img;
      }
    }
    for (const img of generalFallbackList) {
      if (!usedPaths.has(img.path)) {
        usedPaths.add(img.path);
        return img;
      }
    }
    throw new Error('Not enough unique assets');
  }

  const mappings = [];
  for (const p of PEOPLE) {
    const isM = p.gender === 'MALE';
    const gen = p.gen;
    let src1;
    if (gen <= 1) {
      src1 = isM 
        ? popUnique(vintageMales, pool.filter(x => x.name.toLowerCase().includes('man')), pool) 
        : popUnique(vintageFemales, pool.filter(x => x.name.toLowerCase().includes('woman')), pool);
    } else if (gen === 2) {
      src1 = isM 
        ? popUnique(vintageMales, pool.filter(x => x.name.toLowerCase().includes('man')), pool) 
        : popUnique(vintageFemales, pool.filter(x => x.name.toLowerCase().includes('woman')), pool);
    } else if (gen === 3) {
      src1 = isM 
        ? popUnique(modernMales, pool.filter(x => x.name.toLowerCase().includes('man')), pool) 
        : popUnique(modernFemales, pool.filter(x => x.name.toLowerCase().includes('woman')), pool);
    } else {
      src1 = isM 
        ? popUnique(boys, pool.filter(x => x.name.toLowerCase().includes('boy')), pool) 
        : popUnique(girls, pool.filter(x => x.name.toLowerCase().includes('girl')), pool);
    }

    mappings.push({ key: p.key, type: 'avatar', source: path.basename(src1.path), sourceDir: path.basename(path.dirname(src1.path)) });

    if (p.deceased) {
      let src2 = isM 
        ? popUnique(vintageMales, pool.filter(x => x.name.toLowerCase().includes('man')), pool) 
        : popUnique(vintageFemales, pool.filter(x => x.name.toLowerCase().includes('woman')), pool);
      mappings.push({ key: p.key, type: 'photo_1', source: path.basename(src2.path), sourceDir: path.basename(path.dirname(src2.path)) });
      mappings.push({ key: p.key, type: 'photo_2', source: path.basename(src2.path), sourceDir: path.basename(path.dirname(src2.path)) });
    }
  }

  // Print 10 sample mappings
  console.log('Sample Mappings (10 random rows):');
  for (let i = 0; i < 10; i++) {
    const idx = Math.floor(Math.random() * mappings.length);
    console.log(`Target: ${mappings[idx].key} (${mappings[idx].type}) => Src: ${mappings[idx].sourceDir}/${mappings[idx].source} `);
  }
}

main();
