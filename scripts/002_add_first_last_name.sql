-- Add first_name and last_name columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Update existing data: split 'name' column into first_name and last_name
UPDATE public.users
SET 
  first_name = CASE 
    WHEN name IS NOT NULL THEN SPLIT_PART(name, ' ', 1)
    ELSE NULL
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
    THEN ARRAY_TO_STRING(ARRAY[SPLIT_PART(name, ' ', 2)], ' ')
    ELSE NULL
  END
WHERE first_name IS NULL OR last_name IS NULL;
