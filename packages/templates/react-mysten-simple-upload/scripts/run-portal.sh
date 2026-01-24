#!/bin/bash
# scripts/run-portal.sh - Unified script to run Walrus Portal

# Detect home directory for both Unix and WSL
if [ -n "$USERPROFILE" ]; then
    # Convert Windows path to WSL-friendly path if needed, 
    # but here we assume we are running inside WSL bash
    PORTAL_DIR="$HOME/.walrus/portal"
else
    PORTAL_DIR="$HOME/.walrus/portal"
fi

# Navigate to the actual portal app directory
if [ -d "$PORTAL_DIR/portal" ]; then
    PORTAL_DIR="$PORTAL_DIR/portal"
fi

echo "🚀 Starting Walrus Portal in $PORTAL_DIR..."
cd "$PORTAL_DIR" || { echo "❌ Portal directory not found: $PORTAL_DIR"; exit 1; }

# Check for .env
if [ ! -f ".env" ]; then
    echo "⚠️  Walrus Portal .env file not found."
    echo "   Please make sure you have run 'pnpm setup-walrus-deploy' and configured your private key."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &>/dev/null; then
    echo "❌ Bun is not installed. Please install it first."
    exit 1
fi

# Run bun install if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules missing. Running bun install..."
    bun install || { echo "❌ Bun install failed"; exit 1; }
fi

# Start the server
bun run server
