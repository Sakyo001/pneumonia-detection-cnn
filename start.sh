#!/bin/bash
set -e

echo "Starting Pneumonia Detection API"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check if virtual environment exists and activate it
if [ -d ".venv" ]; then
  echo "Virtual environment found, activating..."
  source .venv/bin/activate
  echo "Virtual environment activated."
fi

# Check for Python packages
echo "Checking installed packages:"
pip freeze | grep -E 'fastapi|uvicorn|torch|torchvision'

# Check if the model file exists
if [ -f "$MODEL_PATH" ]; then
  echo "Model file found at $MODEL_PATH"
else
  echo "Warning: Model file not found at $MODEL_PATH"
  echo "Searching for model files:"
  find . -name "*.pth" -type f
  # If we found best_model.pth, use it
  if [ -f "best_model.pth" ]; then
    export MODEL_PATH="best_model.pth"
    echo "Using found model at $MODEL_PATH"
  fi
fi

# Make sure uvicorn is installed
if ! pip list | grep -q uvicorn; then
  echo "uvicorn not found, installing..."
  pip install uvicorn
fi

# Start the server
echo "Starting server..."
python -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} 