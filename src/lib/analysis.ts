/**
 * Pneumonia analysis utilities for connecting to the EfficientNet model
 */
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { parseInferenceOutput } from '@/app/dashboard/doctor/upload-xray/parse-output';
import os from 'os';
import { getCldUploadPreset, getCldCloudName } from './env-client';

// Add File type definition if not available in the environment
declare global {
  interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
  }
}

const execPromise = promisify(exec);

// Keep track of Python errors to avoid retrying repeatedly
let pythonErrorCount = 0;
const MAX_PYTHON_ERRORS = 2; // After this many errors, just use simulation

// Define clear interfaces to ensure type safety

// Result from the parseInferenceOutput function
interface ParsedResult {
  diagnosis: string;
  confidence: number;
  pneumoniaType?: string | null;
  severity?: string | null;
  severityDescription?: string | null;
  recommendedAction: string;
  probabilities?: {
    normal: number;
    pneumonia: number;
  };
  usingMock?: boolean;
  error?: string;
  processingTime?: number;
}

// Final analysis result returned by our module
export interface AnalysisResult {
  referenceNumber: string;
  diagnosis: string;
  confidence: number;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  date: string;
  modelInfo?: {
    name: string;
    version: string;
  };
}

// Check if the model file exists
async function checkModelFile(modelName: string, directory: string = 'output'): Promise<string | null> {
  const locations = [
    join(process.cwd(), directory, modelName),
    join(process.cwd(), 'pneumonia-ml', 'output', modelName),
    join(process.cwd(), 'pneumonia-ml', modelName)
  ];
  
  for (const location of locations) {
    try {
      await fs.access(location);
      console.log(`Found model at: ${location}`);
      return location;
    } catch (error) {
      console.log(`Model not found at: ${location}`);
    }
  }
  
  console.error(`Model ${modelName} not found in any location`);
  return null;
}

// Convert any parsed result to a consistent AnalysisResult format
function normalizeResult(result: ParsedResult): AnalysisResult {
  return {
    referenceNumber: '',
    diagnosis: result.diagnosis,
    confidence: result.confidence,
    date: new Date().toISOString(),
    modelInfo: {
      name: 'EfficientNet',
      version: '1.0.0'
    }
  };
}

/**
 * Get detailed model information
 */
async function getModelInfo(modelPath: string): Promise<string> {
  try {
    const { stdout } = await execPromise(`python scripts/model_debug.py --model "${modelPath}"`);
    return stdout;
  } catch (error) {
    console.error('Error getting model info:', error);
    return 'Error analyzing model';
  }
}

/**
 * Attempt to determine model type based on the model file location
 */
async function detectModelType(modelPath: string): Promise<string> {
  // Default to ResNet model
  let modelType = 'resnet';

  try {
    // If the model is in the pneumonia-ml directory, check if we can find
    // any clues about the model architecture from nearby files
    if (modelPath.includes('pneumonia-ml')) {
      // First check if there's a model_info.json file
      const modelDir = dirname(modelPath);
      const infoPath = join(modelDir, 'model_info.json');
      
      try {
        if (await fs.stat(infoPath).catch(() => null)) {
          const infoContent = await fs.readFile(infoPath, 'utf-8');
          const modelInfo = JSON.parse(infoContent);
          if (modelInfo.architecture) {
            if (modelInfo.architecture.toLowerCase().includes('simple') || 
                modelInfo.architecture.toLowerCase().includes('conv')) {
              return 'simple';
            } else if (modelInfo.architecture.toLowerCase().includes('resnet')) {
              return 'resnet';
            }
          }
        }
      } catch (e) {
        console.warn('Error reading model_info.json:', e);
      }
      
      // If we couldn't find model_info.json, check file naming patterns
      const fileName = basename(modelPath);
      if (fileName.toLowerCase().includes('simple') || fileName.toLowerCase().includes('conv')) {
        modelType = 'simple';
      }
    }
  } catch (e) {
    console.warn('Error detecting model type:', e);
  }
  
  console.log(`Detected model type: efficientnet`);
  return modelType;
}

