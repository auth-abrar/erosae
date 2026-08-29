#!/usr/bin/env bash
# ==============================================================================
# Erosae.com Production Deployment Script for Hostinger
# ==============================================================================

set -e

echo "🚀 [1/5] Checking environment..."
if [ ! -f .env ]; then
  echo "❌ Error: .env file missing in current directory!"
  exit 1
fi

echo "📦 [2/5] Installing production dependencies..."
npm ci --only=production

echo "🔄 [3/5] Syncing database schema safely..."
npx prisma db push --skip-generate
npx prisma generate

echo "🏗️ [4/5] Building Next.js production application..."
npm run build

echo "♻️ [5/5] Reloading application process with PM2..."
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
  echo "✅ Application reloaded via PM2."
else
  echo "ℹ️ PM2 not detected. Start with: npm start"
fi

echo "🎉 Deployment completed successfully at $(date -u)"
