import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/env-client';

/**
 * Optimized API route that proxies requests to the Render-deployed model API
 * This helps reduce the serverless function size by not including local dependencies
 */
export async function POST(request: NextRequest) {
  const apiUrl = getApiUrl();
  
  try {
    // Extract form data
    const formData = await request.formData();
    
    // Log basic info without logging the full file
    const file = formData.get('file') as File;
    console.log(`API route: Received file: ${file?.name}, size: ${file?.size} bytes`);
    
    // Reference number - either from request or generate a new one
    const requestReferenceNumber = formData.get('referenceNumber') as string;
    const referenceNumber = requestReferenceNumber || `XR-${Date.now()}`;
    
    // Forward the request to our Render API
    console.log(`API route: Forwarding to ${apiUrl}/predict/`);
    const response = await fetch(`${apiUrl}/predict/`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, as the browser will set it with the proper boundary string
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      
      // Return a simplified error response
      return NextResponse.json({ 
        error: 'Error processing X-ray', 
        details: `API error: ${response.status}`
      }, { status: response.status });
    }
    
    // Extract the API response
    const prediction = await response.json();
    console.log('API Response:', prediction.diagnosis);
    
    // Return the prediction with reference number
    return NextResponse.json({
      ...prediction,
      referenceNumber,
    });
    
  } catch (error: any) {
    console.error('API route: Error in analyze API route:', error);
    return NextResponse.json({ 
      error: 'An error occurred during analysis',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 