/* ═══════════════════════════════════════════════
   ROUTER — lightweight express-like router
   Built on node:http, no external deps
   ═══════════════════════════════════════════════ */
'use strict';

const { randomUUID } = require('node:crypto');
const path = require('node:path');
const fs   = require('node:fs');
const db   = require('./db');
const auth = require('./auth');
const upload = require('./upload');

/* ── tiny response helper ── */
function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':  'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/* ── parse JSON body ── */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1e6) reject(new Error('Too large')); });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

/* ── CORS ── */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

/* ── param extractor ── */
function matchRoute(pattern, pathname) {
  const patParts = pattern.split('/');
  const urlParts = pathname.split('/');
  if (patParts.length !== urlParts.length) return null;
  const params = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

/* ══════════════════════════════════════
   SEED data
   ══════════════════════════════════════ */
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM people').get();
  if (count.c > 0) return;

  const people = [
    { id: 'ivanova-maria',    name: 'Иванова Мария Петровна',    born: '12.03.1918', died: '05.11.1987', city: 'Москва',          bio: 'Учительница русского языка и литературы. Воспитала троих детей и семерых внуков. Пережила войну, работала в эвакогоспитале.', burial: 'Ваганьковское кладбище, Москва', burial_query: 'Ваганьковское кладбище Москва' },
    { id: 'ivanov-nikolai',   name: 'Иванов Николай Семёнович',  born: '30.07.1915', died: '22.04.1978', city: 'Москва',          bio: 'Инженер-конструктор, участник Великой Отечественной войны. Прошёл от Москвы до Берлина.', burial: 'Ваганьковское кладбище, Москва', burial_query: 'Ваганьковское кладбище Москва' },
    { id: 'smirnova-anna',    name: 'Смирнова Анна Васильевна',  born: '08.09.1942', died: '14.02.2003', city: 'Санкт-Петербург', bio: 'Врач-педиатр, сорок лет проработала в детской поликлинике.', burial: 'Смоленское кладбище, Санкт-Петербург', burial_query: 'Смоленское кладбище Санкт-Петербург' },
    { id: 'smirnov-petr',     name: 'Смирнов Пётр Иванович',     born: '11.01.1940', died: '30.06.1999', city: 'Санкт-Петербург', bio: 'Судостроитель, работал на Балтийском заводе.', burial: 'Смоленское кладбище, Санкт-Петербург', burial_query: 'Смоленское кладбище Санкт-Петербург' },
    { id: 'kozlov-viktor',    name: 'Козлов Виктор Андреевич',   born: '25.12.1955', died: '18.08.2015', city: 'Казань',          bio: 'Архитектор, автор нескольких проектов жилых кварталов в Казани.', burial: 'Арское кладбище, Казань', burial_query: 'Арское кладбище Казань' },
    { id: 'kozlova-lyudmila', name: 'Козлова Людмила Фёдоровна', born: '03.06.1958', died: '01.03.2020', city: 'Казань',          bio: 'Преподаватель фортепиано в музыкальной школе.', burial: 'Арское кладбище, Казань', burial_query: 'Арское кладбище Казань' },
    { id: 'orlova-nina',      name: 'Орлова Нина Дмитриевна',    born: '17.11.1963', died: '09.09.2019', city: 'Новосибирск',    bio: 'Журналист, редактор областной газеты.', burial: 'Заельцовское кладбище, Новосибирск', burial_query: 'Заельцовское кладбище Новосибирск' },
    { id: 'orlov-sergey',     name: 'Орлов Сергей Алексеевич',   born: '22.04.1961', died: '14.12.2021', city: 'Новосибирск',    bio: 'Геолог, участник экспедиций по Сибири и Дальнему Востоку.', burial: 'Заельцовское кладбище, Новосибирск', burial_query: 'Заельцовское кладбище Новосибирск' },
    { id: 'popova-galina',    name: 'Попова Галина Юрьевна',     born: '05.02.1938', died: '27.07.1995', city: 'Екатеринбург',   bio: 'Швея высшей категории, работала на швейной фабрике.', burial: 'Широкореченское кладбище, Екатеринбург', burial_query: 'Широкореченское кладбище Екатеринбург' },
    { id: 'popov-andrey',     name: 'Попов Андрей Николаевич',   born: '14.08.1936', died: '11.05.1993', city: 'Екатеринбург',   bio: 'Металлург, сорок лет у доменной печи Уралмашзавода.', burial: 'Широкореченское кладбище, Екатеринбург', burial_query: 'Широкореченское кладбище Екатеринбург' },
    { id: 'fedorova-olga',    name: 'Фёдорова Ольга Сергеевна',  born: '29.10.1972', died: '03.01.2022', city: 'Ростов-на-Дону', bio: 'Художник-иллюстратор, иллюстрировала детские книги.', burial: 'Северное кладбище, Ростов-на-Дону', burial_query: 'Северное кладбище Ростов-на-Дону' },
    { id: 'fedorov-dmitry',   name: 'Фёдоров Дмитрий Иванович',  born: '07.03.1970', died: '16.11.2023', city: 'Ростов-на-Дону', bio: 'Преподаватель истории в университете, автор монографий о Юге России.', burial: 'Северное кладбище, Ростов-на-Дону', burial_query: 'Северное кладбище Ростов-на-Дону' },
    { id: 'morozova-tatiana', name: 'Морозова Татьяна Кузьминична', born: '21.06.1925', died: '30.04.1998', city: 'Воронеж',     bio: 'Ветеран труда, работала на хлебозаводе. Пережила оккупацию Воронежа.', burial: 'Юго-Западное кладбище, Воронеж', burial_query: 'Юго-Западное кладбище Воронеж' },
    { id: 'morozov-vasily',   name: 'Морозов Василий Петрович',  born: '10.09.1923', died: '22.08.1991', city: 'Воронеж',       bio: 'Фронтовик, сапёр. Прошёл всю войну, вернулся с контузией и наградами.', burial: 'Юго-Западное кладбище, Воронеж', burial_query: 'Юго-Западное кладбище Воронеж' },
    { id: 'zhukova-svetlana', name: 'Жукова Светлана Григорьевна', born: '15.01.1948', died: '08.06.2007', city: 'Самара',      bio: 'Библиотекарь, заведующая районной библиотекой.', burial: 'Городское кладбище, Самара', burial_query: 'Городское кладбище Самара' },
    { id: 'zhukov-igor',      name: 'Жуков Игорь Константинович', born: '09.07.1945', died: '25.02.2011', city: 'Самара',       bio: 'Инженер-электрик, работал на КуйбышевАзоте.', burial: 'Городское кладбище, Самара', burial_query: 'Городское кладбище Самара' },
    { id: 'lebedeva-zinaida', name: 'Лебедева Зинаида Михайловна', born: '02.05.1930', died: '17.12.2004', city: 'Уфа',        bio: 'Учительница начальных классов, отличник народного просвещения.', burial: 'Южное кладбище, Уфа', burial_query: 'Южное кладбище Уфа' },
    { id: 'lebedev-alexander',name: 'Лебедев Александр Фёдорович', born: '28.11.1928', died: '04.09.2001', city: 'Уфа',        bio: 'Нефтяник, работал на башкирских месторождениях с первых лет.', burial: 'Южное кладбище, Уфа', burial_query: 'Южное кладбище Уфа' },
  ];

  const insertPerson = db.prepare(`
    INSERT INTO people (id,name,born,died,city,bio,burial,burial_query)
    VALUES (?,?,?,?,?,?,?,?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, person_id, author, text) VALUES (?,?,?,?)
  `);

  const seedReviews = {
    'ivanova-maria':    [{ author: 'Екатерина, внучка', text: 'Бабушка умела слушать так, что любая беда казалась меньше.' }, { author: 'Сергей, сын', text: 'Мама научила меня, что главное — не чем ты владеешь, а кого ты любишь.' }],
    'ivanov-nikolai':   [{ author: 'Пётр, сын', text: 'Отец был человеком немногословным, но каждое его слово весило пуд.' }],
    'smirnova-anna':    [{ author: 'Ольга, дочь', text: 'Мама приходила домой после ночных дежурств и всё равно находила силы читать мне сказки.' }],
    'smirnov-petr':     [{ author: 'Дмитрий, сын', text: 'Папа мог починить всё на свете. Наш старый радиоприёмник играет до сих пор.' }],
    'kozlov-viktor':    [{ author: 'Людмила, жена', text: 'Мы прожили вместе тридцать пять лет. Витя всегда умел удивить.' }],
    'kozlova-lyudmila': [{ author: 'Марина, ученица', text: 'Людмила Фёдоровна научила меня не просто играть — чувствовать музыку.' }],
    'orlova-nina':      [{ author: 'Сергей, муж', text: 'Нина видела в людях хорошее даже там, где другие не замечали.' }],
    'orlov-sergey':     [{ author: 'Нина, жена', text: 'Серёжа возвращался из экспедиций пропахший костром и счастьем.' }],
    'fedorova-olga':    [{ author: 'Дмитрий, муж', text: 'Оля видела мир в красках, которых другие не замечают.' }],
    'lebedeva-zinaida': [{ author: 'Елена, ученица', text: 'Зинаида Михайловна научила меня читать. И любить чтение.' }],
  };

  db.exec('BEGIN');
  try {
    for (const p of people) {
      insertPerson.run(p.id, p.name, p.born, p.died, p.city, p.bio, p.burial, p.burial_query);
    }
    for (const [pid, revs] of Object.entries(seedReviews)) {
      for (const r of revs) {
        insertReview.run(randomUUID(), pid, r.author, r.text);
      }
    }
    db.exec('COMMIT');
  } catch(e) {
    db.exec('ROLLBACK');
    throw e;
  }
  console.log('✅ Database seeded with', people.length, 'people');
}

