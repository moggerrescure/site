
# 🕯️ Память — Мемориальный сайт-летопись

Веб-платформа для создания мемориальных страниц: биографии, фотографии, воспоминания близких, родословное древо и хроника рода.

---

## Стек

**Бэкенд**
- Node.js 24+, Express 4
- PostgreSQL 16 + Prisma ORM 6.19
- JWT (HS256), PBKDF2-SHA512
- Multer 2 (memory storage), Sharp (resize / WebP)
- Postgres FTS (`tsvector` + `to_tsquery('russian', ...)`)
- express-rate-limit
- node-cron (cleanup 03:00, legacy-check 03:15 Europe/Minsk)

**Бот**
- Telegraf 4 (Telegram Bot API)
- Тот же Prisma Client, та же БД (напрямую, не через backend API)

**Фронт**
- Vanilla JavaScript (ES6+), без сборки
- CSS без препроцессоров
- Canvas (частицы), SVG (древо, лиана памяти)

**Инфра**
- Docker Compose: 4 сервиса (`db` / `backend` / `bot` / `frontend`)
- Caddy 2 (frontend reverse-proxy на `/api/*`, `/uploads/*`)

---

## Архитектура (Docker Compose)

| Service     | Container         | Image            | Порт      |
|-------------|-------------------|------------------|-----------|
| `db`        | `memory-pg`       | postgres:16      | 5433→5432 |
| `backend`   | `memory-backend`  | site-backend     | 3000      |
| `bot`       | `memory-bot`      | site-bot         | —         |
| `frontend`  | `memory-frontend` | site-frontend    | 80        |

Структура репо:
```

backend/    — Express API + Prisma + cron + services + jobs

bot/        — Telegraf-бот

frontend/   — статика (HTML/JS/CSS), Caddyfile

docs/       — документация

docker-compose.yml

```

---

## Страницы сайта

| Страница            | Файл                    | Описание                                                |
| ------------------- | ----------------------- | ------------------------------------------------------- |
| Главная             | `index.html`            | Статистика, последние добавленные                       |
| Каталог             | `memory.html`           | Поиск (FTS), фильтры (год/город/пол/видимость), пагинация |
| Персональная        | `person.html`           | Hero + 6 контент-блоков + воспоминания + карта + кнопка «Оспорить» |
| Древо семьи         | `family-tree.html`      | SVG-древо с кланами и поколениями _(заглушка)_         |
| Летопись            | `timeline.html`         | Хроника рода + исторические события _(заглушка)_       |
| Корзина             | `trash.html`            | Soft-deleted профили _(заглушка)_                      |
| Настройки наследия  | `legacy-contact.html`   | Доверенный контакт + приём приглашений + мои заявки    |
| Админ-панель        | `admin.html`            | 3 вкладки: Споры / Объединения / Наследование (ADMIN-only) |

---

## Модель данных (ключевое)

**Profile** (мемориальная страница):
- `slug` (unique) — для URL `/person.html?id=ivanova-mariya-petrovna`
- `fullName`, `birthDate`, `deathDate`, `burialPlace`, `bio`, `gender`
- `visibility` — `PUBLIC | UNLISTED | PASSWORD | PRIVATE`
- `accessHash` — PBKDF2 пароль для PASSWORD-страниц
- `ownerId` — владелец
- `deletedAt` — soft delete (см. ниже)
- `searchVector` — Postgres `tsvector` GENERATED (FTS)
- `familyNodeId` — привязка к узлу в дереве (1:1)
- relations: `blocks`, `galleryItems`, `guestMemories`, `candleLights`, `accessGrants`, `accessCodes`, `timelineEvents`, `disputes`, `mergeRequestsAsSource`, `mergeRequestsAsTarget`

**ProfileAccess** — индивидуальный доступ (`userId`, `canEdit: Boolean`, `grantedBy`).

