#!/bin/bash

# AI Audio Studio Pro Backend Deployment Script
# This script deploys the backend to Cloudflare Workers

set -e

echo "🚀 Starting AI Audio Studio Pro Backend Deployment..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler auth login
fi

# Set environment
ENVIRONMENT=${1:-development}
echo "📦 Deploying to environment: $ENVIRONMENT"

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Run database migrations for production
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🗄️ Running database migrations..."
    npm run db:migrate
fi

# Deploy to Cloudflare Workers
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌍 Deploying to production..."
    wrangler deploy --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "🧪 Deploying to staging..."
    wrangler deploy --env development
else
    echo "🔧 Deploying to development..."
    wrangler dev --local --port 8787
fi

echo "✅ Deployment completed successfully!"

if [ "$ENVIRONMENT" != "development" ]; then
    echo "🌐 Your backend is now live at: https://ai-audio-studio-backend.$ENVIRONMENT.workers.dev"
    echo "📊 View logs with: wrangler tail --env $ENVIRONMENT"
fi