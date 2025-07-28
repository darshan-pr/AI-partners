import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client only if URL is available
let convex = null;
if (process.env.NEXT_PUBLIC_CONVEX_URL) {
  convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
}

export async function POST(request) {
  try {
    if (!convex) {
      return NextResponse.json(
        { success: false, message: 'Convex not configured. Please set NEXT_PUBLIC_CONVEX_URL environment variable.' },
        { status: 500 }
      );
    }

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP using Convex
    const result = await convex.mutation(api.auth.verifyOTP, {
      email: email,
      otp: otp,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
