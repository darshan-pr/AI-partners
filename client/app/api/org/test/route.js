import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the org OTP sending API
    const testEmail = 'test@reva.edu.in'; // Change this to a real @reva.edu.in email for testing
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/org/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_mail: testEmail,
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      status: 'API test completed',
      email_api_response: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      status: 'API test failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
