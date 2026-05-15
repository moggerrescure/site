# 🔄 План миграции v1 → v2

## Обзор

Миграция с SQLite (встроенный `node:sqlite`) на PostgreSQL + Prisma ORM.
Смена модели авторизации с email/password на Telegram ID.
Переход от плоской структуры `people` к журнальной `Profile + ContentBlock`.

---

## Маппинг моделей

### users → User

| v1 (SQLite) | v2 (Prisma) | Примечание |
|---|---|---|
| `id` TEXT | `id` Int (autoincrement) | Смена типа |
| `email` TEXT | — | Убирается |
| `password` TEXT | — | Убирается |
| `name` TEXT | — | Не нужно (берётся из Telegram) |
| — | `telegramId` String | Новое поле, основной идентификатор |

### people → Profile

| v1 (SQLite) | v2 (Prisma) | Примечание |
|---|---|---|
| `id` TEXT (slug) | `id` String (UUID) | UUID для QR-кодов |
| — | `ownerId` Int | Связь с User |
| `name` TEXT | `fullName` String | Переименование |
| `born` + `died` TEXT | `dates` String | Объединение в одно поле |
| `bio` TEXT | `mainText` Text | Краткий текст для Hero |
| `photo` TEXT | `mainPhotoUrl` String? | URL в S3 |
| `city` TEXT | — | Убирается (или в mainText) |
| `burial` TEXT | — | Убирается (или в ContentBlock) |

### bio → ContentBlock[]

Одно поле `bio` разбивается на 6 структурированных блоков:

| order | Ключ | Заголовок |
|-------|------|-----------|
| 1 | childhood | Детство и юность |
| 2 | education | Образование |
| 3 | career | Профессиональный путь |
| 4 | family | Семья |
| 5 | hobbies | Хобби и увлечения |
| 6 | legacy | Наследие |

Каждый блок: `{ text, imageUrl?, order }`.
Фронтенд (`person-blocks.js`) уже рендерит эту структуру.

### reviews → GuestMemory

| v1 (SQLite) | v2 (Prisma) | Примечание |
|---|---|---|
| `id` TEXT | `id` Int | Смена типа |
| `person_id` TEXT | `profileId` String | FK на Profile |
| `author` TEXT | `authorName` String | Переименование |
| `text` TEXT | `memoryText` Text | Переименование |
| — | `isApproved` Boolean | Новое: модерация |

### Удаляемые сущности

| Таблица | Причина |
|---------|---------|
| `candles` | Убирается из проекта |
| `person_codes` | Заменяется авторизацией через Telegram |

---

## Стратегия миграции

### Этап 1: Подготовка
1. Установить PostgreSQL локально
2. Настроить `DATABASE_URL` в `.env`
3. `npx prisma db push` — создать таблицы
4. `npx prisma generate` — сгенерировать клиент

### Этап 2: Скрипт миграции данных
```javascript
// migrate.js — одноразовый скрипт
// 1. Читает SQLite через node:sqlite
// 2. Создаёт User (telegramId = placeholder)
// 3. Для каждого person → создаёт Profile
// 4. bio → разбивает на ContentBlock (или один блок)
// 5. reviews → GuestMemory (isApproved: true)
```

### Этап 3: Переключение бэкенда
1. Заменить `db.js` на Prisma Client
2. Переписать `router.js` под новые модели
3. Убрать candles endpoints
4. Добавить Telegram-авторизацию

### Этап 4: Telegram-бот
1. Бот создаёт User по telegramId
2. Бот заполняет Profile + ContentBlocks
3. Бот генерирует QR-код с UUID профиля
4. Фронтенд рендерит по UUID (уже работает)

---

## Что уже готово для v2

- ✅ Prisma-схема (`server/prisma/schema.prisma`)
- ✅ Фронтенд рендерит 6 зебра-блоков (`person-blocks.js`)
- ✅ Фронтенд умеет загружать UUID-страницы из бота (`person.js → botPayloadToPerson`)
- ✅ Fallback-цепочка: API → bot-data → data.js

## Что нужно сделать

- ❌ Установить PostgreSQL
- ❌ Написать скрипт миграции данных
- ❌ Переписать router.js под Prisma
- ❌ Написать Telegram-бота
- ❌ Настроить S3 для фото
- ❌ Убрать candles из фронтенда и бэкенда
- ❌ Убрать email-авторизацию
