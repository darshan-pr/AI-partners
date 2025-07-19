import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from '../../../convex/_generated/api';

// Initialize Convex client
let convex;
try {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  }
  convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
} catch (error) {
  console.error('Failed to initialize Convex client:', error);
}

// Generate Study Planner with AI
export async function POST(request) {
  try {
    if (!convex) {
      return NextResponse.json({ 
        error: 'Database connection not available',
        success: false 
      }, { status: 503 });
    }

    const { username, type, mode = 'ai-review', manualInput } = await request.json();

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required',
        success: false 
      }, { status: 400 });
    }

    if (!type || (type !== 'weekly' && type !== 'monthly')) {
      return NextResponse.json({ 
        error: 'Valid type (weekly or monthly) is required',
        success: false 
      }, { status: 400 });
    }

    if (mode === 'manual' && (!manualInput || !manualInput.subjects || !manualInput.topics)) {
      return NextResponse.json({ 
        error: 'Manual input requires subjects and topics',
        success: false 
      }, { status: 400 });
    }

    let result;

    if (mode === 'ai-review') {
      // Get AI reviews to extract concept information
      const aiReviews = await convex.query(api.aiReview.getUserAiReviews, {
        username
      });
      
      if (!aiReviews || aiReviews.length === 0) {
        return NextResponse.json({ 
          error: 'No quiz reviews found. Please take some quizzes first to generate a personalized study plan.',
          success: false 
        }, { status: 400 });
      }
      
      // Use existing AI review-based generation with enhanced concept extraction
      result = await convex.mutation(api.studyPlanner.generateStudyPlanner, {
        username,
        type
      });
    } else {
      // Generate using manual input with Gemini AI
      result = await generateManualStudyPlanner(username, type, manualInput);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} study planner generated successfully`
    });

  } catch (error) {
    console.error('Study Planner API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

// Generate study planner using manual input with Gemini AI
async function generateManualStudyPlanner(username, type, manualInput) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const isWeekly = type === 'weekly';
  const totalDays = isWeekly ? 7 : 30;
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Create AI prompt for study plan generation
  const prompt = `Generate a comprehensive ${type} study plan for the following:

**Input Details:**
- Subjects: ${manualInput.subjects}
- Topics: ${manualInput.topics}
- Difficulty Level: ${manualInput.difficulty}
- Study Goal: ${manualInput.goal || 'General learning'}
- Duration: ${totalDays} days

**Requirements:**
1. Create a structured study plan with ${isWeekly ? '5-7' : '12-15'} specific study tasks
2. Each task should have:
   - Clear, actionable title
   - Detailed instructions and learning objectives
   - Appropriate difficulty progression
   - Estimated time requirement
   - Priority level (high/medium/low)
   - Subject categorization

**Study Plan Structure:**
- Phase 1 (Days 1-${Math.ceil(totalDays * 0.2)}): Foundation Building
- Phase 2 (Days ${Math.ceil(totalDays * 0.2)}-${Math.ceil(totalDays * 0.7)}): Core Learning & Practice
- Phase 3 (Days ${Math.ceil(totalDays * 0.7)}-${Math.ceil(totalDays * 0.9)}): Application & Integration
- Phase 4 (Days ${Math.ceil(totalDays * 0.9)}-${totalDays}): Review & Assessment

**Response Format (JSON):**
{
  "title": "Study Plan Title",
  "description": "Brief description of the study plan",
  "notes": [
    {
      "title": "Task Title",
      "details": "Detailed instructions, learning objectives, and success criteria",
      "priority": "high|medium|low",
      "difficulty_level": "easy|medium|hard",
      "estimated_time": "2-3 hours",
      "subject": "Subject name (single string, not array)",
      "concepts": ["concept1", "concept2"],
      "phase": "foundation|core|application|review",
      "day_range": "1-2"
    }
  ]
}

