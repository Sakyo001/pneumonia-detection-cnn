#!/bin/bash
set -e

echo "Python version:"
python --version

echo "Installing dependencies..."
pip install -U pip setuptools wheel
pip install -r requirements.txt

# Explicitly install FastAPI and Uvicorn (in case requirements.txt had issues)
pip install fastapi uvicorn python-multipart

echo "Listing installed packages:"
pip freeze | grep -E 'fastapi|uvicorn|torch|torchvision'

echo "Build completed successfully!" 