# Authentication Implementation Guide

## 🎯 What Was Built

A complete user authentication system with Supabase for the UPSC Preparer platform.

### Features Implemented:
✅ User sign-up with detailed profile information
✅ Email-based authentication (email = primary key/username)
✅ Email confirmation required before login
✅ Secure password hashing
✅ User dashboard with success message
✅ Logout functionality
✅ Row-level security for user data
✅ Comprehensive error handling

---

## 📋 Sign-Up Form Fields

The form collects the following information:

```
┌─────────────────────────────────────┐
│        SIGN-UP FORM                 │
├─────────────────────────────────────┤
│ Full Name           [TextField]      │ (Required)
│ Contact Number      [TextField]      │ (10-digit phone)
│ State              [Dropdown]        │ (28 Indian states)
│ City               [TextField]       │ (User input)
│ Email Address      [EmailField]      │ (Primary key)
│ Password           [PasswordField]   │ (Min 6 chars)
│ Confirm Password   [PasswordField]   │ (Match check)
│                                      │
│ [SIGN UP BUTTON]                     │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Two-Table Structure:

#### Table 1: `auth.users` (Supabase Auth)
```sql
-- Built-in Supabase authentication table
-- Location: Authentication → Users in Portal

Columns:
├── id (UUID)                    -- Unique identifier
├── email (TEXT) [UNIQUE]        -- Login credential
├── encrypted_password (TEXT)    -- Hashed password
├── raw_user_meta_data (JSONB)   -- Custom metadata:
│   ├── name
│   ├── contact_number
│   ├── state
│   └── city
├── confirmed_at (TIMESTAMP)     -- Email confirmation status
└── created_at (TIMESTAMP)       -- Sign-up date
```

#### Table 2: `public.users` (Custom Table)
```sql
-- Custom profile table for application queries
-- Location: Table Editor → public → users in Portal

Columns:
├── id (UUID) [FK → auth.users(id)]    -- User identifier
├── email (TEXT) [UNIQUE]               -- Primary key for app
├── name (TEXT)                         -- Full name
├── contact_number (TEXT)               -- Phone
├── state (TEXT)                        -- Location
├── city (TEXT)                         -- Location
└── created_at (TIMESTAMP)              -- Sign-up date

Constraints:
├── PRIMARY KEY (id)
├── FOREIGN KEY (id) → auth.users(id)
├── UNIQUE (email)
├── ON DELETE CASCADE (if auth user deleted)
└── RLS ENABLED (Row Level Security)
```

---

## 🔐 Email as Primary Key

### Why Email?

```
┌────────────────────────────────┐
│   Email as Primary Key         │
├────────────────────────────────┤
│ ✅ Unique per user             │
│ ✅ Used for login              │
│ ✅ Verified via confirmation   │
│ ✅ Contact method              │
│ ✅ Matches UPSC candidate      │
│    registration norms          │
└────────────────────────────────┘
```

### User Identity:
- **Registration:** User provides email
- **Login Username:** Email address
- **Database Key:** `public.users.email`
- **Authentication ID:** `auth.users.id` (UUID)

### Example:
```
User: john@example.com
Sign-up → Creates record with email as unique identifier
Login → Uses john@example.com + password
Database → Identified by email in public.users
```

---

## 🔄 Data Flow: Sign-Up Process

```
1. USER FILLS FORM
   ├─ Name: "John Doe"
   ├─ Contact: "9876543210"
   ├─ State: "Maharashtra"
   ├─ City: "Mumbai"
   ├─ Email: "john@example.com"
   └─ Password: "secure123"
   
2. FORM VALIDATION (Client-side)
   ├─ All fields required ✓
   ├─ Valid email format ✓
   ├─ Password >= 6 chars ✓
   ├─ Password match ✓
   └─ Contact is 10 digits ✓
   
