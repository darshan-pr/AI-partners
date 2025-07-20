import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and content type are required' },
        { status: 400 }
      );
    }

    // For now, we'll use a simpler approach - generate upload URL using Convex client-side
    // This is a placeholder that will be replaced with proper Convex file upload
    return NextResponse.json({
      uploadUrl: `/api/files/upload?filename=${encodeURIComponent(filename)}`,
      storageId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