**ProfileAccessCode** — ротируемые одноразовые коды (`codeHash`, `expiresAt`, `revokedAt`, `onDelete: CASCADE`).

**FamilyTree / FamilyClan / FamilyNode / FamilyConnection** — генеалогия (PARENT, SPOUSE, ADOPTIVE, STEP).

**TimelineEvent** — события (BIRTH, DEATH, MARRIAGE, EDUCATION, CAREER, RELOCATION, AWARD, HISTORICAL, CUSTOM).

**GuestMemory** — модерируемые воспоминания (`isApproved`).

**CandleLight** — счётчик «зажжённых свечей» (по profile / user / fingerprint).

**Media** — единое хранилище файлов (image / audio / video).

**User** — учётка (email + PBKDF2 password), роль `USER | EDITOR | ADMIN`. Поля `lastSeenAt`, `legacyInactivityDays` для проверки неактивности (legacy contact). Telegram-юзеры регистрируются с email `tg_<telegram_id>@bot.local`.

**AuditLog** — журнал операций (action, entityType, entityId, actorId, oldValue, newValue, metadata). 70+ action-типов, включая `DISPUTE_*`, `MERGE_REQUEST_*`, `LEGACY_*`. Cron удаляет записи >90 дней.

### Новое в Phase 2 — Disputes / Merge / Legacy

**ProfileDispute** — споры о профилях (модерация, передача владения, дубликаты):
- `reason: WRONG_INFO | INAPPROPRIATE | OWNERSHIP_CLAIM | DUPLICATE | OTHER`
- `status: OPEN | UNDER_REVIEW | RESOLVED_ACCEPTED | RESOLVED_REJECTED | WITHDRAWN`
- `description` (≥10 chars), `evidence` (опционально), `resolution` (заполняется при resolve)
- `duplicateOfProfileId` — обязателен для DUPLICATE
- `mergeRequestId` — авто-создаётся при resolve(accept) для DUPLICATE-споров

**ProfileMergeRequest** — заявки на объединение двух профилей в один:
- `status: PENDING_OWNERS | PENDING_ADMIN | APPROVED | EXECUTED | REJECTED | CANCELLED`
- Workflow: `createRequest` → `ownerApprove` (source + target) → `adminApprove` → `execute`
- `execute` relink-ит 9 child-таблиц (CandleLight, ContentBlock, GalleryItem, GuestMemory, ProfileAccess с union-dedupe, ProfileAccessCode, ProfileDispute, QrPlaque, TimelineEvent), source soft-deleted (`deletedAt = now`), slug остаётся уникальным для 302-redirect

**LegacyContact** — назначенный наследник аккаунта:
- `status: PENDING | ACTIVE | TRIGGERED | TRANSFERRED | REVOKED`
- `heirEmail`, `heirName`, `heirUserId` (заполняется при accept)
- `inactivityDays` (7–365, default 90)
- `inviteToken` (TTL 14 дней), `verifiedAt`, `triggeredAt`
- При неактивности owner-а >`inactivityDays` дней статус автоматически → `TRIGGERED`, наследник может подать claim

**LegacyClaim** — заявка наследника на передачу аккаунта:
- `status: PENDING | APPROVED | REJECTED | EXPIRED`
- `evidence` (доказательства), `reviewNotes` (заметки админа)
- При approve: все профили owner-а получают `ownerId = claimantId`, contact → `TRANSFERRED`, остальные PENDING claims для того же контакта → `REJECTED`
- TTL 30 дней (cron expire-claims)

Полная схема: `backend/prisma/schema.prisma`.

---

## Аутентификация и роли

- **Регистрация / Login** — email + пароль (PBKDF2-SHA512, salt hex), JWT в `Authorization: Bearer ...`
- **Telegram-юзеры** — бот создаёт `User` с email `tg_<telegram_id>@bot.local`. Команда `/setpassword` (W1) задаёт пароль, после чего можно логиниться через веб.
- **Роли**: `USER` (дефолт), `EDITOR`, `ADMIN`
- **Middleware**: `requireAuth` (401 без токена), `optionalAuth` (читает токен если есть), `requireAdmin` (403 не-ADMIN), `lastSeen` (обновляет `User.lastSeenAt` для legacy-проверки)