/* ══════════════════════════════════════
   ROUTE HANDLERS
   ══════════════════════════════════════ */

/* ── /api/auth/register ── */
async function registerHandler(req, res) {
  const body = await parseBody(req);
  const { name, email, password } = body;
  if (!name || !email || !password) return send(res, 400, { ok: false, error: 'name, email and password required' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return send(res, 409, { ok: false, error: 'Email already registered' });

  const id   = randomUUID();
  const hash = auth.hashPassword(password);
  db.prepare('INSERT INTO users (id,name,email,password) VALUES (?,?,?,?)').run(id, name, email, hash);

  const token = auth.signJWT({ id, name, email, role: 'member' });
  send(res, 201, { ok: true, token, user: { id, name, email, role: 'member' } });
}

/* ── /api/auth/login ── */
async function loginHandler(req, res) {
  const body = await parseBody(req);
  const { email, password } = body;
  if (!email || !password) return send(res, 400, { ok: false, error: 'email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return send(res, 401, { ok: false, error: 'Invalid credentials' });

  let valid = false;
  try { valid = auth.verifyPassword(password, user.password); } catch { valid = false; }
  if (!valid) return send(res, 401, { ok: false, error: 'Invalid credentials' });

  const token = auth.signJWT({ id: user.id, name: user.name, email: user.email, role: user.role });
  send(res, 200, { ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

/* ── /api/auth/me ── */
function meHandler(req, res) {
  send(res, 200, { ok: true, user: req.user });
}

/* ── GET /api/people ── */
function getPeople(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '9', 10)));
  const q     = (url.searchParams.get('q') || '').trim();
  const city  = (url.searchParams.get('city') || '').trim();
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const args = [];
  if (q)    { where += ' AND (name LIKE ? OR bio LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  if (city) { where += ' AND city = ?'; args.push(city); }

  const total   = db.prepare(`SELECT COUNT(*) as c FROM people ${where}`).get(...args).c;
  const rows    = db.prepare(`SELECT id,name,born,died,city,photo FROM people ${where} ORDER BY born ASC LIMIT ? OFFSET ?`).all(...args, limit, offset);

  send(res, 200, { ok: true, data: rows, total, page, limit, pages: Math.ceil(total / limit) });
}

/* ── GET /api/people/:id ── */
function getOnePerson(req, res, params) {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(params.id);
  if (!person) return send(res, 404, { ok: false, error: 'Not found' });
  const reviews = db.prepare('SELECT id,author,text,created_at FROM reviews WHERE person_id = ? ORDER BY created_at DESC').all(params.id);
  send(res, 200, { ok: true, data: { ...person, reviews } });
}

/* ── POST /api/people ── */
async function createPerson(req, res) {
  const body = await parseBody(req);
  const { name, born, died = '', city = '', bio = '', burial = '', burial_query = '' } = body;
  if (!name || !born) return send(res, 400, { ok: false, error: 'name and born required' });

  const id = body.id || name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/-+/g, '-').slice(0, 60);
  const safeId = id + '-' + Date.now().toString(36);

  db.prepare(`INSERT INTO people (id,name,born,died,city,bio,burial,burial_query) VALUES (?,?,?,?,?,?,?,?)`)
    .run(safeId, name, born, died, city, bio, burial, burial_query);

  const row = db.prepare('SELECT * FROM people WHERE id = ?').get(safeId);
  send(res, 201, { ok: true, data: row });
}

/* ── PUT /api/people/:id ── */
async function updatePerson(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.id);
  if (!person) return send(res, 404, { ok: false, error: 'Not found' });

  const body = await parseBody(req);
  const fields = ['name','born','died','city','bio','burial','burial_query'];
  const updates = fields.filter(f => body[f] !== undefined);
  if (!updates.length) return send(res, 400, { ok: false, error: 'Nothing to update' });

  const set = updates.map(f => `${f} = ?`).join(', ');
  const vals = updates.map(f => body[f]);
  db.prepare(`UPDATE people SET ${set}, updated_at = datetime('now') WHERE id = ?`).run(...vals, params.id);

  const row = db.prepare('SELECT * FROM people WHERE id = ?').get(params.id);
  send(res, 200, { ok: true, data: row });
}

/* ── DELETE /api/people/:id ── */
function deletePerson(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.id);
  if (!person) return send(res, 404, { ok: false, error: 'Not found' });
  db.prepare('DELETE FROM people WHERE id = ?').run(params.id);
  send(res, 200, { ok: true });
}

/* ── GET /api/reviews/:personId ── */
function getReviews(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.personId);
  if (!person) return send(res, 404, { ok: false, error: 'Person not found' });
  const rows = db.prepare('SELECT id,author,text,created_at FROM reviews WHERE person_id = ? ORDER BY created_at DESC').all(params.personId);
  send(res, 200, { ok: true, data: rows });
}

/* ── POST /api/reviews/:personId ── */
async function createReview(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.personId);
  if (!person) return send(res, 404, { ok: false, error: 'Person not found' });

  const body = await parseBody(req);
  const { author, text } = body;
  if (!author || !text) return send(res, 400, { ok: false, error: 'author and text required' });

  const id = randomUUID();
  db.prepare('INSERT INTO reviews (id,person_id,author,text) VALUES (?,?,?,?)').run(id, params.personId, author.slice(0,120), text.slice(0,2000));
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  send(res, 201, { ok: true, data: row });
}

