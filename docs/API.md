# 📡 API Reference

Базовый URL: `http://localhost:3000`

Все ответы в формате JSON: `{ ok: boolean, data?: any, error?: string }`

---

## Авторизация

Защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <jwt_token>
```

JWT выдаётся при login/register, действует 7 дней.

---

## Endpoints (v1 — текущие)

### Auth

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| POST | `/api/auth/register` | — | Регистрация |
| POST | `/api/auth/login` | — | Вход |
| GET | `/api/auth/me` | ✅ | Текущий пользователь |

#### POST /api/auth/register
```json
// Request
{ "name": "Иван", "email": "ivan@mail.ru", "password": "123456" }

// Response 201
{ "ok": true, "token": "eyJ...", "user": { "id", "name", "email", "role" } }
```

#### POST /api/auth/login
```json
// Request
{ "email": "ivan@mail.ru", "password": "123456" }

// Response 200
{ "ok": true, "token": "eyJ...", "user": { "id", "name", "email", "role" } }
```

---

### People (Страницы памяти)

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/people` | — | Список с пагинацией |
| GET | `/api/people/:id` | — | Один человек + отзывы |
| POST | `/api/people` | ✅ | Создать |
| PUT | `/api/people/:id` | ✅ | Обновить |
| DELETE | `/api/people/:id` | ✅ | Удалить |
| POST | `/api/people/:id/photo` | ✅ | Загрузить фото |
| POST | `/api/people/:id/verify-code` | — | Проверить код доступа |
| POST | `/api/people/:id/set-code` | ✅ | Установить код |

#### GET /api/people
Query params:
- `page` (default: 1)
- `limit` (default: 9, max: 50)
- `q` — поиск по имени/bio
- `city` — фильтр по городу

```json
// Response 200
{
  "ok": true,
  "data": [{ "id", "name", "born", "died", "city", "photo" }],
  "total": 18,
  "page": 1,
  "limit": 9,
  "pages": 2
}
```

#### GET /api/people/:id
```json
// Response 200
{
  "ok": true,
  "data": {
    "id", "name", "born", "died", "city", "bio", "photo",
    "burial", "burial_query", "created_at", "updated_at",
    "reviews": [{ "id", "author", "text", "created_at" }]
  }
}
```

#### POST /api/people
```json
// Request
{ "name": "Иванов Иван", "born": "01.01.1950", "died": "01.01.2020", "city": "Москва", "bio": "..." }

// Response 201
{ "ok": true, "data": { ... } }
```

#### POST /api/people/:id/photo
Content-Type: `multipart/form-data`
- Поле: file (jpg, png, webp, gif)
- Макс. размер: 8 MB

```json
// Response 200
{ "ok": true, "photo": "/uploads/person-id-1234567.jpg" }
```

#### POST /api/people/:id/verify-code
```json
// Request
{ "code": "MEMORYOK" }

// Response 200 (успех)
{ "ok": true }

// Response 403 (неверный код)
{ "ok": false, "error": "Неверный код..." }
```

---

### Reviews (Воспоминания)

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/reviews/:personId` | — | Все отзывы к человеку |
| POST | `/api/reviews/:personId` | — | Оставить отзыв |
| DELETE | `/api/reviews/delete/:id` | ✅ | Удалить отзыв |

#### POST /api/reviews/:personId
```json
// Request
{ "author": "Екатерина, внучка", "text": "Бабушка была лучшей..." }

// Response 201
{ "ok": true, "data": { "id", "person_id", "author", "text", "created_at" } }
```

Ограничения: author до 120 символов, text до 2000.

---

### Stats

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/stats` | — | Общая статистика |

```json
// Response 200
{ "ok": true, "data": { "people": 18, "reviews": 12, "candles": 237, "cities": 9 } }
```

---

## Статические файлы

| URL | Источник | Описание |
|-----|----------|----------|
| `/uploads/*` | `server/uploads/` | Загруженные фото |
| `/bot-data/*` | `../../memorial-bot/data/` | Данные Telegram-бота |
| `/*` | корень проекта | Фронтенд (HTML/CSS/JS) |

---

## Коды ошибок

| Код | Значение |
|-----|----------|
| 400 | Невалидные данные |
| 401 | Не авторизован |
| 403 | Доступ запрещён / неверный код |
| 404 | Не найдено |
| 409 | Конфликт (email уже занят) |
| 500 | Внутренняя ошибка сервера |

---

## CORS

Разрешены все origins (`*`). Методы: GET, POST, PUT, DELETE, OPTIONS.