---

## Visibility model

| visibility | Кто видит                                                              |
| ---------- | ---------------------------------------------------------------------- |
| `PUBLIC`   | все, в sitemap, в каталоге                                              |
| `UNLISTED` | только по прямой ссылке, не в каталоге, не в sitemap                    |
| `PASSWORD` | по ссылке + ввод кода → получает access token                          |
| `PRIVATE`  | только owner, гранты `ProfileAccess` и ADMIN                            |

Дополнительно: `ProfileAccess` грант (`canEdit: true|false`) даёт указанному юзеру view/edit-доступ независимо от visibility. `ProfileAccessCode` — одноразовые / по сроку коды, выпускаются owner-ом.

---

## Soft delete

- `Profile.deletedAt` — заполняется при `DELETE /api/profiles/:id` (по умолчанию soft), при `execute` merge для source-профиля
- `?hard=true` (ADMIN-only) — физическое удаление через `prisma.profile.delete` → CASCADE на `ProfileAccessCode` и т.д.
- Soft-deleted профили **не видны** в:
  - публичном list / detail
  - sitemap.xml
  - access services (404 на access-codes / access endpoints)
- Owner / ADMIN видит `deletedAt` через `GET /api/profiles/:idOrSlug` (200)
- Профили, удалённые через merge, дополнительно отвечают 302-redirect на target.slug (frontend может отслеживать через `mergedIntoProfileId`)
- `GET /api/profiles/trash` — список (ADMIN видит все, owner — свои)
- `POST /api/profiles/:idOrSlug/restore` — сбрасывает `deletedAt`

### Cron-задачи

| Время (Europe/Minsk) | Что                                                                       |
| -------------------- | ------------------------------------------------------------------------- |
| `0 3 * * *`          | Hard-delete soft-deleted profiles >30 дней; чистка AuditLog >90 дней     |
| `15 3 * * *`         | Legacy: TRIGGER неактивных contacts + EXPIRE старых claims (>30 дней)    |

В TG-боте корзина доступна как команда `/trash` (W2).

---

## Полнотекстовый поиск (FTS)

- `Profile.searchVector` — `tsvector GENERATED ALWAYS AS (to_tsvector('russian', fullName || ' ' || bio || ' ' || burialPlace))`
- Поиск: `to_tsquery('russian', 'иван:* & петров:*')` + `ts_rank_cd`
- Триггерится при `?q=...`. Без `q` — FAST PATH (Prisma findMany).
- Фильтры применяются на обеих путях: `city`, `bornYearFrom/To`, `diedYearFrom/To`, `gender`, `visibility`, `mine`.
- Заглушки `fullName = 'Новая страница'` исключаются из публичного листинга (но видны owner-у при `mine=1`).

---

## Запуск (dev)

```

# 1. Клон + env

git clone [git@github.com](mailto:git@github.com):moggerrescure/site.git

cd site

cp .env.example .env          # JWT_SECRET, DATABASE_URL, SITE_URL

cp bot/.env.example bot/.env  # BOT_TOKEN, DATABASE_URL

# 2. Поднять всё (db + backend + bot + frontend)

docker compose up -d --build

sleep 6

docker compose ps    # все 4 контейнера UP

# 3. Применить миграции (первый раз)

docker compose exec backend npx prisma migrate deploy

# 4. (опционально) Засеять demo-данные

docker compose exec backend node prisma/seed.js

```

Доступно: `http://localhost/` (frontend), `http://localhost/api/health` (backend healthcheck), Telegram-бот активен.

### Обновление сервисов

