#!/bin/bash
set -euo pipefail

TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
FILE="$BACKUP_DIR/memory_${TS}.sql.gz"
RETENTION="${BACKUP_RETENTION_DAYS:-7}"

log() { echo "[$(date '+%F %T %Z')] $*"; }

mkdir -p "$BACKUP_DIR"
log "Starting pg_dump → $(basename "$FILE")"

# --no-owner / --no-acl — дамп переносим на любой PG-сервер с любыми ролями.
# Формат plain + gzip — можно глазами читать (zcat | less) и восстанавливать одним psql.
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "${POSTGRES_HOST:-db}" \
    -p "${POSTGRES_PORT:-5432}" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-owner --no-acl \
    | gzip -9 > "$FILE"

if [ ! -s "$FILE" ]; then
    log "❌ pg_dump produced empty file, aborting"
    rm -f "$FILE"
    exit 1
fi

SIZE=$(stat -c%s "$FILE")
SIZE_MB=$(awk "BEGIN {printf \"%.2f\", $SIZE/1048576}")
log "✅ Dump OK: $(basename "$FILE") (${SIZE_MB} MB)"

# ── Отправка в Telegram, если настроен токен и chat_id ──
TG_TOKEN="${BACKUP_TG_TOKEN:-}"
TG_CHAT="${BACKUP_TG_CHAT_ID:-}"

if [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT" ]; then
    TG_LIMIT=$((50 * 1024 * 1024))   # Telegram Bot API: 50 MB на файл
    if [ "$SIZE" -gt "$TG_LIMIT" ]; then
        log "⚠ Dump > 50MB — Telegram Bot API не примет. Шлём только уведомление."
        curl -sS --max-time 30 -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
            --data-urlencode "chat_id=${TG_CHAT}" \
            --data-urlencode "text=⚠ Бэкап БД ${SIZE_MB} MB превышает лимит Bot API (50MB). Файл остался на сервере: $(basename "$FILE")" \
            > /dev/null || log "TG notice failed"
    else
        log "Uploading to Telegram (chat $TG_CHAT)..."
        if curl -sS --max-time 180 -f -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendDocument" \
            -F "chat_id=${TG_CHAT}" \
            -F "document=@${FILE}" \
            -F "caption=💾 Memory DB backup · $(date '+%d.%m.%Y %H:%M %Z') · ${SIZE_MB} MB" \
            > /dev/null; then
            log "✅ Uploaded to Telegram"
        else
            log "❌ Telegram upload failed (дамп остался локально в $BACKUP_DIR)"
        fi
    fi
else
    log "ℹ Telegram-destination не настроен (BACKUP_TG_TOKEN / BACKUP_TG_CHAT_ID пусты) — только локальный дамп"
fi

# ── Чистка старых дампов ─────────────────────────────────
log "Cleaning dumps older than ${RETENTION} days…"
find "$BACKUP_DIR" -maxdepth 1 -name "memory_*.sql.gz" -type f -mtime "+${RETENTION}" -print -delete | \
    awk '{print "[removed]", $0}' || true

KEPT=$(ls -1 "$BACKUP_DIR"/memory_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
log "Done. Локально хранится дампов: ${KEPT}"
