# Simplified OTP-Based Authentication System

This project now uses a simplified authentication system with OTP verification instead of traditional password-based authentication.

## Features

- **Single Auth Page**: Handles both login and registration flows
- **OTP Verification**: Email-based OTP system using Nodemailer
- **Simplified Registration**: Only requires username, email, and phone number
- **Email Verification**: Users must verify their email via OTP to complete registration
- **Automatic User Detection**: System checks if user exists and routes accordingly

## Database Schema

### Tables

1. **register**: Stores basic user information
   - `username`: Unique username
   - `email`: User's email address
   - `phoneNumber`: User's phone number
   - `isVerified`: Boolean flag for email verification status
   - `createdAt`: Registration timestamp

2. **login**: Stores authentication session data
   - `email`: User's email address
   - `otp`: Current/last OTP used
   - `status`: Login status (true/false)
   - `lastLoggedIn`: Last login timestamp
   - `lastLoggedOut`: Last logout timestamp
   - `lastLoginDuration`: Duration of last session

3. **verification**: Stores OTP verification data
   - `email`: User's email address
   - `otp`: Generated OTP
   - `createdAt`: OTP generation timestamp
   - `expiresAt`: OTP expiration timestamp
   - `isUsed`: Boolean flag if OTP has been used

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Convex (already configured)
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Email Configuration (Gmail)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_app_password
```

### 2. Gmail Setup for Nodemailer

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
   - Use this app password in `EMAIL_PASS` (not your regular Gmail password)

### 3. API Routes

The system includes three API routes:

- `/api/auth/send-otp` - Sends OTP to user's email
- `/api/auth/verify-otp` - Verifies the OTP
- `/api/auth/get-user` - Checks if user exists

## User Flow

### Registration Flow
1. User enters email on auth page
2. System checks if email exists in database
3. If not exists, user proceeds to registration form
4. User fills username and phone number
5. System creates user record and sends OTP
6. User verifies OTP to complete registration

### Login Flow
1. User enters email on auth page
2. System checks if email exists and is verified
3. If exists and verified, system sends OTP
4. User enters OTP to login

## Authentication Changes

- **No more passwords**: System uses OTP-based authentication
- **Email-centric**: All authentication is tied to email addresses
- **Simplified user data**: Only essential fields required
- **Automatic verification**: Email verification is mandatory

## Routes Updated

- **Landing page** (`/`): Updated buttons to point to `/auth`
- **Navbar**: Login/Register buttons now point to `/auth`
- **Auth page** (`/auth`): New unified authentication page

## OTP Configuration

- **OTP Length**: 6 digits
- **Expiry Time**: 10 minutes
- **Email Template**: HTML formatted with styling
- **Automatic Cleanup**: Old unused OTPs are automatically deleted

## Security Features

- OTPs expire after 10 minutes
- Each OTP can only be used once
- Automatic cleanup of expired/used OTPs
- Email verification required for all users
