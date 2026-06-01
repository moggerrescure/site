# Сессия 2026-06-01 — Восстановление данных, запуск окружения и аудит кода

Документ фиксирует ход работы: диагностику Docker, потерю и воссоздание данных,
создание админ-аккаунта, пересоздание страниц памяти и семейного древа, а также
результаты глубокого аудита кода (баги по приоритету).

---

## 1. Диагностика и запуск Docker

**Симптом:** `docker compose` падал — `dockerDesktopLinuxEngine pipe not found`.

**Причина:**
- Служба `com.docker.service` была остановлена.
- WSL-дистрибутив `docker-desktop` не был зарегистрирован (`wsl --list` пусто).

**Решение:** переустановка Docker Desktop (WSL2-бэкенд) + перезагрузка. После этого
дистрибутив `docker-desktop` развернулся, движок (Linux, v29.5.2) поднялся.

**Состояние контейнеров после `docker compose up -d --build`:**

| Контейнер | Статус | Примечание |
|---|---|---|
| `memory-pg` | ✅ healthy | Postgres 16, порт 5433 на хост |
| `memory-backend` | ✅ up | API на :3000, health OK |
| `memory-frontend` | ✅ up | Caddy на :80 → http://localhost |
| `memory-bot` | ⚠️ restarting | нужен валидный `BOT_TOKEN` |
| `memory-pg-backup` | ⚠️ restarting | нужны настройки бэкапа |

---

## 2. Потеря и воссоздание данных

**Что произошло:** старый Docker-том `pgdata` с базой был уничтожен при
переустановке Docker. Бэкапов не было (`backups/` пуст), sqlite-дампа нет.
Текстовые данные профилей (биографии, даты) **утеряны безвозвратно**.

**Что уцелело:** 44 файла фото в `backend/uploads/` (в git), весь код, схема, миграции.

**Воссоздание (скрипты в `backend/scripts/`):**

- `seed-recreate.js` — создаёт админа и 43 публичные страницы памяти,
  привязывая фото 1:1 по именам файлов (`ivan_morozov.webp` → «Морозов Иван»).
- `seed-tree.js` — строит семейное древо из этих профилей.

**Админ-аккаунт:**

| Поле | Значение |
|---|---|
| URL | http://localhost |
| Email | `admin@admin.local` |
| Пароль | `qwer2609` |
| Роль | `ADMIN` |

**Данные:** 43 страницы памяти (роды Морозовых, Соколовых, Волковых), все `PUBLIC`,
владелец — админ, с обложками-фото.

**Семейное древо «Морозовы · Соколовы · Волковы»:** 5 поколений (старшие снизу,
молодёжь сверху), 43 узла, 3 клана (цвета), ~34 родительских связи, ~10 межродовых
браков. Связи расставлены эвристически (точная генеалогия не сохранилась).

> ⚠️ Скрипты `seed-*.js` — одноразовые, для dev. На проде не запускать.

---

## 3. Как поднять окружение (шпаргалка)

```bash
# из корня проекта
docker compose up -d --build          # поднять всё (dev, с override)
docker compose ps                     # статус контейнеров
docker compose logs -f backend        # логи бэкенда
curl http://localhost:3000/api/health # проверка API

# пересоздать тестовые данные (dev only):
docker compose exec backend node scripts/seed-recreate.js
docker compose exec backend node scripts/seed-tree.js
```

Hot-reload включён (override): правки HTML/CSS/JS и backend `.js` подхватываются без пересборки.

---

## 4. Аудит кода — найденные баги (по приоритету)

### 🔴 Критично

1. **Stored XSS в `frontend/js/person.js`.** `buildMemoryCard()` и рендер шапки
   вставляют `item.text`, `item.author`, `person.name/bio/city` в `innerHTML` без
   экранирования. В `person.js` нет `escapeHtml` (есть во всех остальных файлах).
   Гость отправляет воспоминание с `<img onerror=...>` → после одобрения исполняется
   у всех посетителей. JWT лежит в `localStorage` → угон токена.
   **Фикс:** добавить `escapeHtml()` и обернуть все пользовательские поля.

2. **Перепутаны аргументы `ApiError` в `backend/services/legacyContactService.js`.**
   Конструктор — `ApiError(message, status, code)`, а вызовы вида
   `new ApiError(409, '...')` передают число как message, строку как status →
   `res.status(<строка>)` бросает RangeError → 500 вместо нужного кода.
   Строки: **150, 170, 219, 262, 265, 302**.

### 🟠 Высокое

3. **`POST /api/ai/chat`** — `optionalAuth`, без rate-limit. Аноним жжёт платный
   AI-бюджет (Gemini/OpenAI). Нужен `requireAuth` + лимитер + лимит размера `messages`.
4. **Загрузка файлов анонимами** (`/upload-photo|audio|video`, `router.js`) — до 200 МБ,
   `optionalAuth`. Storage-abuse. Нужен `requireAuth` + rate-limit.
5. **Brute-force PIN** — `/people/:id/verify-code`, `/profiles/:idOrSlug/verify-access-code`
   без rate-limit.
6. **Отзыв JWT не полон** (`backend/auth.js:200`) — токены без `jwtVersion` в payload
   не отзываются при logout/смене пароля. Трактовать отсутствие как `0`.

### 🟡 Среднее

7. `index.js` — дубль `app.set('trust proxy', 1)` (стр. 21 и 41).
8. CORS-callback бросает `Error` вместо `cb(null, false)` (`index.js:73`).
9. `JWT_SECRET` fallback молча активен вне `NODE_ENV='production'` (`auth.js:21`).
10. Дубль кода: `/people/:id/photo` и `/profiles/:id/photo` идентичны (`router.js`).
11. `qr.png/pdf` передают весь `req.headers` вместо `{accessToken}` (`router.js`).
12. Воспоминания на `PASSWORD`-профиль постятся без кода; нет rate-limit на создание.
13. `familyService.createConnection` — заявленный в ТЗ запрет межпоколенческого брака
    не реализован (есть только проверка циклов и лимит 2 родителей).
14. `disputeService` — `VALID_STATUSES_FOR_LIST` используется выше объявления
    (работает в рантайме, но хрупко).

### ✅ Сделано хорошо
Пароли/коды PBKDF2 + `timingSafeEqual` с версионированием итераций; JWT без
algorithm-confusion; транзакции в merge/legacy/deleteNode; soft-delete + cron
hard-delete; purge orphan media; аудит-лог; нормализация visibility/gender.

---

## 5. TODO / на потом

- [ ] Настроить рабочий автобэкап БД (`pg-backup`), чтобы потеря тома не повторилась.
- [ ] Починить баги из раздела 4 (приоритет: #1 XSS → #2 ApiError → #3–6).
- [ ] Боту прописать валидный `BOT_TOKEN`.
- [ ] Эффект ч/б для нижних поколений древа (grayscale через CSS) — по желанию.