```

# Backend: rebuild ~30s (миграции применятся через prisma migrate deploy на старте)

docker compose up -d --build backend && sleep 6

# Bot: rebuild ~30-50s. RESTART НЕ работает (нет bind-mount!)

docker compose up -d --build bot

# Frontend: Caddyfile + HTML/JS/CSS запекаются в образ → rebuild на каждое изменение

docker compose up -d --build frontend && sleep 4

```

⚠️ Bot session in-memory — каждый rebuild **сбрасывает все активные wizards** у юзеров.

⚠️ Backend на старте крутит `prisma migrate deploy` ~3-5с — используйте `/api/health` poll loop при автотестах, не сырой `sleep`.

---

## Основные API эндпоинты

### Auth + Profiles + Access

| Метод  | Путь                                              | Кто      | Описание                                                                       |
| ------ | ------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| GET    | `/api/health`                                     | все      | uptime + db latency                                                            |
| POST   | `/api/auth/register`                              | все      | rate-limited                                                                   |
| POST   | `/api/auth/login`                                 | все      | rate-limited                                                                   |
| GET    | `/api/auth/me`                                    | auth     |                                                                                |
| GET    | `/api/profiles`                                   | optional | `q, city, bornYearFrom/To, diedYearFrom/To, gender, visibility, mine, page, limit` |
| POST   | `/api/profiles`                                   | auth     | создать (черновик `fullName: 'Новая страница'` допустим)                       |
| GET    | `/api/profiles/:idOrSlug`                         | optional | возвращает `isOwner`, `canManageAccess`; header `X-Profile-Access` для PASSWORD |
| PUT    | `/api/profiles/:id`                               | auth     |                                                                                |
| DELETE | `/api/profiles/:id?hard=true`                     | auth     | hard только для ADMIN                                                          |
| GET    | `/api/profiles/trash`                             | auth     | ADMIN: все, USER: свои                                                          |
| POST   | `/api/profiles/:idOrSlug/restore`                 | auth     |                                                                                |
| GET    | `/api/profiles/:idOrSlug/access`                  | auth     | список грантов                                                                 |
| POST   | `/api/profiles/:idOrSlug/access`                  | auth     | выдать доступ (`userId\|userEmail`, `canEdit`)                                  |
| PATCH  | `/api/profiles/:idOrSlug/access/:userId`          | auth     |                                                                                |
| DELETE | `/api/profiles/:idOrSlug/access/:userId`          | auth     |                                                                                |
| GET    | `/api/profiles/:idOrSlug/access-codes`            | auth     |                                                                                |
| POST   | `/api/profiles/:idOrSlug/access-codes`            | auth     |                                                                                |
| POST   | `/api/profiles/:idOrSlug/access-codes/:id/revoke` | auth     |                                                                                |
| DELETE | `/api/profiles/:idOrSlug/access-codes/:id`        | auth     |                                                                                |
| POST   | `/api/profiles/:idOrSlug/verify-access-code`      | optional | → `{ accessToken }` для X-Profile-Access                                       |

### Disputes (Phase 2.1)

| Метод  | Путь                                       | Кто   | Описание                                                          |
| ------ | ------------------------------------------ | ----- | ----------------------------------------------------------------- |
| POST   | `/api/profiles/:idOrSlug/disputes`         | auth  | `{reason, description≥10, duplicateOfProfileId?}` — создать спор |
| GET    | `/api/profiles/:idOrSlug/disputes`         | auth  | список споров по профилю (owner / admin)                          |
| GET    | `/api/disputes/me`                         | auth  | мои поданные споры                                                |
| GET    | `/api/disputes`                            | admin | все споры (`?status&reason&page&limit`)                            |
| GET    | `/api/disputes/:id`                        | auth  |                                                                   |
| POST   | `/api/disputes/:id/withdraw`               | auth  | отозвать (только reporter)                                        |
| PATCH  | `/api/disputes/:id/status`                 | admin | OPEN → UNDER_REVIEW                                                |
| POST   | `/api/disputes/:id/resolve`                | admin | `{status:"accept"\|"reject", resolution≥5}` (для DUPLICATE+accept авто-создаёт merge) |

