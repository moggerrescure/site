#!/bin/bash

echo "🔄 Синхронизация файлов..."
rsync -a --exclude='.git' --exclude='node_modules' /Users/ilakazdan/Desktop/site/ /Users/ilakazdan/Documents/GitHub/site/site-1/

echo "📂 Переход в папку проекта..."
cd /Users/ilakazdan/Documents/GitHub/site/site-1/ || exit

echo "🧹 Очистка старых контейнеров (если есть конфликты)..."
docker rm -f memory-pg memory-backend memory-bot memory-frontend memory-pg-backup 2>/dev/null

echo "🚀 Запуск сайта (Docker)..."
docker compose up -d --build

echo "✅ Готово! Сайт запускается. Откройте http://localhost в браузере."
echo "(Это окно можно закрыть)"
