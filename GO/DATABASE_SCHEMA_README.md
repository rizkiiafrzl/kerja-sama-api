# Database Schema PKS-DB - Complete Guide

## 📋 Overview

Script SQL lengkap untuk membuat database `pks-db` dari awal dengan semua ketentuan terbaru.

## 🚀 Cara Menggunakan

### 1. Buat Database (jika belum ada)
```sql
CREATE DATABASE pks_db;
\c pks_db;
```

### 2. Jalankan Script Lengkap
```bash
psql -d pks_db -f create_database_pks_db_complete.sql
```

Atau copy-paste isi file `create_database_pks_db_complete.sql` ke SQL client Anda.

## 📊 Struktur Database

### 1. **partners** (Perusahaan/Partner)
- `id`: UUID (Primary Key)
- `company_name`: VARCHAR(200) NOT NULL
- `company_id`: VARCHAR(50) NOT NULL UNIQUE
- `api_key`: VARCHAR(255) UNIQUE - untuk autentikasi
- `company_secret`: VARCHAR(255) - deprecated, untuk backward compatibility
- `nomor_pks`: VARCHAR(100) NOT NULL UNIQUE
- `pic_name`: VARCHAR(150) NOT NULL
- `pic_email`: VARCHAR(200) NOT NULL
- `pic_phone`: VARCHAR(50) - max 13 digits (normalized)
- `status`: VARCHAR(10) NOT NULL DEFAULT 'Y' - 'Y' (active) / 'N' (inactive)
- `contract_start`: DATE NOT NULL
- `contract_end`: DATE NOT NULL
- `notes`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

**Constraints:**
- `chk_partner_status`: status harus 'Y' atau 'N'
- `chk_pic_phone_length`: phone max 13 digits (setelah normalize)
- `chk_contract_dates`: contract_end >= contract_start

**Indexes:**
- `idx_partners_company_id`
- `idx_partners_api_key`
- `idx_partners_status`
- `idx_partners_nomor_pks`

### 2. **partner_access_scopes** (Hak Akses Partner)
- `id`: UUID (Primary Key)
- `partner_id`: UUID → `partners.id` (CASCADE DELETE)
- `scope_name`: VARCHAR(100) NOT NULL
- `enabled`: BOOLEAN NOT NULL DEFAULT false
- `created_at`: TIMESTAMP WITH TIME ZONE

**Unique Constraint:** (partner_id, scope_name)

**Indexes:**
- `idx_partner_scopes_partner_id`
- `idx_partner_scopes_enabled` (partial index untuk enabled = true)

### 3. **users** (User Perusahaan)
- `id`: UUID (Primary Key)
- `partner_id`: UUID → `partners.id` (CASCADE DELETE)
- `username`: VARCHAR(100) NOT NULL UNIQUE
- `password_hash`: TEXT NOT NULL
- `role`: user_role_enum ('admin', 'viewer')
- `status`: status_enum ('active', 'inactive')
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

**Indexes:**
- `idx_users_partner_id`
- `idx_users_username`
- `idx_users_status`

### 4. **admins** (Admin Sistem)
- `id`: UUID (Primary Key)
- `username`: VARCHAR(100) NOT NULL UNIQUE
- `password_hash`: TEXT NOT NULL
- `role`: admin_role_enum ('superadmin', 'operator')
- `status`: status_enum ('active', 'inactive')
- `created_at`: TIMESTAMP WITH TIME ZONE

**Indexes:**
- `idx_admins_username`
- `idx_admins_role`
- `idx_admins_status`

### 5. **tk_data** (Master Data Tenaga Kerja)
- `nik`: VARCHAR(20) (Primary Key)
- `nama`: VARCHAR(200) NOT NULL
- `tanggal_lahir`: DATE NOT NULL
- `alamat`: TEXT
- `status_kepesertaan`: tk_status_enum ('aktif', 'nonaktif', 'unknown')
- `updated_at`: TIMESTAMP WITH TIME ZONE

**Indexes:**
- `idx_tk_data_nik`
- `idx_tk_data_tanggal_lahir`
- `idx_tk_data_status`

### 6. **audit_logs** (Jejak Pengecekan)
- `id`: UUID (Primary Key)
- `partner_id`: UUID → `partners.id` (CASCADE DELETE)
- `user_id`: UUID → `users.id` (SET NULL) - nullable untuk backward compatibility
- `nik`: VARCHAR(20) NOT NULL
- `scopes_used`: JSONB NOT NULL
- `request_payload`: JSONB NOT NULL
- `response_payload`: JSONB NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE

**Indexes:**
- `idx_audit_partner_id`
- `idx_audit_user_id`
- `idx_audit_nik`
- `idx_audit_created_at`
- `idx_audit_partner_created` (composite)

## 🔄 Triggers

Auto-update `updated_at` untuk:
- `partners`
- `users`
- `tk_data`

## 📝 ENUM Types

1. **status_enum**: 'active', 'inactive'
2. **user_role_enum**: 'admin', 'viewer'
3. **admin_role_enum**: 'superadmin', 'operator'
4. **tk_status_enum**: 'aktif', 'nonaktif', 'unknown'

## 🔗 Relationships

```
partners (1) ──< (N) partner_access_scopes
partners (1) ──< (N) users
partners (1) ──< (N) audit_logs
users (1) ──< (N) audit_logs (nullable)
```

## ⚠️ Important Notes

1. **Status Format**: Partners menggunakan VARCHAR 'Y'/'N', bukan enum
2. **Company ID**: Menggunakan `company_id`, bukan `company_code`
3. **API Key**: UNIQUE dan indexed untuk fast lookup
4. **Contract Dates**: DATE type (NOT NULL), bukan TIMESTAMP
5. **Phone Validation**: Max 13 digits setelah normalize (constraint di database)
6. **Audit Logs**: `user_id` nullable untuk backward compatibility

## 🧪 Sample Data

Script include sample data untuk:
- 2 admin users (superadmin, operator)
- 5 TK data records

Password default untuk admin: `admin123` (harus di-hash dengan bcrypt)

## ✅ Verification

Setelah menjalankan script, verifikasi dengan:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check partners structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'partners';

-- Count records
SELECT 'Partners' as table_name, COUNT(*) FROM partners
UNION ALL SELECT 'Partner Scopes', COUNT(*) FROM partner_access_scopes
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Admins', COUNT(*) FROM admins
UNION ALL SELECT 'TK Data', COUNT(*) FROM tk_data
UNION ALL SELECT 'Audit Logs', COUNT(*) FROM audit_logs;
```

## 🔧 Migration dari Database Lama

Jika Anda sudah punya database lama, gunakan:
- `fix_add_api_key_column.sql` - untuk menambahkan kolom yang missing
- `fix_phone_numbers_before_constraint.sql` - untuk membersihkan phone numbers








