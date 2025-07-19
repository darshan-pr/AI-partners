// app/api/quiz/submit/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { quizId, userAnswers, questions } = await request.json();

    // Calculate score and results
    let correctCount = 0;
    const results = questions.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correctCount++;

      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        options: question.options,
        isCorrect,
        explanation: question.explanation
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions: questions.length,
      results,
      success: true
    });

  } catch (error) {
    console.error('Quiz Submit Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz', success: false },
      { status: 500 }
    );
  }
}