/* ── DELETE /api/reviews/:id ── */
function deleteReview(req, res, params) {
  const row = db.prepare('SELECT id FROM reviews WHERE id = ?').get(params.id);
  if (!row) return send(res, 404, { ok: false, error: 'Not found' });
  db.prepare('DELETE FROM reviews WHERE id = ?').run(params.id);
  send(res, 200, { ok: true });
}

/* ── GET /api/candles ── */
function getCandles(req, res) {
  const row = db.prepare('SELECT count FROM candles WHERE id = 1').get();
  send(res, 200, { ok: true, count: row.count });
}

/* ── POST /api/candles/light ── */
function lightCandle(req, res) {
  db.prepare('UPDATE candles SET count = count + 1 WHERE id = 1').run();
  const row = db.prepare('SELECT count FROM candles WHERE id = 1').get();
  send(res, 200, { ok: true, count: row.count });
}

/* ── POST /api/profiles — создание нового профиля через сайт ── */
async function createProfileFromSite(req, res) {
  const botDb = getBotDb();
  if (!botDb) {
    return send(res, 500, { ok: false, error: 'Bot database not available' });
  }

  const body = await parseBody(req);
  const fullName = (body.full_name || body.name || '').toString().trim().slice(0, 200);
  const dates = (body.dates || '').toString().trim().slice(0, 100);
  const mainText = (body.main_text || body.bio || '').toString().trim().slice(0, 1000);
  const mainPhoto = (body.main_photo_url || body.photo || '').toString().trim();

  // Для создания с сайта допускаем пустые поля — пользователь заполнит в редакторе
  const safeName = fullName || '';
  const safeDates = dates || '';

  const profileId = randomUUID();

  try {
    botDb.exec('BEGIN');

    // Создаём или находим "сайтового" пользователя (telegram_id = 'site_user')
    let siteUser = botDb.prepare("SELECT id FROM users WHERE telegram_id = 'site_user'").get();
    if (!siteUser) {
      botDb.prepare("INSERT INTO users (telegram_id) VALUES ('site_user')").run();
      siteUser = botDb.prepare("SELECT id FROM users WHERE telegram_id = 'site_user'").get();
    }

    botDb.prepare(`
      INSERT INTO profiles (id, owner_id, full_name, dates, main_text, main_photo_url, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(profileId, siteUser.id, safeName, safeDates, mainText, mainPhoto || null);

    botDb.exec('COMMIT');

    send(res, 201, { ok: true, data: { id: profileId, name: fullName, dates } });
  } catch (err) {
    try { botDb.exec('ROLLBACK'); } catch (_) {}
    console.error('❌ Create profile error:', err);
    send(res, 500, { ok: false, error: 'Failed to create profile: ' + err.message });
  }
}

/* ── GET /api/profiles — список публичных профилей из бот-БД ── */
function getProfilesList(req, res) {
  const botDb = getBotDb();
  if (!botDb) {
    return send(res, 200, { ok: true, data: [] });
  }

  try {
    const profiles = botDb.prepare(
      'SELECT id, full_name, dates, main_text, main_photo_url FROM profiles WHERE is_public = 1 ORDER BY created_at DESC'
    ).all();

    const data = profiles.map(p => {
      const datesParts = (p.dates || '').split(/[—–\-]/).map(s => s.trim());
      return {
        id: p.id,
        name: p.full_name,
        born: datesParts[0] || p.dates,
        died: datesParts[1] || '',
        city: '',
        photo: p.main_photo_url || '',
        bio: p.main_text || '',
      };
    });

    send(res, 200, { ok: true, data });
  } catch (err) {
    send(res, 200, { ok: true, data: [] });
  }
}

/* ── GET /api/profiles/:id — читает из бот-БД ── */
let _botDb = null;
function getBotDb() {
  const botDbPath = path.join(__dirname, '..', 'bot', 'data', 'bot.db');
  if (!fs.existsSync(botDbPath)) return null;
  if (!_botDb) {
    const { DatabaseSync } = require('node:sqlite');
    _botDb = new DatabaseSync(botDbPath);
    // Миграция: добавляем колонку gender если её нет
    try { _botDb.exec("ALTER TABLE profiles ADD COLUMN gender TEXT NOT NULL DEFAULT ''"); } catch (_) {}
    // Миграция: добавляем колонку city если её нет
    try { _botDb.exec("ALTER TABLE profiles ADD COLUMN city TEXT NOT NULL DEFAULT ''"); } catch (_) {}
  }
  return _botDb;
}

function getProfileFromBot(req, res, params) {
  const profileId = params.id;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    return send(res, 400, { ok: false, error: 'Invalid profile ID' });
  }

  const botDb = getBotDb();
  if (!botDb) {
    return send(res, 404, { ok: false, error: 'Bot database not found' });
  }

  try {
    const profile = botDb.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
    if (!profile) {
      return send(res, 404, { ok: false, error: 'Profile not found' });
    }

    // Приватная страница — не отдаём в публичном API
    if (profile.is_public === 0) {
      // TODO: проверять авторизацию владельца. Пока отдаём по прямой ссылке.
    }

    const blocks = botDb.prepare(
      'SELECT * FROM content_blocks WHERE profile_id = ? ORDER BY block_order ASC'
    ).all(profileId);

    const memories = botDb.prepare(
      'SELECT * FROM guest_memories WHERE profile_id = ? AND is_approved = 1 ORDER BY created_at DESC'
    ).all(profileId);

    let quotes = [];
    try {
      quotes = botDb.prepare(
        'SELECT text, after_block FROM quotes WHERE profile_id = ? ORDER BY id ASC'
      ).all(profileId);
    } catch (_) {}

    const BLOCK_KEYS = ['childhood', 'education', 'career', 'family', 'hobbies', 'legacy'];
    const BLOCK_TITLES = ['Детство и юность', 'Образование', 'Профессиональный путь', 'Семья', 'Хобби и увлечения', 'Наследие'];

    const sections = {};
    blocks.forEach((b) => {
      const idx = b.block_order - 1;

      // Проверяем кастомный блок (формат "CUSTOM_TITLE:Название::текст")
      if (b.text && b.text.startsWith('CUSTOM_TITLE:')) {
        const rest = b.text.slice('CUSTOM_TITLE:'.length);
        const sepIdx = rest.indexOf('::');
        const title = sepIdx >= 0 ? rest.slice(0, sepIdx) : 'Без названия';
        const text = sepIdx >= 0 ? rest.slice(sepIdx + 2) : rest;
        const key = 'custom_' + b.block_order;
        sections[key] = { title, text, image: b.image_url || '' };
      } else {
        const key = BLOCK_KEYS[idx] || ('block_' + b.block_order);
        if (b.text) {
          sections[key] = {
            title: BLOCK_TITLES[idx] || '',
            text: b.text,
            image: b.image_url || '',
          };
        }
      }
    });

    const datesParts = (profile.dates || '').split(/[—–\-]/).map(s => s.trim());

    // Фото галереи
    let galleryPhotos = [];
    try {
      galleryPhotos = botDb.prepare(
        'SELECT image_url, caption FROM gallery_photos WHERE profile_id = ? ORDER BY photo_order ASC'
      ).all(profileId);
    } catch (_) {}

    // Также собираем image_url из content_blocks как fallback (старые страницы)
    const blockImages = blocks.filter(b => b.image_url).map(b => b.image_url);
    const allGallery = [
      ...galleryPhotos.map(p => ({ src: p.image_url, caption: p.caption || '' })),
      ...blockImages.filter(url => !galleryPhotos.some(p => p.image_url === url)).map(url => ({ src: url, caption: '' })),
    ];

    send(res, 200, {
      ok: true,
      data: {
        id: profile.id,
        name: profile.full_name,
        born: datesParts[0] || profile.dates,
        died: datesParts[1] || '',
        city: profile.city || '',
        bio: profile.main_text,
        photo: profile.main_photo_url || '',
        gender: profile.gender || '',
        sections,
        quotes: quotes.map(q => ({ text: q.text, after: q.after_block })),
        media: allGallery,
        reviews: memories.map(m => ({
          author: m.author_name,
          text: m.memory_text,
        })),
        burial: '',
        burial_query: '',
      }
    });
  } catch (err) {
    console.error('❌ Profile API error:', err);
    send(res, 500, { ok: false, error: 'Database error: ' + err.message });
  }
}

/* ── POST /api/upload-photo — загрузка фото с сайта ── */
async function handlePhotoUpload(req, res) {
  try {
    const filename = await upload.parseUpload(req, 'site');
    send(res, 200, { ok: true, url: '/uploads/' + filename });
  } catch (err) {
    send(res, 400, { ok: false, error: err.message });
  }
}

/* ── PUT /api/profiles/:id — обновление профиля в бот-БД ── */
async function updateProfileInBot(req, res, params) {
  const profileId = params.id;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    return send(res, 400, { ok: false, error: 'Invalid profile ID' });
  }

  const botDb = getBotDb();
  if (!botDb) {
    return send(res, 404, { ok: false, error: 'Bot database not found' });
  }

  const body = await parseBody(req);

  try {
    const profile = botDb.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
    if (!profile) {
      return send(res, 404, { ok: false, error: 'Profile not found' });
    }

    // Обновляем основные поля профиля
    const fullName = (body.name || body.full_name || profile.full_name).toString().slice(0, 200);
    const dates = (body.dates || profile.dates).toString().slice(0, 100);
    const mainText = (body.bio || body.main_text || profile.main_text).toString().slice(0, 1000);
    const mainPhoto = body.photo || body.main_photo_url || profile.main_photo_url;
    const gender = (body.gender !== undefined ? body.gender : (profile.gender || '')).toString().slice(0, 10);
    const city = (body.city !== undefined ? body.city : (profile.city || '')).toString().slice(0, 100);

    botDb.exec('BEGIN');

    // 1. Обновляем профиль
    botDb.prepare(`
      UPDATE profiles SET full_name = ?, dates = ?, main_text = ?, main_photo_url = ?, gender = ?, city = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(fullName, dates, mainText, mainPhoto || null, gender, city, profileId);

    // 2. Обновляем блоки (удаляем старые, вставляем новые)
    // Поддерживаем два формата: sections (фиксированная схема) и orderedBlocks (произвольный порядок)
    if (Array.isArray(body.orderedBlocks) && body.orderedBlocks.length) {
      botDb.prepare('DELETE FROM content_blocks WHERE profile_id = ?').run(profileId);

      const insertBlock = botDb.prepare(
        'INSERT INTO content_blocks (profile_id, text, image_url, block_order) VALUES (?, ?, ?, ?)'
      );

      body.orderedBlocks.forEach((block, i) => {
        if (block && block.text && block.text.trim()) {
          // Для кастомных блоков сохраняем title в начале текста через разделитель
          let text = block.text.trim().slice(0, 1000);
          let imageUrl = block.image || null;

          // Если есть кастомный title — сохраняем как "TITLE::text"
          if (block.key === 'custom' && block.title) {
            text = `CUSTOM_TITLE:${block.title.slice(0, 100)}::${text}`;
          }

          insertBlock.run(profileId, text, imageUrl, i + 1);
        }
      });
    } else if (body.sections && typeof body.sections === 'object') {
      botDb.prepare('DELETE FROM content_blocks WHERE profile_id = ?').run(profileId);

      const BLOCK_KEYS = ['childhood', 'education', 'career', 'family', 'hobbies', 'legacy'];
      const insertBlock = botDb.prepare(
        'INSERT INTO content_blocks (profile_id, text, image_url, block_order) VALUES (?, ?, ?, ?)'
      );

      BLOCK_KEYS.forEach((key, i) => {
        const sec = body.sections[key];
        if (sec && sec.text && sec.text.trim()) {
          insertBlock.run(profileId, sec.text.trim().slice(0, 1000), sec.image || null, i + 1);
        }
      });
    }

    // 3. Обновляем цитаты (удаляем старые, вставляем новые)
    if (Array.isArray(body.quotes)) {
      botDb.prepare('DELETE FROM quotes WHERE profile_id = ?').run(profileId);

      const insertQuote = botDb.prepare(
        'INSERT INTO quotes (profile_id, text, after_block) VALUES (?, ?, ?)'
      );

      body.quotes.forEach(q => {
        if (q && q.text && q.text.trim()) {
          insertQuote.run(profileId, q.text.trim().slice(0, 300), q.after || 'career');
        }
      });
    }

    // 4. Добавляем новые фото в галерею (не удаляем старые, только добавляем)
    if (Array.isArray(body.newGalleryPhotos) && body.newGalleryPhotos.length) {
      // Проверяем лимит 10
      let currentCount = 0;
      try {
        currentCount = botDb.prepare('SELECT COUNT(*) as c FROM gallery_photos WHERE profile_id = ?').get(profileId).c;
      } catch (_) { currentCount = 0; }

      const remaining = 10 - currentCount;
      const toAdd = body.newGalleryPhotos.slice(0, remaining);

      if (toAdd.length) {
        const insertPhoto = botDb.prepare(
          'INSERT INTO gallery_photos (profile_id, image_url, photo_order) VALUES (?, ?, ?)'
        );
        toAdd.forEach((url, i) => {
          insertPhoto.run(profileId, url, currentCount + i + 1);
        });
      }
    }

    botDb.exec('COMMIT');

    send(res, 200, { ok: true, message: 'Profile updated' });
  } catch (err) {
    try { botDb.exec('ROLLBACK'); } catch (_) {}
    console.error('❌ Profile update error:', err);
    send(res, 500, { ok: false, error: 'Update failed: ' + err.message });
  }
}

/* ── GET /api/stats ── */
function getStats(req, res) {
  const people  = db.prepare('SELECT COUNT(*) as c FROM people').get().c;
  const reviews = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
  const candles = db.prepare('SELECT count FROM candles WHERE id = 1').get().count;
  const cities  = db.prepare("SELECT COUNT(DISTINCT city) as c FROM people WHERE city != ''").get().c;
  send(res, 200, { ok: true, data: { people, reviews, candles, cities } });
}

/* ── POST /api/people/:id/verify-code — проверяет 8-значный пароль доступа ── */
async function verifyCode(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.id);
  if (!person) return send(res, 404, { ok: false, error: 'Person not found' });

  const body = await parseBody(req);
  const code = (body.code || '').toString().trim();

  if (!code || code.length !== 8) {
    return send(res, 400, { ok: false, error: 'Введите 8-значный код доступа' });
  }

  const row = db.prepare('SELECT code FROM person_codes WHERE person_id = ?').get(params.id);

  /* Если кода ещё нет — по умолчанию принимаем специальный код MEMORYOK (демо-режим) */
  if (!row) {
    const ok = code === 'MEMORYOK';
    return send(res, ok ? 200 : 403, {
      ok,
      error: ok ? undefined : 'Неверный код. Обратитесь к администратору за кодом доступа.',
    });
  }

  const ok = row.code === code;
  send(res, ok ? 200 : 403, {
    ok,
    error: ok ? undefined : 'Неверный код. Обратитесь к администратору за кодом доступа.',
  });
}

