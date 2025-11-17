import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const jwtToken = formData.get('jwtToken');

    if (!file || !jwtToken) {
      return NextResponse.json(
        { message: 'File and JWT token are required' },
        { status: 400 }
      );
    }

    // Create new FormData for external API
    const externalFormData = new FormData();
    externalFormData.append('file', file);

    // Make request to external API
    const response = await axios.post(
      'https://api.fayda.pro.et/api/v1/process',
      externalFormData,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    // Return the response from external API
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'Failed to process PDF',
        error: error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}

// Optional: Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}