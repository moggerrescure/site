#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
#  Memory · production rollback script
#  Откатывает прод на предыдущий (или указанный) коммит.
#
#  Использование:
#    ./rollback.sh                        # откат на HEAD~1 (предыдущий коммит)
#    ./rollback.sh <sha>                  # откат на конкретный коммит
#
#  Опции через env:
#    RESTORE_DB=auto                      # восстановить БД из последнего pre-rollback дампа
#    RESTORE_DB=backups/memory_X.sql.gz   # восстановить БД из конкретного файла
#    SKIP_CONFIRM=1                       # без интерактивного подтверждения
#
#  ⚠ Важно: rollback.sh НЕ запускает prisma migrate.
#    Миграции необратимы; если откатываемые коммиты содержали миграции,
#    обязательно используй RESTORE_DB= чтобы вернуть БД в совместимое состояние.
#
#  После rollback'а ты окажешься в detached HEAD.
#  Чтобы вернуться к нормальной работе:
#    1. Залей в main коммит с исправлением проблемы
#    2. git checkout main && git pull
#    3. ./deploy.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

# ── Load .env ────────────────────────────────────────────
if [ -f .env ]; then
    set -a
    . ./.env
    set +a
fi

LOG_FILE="./deploy.log"   # ← общий лог с deploy.sh

log() {
    local msg="[$(date '+%F %T %Z')] $*"
    echo "$msg" | tee -a "$LOG_FILE"
}

TG_TOKEN="${BACKUP_TG_TOKEN:-${BOT_TOKEN:-}}"
TG_CHAT="${BACKUP_TG_CHAT_ID:-}"

notify() {
    local text="$1"
    [ -z "$TG_TOKEN" ] || [ -z "$TG_CHAT" ] && return 0
    curl -sS --max-time 15 -X POST "{{https://api.telegram.org/bot${TG_TOKEN}}}/sendMessage" \
        --data-urlencode "chat_id=${TG_CHAT}" \
        --data-urlencode "text=${text}" \
        --data-urlencode "parse_mode=HTML" \
        > /dev/null 2>&1 || true
}

ROLLBACK_STAGE="init"
on_error() {
    local code=$?
    log "❌ Rollback failed at stage: ${ROLLBACK_STAGE} (exit code $code)"
    notify "❌ <b>Memory ROLLBACK FAILED</b>%0A%0AStage: <code>${ROLLBACK_STAGE}</code>%0AExit code: ${code}%0AServer: $(hostname)%0A%0A⚠ Прод в неопределённом состоянии — проверь вручную."
    exit "$code"
}
trap on_error ERR

# ─── 1. Определить target-коммит ─────────────────────────
ROLLBACK_STAGE="resolve-target"
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
    TARGET=$(git rev-parse HEAD~1 2>/dev/null) || {
        log "❌ Нельзя сделать HEAD~1 — это первый коммит в репозитории"
        exit 1
    }
fi

# Нормализовать в полный sha
TARGET_FULL=$(git rev-parse "$TARGET" 2>/dev/null) || {
    log "❌ Коммит '$TARGET' не найден"
    exit 1
}
TARGET_SHORT=$(git rev-parse --short "$TARGET_FULL")
TARGET_LINE=$(git log -1 --pretty=format:"%h · %an · %s" "$TARGET_FULL")
CURRENT_FULL=$(git rev-parse HEAD)
CURRENT_SHORT=$(git rev-parse --short HEAD)
CURRENT_LINE=$(git log -1 --pretty=format:"%h · %an · %s" HEAD)

if [ "$TARGET_FULL" = "$CURRENT_FULL" ]; then
    log "❌ Target-коммит совпадает с текущим HEAD ($CURRENT_SHORT). Нечего откатывать."
    exit 1
fi