/* ── POST /api/people/:id/set-code — устанавливает/меняет пароль (только admin) ── */
async function setCode(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.id);
  if (!person) return send(res, 404, { ok: false, error: 'Person not found' });

  const body = await parseBody(req);
  const code = (body.code || '').toString().trim();

  if (!code || code.length < 4 || code.length > 16) {
    return send(res, 400, { ok: false, error: 'Код должен быть от 4 до 16 символов' });
  }

  const exists = db.prepare('SELECT person_id FROM person_codes WHERE person_id = ?').get(params.id);
  if (exists) {
    db.prepare('UPDATE person_codes SET code = ? WHERE person_id = ?').run(code, params.id);
  } else {
    db.prepare('INSERT INTO person_codes (person_id, code) VALUES (?, ?)').run(params.id, code);
  }

  send(res, 200, { ok: true });
}

/* ── POST /api/people/:id/photo ── */
async function uploadPhoto(req, res, params) {
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(params.id);
  if (!person) return send(res, 404, { ok: false, error: 'Person not found' });

  try {
    const filename = await upload.parseUpload(req, params.id);
    db.prepare("UPDATE people SET photo = ?, updated_at = datetime('now') WHERE id = ?").run(`/uploads/${filename}`, params.id);
    send(res, 200, { ok: true, photo: `/uploads/${filename}` });
  } catch (e) {
    send(res, 400, { ok: false, error: e.message });
  }
}

