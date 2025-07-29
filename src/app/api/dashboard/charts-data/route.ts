import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextApiRequest } from 'next';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Gender Distribution
    const genderData = await prisma.patient.groupBy({
      by: ['gender'],
      where: {
        doctorId: userId,
        xrayScans: { some: { result: 'Pneumonia' } },
        gender: { not: null },
      },
      _count: { _all: true },
    });
    const genderDistribution = genderData.map(item => ({
      name: item.gender,
      value: item._count._all,
    }));

    // 2. Age Group Distribution
    const pneumoniaPatients = await prisma.patient.findMany({
        where: {
            doctorId: userId,
            xrayScans: { some: { result: 'Pneumonia' } },
            age: { not: null }
        },
        select: { age: true }
    });

    const ageGroups = {
      '0-17': 0,
      '18-45': 0,
      '46-65': 0,
      '65+': 0
    };
    pneumoniaPatients.forEach(patient => {
        if (patient.age === null) return;
        if (patient.age <= 17) ageGroups['0-17']++;
        else if (patient.age <= 45) ageGroups['18-45']++;
        else if (patient.age <= 65) ageGroups['46-65']++;
        else ageGroups['65+']++;
    });
    const ageDistribution = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

    // 3. Location Distribution (by Region)
    const locationData = await prisma.xrayScan.groupBy({
      by: ['region'],
      where: {
        doctorId: userId,
        result: 'Pneumonia',
        region: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    const locationDistribution = locationData.map(item => ({
      name: item.region,
      value: item._count.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        genderDistribution,
        ageDistribution,
        locationDistribution,
      },
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch chart data' }, { status: 500 });
  }
} 