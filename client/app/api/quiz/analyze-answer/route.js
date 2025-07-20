import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { questionText, correctAnswer, userAnswer, acceptableAnswers } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Analyze this question and answer pair to determine if the user's answer is correct:

    Question: "${questionText}"
    Correct Answer: "${correctAnswer}"
    User Answer: "${userAnswer}"
    ${acceptableAnswers ? `Acceptable Variations: ${acceptableAnswers.join(', ')}` : ''}

    Please:
    1. Extract key concepts/keywords from the correct answer
    2. Check if the user's answer contains these key concepts
    3. Consider synonyms, abbreviations, and different phrasings
    4. Determine if the answer is correct, partially correct, or incorrect
    5. Provide a confidence score (0-100)
    6. Give a detailed explanation of why the answer is right/wrong
    7. Provide educational feedback to help the user understand

    Respond in JSON format:
    {
      "isCorrect": boolean,
      "confidence": number (0-100),
      "keywordMatches": [array of matched keywords],
      "missingKeywords": [array of missing important keywords],
      "reasoning": "detailed explanation of why the answer is correct/incorrect with specific examples",
      "partialCredit": boolean (if partially correct),
      "educationalFeedback": "constructive feedback to help the user learn from this question",
      "conceptsIdentified": [array of key concepts this question tests],
      "improvementSuggestion": "specific suggestion on how to improve understanding of this topic"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonString = response.text();
    
    // Clean up the response
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    const analysis = JSON.parse(jsonString);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Answer Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze answer: ' + error.message, success: false },
      { status: 500 }
    );
  }
}