/* ══════════════════════════════════════
   FAMILY TREE
   ══════════════════════════════════════ */

/* ── GET /api/family-nodes — все узлы дерева ── */
function getFamilyTrees(req, res) {
  const rows = db.prepare("SELECT DISTINCT tree_id FROM family_nodes ORDER BY tree_id").all();
  const trees = rows.map(r => r.tree_id);
  if (!trees.includes('default')) trees.unshift('default');
  send(res, 200, { ok: true, data: trees });
}

/* ── GET /api/family-clans ── */
function getFamilyClans(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const treeId = (url.searchParams.get('treeId') || 'default').toString().slice(0, 50);
  const rows = db.prepare('SELECT * FROM family_clans WHERE tree_id = ? ORDER BY created_at ASC').all(treeId);
  send(res, 200, { ok: true, data: rows });
}

/* ── POST /api/family-clans ── */
async function createFamilyClan(req, res) {
  const body = await parseBody(req);
  const id = (body.id || '').toString().trim().toLowerCase().replace(/[^a-zа-яё0-9]/gi, '-').slice(0, 30) || randomUUID().slice(0, 8);
  const treeId = (body.treeId || 'default').toString().slice(0, 50);
  const name = (body.name || '').toString().trim().slice(0, 100);
  const color = (body.color || '#c8a84b').toString().slice(0, 20);
  const icon = (body.icon || '✦').toString().slice(0, 4);
  const description = (body.description || '').toString().trim().slice(0, 200);

  if (!name) return send(res, 400, { ok: false, error: 'Название рода обязательно' });

  try {
    db.prepare('INSERT INTO family_clans (id, tree_id, name, color, icon, description) VALUES (?,?,?,?,?,?)').run(id, treeId, name, color, icon, description);
    send(res, 201, { ok: true, data: { id, treeId, name, color, icon, description } });
  } catch (e) {
    send(res, 400, { ok: false, error: 'Род с таким ID уже существует' });
  }
}

/* ── DELETE /api/family-clans/:id ── */
function deleteFamilyClan(req, res, params) {
  const clan = db.prepare('SELECT * FROM family_clans WHERE id = ?').get(params.id);
  if (!clan) return send(res, 404, { ok: false, error: 'Clan not found' });
  db.prepare('DELETE FROM family_clans WHERE id = ?').run(params.id);
  send(res, 200, { ok: true });
}

function getFamilyNodes(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const treeId = (url.searchParams.get('treeId') || 'default').toString().slice(0, 50);

  const rows = db.prepare(
    'SELECT * FROM family_nodes WHERE tree_id = ? ORDER BY generation ASC, gen_order ASC'
  ).all(treeId);

  const nodes = rows.map(r => ({
    id: r.id,
    treeId: r.tree_id,
    fullName: r.full_name,
    years: r.years,
    clanId: r.clan_id,
    ageClass: r.age_class,
    generation: r.generation,
    genOrder: r.gen_order,
    spouseId: r.spouse_id || null,
    parentIds: (() => { try { return JSON.parse(r.parent_ids || '[]'); } catch { return []; } })(),
    linkedProfileId: r.linked_profile_id || null,
    photoUrl: r.photo_url || '',
    description: r.description || '',
  }));

  send(res, 200, { ok: true, data: nodes });
}

