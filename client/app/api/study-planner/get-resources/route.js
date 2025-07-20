import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const plannerId = searchParams.get('plannerId');
    const noteId = searchParams.get('noteId');

    if (!plannerId && !noteId) {
      return NextResponse.json(
        { error: 'Either plannerId or noteId is required', success: false },
        { status: 400 }
      );
    }

    // Return sample formatted resources for frontend integration
    const sampleResources = [
      {
        id: "resource_1",
        title: "Interactive Tutorial",
        type: "Tutorial",
        url: "https://www.codecademy.com/learn",
        description: "Step-by-step interactive tutorial",
        difficulty: "Beginner",
        color: "green",
        isClickable: true
      },
      {
        id: "resource_2", 
        title: "Practice Exercises",
        type: "Practice",
        url: "https://www.hackerrank.com/domains",
        description: "Hands-on practice problems",
        difficulty: "Intermediate",
        color: "orange",
        isClickable: true
      },
      {
        id: "resource_3",
        title: "Reference Guide",
        type: "Reference", 
        url: "https://developer.mozilla.org/en-US/docs",
        description: "Comprehensive reference documentation",
        difficulty: "All Levels",
        color: "blue",
        isClickable: true
      }
    ];

    return NextResponse.json({
      success: true,
      resources: sampleResources,
      message: "Resources are now properly formatted for display. Use the getStudyNoteResources query in your frontend to get actual data from Convex."
    });

  } catch (error) {
    console.error('Get Study Resources Error:', error);
    return NextResponse.json(
      { error: 'Failed to get study resources: ' + error.message, success: false },
      { status: 500 }
    );
  }
}
