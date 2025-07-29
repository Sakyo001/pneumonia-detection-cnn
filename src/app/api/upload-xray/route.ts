import { NextRequest, NextResponse } from 'next/server';
import { analyzeXrayImage } from '@/lib/analysis';
import { prisma } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';
import { getUserFromCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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
        delayMs *= 2;
      }
    }
  }
  return false;
}

// Helper function to generate a unique reference number
async function generateUniqueReferenceNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = new Date();
    const dateStr = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const refNumber = `XR-${dateStr}-${randomPart}`;
    
    const existing = await prisma.xrayScan.findUnique({
      where: { referenceNumber: refNumber }
    });
    
    if (!existing) {
      return refNumber;
    }
  }
  
  return `XR-${new Date().getTime().toString().slice(-6)}-${uuidv4().slice(0, 6)}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting X-ray upload process");
    
    // Test database connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json({ 
        error: "Database connection failed. Please try again later.",
        dbSaved: false
      }, { status: 500 });
    }
    
    // Extract form data
    const formData = await request.formData();
    
    // Extract the file from formData
    const file = formData.get('xrayFile') as File | null;
    if (!file) {
      return NextResponse.json({ error: "No X-ray image provided" }, { status: 400 });
    }
    
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
    
    // Convert file to Buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    let cloudinaryUrl = '';
    let cloudinaryPublicId = '';
    
    try {
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
      cloudinaryUrl = '';
    }
    
    // Analyze the X-ray using the EfficientNet model
    const analysisResult = await analyzeXrayImage(file, {
      name: patientName,
      age: patientAge,
      gender: patientGender,
      referenceNumber: referenceNumber,
    }, {
      useMock: false
    });
    
    if (!analysisResult) {
      return NextResponse.json({ error: "Analysis returned empty result" }, { status: 500 });
    }

    console.log("Analysis result diagnosis:", analysisResult.diagnosis);
    console.log("Full analysis result:", JSON.stringify(analysisResult, null, 2));

    // Check if this is a validation-only result (NON_XRAY, COVID, TB)
    const validationOnlyResults = ["NON_XRAY", "COVID", "TB"];
    const isValidationOnly = validationOnlyResults.includes(analysisResult.prediction || "");
    
    console.log("=== VALIDATION CHECK DEBUG ===");
    console.log("Analysis result prediction:", analysisResult.prediction);
    console.log("Validation only results:", validationOnlyResults);
    console.log("Is validation only:", isValidationOnly);
    console.log("=================================");
    
    if (isValidationOnly) {
      console.log("Validation-only result detected, not saving to database:", analysisResult.prediction);
      return NextResponse.json({
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
      });
    }

    // Get current doctor ID
    const user = await getUserFromCookie();
    const doctorId = user?.id;
    
    if (!doctorId) {
      console.error("No doctor ID found - user may not be logged in");
      return NextResponse.json({
        prediction: analysisResult.prediction,
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
        error: "User not logged in. Please log in to save analysis results to database."
      });
    }

    // Validate required data
    if (!referenceNumber || !analysisResult.diagnosis) {
      return NextResponse.json({
        prediction: analysisResult.prediction,
        confidence: analysisResult.confidence,
        pneumoniaType: analysisResult.pneumoniaType,
        severity: analysisResult.severity,
        severityDescription: analysisResult.severityDescription,
        recommendedAction: analysisResult.recommendedAction,
        imageUrl: cloudinaryUrl || "",
        referenceNumber: referenceNumber || "ERROR-" + Date.now(),
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false,
        error: "Missing required data for database save"
      });
    }

    // Check if patient exists or create new one
    let patient = await prisma.patient.findFirst({
      where: {
        name: patientName,
        doctorId: doctorId
      }
    });

    if (!patient) {
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

    // Save X-ray scan data to database
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        const isConnected = await testDatabaseConnection(1, 500);
        if (!isConnected) {
          throw new Error("Database connection lost");
        }
        
        const existingScan = await prisma.xrayScan.findUnique({
          where: { referenceNumber: referenceNumber }
        });

        const finalReferenceNumber = existingScan ? await generateUniqueReferenceNumber() : referenceNumber;
        
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

        return NextResponse.json({
          prediction: analysisResult.prediction,
          confidence: analysisResult.confidence,
          pneumoniaType: analysisResult.pneumoniaType,
          severity: analysisResult.severity,
          severityDescription: analysisResult.severityDescription,
          recommendedAction: analysisResult.recommendedAction,
          imageUrl: cloudinaryUrl,
          cloudinaryPublicId,
          referenceNumber: finalReferenceNumber,
          timestamp: new Date().toISOString(),
          patientNotes,
          medicalHistory,
          symptoms: symptomsArray,
          dbSaved: true,
          scanId: xrayScan.id
        });
      } catch (error: any) {
        retryCount++;
        console.error(`Failed to save scan, attempt ${retryCount}:`, error);
        
        if (retryCount > maxRetries) {
          return NextResponse.json({
            prediction: analysisResult.prediction,
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
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
    
    return NextResponse.json({
      prediction: analysisResult.prediction,
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
    });
    
  } catch (error: any) {
    console.error("Error in uploadXray API:", error);
    return NextResponse.json({ 
      error: `Error processing X-ray: ${error.message || 'Unknown error'}`,
      referenceNumber: "ERROR",
      dbSaved: false
    }, { status: 500 });
  }
} 