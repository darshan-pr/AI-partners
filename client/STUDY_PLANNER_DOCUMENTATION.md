# Study Planner Feature Documentation

## Overview
The Study Planner is a personalized learning roadmap generator that creates structured study plans based on user's quiz performance analysis from the AI review system. It acts as a task manager with tracking, completion, and interactive features.

## ✅ Feature Breakdown

### 1. **Data Source & Analysis**
- **Input**: Aggregated `ai_review` entries for a specific user
- **Analysis**: Identifies weak concepts, strong areas, and improvement suggestions
- **Processing**: Prioritizes concepts based on frequency and weakness ratio

### 2. **Roadmap Generation**
- **Types**: Weekly (7 days) or Monthly (30 days) plans
- **Structure**: Phased approach with foundation, improvement, reinforcement, and assessment
- **AI-Powered**: Uses analyzed performance data to create personalized tasks

### 3. **Note Structure (Roadmap Nodes)**
Each study note contains:
- **Title**: Clear, actionable task name
- **Details**: Comprehensive study instructions and success criteria
- **Dates**: Start and due dates for proper scheduling
- **Completion Status**: Trackable progress indicators
- **Priority**: High, Medium, Low based on concept weakness
- **Difficulty**: Easy, Medium, Hard levels
- **Estimated Time**: Expected study duration
- **Subject & Concepts**: Categorized learning areas
- **Resources**: Study materials and quiz links

### 4. **Roadmap Layout**
- **Flow**: Linear timeline-based progression
- **Visual**: Connected nodes with progress indicators
- **Responsive**: Clean mobile and desktop layouts
- **Interactive**: Clickable completion toggles

### 5. **User Interactions**
- **Completion Tracking**: Mark tasks as complete/incomplete
- **Progress Visualization**: Real-time percentage updates
- **Detailed Views**: Expandable task information
- **Resource Access**: Direct links to study materials

### 6. **Generation Constraints**
- **Limitation**: Maximum 2 active planners (1 weekly + 1 monthly)
- **Expiration**: Automatic cleanup of expired plans
- **Uniqueness**: User-specific personalized content

## 🗂️ Database Schema

### `study_planner` Table
| Column | Type | Description |
|--------|------|-------------|
| username | string | User identifier |
| type | string | 'weekly' or 'monthly' |
| title | string | Plan title |
| description | string | Plan description |
| created_at | number | Creation timestamp |
| expires_at | number | Expiration timestamp |
| status | string | 'active', 'expired', 'completed' |
| completion_percentage | number | Progress percentage |
| total_notes | number | Total number of tasks |
| completed_notes | number | Number of completed tasks |
| generated_from_reviews | array | Source review IDs |

### `study_notes` Table
| Column | Type | Description |
|--------|------|-------------|
| planner_id | string | Foreign key to study_planner |
| title | string | Task title |
| details | string | Detailed instructions |
| start_date | number | Task start date |
| due_date | number | Task deadline |
| is_completed | boolean | Completion status |
| completed_at | number | Completion timestamp |
| position_index | number | Order in roadmap |
| connected_to | string | Next connected task |
| priority | string | 'high', 'medium', 'low' |
| difficulty_level | string | 'easy', 'medium', 'hard' |
| estimated_time | string | Expected duration |
| subject | string | Subject category |
| concepts | array | Concept names |
| resources | array | Study resources |

## 🔧 API Endpoints

### `/api/study-planner`

#### POST - Generate Study Planner
```javascript
// Request
{
  "username": "user123",
  "type": "weekly" // or "monthly"
}

// Response
{
  "success": true,
  "data": {
    "plannerId": "plan_123",
    "type": "weekly",
    "notesCount": 5,
    "expiresAt": 1640995200000
  }
}
```