Focus on practical, actionable tasks that build upon each other. Ensure the difficulty progresses logically and aligns with the specified level: ${manualInput.difficulty}.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let planData = response.text();
    
    // Clean up the response
    planData = planData.replace(/```json|```/g, '').trim();
    
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(planData);
    } catch (parseError) {
      console.error('Failed to parse study plan:', parseError);
      throw new Error('Failed to generate valid study plan');
    }

    // Convert to the expected format with proper timestamps
    const processedNotes = parsedPlan.notes.map((note, index) => {
      const dayRange = note.day_range ? note.day_range.split('-') : [index + 1, index + 2];
      const startDay = parseInt(dayRange[0]) - 1; // Convert to 0-based
      const endDay = parseInt(dayRange[1]) || startDay + 1;
      
      // Only include fields that match the Convex schema
      return {
        title: note.title,
        details: note.details,
        start_date: now + (startDay * dayInMs),
        due_date: now + (endDay * dayInMs),
        position_index: index,
        connected_to: index < parsedPlan.notes.length - 1 ? `note_${index + 1}` : undefined,
        priority: note.priority || 'medium',
        difficulty_level: note.difficulty_level || 'medium',
        estimated_time: note.estimated_time || '2-3 hours',
        subject: Array.isArray(note.subject) ? note.subject[0] : (note.subject || 'General'),
        concepts: note.concepts || ['General Study'],
        resources: [
          {
            title: `${Array.isArray(note.subject) ? note.subject[0] : (note.subject || 'General')} Study Materials`,
            type: "study_guide"
          },
          {
            title: `Practice Quiz - ${Array.isArray(note.subject) ? note.subject[0] : (note.subject || 'General')}`,
            type: "quiz",
            url: "/quiz"
          }
        ]
      };
    });

    // Create planner in database
    const expirationDays = isWeekly ? 7 : 30;
    const expiresAt = now + (expirationDays * 24 * 60 * 60 * 1000);
    
    const plannerId = await convex.mutation(api.studyPlanner.createManualPlanner, {
      username,
      type,
      title: parsedPlan.title,
      description: parsedPlan.description,
      notes: processedNotes,
      expiresAt
    });

    return {
      plannerId,
      type,
      notesCount: processedNotes.length,
      expiresAt
    };

  } catch (aiError) {
    console.error('AI generation error:', aiError);
    throw new Error('Failed to generate study plan with AI: ' + aiError.message);
  }
}

// Get Study Planners
export async function GET(request) {
  try {
    if (!convex) {
      return NextResponse.json({ 
        error: 'Database connection not available',
        success: false 
      }, { status: 503 });
    }

    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    const plannerId = url.searchParams.get('plannerId');
    const action = url.searchParams.get('action');

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required',
        success: false 
      }, { status: 400 });
    }

    if (plannerId) {
      // Get specific planner with notes
      const planner = await convex.query(api.studyPlanner.getPlannerById, {
        plannerId
      });
      
      return NextResponse.json({
        success: true,
        data: planner
      });
    } else if (action === 'active') {
      // Get active planners
      const planners = await convex.query(api.studyPlanner.getActivePlanners, {
        username
      });
      
      return NextResponse.json({
        success: true,
        data: planners
      });
    } else {
      // Get all planners
      const planners = await convex.query(api.studyPlanner.getUserPlanners, {
        username
      });
      
      return NextResponse.json({
        success: true,
        data: planners
      });
    }

  } catch (error) {
    console.error('Study Planner GET API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

// Update Note Completion
export async function PATCH(request) {
  try {
    if (!convex) {
      return NextResponse.json({ 
        error: 'Database connection not available',
        success: false 
      }, { status: 503 });
    }

    const { noteId, isCompleted } = await request.json();

    if (!noteId) {
      return NextResponse.json({ 
        error: 'Note ID is required',
        success: false 
      }, { status: 400 });
    }

    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json({ 
        error: 'isCompleted must be a boolean',
        success: false 
      }, { status: 400 });
    }

    // Toggle note completion
    const result = await convex.mutation(api.studyPlanner.toggleNoteCompletion, {
      noteId,
      isCompleted
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Note ${isCompleted ? 'completed' : 'marked as incomplete'} successfully`
    });

  } catch (error) {
    console.error('Study Planner PATCH API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

// Clean up expired planners or delete specific planner
export async function DELETE(request) {
  try {
    if (!convex) {
      return NextResponse.json({ 
        error: 'Database connection not available',
        success: false 
      }, { status: 503 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'cleanup') {
      // Clean up expired planners
      const result = await convex.mutation(api.studyPlanner.cleanupExpiredPlanners, {});
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `${result.expiredCount} expired planners cleaned up`
      });
    } else {
      // Delete specific planner
      const { plannerId } = await request.json();
      
      if (!plannerId) {
        return NextResponse.json({ 
          error: 'Planner ID is required',
          success: false 
        }, { status: 400 });
      }

      const result = await convex.mutation(api.studyPlanner.deletePlanner, {
        plannerId
      });
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Study planner deleted successfully'
      });
    }

  } catch (error) {
    console.error('Study Planner DELETE API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
