# Complete Testing Guide - Sign-Up & Sign-In

## Prerequisites
- Supabase account (connected)
- Application running locally
- Email access for receiving confirmation links

---

## Test 1: Sign-Up Flow (Creating New Account)

### Step 1: Open Sign-Up Dialog
1. Go to `http://localhost:3000`
2. Click **"Start Free Trial"** button (Hero section)
3. Dialog opens → Click **"Create an account"** tab

### Step 2: Fill Sign-Up Form
Fill in the following:
```
Full Name:        John Test
Contact Number:   +91 9876543210
State:            Maharashtra
City:             Mumbai
Email:            john.test@example.com
Password:         TestPassword123
Confirm Password: TestPassword123
```

**Important:** Use a **real email address** you can access to receive confirmation link.

### Step 3: Submit Form
- Click **"Create Account"** button
- See green success message: "Sign up successful! Please check your email..."

### Step 4: Verify Account Created in Supabase

**In Authentication Table:**
1. Go to Supabase Dashboard
2. Click **Authentication** → **Users** tab
3. Look for `john.test@example.com`
4. Click to expand
5. Verify:
   - ✓ Email is there
   - ✓ Metadata shows: name, contact_number, state, city
   - ✗ email_confirmed_at is NULL (not confirmed yet)

**In User Profile Table:**
1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **public** folder → **users** table
4. Find the row with email_id = `john.test@example.com`
5. Verify all columns are populated:
   ```
   email_id:        john.test@example.com
   name:            John Test
   contact_number:  +91 9876543210
   state:           Maharashtra
   city:            Mumbai
   created_at:      [timestamp]
   ```

### Step 5: Check Confirmation Email
1. Open your email inbox (and spam folder)
2. Look for email from Supabase (subject: "Confirm your email...")
3. **Expected:** Email from `noreply@...` with confirmation link
4. **If missing:** Check spam/junk folder or wait 5 minutes

### Step 6: Click Confirmation Link
1. Open the confirmation email
2. Click the **"Confirm your email"** link (or similar)
3. Browser tab should open Supabase confirmation page
4. Return to Supabase Dashboard

### Step 7: Verify Email Confirmation
1. Refresh Supabase → **Authentication** → **Users**
2. Click `john.test@example.com` again
3. Check **email_confirmed_at** field
4. Should now show timestamp (was NULL before)
5. ✓ Email is confirmed!

---

## Test 2: Sign-In Flow (With Confirmed Email)

### Step 1: Open Sign-In Dialog
1. Go to `http://localhost:3000`
2. Click **"Start Free Trial"** button
3. Dialog opens → Ensure you're on **"Welcome Back!"** tab

### Step 2: Enter Credentials
```
Email:    john.test@example.com
Password: TestPassword123
```

### Step 3: Click Sign-In
- Click **"Sign in"** button
- See message: "Sign in successful! Redirecting to dashboard..."

### Step 4: Verify Redirect
- Should redirect to `/dashboard`
- Should see success message: "Login Successful! Welcome back, John Test!"
- Dashboard content should be visible

---

## Test 3: Sign-In Failure Cases

### Test 3A: Email Not Confirmed
**Setup:**
1. Sign up with new email
2. DO NOT confirm email
3. Try to sign in

**Expected Result:**
- Error message: "Invalid login credentials" OR "Email not confirmed"
- Cannot access dashboard
- Need to confirm email first

**Fix:**
1. Check email inbox
2. Click confirmation link
3. Now try signing in again → Should work

### Test 3B: Wrong Password
**Steps:**
1. Use correct email
2. Use WRONG password
3. Click "Sign in"

**Expected Result:**
- Error message: "Invalid email or password. Please check and try again."
- Cannot access dashboard

**Fix:**
1. Use correct password
2. Or use "Forgot password" link

### Test 3C: Wrong Email
**Steps:**
1. Use WRONG email
2. Use any password
3. Click "Sign in"

**Expected Result:**
- Error message: "Invalid email or password. Please check and try again."
- Cannot access dashboard

**Fix:**
1. Use correct email from sign-up
2. Or sign up with correct email

### Test 3D: Email Already Exists
**Steps:**
1. Sign up with `john.test@example.com` (already exists)
2. Try to sign up again

**Expected Result:**
- Error message: "User already registered" or "Email already exists"

**Fix:**
1. Use different email
2. Or use "Forgot password" to reset existing account

---

## Test 4: Verify Data in Supabase Tables

### Query 1: View All Users
Run in SQL Editor:
```sql
SELECT email_id, name, contact_number, state, city, created_at 
FROM public.users
ORDER BY created_at DESC;
```

