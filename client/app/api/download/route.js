import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

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

    const body = await request.json();
    const { file_id, username } = body;

    if (!file_id || !username) {
      return NextResponse.json(
        { success: false, message: 'File ID and username are required' },
        { status: 400 }
      );
    }

    // Use Convex download function
    const result = await convex.query(api.knowledgeNest.downloadFile, {
      file_id,
      username,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process download request' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const filename = searchParams.get('filename');

    if (!fileId || !filename) {
      return NextResponse.json(
        { error: 'File ID and filename are required' },
        { status: 400 }
      );
    }

    // For now, return a placeholder response
    // In a real implementation, you would fetch the file from storage
    return NextResponse.json({
      message: 'Download functionality is being implemented',
      fileId,
      filename
    });
  } catch (error) {
    console.error('Download GET error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