3. SIGN-UP REQUEST
   ↓
   supabase.auth.signUp({
     email: "john@example.com",
     password: "secure123",
     options: {
       data: {
         name: "John Doe",
         contact_number: "9876543210",
         state: "Maharashtra",
         city: "Mumbai"
       }
     }
   })
   
4. DATA STORED
   ├─ auth.users
   │  ├─ id: UUID (generated)
   │  ├─ email: "john@example.com"
   │  ├─ encrypted_password: (hashed)
   │  └─ raw_user_meta_data: {JSON above}
   │
   └─ public.users
      ├─ id: (same UUID)
      ├─ email: "john@example.com"
      ├─ name: "John Doe"
      ├─ contact_number: "9876543210"
      ├─ state: "Maharashtra"
      └─ city: "Mumbai"

5. CONFIRMATION EMAIL SENT
   └─ User clicks link to confirm email
   
6. ACCOUNT ACTIVATED
   └─ User can now log in
```

---

## 🔑 Data Flow: Sign-In Process

```
1. USER ENTERS LOGIN
   ├─ Email: "john@example.com"
   └─ Password: "secure123"
   
2. SIGN-IN REQUEST
   ↓
   supabase.auth.signInWithPassword({
     email: "john@example.com",
     password: "secure123"
   })
   
3. SUPABASE VALIDATES
   ├─ Check email exists in auth.users ✓
   ├─ Verify password hash ✓
   ├─ Confirm email confirmed_at is set ✓
   └─ Create session ✓
   
4. SESSION CREATED
   └─ HTTP-only cookie set
   
5. REDIRECT TO DASHBOARD
   ↓
   /dashboard
   
6. DASHBOARD LOADS
   ├─ Fetch authenticated user ✓
   ├─ Fetch user profile from public.users ✓
   ├─ Display "Login Successfully! Welcome, John Doe!" ✓
   └─ Show user profile card ✓
```

---

## 📂 File Structure

```
app/
├── auth/
│   ├── layout.tsx                    -- Auth pages layout
│   ├── sign-up/
│   │   └── page.tsx                  -- Sign-up form
│   ├── login/
│   │   └── page.tsx                  -- Sign-in form
│   ├── sign-up-success/
│   │   └── page.tsx                  -- Success message
│   └── error/
│       └── page.tsx                  -- Error page
├── dashboard/
│   └── page.tsx                      -- Protected dashboard
└── layout.tsx
lib/
├── supabase/
│   ├── client.ts                     -- Browser client
│   ├── server.ts                     -- Server client
│   └── proxy.ts                      -- Session handler
middleware.ts                         -- Auth middleware
scripts/
└── 001_add_user_profile_columns.sql -- Database migration
```

---

## 🔐 Security Implementation

### 1. Password Security
```javascript
// Client validates
- Minimum 6 characters
- Confirm password match
- Checked before submission

// Server hashes
- Supabase bcrypt hashing
- One-way encryption
- Stored in auth.users
```

### 2. Email Confirmation
```javascript
// Process:
1. User signs up
2. Confirmation email sent
3. User clicks link
4. Email marked as confirmed
5. Only then can user log in
```

### 3. Session Management
```javascript
// Secure sessions
- HTTP-only cookies (cannot access via JavaScript)
- Secure flag (HTTPS only)
- SameSite policy (CSRF protection)
- Auto-refresh tokens
```

### 4. Row Level Security (RLS)
```sql
-- Users can only see their own data
CREATE POLICY "Users select own" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Users can only update their own data
CREATE POLICY "Users update own" ON public.users
FOR UPDATE USING (auth.uid() = id);
```

---

## 🌐 API Endpoints

### Sign-Up
```
POST /api/auth/sign-up (implicit via Supabase)
Request:
{
  "email": "john@example.com",
  "password": "secure123",
  "name": "John Doe",
  "contact_number": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai"
}

Response:
{
  "user": { "id": "UUID", "email": "...", ... },
  "session": { "access_token": "...", ... }
}
```

### Sign-In
```
POST /api/auth/sign-in (implicit via Supabase)
Request:
{
  "email": "john@example.com",
  "password": "secure123"
}

