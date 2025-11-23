#!/bin/bash

# Exit on error
set -e

echo "🗄️  Syncing database schema..."
# Use db push for first deployment, it will create tables from schema
npx prisma db push --accept-data-loss

echo "🌱 Seeding database (automatic, idempotent)..."
npx prisma db seed || echo "⚠️  Seeding skipped or failed (non-critical)"

echo "🚀 Starting application..."
npm run start:prod