# ─── 2. Подтверждение ────────────────────────────────────
log "═══════════════════════════════════════════════════════"
log "🔙 ROLLBACK PLAN"
log "   FROM: $CURRENT_LINE"
log "   TO:   $TARGET_LINE"
log ""
log "   Коммиты, которые будут откачены ($CURRENT_SHORT..$TARGET_SHORT):"
git log --oneline "${TARGET_FULL}..${CURRENT_FULL}" 2>&1 | sed 's/^/      /' | tee -a "$LOG_FILE"
log ""

# Проверить наличие миграций в откатываемом диапазоне
MIGRATIONS_DIFF=$(git diff --name-only "${TARGET_FULL}..${CURRENT_FULL}" -- 'backend/prisma/migrations/' 2>/dev/null || true)
if [ -n "$MIGRATIONS_DIFF" ]; then
    log "⚠  В откатываемом диапазоне ЕСТЬ изменения миграций Prisma:"
    echo "$MIGRATIONS_DIFF" | sed 's/^/      /' | tee -a "$LOG_FILE"
    log ""
    log "   Без RESTORE_DB= БД останется со свежей схемой → старый код может крашиться."
    log "   Рекомендуется: RESTORE_DB=auto ./rollback.sh $TARGET_SHORT"
    log ""
fi

if [ "${SKIP_CONFIRM:-0}" != "1" ]; then
    echo ""
    read -p "Продолжить rollback? [y/N] " -n 1 -r REPLY
    echo ""
    if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
        log "❌ Rollback отменён пользователем"
        exit 1
    fi
fi

START_TS=$(date +%s)
notify "🔙 <b>Memory ROLLBACK STARTED</b>%0A%0AFrom: <code>${CURRENT_LINE}</code>%0ATo: <code>${TARGET_LINE}</code>%0AServer: $(hostname)"

# ─── 3. Safety-снапшот текущего состояния БД ─────────────
ROLLBACK_STAGE="safety-snapshot"
log "💾 Safety-снапшот БД (на случай если rollback тоже сломан)"
mkdir -p ./backups
SAFETY_FILE="./backups/before_rollback_$(date +%Y%m%d_%H%M%S).sql.gz"
if docker compose ps db --status running --quiet 2>/dev/null | grep -q .; then
    docker compose exec -T db sh -c "PGPASSWORD=\"\$POSTGRES_PASSWORD\" pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" --no-owner --no-acl" \
        | gzip -9 > "$SAFETY_FILE"
    if [ -s "$SAFETY_FILE" ]; then
        log "✅ Safety-снапшот: $SAFETY_FILE ($(du -h "$SAFETY_FILE" | cut -f1))"
    else
        log "⚠ Safety-снапшот пустой — БД либо не запущена, либо недоступна. Продолжаем."
        rm -f "$SAFETY_FILE"
    fi
else
    log "⚠ Контейнер db не запущен — safety-снапшот пропущен"
fi

# ─── 4. Решить какой дамп использовать для restore (если нужно) ──
ROLLBACK_STAGE="resolve-restore-source"
RESTORE_FILE=""
if [ -n "${RESTORE_DB:-}" ]; then
    if [ "$RESTORE_DB" = "auto" ]; then
        log "🔍 RESTORE_DB=auto — ищу самый свежий дамп старше safety-снапшота..."
        # Берём дампы, отсортированные по имени (имена содержат timestamp), исключая безопасный снапшот
        RESTORE_FILE=$(ls -1 ./backups/memory_*.sql.gz 2>/dev/null | sort -r | head -1)
        if [ -z "$RESTORE_FILE" ]; then
            log "❌ Дампов вида backups/memory_*.sql.gz не найдено"
            exit 1
        fi
        log "   Использую: $RESTORE_FILE ($(du -h "$RESTORE_FILE" | cut -f1))"
    else
        RESTORE_FILE="$RESTORE_DB"
        if [ ! -f "$RESTORE_FILE" ]; then
            log "❌ Указанный файл RESTORE_DB не существует: $RESTORE_FILE"
            exit 1
        fi
    fi
fi

# ─── 5. git checkout ─────────────────────────────────────
ROLLBACK_STAGE="git-checkout"
log "🔀 git checkout $TARGET_SHORT (detached HEAD)"
git checkout --quiet "$TARGET_FULL"

