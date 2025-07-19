# Organization Verification System

## Overview

This feature allows users to verify their organization affiliation by confirming their organization email and providing additional details like class/section and branch.

## Features Implemented

### 1. Database Schema (`convex/schema.js`)

#### New Tables Added:

**`org` Table:**
- `org_id` (string) - Unique organization identifier
- `org_name` (string) - Organization name (extracted from email domain)
- `user_id` (string) - Foreign key referencing the user
- `user_org_mailid` (string) - Organization email address
- `class_sec` (string) - Class/Section information
- `branch` (string) - Academic branch/department
- `isVerified` (boolean) - Verification status
- `createdAt` (number) - Timestamp of creation

**`org_verification` Table:**
- `org_email` (string) - Organization email for verification
- `otp` (string) - One-time password for verification
- `createdAt` (number) - OTP creation timestamp
- `expiresAt` (number) - OTP expiration timestamp
- `isUsed` (boolean) - Whether OTP has been used

### 2. Backend API

#### API Routes (`app/api/auth/`):

**`send-org-otp/route.js`** - Sends OTP to organization email
- Uses existing email infrastructure (nodemailer + Gmail)
- Validates organization email domain (@reva.edu.in)
- Generates 6-digit OTP and stores in database
- Sends formatted email with OTP
- Prevents duplicate organization email registration

**`verify-org-otp/route.js`** - Verifies organization OTP
- Validates OTP against stored value in database
- Checks expiration time (10 minutes)
- Returns success/failure response

#### Convex Functions (`convex/orgVerification.js`):

**`storeOrgOTP`** - Stores OTP in org_verification table
- Removes any existing OTP for the email
- Sets 10-minute expiration time
- Called by the send-org-otp API route

**`verifyOrgOTP`** - Verifies the OTP sent to organization email
- Validates OTP against stored value
- Checks expiration time
- Marks OTP as used after successful verification

**`saveOrgDetails`** - Saves organization details after successful verification
- Requires prior OTP verification
- Generates unique org_id
- Stores class/section and branch information

**`getUserOrgDetails`** - Retrieves organization details for a user
- Returns null if user hasn't completed organization verification

**`checkOrgEmailExists`** - Checks if organization email is already registered

### 3. Frontend Components

#### `OrgVerifyModal.jsx`
A multi-step modal component with:

**Step 1: Email Validation**
- Input field for organization email
- Domain validation (only @reva.edu.in allowed)
- OTP generation and sending

**Step 2: OTP Verification**
- 6-digit OTP input field
- OTP validation with server
- Resend OTP functionality

**Step 3: Organization Details**
- Class/Section input
- Branch selection dropdown
- Final data submission

**Features:**
- Progress indicator showing current step
- Responsive design with dark/light mode support
- Form validation and error handling
- Loading states for all async operations

#### `Navbar.jsx` Updates
- Added "Verify Org" button for unverified users
- Shows organization name for verified users
- Modal integration with state management
- Mobile-responsive implementation

### 4. User Interface Features

#### Desktop View:
- "Verify Org" button appears next to welcome message
- Organization name badge shown after verification
- Clean integration with existing navbar design

#### Mobile View:
- "Verify Organization" button in mobile menu
- Organization info displayed in compact format
- Maintains responsive behavior

### 5. Email Domain Validation

Currently configured to accept only `@reva.edu.in` emails. Additional domains can be added by updating the `allowedDomains` array in `orgVerification.js`.

### 6. Security Features

- OTP expires after 10 minutes
- One-time use OTP tokens
- Email domain validation
- Duplicate registration prevention
- Input sanitization and validation

## Usage Flow

1. **User logs in** to the application
2. **"Verify Org" button** appears in navbar if not already verified
3. **Click button** opens the verification modal
4. **Step 1**: Enter organization email (@reva.edu.in)
5. **Step 2**: Enter 6-digit OTP (currently shown in browser console)
6. **Step 3**: Provide class/section and branch details
7. **Completion**: Organization name appears in navbar

### Development Notes

### Current Features:
- ✅ **Real email sending** using existing nodemailer setup
- ✅ **Professional email template** for organization verification
- ✅ **Integrated with existing auth infrastructure**
- ✅ **Domain validation** for @reva.edu.in
- ✅ **Secure OTP handling** with expiration and one-time use

### For Production:
1. ✅ Email service is already configured (uses existing EMAIL_USER/EMAIL_PASS)
2. Add more allowed email domains as needed
3. Implement proper error logging
4. Add rate limiting for OTP requests
5. Consider adding CAPTCHA for additional security

## File Structure

```
client/
├── convex/
│   ├── schema.js (updated with org tables)
│   └── orgVerification.js (new API functions)
├── components/
│   ├── OrgVerifyModal.jsx (new modal component)
│   └── Navbar.jsx (updated with org verification)
└── app/api/auth/
    ├── send-org-otp/route.js (organization email sending)
    └── verify-org-otp/route.js (organization OTP verification)
```

## Testing

1. Start the development server: `npm run dev`
2. Navigate to the application
3. Log in with an existing account
4. Click "Verify Org" button in navbar
5. Follow the 3-step verification process
6. Check browser console for OTP during step 2
7. Complete verification and observe organization info in navbar

## Configuration

### Allowed Email Domains
Update the `allowedDomains` array in `convex/orgVerification.js`:

```javascript
const allowedDomains = ['reva.edu.in', 'your-domain.edu', 'another-domain.org'];
```

### OTP Expiration Time
Modify the expiration time in `validateOrgEmail` function:

```javascript
const expiresAt = now + (10 * 60 * 1000); // 10 minutes
```

## Future Enhancements

1. **Email Service Integration**: Replace console logging with actual email delivery
2. **Multi-domain Support**: Easy configuration for multiple organization domains
3. **Admin Panel**: Management interface for organization verification
4. **Batch Verification**: Upload CSV for bulk user verification
5. **Integration APIs**: Connect with existing university systems
6. **Analytics**: Track verification completion rates
7. **Notifications**: In-app notifications for verification status
8. **Profile Integration**: Show org details in user profile sections
