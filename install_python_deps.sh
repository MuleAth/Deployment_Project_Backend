#!/bin/bash

# Install Python dependencies for ML recommendations
echo "Installing Python dependencies..."

# Check if pip is available
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    echo "Error: pip not found. Please install Python and pip."
    exit 1
fi

echo "Python dependencies installed successfully!"