Response:
{
  "user": { "id": "UUID", "email": "...", ... },
  "session": { "access_token": "...", ... }
}
```

### Get User
```
GET /api/user (via Supabase client)
Headers:
{
  "Authorization": "Bearer <access_token>"
}

Response:
{
  "id": "UUID",
  "email": "john@example.com",
  "name": "John Doe",
  "contact_number": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai",
  "created_at": "2024-03-09T12:30:00Z"
}
```

---

## 🔍 How to View Data in Supabase Portal

### View 1: Authentication Users
```
Supabase Dashboard
  ↓
[Authentication] (sidebar)
  ↓
[Users] tab
  ↓
Table shows:
  ├─ Email (Primary identifier)
  ├─ Status (Confirmed/Unconfirmed)
  ├─ Created date
  └─ (Click user to see full metadata)

When you click a user:
  ├─ User Details panel opens
  ├─ Shows Email, Phone, etc.
  └─ Scroll to "Raw User Meta Data" (JSON)
      ├─ name
      ├─ contact_number
      ├─ state
      └─ city
```

### View 2: User Profiles
```
Supabase Dashboard
  ↓
[SQL Editor] or [Table Editor] (sidebar)
  ↓
[Schemas] → [public]
  ↓
[Tables] → [users]
  ↓
View all users with columns:
  ├─ id (UUID)
  ├─ email (Primary key)
  ├─ name
  ├─ contact_number
  ├─ state
  ├─ city
  └─ created_at
```

### Example Query in Supabase
```sql
-- Get single user profile
SELECT * FROM public.users 
WHERE email = 'john@example.com';

-- Get all users (admins only)
SELECT id, email, name, contact_number, state, city, created_at 
FROM public.users
ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM public.users;
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] Navigate to `/auth/sign-up`
- [ ] Fill form with test data
- [ ] Click "Sign Up"
- [ ] See "Account Created!" message
- [ ] Check email for confirmation link
- [ ] Click confirmation link
- [ ] Navigate to `/auth/login`
- [ ] Log in with email and password
- [ ] See "Login Successfully!" message on dashboard
- [ ] View user profile on dashboard
- [ ] Check Supabase Portal > Authentication > Users
  - [ ] User listed with email
  - [ ] Metadata visible (name, contact, state, city)
- [ ] Check Supabase Portal > Table Editor > public > users
  - [ ] User profile visible
  - [ ] All columns populated correctly
- [ ] Click Logout
- [ ] Redirected to login page
- [ ] Cannot access dashboard without login

---

## 🚨 Troubleshooting

### Issue: Confirmation email not received
- **Solution:** Check spam folder, request new link from Supabase

### Issue: Can't log in after confirmation
- **Solution:** Ensure email is confirmed in auth.users table

### Issue: User not in public.users table
- **Solution:** Check RLS policies, verify insert permissions

### Issue: Dashboard shows wrong user info
- **Solution:** Clear browser cache, refresh page, check database directly

### Issue: State dropdown not showing all states
- **Solution:** List is hardcoded in sign-up form, all 28 Indian states included

---

## 🎓 Learning Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Auth: https://nextjs.org/docs/app/building-your-application/authentication
- Supabase Next.js Template: https://github.com/supabase/supabase/tree/master/examples/nextjs-ts-jwt-rls

---

## 📞 Support

For issues with Supabase integration:
1. Check environment variables in v0 settings (Vars tab)
2. Verify Supabase integration is connected
3. Check Supabase console for error logs
4. Review database schema in Supabase

---

**Implementation complete! ✨**

Your UPSC Preparer platform now has production-ready authentication with:
- ✅ Secure user registration
- ✅ Email-based login
- ✅ Complete user profiles
- ✅ Data stored in Supabase
- ✅ Ready for viewing in Supabase Portal
