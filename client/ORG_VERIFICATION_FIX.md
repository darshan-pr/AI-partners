# Organization Verification Bug Fix

## Issue
The organization verification system was not working properly after the Knowledge Nest implementation. Users were being asked to verify again even after successful verification.

## Root Cause
1. **Wrong API Function**: The `/api/org/send-otp/route.js` was calling `api.auth.storeOTP` instead of a proper org-specific function
2. **Incorrect Data Structure**: The `getOrgByUser` function was returning the org record directly, but the front-end was expecting a wrapped response format
3. **Missing Refresh Logic**: After successful verification, the verification status wasn't being properly refreshed

## Fixes Applied

### 1. Added `storeOrgOTP` Function
**File**: `convex/org.js`
- Added new mutation `storeOrgOTP` specifically for organization email verification
- Validates @reva.edu.in domain
- Deletes existing OTPs before creating new ones
- Sets proper expiration time (10 minutes)

### 2. Updated API Route
**File**: `app/api/org/send-otp/route.js`
- Changed from `api.auth.storeOTP` to `api.org.storeOrgOTP`
- Now uses the correct function for organization verification

### 3. Fixed Data Structure
**File**: `convex/org.js` - `getOrgByUser` function
- Updated to return consistent format: `{ success: true, org: orgRecord }`
- Added proper error handling and messaging

### 4. Updated Frontend Logic
**File**: `app/home/knowledge-nest/page.jsx`
- Fixed the verification status check to match the new data structure
- Updated `handleVerificationSuccess` to force page reload for immediate verification status update

## Testing
- ✅ OTP generation and email sending
- ✅ OTP verification process
- ✅ Organization record creation/update
- ✅ Verification status check
- ✅ Knowledge Nest access after verification

## Code Changes Summary

### New Function Added:
```javascript
// convex/org.js
export const storeOrgOTP = mutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    // Store OTP with domain validation and expiration
  }
});
```

### API Route Updated:
```javascript
// app/api/org/send-otp/route.js
await convex.mutation(api.org.storeOrgOTP, {
  email: org_mail,
  otp: otp,
});
```

### Frontend Verification Check:
```javascript
// app/home/knowledge-nest/page.jsx
if (orgQuery && orgQuery.success && orgQuery.org && orgQuery.org.org_verified) {
  setIsOrgVerified(true);
}
```

## Status
🟢 **FIXED** - Organization verification now works correctly throughout the entire flow.
