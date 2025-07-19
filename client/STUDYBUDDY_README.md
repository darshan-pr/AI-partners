# StudyBuddy - AI Learning Companion

StudyBuddy is an integrated AI-powered learning companion within the AI Partner application, designed to provide personalized educational support through an interactive chat interface.

## Features

### 🎯 Core Functionality
- **Interactive Chat Interface**: Real-time conversation with AI tutor
- **Session Management**: Create, manage, and organize study sessions
- **File Upload Support**: Upload images, PDFs, and text documents for analysis
- **Multi-modal Learning**: Text, image, and document analysis capabilities
- **Persistent Chat History**: All conversations are saved and searchable

### 🎨 User Interface
- **Modern Chat Design**: Clean, intuitive interface similar to top AI websites
- **Dark/Light Theme**: Full theme support with smooth transitions
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Left Sidebar Navigation**: Easy access to chat sessions and search
- **Real-time Updates**: Instant message delivery and session updates

### 📚 Educational Capabilities
- **Concept Explanations**: Break down complex topics into understandable parts
- **Homework Assistance**: Step-by-step problem-solving guidance
- **Study Planning**: Personalized learning strategies and schedules
- **Document Analysis**: PDF and text file comprehension and summarization
- **Image Analysis**: Mathematical equations, diagrams, and visual content analysis

## File Structure

```
app/home/studybuddy/
├── layout.js              # Main layout with sidebar and theme support
├── page.js                # Landing page with quick start options
└── [sessionId]/
    └── page.js            # Dynamic chat session interface

app/api/studybuddy/
└── route.js               # Backend API for AI chat functionality

convex/
├── schema.js              # Database schema for chat sessions and messages
└── chat.js                # Convex functions for chat management
```

## Database Schema

### Chat Sessions (`chat_sessions`)
- `sessionId`: Unique identifier for each chat session
- `username`: User who owns the session
- `title`: Session title (auto-generated from first message)
- `createdAt`: Session creation timestamp
- `updatedAt`: Last activity timestamp
- `messageCount`: Total messages in session
- `lastMessage`: Preview of the last message

### Chat Messages (`chat_messages`)
- `sessionId`: Reference to parent session
- `username`: Message author
- `role`: 'user' or 'assistant'
- `content`: Message text content
- `timestamp`: Message creation time
- `messageType`: 'text', 'image', or 'file'
- `metadata`: Additional data (file info, image data, etc.)

## API Endpoints

### `POST /api/studybuddy`
Main chat endpoint for sending messages and receiving AI responses.

**Request Parameters:**
- `message`: Text message from user
- `sessionId`: Chat session identifier
- `username`: Authenticated user
- `file`: Optional file upload (FormData)

**Response:**
```json
{
  "message": "AI response text",
  "success": true,
  "messageType": "text"
}
```

## Usage Guide

### Starting a New Session
1. Navigate to `/home/studybuddy`
2. Click "Start New Study Session" or choose a quick start option
3. Begin chatting with StudyBuddy

### Session Management
- **Create**: Use the "+" button in the sidebar
- **Search**: Use the search bar to find specific conversations
- **Delete**: Click the trash icon on any session
- **Switch**: Click on any session in the sidebar

### File Uploads
- Click the upload button in the chat input
- Supported formats: Images (PNG, JPG, JPEG), PDFs, Text files
- Files are automatically analyzed and discussed

### Theme Toggle
- Click the sun/moon icon in the sidebar header
- Preference is saved locally and persists across sessions

## Technical Implementation

### Frontend Technologies
- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first styling with custom theme variables
- **Lucide React**: Modern icon library
- **Convex**: Real-time database and backend functions

### AI Integration
- **Google Gemini 2.5 Flash**: Advanced language model
- **Vision Capabilities**: Image analysis and understanding
- **File Processing**: Document analysis and content extraction
- **Context Management**: Maintains conversation history for coherent responses

### Real-time Features
- **Convex Queries**: Live database subscriptions
- **Optimistic Updates**: Instant UI feedback
- **Auto-scroll**: Smooth message area navigation
- **Typing Indicators**: Visual feedback during AI processing

## Customization

### Theme Configuration
Modify theme variables in `globals.css`:
```css
[data-theme="light"] {
  --studybuddy-bg: #f9fafb;
  --studybuddy-sidebar: #ffffff;
  --studybuddy-text: #111827;
  /* ... more variables */
}
```

### AI Behavior
Adjust prompts and behavior in `/api/studybuddy/route.js`:
```javascript
function buildStudyBuddyContext(messages) {
  // Customize AI personality and instructions
}
```

## Security & Privacy

- **User Authentication**: Session access restricted to authenticated users
- **Data Isolation**: Each user's chat data is completely separate
- **File Handling**: Secure file processing with size and type validation
- **Error Handling**: Comprehensive error management with user-friendly messages

## Future Enhancements

- [ ] Math equation rendering with LaTeX support
- [ ] Code syntax highlighting for programming questions
- [ ] Voice input and text-to-speech capabilities
- [ ] Integration with external learning resources
- [ ] Collaborative study sessions
- [ ] Progress tracking and analytics
- [ ] Offline mode support
- [ ] Mobile app development

## Development Notes

### Environment Variables Required
```
GEMINI_API_KEY_CHAT=your_gemini_api_key
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### Database Deployment
```bash
npx convex dev
npx convex deploy
```

### Local Development
```bash
npm run dev
```

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Ensure user is logged in and username is stored in localStorage
2. **File Upload Failures**: Check file size limits and supported formats
3. **Theme Not Persisting**: Verify localStorage is working and not blocked
4. **Messages Not Loading**: Check Convex connection and database permissions

### Error Handling
- Network errors show retry options
- File processing errors display helpful messages
- Authentication failures redirect to login
- API quota exceeded shows appropriate warnings

## Contributing

When contributing to StudyBuddy:
1. Maintain the existing theme system
2. Follow the component structure patterns
3. Add proper error handling
4. Update this documentation
5. Test across light/dark themes
6. Ensure mobile responsiveness

---

StudyBuddy represents the future of personalized AI education, combining cutting-edge technology with intuitive design to create an exceptional learning experience.
