# UPSC Preparer - Authentication System Setup

## 📋 Overview

A complete authentication system has been implemented using **Supabase** for the UPSC Preparer platform. This document provides a summary of what was built and how to use it.

---

## ✨ What's Been Implemented

### ✅ Sign-Up System
- Form collecting: Name, Contact Number, State, City, Email, Password
- Email validation and confirmation required
- Password hashing and security
- Data stored in both `auth.users` and `public.users` tables

### ✅ Sign-In System
- Email + Password authentication
- Session management
- Secure cookie handling
- User profile retrieval

### ✅ Dashboard
- Protected route (requires login)
- Displays "Login Successfully!" message with user's name
- Shows complete user profile information
- Logout functionality

### ✅ Database Schema
- `auth.users` - Supabase authentication table (for login)
- `public.users` - Custom user profiles table (for app data)
- Email is used as primary key/username for login

### ✅ Security Features
- Email confirmation before account activation
- Bcrypt password hashing
- Row Level Security (RLS) on user data
- HTTP-only secure session cookies
- CSRF protection

---

## 🗂️ Files Created

### Authentication Pages
```
app/auth/
├── sign-up/page.tsx           ← Sign-up form with all fields
├── login/page.tsx             ← Sign-in form
├── sign-up-success/page.tsx    ← Confirmation message
├── error/page.tsx             ← Error handling
└── layout.tsx                 ← Auth layout
```

### Supabase Configuration
```
lib/supabase/
├── client.ts                  ← Browser-side client
├── server.ts                  ← Server-side client
└── proxy.ts                   ← Session management
middleware.ts                  ← Next.js middleware
```

### Database
```
scripts/
└── 001_add_user_profile_columns.sql  ← Migration (already executed)
```

### Protected Routes
```
app/dashboard/page.tsx         ← Protected dashboard with success message
```

### Documentation
```
QUICK_START.md                 ← 5-minute quick start
DATABASE_SCHEMA.md             ← Database structure reference
SUPABASE_SETUP.md              ← Detailed setup guide
IMPLEMENTATION_GUIDE.md        ← Complete implementation details
README_AUTHENTICATION.md       ← This file
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Sign Up
Go to: **`http://localhost:3000/auth/sign-up`**

Fill in:
- Full Name: Your name
- Contact Number: 10-digit phone
- State: Select from dropdown
- City: Your city
- Email: Your email address (needs confirmation)
- Password: Min 6 characters
- Confirm Password: Must match

Click **Sign Up**

### 2. Confirm Email
Check your email inbox and click the confirmation link.

### 3. Sign In
Go to: **`http://localhost:3000/auth/login`**

Enter:
- Email: Same email from sign-up
- Password: Same password

Click **Sign In**

### 4. View Dashboard
You'll see:
- ✅ "Login Successfully!" message
- Your profile with all information
- Logout button

### 5. Check Supabase Portal
1. Open Supabase Dashboard
2. **Authentication → Users** - See your auth record with metadata
3. **SQL Editor → public → users** - See your profile data

---

## 💾 Database Structure

### Where User Data is Stored:

#### `auth.users` Table (Supabase Built-in)
- Location: **Authentication → Users** in Supabase
- Contains: Email (primary for login), password hash, metadata
- Metadata stored as JSON:
  ```json
  {
    "name": "John Doe",
    "contact_number": "9876543210",
    "state": "Maharashtra",
    "city": "Mumbai"
  }
  ```

#### `public.users` Table (Custom)
- Location: **SQL Editor → public → users** in Supabase
- Contains: All user profile information
- Columns: `id`, `email`, `name`, `contact_number`, `state`, `city`, `created_at`
- Email is UNIQUE - used as primary key

### Why Two Tables?
- **auth.users** - Managed by Supabase Auth system
- **public.users** - Our custom table for app queries and Row Level Security
- Redundancy by design for flexibility

---

## 🔑 Email as Primary Key/Username

**Email is the unique identifier for user accounts:**

| What | Where | Usage |
|------|-------|-------|
| Login username | Sign-in form | Email address |
| Primary key | public.users.email | Unique constraint |
| User identifier | Dashboard | Display user info |
| Contact method | Confirmation emails | Email verification |

**Example:**
- User signs up: `john@example.com`
- Logs in with: `john@example.com` (not a separate username)
- Stored as: Unique email in both auth.users and public.users

---

## 🔐 Security Implementation

### Email Confirmation
```
Sign-up → Confirmation email sent → User clicks link → Email confirmed → Can log in
```

### Password Security
- Minimum 6 characters (client validates)
- Bcrypt hashing (Supabase handles)
- Stored encrypted in auth.users
- Never sent back to client

### Session Management
- HTTP-only cookies (JavaScript cannot access)
- Secure flag (HTTPS only)
- Auto-refresh tokens
- CSRF protection

### Data Protection
- Row Level Security on public.users
- Users can only see their own data
- Admins can see all data (with proper policies)

---

## 📍 How to View Data in Supabase

### View 1: Authentication Records
```
Supabase Dashboard
  ↓
Click [Authentication] in sidebar
  ↓
Click [Users] tab
  ↓
See list of all users with emails
  ↓
Click any user to see:
  - Email address
  - Confirmation status
  - Created date
  - Raw metadata (scroll down) - contains name, contact, state, city
```