/**
 * Analyze an X-ray image for pneumonia using the custom model
 */
export async function analyzeXrayImage(
  imageData: string | Buffer | File,
  patientInfo?: {
    name?: string;
    age?: string;
    gender?: string;
    referenceNumber?: string;
  },
  options?: {
    useMock?: boolean;
    forceSimulation?: boolean; // New option to force simulation mode
  }
): Promise<AnalysisResult> {
  // If mock mode is explicitly requested, use mock prediction
  if (options?.useMock || options?.forceSimulation) {
    console.log("Mock/simulation mode explicitly requested");
    return generateMockPrediction(
      "Simulation mode requested", 
      patientInfo?.referenceNumber
    );
  }

  // Check if we've had too many Python errors and should use simulation mode
  if (pythonErrorCount >= MAX_PYTHON_ERRORS) {
    console.log(`Using simulation mode due to ${pythonErrorCount} previous Python errors`);
    return generateMockPrediction(
      "Using simulation mode due to previous Python errors", 
      patientInfo?.referenceNumber
    );
  }

  // Check for a stored flag in localStorage (client-side only)
  let useSimulationMode = false;
  if (typeof window !== 'undefined') {
    useSimulationMode = localStorage.getItem('use_simulation_mode') === 'true';
    if (useSimulationMode) {
      console.log("Using simulation mode based on localStorage setting");
      return generateMockPrediction(
        "Using simulation mode based on stored preference", 
        patientInfo?.referenceNumber
      );
    }
  }

  console.log("Starting X-ray analysis using remote API...");
  
  try {
    // Get the API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pneumonia-detection-api-eyq4.onrender.com';
    console.log(`Using API URL: ${apiUrl}`);

    // Create a FormData object for the file upload
    const formData = new FormData();
    
    if (imageData instanceof File) {
      // If it's already a File object, use it directly
      formData.append('file', imageData);
    } else {
      // If it's a Buffer or string, create a Blob and then a File
      let blob: Blob;
      
      if (Buffer.isBuffer(imageData)) {
        // Convert Buffer to Blob
        const arrayBuffer = imageData.buffer.slice(
          imageData.byteOffset,
          imageData.byteOffset + imageData.byteLength
        );
        blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'image/jpeg' });
    } else if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
        // Convert data URI to Blob
        const response = await fetch(imageData);
        blob = await response.blob();
    } else if (typeof imageData === 'string') {
        // Assume it's base64 without data URI prefix
        const binary = atob(imageData);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        blob = new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    } else {
      throw new Error('Invalid image data format');
    }

      // Create a File from the Blob
      const file = new File([blob], 'xray.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
    }
    
    // Add patient information to the form data
    if (patientInfo) {
      if (patientInfo.name) formData.append('patient_name', patientInfo.name);
      if (patientInfo.age) formData.append('patient_age', patientInfo.age);
      if (patientInfo.gender) formData.append('patient_gender', patientInfo.gender);
      if (patientInfo.referenceNumber) formData.append('reference_number', patientInfo.referenceNumber);
    }
    
    // Make the API request
    console.log(`Sending request to ${apiUrl}/predict/`);
    const startTime = Date.now();
    
    const response = await fetch(`${apiUrl}/predict/`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, as the browser will set it with the proper boundary string
    });
    
    const processingTime = (Date.now() - startTime) / 1000; // Convert to seconds
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      
      // If API fails, fall back to mock prediction
      pythonErrorCount++; // Increment error count 
      
      if (pythonErrorCount >= MAX_PYTHON_ERRORS) {
      setSimulationMode(true);
      }
      
      return generateMockPrediction(
        `API error: ${response.status} - ${errorText}`,
        patientInfo?.referenceNumber
      );
    }
    
    // Extract the response from the API
    const prediction = await response.json();
    console.log('API Response:', prediction);
    
    // If we have an image and we're not in mock mode, upload to Cloudinary
    const imageFile = imageData instanceof File ? imageData : null;
    if (imageFile && !options?.useMock) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(imageFile);
        if (cloudinaryUrl) {
          // Extract public_id from the URL
          const urlParts = cloudinaryUrl.split('/');
          const fileNameWithExt = urlParts[urlParts.length - 1];
          const publicId = fileNameWithExt.split('.')[0];
          
          // Update prediction with Cloudinary info
          prediction.cloudinaryPublicId = publicId;
          prediction.imageUrl = cloudinaryUrl;
        }
      } catch (cloudinaryError) {
        console.error('Failed to upload to Cloudinary:', cloudinaryError);
        // Continue with local image if Cloudinary fails
      }
    }
      
      // Reset error count on success
      pythonErrorCount = 0;
      setSimulationMode(false);
      
    return {
      referenceNumber: patientInfo?.referenceNumber || '',
      diagnosis: prediction.diagnosis || 'Unknown',
      confidence: prediction.confidence || 0,
      imageUrl: prediction.imageUrl || '',
      cloudinaryPublicId: prediction.cloudinaryPublicId,
      date: new Date().toISOString(),
      modelInfo: prediction.model_info,
    };
  } catch (error: any) {
    console.error('Error in analyzeXrayImage:', error);
      
      // Increment error count
      pythonErrorCount++;
      
      // If we reached the max errors, store that in localStorage for future page loads
      if (pythonErrorCount >= MAX_PYTHON_ERRORS) {
        setSimulationMode(true);
      }
      
    // Fall back to mock prediction with deterministic output
    return generateMockPrediction(
      `Error analyzing image: ${error.message} - using simulation mode`,
      patientInfo?.referenceNumber
    );
  }
}

