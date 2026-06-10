#!/bin/bash
set -e

HOUR="${BACKUP_HOUR:-03}"
MINUTE="${BACKUP_MINUTE:-00}"

log() { echo "[$(date '+%F %T %Z')] $*"; }

log "pg-backup starting (TZ=$(date +%Z), schedule=${HOUR}:${MINUTE} daily, retention=${BACKUP_RETENTION_DAYS:-7}d)"

# Прогнать бэкап немедленно при старте (например, BACKUP_ON_START=1)
if [ "${BACKUP_ON_START:-0}" = "1" ]; then
    log "BACKUP_ON_START=1 → initial run"
    /usr/local/bin/backup.sh || log "Initial backup failed (продолжаем в расписание)"
fi

while true; do
    NOW=$(date +%s)
    TARGET=$(date -d "today ${HOUR}:${MINUTE}:00" +%s)
    if [ "$TARGET" -le "$NOW" ]; then
        TARGET=$(date -d "tomorrow ${HOUR}:${MINUTE}:00" +%s)
    fi
    WAIT=$((TARGET - NOW))
    H=$((WAIT / 3600))
    M=$(( (WAIT % 3600) / 60 ))
    log "Next backup at $(date -d "@$TARGET" '+%F %T %Z') (через ${H}ч ${M}м)"
    sleep "$WAIT"
    /usr/local/bin/backup.sh || log "Scheduled backup exited with code $?"
done
