'use strict';

/**
 * Простой, но устойчивый фильтр нецензурной лексики.
 * Нормализует обходы: повторы букв (хуууй), латинские «двойники» (xyй),
 * цифры-leet (3,0,4...), пробелы/символы между буквами.
 * Цель — НЕ цензура ради цензуры, а вежливая просьба переформулировать
 * на странице памяти + защита вывода модели.
 */

const LOOKALIKE = {
  a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х', y: 'у',
  k: 'к', m: 'м', t: 'т', h: 'н', b: 'в', n: 'н',
  '@': 'а', $: 'с', '0': 'о', '3': 'з', '4': 'ч', '1': 'и', '6': 'б',
};

// Нормализация под кириллицу
function normalizeCyr(s) {
  let t = String(s || '').toLowerCase();
  t = t.replace(/[a-z0-9@$]/g, (ch) => LOOKALIKE[ch] || ch);
  t = t.replace(/[^а-яё]/g, '');       // только кириллица
  t = t.replace(/(.)\1+/g, '$1');      // схлопываем повторы: хуууй -> хуй
  return t;
}

// Нормализация под латиницу (транслит-мат: blyad, suka, pizdec...)
function normalizeLat(s) {
  return String(s || '').toLowerCase().replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
}

// Корни подобраны так, чтобы минимизировать ложные срабатывания
// (намеренно НЕ включены короткие/двусмысленные «хер», «манда», «еба», «муда»).
const ROOTS_CYR = [
  'хуй', 'хуё', 'хуе', 'хую', 'хуя', 'хуйн', 'хуев',
  'пизд', 'пизж',
  'ебать', 'ебал', 'ебан', 'ебуч', 'ебло', 'ебись', 'ебёт', 'ебет', 'ебут',
  'выеб', 'заеб', 'наеб', 'въеб', 'отъеб', 'проеб', 'разъеб',
  'ёбан', 'ёбну', 'ебну', 'долбоёб', 'долбоеб', 'долбаёб',
  'блядь', 'блят', 'бляд', 'блядс',
  'сука', 'суки', 'суке', 'суку', 'сукин', 'сучар', 'сучк',
  'мудак', 'мудач', 'мудил', 'мудозвон',
  'залуп', 'гондон', 'гандон',
  'пидор', 'пидар', 'пидр', 'пидорас',
  'дроч', 'говно', 'говн', 'говён', 'говен',
  'уёбищ', 'уебищ', 'уёбок', 'уебок', 'ублюд',
  'шлюх', 'шлюш', 'мразь', 'мраз', 'ссанин',
];

const ROOTS_LAT = [
  'huy', 'hui', 'pizd', 'pizdec', 'ebal', 'ebat', 'eban', 'vyeb', 'zaeb', 'naeb',
  'blyad', 'blya', 'suka', 'suki', 'mudak', 'pidor', 'pidaras', 'gondon',
  'zalupa', 'drochit', 'govno', 'dolboeb', 'ublyud', 'mraz', 'shlyuh',
];

const ROOTS_EN = [/\bfuck/i, /\bshit\b/i, /\bbitch/i, /\bcunt/i, /\basshole/i, /\bmotherfuck/i];

function containsProfanity(text) {
  if (!text) return false;
  const raw = String(text);
  if (ROOTS_EN.some((re) => re.test(raw))) return true;

  const cyr = normalizeCyr(raw);
  if (ROOTS_CYR.some((r) => cyr.includes(r))) return true;

  const lat = normalizeLat(raw);
  if (ROOTS_LAT.some((r) => lat.includes(r))) return true;

  return false;
}

// Замена матерных слов на *** (защита вывода модели)
function cleanProfanity(text) {
  if (!text) return text;
  return String(text)
    .split(/(\s+)/)
    .map((tok) => (tok.trim() && containsProfanity(tok) ? '***' : tok))
    .join('');
}

module.exports = { containsProfanity, cleanProfanity };