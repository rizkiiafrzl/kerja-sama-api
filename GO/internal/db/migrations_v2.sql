-- Migration SQL yang sesuai dengan database existing pks-db
-- Schema ini COMPATIBLE dengan database yang sudah ada

-- ENUM Definitions (skip jika sudah ada)
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

-- Partners table (tanpa api_key_hash karena pakai platform API key)
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    company_code VARCHAR(50) NOT NULL UNIQUE,
    nomor_pks VARCHAR(100) NOT NULL UNIQUE,
    pic_name VARCHAR(150) NOT NULL,
    pic_email VARCHAR(200) NOT NULL,
    pic_phone VARCHAR(50),
    status status_enum NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Access Scopes table
CREATE TABLE IF NOT EXISTS partner_access_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    scope_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (partner_id, scope_name)
);

-- Users table (company users)
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

-- Admins table (system admins)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'operator',
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TK Data table (worker data)
CREATE TABLE IF NOT EXISTS tk_data (
    nik VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(200) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat TEXT,
    status_kepesertaan tk_status_enum NOT NULL DEFAULT 'unknown',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table (with scopes tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nik VARCHAR(20) NOT NULL,
    scopes_used JSONB NOT NULL,
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_company_code ON partners(company_code);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_scopes_partner_id ON partner_access_scopes(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_tk_data_nik ON tk_data(nik);
CREATE INDEX IF NOT EXISTS idx_tk_data_tanggal_lahir ON tk_data(tanggal_lahir);
CREATE INDEX IF NOT EXISTS idx_audit_partner_id ON audit_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_nik ON audit_logs(nik);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (drop jika sudah ada untuk re-create)
DROP TRIGGER IF EXISTS trg_update_partners ON partners;
CREATE TRIGGER trg_update_partners
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_users ON users;
CREATE TRIGGER trg_update_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_tk_data ON tk_data;
CREATE TRIGGER trg_update_tk_data
BEFORE UPDATE ON tk_data
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Sample data (skip jika sudah ada)
-- Admin (password: admin123)
INSERT INTO admins (username, password_hash, role) VALUES
('superadmin', '$2a$10$rN8xqXQzX0qJPZ8Y9k5o0uK5aH.9Xw4zD0vP8mJ6nK2sR4tY6uZ8i', 'superadmin'),
('operator', '$2a$10$rN8xqXQzX0qJPZ8Y9k5o0uK5aH.9Xw4zD0vP8mJ6nK2sR4tY6uZ8i', 'operator')
ON CONFLICT (username) DO NOTHING;

-- Sample TK data
INSERT INTO tk_data (nik, nama, tanggal_lahir, alamat, status_kepesertaan) VALUES
('1234567890123456', 'Budi Santoso', '1990-01-15', 'Jl. Merdeka No. 123, Jakarta', 'aktif'),
('2345678901234567', 'Siti Aminah', '1985-05-20', 'Jl. Sudirman No. 456, Bandung', 'aktif'),
('3456789012345678', 'Ahmad Yani', '1992-12-10', 'Jl. Gatot Subroto No. 789, Surabaya', 'nonaktif'),
('4567890123456789', 'Dewi Lestari', '1988-03-25', 'Jl. Thamrin No. 321, Jakarta', 'aktif'),
('5678901234567890', 'Rudi Hartono', '1995-07-08', 'Jl. Asia Afrika No. 654, Bandung', 'aktif')
ON CONFLICT (nik) DO NOTHING;

-- Verification
SELECT 'Migration completed successfully!' as status;
SELECT 'Database: pks-db' as info;
SELECT 'Partners:' as table_name, COUNT(*) as count FROM partners
UNION ALL
SELECT 'Partner Scopes:', COUNT(*) FROM partner_access_scopes
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Admins:', COUNT(*) FROM admins
UNION ALL
SELECT 'TK Data:', COUNT(*) FROM tk_data
UNION ALL
SELECT 'Audit Logs:', COUNT(*) FROM audit_logs;
