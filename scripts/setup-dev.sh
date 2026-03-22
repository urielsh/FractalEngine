#!/usr/bin/env bash
# FractalEngine — Local development setup
# Run once after cloning:  bash scripts/setup-dev.sh

set -euo pipefail

echo "==> Checking Node.js..."
NODE_VERSION=$(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v' || true)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18+ required. Found: $(node -v 2>/dev/null || echo 'none')"
    exit 1
fi
echo "  Node.js $(node -v) OK"

echo "==> Installing dependencies..."
npm ci

echo "==> Running type check..."
npm run type-check

echo "==> Running tests..."
npm test

echo ""
echo "Setup complete! Run 'npm run dev' to start the dev server on port 3000."