**Expected Output:**
```
| email_id              | name      | contact_number  | state | city   | created_at          |
|:--------------------- |:----------|:---------------:|:-----:|:------:|:-------------------:|
| john.test@example.com | John Test | +91 9876543210  | MH    | Mumbai | 2024-03-10 10:30:00 |
```

### Query 2: Check Email Confirmation Status
Run in SQL Editor:
```sql
SELECT 
  pu.email_id,
  pu.name,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✓ Confirmed'
    ELSE '✗ Not Confirmed'
  END as confirmation_status,
  au.created_at as signup_date,
  au.email_confirmed_at as confirmed_date
FROM public.users pu
LEFT JOIN auth.users au ON pu.auth_user_id = au.id
ORDER BY pu.created_at DESC;
```

**Expected Output:**
```
| email_id              | name      | confirmation_status | signup_date         | confirmed_date      |
|:--------------------- |:----------|:-------------------:|:-------------------:|:-------------------:|
| john.test@example.com | John Test | ✓ Confirmed         | 2024-03-10 10:30:00 | 2024-03-10 10:35:00 |
```

### Query 3: Count Active Users
Run in SQL Editor:
```sql
SELECT COUNT(*) as total_users 
FROM public.users;
```

---

## Test 5: Email Workflow

### What Should Happen During Sign-Up

1. **User submits form** → Data validated
2. **Auth account created** → Email + password saved
3. **Profile saved** → public.users record created
4. **Confirmation email sent** → From Supabase
5. **User receives email** → In inbox/spam
6. **User clicks link** → Email confirmed
7. **User can log in** → Full access

### Email Details

**From:** `noreply@...` (Supabase system email)
**Subject:** "Confirm your email" or similar
**Contains:** Confirmation link
**Expires:** 24 hours (default)
**If expired:** Re-sign up to get new confirmation email

---

## Test 6: Complete User Journey

### Journey 1: New User Sign-Up → Confirm → Login

**Time: ~5 minutes**

1. **Sign up** with email (confirm form filled)
   - Redirects to sign-in tab
2. **Wait** for confirmation email (~2 seconds to 5 minutes)
3. **Open email** and click confirmation link
4. **Sign in** with same email and password
5. **See dashboard** with success message
6. **Verify data** in Supabase tables

### Journey 2: Existing User Sign-In

**Time: ~1 minute**

1. **Click** "Start Free Trial"
2. **Enter email and password**
3. **Click Sign in**
4. **See dashboard** immediately

---

## Troubleshooting Tests

### Test: Is Supabase Connected?
1. Check environment variables in Settings
2. Verify: `NEXT_PUBLIC_SUPABASE_URL` is set
3. Verify: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
4. Try signing up → Should work

### Test: Is Email Table Created?
1. Go to Supabase → SQL Editor
2. Look for **public** → **users** table
3. Should exist with columns: email_id, name, contact_number, state, city
4. If missing, run setup script

### Test: Is RLS Enabled?
1. Go to users table settings
2. Check if RLS is **Enabled**
3. If no, enable it
4. Verify policies are in place

### Test: Can You Query the Table?
Run in SQL Editor:
```sql
SELECT * FROM public.users LIMIT 1;
```

Expected: See one row with data or empty result (no error)

### Test: Is Auth Working?
1. Try signing up
2. Check Supabase → Authentication → Users
3. New user should appear
4. Check email_confirmed_at field

---

## Success Criteria

✓ Sign up with form
✓ User appears in Supabase (Authentication → Users)
✓ User appears in Supabase (SQL Editor → public.users)
✓ Confirmation email sent
✓ Email confirmed after clicking link
✓ Can sign in with email and password
✓ Dashboard accessible after login
✓ All user data stored correctly
✓ Email confirmation required before login
✓ Error messages are helpful and clear

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid login credentials" | Email not confirmed | Check inbox, click confirmation link |
| Can't find confirmation email | Spam folder, typo | Check spam, verify email in signup |
| Can't sign up | Email already exists | Use different email or reset password |
| Can't access dashboard | Not logged in | Sign in with correct credentials |
| Data not in Supabase | Upload failed | Check browser console for errors |
| Empty users table | No signups yet | Complete sign-up test |

---

## Next Steps

After testing:

1. **Production Deployment**
   - Add real email service (Resend, SendGrid)
   - Set up email templates
   - Configure domain

2. **User Experience**
   - Add "Forgot Password" flow
   - Add profile edit page
   - Add account settings

3. **Security**
   - Enable multi-factor authentication
   - Add rate limiting
   - Monitor auth logs

4. **Analytics**
   - Track signups
   - Track login attempts
   - Monitor dropoff points
