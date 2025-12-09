-- PostgreSQL Migration for PKS-DB
-- Database: pks-db
-- 
-- This file contains all the necessary SQL commands to set up the database
-- Run this file with: psql -d pks-db -f internal/db/migrations.sql

-- ====================================================================
-- 1. ENUM Type Definitions
-- ====================================================================

-- ENUM untuk status perusahaan, user, admin
CREATE TYPE status_enum AS ENUM ('active', 'inactive');

-- ENUM untuk role user perusahaan
CREATE TYPE user_role_enum AS ENUM ('admin', 'viewer');

-- ENUM untuk role admin sistem
CREATE TYPE admin_role_enum AS ENUM ('superadmin', 'operator');

-- ENUM untuk status kepesertaan TK
CREATE TYPE tk_status_enum AS ENUM ('aktif', 'nonaktif', 'unknown');

-- ====================================================================
-- 2. Table: partners (Perusahaan / Mitra)
-- ====================================================================

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(200) NOT NULL,
    nomor_pks VARCHAR(100) NOT NULL UNIQUE,
    api_key_hash TEXT NOT NULL,
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 3. Table: users (User Perusahaan)
-- ====================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'viewer',
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tambahan untuk mempercepat pencarian user berdasarkan partner
CREATE INDEX idx_users_partner_id ON users (partner_id);

-- ====================================================================
-- 4. Table: admins (Admin Sistem)
-- ====================================================================

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'operator',
    status status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 5. Table: tk_data (Master Data Tenaga Kerja)
-- ====================================================================

CREATE TABLE tk_data (
    nik VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(200) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat TEXT,
    status_kepesertaan tk_status_enum NOT NULL DEFAULT 'unknown',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk mempercepat pencarian berdasarkan tanggal lahir
CREATE INDEX idx_tk_data_tanggal_lahir ON tk_data (tanggal_lahir);

-- ====================================================================
-- 6. Table: audit_logs (Jejak pengecekan)
-- ====================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nik VARCHAR(20) NOT NULL,
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk mempermudah pelaporan
CREATE INDEX idx_audit_partner_id ON audit_logs (partner_id);
CREATE INDEX idx_audit_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_nik ON audit_logs (nik);
CREATE INDEX idx_audit_created_at ON audit_logs (created_at);

-- ====================================================================
-- 7. Triggers untuk update updated_at
-- ====================================================================

-- FUNCTION untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- APPLY TO PARTNERS
CREATE TRIGGER trg_update_partners
BEFORE UPDATE ON partners
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- APPLY TO USERS
CREATE TRIGGER trg_update_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- APPLY TO TK_DATA
CREATE TRIGGER trg_update_tk_data
BEFORE UPDATE ON tk_data
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ====================================================================
-- 8. Seed Data (Optional - untuk testing)
-- ====================================================================

-- Insert sample TK data for testing
-- Uncomment the lines below if you want sample data

/*
INSERT INTO tk_data (nik, nama, tanggal_lahir, alamat, status_kepesertaan) VALUES
('1234567890123456', 'John Doe', '1990-01-15', 'Jl. Contoh No. 123, Jakarta', 'aktif'),
('2345678901234567', 'Jane Smith', '1985-05-20', 'Jl. Sample No. 456, Bandung', 'aktif'),
('3456789012345678', 'Bob Johnson', '1992-12-10', 'Jl. Test No. 789, Surabaya', 'nonaktif');
*/

-- ====================================================================
-- Migration Complete
-- ====================================================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
