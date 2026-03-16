# Quick Start Guide - Authentication Setup

## 🚀 Getting Started in 5 Steps

### Step 1: Sign Up
1. Go to: `http://localhost:3000/auth/sign-up`
2. Fill in the form:
   - **Full Name:** Enter your name
   - **Contact Number:** 10-digit phone (e.g., 9876543210)
   - **State:** Select from dropdown (all Indian states)
   - **City:** Enter your city
   - **Email Address:** Use a real email (needed for confirmation)
   - **Password:** Min 6 characters
   - **Confirm Password:** Must match
3. Click **"Sign Up"** button

### Step 2: Confirm Email
1. Check your email inbox (or spam folder)
2. Look for subject: "Confirm your email"
3. Click the confirmation link in the email
4. Email is now confirmed ✓

### Step 3: Sign In
1. Go to: `http://localhost:3000/auth/login`
2. Enter:
   - **Email:** Same email you used for sign-up
   - **Password:** Same password
3. Click **"Sign In"** button
4. You'll see: **"Login Successfully!"** message ✓

### Step 4: View Your Profile
- Dashboard shows:
  - Your name
  - Your email
  - Contact number
  - State
  - City
  - Success message

### Step 5: Check Supabase Portal

#### View in Authentication
```
1. Open Supabase Dashboard
2. Go to: Authentication → Users
3. Find your email in the list
4. Click on your email to see:
   - Confirmation status
   - Raw metadata (JSON):
     {
       "name": "Your Name",
       "contact_number": "9876543210",
       "state": "Maharashtra",
       "city": "Mumbai"
     }
```

#### View in Database
```
1. Open Supabase Dashboard
2. Go to: SQL Editor (or Table Editor)
3. Select: public → users table
4. See your profile with columns:
   - id (UUID)
   - email ⭐ (Primary key)
   - name
   - contact_number
   - state
   - city
   - created_at
```

---

## 📍 Application URLs

| Page | URL | Purpose |
|------|-----|---------|
| Sign Up | `/auth/sign-up` | Create new account |
| Sign In | `/auth/login` | Log in |
| Success | `/auth/sign-up-success` | After sign-up |
| Dashboard | `/dashboard` | After login |
| Logout | (button on dashboard) | Sign out |

---

## 💾 Where Data is Stored

### In Supabase:

#### Option 1: Metadata (in auth.users)
```
Authentication → Users → Click user
Look at "Raw User Meta Data" section (JSON)
```

#### Option 2: Profile (in public.users table)
```
SQL Editor → public → users table
See all your profile information in columns
```

**Both contain the same information - just stored in 2 places for redundancy**

---

## 🔑 Login Credentials

After sign-up and email confirmation, you can log in with:
- **Username/Email:** The email address you signed up with
- **Password:** The password you created (min 6 characters)

**Example:**
- Email: `john@example.com`
- Password: `mysecurepassword123`

---

## ✅ Verification Steps

After completing all steps, verify:

1. ✓ Sign-up form works
2. ✓ Received confirmation email
3. ✓ Email confirmation works
4. ✓ Can log in
5. ✓ Dashboard shows success message
6. ✓ Profile shows correct info
7. ✓ Data visible in Supabase Portal (Authentication)
8. ✓ Data visible in Supabase Portal (Users table)

---

## 🆘 Troubleshooting Quick Tips

| Issue | Solution |
|-------|----------|
| No confirmation email | Check spam folder, resend from Supabase |
| Can't log in | Ensure email is confirmed first |
| Wrong user info on dashboard | Refresh page, clear cache |
| Can't see data in Supabase | Check Supabase integration is connected |
| Password error | Must be min 6 characters, passwords must match |

---

## 📊 Sample Test Data

Use this to test the system:

```
Full Name:      John Doe
Contact:        9876543210
State:          Maharashtra
City:           Mumbai
Email:          testuser@example.com
Password:       Test@123456
```

---

## 🔐 Security Features

✅ **Email confirmation required** before login
✅ **Passwords hashed** - stored securely
✅ **Session cookies** - HTTP-only, secure
✅ **Row level security** - users see only their data
✅ **Email is primary key** - unique identifier per account

---

## 📚 Full Documentation

For more details, see:
- `DATABASE_SCHEMA.md` - Database structure
- `SUPABASE_SETUP.md` - Detailed Supabase setup
- `IMPLEMENTATION_GUIDE.md` - Complete implementation details

---

## 🎯 Next Steps After Login

1. ✓ View profile on dashboard
2. ✓ Log out and log back in
3. ✓ Verify data in Supabase
4. ✓ Test with different users
5. ✓ Explore dashboard features

---

**You're all set! Start with `/auth/sign-up` 🎉**
