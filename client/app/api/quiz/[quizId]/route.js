// app/api/quiz/[quizId]/route.js
import { NextResponse } from 'next/server';

// In-memory storage (replace with Convex in production)
const quizStorage = new Map();

export async function POST(request, { params }) {
  try {
    const { quizId } = params;
    const quizData = await request.json();

    // Store quiz data with username
    quizStorage.set(quizId, {
      ...quizData,
      createdAt: Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz Storage Error:', error);
    return NextResponse.json(
      { error: 'Failed to store quiz', success: false },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { quizId } = params;
    const quiz = quizStorage.get(quizId);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quiz,
      success: true
    });
  } catch (error) {
    console.error('Quiz Retrieval Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quiz', success: false },
      { status: 500 }
    );
  }
}