### Merge Requests (Phase 2.2)

| Метод  | Путь                                              | Кто   | Описание                                                  |
| ------ | ------------------------------------------------- | ----- | --------------------------------------------------------- |
| POST   | `/api/profiles/:idOrSlug/merge-requests`          | auth  | `{targetIdOrSlug, reason?}` (заявитель — owner или admin) |
| GET    | `/api/profiles/:idOrSlug/merge-requests`          | auth  | список заявок по профилю                                   |
| GET    | `/api/merge-requests/me`                          | auth  | мои заявки                                                |
| GET    | `/api/merge-requests`                             | admin | все (`?status&page&limit`)                                |
| GET    | `/api/merge-requests/:id`                         | auth  |                                                           |
| POST   | `/api/merge-requests/:id/owner-approve`           | auth  | owner approve (source или target)                          |
| POST   | `/api/merge-requests/:id/admin-approve`           | admin | PENDING_ADMIN → APPROVED                                  |
| POST   | `/api/merge-requests/:id/reject`                  | auth  | `{reason?}` — owner или admin может                       |
| POST   | `/api/merge-requests/:id/cancel`                  | auth  | только requester                                          |
| POST   | `/api/merge-requests/:id/execute`                 | admin | APPROVED → EXECUTED (relink + soft-delete source)         |

### Legacy Contact (Phase 2.3)

| Метод  | Путь                                              | Кто   | Описание                                                                  |
| ------ | ------------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| GET    | `/api/legacy-contact`                             | auth  | мой текущий доверенный контакт (или `null`)                                |
| PUT    | `/api/legacy-contact`                             | auth  | `{heirEmail, heirName?, inactivityDays?, message?}` — создать / заменить  |
| POST   | `/api/legacy-contact/resend`                      | auth  | отправить приглашение повторно                                            |
| DELETE | `/api/legacy-contact`                             | auth  | отозвать                                                                  |
| POST   | `/api/legacy-invites/accept`                      | auth  | `{inviteToken}` — принять приглашение                                     |
| POST   | `/api/legacy-contacts/:id/claims`                 | auth  | `{evidence≥10}` — подать заявку на передачу                                |
| GET    | `/api/legacy-claims/me`                           | auth  | мои заявки                                                                |
| GET    | `/api/legacy-claims/:id`                          | auth  |                                                                           |
| GET    | `/api/admin/legacy-claims`                        | admin | список PENDING заявок                                                     |
| POST   | `/api/admin/legacy-claims/:id/approve`            | admin | `{notes?}` — одобрить (перенесёт все профили owner-а наследнику)          |
| POST   | `/api/admin/legacy-claims/:id/reject`             | admin | `{notes?}`                                                                |
| POST   | `/api/admin/legacy/trigger-check`                 | admin | ручной запуск проверки неактивных (для тестов / ops)                      |
| POST   | `/api/admin/legacy/expire-claims`                 | admin | ручной запуск expire старых claims                                        |

### Прочие

| Метод  | Путь                                              | Кто      | Описание                                          |
| ------ | ------------------------------------------------- | -------- | ------------------------------------------------- |
| *      | `/api/family-trees`, `/family-nodes`, `/family-connections`, `/family-clans` | auth | CRUD генеалогии |
| GET    | `/api/timeline-events?treeId/nodeId/profileId`    | optional |                                                   |
| GET    | `/api/reviews/:personId`                          | optional |                                                   |
| POST   | `/api/reviews/:personId`                          | optional | требует модерации                                 |
| GET    | `/api/candles?profileId=...`                      | все      |                                                   |
| POST   | `/api/candles/light`                              | optional |                                                   |
| GET    | `/api/audit-logs`                                 | admin    | журнал операций (фильтры по action / actor / date) |
| GET    | `/sitemap.xml`                                    | все      | только `visibility=PUBLIC AND deletedAt IS NULL`  |
| GET    | `/robots.txt`                                     | все      |                                                   |
| GET    | `/uploads/*`                                      | все      | загруженные фото (Caddy → backend)                 |

