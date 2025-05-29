# First, try to import the required modules
# If they fail, provide helpful error messages
try:
    from fastapi import FastAPI, File, UploadFile, Form, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
except ImportError as e:
    print(f"ERROR: Failed to import FastAPI or Uvicorn. {str(e)}")
    print("Please make sure to install them with: pip install fastapi uvicorn")
    # Try to install them on the fly
    import subprocess
    try:
        subprocess.check_call(["pip", "install", "fastapi", "uvicorn", "python-multipart"])
        from fastapi import FastAPI, File, UploadFile, Form, HTTPException
        from fastapi.middleware.cors import CORSMiddleware
        import uvicorn
        print("SUCCESS: Installed missing packages.")
    except Exception as install_error:
        print(f"ERROR: Failed to install packages: {str(install_error)}")
        import sys
        sys.exit(1)

try:
    import torch
    import io
    from PIL import Image
    import numpy as np
    from torchvision import transforms
    from model import PneumoniaModel, SimpleConvNet
except ImportError as e:
    print(f"ERROR: Failed to import PyTorch or related modules. {str(e)}")
    print("Please make sure to install them with: pip install torch torchvision pillow numpy")

import os
import json
from typing import Optional
from pydantic import BaseModel
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Pneumonia Detection API", 
              description="API for pneumonia detection using deep learning", 
              version="1.0.0")

# Add CORS middleware to allow cross-origin requests
# Temporarily using wildcard for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model to None - will be loaded on startup
model = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class PredictionResponse(BaseModel):
    diagnosis: str
    confidence: float
    pneumoniaType: Optional[str] = None
    severity: Optional[str] = None
    severityDescription: Optional[str] = None
    recommendedAction: str
    processingTime: float
    probabilities: dict

@app.on_event("startup")
async def startup_event():
    global model
    
    # Get model path from environment variable
    model_path_env = os.getenv('MODEL_PATH', 'best_model.pth')
    
    # List of possible model file locations
    model_paths = [
        model_path_env,
        os.path.join(".", model_path_env),
        os.path.join("models", model_path_env),
        os.path.join("..", "output", model_path_env),
        os.path.join("..", "output", "best_model.pth"),
        os.path.join("..", "output", "final_model.pth")
    ]
    
    # Find the first existing model file
    model_path = None
    for path in model_paths:
        if os.path.exists(path):
            model_path = path
            logger.info(f"Found model at: {model_path}")
            break
    
    if not model_path:
        # Search for any .pth files in the directory
        logger.warning("Model not found in expected locations, searching for any .pth files")
        for root, _, files in os.walk("."):
            for file in files:
                if file.endswith(".pth"):
                    model_path = os.path.join(root, file)
                    logger.info(f"Found model file: {model_path}")
                    break
            if model_path:
                break
    
    if not model_path:
        logger.error("No model file found!")
        raise RuntimeError("No model file found in any location")
    
    # Print files in current directory for debugging
    logger.info(f"Current directory contents: {os.listdir('.')}")
    
    try:
        logger.info(f"Loading model from {model_path} using {device}")
        # First try to load with PneumoniaModel
        try:
            logger.info("Attempting to load with PneumoniaModel...")
            model = PneumoniaModel(pretrained=False, freeze_backbone=False)
            state_dict = torch.load(model_path, map_location=device)
            model.load_state_dict(state_dict)
            model.to(device)
            model.eval()
            logger.info("Successfully loaded model with PneumoniaModel")
        except Exception as e:
            logger.error(f"Error loading with PneumoniaModel: {e}")
            # Try SimpleConvNet as fallback
            logger.info("Attempting to load with SimpleConvNet...")
            model = SimpleConvNet()
            state_dict = torch.load(model_path, map_location=device)
            model.load_state_dict(state_dict)
            model.to(device)
            model.eval()
            logger.info("Successfully loaded model with SimpleConvNet")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise RuntimeError(f"Could not load the model: {e}")

def preprocess_image(image_bytes):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    return transform(image).unsqueeze(0)  # Add batch dimension

@app.get("/")
def read_root():
    # Show information about the environment and model status
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    
    # Check if model is loaded
    model_status = "loaded" if model is not None else "not loaded"
    
    # Get current directory contents
    try:
        dir_contents = os.listdir('.')
    except Exception as e:
        dir_contents = f"Error listing directory: {str(e)}"
    
    return {
        "message": "Pneumonia Detection API is running",
        "status": "healthy",
        "python_version": python_version,
        "model_status": model_status,
        "device": str(device),
        "current_directory": os.getcwd(),
        "directory_contents": dir_contents,
        "environment_variables": {
            "MODEL_PATH": os.getenv("MODEL_PATH", "not set"),
            "PORT": os.getenv("PORT", "not set"),
        }
    }

@app.get("/health")
def health_check():
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict/", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None),
    patient_age: Optional[str] = Form(None),
    patient_gender: Optional[str] = Form(None),
    reference_number: Optional[str] = Form(None)
):
    import time
    start_time = time.time()
    
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Check if file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image bytes
    image_bytes = await file.read()
    
    try:
        # Preprocess the image
        image_tensor = preprocess_image(image_bytes)
        image_tensor = image_tensor.to(device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            predicted_class = torch.max(outputs, 1)[1].item()
        
        # Convert to numpy for easier handling
        probs = probabilities[0].cpu().numpy()
        
        # Process results
        diagnosis = "Pneumonia" if predicted_class == 1 else "Normal"
        confidence = float(probs[predicted_class]) * 100
        
        # Create result dictionary
        result = {
            "diagnosis": diagnosis,
            "confidence": round(confidence, 2),
            "processingTime": round(time.time() - start_time, 2),
            "probabilities": {
                "normal": round(float(probs[0]) * 100, 2),
                "pneumonia": round(float(probs[1]) * 100, 2)
            }
        }
        
        # Add pneumonia specific info if positive
        if diagnosis == "Pneumonia":
            # Determine pneumonia type based on confidence
            pneumonia_type = "Bacterial" if confidence > 75 else "Viral"
            # Determine severity based on confidence
            if confidence > 90:
                severity = "Severe"
                severity_desc = "Severe pneumonia with significant lung involvement."
                action = "Immediate medical consultation and treatment recommended."
            elif confidence > 80:
                severity = "Moderate"
                severity_desc = "Moderate pneumonia with partial lung involvement."
                action = "Medical consultation recommended to determine appropriate treatment."
            else:
                severity = "Mild"
                severity_desc = "Mild pneumonia with limited lung involvement."
                action = "Monitor symptoms and consult with a healthcare provider."
                
            result["pneumoniaType"] = pneumonia_type
            result["severity"] = severity
            result["severityDescription"] = severity_desc
            result["recommendedAction"] = action
        else:
            result["recommendedAction"] = "No pneumonia detected. Regular health maintenance recommended."
        
        return result
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

if __name__ == "__main__":
    # Get port from environment variable or use default 8000
    port = int(os.getenv("PORT", 8000))
    
    # Print diagnostic information
    print(f"Starting server on port {port}")
    print(f"Python version: {sys.version}")
    print(f"PyTorch version: {torch.__version__}")
    print(f"Device: {device}")
    print(f"Working directory: {os.getcwd()}")
    
    try:
        uvicorn.run("app:app", host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print(f"Error starting server: {e}")
        # Try alternative method
        print("Trying alternative method...")
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", str(port)])
        except Exception as alt_e:
            print(f"Alternative method failed: {alt_e}")
            print("Exiting with error.")
            sys.exit(1) 