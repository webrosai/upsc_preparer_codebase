# Supabase Integration Guide - Sign-In/Sign-Up Flow

## Overview

Supabase authentication has been integrated into your existing sign-in dialog. The implementation includes both sign-in and sign-up flows within the same dialog component.

---

## How It Works

### 1. **Sign-In Flow**
- User clicks "Sign In" or "Start Free Trial" button
- Dialog opens with email/password fields
- User submits credentials
- Supabase authenticates the user
- On success: Redirects to `/dashboard` and shows success message
- On error: Displays error message

### 2. **Sign-Up Flow**
- User clicks "Create an account" link in the dialog
- Form switches to sign-up tab
- User fills in:
  - Full Name
  - Contact Number
  - State
  - City
  - Email (used as primary key/username)
  - Password (min 6 characters)
  - Confirm Password
- Supabase creates account and stores metadata
- User receives email confirmation link
- After confirming email, user can sign in

---

## Files Modified

### 1. **components/sign-in-dialog.tsx** (MAIN FILE)
Complete rewrite with Supabase integration:
- Added state management for sign-in and sign-up forms
- Integrated Supabase client initialization
- Implemented `handleSignIn()` function
- Implemented `handleSignUp()` function
- Created conditional UI for signin/signup tabs
- Added error and success message display
- Added loading states with spinner

### 2. **components/hero.tsx** (UPDATED)
- Made component client-side compatible
- Added sign-in dialog state management
- Connected "Start Free Trial" button to open sign-in dialog
- Added SignInDialog component import

### 3. **components/cta.tsx** (UPDATED)
- Made component client-side compatible
- Added sign-in dialog state management
- Connected "Start Free Trial" button to open sign-in dialog
- Added SignInDialog component import

### 4. **Database**
- `scripts/001_add_user_profile_columns.sql` (already executed)
- Adds columns to `users` table: `name`, `contact_number`, `state`, `city`

---

## User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                            │
│  (Hero, Features, CTA with "Start Free Trial" buttons)     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Click "Start Free Trial" or "Sign In"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SIGN-IN DIALOG OPENS                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Welcome Back!                                        │   │
│  │ New to UPSCPreparer? Create an account              │   │
│  │                                                      │   │
│  │ ┌──────────────────────────────────────────────┐   │   │
│  │ │ Email: [              ]                       │   │   │
│  │ │ Password: [              ]                    │   │   │
│  │ │ [Sign in]                                     │   │   │
│  │ └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │ (User clicks "Create an account" to switch tab)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ Sign In                    ▼ Sign Up
   ┌──────────────┐           ┌──────────────────────┐
   │ Existing     │           │ Create Account Tab   │
   │ User         │           │ - Full Name          │
   │ Enters Email │           │ - Contact Number     │
   │ & Password   │           │ - State              │
   └──────┬───────┘           │ - City               │
          │                   │ - Email              │
          ▼                   │ - Password           │
   Authenticate in            │ - Confirm Password   │
   Supabase                    └──────┬──────────────┘
          │                          │
          ▼                          ▼
   ┌──────────────┐          Create Account in
   │ Session      │          Supabase
   │ Created      │               │
   └──────┬───────┘               ▼
          │                   Send Confirmation
          │                   Email
          │                       │
          │                       ▼
          │                   User Confirms
          │                   Email
          │                       │
          └─────────────┬─────────┘
                        │
                        ▼
                   REDIRECT TO DASHBOARD
                   Show "Login Successfully!"
                   message with user info
```

---

## Database Storage

### Supabase Auth Table (auth.users)
```sql
-- Supabase managed authentication table
id: UUID (unique)
email: VARCHAR (primary key/username)
encrypted_password: VARCHAR (bcrypt hashed)
raw_user_meta_data: JSONB (contains user profile fields)
  - name: Full name entered at signup
  - contact_number: Phone number
  - state: State from dropdown
  - city: City entered
```

### Public Users Table (public.users)
```sql
-- Custom table for additional user data
id: UUID (PRIMARY KEY, references auth.users.id)
email: VARCHAR (UNIQUE - primary key/username)
name: VARCHAR
contact_number: VARCHAR
state: VARCHAR
city: VARCHAR
created_at: TIMESTAMP
```

---

## Code Structure

### Sign-In Dialog Component States

```typescript
// Sign-In State
const [signInEmail, setSignInEmail] = useState("")
const [signInPassword, setSignInPassword] = useState("")