Полный справочник: `docs/API.md` _(WIP)_.

---

## Disputes / Merge / Legacy — пользовательские сценарии

**Спор о профиле** (`person.html` → кнопка «⚠ Оспорить страницу»):
1. Любой залогиненный не-владелец может подать спор с одной из 5 причин
2. Для `DUPLICATE` указывается slug оригинала
3. Админ в `admin.html` → вкладка **Споры**: «В работу» (OPEN → UNDER_REVIEW) → «Принять» / «Отклонить» с обязательным `resolution` (для аудита)
4. Если принят `DUPLICATE` — автоматически создаётся merge request от админа

**Объединение профилей** (`admin.html` → вкладка **Объединения**):
1. Создаётся через `/api/profiles/:slug/merge-requests` (или авто из DUPLICATE-спора)
2. Workflow видно в админ-панели по статусу:
   - `PENDING_OWNERS` — ждёт согласия обоих владельцев (Owner Approve кнопка)
   - `PENDING_ADMIN` — оба согласились, ждёт админа (Admin Approve)
   - `APPROVED` — готов к Execute (⚡ кнопка, requires confirm)
   - `EXECUTED` — выполнено, source soft-deleted, все связи перенесены на target
3. Можно отклонить (REJECTED) на любой стадии до execute

**Доверенный контакт** (`legacy-contact.html`):
1. Owner назначает heir по email (форма): создаётся LegacyContact в статусе `PENDING`, heir получает токен (TTL 14 дней)
2. Heir переходит по ссылке `/legacy-contact.html?invite=TOKEN` → авто-accept, статус → `ACTIVE`, id контакта сохраняется в localStorage
3. Если owner не заходит >`inactivityDays` дней (default 90, проверка cron 03:15 Minsk) → статус → `TRIGGERED`
4. Heir подаёт claim через форму с evidence (≥10 chars) → claim в статусе `PENDING`
5. Админ в `admin.html` → вкладка **Наследование**: Approve переносит все профили owner-а → claimant, contact → `TRANSFERRED`. Reject оставляет owner-а владельцем.
6. Claims TTL 30 дней (cron 03:15 expire-claims).

---

## Telegram-бот

### Главное меню (3 строки кнопок)
```

[🕯 Создать страницу памяти]

[📋 Мои страницы]  [🔑 Пароль]

[🗑 Корзина]       [❓ Помощь]

```

### Slash-команды (через `/` в TG-меню)

| Команда         | Описание                                                                  |
|-----------------|---------------------------------------------------------------------------|
| `/start`        | Приветствие + главное меню                                                |
| `/menu`         | Показать главное меню                                                     |
| `/setpassword`  | **W1**: задать пароль PBKDF2 для веб-логина (`tg_<id>@bot.local`)         |
| `/trash`        | **W2**: корзина soft-deleted страниц → restore / hard delete с confirm    |
| `/access`       | **W3**: выдача view/edit-доступа другому юзеру по email                   |

### Wizard создания мемориальной страницы (10 шагов)
1. ФИО
2. Даты жизни
3. Главное фото (обязательно)
4. Эпитафия (10–500 символов)
5–10. Шесть блоков: детство → образование → карьера → семья → хобби → наследие (текст + опционально фото + опционально цитата)
11. Превью + visibility (`PUBLIC` / `UNLISTED`)
12. Публикация

> _В планах:_ PASSWORD-шаг с генерацией access-кода; раздел «Где я редактор» в `/my_profiles`; команды для disputes / legacy contact.

Бот сохраняет напрямую в ту же Postgres через Prisma. `User` создаётся автоматически.

---

## Frontend ↔ Backend integration

