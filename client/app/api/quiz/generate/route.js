// app/api/quiz/generate/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { subject, concept, questionCount, username, quizType, difficulty } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'User not authenticated', success: false },
        { status: 401 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `Generate ${questionCount} questions about ${subject}`;
    if (concept && concept.trim()) {
      prompt += ` focusing on the concept: ${concept}`;
    }
    prompt += `. Difficulty level: ${difficulty || 'medium'}.`;

    // Add question type specific instructions
    switch (quizType || 'mixed') {
      case 'mcq':
        prompt += ` All questions should be multiple choice with 4 options each.`;
        break;
      case 'true_false':
        prompt += ` All questions should be true/false questions.`;
        break;
      case 'writing':
        prompt += ` All questions should be text input questions that require written answers.`;
        break;
      case 'mixed':
        prompt += ` Mix different question types: multiple choice, true/false, and text input questions.`;
        break;
    }

    prompt += `
    Format as JSON array with each question having:
    1. questionText
    2. questionType ("mcq", "true_false", or "text_input")
    3. For MCQ: options (array of 4 strings) and aiAnswer (correct option)
    4. For True/False: options ["True", "False"] and aiAnswer ("True" or "False")
    5. For Text Input: aiAnswer (correct answer), acceptableAnswers (array of acceptable variations), and keywordMatches (array of essential keywords that must be present)
    6. explanation

    For text input questions, include keywordMatches array with essential keywords/concepts that should be present in a correct answer.

    Example for mixed:
    [
      {
        "questionText": "What is the capital of France?",
        "questionType": "mcq",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "aiAnswer": "Paris",
        "explanation": "Paris is the capital of France."
      },
      {
        "questionText": "JavaScript is a programming language.",
        "questionType": "true_false",
        "options": ["True", "False"],
        "aiAnswer": "True",
        "explanation": "JavaScript is indeed a programming language."
      },
      {
        "questionText": "Explain the concept of photosynthesis and its main components.",
        "questionType": "text_input",
        "aiAnswer": "Photosynthesis is the process by which plants convert light energy into chemical energy using chlorophyll, carbon dioxide, and water to produce glucose and oxygen.",
        "acceptableAnswers": ["process where plants make food using sunlight", "conversion of light to chemical energy in plants", "plants using light, CO2, and water to make glucose"],
        "keywordMatches": ["light energy", "chlorophyll", "carbon dioxide", "water", "glucose", "oxygen", "plants", "chemical energy"],
        "explanation": "Photosynthesis is the fundamental process that allows plants to create energy from sunlight."
      }
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonString = response.text();
    
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    const questions = JSON.parse(jsonString);

    // Prepare the mutation arguments with proper null handling
    const mutationArgs = {
      username,
      subject: subject.trim(),
      numberOfQuestions: questionCount,
      quizType: quizType || 'mixed',
      difficulty: difficulty || 'medium',
      questions: questions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType || 'mcq',
        options: q.options || undefined,
        aiAnswer: q.aiAnswer,
        acceptableAnswers: q.acceptableAnswers || undefined,
        keywordMatches: q.keywordMatches || undefined, // Add keyword matches
        explanation: q.explanation
      }))
    };

    // Only add concept if it's not null/empty
    if (concept && concept.trim()) {
      mutationArgs.concept = concept.trim();
    }

    const quizId = await convex.mutation('quiz:createQuiz', mutationArgs);

    return NextResponse.json({
      success: true,
      quizId,
      questions
    });

  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz: ' + error.message, success: false },
      { status: 500 }
    );
  }
}