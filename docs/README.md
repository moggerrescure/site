Вот переписанный README на текущее состояние (v2 — то что мы реально собрали):

```markdown
# 🕯️ Память — Мемориальный сайт-летопись

Веб-платформа для создания мемориальных страниц: биографии, фотографии,
воспоминания близких, родословное древо и хроника рода.

---

## Стек

**Бэкенд**
- Node.js 24+, Express 4
- PostgreSQL 16 + Prisma ORM 6.19
- JWT (HS256), PBKDF2-SHA512
- Multer 2 (memory storage), Sharp (resize / WebP)
- Postgres FTS (`tsvector` + `to_tsquery('russian', ...)`)
- express-rate-limit

**Бот**
- Telegraf 4 (Telegram Bot API)
- Тот же Prisma Client, та же БД

**Фронт**
- Vanilla JavaScript (ES6+), без сборки
- CSS без препроцессоров
- Canvas (частицы), SVG (древо, лиана памяти)

**Инфра**
- Docker (Postgres контейнер `memory-pg` на порту 5433)


---

## Страницы сайта

| Страница       | Файл               | Описание                                                |
| -------------- | ------------------ | ------------------------------------------------------- |
| Главная        | `index.html`       | Статистика, последние добавленные                       |
| Каталог        | `memory.html`      | Поиск (FTS), фильтры, пагинация                         |
| Персональная   | `person.html`      | Hero + 6 контент-блоков + воспоминания + карта         |
| Древо семьи    | `family-tree.html` | SVG-древо с кланами и поколениями                       |
| Летопись      | `timeline.html`    | Хроника рода + исторические события                     |

---

## Модель данных (ключевое)

**Profile** (мемориальная страница):
- `slug` (unique) — для URL `/p/ivanova-mariya-petrovna`
- `fullName`, `birthDate`, `deathDate`, `burialPlace`, `bio`, `gender`
- `visibility` — `PUBLIC | UNLISTED | PASSWORD | PRIVATE`
- `accessHash` — PBKDF2 пароль для PASSWORD-страниц
- `ownerId` — владелец
- `deletedAt` — soft delete (см. ниже)
- `searchVector` — Postgres `tsvector` GENERATED (FTS)
- `familyNodeId` — привязка к узлу в дереве (1:1)
- relations: `blocks`, `galleryItems`, `guestMemories`, `candleLights`, `accessGrants`, `accessCodes`, `timelineEvents`

**ProfileAccess** — индивидуальный доступ (user, role: VIEWER/EDITOR/OWNER).
**ProfileAccessCode** — ротируемые одноразовые коды (`codeHash`, `expiresAt`, `revokedAt`, `onDelete: CASCADE`).
**FamilyTree / FamilyClan / FamilyNode / FamilyConnection** — генеалогия (PARENT, SPOUSE, ADOPTIVE, STEP).
**TimelineEvent** — события (BIRTH, DEATH, MARRIAGE, EDUCATION, CAREER, RELOCATION, AWARD, HISTORICAL, CUSTOM).
**GuestMemory** — модерируемые воспоминания (`isApproved`).
**CandleLight** — счётчик «зажжённых свечей» (по profile / user / fingerprint).
**Media** — единое хранилище файлов (image / audio / video).

Полная схема: `server/prisma/schema.prisma`.

---

## Аутентификация и роли

- **Регистрация / Login** — email + пароль (PBKDF2-SHA512), JWT в `Authorization: Bearer ...`
- **Telegram-юзеры** — бот создаёт `User` с email `tg_<telegram_id>@bot.local`
- **Роли**: `USER`, `EDITOR`, `ADMIN`
- **Middleware**: `requireAuth` (401 без токена), `optionalAuth` (читает токен если есть)

---

## Visibility model

| visibility | Кто видит                                                              |
| ---------- | ---------------------------------------------------------------------- |
| `PUBLIC`   | все, в sitemap, в каталоге                                              |
| `UNLISTED` | только по прямой ссылке, не в каталоге, не в sitemap                    |
| `PASSWORD` | по ссылке + ввод кода → получает access token                          |
| `PRIVATE`  | только owner и ADMIN                                                    |

Дополнительно: `ProfileAccess` грант (любой visibility) даёт указанному юзеру доступ.
`ProfileAccessCode` — одноразовые / по сроку коды, выпускаются owner-ом.

---

## Soft delete

- `Profile.deletedAt` — заполняется при `DELETE /api/profiles/:id` (по умолчанию soft)
- `?hard=true` (ADMIN-only) — физическое удаление через `prisma.profile.delete` → CASCADE на `ProfileAccessCode`, и т.д.
- Soft-deleted профили **не видны** в:
  - публичном list / detail
  - sitemap.xml
  - access services (404 на access-codes / access endpoints)
- Owner / ADMIN видит `deletedAt` через `GET /api/profiles/:idOrSlug` (200)
- `GET /api/profiles/trash` — список (ADMIN видит все, owner — свои)
- `POST /api/profiles/:idOrSlug/restore` — сбрасывает `deletedAt`

---

## Полнотекстовый поиск (FTS)

- `Profile.searchVector` — `tsvector GENERATED ALWAYS AS (to_tsvector('russian', fullName || ' ' || bio || ' ' || burialPlace))`
- Поиск: `to_tsquery('russian', 'иван:* & петров:*')` + `ts_rank_cd`
- Триггерится при `?q=...`. Без `q` — FAST PATH (Prisma findMany).
- Фильтры применяются на обеих путях: `city`, `bornYearFrom/To`, `diedYearFrom/To`, `gender`, `visibility`.

---

## Запуск (dev)

```