/* ── POST /api/family-nodes — создать узел ── */
async function createFamilyNode(req, res) {
  const body = await parseBody(req);
  const id = randomUUID();
  const treeId = (body.treeId || 'default').toString().slice(0, 50);
  const fullName = (body.fullName || '').toString().trim().slice(0, 200);
  const years = (body.years || '').toString().trim().slice(0, 50);
  const clanId = (body.clanId || 'ivanov').toString().slice(0, 30);
  const ageClass = (body.ageClass === 'old' ? 'old' : 'young');
  const generation = parseInt(body.generation, 10) || 0;
  const genOrder = parseInt(body.genOrder, 10) || 0;
  const spouseId = body.spouseId || null;
  const parentIds = Array.isArray(body.parentIds) ? JSON.stringify(body.parentIds.slice(0, 4)) : '[]';
  const linkedProfileId = body.linkedProfileId || null;
  const photoUrl = (body.photoUrl || '').toString().slice(0, 500);
  const description = (body.description || '').toString().trim().slice(0, 300);

  db.prepare(`
    INSERT INTO family_nodes (id, tree_id, full_name, years, clan_id, age_class, generation, gen_order, spouse_id, parent_ids, linked_profile_id, photo_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, treeId, fullName, years, clanId, ageClass, generation, genOrder, spouseId, parentIds, linkedProfileId, photoUrl, description);

  // Если указан spouseId — обновляем встречную ссылку
  if (spouseId) {
    db.prepare("UPDATE family_nodes SET spouse_id = ? WHERE id = ?").run(id, spouseId);
  }

  const row = db.prepare('SELECT * FROM family_nodes WHERE id = ?').get(id);
  send(res, 201, { ok: true, data: row });
}

/* ── PUT /api/family-nodes/:id — обновить узел ── */
async function updateFamilyNode(req, res, params) {
  const node = db.prepare('SELECT * FROM family_nodes WHERE id = ?').get(params.id);
  if (!node) return send(res, 404, { ok: false, error: 'Node not found' });

  const body = await parseBody(req);
  const fields = [];
  const vals = [];

  if (body.fullName !== undefined)        { fields.push('full_name = ?');         vals.push(body.fullName.toString().slice(0, 200)); }
  if (body.years !== undefined)           { fields.push('years = ?');             vals.push(body.years.toString().slice(0, 50)); }
  if (body.clanId !== undefined)          { fields.push('clan_id = ?');           vals.push(body.clanId.toString().slice(0, 30)); }
  if (body.ageClass !== undefined)        { fields.push('age_class = ?');         vals.push(body.ageClass === 'old' ? 'old' : 'young'); }
  if (body.generation !== undefined)      { fields.push('generation = ?');        vals.push(parseInt(body.generation, 10) || 0); }
  if (body.genOrder !== undefined)        { fields.push('gen_order = ?');         vals.push(parseInt(body.genOrder, 10) || 0); }
  if (body.spouseId !== undefined)        { fields.push('spouse_id = ?');         vals.push(body.spouseId || null); }
  if (body.parentIds !== undefined)       { fields.push('parent_ids = ?');        vals.push(Array.isArray(body.parentIds) ? JSON.stringify(body.parentIds.slice(0, 4)) : '[]'); }
  if (body.linkedProfileId !== undefined) { fields.push('linked_profile_id = ?'); vals.push(body.linkedProfileId || null); }
  if (body.photoUrl !== undefined)        { fields.push('photo_url = ?');         vals.push(body.photoUrl.toString().slice(0, 500)); }
  if (body.description !== undefined)     { fields.push('description = ?');       vals.push(body.description.toString().slice(0, 300)); }

  if (!fields.length) return send(res, 400, { ok: false, error: 'Nothing to update' });

  fields.push("updated_at = datetime('now')");
  db.prepare(`UPDATE family_nodes SET ${fields.join(', ')} WHERE id = ?`).run(...vals, params.id);

  const row = db.prepare('SELECT * FROM family_nodes WHERE id = ?').get(params.id);
  send(res, 200, { ok: true, data: row });
}

/* ── DELETE /api/family-nodes/:id ── */
function deleteFamilyNode(req, res, params) {
  const node = db.prepare('SELECT * FROM family_nodes WHERE id = ?').get(params.id);
  if (!node) return send(res, 404, { ok: false, error: 'Node not found' });

  // Если у узла есть супруг — очищаем встречную ссылку
  if (node.spouse_id) {
    db.prepare("UPDATE family_nodes SET spouse_id = NULL WHERE id = ?").run(node.spouse_id);
  }
  // Очищаем parent_ids у детей
  const children = db.prepare("SELECT id, parent_ids FROM family_nodes WHERE parent_ids LIKE ?").all(`%${params.id}%`);
  children.forEach(c => {
    try {
      const parents = JSON.parse(c.parent_ids || '[]').filter(p => p !== params.id);
      db.prepare("UPDATE family_nodes SET parent_ids = ? WHERE id = ?").run(JSON.stringify(parents), c.id);
    } catch (_) {}
  });

  db.prepare('DELETE FROM family_nodes WHERE id = ?').run(params.id);
  send(res, 200, { ok: true });
}

/* ══════════════════════════════════════
   TIMELINE EVENTS
   ══════════════════════════════════════ */

const historyEvents = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'history.json'), 'utf8')); }
  catch { return []; }
})();

function getTimelineEvents(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const treeId = (url.searchParams.get('treeId') || 'default').toString().slice(0, 50);
  const filterNodeId = url.searchParams.get('nodeId') || null;
  const filterProfileId = url.searchParams.get('profileId') || null;

  let events = [];

  // 1. Auto birth/death from family_nodes
  const nodes = db.prepare('SELECT id, full_name, years, clan_id FROM family_nodes WHERE tree_id = ?').all(treeId);
  const linkedNodeIds = new Set();

  nodes.forEach(n => {
    if (n.linked_profile_id) linkedNodeIds.add(n.linked_profile_id);
    const m = (n.years || '').match(/^\s*(\d{4})\s*[–—\-]\s*(\d{4})?\s*$/);
    if (!m) return;
    const isFemale = /[аяь]$/i.test((n.full_name || '').trim());
    if (m[1]) events.push({ id: 'birth:' + n.id, year: +m[1], type: 'birth', title: isFemale ? 'Родилась' : 'Родился', subtitle: n.full_name, icon: '✿', nodeId: n.id, clanId: n.clan_id, treeId });
    if (m[2]) events.push({ id: 'death:' + n.id, year: +m[2], type: 'death', title: isFemale ? 'Ушла' : 'Ушёл', subtitle: n.full_name, icon: '✦', nodeId: n.id, clanId: n.clan_id, treeId });
  });

  // 2. History events
  historyEvents.forEach((h, i) => {
    events.push({ id: 'history:' + i, year: h.year, type: 'history', title: h.title, subtitle: h.subtitle || '', icon: h.icon || '', treeId });
  });

  // 3. Custom events from DB
  const custom = db.prepare('SELECT * FROM timeline_events WHERE tree_id = ? ORDER BY year ASC').all(treeId);
  custom.forEach(e => {
    const node = e.node_id ? nodes.find(n => n.id === e.node_id) : null;
    events.push({ id: e.id, year: e.year, month: e.month, day: e.day, type: e.type, title: e.title, subtitle: e.subtitle, city: e.city, icon: e.icon, nodeId: e.node_id || null, profileId: e.profile_id || null, clanId: node?.clan_id || null, treeId });
  });

  // Filters
  if (filterNodeId) events = events.filter(e => e.nodeId === filterNodeId);
  if (filterProfileId) events = events.filter(e => e.profileId === filterProfileId);

  // Sort
  events.sort((a, b) => a.year - b.year || (a.type === 'birth' ? -1 : 1));

  send(res, 200, { ok: true, data: events });
}

async function createTimelineEvent(req, res) {
  const body = await parseBody(req);
  const id = randomUUID();
  const treeId = (body.treeId || 'default').toString().slice(0, 50);
  const year = parseInt(body.year, 10);
  if (!year) return send(res, 400, { ok: false, error: 'year required' });
  const type = (body.type || 'custom').toString().slice(0, 20);
  if (['birth', 'death', 'history'].includes(type)) return send(res, 400, { ok: false, error: 'Reserved type' });
  const title = (body.title || '').toString().trim().slice(0, 200);
  if (!title) return send(res, 400, { ok: false, error: 'title required' });

  db.prepare('INSERT INTO timeline_events (id,tree_id,year,month,day,type,title,subtitle,city,icon,node_id,profile_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, treeId, year, body.month || null, body.day || null, type, title,
    (body.subtitle || '').toString().slice(0, 200),
    (body.city || '').toString().slice(0, 100),
    (body.icon || '★').toString().slice(0, 4),
    body.nodeId || null, body.profileId || null
  );
  const row = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id);
  send(res, 201, { ok: true, data: row });
}

async function updateTimelineEvent(req, res, params) {
  const ev = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(params.id);
  if (!ev) return send(res, 404, { ok: false, error: 'Not found' });
  const body = await parseBody(req);
  if (body.type && ['birth', 'death', 'history'].includes(body.type)) return send(res, 400, { ok: false, error: 'Reserved type' });

  const fields = []; const vals = [];
  if (body.year !== undefined) { fields.push('year=?'); vals.push(parseInt(body.year, 10)); }
  if (body.title !== undefined) { fields.push('title=?'); vals.push(body.title.toString().slice(0, 200)); }
  if (body.subtitle !== undefined) { fields.push('subtitle=?'); vals.push(body.subtitle.toString().slice(0, 200)); }
  if (body.city !== undefined) { fields.push('city=?'); vals.push(body.city.toString().slice(0, 100)); }
  if (body.icon !== undefined) { fields.push('icon=?'); vals.push(body.icon.toString().slice(0, 4)); }
  if (body.type !== undefined) { fields.push('type=?'); vals.push(body.type.toString().slice(0, 20)); }
  if (!fields.length) return send(res, 400, { ok: false, error: 'Nothing to update' });

  db.prepare(`UPDATE timeline_events SET ${fields.join(',')} WHERE id = ?`).run(...vals, params.id);
  send(res, 200, { ok: true });
}

function deleteTimelineEvent(req, res, params) {
  const ev = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(params.id);
  if (!ev) return send(res, 404, { ok: false, error: 'Not found' });
  if (!['custom', 'marriage', 'move'].includes(ev.type)) return send(res, 400, { ok: false, error: 'Cannot delete auto-generated events' });
  db.prepare('DELETE FROM timeline_events WHERE id = ?').run(params.id);
  send(res, 200, { ok: true });
}

/* ── GET /api/family-nodes/:id — один узел ── */
function getFamilyNodeById(req, res, params) {
  const node = db.prepare('SELECT * FROM family_nodes WHERE id = ?').get(params.id);
  if (!node) return send(res, 404, { ok: false, error: 'Node not found' });
  send(res, 200, { ok: true, data: node });
}

/* ══════════════════════════════════════
   MAIN DISPATCH
   ══════════════════════════════════════ */
async function dispatch(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url      = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const method   = req.method.toUpperCase();

  /* Auth check helper */
  function checkAuth() {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = require('./auth').verifyJWT(token);
    if (!payload) { send(res, 401, { ok: false, error: 'Unauthorized' }); return false; }
    req.user = payload;
    return true;
  }

  try {
    /* ── /api/auth ── */
    if (method === 'POST' && pathname === '/api/auth/register') return await registerHandler(req, res);
    if (method === 'POST' && pathname === '/api/auth/login')    return await loginHandler(req, res);
    if (method === 'GET'  && pathname === '/api/auth/me')       { if (!checkAuth()) return; return meHandler(req, res); }

    /* ── /api/stats ── */
    if (method === 'GET' && pathname === '/api/stats') return getStats(req, res);

    /* ── /api/candles ── */
    if (method === 'GET'  && pathname === '/api/candles')       return getCandles(req, res);
    if (method === 'POST' && pathname === '/api/candles/light') return lightCandle(req, res);

    /* ── /api/people ── */
    if (method === 'GET'  && pathname === '/api/people')        return getPeople(req, res);
    if (method === 'POST' && pathname === '/api/people')        { if (!checkAuth()) return; return await createPerson(req, res); }

    let p;

    /* ── /api/profiles — список публичных профилей из бот-БД ── */
    if (method === 'GET'  && pathname === '/api/profiles') return getProfilesList(req, res);
    if (method === 'POST' && pathname === '/api/profiles') return await createProfileFromSite(req, res);

    /* ── /api/profiles/:id — данные из бот-БД (UUID страницы) ── */
    if ((p = matchRoute('/api/profiles/:id', pathname))) {
      if (method === 'GET') return getProfileFromBot(req, res, p);
      if (method === 'PUT') return await updateProfileInBot(req, res, p);
    }

    /* ── POST /api/upload-photo — загрузка фото с сайта, конвертация в WebP ── */
    if (method === 'POST' && pathname === '/api/upload-photo') {
      return await handlePhotoUpload(req, res);
    }

    if ((p = matchRoute('/api/people/:id', pathname))) {
      if (method === 'GET')    return getOnePerson(req, res, p);
      if (method === 'PUT')    { if (!checkAuth()) return; return await updatePerson(req, res, p); }
      if (method === 'DELETE') { if (!checkAuth()) return; return deletePerson(req, res, p); }
    }

    /* ── /api/people/:id/photo ── */
    if ((p = matchRoute('/api/people/:id/photo', pathname))) {
      if (method === 'POST') { if (!checkAuth()) return; return await uploadPhoto(req, res, p); }
    }

    /* ── /api/people/:id/verify-code — публичный, без авторизации ── */
    if ((p = matchRoute('/api/people/:id/verify-code', pathname))) {
      if (method === 'POST') return await verifyCode(req, res, p);
    }

    /* ── /api/people/:id/set-code — только admin ── */
    if ((p = matchRoute('/api/people/:id/set-code', pathname))) {
      if (method === 'POST') { if (!checkAuth()) return; return await setCode(req, res, p); }
    }

    /* ── /api/reviews ── */
    if ((p = matchRoute('/api/reviews/:personId', pathname))) {
      if (method === 'GET')  return getReviews(req, res, p);
      if (method === 'POST') return await createReview(req, res, p);
    }
    if ((p = matchRoute('/api/reviews/delete/:id', pathname))) {
      if (method === 'DELETE') { if (!checkAuth()) return; return deleteReview(req, res, p); }
    }

    /* ── /api/family-nodes ── */
    if (method === 'GET'  && pathname === '/api/family-nodes') return getFamilyNodes(req, res);
    if (method === 'POST' && pathname === '/api/family-nodes') return await createFamilyNode(req, res);
    if (method === 'GET'  && pathname === '/api/family-trees') return getFamilyTrees(req, res);
    if (method === 'GET'  && pathname === '/api/family-clans') return getFamilyClans(req, res);
    if (method === 'POST' && pathname === '/api/family-clans') return await createFamilyClan(req, res);

    if ((p = matchRoute('/api/family-clans/:id', pathname))) {
      if (method === 'DELETE') return deleteFamilyClan(req, res, p);
    }

    if ((p = matchRoute('/api/family-nodes/:id', pathname))) {
      if (method === 'GET')    return getFamilyNodeById(req, res, p);
      if (method === 'PUT')    return await updateFamilyNode(req, res, p);
      if (method === 'DELETE') return deleteFamilyNode(req, res, p);
    }

    /* ── /api/timeline-events ── */
    if (method === 'GET'  && pathname === '/api/timeline-events') return getTimelineEvents(req, res);
    if (method === 'POST' && pathname === '/api/timeline-events') return await createTimelineEvent(req, res);

    if ((p = matchRoute('/api/timeline-events/:id', pathname))) {
      if (method === 'PUT')    return await updateTimelineEvent(req, res, p);
      if (method === 'DELETE') return deleteTimelineEvent(req, res, p);
    }

    /* ── 404 ── */
    send(res, 404, { ok: false, error: `Cannot ${method} ${pathname}` });

  } catch (err) {
    console.error('❌', err);
    send(res, 500, { ok: false, error: 'Internal server error' });
  }
}

module.exports = { dispatch, seedIfEmpty, seedFamilyDefaultIfEmpty };

/* ══════════════════════════════════════
   SEED DEFAULT FAMILY TREE
   ══════════════════════════════════════ */
function seedFamilyDefaultIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) as c FROM family_nodes WHERE tree_id = 'default'").get();
  if (count.c > 0) return;

  const clans = [
    { id: 'ivanov', name: 'Род Ивановых', color: '#c8a84b', icon: '⚔', description: 'Потомственные инженеры и военные' },
    { id: 'smirnov', name: 'Род Смирновых', color: '#7ec8b4', icon: '⚕', description: 'Врачи и учёные' },
    { id: 'kozlov', name: 'Род Козловых', color: '#c87e7e', icon: '✦', description: 'Архитекторы и строители' },
  ];

  const nodes = [
    { id:'g0p0', name:'Иванов Николай', years:'1880–1951', spouse:'g0p1', clan:'ivanov', gen:0, order:0, age:'old' },
    { id:'g0p1', name:'Иванова Мария', years:'1883–1960', spouse:'g0p0', clan:'ivanov', gen:0, order:1, age:'old' },
    { id:'g0p2', name:'Смирнов Василий', years:'1878–1945', spouse:'g0p3', clan:'smirnov', gen:0, order:2, age:'old' },
    { id:'g0p3', name:'Смирнова Анна', years:'1882–1950', spouse:'g0p2', clan:'smirnov', gen:0, order:3, age:'old' },
    { id:'g1p0', name:'Иванов Пётр', years:'1910–1978', spouse:'g1p1', clan:'ivanov', gen:1, order:0, age:'old', parents:['g0p0','g0p1'] },
    { id:'g1p1', name:'Иванова Нина', years:'1914–1983', spouse:'g1p0', clan:'ivanov', gen:1, order:1, age:'old' },
    { id:'g1p2', name:'Смирнов Алексей', years:'1908–1970', spouse:'g1p3', clan:'smirnov', gen:1, order:2, age:'old', parents:['g0p2','g0p3'] },
    { id:'g1p3', name:'Смирнова Татьяна', years:'1912–1980', spouse:'g1p2', clan:'smirnov', gen:1, order:3, age:'old' },
    { id:'g2p0', name:'Иванов Сергей', years:'1945–2010', spouse:'g2p1', clan:'ivanov', gen:2, order:0, age:'young', parents:['g1p0','g1p1'] },
    { id:'g2p1', name:'Иванова Ольга', years:'1948–2015', spouse:'g2p0', clan:'ivanov', gen:2, order:1, age:'young' },
    { id:'g2p2', name:'Смирнов Дмитрий', years:'1943–2005', spouse:'g2p3', clan:'smirnov', gen:2, order:2, age:'young', parents:['g1p2','g1p3'] },
    { id:'g2p3', name:'Смирнова Елена', years:'1947–2018', spouse:'g2p2', clan:'smirnov', gen:2, order:3, age:'young' },
    { id:'g3p0', name:'Иванов Михаил', years:'1972–', spouse:'g3p3', clan:'ivanov', gen:3, order:0, age:'young', parents:['g2p0','g2p1'] },
    { id:'g3p1', name:'Иванова Юлия', years:'1975–', spouse:null, clan:'ivanov', gen:3, order:1, age:'young', parents:['g2p0','g2p1'] },
    { id:'g3p2', name:'Смирнова Ксения', years:'1970–', spouse:null, clan:'smirnov', gen:3, order:2, age:'young', parents:['g2p2','g2p3'] },
    { id:'g3p3', name:'Козлова Алина', years:'1974–', spouse:'g3p0', clan:'kozlov', gen:3, order:3, age:'young' },
  ];

  db.exec('BEGIN');
  try {
    const insertClan = db.prepare("INSERT OR IGNORE INTO family_clans (id, tree_id, name, color, icon, description) VALUES (?,?,?,?,?,?)");
    clans.forEach(c => insertClan.run(c.id, 'default', c.name, c.color, c.icon, c.description));

    const insertNode = db.prepare("INSERT INTO family_nodes (id, tree_id, full_name, years, clan_id, generation, gen_order, age_class, spouse_id, parent_ids) VALUES (?,?,?,?,?,?,?,?,?,?)");
    nodes.forEach(n => insertNode.run(n.id, 'default', n.name, n.years, n.clan, n.gen, n.order, n.age, n.spouse || null, JSON.stringify(n.parents || [])));

    db.exec('COMMIT');
    console.log('✅ Default family tree seeded (16 nodes, 3 clans)');
  } catch (e) {
    db.exec('ROLLBACK');
    console.error('❌ Seed family error:', e.message);
  }
}
