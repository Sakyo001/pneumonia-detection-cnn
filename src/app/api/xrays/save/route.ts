import { prisma } from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get the current doctor from the session
    const user = await getUserFromCookie();
    
    if (!user || user.role !== 'DOCTOR') {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.patientName || !data.referenceNumber) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Find or create patient
    let patient;
    try {
      // Parse patientName into components
      const nameParts = (data.patientName || '').trim().split(' ').filter(Boolean);
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
      
      // Check if patient exists by name
      patient = await prisma.patient.findFirst({
        where: {
          firstName: firstName,
          lastName: lastName,
          doctorId: user.id
        }
      });
      
      // If patient doesn't exist, create a new one
      if (!patient) {
        const dateOfBirth = data.patientAge 
          ? new Date(new Date().getFullYear() - parseInt(data.patientAge), 0, 1) 
          : new Date();
          
        patient = await prisma.patient.create({
          data: {
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            referenceNumber: `PAT-${Date.now().toString().slice(-6)}`,
            doctorId: user.id
          }
        });
      }
    } catch (error) {
      console.error("Error finding/creating patient:", error);
      return Response.json(
        { error: "Failed to process patient data" },
        { status: 500 }
      );
    }
    
    // Create new X-ray record
    try {
      const xrayScan = await prisma.xrayScan.create({
        data: {
          referenceNumber: data.referenceNumber,
          patientId: patient.id,
          imageUrl: data.imageUrl || "",
          result: JSON.stringify({
            diagnosis: data.diagnosis,
            confidence: data.confidence,
            pneumoniaType: data.pneumoniaType,
            severity: data.severity,
            recommendedAction: data.recommendedAction,
            patientAge: data.patientAge,
            patientGender: data.patientGender,
            patientNotes: data.patientNotes
          }),
          status: "COMPLETED",
          doctorId: user.id
        }
      });
      
      return Response.json({ 
        success: true, 
        message: "X-ray data saved successfully",
        xrayId: xrayScan.id
      });
    } catch (error) {
      console.error("Error creating X-ray record:", error);
      return Response.json(
        { error: "Failed to save X-ray data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving X-ray data:", error);
    return Response.json(
      { error: "Failed to save X-ray data" },
      { status: 500 }
    );
  }
} 