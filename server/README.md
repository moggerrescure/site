# 🖥️ Server — Node.js Backend

Бэкенд мемориального сайта «Память».
Чистый Node.js 24+ без внешних зависимостей (v1).

---

## Запуск

```bash
cd server
node index.js
```

Сервер: `http://localhost:3000`
Фронтенд раздаётся автоматически из корня проекта.

---

## Конфигурация (.env)

```env
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL="postgresql://postgres:password@localhost:5432/memorial_site?schema=public"
```

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | 3000 |
| `JWT_SECRET` | Секрет JWT | (обязательно в проде) |
| `DATABASE_URL` | PostgreSQL URL (для Prisma v2) | — |

---

## Структура

```
server/
├── index.js        — HTTP-сервер, статика, маршрутизация верхнего уровня
├── router.js       — Все API-роуты и обработчики
├── db.js           — SQLite схема и подключение (v1)
├── auth.js         — JWT (HS256) + PBKDF2 хеширование паролей
├── upload.js       — Multipart/form-data парсер для фото
├── package.json    — Зависимости (v2: prisma, @prisma/client)
├── .env.example    — Пример конфигурации
├── .gitignore      — Исключения из git
├── prisma/
│   └── schema.prisma  — Целевая схема БД (v2, PostgreSQL)
├── docs/
│   └── DATABASE.md    — Документация схемы БД
├── data/
│   └── memory.db      — SQLite файл (v1, не в git)
└── uploads/           — Загруженные фото (не в git)
```

---

## Модули

### index.js
- Создаёт HTTP-сервер
- Раздаёт статику фронтенда
- Раздаёт `/uploads/` (загруженные фото)
- Раздаёт `/bot-data/` (данные Telegram-бота)
- Делегирует `/api/*` в router.js

### router.js
- Все REST API endpoints
- CORS обработка
- Seed данных при первом запуске (18 людей)
- Парсинг JSON body
- Маршрутизация с параметрами (`:id`)

### db.js
- Подключение к SQLite через `node:sqlite` (Node 24+)
- Создание таблиц: users, people, reviews, candles, person_codes
- WAL mode, foreign keys ON

### auth.js
- `signJWT(payload)` — создание токена (HS256, 7 дней)
- `verifyJWT(token)` — проверка и декодирование
- `hashPassword(password)` — PBKDF2-SHA512, 100k итераций
- `verifyPassword(password, stored)` — timing-safe сравнение

### upload.js
- `parseUpload(req, prefix)` — парсинг multipart/form-data
- Допустимые форматы: jpg, jpeg, png, webp, gif
- Макс. размер: 8 MB
- Сохраняет в `server/uploads/`

---

## База данных (v1 — SQLite)

Таблицы:
- `users` — пользователи (email/password авторизация)
- `people` — страницы памяти (name, born, died, city, bio, photo, burial)
- `reviews` — воспоминания (author, text, привязка к person)
- `candles` — счётчик свечей (будет удалён)
- `person_codes` — коды доступа к страницам

При первом запуске засевается 18 людьми и отзывами.

---

## База данных (v2 — PostgreSQL + Prisma)

Целевая схема в `prisma/schema.prisma`. Подробности: `docs/DATABASE.md`.

Модели: User, Profile, ContentBlock, GuestMemory.

Инициализация:
```bash
npx prisma db push
npx prisma generate
```

---

## Безопасность

- Пароли: PBKDF2-SHA512, 100 000 итераций, 16-байт соль
- JWT: HS256, срок 7 дней
- Upload: проверка расширения + лимит размера
- Path traversal: проверка `startsWith` для статики
- Body limit: 1 MB для JSON
