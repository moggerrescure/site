#!/usr/bin/env bash
set -euo pipefail

EMAIL="${1:-test@test.com}"
PASS="${2:-12345678}"
PROFILE="${3:-ivanov-nikolai}"

LOGIN_RESP=$(curl -sS -X POST "http://localhost/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\"}")

ADMIN_TOKEN=$(python3 -c 'import json,sys; print(json.loads(sys.stdin.read()).get("token",""))' <<<"$LOGIN_RESP")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "No token in login response"; echo "$LOGIN_RESP"; exit 1
fi

curl -sS -D /tmp/qr_png_headers.txt -o /tmp/qr.png \
  "http://localhost/api/profiles/${PROFILE}/qr.png" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

curl -sS -D /tmp/qr_pdf_headers.txt -o /tmp/qr.pdf \
  "http://localhost/api/profiles/${PROFILE}/qr.pdf" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

head -n 1 /tmp/qr_png_headers.txt
head -n 1 /tmp/qr_pdf_headers.txt
file /tmp/qr.png /tmp/qr.pdf
ls -lh /tmp/qr.png /tmp/qr.pdf
