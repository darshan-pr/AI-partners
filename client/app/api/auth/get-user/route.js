import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
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
