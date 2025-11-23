#!/bin/bash

# Exit on error
set -e

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database (if needed)..."
# Uncomment the next line if you want to seed on first deploy
# npx prisma db seed

echo "🚀 Starting application..."
npm run start:prod
