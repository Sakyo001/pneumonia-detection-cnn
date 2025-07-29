import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from torchvision import transforms
from PIL import Image
import os
import argparse
import json
import csv

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

def predict_image(image_path):
    image = Image.open(image_path).convert('RGB')
    input_tensor = data_transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(input_tensor)
        _, pred = torch.max(outputs, 1)
        predicted_class = class_names[pred.item()]
    return predicted_class

def main():
    parser = argparse.ArgumentParser(description='Batch inference for EfficientNetB0 multiclass model')
    parser.add_argument('--data_dir', type=str, required=True, help='Directory with subfolders for each class')
    parser.add_argument('--output', type=str, default=None, help='Optional: path to save predictions as JSON')
    args = parser.parse_args()

    total = 0
    correct = 0
    results = []

    for class_name in os.listdir(args.data_dir):
        class_dir = os.path.join(args.data_dir, class_name)
        if not os.path.isdir(class_dir):
            continue
        for fname in os.listdir(class_dir):
            if not fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
            img_path = os.path.join(class_dir, fname)
            pred = predict_image(img_path)
            is_correct = (pred == class_name)
            results.append({'file': img_path, 'predicted': pred, 'actual': class_name, 'correct': is_correct})
            total += 1
            correct += int(is_correct)
            print(f'{img_path}: predicted={pred}, actual={class_name}, correct={is_correct}')

    accuracy = correct / total if total > 0 else 0
    print(f'\nTotal: {total}, Correct: {correct}, Accuracy: {accuracy:.4f}')
    print(f'Test Accuracy: {accuracy * 100:.2f}%')

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)

    if args.output and args.output.endswith('.csv'):
        with open(args.output, 'w', newline='') as csvfile:
            fieldnames = ['file', 'predicted', 'actual', 'correct']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for row in results:
                writer.writerow(row)

if __name__ == '__main__':
    main() 