# 1. Postgres

docker run -d --name memory-pg \

-e POSTGRES_PASSWORD=password \

-e POSTGRES_DB=memorial_site \

-p 5433:5432 \

postgres:16

# 2. Сервер

cd server

cp .env.example .env   # JWT_SECRET, DATABASE_URL, SITE_URL

npm install

npx prisma generate

npx prisma migrate deploy

node index.js          # → http://localhost:3000

# 3. Бот (опционально, отдельный процесс)

cd ../bot

cp .env.example .env   # BOT_TOKEN, DATABASE_URL, SITE_URL

npm install

node index.js

```

Фронтенд раздаётся сервером автоматически (`/`, `/uploads`).

---

## Основные API эндпоинты

| Метод  | Путь                                              | Кто      | Описание                                  |
| ------ | ------------------------------------------------- | -------- | ----------------------------------------- |
| GET    | `/api/health`                                     | все      | uptime + db latency                       |
| POST   | `/api/auth/register`                              | все      | rate-limited                              |
| POST   | `/api/auth/login`                                 | все      | rate-limited                              |
| GET    | `/api/auth/me`                                    | auth     |                                           |
| GET    | `/api/profiles`                                   | optional | `q, city, bornYearFrom/To, diedYearFrom/To, gender, visibility, page, limit` |
| POST   | `/api/profiles`                                   | auth     |                                           |
| GET    | `/api/profiles/:idOrSlug`                         | optional | header `X-Profile-Access` для PASSWORD     |
| PUT    | `/api/profiles/:id`                               | auth     |                                           |
| DELETE | `/api/profiles/:id?hard=true`                     | auth     | hard только для ADMIN                     |
| GET    | `/api/profiles/trash`                             | auth     | ADMIN: все, USER: свои                     |
| POST   | `/api/profiles/:idOrSlug/restore`                 | auth     |                                           |
| GET    | `/api/profiles/:idOrSlug/access`                  | auth     | список грантов                            |
| POST   | `/api/profiles/:idOrSlug/access`                  | auth     | выдать доступ                             |
| PATCH  | `/api/profiles/:idOrSlug/access/:userId`          | auth     | изменить роль                             |
| DELETE | `/api/profiles/:idOrSlug/access/:userId`          | auth     |                                           |
| GET    | `/api/profiles/:idOrSlug/access-codes`            | auth     | список кодов                              |
| POST   | `/api/profiles/:idOrSlug/access-codes`            | auth     | создать код                               |
| POST   | `/api/profiles/:idOrSlug/access-codes/:id/revoke` | auth     |                                           |
| DELETE | `/api/profiles/:idOrSlug/access-codes/:id`        | auth     |                                           |
| POST   | `/api/profiles/:idOrSlug/verify-access-code`      | optional | → `{ accessToken }` для X-Profile-Access  |
| GET    | `/api/family-trees`, `/family-nodes`, `/family-connections`, `/family-clans` | auth | CRUD генеалогии |
| GET    | `/api/timeline-events?treeId/nodeId/profileId`    | optional |                                           |
| GET    | `/api/reviews/:personId`                          | optional |                                           |
| POST   | `/api/reviews/:personId`                          | optional | требует модерации                         |
| GET    | `/api/candles?profileId=...`                      | все      |                                           |
| POST   | `/api/candles/light`                              | optional |                                           |
| GET    | `/sitemap.xml`                                    | все      | только `visibility=PUBLIC AND deletedAt IS NULL` |
| GET    | `/robots.txt`                                     | все      |                                           |

Полный справочник: `docs/API.md`.

---

## Telegram-бот

Wizard создания мемориальной страницы (10 шагов):
1. ФИО
2. Даты жизни
3. Главное фото (обязательно)
4. Эпитафия (10–500 символов)
5–10. Шесть блоков: детство → образование → карьера → семья → хобби → наследие  
       (текст + опционально фото + опционально цитата)
11. Превью + visibility (`PUBLIC` / `UNLISTED`)
12. Публикация

Бот сохраняет напрямую в ту же Postgres через Prisma. `User` создаётся
автоматически (email `tg_<id>@bot.local`).

---

## Frontend ↔ Backend integration

Фронт работает на vanilla JS, обращается к `/api/*`. Сейчас подключено:
list / detail профилей, login / register, отзывы, свечи, базовый поиск, family tree.

Готово, но **ещё не интегрировано на фронт**:
- расширенные фильтры каталога (city, year range, gender, visibility)
- управление доступом (`ProfileAccess`) — выдача / отзыв
- одноразовые коды (`ProfileAccessCode`) — создание / отзыв / форма ввода
- soft delete UI (корзина, восстановление, hard delete для ADMIN)
- visibility=PASSWORD форма ввода → `X-Profile-Access` header

---

## Безопасность

- Все секреты в `.env` (не в репо), `.gitignore` исключает `.env`
- PBKDF2-SHA512 для паролей и для `accessHash` / `codeHash`
- JWT с коротким TTL, `JWT_SECRET` 256+ бит
- Rate limiting на `/auth/login`, `/auth/register`, общий
- CASCADE FK для child-таблиц, чтобы не оставлять orphan-строки
- Soft delete по умолчанию (hard только для ADMIN с `?hard=true`)

