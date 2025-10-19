"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { analyzeXrayImage } from '@/lib/analysis';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { uploadImage } from '@/lib/cloudinary';
import { getUserFromCookie } from '@/lib/auth';
import type { SymptomData } from './symptom-scoring';
import { calculateSymptomScore, adjustConfidenceWithSymptoms, generateClinicalSummary } from './symptom-scoring';

// Helper function to test database connection with retries
async function testDatabaseConnection(maxRetries = 3, delayMs = 1000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${maxRetries}`);
      await prisma.$queryRaw`SELECT 1`;
      console.log("Database connection successful");
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Increase delay for next attempt (exponential backoff)
        delayMs *= 2;
      }
    }
  }
  return false;
}

// Helper function to generate a unique reference number
async function generateUniqueReferenceNumber(): Promise<string> {
  // Try up to 5 times to generate a unique number
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate a reference number format: XR-YYMMDD-RANDOM
    const now = new Date();
    const dateStr = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const refNumber = `XR-${dateStr}-${randomPart}`;
    
    // Check if this reference number already exists
    const existing = await prisma.xrayScan.findUnique({
      where: { referenceNumber: refNumber }
    });
    
    // If no existing scan with this reference, return it
    if (!existing) {
      return refNumber;
    }
  }
  
  // If all attempts failed, use UUID-based approach as fallback
  return `XR-${new Date().getTime().toString().slice(-6)}-${uuidv4().slice(0, 6)}`;
}

// Function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

// Use the analyze API route to connect to the EfficientNet model
export async function uploadXray(formData: FormData) {
  try {
    console.log("Starting X-ray upload process");
    
    // Test database connection with retries
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("Failed to establish database connection after multiple attempts");
      return { 
        error: "Database connection failed. Please try again later.",
        dbSaved: false
      };
    }
    
    // Extract the file from formData
    const file = formData.get('xrayFile') as File | null;
    if (!file) {
      return { error: "No X-ray image provided" };
    }
    
    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      return { error: "Invalid file type. Please upload an image (PNG, JPG, JPEG) or PDF." };
    }
    
    // Validate file size (10MB for images, 50MB for PDFs)
    const maxSize = isPDF ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: `File size exceeds ${isPDF ? '50MB' : '10MB'} limit.` };
    }
    
    console.log(`Processing ${isPDF ? 'PDF' : 'image'} file: ${file.name}`);
    
    // Extract patient information
    const patientName = formData.get('patientName') as string;
    const patientAge = formData.get('patientAge') as string;
    const patientGender = formData.get('patientGender') as string;
    const patientNotes = formData.get('patientNotes') as string;
    const medicalHistory = formData.get('medicalHistory') as string;
    const patientLocation = formData.get('patientLocation') as string;
    const region = formData.get('region') as string;
    const city = formData.get('city') as string;
    const barangay = formData.get('barangay') as string;
    const reportedSymptoms = formData.get('reportedSymptoms') as string;
    
    // Parse enhanced symptom data
    const symptomDataString = formData.get('symptomData') as string;
    let symptomData: SymptomData | null = null;
    try {
      if (symptomDataString) {
        symptomData = JSON.parse(symptomDataString);
      }
    } catch (error) {
      console.error("Error parsing symptom data:", error);
    }
    
    // Parse reported symptoms from JSON string
    let symptomsArray: string[] = [];
    try {
      if (reportedSymptoms) {
        symptomsArray = JSON.parse(reportedSymptoms);
      }
    } catch (error) {
      console.error("Error parsing reported symptoms:", error);
      symptomsArray = [];
    }
    
    // Get reference number from client or generate a new one
    const clientReferenceNumber = formData.get('referenceNumber') as string;
    const referenceNumber = clientReferenceNumber || await generateUniqueReferenceNumber();
    
    console.log("Using reference number:", referenceNumber);
    
    // Convert file to Buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    let cloudinaryUrl = '';
    let cloudinaryPublicId = '';
    
    try {
      // Upload file to Cloudinary with folder organization
      const cloudinaryResult = await uploadImage(buffer, {
        folder: isPDF ? 'pneumonia-xray-reports' : 'pneumonia-xrays',
        public_id: `xray-${referenceNumber}`,
        tags: ['xray', 'pneumonia-detection', referenceNumber, isPDF ? 'pdf-report' : 'image']
      });
      
      cloudinaryUrl = cloudinaryResult.url;
      cloudinaryPublicId = cloudinaryResult.public_id;
      console.log(`File uploaded to Cloudinary: ${cloudinaryUrl}`);
    } catch (cloudinaryError) {
      console.error("Error uploading to Cloudinary:", cloudinaryError);
      // Continue with analysis but note the error
      cloudinaryUrl = ''; // Will use URL preview in this case
    }
    
    // Analyze the X-ray using the EfficientNet model directly
    const analysisResult = await analyzeXrayImage(file, {
      name: patientName,
      age: patientAge,
      gender: patientGender,
      referenceNumber: referenceNumber,
    }, {
      // Enable this if you want to use mock predictions instead of real model inference
      useMock: false
    });
    
    if (!analysisResult) {
      throw new Error("Analysis returned empty result");
    }

    console.log("Analysis result diagnosis:", analysisResult.diagnosis);
    console.log("Full analysis result:", JSON.stringify(analysisResult, null, 2));

    // Map diagnosis to prediction if prediction is missing
    console.log("[DEBUG] Before mapping - Has prediction?", !!analysisResult.prediction, "Diagnosis:", analysisResult.diagnosis);
    if (!analysisResult.prediction && analysisResult.diagnosis) {
      // Map diagnosis to standard prediction format
      if (analysisResult.diagnosis === 'Normal' || analysisResult.diagnosis === 'NORMAL') {
        analysisResult.prediction = 'NORMAL';
      } else if (analysisResult.diagnosis === 'Pneumonia' || analysisResult.diagnosis === 'PNEUMONIA') {
        // Map based on pneumoniaType if available
        if (analysisResult.pneumoniaType === 'Bacterial') {
          analysisResult.prediction = 'BACTERIAL_PNEUMONIA';
        } else if (analysisResult.pneumoniaType === 'Viral') {
          analysisResult.prediction = 'VIRAL_PNEUMONIA';
        } else {
          analysisResult.prediction = 'BACTERIAL_PNEUMONIA'; // Default to bacterial
        }
      } else {
        analysisResult.prediction = 'NORMAL'; // Default fallback
      }
      console.log("[DEBUG] Mapped diagnosis to prediction:", analysisResult.prediction);
    } else if (analysisResult.prediction) {
      console.log("[DEBUG] Prediction already exists:", analysisResult.prediction);
    } else {
      console.log("[DEBUG] No diagnosis to map from");
    }

    // Apply symptom-based confidence adjustment if symptom data is provided
    let adjustedConfidence = analysisResult.confidence;
    let symptomScore = 0;
    let clinicalCorrelation: 'strong' | 'moderate' | 'weak' | 'conflicting' | undefined;
    let clinicalRecommendation = '';
    let confidenceBreakdown: any = null;
    let clinicalSummary = '';
    
    if (symptomData) {
      console.log("Applying symptom-based confidence adjustment...");
      
      // Generate clinical summary
      clinicalSummary = generateClinicalSummary(symptomData);
      console.log("Clinical summary:", clinicalSummary);
      
      // Map model prediction to expected format
      let modelPrediction: 'NORMAL' | 'BACTERIAL_PNEUMONIA' | 'VIRAL_PNEUMONIA';
      if (analysisResult.diagnosis === 'NORMAL' || analysisResult.prediction === 'NORMAL') {
        modelPrediction = 'NORMAL';
      } else if (analysisResult.pneumoniaType === 'Bacterial' || analysisResult.prediction === 'BACTERIA') {
        modelPrediction = 'BACTERIAL_PNEUMONIA';
      } else if (analysisResult.pneumoniaType === 'Viral' || analysisResult.prediction === 'VIRUS') {
        modelPrediction = 'VIRAL_PNEUMONIA';
      } else {
        // Default to model's prediction
        modelPrediction = 'NORMAL';
      }
      
      // Calculate symptom-adjusted confidence
      const adjustmentResult = adjustConfidenceWithSymptoms(
        modelPrediction,
        analysisResult.confidence ?? 0.80,
        symptomData
      );
      
      adjustedConfidence = adjustmentResult.adjustedConfidence;
      symptomScore = adjustmentResult.symptomScore;
      clinicalCorrelation = adjustmentResult.clinicalCorrelation;
      clinicalRecommendation = adjustmentResult.recommendation;
      confidenceBreakdown = adjustmentResult.confidenceBreakdown;
      
      console.log("Symptom analysis results:", {
        originalConfidence: analysisResult.confidence,
        adjustedConfidence,
        symptomScore,
        clinicalCorrelation,
        clinicalRecommendation
      });
    }

    // Check if this is a validation-only result (NON_XRAY, COVID, TB)
    const validationOnlyResults = ["NON_XRAY", "COVID", "TB"];
    const isValidationOnly = validationOnlyResults.includes(analysisResult.prediction || "");
    
    if (isValidationOnly) {
      console.log("Validation-only result detected, not saving to database:", analysisResult.prediction);
      return {
        prediction: analysisResult.prediction,
        confidence: analysisResult.confidence,
        pneumoniaType: null,
        severity: null,
        severityDescription: null,
        recommendedAction: "Further evaluation required",
        imageUrl: "", // Don't save validation images
        referenceNumber: referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false, // Explicitly mark as not saved
        isValidationOnly: true
      };
    }

    // Get current doctor ID from cookie
    const user = await getUserFromCookie();
    const doctorId = user?.id;
    
    if (!doctorId) {
      console.error("No doctor ID found in cookies - user may not be logged in");
      return {
        prediction: analysisResult.prediction, // Use the original prediction from API
        confidence: analysisResult.confidence,
        pneumoniaType: analysisResult.pneumoniaType,
        severity: analysisResult.severity,
        severityDescription: analysisResult.severityDescription,
        recommendedAction: analysisResult.recommendedAction,
        imageUrl: cloudinaryUrl || "", // Use Cloudinary URL if available
        referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false,
        error: "User not logged in. Please log in to save analysis results to database."
      };
    }

    // Validate required data before database operations
    if (!referenceNumber) {
      console.error("Missing required reference number");
      return {
        prediction: analysisResult.prediction, // Use the original prediction from API
        confidence: analysisResult.confidence,
        pneumoniaType: analysisResult.pneumoniaType,
        severity: analysisResult.severity,
        severityDescription: analysisResult.severityDescription,
        recommendedAction: analysisResult.recommendedAction,
        imageUrl: cloudinaryUrl || "", 
        referenceNumber: "ERROR-" + Date.now(),
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false,
        error: "Failed to save: Missing reference number"
      };
    }

    if (!doctorId) {
      console.error("Missing required doctor ID");
      return {
        prediction: analysisResult.prediction, // Use the original prediction from API
        confidence: analysisResult.confidence,
        pneumoniaType: analysisResult.pneumoniaType,
        severity: analysisResult.severity,
        severityDescription: analysisResult.severityDescription,
        recommendedAction: analysisResult.recommendedAction,
        imageUrl: cloudinaryUrl || "",
        referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false,
        error: "Failed to save: Missing doctor ID"
      };
    }

    if (!analysisResult.diagnosis) {
      console.error("Missing required diagnosis result");
      return {
        prediction: "Unknown", // Use the original prediction from API
        confidence: analysisResult.confidence,
        pneumoniaType: analysisResult.pneumoniaType,
        severity: analysisResult.severity,
        severityDescription: analysisResult.severityDescription,
        recommendedAction: analysisResult.recommendedAction,
        imageUrl: cloudinaryUrl || "",
        referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false,
        error: "Failed to save: Missing diagnosis result"
      };
    }

    // First, check if this patient already exists by name with this doctor
    let patient = await prisma.patient.findFirst({
      where: {
        name: patientName,
        doctorId: doctorId
      }
    });

    // If patient doesn't exist, create new patient record
    if (!patient) {
      // Generate a unique patient reference number
      const patientRefNumber = `P-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      patient = await prisma.patient.create({
        data: {
          name: patientName,
          referenceNumber: patientRefNumber,
          age: patientAge ? parseInt(patientAge, 10) : null,
          gender: patientGender,
          doctor: {
            connect: {
              id: doctorId
            }
          },
          location: patientLocation,
          region: region,
          city: city,
          barangay: barangay
        } as any
      });
    } else {
      // Update existing patient record
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          age: patientAge ? parseInt(patientAge, 10) : patient.age,
          location: patientLocation,
          gender: patientGender,
          region: region,
          city: city,
          barangay: barangay
        } as any
      });
    }

    // Save X-ray scan data to database using the correct nested relation syntax
    let retryCount = 0;
    const maxRetries = 3;
    
    // Keep trying database save with exponential backoff
    while (retryCount <= maxRetries) {
      try {
        // Test connection before each attempt
        const isConnected = await testDatabaseConnection(1, 500);
        if (!isConnected) {
          throw new Error("Database connection lost");
        }
        
        // First check if a scan with this reference number already exists
        const existingScan = await prisma.xrayScan.findUnique({
          where: { referenceNumber: referenceNumber }
        });

        // If scan exists with this reference number, generate a new one
        const finalReferenceNumber = existingScan ? await generateUniqueReferenceNumber() : referenceNumber;
        
        // Include cloudinary data in database
        const xrayScan = await prisma.xrayScan.create({
          data: {
            referenceNumber: finalReferenceNumber,
            patientId: patient.id,
            doctorId: doctorId,
            imageUrl: cloudinaryUrl,
            result: analysisResult.diagnosis,
            pneumoniaType: analysisResult.pneumoniaType ?? null,
            severity: analysisResult.severity ?? null,
            confidenceScore: analysisResult.confidence ?? null,
            analysisResult: JSON.stringify(analysisResult),
            recommendedAction: analysisResult.recommendedAction ?? "Consult with specialist",
            status: "COMPLETED",
            symptoms: symptomsArray.length > 0 ? JSON.stringify(symptomsArray) : null,
            metadata: {
              create: {
                confidence: analysisResult.confidence ?? 0,
                pneumoniaType: analysisResult.pneumoniaType ?? null,
                severity: analysisResult.severity ?? null,
                recommendedAction: analysisResult.recommendedAction ?? "Consult with specialist"
              }
            },
            location: patientLocation,
            region: region,
            city: city,
            barangay: barangay
          } as any
        });
        
        console.log("Successfully saved scan to database with ID:", xrayScan.id);
        
        // Debug: Verify prediction exists before returning
        console.log("[DEBUG] About to return success - Prediction value:", analysisResult.prediction);
        console.log("[DEBUG] Return object keys:", {
          hasPrediction: !!analysisResult.prediction,
          prediction: analysisResult.prediction,
          confidence: analysisResult.confidence,
          diagnosis: analysisResult.diagnosis
        });

        // Return successful result with all data
        return {
          prediction: analysisResult.prediction, // Use the original prediction from API
          confidence: analysisResult.confidence,
          pneumoniaType: analysisResult.pneumoniaType,
          severity: analysisResult.severity,
          severityDescription: analysisResult.severityDescription,
          recommendedAction: analysisResult.recommendedAction,
          imageUrl: cloudinaryUrl, // Return the cloudinary URL
          cloudinaryPublicId, // Include public ID for potential transformations
          referenceNumber: finalReferenceNumber,
          timestamp: new Date().toISOString(),
          patientNotes,
          medicalHistory,
          symptoms: symptomsArray,
          dbSaved: true,
          scanId: xrayScan.id
        };
      } catch (error: any) {
        retryCount++;
        console.error(`Failed to save scan, attempt ${retryCount}:`, error);
        
        if (retryCount > maxRetries) {
          // After max retries, return error but still with data
          return {
            prediction: analysisResult.prediction, // Use the original prediction from API
            confidence: analysisResult.confidence,
            pneumoniaType: analysisResult.pneumoniaType,
            severity: analysisResult.severity,
            severityDescription: analysisResult.severityDescription,
            recommendedAction: analysisResult.recommendedAction,
            imageUrl: cloudinaryUrl || "",
            referenceNumber,
            timestamp: new Date().toISOString(),
            patientNotes,
            medicalHistory,
            dbSaved: false,
            error: `Failed to save to database after ${maxRetries} attempts: ${error.message || 'Unknown error'}`
          };
        }
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
    
    // This should not be reached due to the return in the try/catch block,
    // but TypeScript needs it for type safety
    return {
      prediction: analysisResult.prediction, // Use the original prediction from API
      confidence: analysisResult.confidence,
      pneumoniaType: analysisResult.pneumoniaType,
      severity: analysisResult.severity,
      severityDescription: analysisResult.severityDescription,
      recommendedAction: analysisResult.recommendedAction,
      imageUrl: cloudinaryUrl || "",
      referenceNumber,
      timestamp: new Date().toISOString(),
      patientNotes,
      medicalHistory,
      dbSaved: false,
      error: "Failed to save scan data after multiple attempts"
    };
    
  } catch (error: any) {
    console.error("Error in uploadXray:", error);
    return { 
      error: `Error processing X-ray: ${error.message || 'Unknown error'}`,
      referenceNumber: "ERROR",
      dbSaved: false
    };
  }
} 