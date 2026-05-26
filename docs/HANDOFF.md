Самый простой путь — отдать новому агенту один компактный handoff-документ. Ниже готовый текст: скопируй его как первое сообщение новому агенту (или сохрани в `docs/HANDOFF.md` в репо — тогда сможешь просто сказать «прочитай docs/[HANDOFF.md](http://HANDOFF.md)»).

---

```
# Memorial Site — Handoff context

## Кто я и что делаю
Проект «Память» — мемориальный сайт-летопись. Бэкенд переписан с SQLite/vanilla Node
на **Express 4 + PostgreSQL 16 + Prisma 6.19**. Фронт — vanilla JS (HTML-страницы
`index.html`, `memory.html`, `person.html`, `family-tree.html`, `timeline.html`).
Есть Telegram-бот на Telegraf.

Я хочу: ответы по-русски, прямо, без воды, полный код файла + краткое описание что сделал.
Паттерны редактирования: node-патч с уникальными маркерами + sanity-check;
multi-`replace()` БЕЗ `/g` — антипаттерн; `fixModel` через подсчёт `{}` depth;
reorder через `slice + slice + slice`; при drift schema↔БД — psql ALTER + marker миграция
через `prisma migrate resolve --applied`; util-скрипты класть в `server/`, не в `/tmp`;
не комбинировать `curl -w` с `| jq`.

## Окружение
- Root: `/Users/borisserzhanovich/projects/site`
- Server: `~/projects/site/server` — `nohup node index.js > /tmp/server.log 2>&1 &`
- Bot: `~/projects/site/bot`
- Frontend: HTML/JS в корне репо
- Backups старого v1: `backups/2026-05-25-pre-cleanup/`
- Node v24.13.0, Prisma 6.19.3, express 4.22.2, multer 2.1.1, telegraf ^4.16.3
- Docker: `memory-pg`, postgres:16, порт 5433→5432
- Git: https://github.com/moggerrescure/site.git
  - main HEAD=`d2a64c1`, ветка full_test1 HEAD=`30cc7b3`

## Секреты (в `.env`)
- `JWT_SECRET=sgjY8bbgaPz1Z/fl4VtMxge3CbW8H53V2IVVL0WADllQtzYjJGmOqGW6y2IRoA3A`
- `BOT_TOKEN=8689960790:AAF4Jfcf0nfrPcegBbuIBpY0T9XCa49_PTg` (в `bot/.env`)
- `DATABASE_URL=postgresql://postgres:password@localhost:5433/memorial_site?schema=public`
- `SITE_URL=http://localhost:3000`

## Состояние БД
- profiles=19, soft_deleted=0, grants=0, codes=0
- FamilyTree=5, FamilyClan=11, FamilyNode=84, FamilyConnection=124 (SPOUSE=42)
- Тестовый профиль: `ivanova-mariya-petrovna` id=`cmplnz1ys00049lqspa9ti7kk`

### Пользователи
- `test@test.com / 12345678` — ADMIN (id `cmpliojj000029lmtcgif6rrs`)
- `editor@test.com / editor123` — USER (id `cmpmhausl00009lgpctiwo4ag`)
- + 5 других

### Миграции
- `20260525161315_init`
- `20260525163944_add_family_clan`
- `20260525222700_add_profile_search_vector` (GENERATED tsvector — источник drift)
- `20260526103015_add_profile_access_code_cascade` (resolved --applied)
- `20260526103200_add_profile_soft_delete` (resolved --applied)

## Что сделано на бэке
**Этапы 1–3 + FTS:** Prisma-схема, нормализация, GENERATED `searchVector` (russian).

**A–E (мелкие):**
- A. Slug-транслит (`lib/slug.js`)
- B. `/health`
- C. Rate limiting (`middleware/rateLimit.js`)
- D. Расширенный фильтр `/profiles` (city, bornYearFrom/To, diedYearFrom/To, gender, visibility)
- E. `/sitemap.xml` + `/robots.txt` (`lib/sitemap.js`)

**F–J (средние):**
- F. Family tree валидация + SPOUSE auto-mirror + cleanup edges при deleteNode
- G. ProfileAccess grants API (12 smoke ✅) — `GET/POST/PATCH/DELETE /profiles/:id/access[/:userId]`
- H. ProfileAccessCode ротируемые коды (14 smoke ✅) + `verify-access-code` → accessToken → `X-Profile-Access`
- J. Soft delete Profile (13/13 ✅) — `deletedAt`, `?hard=true` (ADMIN), `/profiles/trash`, `/restore`

**Cascade-миграция** ProfileAccessCode (`onDelete: Cascade`) — сделана.

## Что осталось (приоритет сверху вниз)

### Бэк
1. **I. HISTORICAL events** — `TimelineEvent` с `category=HISTORICAL` без `familyNodeId`/`profileId`; фильтр `scope=historical|personal|all`; ADMIN-only CRUD; поля description, sourceUrl, wikipediaUrl, endYear
2. **K. Audit log** — таблица `AuditLog (actorId, action, entityType, entityId, before/after, ip, ua, createdAt)`; middleware-обёртка; `GET /audit-log` ADMIN-only
3. **L. Photo cleanup** — orphan Media (не привязана к Profile/ContentBlock/GalleryItem/GuestMemory/FamilyNode); CLI `npm run cleanup:photos` + `--dry-run`

### Фронт (интеграция уже готового бэка)
- D-фильтры: city, year range, gender, visibility в `memory.html`
- G-access UI: выдача/отзыв грантов на странице профиля
- H-codes UI: создание/ротация access-кодов + PASSWORD-форма (отправка `X-Profile-Access`)
- J-trash UI: корзина, восстановление, hard delete (ADMIN)

### Telegram-бот
- PASSWORD-шаг в wizard (`visibility=PASSWORD` + `accessCodeService.createCode`)
- `/my_profiles` — список своих
- `/trash` — корзина
- `/access <slug>` — управление доступом

### Прод/инфра
- GitHub Secret Scanning + GitGuardian, ротация секретов
- CORS whitelist, HTTPS/nginx, pm2/systemd
- pg_dump cron бэкапы

### Cleanup перед коммитом
В репо лежат `.bak-*` файлы — удалить:
```

services/*.bak-*

router.js.bak-access

router.js.bak-codes

router.js.bak-soft-delete

router.js.bak-trash-order

router.js.bak-trash-order2

services/familyService.js.bak-family-validation

services/profileService.js.bak-filters

services/profileService.js.bak-soft-delete

services/mediaService.js.bak

services/reviewService.js.bak

index.js.bak-sitemap

index.js.bak-soft-delete

prisma/schema.prisma.bak-codes-relation

prisma/schema.prisma.bak-soft-delete

```

## Ключевая структура router.js (~500 строк)
- requires: profileService, reviewService, candleService, codeService, mediaService,
  familyService, timelineService, accessService, accessCodeService, prisma, auth, rateLimit
- Helpers:
```

const ok  = (res, data, code=200) => res.status(code).json({ ok: true, ...data })

const err = (res, status, msg)    => res.status(status).json({ ok: false, error: msg })

function wrap(fn){ return (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next) }

```
- Handler-функции: `listHandler` / `detailHandler` / `createHandler` / `updateHandler` / `deleteHandler`
- **PROFILE TRASH / RESTORE блок** идёт **ПЕРЕД** циклом регистрации (иначе `/profiles/trash` поглощается `/profiles/:id`)
- Цикл регистрирует CRUD на обоих базах:
```

for (const base of ['/people', '/profiles']) {

router.get(`${base}/:id`, optionalAuth, wrap(detailHandler))

// ...

}

```
- DELETE: `deleteProfile(req.params.id, req.user, { hard: req.query.hard === 'true' })`

## Enums (schema.prisma)
```

UserRole       USER | EDITOR | ADMIN

Gender         MALE | FEMALE | UNKNOWN

Visibility     PUBLIC | UNLISTED | PASSWORD | PRIVATE

RelationType   PARENT | SPOUSE | ADOPTIVE | STEP

TimelineCategory  BIRTH|DEATH|MARRIAGE|EDUCATION|CAREER|RELOCATION|AWARD|HISTORICAL|CUSTOM

BlockType, MemoryType, MediaKind

```

## Frontend fallback-цепочка
1. API `/api/people/...`
2. Telegram-бот `/bot-data/pages/{uuid}.json`
3. `js/data.js` — хардкод 18 людей (offline)

## Bot структура (`bot/`)
- `handlers/create-profile.js` — 10-step wizard (ФИО → даты → главное фото обязательно → эпитафия → 6 блоков с фото и цитатами → visibility PUBLIC/UNLISTED). **Нет PASSWORD-шага — нужно добавить.**
- `handlers/block-wizard.js` — 6 контент-блоков: childhood, education, career, family, hobbies, legacy
- `lib/auth.js`: `getOrCreateBotUser` (email `tg_<id>@bot.local`)
- `lib/slug.js`: `generateUniqueSlug` (общий с server)
- `lib/dates.js`: `parseRange`
- `photo.js`: `downloadAndCreateMedia`

## Документация уже написана (в чате текущего треда)
- Новый `README.md` — готов, осталось скопировать в корень
- `docs/API.md` — готов

Осталось: `docs/MIGRATION.md` (с drift workaround), `docs/DEPLOYMENT.md`,
`server/README.md`, `bot/README.md`, `CHANGELOG.md`.

## Следующий шаг
Юзер планировал: cleanup `.bak-*` → коммит + push → начать **I (HISTORICAL events)**.
```

---

