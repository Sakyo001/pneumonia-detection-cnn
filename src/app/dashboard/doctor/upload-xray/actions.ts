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
    
    // Extract patient information
    const patientName = formData.get('patientName') as string;
    const patientAge = formData.get('patientAge') as string;
    const patientGender = formData.get('patientGender') as string;
    const patientNotes = formData.get('patientNotes') as string;
    
    // Get reference number from client or generate a new one if needed
    let clientReferenceNumber = formData.get('referenceNumber') as string;
    // Always ensure we have a valid reference number
    const referenceNumber = clientReferenceNumber || await generateUniqueReferenceNumber();
    
    console.log("Using reference number:", referenceNumber);
    
    // Convert file to Buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    let cloudinaryUrl = '';
    let cloudinaryPublicId = '';
    
    try {
      // Upload image to Cloudinary with folder organization
      const cloudinaryResult = await uploadImage(buffer, {
        folder: 'pneumonia-xrays',
        public_id: `xray-${referenceNumber}`,
        tags: ['xray', 'pneumonia-detection', referenceNumber]
      });
      
      cloudinaryUrl = cloudinaryResult.url;
      cloudinaryPublicId = cloudinaryResult.public_id;
      console.log(`Image uploaded to Cloudinary: ${cloudinaryUrl}`);
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

    // Get current doctor ID from cookie
    const cookieStore = await cookies();
    const doctorId = cookieStore.get("userId")?.value;
    
    if (!doctorId) {
      console.error("No doctor ID found in cookies");
      return {
        ...analysisResult,
        imageUrl: cloudinaryUrl || "", // Use Cloudinary URL if available
        referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        dbSaved: false
      };
    }

    // Validate required data before database operations
    if (!referenceNumber) {
      console.error("Missing required reference number");
      return {
        ...analysisResult,
        imageUrl: cloudinaryUrl || "", 
        referenceNumber: "ERROR-" + Date.now(),
        timestamp: new Date().toISOString(),
        patientNotes,
        dbSaved: false,
        error: "Failed to save: Missing reference number"
      };
    }

    if (!doctorId) {
      console.error("Missing required doctor ID");
      return {
        ...analysisResult,
        imageUrl: cloudinaryUrl || "",
        referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        dbSaved: false,
        error: "Failed to save: Missing doctor ID"
      };
    }

    if (!analysisResult.diagnosis) {
      console.error("Missing required diagnosis result");
      return {
        ...analysisResult,
        diagnosis: "Unknown", // Provide a fallback value
        imageUrl: cloudinaryUrl || "",
        referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
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
          referenceNumber: patientRefNumber, // Use unique reference number instead of name
          dateOfBirth: patientAge ? new Date(new Date().getFullYear() - parseInt(patientAge), 0, 1) : new Date(),
          doctor: {
            connect: {
              id: doctorId
            }
          }
        }
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
            // Store the Cloudinary URL instead of base64
            imageUrl: cloudinaryUrl,
            result: analysisResult.diagnosis,
            // Use null values or defaults for fields that don't exist in the new interface
            pneumoniaType: null,
            severity: null,
            recommendedAction: "Consult with specialist",
            status: "COMPLETED",
            metadata: {
              create: {
                confidence: analysisResult.confidence,
                pneumoniaType: null,
                severity: null,
                recommendedAction: "Consult with specialist"
              }
            }
          }
        });
        
        console.log("Successfully saved scan to database with ID:", xrayScan.id);

        // Return successful result with all data
        return {
          ...analysisResult,
          imageUrl: cloudinaryUrl, // Return the cloudinary URL
          cloudinaryPublicId, // Include public ID for potential transformations
          referenceNumber: finalReferenceNumber,
          timestamp: new Date().toISOString(),
          patientNotes,
          dbSaved: true,
          scanId: xrayScan.id
        };
      } catch (error: any) {
        retryCount++;
        console.error(`Failed to save scan, attempt ${retryCount}:`, error);
        
        if (retryCount > maxRetries) {
          // After max retries, return error but still with data
          return {
            ...analysisResult,
            imageUrl: cloudinaryUrl || "",
            referenceNumber,
            timestamp: new Date().toISOString(),
            patientNotes,
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
      ...analysisResult,
      imageUrl: cloudinaryUrl || "",
      referenceNumber,
      timestamp: new Date().toISOString(),
      patientNotes,
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