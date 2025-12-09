-- ====================================================================
-- COMPLETE DATABASE SCHEMA FOR PKS-DB
-- ====================================================================
-- Script ini membuat database pks-db dari awal dengan semua ketentuan baru:
-- - API Key authentication
-- - Contract dates (contract_start, contract_end)
-- - Status format: 'Y' (active) / 'N' (inactive)
-- - Company ID (bukan company_code)
-- - Phone number validation (max 13 digits)
-- - All relationships and constraints
-- ====================================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE pks_db;
-- \c pks_db;

-- ====================================================================
-- 1. ENUM Type Definitions
-- ====================================================================

DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('admin', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_role_enum AS ENUM ('superadmin', 'operator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tk_status_enum AS ENUM ('aktif', 'nonaktif', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 2. Table: partners (Perusahaan/Partner)
-- ====================================================================

CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    company_id VARCHAR(50) NOT NULL UNIQUE,
    api_key VARCHAR(255) UNIQUE,
    company_secret VARCHAR(255), -- Deprecated, kept for backward compatibility
    nomor_pks VARCHAR(100) NOT NULL UNIQUE,
    pic_name VARCHAR(150) NOT NULL,
    pic_email VARCHAR(200) NOT NULL,
    pic_phone VARCHAR(50),
    status VARCHAR(10) NOT NULL DEFAULT 'Y', -- 'Y' = active, 'N' = inactive
    contract_start DATE NOT NULL,
    contract_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_partner_status CHECK (status IN ('Y', 'N')),
    CONSTRAINT chk_pic_phone_length CHECK (
        pic_phone IS NULL OR 
        LENGTH(REGEXP_REPLACE(pic_phone, '[^0-9]', '', 'g')) <= 13
    ),
    CONSTRAINT chk_contract_dates CHECK (contract_end >= contract_start)
);

-- Indexes for partners
CREATE INDEX IF NOT EXISTS idx_partners_company_id ON partners(company_id);
CREATE INDEX IF NOT EXISTS idx_partners_api_key ON partners(api_key);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_nomor_pks ON partners(nomor_pks);

-- ====================================================================
-- 3. Table: partner_access_scopes (Hak Akses Partner)
-- ====================================================================

CREATE TABLE IF NOT EXISTS partner_access_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    scope_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one scope per partner
    UNIQUE (partner_id, scope_name)
);

-- Indexes for partner_access_scopes
CREATE INDEX IF NOT EXISTS idx_partner_scopes_partner_id ON partner_access_scopes(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_scopes_enabled ON partner_access_scopes(partner_id, enabled) WHERE enabled = true;

-- ====================================================================
-- 4. Table: users (User Perusahaan)
-- ====================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'viewer',
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ====================================================================
-- 5. Table: admins (Admin Sistem)
-- ====================================================================

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'operator',
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admins
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);

-- ====================================================================
-- 6. Table: tk_data (Master Data Tenaga Kerja)
-- ====================================================================

CREATE TABLE IF NOT EXISTS tk_data (
    nik VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(200) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat TEXT,
    status_kepesertaan tk_status_enum NOT NULL DEFAULT 'unknown',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tk_data
CREATE INDEX IF NOT EXISTS idx_tk_data_nik ON tk_data(nik);
CREATE INDEX IF NOT EXISTS idx_tk_data_tanggal_lahir ON tk_data(tanggal_lahir);
CREATE INDEX IF NOT EXISTS idx_tk_data_status ON tk_data(status_kepesertaan);

-- ====================================================================
-- 7. Table: audit_logs (Jejak Pengecekan)
-- ====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable untuk backward compatibility
    nik VARCHAR(20) NOT NULL,
    scopes_used JSONB NOT NULL,
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_partner_id ON audit_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_nik ON audit_logs(nik);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_partner_created ON audit_logs(partner_id, created_at);

-- ====================================================================
-- 8. Trigger Functions untuk updated_at
-- ====================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 9. Triggers untuk Auto-update updated_at
-- ====================================================================

-- Trigger for partners
DROP TRIGGER IF EXISTS trg_update_partners ON partners;
CREATE TRIGGER trg_update_partners
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for users
DROP TRIGGER IF EXISTS trg_update_users ON users;
CREATE TRIGGER trg_update_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for tk_data
DROP TRIGGER IF EXISTS trg_update_tk_data ON tk_data;
CREATE TRIGGER trg_update_tk_data
BEFORE UPDATE ON tk_data
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ====================================================================
-- 10. Sample Data (Optional - untuk testing)
-- ====================================================================

-- Sample Admin (password: admin123)
-- Generate hash dengan: go run scripts/generate-password-hash.go
INSERT INTO admins (username, password_hash, role, status) VALUES
('admin', '$2a$10$rN8xqXQzX0qJPZ8Y9k5o0uK5aH.9Xw4zD0vP8mJ6nK2sR4tY6uZ8i', 'superadmin', 'active'),
('operator', '$2a$10$rN8xqXQzX0qJPZ8Y9k5o0uK5aH.9Xw4zD0vP8mJ6nK2sR4tY6uZ8i', 'operator', 'active')
ON CONFLICT (username) DO NOTHING;

-- Sample TK Data
INSERT INTO tk_data (nik, nama, tanggal_lahir, alamat, status_kepesertaan) VALUES
('1234567890123456', 'Budi Santoso', '1990-01-15', 'Jl. Merdeka No. 123, Jakarta', 'aktif'),
('2345678901234567', 'Siti Aminah', '1985-05-20', 'Jl. Sudirman No. 456, Bandung', 'aktif'),
('3456789012345678', 'Ahmad Yani', '1992-12-10', 'Jl. Gatot Subroto No. 789, Surabaya', 'nonaktif'),
('4567890123456789', 'Dewi Lestari', '1988-03-25', 'Jl. Thamrin No. 321, Jakarta', 'aktif'),
('5678901234567890', 'Rudi Hartono', '1995-07-08', 'Jl. Asia Afrika No. 654, Bandung', 'aktif')
ON CONFLICT (nik) DO NOTHING;

-- ====================================================================
-- 11. Verification Queries
-- ====================================================================

-- Check all tables
SELECT 'Database Schema Created Successfully!' as status;

-- Show all tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show partners table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partners' 
ORDER BY ordinal_position;

-- Count records in each table
SELECT 'Partners' as table_name, COUNT(*) as count FROM partners
UNION ALL
SELECT 'Partner Scopes', COUNT(*) FROM partner_access_scopes
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Admins', COUNT(*) FROM admins
UNION ALL
SELECT 'TK Data', COUNT(*) FROM tk_data
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs;

-- ====================================================================
-- END OF SCRIPT
-- ====================================================================
-- Notes:
-- 1. Partners table uses VARCHAR(10) for status ('Y'/'N') instead of enum
-- 2. company_id is used instead of company_code
-- 3. api_key is UNIQUE and indexed for fast lookup
-- 4. contract_start and contract_end are DATE (NOT NULL)
-- 5. Phone number constraint: max 13 digits (normalized)
-- 6. audit_logs.user_id is nullable for backward compatibility
-- 7. All foreign keys use ON DELETE CASCADE except audit_logs.user_id (SET NULL)
-- ====================================================================

