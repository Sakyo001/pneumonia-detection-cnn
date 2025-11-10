import { NextRequest, NextResponse } from 'next/server';
import { analyzeXrayImage } from '@/lib/analysis';
import { prisma } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';
import { getUserFromCookie } from '@/lib/auth';
import { analyzePDFContent } from '@/lib/pdf-analysis';
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
    const patientFirstName = formData.get('patientFirstName') as string;
    const patientMiddleName = formData.get('patientMiddleName') as string;
    const patientLastName = formData.get('patientLastName') as string;
    const patientName = [patientFirstName, patientMiddleName, patientLastName].filter(Boolean).join(' ');
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
    
    // ===== NEW: Check if PDF is text-only before analysis =====
    const isPDF = file.type === 'application/pdf';
    let isTextOnlyPDF = false;
    let pdfAnalysisReason = "";
    
    if (isPDF) {
      console.log("[PDF_CHECK] Analyzing PDF content before model processing...");
      const pdfAnalysis = await analyzePDFContent(buffer);
      isTextOnlyPDF = pdfAnalysis.isTextOnly;
      pdfAnalysisReason = pdfAnalysis.reason;
      
      console.log("[PDF_CHECK] PDF Analysis Result:", {
        isTextOnly: pdfAnalysis.isTextOnly,
        hasImages: pdfAnalysis.hasImages,
        confidence: pdfAnalysis.estimatedConfidence,
        reason: pdfAnalysis.reason
      });
      
      // If text-only PDF detected, skip model analysis and return NON_XRAY validation result
      if (isTextOnlyPDF) {
        console.log("[PDF_CHECK] Text-only PDF detected - returning NON_XRAY validation result");
        return NextResponse.json({
          prediction: "NON_XRAY",
          confidence: pdfAnalysis.estimatedConfidence * 100,
          pneumoniaType: null,
          severity: null,
          severityDescription: null,
          recommendedAction: "Please upload a medical X-ray image (PNG, JPG, or scanned X-ray PDF)",
          imageUrl: "", // Don't save text PDFs
          referenceNumber: referenceNumber,
          timestamp: new Date().toISOString(),
          patientNotes,
          medicalHistory,
          dbSaved: false,
          isValidationOnly: true,
          validationReason: pdfAnalysisReason,
          message: "Text-only PDF detected. This file does not contain medical imaging content. Please upload a chest X-ray image instead."
        });
      }
    }
    // ===== END PDF CHECK =====
    
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

    // Check if this is a validation-only result (NON_XRAY, COVID, TB)
    const validationOnlyResults = ["NON_XRAY", "COVID", "TB"];
    const isValidationOnly = validationOnlyResults.includes(analysisResult.prediction || "");
    
    console.log("=== VALIDATION CHECK DEBUG ===");
    console.log("Analysis result prediction:", analysisResult.prediction);
    console.log("Validation only results:", validationOnlyResults);
    console.log("Is validation only:", isValidationOnly);
    console.log("Reported symptoms count:", symptomsArray.length);
    console.log("=================================");
    
    // ===== ADDITIONAL SAFETY CHECK: No symptoms + PDF file + uncertain diagnosis =====
    // If user didn't report any symptoms AND uploaded a PDF AND got an unusual result,
    // it's likely not a medical X-ray. Mark as validation-only for safety.
    const hasNoSymptoms = symptomsArray.length === 0;
    const hasUncertainDiagnosis = analysisResult.prediction === 'NORMAL' || 
                                   analysisResult.prediction === 'VIRAL_PNEUMONIA' ||
                                   analysisResult.prediction === 'BACTERIAL_PNEUMONIA';
    
    let shouldRejectForSafety = false;
    let rejectReason = "";
    
    if (isPDF && hasNoSymptoms && hasUncertainDiagnosis) {
      // This combination is suspicious - PDF + no symptoms + medical finding
      // Likely a text document that the model misidentified
      console.log("[SAFETY_CHECK] Suspicious combination detected:");
      console.log("  - PDF file: YES");
      console.log("  - No symptoms reported: YES");
      console.log("  - Model returned:", analysisResult.prediction);
      console.log("  → Recommendation: Treat as validation-only");
      
      shouldRejectForSafety = true;
      rejectReason = "PDF uploaded without symptom information. As a safety measure, this requires clinical verification before saving to database.";
      console.log("[SAFETY_CHECK] Marking as validation-only for safety");
    }
    
    if (isValidationOnly || shouldRejectForSafety) {
      console.log("Validation-only result detected, not saving to database:", analysisResult.prediction);
      return NextResponse.json({
        prediction: shouldRejectForSafety ? "NON_XRAY_SAFETY" : analysisResult.prediction,
        confidence: analysisResult.confidence,
        pneumoniaType: null,
        severity: null,
        severityDescription: null,
        recommendedAction: shouldRejectForSafety ? 
          "Please provide symptom information and ensure you're uploading a medical X-ray image." :
          "Further evaluation required",
        imageUrl: "", // Don't save validation images
        referenceNumber: referenceNumber,
        timestamp: new Date().toISOString(),
        patientNotes,
        medicalHistory,
        dbSaved: false, // Explicitly mark as not saved
        isValidationOnly: true,
        safetyRejected: shouldRejectForSafety,
        safetyReason: rejectReason,
        message: shouldRejectForSafety ? 
          `⚠️ Safety Check: PDF file uploaded without symptom information. Unable to verify this is a medical X-ray. ${rejectReason}` :
          undefined
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
        firstName: patientFirstName,
        lastName: patientLastName,
        doctorId: doctorId
      }
    });

    if (!patient) {
      const patientRefNumber = `P-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      patient = await prisma.patient.create({
        data: {
          firstName: patientFirstName,
          middleName: patientMiddleName || null,
          lastName: patientLastName,
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
        }
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
        
        // Debug: Verify prediction exists before returning
        console.log("[DEBUG] About to return success - Prediction value:", analysisResult.prediction);
        console.log("[DEBUG] Return object keys:", {
          hasPrediction: !!analysisResult.prediction,
          prediction: analysisResult.prediction,
          confidence: analysisResult.confidence,
          diagnosis: analysisResult.diagnosis
        });

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