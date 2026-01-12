#!/bin/bash

# AI Audio Studio Pro - Production Deployment Script
# This script deploys the backend to Cloudflare Workers

set -e

echo "🚀 Starting AI Audio Studio Pro Backend Deployment..."

# Navigate to backend directory
cd backend

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Creating D1 Database..."
npx wrangler d1 create ai-audio-studio-db || echo "Database may already exist"

echo "🔑 Creating KV Namespaces..."
npx wrangler kv:namespace create SESSIONS || echo "SESSIONS KV may already exist"
npx wrangler kv:namespace create CACHE || echo "CACHE KV may already exist"

echo "🔧 Updating wrangler.toml with database and KV IDs..."
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Update wrangler.toml with the database_id from the D1 creation command"
echo "   2. Update wrangler.toml with the KV namespace IDs"
echo "   3. Set your environment variables (JWT_SECRET, STRIPE keys, etc.)"

echo "🗄️ Applying database migrations..."
npx wrangler d1 migrations apply ai-audio-studio-db --remote

echo "🚀 Deploying to Cloudflare Workers..."
npx wrangler deploy --env production

echo "✅ Backend deployment completed!"
echo "🌐 Your API is now available at: https://ai-audio-studio-backend-prod.your-subdomain.workers.dev"
echo "🔍 Test the health endpoint: curl https://ai-audio-studio-backend-prod.your-subdomain.workers.dev/health"