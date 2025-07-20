import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { fileId, username } = await request.json();

    if (!fileId || !username) {
      return NextResponse.json(
        { error: 'File ID and username are required' },
        { status: 400 }
      );
    }

    // Get file URL from Convex
    const fileUrlResponse = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CONVEX_DEPLOY_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'knowledgeNest:getFileUrl',
        args: { file_id: fileId, username },
      }),
    });

    if (!fileUrlResponse.ok) {
      throw new Error('Failed to get file URL');
    }

    const fileUrlData = await fileUrlResponse.json();

    if (!fileUrlData.success) {
      return NextResponse.json(
        { error: fileUrlData.message || 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch the actual file
    const fileResponse = await fetch(fileUrlData.url);
    
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file');
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileUrlData.file_type,
        'Content-Disposition': `attachment; filename="${fileUrlData.filename}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
