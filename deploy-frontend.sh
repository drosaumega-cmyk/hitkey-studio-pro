#!/bin/bash

# AI Audio Studio Pro - Frontend Deployment Script
# This script deploys the frontend to Vercel (recommended)

set -e

echo "🚀 Starting AI Audio Studio Pro Frontend Deployment..."

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building for production..."
npm run build

echo "📦 Installing Vercel CLI..."
npm install -g vercel

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment completed!"
echo "🌐 Your application is now live on Vercel"
echo "⚙️  Don't forget to:"
echo "   1. Configure your custom domain in Vercel dashboard"
echo "   2. Set up environment variables in Vercel"
echo "   3. Update your DNS settings to point to Vercel"

# Alternative deployment options
echo ""
echo "🔄 Alternative Deployment Options:"
echo "   📦 Netlify: npm install -g netlify-cli && netlify deploy --prod --dir=dist"
echo "   ☁️  Cloudflare Pages: Upload dist/ folder to Cloudflare Pages dashboard"
echo "   🔧 AWS S3/CloudFront: Use AWS CLI to deploy to S3 and configure CloudFront"