### View 2: User Profiles
```
Supabase Dashboard
  ↓
Click [SQL Editor] in sidebar
  ↓
Expand [Schemas] → [public]
  ↓
Click [Tables] → [users]
  ↓
See all columns:
  - id (UUID)
  - email ⭐ (Primary key)
  - name
  - contact_number
  - state
  - city
  - created_at
```

### View 3: Run Custom Query
```
Supabase Dashboard
  ↓
Click [SQL Editor]
  ↓
Paste this query:

SELECT id, email, name, contact_number, state, city, created_at
FROM public.users
ORDER BY created_at DESC;

  ↓
Click [Run] - See all users
```

---

## 📊 Sign-Up Form → Database Mapping

| Form Field | Stored In | Column | Required |
|-----------|-----------|--------|----------|
| Full Name | public.users | `name` | ✅ Yes |
| Contact Number | public.users | `contact_number` | ✅ Yes |
| State | public.users | `state` | ✅ Yes |
| City | public.users | `city` | ✅ Yes |
| Email | both tables | `email` | ✅ Yes |
| Password | auth.users | `encrypted_password` | ✅ Yes |

---

## 🌐 Application Routes

| Route | Type | Auth Required | Purpose |
|-------|------|---------------|---------|
| `/auth/sign-up` | Page | ❌ No | Create account |
| `/auth/login` | Page | ❌ No | Sign in |
| `/auth/sign-up-success` | Page | ❌ No | Confirmation |
| `/auth/error` | Page | ❌ No | Error handling |
| `/dashboard` | Page | ✅ Yes | Protected, shows success message |

---

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Can access `/auth/sign-up`
- [ ] Form has all 7 fields (name, contact, state, city, email, password, confirm)
- [ ] Submit form without errors
- [ ] See "Account Created!" message
- [ ] Receive confirmation email
- [ ] Click confirmation link in email
- [ ] Go to `/auth/login`
- [ ] Log in with email + password
- [ ] Dashboard shows "Login Successfully!" message
- [ ] Dashboard shows user profile with all info
- [ ] Logout button works
- [ ] After logout, cannot access dashboard
- [ ] Check Supabase > Authentication > Users
  - [ ] User email visible
  - [ ] Metadata contains name, contact, state, city
- [ ] Check Supabase > SQL Editor > public > users
  - [ ] User record exists
  - [ ] All columns populated

---

## 🔧 Environment Variables

The following are required (auto-set when Supabase integration connected):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These are automatically added when you connect Supabase in v0 settings.

---

## 📚 Documentation Files

### For Quick Reference
- **`QUICK_START.md`** - 5-minute setup, minimal details

### For Database Details
- **`DATABASE_SCHEMA.md`** - Database structure, tables, columns

### For Supabase Portal Navigation
- **`SUPABASE_SETUP.md`** - Step-by-step guide with Supabase Portal screenshots

### For Implementation Details
- **`IMPLEMENTATION_GUIDE.md`** - Complete technical details, data flow, security

---

## 🆘 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No confirmation email | Spam filter | Check spam folder |
| Can't log in | Email not confirmed | Confirm email first |
| User not in database | RLS issue | Check database permissions |
| Wrong user info shown | Cache issue | Refresh page, clear cache |
| Form field missing | Setup incomplete | Check sign-up page |
| Error on login | Wrong credentials | Verify email and password |

---

## 🎯 What Happens at Each Step

### During Sign-Up
```
1. User fills form with 7 fields
2. Client validates all fields
3. Request sent to Supabase Auth
4. Creates record in auth.users with:
   - Email (unique)
   - Hashed password
   - Metadata (name, contact, state, city)
5. Creates record in public.users with:
   - All profile information
6. Confirmation email sent
7. User sees "Account Created!" message
```

### During Email Confirmation
```
1. User receives email with confirmation link
2. Clicks link
3. Email marked as confirmed in auth.users
4. Account now active
```

### During Sign-In
```
1. User enters email and password
2. Supabase validates against auth.users
3. Checks if email is confirmed
4. Creates secure session
5. Redirects to dashboard
6. Dashboard fetches user profile from public.users
7. Shows "Login Successfully!" message
```

### During Dashboard Load
```
1. Check if user is authenticated
2. Fetch user profile from public.users
3. Display profile information
4. Show success message
5. Provide logout button
```

---

## 🚀 Next Steps

1. **Test the system:**
   - Sign up with test email
   - Confirm email
   - Log in
   - View dashboard

2. **Verify data in Supabase:**
   - Check Authentication → Users
   - Check SQL Editor → public → users

3. **Explore dashboard:**
   - View profile information
   - Test logout
   - Test login again

4. **Customize (optional):**
   - Add more fields to form
   - Modify dashboard appearance
   - Add profile edit functionality
   - Implement password reset

---

## 📞 Support & Resources

### Documentation
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Vercel v0: https://v0.dev

### In This Project
- See `QUICK_START.md` for fast setup
- See `DATABASE_SCHEMA.md` for database reference
- See `SUPABASE_SETUP.md` for Supabase navigation
- See `IMPLEMENTATION_GUIDE.md` for technical details

---

## ✨ Summary

**You now have a complete, secure authentication system with:**

✅ User registration with detailed profiles
✅ Email confirmation requirement
✅ Secure login with email as primary key
✅ Protected dashboard with success message
✅ Complete user profile display
✅ Data stored in Supabase (viewable in portal)
✅ Row-level security
✅ Comprehensive error handling
✅ Production-ready implementation

**Start here:** Go to `http://localhost:3000/auth/sign-up` 🎉

---

**Questions? Check the documentation files or view data in Supabase Portal!**
