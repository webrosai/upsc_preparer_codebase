-- Add profile columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add email_id as a unique constraint if it's meant to be used as primary key for login
ALTER TABLE public.users
ADD CONSTRAINT unique_email_id UNIQUE(email_id);
