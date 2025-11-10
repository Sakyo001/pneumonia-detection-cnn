import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    // Get the current doctor from the session
    const user = await getUserFromCookie();
    
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch patients assigned to this doctor
    const patients = await prisma.patient.findMany({
      where: {
        doctorId: user.id
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        referenceNumber: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    // Combine name fields for response
    const patientsWithFullName = patients.map(patient => ({
      ...patient,
      name: [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(' ')
    }));
    
    return NextResponse.json({ patients: patientsWithFullName });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
} 