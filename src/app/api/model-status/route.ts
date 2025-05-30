import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check the health of the Keras FastAPI backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          status: 'online',
          message: data.message || 'Keras model is online',
          model: data.model || 'Keras (Pneumonia Detection)',
          source: 'keras-api',
        });
      } else {
        return NextResponse.json({
          status: 'offline',
          message: 'Keras model API is offline',
          error: `Status code: ${response.status}`
        }, { status: 503 });
      }
    } catch (error) {
      return NextResponse.json({
        status: 'offline',
        message: 'Could not connect to Keras model API',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'offline',
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 