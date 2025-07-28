import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // This API route is not needed anymore since we're using Convex's generateUploadUrl directly
    // The file upload is now handled entirely through Convex functions
    return NextResponse.json({
      message: 'File upload is handled through Convex functions directly',
      success: false
    }, { status: 400 });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'This API route is deprecated. Use Convex upload functions.' },
      { status: 500 }
    );
  }
}
