#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --build backend >/dev/null
sleep 4

ADMIN_TOKEN=$(
  curl -s -X POST 'http://localhost/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@test.com","password":"12345678"}' \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{console.log(JSON.parse(s).token)})'
)

PROFILE_SLUG="${1:-ivanov-nikolai}"
echo "profile=$PROFILE_SLUG"

GEN=$(
  curl -s -X POST "http://localhost/api/profiles/${PROFILE_SLUG}/access-codes" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -d '{"label":"smoke","expiresInDays":1}'
)

# debug ok + id only (не печатаем plaintextCode)
echo "$GEN" | node -e '
let s="";process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{
  const j=JSON.parse(s||"{}");
  console.log("GEN.ok =", j.ok);
  console.log("GEN.data.id =", j?.data?.id);
})'

CODE_ID=$(echo "$GEN" | node -e '
let s="";process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{
  const j=JSON.parse(s||"{}");
  const id = (j.ok===true && j.data && j.data.id) ? j.data.id : "";
  process.stdout.write(id);
})')

if [ -z "$CODE_ID" ]; then
  echo "Generate code failed. Full response:"
  echo "$GEN"
  exit 1
fi
echo "codeId=$CODE_ID"

curl -s -X POST "http://localhost/api/profiles/${PROFILE_SLUG}/access-codes/${CODE_ID}/revoke" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" >/dev/null

curl -s -X DELETE "http://localhost/api/profiles/${PROFILE_SLUG}/access-codes/${CODE_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" >/dev/null

curl -s 'http://localhost/api/admin/audit-logs?page=1&limit=12' \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  | node -e '
let s="";process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{
  const j=JSON.parse(s||"{}");
  const rows=(j.rows||[]).slice(0,10);
  console.log(rows.map(r=>`${r.action}:${r.entityType||""}:${r.entityId||""}`).join("\n"));
})'

echo "[ok] smoke A2.2 done"
