import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { file_id, username } = await request.json();

    if (!file_id || !username) {
      return NextResponse.json(
        { success: false, message: 'File ID and username are required' },
        { status: 400 }
      );
    }

    // Use the Convex download function
    const result = await convex.query(api.knowledgeNest.downloadFile, {
      file_id,
      username,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    // Return the download information
    return NextResponse.json({
      success: true,
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      file_type: result.file_type,
      file_size: result.file_size,
      isDemo: result.isDemo,
      message: result.message,
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to prepare download' },
      { status: 500 }
    );
  }
}

// Legacy GET method for backward compatibility
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

    // For legacy support, return a demo response
    return NextResponse.json(
      { 
        success: false, 
        message: "Please use the POST method with username for secure downloads" 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Download GET error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
