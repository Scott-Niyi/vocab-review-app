#!/bin/bash

# Vocabulary Review System - One-Click Setup Script
# This script installs all dependencies and starts the application

set -e  # Exit on error

echo "🚀 Vocabulary Review System - Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected"
    echo "Recommended: Node.js 20+"
    echo "Continue anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully"
echo ""

# Build Electron code
echo "🔨 Building Electron code..."
npm run build:electron

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Electron code"
    exit 1
fi

echo ""
echo "✅ Build complete"
echo ""

# Success message
echo "🎉 Setup complete!"
echo ""
echo "To start the application, run:"
echo "  npm run dev"
echo ""
echo "Or use this script:"
echo "  ./setup.sh --start"
echo ""

# Auto-start if --start flag is provided
if [ "$1" = "--start" ]; then
    echo "🚀 Starting application..."
    echo ""
    npm run dev
fi
