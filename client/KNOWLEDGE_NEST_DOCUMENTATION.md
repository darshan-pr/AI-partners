# Knowledge Nest File Upload System Documentation

## Overview
The Knowledge Nest is a collaborative file sharing system built with Convex File Storage that allows users within the same organization and class to upload, share, and access educational resources.

## Features Implemented

### 1. Database Schema
- **knowledge_nest table** with the following fields:
  - `file_id` (Primary Key) - Convex storage ID for the uploaded file
  - `organization_id` (Foreign Key) - Reference to the org table
  - `class_sec` - Class/Section (auto-filled from user's org profile)
  - `branch` - Academic branch (auto-filled from user's org profile)  
  - `uploaded_username` - Username of the uploader (auto-filled)
  - `subject` - Subject selection from dropdown
  - `filename` - Original filename
  - `file_size` - File size in bytes
  - `file_type` - MIME type
  - `upload_date` - Upload timestamp
  - `description` - Optional file description
  - `is_active` - For soft delete functionality

### 2. File Upload Features
- **Drag & Drop Interface** - Modern file upload with visual feedback
- **Subject Selection** - Dropdown with common academic subjects
- **Auto-filled Fields** - Organization, class, branch, and username are automatically populated
- **File Validation** - Supports PDF, Word, PowerPoint, images, videos, and archives (max 50MB)
- **Upload Progress** - Visual feedback during upload process

### 3. File Display & Management
- **Grid/List View Toggle** - Switch between card and list layouts
- **Search & Filter** - Search by filename, subject, or uploader
- **Subject Filtering** - Filter files by specific subjects
- **File Actions** - Download and delete (only by uploader) functionality
- **Access Control** - Users only see files from their organization and class

### 4. Organization Verification
- **Email Verification** - OTP verification for organization email (@reva.edu.in)
- **Organization Profile** - Users must complete org profile to access Knowledge Nest
- **Auto-population** - File upload details are automatically filled from verified org profile

## File Structure

```
client/
├── app/
│   ├── api/
│   │   ├── upload/route.js          # File upload API endpoint
│   │   └── download/route.js        # File download API endpoint
│   └── home/
│       └── knowledge-nest/
│           └── page.jsx             # Main Knowledge Nest page
├── components/
│   ├── FileUploadModal.jsx         # File upload modal component
│   └── FileDisplayComponent.jsx    # File display and management component
└── convex/
    ├── schema.js                   # Database schema with knowledge_nest table
    └── knowledgeNest.js           # Convex functions for file operations
```

## Key Functions

### Convex Functions (`convex/knowledgeNest.js`)
- `uploadFileMetadata` - Save file metadata to database
- `getUserOrgDetails` - Get user's organization details for auto-fill
- `getKnowledgeNestFiles` - Retrieve files for user's org/class
- `deleteFile` - Soft delete file (only by uploader)
- `getFileUrl` - Generate secure download URL
- `getSubjects` - Get list of subjects for filtering

### Components
- **FileUploadModal** - Handles file selection, validation, and upload
- **FileDisplayComponent** - Displays files with search, filter, and management options

## Security Features
- **Organization-based Access Control** - Users only see files from their org/class
- **Upload Permissions** - Only verified organization members can upload
- **File Size Limits** - 50MB maximum file size
- **File Type Validation** - Only allowed file types can be uploaded
- **User Authentication** - Requires login and org verification

## Usage Flow
1. User logs in and navigates to Knowledge Nest
2. If not verified, complete organization verification process
3. Once verified, access main Knowledge Nest interface
4. Upload files using the "Upload File" button
5. View and manage files from the shared resources section
6. Search and filter files by subject or uploader
7. Download files shared by classmates

## Implementation Status
✅ Database schema implemented
✅ File upload system with validation
✅ Organization verification system
✅ File display with search/filter
✅ Access control by org/class
✅ Auto-population of user details
✅ Modern UI with dark/light theme support

## Future Enhancements
- [ ] Actual Convex file storage integration (currently simulated)
- [ ] File preview functionality
- [ ] File versioning system
- [ ] Comment/rating system for files
- [ ] Advanced search with tags
- [ ] Bulk upload capability
- [ ] File sharing via links
- [ ] Analytics and usage tracking

## Technical Notes
- Built with Next.js 15, React 19, and Convex
- Uses Tailwind CSS for responsive design
- Implements proper error handling and loading states
- Follows modern React patterns with hooks
- TypeScript-ready architecture
