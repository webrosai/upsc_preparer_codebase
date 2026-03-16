# Authentication Troubleshooting & Database Guide

## Issue: "Invalid login credentials" Error

### Root Cause
Email confirmation is **required by Supabase** before users can log in. This is a security best practice.

### Solution
1. **Sign up with your email and password**
2. **Check your inbox** (and spam folder) for a confirmation email from Supabase
3. **Click the confirmation link** in the email
4. **Now you can sign in** with your email and password

---

## Where Is Sign-Up Data Stored?

Your sign-up information is stored in **TWO places** in Supabase:

### 1. Authentication Users Table (`auth.users`)
**Location:** Supabase Dashboard → Authentication → Users

**What's stored:**
- Email address (as login username)
- Password (hashed with bcrypt)
- User metadata (name, contact_number, state, city)
- Email confirmation status
- Account creation timestamp

**View it:**
```
Supabase Dashboard 
  → Authentication 
  → Users tab 
  → Click on user email 
  → See all stored data including metadata
```

### 2. Public Users Profile Table (`public.users`)
**Location:** Supabase Dashboard → SQL Editor → public → users

**Columns:**
- `id` (UUID) - Unique user identifier
- `auth_user_id` (UUID) - Links to auth.users
- `email_id` (TEXT) - User's email (PRIMARY KEY for profiles)
- `name` (TEXT) - Full name
- `contact_number` (TEXT) - Phone number
- `state` (TEXT) - State/Province
- `city` (TEXT) - City
- `created_at` (TIMESTAMP) - Account creation time

**View it:**
```
Supabase Dashboard 
  → SQL Editor 
  → Click "public" schema 
  → Select "users" table 
  → See all user profiles with complete data
```

---

## Complete Sign-Up Flow (What Happens Behind the Scenes)

### Step 1: User Creates Account
```
User fills form:
- Full Name: John Doe
- Contact: +91 9876543210
- State: Maharashtra
- City: Mumbai
- Email: john@example.com
- Password: securepass123
```

### Step 2: Authentication Created
```
Supabase creates in auth.users:
{
  id: "uuid-12345",
  email: "john@example.com",
  password_hash: "bcrypt_hashed_password",
  user_metadata: {
    name: "John Doe",
    contact_number: "+91 9876543210",
    state: "Maharashtra",
    city: "Mumbai"
  },
  email_confirmed_at: null  // Not confirmed yet
}
```

### Step 3: User Profile Saved
```
Supabase inserts into public.users:
{
  id: "uuid-12345",
  auth_user_id: "uuid-12345",
  email_id: "john@example.com",
  name: "John Doe",
  contact_number: "+91 9876543210",
  state: "Maharashtra",
  city: "Mumbai",
  created_at: "2024-03-10T10:30:00Z"
}
```

### Step 4: Confirmation Email Sent
```
Supabase automatically sends email to john@example.com with:
- Confirmation link
- Welcome message
- Instructions to verify account
```

### Step 5: User Confirms Email
```
User clicks link in email
Supabase updates auth.users:
{
  email_confirmed_at: "2024-03-10T10:35:00Z"  // Now confirmed!
}
```

### Step 6: User Can Log In
```
Now user can sign in with:
- Email: john@example.com
- Password: securepass123
```

---

## Quick Verification Steps

### Check if Email Confirmation Email Was Sent
1. Open your email (check spam folder)
2. Look for email from "noreply@..." or "no-reply@..."
3. Subject should be about confirming your email

### Verify Sign-Up Data in Supabase
**In Authentication Table:**
```
1. Go to Supabase Dashboard
2. Click "Authentication" in left sidebar
3. Click "Users" tab
4. Find your email address
5. Click to expand and see metadata
```

**In Users Profile Table:**
```
1. Go to Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Click "public" schema folder
4. Click "users" table
5. See all columns: email_id, name, contact_number, state, city
```

---

## Email Confirmation Issues

### Problem: Email Not Received
**Solutions:**
1. Check spam/junk folder
2. Check if email address was typed correctly during signup
3. Wait 5 minutes - email may be delayed
4. Try signing up again with correct email

### Problem: Confirmation Link Expired
**Solutions:**
1. Sign up again with your email
2. Click confirmation link within 24 hours
3. If still expired, try again

### Problem: "Email Already Exists"
**Solution:**
- That email is already registered
- Use "Forgot Password" to reset your password instead

---

## Email Sending Setup (Production)

The welcome email system is currently in **logging mode**. To enable actual email sending:

### Option 1: Using Resend (Recommended)
```typescript
// Install: npm install resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: email,
  subject: 'Welcome to UPSCPreparer!',
  html: `<h1>Welcome ${name}!</h1>...`
})
```

### Option 2: Using SendGrid
```typescript
// Install: npm install @sendgrid/mail
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

await sgMail.send({
  to: email,
  from: 'noreply@yourdomain.com',
  subject: 'Welcome to UPSCPreparer!',
  html: `<h1>Welcome ${name}!</h1>...`
})
```

### Option 3: Using AWS SES
```typescript
// Install: npm install @aws-sdk/client-ses
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const client = new SESClient({ region: 'us-east-1' })
// Configure with your email...
```

---

## Database Schema Reference

### users Table (public.users)
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_number TEXT,
  state TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Row Level Security (RLS)
- Users can only see their own data
- Only authenticated users can query
- Data is protected at the database level

---

## Testing the Complete Flow

### Test Sign-Up
1. Click "Start Free Trial" on homepage
2. Click "Create an account" tab
3. Fill in all fields
4. Click "Create Account"
5. See success message

### Test Email Confirmation
1. Check your email (inbox and spam)
2. Click the confirmation link
3. Browser redirects to dashboard (or shows success)

### Test Sign-In
1. Click "Start Free Trial"
2. Click "Sign in" tab (if on signup)
3. Enter email and password
4. Click "Sign in"
5. Should redirect to dashboard

### Verify Data in Supabase
1. Go to Supabase Dashboard
2. Check "Authentication → Users" for email confirmation status
3. Check "SQL Editor → public → users" for full profile data

---

## Common Questions

### Q: Why does sign-up ask for so much information?
**A:** For UPSC preparation platform, we need location data (state/city) to provide relevant content and help you find local study groups.

### Q: Is my password safe?
**A:** Yes! Passwords are hashed with bcrypt before storage. Even Supabase staff cannot see your actual password.

### Q: How do I change my email?
**A:** Email changes require verification. Users typically need to go through account settings (not yet implemented).

### Q: How do I delete my account?
**A:** Account deletion features can be added in the account settings page.

### Q: Can I use the same email for multiple accounts?
**A:** No, email is the unique identifier. One email = One account.

---

## Support

If you're having authentication issues:

1. **Check email confirmation** - Most issues are unconfirmed emails
2. **Verify credentials** - Ensure email and password are correct
3. **Check Supabase status** - Visit status.supabase.com
4. **Review this guide** - Most solutions are above
5. **Check console logs** - Browser dev tools → Console tab for error details