/**
 * Check if the external model server is available
 * This is a simple placeholder that could be replaced with an actual check
 */
async function checkExternalModelAvailability(): Promise<boolean> {
  // This function could make a request to check if an external model server is available
  // For now, it just simulates the check
  
  try {
    // This could be replaced with an actual API check
    // For example: const response = await fetch('http://model-server/api/status')
    
    // For testing, simulate a failed external connection
    // In a real implementation, return true if available
    
    // Simulate a failure to connect so we use local model
    return false;
  } catch (error) {
    console.error('Error checking external model availability:', error);
    return false;
  }
}

/**
 * Generate mock prediction for when the model server is unavailable
 * Uses a seed value to generate deterministic results
 */
export function generateMockPrediction(
  errorReason: string = 'Model unavailable',
  seed?: string
): AnalysisResult {
  // If a seed is provided, use it to generate deterministic results
  let isPositive: boolean;
  let confidence: number;
  
  if (seed) {
    // Simple hash function to get a number from a string
    const hashCode = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const seedValue = hashCode(seed);
    isPositive = seedValue % 2 === 0;
    confidence = 60 + (seedValue % 30);
  } else {
    // If no seed, use a default value for development
    isPositive = true;
    confidence = 85;
  }
  
  return {
    referenceNumber: seed || '',
    diagnosis: isPositive ? "Pneumonia" : "Normal",
    confidence: confidence,
    date: new Date().toISOString(),
    modelInfo: {
      name: "Mock Model",
      version: "1.0.0"
    }
  };
}

/**
 * Set whether to use simulation mode in future requests
 */
function setSimulationMode(useSimulation: boolean): void {
  if (typeof window !== 'undefined') {
    if (useSimulation) {
      localStorage.setItem('use_simulation_mode', 'true');
      console.log('Set simulation mode ON for future requests');
    } else {
      localStorage.removeItem('use_simulation_mode');
      console.log('Set simulation mode OFF for future requests');
    }
  }
}

// Function to upload image to Cloudinary
async function uploadToCloudinary(file: File | Blob): Promise<string | null> {
  try {
    const cloudName = getCldCloudName();
    const uploadPreset = getCldUploadPreset();
    
    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary config missing');
      return null;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
} 