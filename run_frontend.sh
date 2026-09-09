#!/bin/bash

set -e

PROJECT="$HOME/digital-youth-platform"
FRONTEND="$PROJECT/frontend"

cd "$PROJECT"

echo "========================================"
echo "🚀 DIGITAL YOUTH PLATFORM"
echo "========================================"
echo
echo "📁 Project:  $PROJECT"
echo "📁 Frontend: $FRONTEND"
echo

if [ ! -f "$FRONTEND/package.json" ]; then
  echo "❌ frontend/package.json not found"
  exit 1
fi

echo "🔨 Building frontend..."
cd "$FRONTEND"
npm run build

echo
echo "========================================"
echo "✅ BUILD PASSED"
echo "========================================"
echo
echo "🚀 Starting development server..."
echo

npm run dev