#### GET - Retrieve Planners
```javascript
// Query parameters
?username=user123&action=active

// Response
{
  "success": true,
  "data": [
    {
      "_id": "plan_123",
      "title": "📅 Weekly Study Roadmap",
      "description": "Personalized weekly study plan...",
      "completion_percentage": 60,
      "total_notes": 5,
      "completed_notes": 3,
      "expires_at": 1640995200000
    }
  ]
}
```

#### PATCH - Update Note Completion
```javascript
// Request
{
  "noteId": "note_123",
  "isCompleted": true
}

// Response
{
  "success": true,
  "data": {
    "noteId": "note_123",
    "isCompleted": true,
    "completionPercentage": 80
  }
}
```

## 📱 Frontend Components

### `StudyPlannerModal.jsx`
- **Purpose**: Main modal interface for planner management
- **Features**: Create new plans, view active plans, display roadmaps
- **State Management**: Uses Convex for real-time updates
- **Responsive**: Optimized for mobile and desktop

### Integration in `HomePage`
- **Feature Card**: Added to main navigation grid
- **Modal State**: Managed at page level
- **User Context**: Passes username for personalized content

## 🎯 Study Plan Generation Logic

### Phase 1: Foundation Building (20% of time)
- Review fundamental concepts
- Focus on basic understanding
- Prepare for deeper learning

### Phase 2: Targeted Improvement (50% of time)
- Address specific weak concepts
- Practice and application
- Mastery-focused activities

### Phase 3: Reinforcement & Integration (20% of time)
- Strengthen existing knowledge
- Connect concepts
- Advanced applications

### Phase 4: Assessment & Review (10% of time)
- Comprehensive testing
- Progress evaluation
- Next steps planning

## 🔍 AI-Powered Analysis

### Performance Analysis
```javascript
{
  "weakConcepts": [
    {
      "concept": "Binary Trees",
      "suggestion": "Practice tree traversal algorithms",
      "weaknessRatio": 0.8,
      "priority": "high"
    }
  ],
  "strongConcepts": [
    {
      "concept": "Arrays",
      "masteryLevel": "Strong"
    }
  ],
  "improvementSuggestions": [
    "Focus on algorithmic thinking",
    "Practice more complex problems"
  ]
}
```

### Personalization Features
- **Concept Prioritization**: Based on weakness frequency
- **Time Allocation**: Adjusted by difficulty and importance
- **Resource Suggestions**: Tailored to specific concepts
- **Progress Tracking**: Real-time completion monitoring

## 🚀 Usage Examples

### Creating a Weekly Plan
1. User clicks "Study Planner" on homepage
2. Selects "Weekly Plan" option
3. System analyzes user's quiz reviews
4. Generates 5-7 personalized study tasks
5. Plan expires after 7 days

### Tracking Progress
1. User opens active study plan
2. Completes a study task
3. Marks task as complete
4. Progress percentage updates automatically
5. System tracks completion timestamps

### Roadmap Navigation
1. Linear timeline view
2. Connected task progression
3. Priority-based visual indicators
4. Resource access for each task
5. Detailed instructions on demand

## 📊 Benefits

### For Students
- **Personalized Learning**: Based on actual performance data
- **Structured Progress**: Clear timeline and milestones
- **Motivation**: Visual progress tracking
- **Efficiency**: Focus on weak areas first

### For Educators
- **Data-Driven**: Evidence-based study recommendations
- **Scalable**: Automated plan generation
- **Trackable**: Progress monitoring capabilities
- **Adaptive**: Evolves with user performance

## 🔮 Future Enhancements

### Potential Improvements
1. **Calendar Integration**: Sync with external calendars
2. **Reminder System**: Push notifications for deadlines
3. **Collaboration Features**: Share plans with mentors
4. **Advanced Analytics**: Detailed progress reports
5. **Mobile App**: Dedicated mobile experience
6. **AI Tutoring**: Integrated study assistance
7. **Resource Library**: Curated study materials
8. **Achievement System**: Gamification elements

This Study Planner feature transforms quiz performance data into actionable, personalized learning paths, making studying more efficient and effective for users while providing valuable insights for educational improvement.