# ─── 6. Build образов ────────────────────────────────────
ROLLBACK_STAGE="build"
log "🔨 docker compose build"
docker compose -f docker-compose.yml build 2>&1 | tee -a "$LOG_FILE"

# ─── 7. Опционально: восстановить БД из дампа ────────────
if [ -n "$RESTORE_FILE" ]; then
    ROLLBACK_STAGE="restore-db"
    log "🗃 Восстановление БД из $RESTORE_FILE"
    log "   ⚠ ВНИМАНИЕ: DROP SCHEMA public CASCADE — все текущие данные стираются"

    # Поднять только db, остальное останется на старых контейнерах (которые сейчас крашатся/работают на v_new)
    docker compose -f docker-compose.yml up -d db

    # Дождаться healthy
    for i in 1 2 3 4 5 6 7 8 9 10; do
        if docker compose -f docker-compose.yml ps db --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
            break
        fi
        log "   ⏳ Жду healthy db ($i/10)..."
        sleep 2
    done

    # Остановить ВСЕ потребители БД на время restore
    log "   Останавливаю backend / bot на время restore..."
    docker compose -f docker-compose.yml stop backend bot 2>/dev/null || true

    # DROP SCHEMA + LOAD
    log "   DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker compose -f docker-compose.yml exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;" 2>&1 | tee -a "$LOG_FILE"

    log "   Загрузка дампа..."
    gunzip -c "$RESTORE_FILE" | docker compose -f docker-compose.yml exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>>"$LOG_FILE"

    log "✅ БД восстановлена из $(basename "$RESTORE_FILE")"
fi

# ─── 8. Up -d ────────────────────────────────────────────
ROLLBACK_STAGE="up"
log "🚢 docker compose up -d --remove-orphans"
docker compose -f docker-compose.yml up -d --remove-orphans 2>&1 | tee -a "$LOG_FILE"

# ─── 9. Healthcheck ──────────────────────────────────────
ROLLBACK_STAGE="healthcheck"
log "🩺 Healthcheck /health (таймаут 60с)"
HEALTH_OK=0
for i in $(seq 1 30); do
    if curl -sSf --max-time 3 http://localhost/health > /dev/null 2>&1; then
        HEALTH_OK=1
        log "✅ /health отвечает (попытка $i/30)"
        break
    fi
    sleep 2
done

if [ "$HEALTH_OK" = "0" ]; then
    log "❌ /health не ответил за 60с — прод не вернулся в строй после rollback'а"
    log "   Логи бэкенда:"
    docker compose -f docker-compose.yml logs --tail=50 backend | tee -a "$LOG_FILE"
    exit 1
fi

# ─── 10. Финал ───────────────────────────────────────────
ROLLBACK_STAGE="done"
trap - ERR
ELAPSED=$(($(date +%s) - START_TS))

log "✅ Rollback успешен за ${ELAPSED}с"
log "   Откат: $CURRENT_SHORT → $TARGET_SHORT"
[ -n "$RESTORE_FILE" ] && log "   БД восстановлена из: $RESTORE_FILE"
log ""
log "⚠ Сейчас репозиторий в detached HEAD на $TARGET_SHORT."
log "   Чтобы вернуться к нормальному workflow:"
log "      1) Залей исправление проблемы в main (git push в репо)"
log "      2) git checkout main && git pull"
log "      3) ./deploy.sh"
log "═══════════════════════════════════════════════════════"

RESTORE_NOTE=""
[ -n "$RESTORE_FILE" ] && RESTORE_NOTE="%0ARestored DB: <code>$(basename "$RESTORE_FILE")</code>"
notify "✅ <b>Memory ROLLBACK OK</b> (${ELAPSED}с)%0A%0AFrom: <code>${CURRENT_SHORT}</code>%0ATo: <code>${TARGET_LINE}</code>${RESTORE_NOTE}%0AServer: $(hostname)%0A%0A⚠ Detached HEAD — после фикса: git checkout main"