// Sign-Up State
const [signUpName, setSignUpName] = useState("")
const [signUpContact, setSignUpContact] = useState("")
const [signUpState, setSignUpState] = useState("")
const [signUpCity, setSignUpCity] = useState("")
const [signUpEmail, setSignUpEmail] = useState("")
const [signUpPassword, setSignUpPassword] = useState("")
const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("")

// UI State
const [activeTab, setActiveTab] = useState("signin")
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [message, setMessage] = useState<string | null>(null)
```

### Key Functions

#### handleSignIn()
```typescript
// 1. Prevent default form submission
// 2. Clear previous errors
// 3. Call supabase.auth.signInWithPassword()
// 4. On success: Redirect to /dashboard
// 5. On error: Display error message
```

#### handleSignUp()
```typescript
// 1. Validate all fields are filled
// 2. Validate password match
// 3. Validate password length (min 6)
// 4. Call supabase.auth.signUp() with metadata
// 5. On success: Show confirmation email message
// 6. On error: Display error message
```

---

## Email as Primary Key

In this implementation:
- **Email is the unique identifier** (username equivalent)
- Each email can only have ONE account
- Email must be verified before sign-in works
- Email is used to link auth.users → public.users

Example:
```
User john@example.com:
  - Signs up with contact: 9876543210, state: Maharashtra, city: Mumbai
  - Receives confirmation email
  - Confirms email
  - Signs in with email: john@example.com
  - Data stored in both auth.users AND public.users tables
```

---

## View Data in Supabase Portal

### Option 1: Authentication Records
```
1. Go to: Supabase Dashboard
2. Select your project
3. Navigate to: Authentication → Users
4. Click any email to see:
   - Email address
   - User metadata (name, contact_number, state, city)
   - Last sign in time
```

### Option 2: User Profiles Table
```
1. Go to: Supabase Dashboard
2. Navigate to: SQL Editor
3. Select: public.users table
4. View all columns:
   - id (UUID)
   - email (unique)
   - name
   - contact_number
   - state
   - city
   - created_at
```

---

## Testing the Flow

### 1. Test Sign-Up
```
1. Open the app
2. Click "Start Free Trial"
3. Click "Create an account"
4. Fill in:
   - Name: John Doe
   - Contact: 9876543210
   - State: Maharashtra
   - City: Mumbai
   - Email: john@example.com
   - Password: Test123
   - Confirm: Test123
5. Click "Create Account"
6. Check your email for confirmation link
7. Click confirmation link
8. Proceed to sign in
```

### 2. Test Sign-In
```
1. Open the app
2. Click "Sign In"
3. Enter:
   - Email: john@example.com
   - Password: Test123
4. Click "Sign in"
5. Should redirect to /dashboard
6. Should show "Login Successfully!" message
```

### 3. Verify in Supabase
```
1. Supabase → Authentication → Users
   → Click john@example.com
   → See metadata with name, contact, state, city

2. Supabase → SQL Editor → Select * from public.users
   → See john@example.com row with all profile data
```

---

## Security Features

✅ **Password Hashing**: Supabase uses bcrypt (industry standard)
✅ **Email Verification**: Required before full account activation
✅ **Secure Sessions**: HTTP-only cookies managed by Supabase
✅ **Row Level Security**: Can be enabled for public.users table
✅ **Metadata Storage**: User data stored securely in auth.users

---

## Important Notes

1. **Email Confirmation**: Users must confirm their email before they can sign in completely
2. **Metadata vs Profile Table**: Signup metadata goes to auth.users, full profile in public.users
3. **Error Handling**: All errors from Supabase are caught and displayed to user
4. **Loading States**: Buttons show spinner and disable during requests
5. **Navigation**: On success, users are redirected to /dashboard (which is protected)

---

## Next Steps

1. **Test the flow** with real email account
2. **Monitor errors** in browser console
3. **Verify data** in Supabase Portal
4. **Add email templates** for confirmation emails in Supabase
5. **Add password reset** functionality if needed
6. **Enable RLS** on public.users table for production

---

## Support

- Check browser console for any errors
- Verify Supabase project is connected (check environment variables)
- Ensure email verification is working (check spam folder)
- Contact Supabase support if authentication fails
