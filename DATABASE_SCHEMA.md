# User Data Storage - Quick Reference

## 📊 Database Tables

### 1. `auth.users` (Supabase Built-in)
**Location:** Authentication → Users in Supabase Portal
**Primary Purpose:** Authentication & Authorization

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique user identifier |
| `email` | TEXT | Login email (unique) |
| `encrypted_password` | TEXT | Hashed password |
| `raw_user_meta_data` | JSONB | Stores custom metadata |
| `confirmed_at` | TIMESTAMP | Email confirmation status |
| `created_at` | TIMESTAMP | Account creation time |

**Sample raw_user_meta_data:**
```json
{
  "name": "John Doe",
  "contact_number": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai"
}
```

---

### 2. `public.users` (Custom Table)
**Location:** Table Editor → public → users in Supabase Portal
**Primary Purpose:** User profiles & application queries

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | - | References `auth.users(id)` |
| `email` | TEXT | - | User's email (unique identifier) |
| `name` | TEXT | NULL | Full name |
| `contact_number` | TEXT | NULL | 10-digit phone number |
| `state` | TEXT | NULL | Indian state |
| `city` | TEXT | NULL | City name |
| `created_at` | TIMESTAMP | NOW() | Account creation time |

---

## 🔄 Data Flow

```
SIGN-UP FORM
    ↓
    ├─→ auth.users (credentials)
    │    └─→ raw_user_meta_data (name, contact, state, city)
    │
    └─→ public.users (profile data)
         ├─ id (from auth user)
         ├─ email
         ├─ name
         ├─ contact_number
         ├─ state
         └─ city
```

---

## 🔑 Primary Key Strategy

**Email as Primary Key:**
- ✅ Email is UNIQUE in `auth.users`
- ✅ Email is UNIQUE in `public.users`
- ✅ Recommended as username for UPSC preparer context
- ✅ Users identified by: `email`

**Example:**
- User signs up with: `john@example.com`
- Login username: `john@example.com`
- Database identifier: Email address

---

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| **Email Confirmation** | Required before login |
| **Password Hashing** | bcrypt (Supabase) |
| **Row Level Security** | RLS policies on `public.users` |
| **Session Management** | HTTP-only cookies |
| **Data Encryption** | All data encrypted at rest |

---

## 📍 Where to Find Data in Supabase Portal

### View Authentication Users
```
Supabase Dashboard
  ↓
Authentication
  ↓
Users
  ↓
Click any user to see:
  - Email
  - Confirmation status
  - Raw metadata (JSON)
  - Created date
```

### View User Profiles
```
Supabase Dashboard
  ↓
SQL Editor (or Table Editor)
  ↓
Schemas → public
  ↓
Tables → users
  ↓
View all profiles with columns:
  - id, email, name
  - contact_number, state, city
  - created_at
```

---

## 📋 Sign-Up Form Fields → Database Mapping

| Form Field | Database Table | Column | Required |
|-----------|--------|--------|----------|
| Full Name | public.users | `name` | ✅ Yes |
| Contact Number | public.users | `contact_number` | ✅ Yes |
| State | public.users | `state` | ✅ Yes |
| City | public.users | `city` | ✅ Yes |
| Email | both tables | `email` | ✅ Yes |
| Password | auth.users | `encrypted_password` | ✅ Yes |

---

## 🚀 Application Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/auth/sign-up` | Create new account | ❌ No |
| `/auth/login` | Sign in | ❌ No |
| `/auth/sign-up-success` | Confirmation page | ❌ No |
| `/dashboard` | User dashboard | ✅ Yes |

**Dashboard Features:**
- ✅ Shows "Login Successfully!" message
- ✅ Displays user profile (name, email, contact, location)
- ✅ Logout button

---

## 🔍 Email as Primary Key Benefits

✅ **Unique Identifier:** One email = One account
✅ **User-Friendly:** Users remember their email
✅ **Confirmation:** Email verification ensures valid contact
✅ **UPSC Context:** Candidates typically use email for all registrations
✅ **Simple Queries:** Easy to filter by email

---

## ⚠️ Important Notes

1. **Email Confirmation Required**
   - Users receive confirmation email after sign-up
   - Must click confirmation link to activate
   - Only confirmed users can log in

2. **Data Redundancy by Design**
   - `auth.users` stores metadata (Supabase system)
   - `public.users` stores profiles (application layer)
   - Redundancy enables flexible querying and RLS

3. **No Direct Database Insert**
   - Don't manually insert into `auth.users`
   - Use Supabase Auth API instead
   - Custom data goes to `public.users`

4. **RLS Protection**
   - Users can only see their own profile
   - Admins can see all data (with proper policies)
   - Prevents unauthorized data access

---

## 📊 Sample Data Structure

**After user signs up and confirms email:**

### In `auth.users`:
```
id:             "550e8400-e29b-41d4-a716-446655440000"
email:          "john@example.com"
encrypted_password: "$2a$..." (hashed)
confirmed_at:   "2024-03-09T12:30:00Z"
raw_user_meta_data: {
  "name": "John Doe",
  "contact_number": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai"
}
```

### In `public.users`:
```
id:              "550e8400-e29b-41d4-a716-446655440000"
email:           "john@example.com"
name:            "John Doe"
contact_number:  "9876543210"
state:           "Maharashtra"
city:            "Mumbai"
created_at:      "2024-03-09T12:30:00Z"
```

---

## 🎯 Next Steps to Verify Setup

1. **Sign up** at `/auth/sign-up` with test data
2. **Check email** and click confirmation link
3. **Log in** at `/auth/login`
4. **View dashboard** at `/dashboard` (shows success message)
5. **Open Supabase Portal** and verify:
   - Authentication → Users (see your auth record)
   - Table Editor → public → users (see your profile)

---

## 🆘 Debugging Checklist

- [ ] Can access `/auth/sign-up` page
- [ ] Form submits without errors
- [ ] Confirmation email received
- [ ] Can log in after confirmation
- [ ] Dashboard shows success message
- [ ] User visible in Supabase Auth
- [ ] User visible in public.users table
- [ ] All form data matches database fields

---

**For detailed information, see `SUPABASE_SETUP.md`**
