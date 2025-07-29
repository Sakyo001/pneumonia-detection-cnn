import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from torchvision import transforms
from fastapi import FastAPI, File, UploadFile
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define class names in the correct order
class_names = [
    'BACTERIAL_PNEUMONIA',
    'COVID',
    'NON_XRAY',
    'NORMAL',
    'TB',
    'VIRAL_PNEUMONIA'
]

# Load model
model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
num_ftrs = model.classifier[1].in_features
model.classifier[1] = nn.Linear(num_ftrs, len(class_names))
model.load_state_dict(torch.load('best_efficientnetb0-2.pth', map_location='cpu'))
model.eval()

data_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.get("/")
async def root():
    return {
        "message": "EfficientNetB0 Validation Model API is running",
        "classes": class_names
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    input_tensor = data_transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1).cpu().numpy()[0]
        pred_idx = int(np.argmax(probabilities))
        predicted_class = class_names[pred_idx]
        confidence = float(probabilities[pred_idx]) * 100  # as percentage
    return {
        "prediction": predicted_class,
        "confidence": round(confidence, 2)
    }