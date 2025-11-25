#!/bin/bash
set -e

echo "🔨 Building client assets..."
npx vite build --config vite.config.client.ts

echo "🔨 Building Cloudflare Worker..."
npx vite build --config vite.config.worker.ts

echo "✅ Build complete!"
echo "📦 Contents of dist/:"
ls -lah dist/
