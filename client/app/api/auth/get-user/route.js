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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists using Convex
    const result = await convex.query(api.auth.checkUserExists, {
      email: email,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check user' },
      { status: 500 }
    );
  }
}
