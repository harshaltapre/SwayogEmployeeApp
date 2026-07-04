#!/usr/bin/env bash
set -euo pipefail

echo "Installing backend dependencies..."
npm install --prefix backend

if [ "${RUN_PRISMA_MIGRATE:-0}" = "1" ]; then
  echo "RUN_PRISMA_MIGRATE=1 -> running prisma migrate deploy"
  npm --prefix backend run prisma:migrate:deploy
else
  echo "Skipping Prisma migrations during build (set RUN_PRISMA_MIGRATE=1 to enable)"
fi

echo "Generating Prisma client for Vercel build..."
npm run prisma:generate --prefix backend

echo "Bundling backend for Vercel..."
npm run bundle:vercel --prefix backend

echo "Building frontend with Vite..."
vite build

echo "vercel build script completed"
