#!/bin/bash

# Render build script for Node.js + Python dependencies

echo "Starting build process..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Python3 found, installing Python dependencies..."
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements.txt
elif command -v python &> /dev/null; then
    echo "Python found, installing Python dependencies..."
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
else
    echo "Warning: Python not found. ML recommendation system will use fallback mode."
    echo "The application will still work, but recommendations will be limited."
fi

echo "Build process completed!"