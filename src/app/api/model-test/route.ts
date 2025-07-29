import { NextRequest, NextResponse } from 'next/server';
import { getCldCloudName, getCldUploadPreset } from '@/lib/env-client';

export async function GET(request: NextRequest) {
  try {
    // Get the API URL from environment or use default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://efficientnetb0-validation.onrender.com';
    console.log(`Testing connectivity to ${apiUrl}`);

    // First test the health endpoint
    let modelHealth;
    try {
      const healthResponse = await fetch(`${apiUrl}/health`, { 
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed with status ${healthResponse.status}`);
      }
      
      modelHealth = await healthResponse.json();
    } catch (error: any) {
      console.error('Health check error:', error.message);
      modelHealth = { status: 'error', message: error.message };
    }

    // Then test the root endpoint
    let rootData;
    try {
      const rootResponse = await fetch(apiUrl, { 
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!rootResponse.ok) {
        throw new Error(`Root endpoint failed with status ${rootResponse.status}`);
      }
      
      rootData = await rootResponse.json();
    } catch (error: any) {
      console.error('Root endpoint error:', error.message);
      rootData = { status: 'error', message: error.message };
    }
    
    // Check Cloudinary configuration
    const cloudName = getCldCloudName();
    const uploadPreset = getCldUploadPreset();
    const cloudinaryConfigured = Boolean(cloudName && uploadPreset);

    // Return combined status
    return NextResponse.json({
      success: Boolean(modelHealth?.status === 'healthy' || rootData?.status === 'ok'),
      isModelLoaded: Boolean(modelHealth?.model_loaded || rootData?.model_loaded),
      apiUrl,
      health: modelHealth,
      rootData,
      cloudinary: {
        configured: cloudinaryConfigured,
        cloudName
      }
    });
  } catch (error: any) {
    console.error('Error in model-test route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://efficientnetb0-validation.onrender.com'
      },
      { status: 500 }
    );
  }
} 