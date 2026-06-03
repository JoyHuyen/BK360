#!/bin/sh
set -e
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "[bk360-api] Applying migrations (migrate deploy)..."
  npx prisma migrate deploy
else
  echo "[bk360-api] Chưa có migration — đồng bộ schema bằng prisma db push (scaffold)."
  npx prisma db push --skip-generate
fi
echo "[bk360-api] Starting API..."
exec node dist/main.js