Фронт работает на vanilla JS, обращается к `/api/*` через `js/api.js` (`API.get/post/put/patch/del/upload` — требует явный `/api/` префикс).

**Подключено:**
- список / detail профилей, login / register, отзывы, свечи, базовый поиск, family tree (заглушка)
- расширенные фильтры каталога (`memory.html`): `q`, `bornYear`, `diedYear`, `gender`, `visibility`, `mine`, пагинация
- скрытие пустых заглушек «Новая страница» из public list
- soft delete через TG-бот (`/trash` W2)
- выдача доступа через TG-бот (`/access` W3)
- **Споры на профилях** (`person.html` + `js/disputes.js`) — кнопка «Оспорить» для не-владельцев + модал
- **Доверенный контакт** (`legacy-contact.html` + `js/legacy-contact.js`) — owner-секция, heir-секция, auto-accept по `?invite=`
- **Админ-панель** (`admin.html` + `js/admin.js`) — 3 вкладки с модерацией Disputes / Merge / Legacy
- **nav.js** — auto-инжектит «Настройки» для всех залогиненных и «Админ» для роли ADMIN

**Готово на бэке, но ещё не интегрировано на веб-фронт:**
- управление доступом (`ProfileAccess`) — UI на странице профиля для выдачи / отзыва
- одноразовые коды (`ProfileAccessCode`) — UI создания / отзыва + форма ввода кода
- soft delete UI веб (корзина, восстановление, hard delete для ADMIN) — есть `trash.html` заглушка
- visibility=PASSWORD форма ввода → `X-Profile-Access` header
- создание merge request с UI владельца (сейчас только через админку или DUPLICATE-спор)

---

## Безопасность

- Все секреты в `.env` (не в репо), `.gitignore` исключает `.env`
- PBKDF2-SHA512 для паролей и для `accessHash` / `codeHash` (salt как hex-string)
- JWT с коротким TTL, `JWT_SECRET` 256+ бит
- Rate limiting на `/auth/login`, `/auth/register`, общий
- CASCADE FK для child-таблиц, чтобы не оставлять orphan-строки
- Soft delete по умолчанию (hard только для ADMIN с `?hard=true`)
- Все мутации в Disputes / Merge / Legacy логируются в AuditLog (action + actor + entityId + old/new + metadata)
- Legacy invite-токены: cryptographically random 32 байта (base64url), TTL 14 дней; claim TTL 30 дней

⚠️ Перед прод-деплоем — **ротировать все секреты**, настроить HTTPS, включить CORS whitelist, GitGuardian / GitHub Secret Scanning.

---

## Бэкапы PostgreSQL

5-й сервис `pg-backup` (опционально, дефолтный профиль не включает). См. отдельный раздел в `docs/HANDOFF.md`.

**Восстановление из дампа:**
```

# Распаковать дамп

gunzip -c backups/memory_YYYYMMDD_HHMMSS.sql.gz > /tmp/restore.sql

# ОПАСНО: пересоздать схему (все текущие данные удалятся!)

docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \

-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Залить дамп

docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < /tmp/restore.sql

```

**Принудительный бэкап вне расписания:**
```

docker compose exec pg-backup /usr/local/bin/[backup.sh](http://backup.sh)

```

**Изменить время / retention / Telegram:** правки в `.env`, потом `docker compose up -d pg-backup` (без `--build`, потому что код в скрипте не менялся).

**Известные слабые места** (не критично сейчас, но фиксим перед прод-релизом):
- Бэкапы лежат на том же диске, что и БД — добавить S3 / Backblaze B2 третьим уплоадером в `backup.sh`
- Не бэкапим `uploads/` — нужно `tar -czf /backups/uploads_$TS.tar.gz` + смонтировать volume `:ro` в `pg-backup`
- Лог-файл бэкапа теряется при пересоздании контейнера — можно примонтировать `./backups/backup.log`

---

