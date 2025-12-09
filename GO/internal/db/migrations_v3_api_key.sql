-- Migration V3: Change from JWT Token to API Key Authentication
-- This migration adds API key, contract dates, and changes status handling

-- Step 1: Add new columns to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS contract_start DATE,
ADD COLUMN IF NOT EXISTS contract_end DATE;

-- Step 2: Create index on api_key for fast lookup
CREATE INDEX IF NOT EXISTS idx_partners_api_key ON partners(api_key);

-- Step 3: Update existing partners to have default values
-- Set contract_start to created_at and contract_end to 1 year from now
UPDATE partners 
SET contract_start = created_at::DATE,
    contract_end = (created_at + INTERVAL '1 year')::DATE
WHERE contract_start IS NULL OR contract_end IS NULL;

-- Step 4: Make contract dates NOT NULL after setting defaults
ALTER TABLE partners
ALTER COLUMN contract_start SET NOT NULL,
ALTER COLUMN contract_end SET NOT NULL;

-- Step 5: Add constraint for phone number (max 13 digits)
-- Note: We validate in application layer, but add check constraint as backup
ALTER TABLE partners
ADD CONSTRAINT chk_pic_phone_length CHECK (
    pic_phone IS NULL OR 
    LENGTH(REGEXP_REPLACE(pic_phone, '[^0-9]', '', 'g')) <= 13
);

-- Step 6: Note: company_secret column can be kept for backward compatibility
-- or removed if not needed. We'll keep it for now but it won't be used.

-- Verification
SELECT 'Migration V3 completed successfully!' as status;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'partners' 
AND column_name IN ('api_key', 'contract_start', 'contract_end')
ORDER BY column_name;

