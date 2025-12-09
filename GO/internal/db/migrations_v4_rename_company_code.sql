-- Migration V4: Fix column name mismatch and status format
-- This migration fixes compatibility issues between database schema and Go code

-- Step 1: Check if company_code exists and rename to company_id
DO $$ 
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'company_code'
    ) INTO col_exists;
    
    IF col_exists THEN
        ALTER TABLE partners RENAME COLUMN company_code TO company_id;
    END IF;
END $$;

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_partners_company_code;
CREATE INDEX IF NOT EXISTS idx_partners_company_id ON partners(company_id);

-- Step 2: Add company_secret column if it doesn't exist (for backward compatibility)
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS company_secret VARCHAR(255);

-- Step 3: Convert status from enum ('active'/'inactive') to VARCHAR ('Y'/'N') if needed
-- First, check if status column uses enum type
DO $$
DECLARE
    col_type TEXT;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'status';
    
    -- If status is enum, we need to convert it
    IF col_type = 'USER-DEFINED' THEN
        -- Step 1: Change column type to VARCHAR and convert values in one step
        -- Using CASE to convert 'active' -> 'Y' and 'inactive' -> 'N' during type conversion
        ALTER TABLE partners 
        ALTER COLUMN status TYPE VARCHAR(10) USING 
            CASE 
                WHEN status::text = 'active' THEN 'Y'
                WHEN status::text = 'inactive' THEN 'N'
                ELSE status::text
            END;
        
        -- Step 2: Set default value
        ALTER TABLE partners 
        ALTER COLUMN status SET DEFAULT 'Y';
    END IF;
END $$;

-- Verification
SELECT 'Migration V4 completed successfully!' as status;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partners' 
AND column_name IN ('company_id', 'status', 'company_secret')
ORDER BY column_name;

