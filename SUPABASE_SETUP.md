# Supabase Authentication & User Data Setup

## Overview

This document explains how user data is stored in Supabase and where to find it in the Supabase Portal.

---

## Database Schema

### `auth.users` Table (Supabase Auth System)

This is the built-in authentication table in Supabase. User metadata is stored here.

**Key Columns:**
- `id` - UUID (Primary Key) - Unique user identifier
- `email` - Text - User's email address (used as username/login)
- `raw_user_meta_data` - JSONB - Stores custom metadata during signup

**User Metadata Stored:**
```json
{
  "name": "John Doe",
  "contact_number": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai"
}
```

---

### `public.users` Table (Custom Profile Table)

This is our custom users table that stores denormalized user profile information for easy access.

**Table Structure:**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  contact_number TEXT,
  state TEXT,
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | References auth.users(id) - Primary Key |
| `email` | TEXT | User's email address - Used as unique identifier |
| `name` | TEXT | Full name provided during sign-up |
| `contact_number` | TEXT | 10-digit phone number |
| `state` | TEXT | Indian state (e.g., Maharashtra, Karnataka) |
| `city` | TEXT | City name (e.g., Mumbai, Bangalore) |
| `created_at` | TIMESTAMP | Account creation timestamp |

---

## How to View Data in Supabase Portal

### Step 1: Open Supabase Console
1. Go to [supabase.com](https://supabase.com)
2. Sign in with your account
3. Select your project (upsc_preparer)

### Step 2: View Auth Users
1. Navigate to **Authentication** → **Users**
2. You'll see all registered users with their emails
3. Click on any user to see metadata in the **User Details** panel

**In User Details Panel, look for:**
- Basic Info: Email, Phone, etc.
- Raw User Meta Data: Contains name, contact_number, state, city (as JSON)

### Step 3: View Custom User Profiles
1. Navigate to **SQL Editor** or **Table Editor**
2. Click on **Tables** in the left sidebar
3. Select **public** schema
4. Click on **users** table
5. You'll see all user profiles with columns:
   - id
   - email
   - name
   - contact_number
   - state
   - city
   - created_at

---

## Sign-Up Flow

When a user signs up through `/auth/sign-up`:

1. **Form Input:**
   - Name
   - Contact Number
   - State (dropdown)
   - City
   - Email
   - Password

2. **Data Storage:**
   - User credentials (email, hashed password) → `auth.users` table
   - Custom metadata (name, contact, location) → `auth.users.raw_user_meta_data` (JSONB)
   - User profile → `public.users` table (denormalized copy)

3. **Email Confirmation:**
   - A confirmation email is sent to the user's email address
   - User must click the confirmation link to activate the account
   - Only after confirmation can the user log in

---

## Sign-In Flow

When a user signs in through `/auth/login`:

1. User enters email and password
2. Supabase validates credentials against `auth.users` table
3. If valid, a session is created
4. User is redirected to `/dashboard`
5. Dashboard fetches user profile from `public.users` table
6. A success message is displayed: "Login Successful! Welcome back, {name}!"

---

## User Data Locations

### Email as Primary Key/Username
- **Email is the unique identifier** for user accounts
- Used in both `auth.users.email` and `public.users.email`
- User must confirm email after sign-up before logging in

### Data Redundancy
- `auth.users.raw_user_meta_data` - Stores metadata during signup
- `public.users` - Custom table with user profile for easy querying

### Why Both Tables?
- **auth.users** - Managed by Supabase Auth system
- **public.users** - Custom table we created for application queries and Row Level Security (RLS)

---

## Row Level Security (RLS)

The `public.users` table has RLS enabled to protect user data:

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile" 
ON public.users FOR DELETE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);
```

This means:
- Users can only see their own data
- Admins can see all data (if you add admin policies)
- Data is protected from unauthorized access

---

## API Endpoints

### Sign-Up
- **Route:** `/auth/sign-up`
- **Method:** POST
- **Data Stored:** All user information in both auth.users and public.users

### Sign-In
- **Route:** `/auth/login`
- **Method:** POST
- **Authentication:** Email + Password

### Dashboard
- **Route:** `/dashboard`
- **Method:** GET (Protected - Requires authentication)
- **Shows:** User profile with login success message

---

## Troubleshooting

### User Not Found After Sign-Up
- Check that email is confirmed in Supabase Auth
- Verify user exists in `public.users` table
- Check browser console for errors

### Can't See User Data in Supabase
1. Go to **Authentication** → **Users** to see auth records
2. Go to **Table Editor** → **public** → **users** to see profiles
3. Check email confirmation status

### Data Not Syncing
- The application inserts into `public.users` immediately after auth signup
- Check if RLS policies are blocking the insert
- Verify the Supabase client has proper permissions

---

## Environment Variables

The following environment variables are required:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are automatically set when you connect the Supabase integration in v0.

---

## Files Created

- `lib/supabase/client.ts` - Browser-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/proxy.ts` - Proxy for session management
- `middleware.ts` - Next.js middleware for auth
- `app/auth/sign-up/page.tsx` - Sign-up form
- `app/auth/login/page.tsx` - Sign-in form
- `app/auth/sign-up-success/page.tsx` - Success page
- `app/auth/error/page.tsx` - Error page
- `app/dashboard/page.tsx` - Protected dashboard (shows "Login Successfully!")

---

## Next Steps

1. **Verify email** after signing up to activate your account
2. **Log in** with your email and password
3. **View your profile** on the dashboard
4. **Check Supabase Portal** to see where your data is stored:
   - `Authentication` → `Users` (auth data)
   - `Table Editor` → `public` → `users` (profile data)

---

## Security Notes

✅ **Email is confirmed before account activation**
✅ **Passwords are hashed by Supabase**
✅ **Row Level Security protects user data**
✅ **Sessions are secure with HTTP-only cookies**
✅ **All communication is encrypted over HTTPS**

---

For more information, visit: https://supabase.com/docs
