FROM postgres:16-alpine

# coreutils → GNU date с -d "today 03:00", bash → нормальные [[ ]] и pipefail,
# curl → загрузка в Telegram, tzdata → корректные таймзоны
RUN apk add --no-cache bash curl tzdata coreutils

COPY backup.sh /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

WORKDIR /backups
CMD ["/usr/local/bin/entrypoint.sh"]
