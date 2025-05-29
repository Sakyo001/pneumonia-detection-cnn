import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pneumonia-detection-api-eyq4.onrender.com';
    console.log(`Testing connection to API: ${apiUrl}`);
    
    // First try health check endpoint
    const healthResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);

    // Also test root endpoint
    const rootResponse = await fetch(`${apiUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    const rootData = await rootResponse.json();
    
    return NextResponse.json({
      success: true,
      apiUrl,
      health: {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthData,
      },
      root: {
        status: rootResponse.status,
        ok: rootResponse.ok,
        data: rootData,
      },
    });
  } catch (error: any) {
    console.error('Error testing API connection:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://pneumonia-detection-api-eyq4.onrender.com',
    }, { status: 500 });
  }
} 