#!/bin/bash

# Exit on error
set -e

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database (automatic, idempotent)..."
npx prisma db seed || echo "⚠️  Seeding skipped or failed (non-critical)"

echo "🚀 Starting application..."
npm run start:prod
