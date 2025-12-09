# PKS-DB Go Backend – Dokumentasi Lengkap

## Ringkas
Backend berbasis Go Fiber + PostgreSQL untuk pengecekan data Tenaga Kerja (TK) oleh partner (perusahaan) dengan autentikasi API Key dan panel admin berbasis JWT.

## Arsitektur
- **Entry point**: `cmd/server/main.go`
- **Routing**: `internal/routes/routes.go`
- **Config**: `internal/config/config.go` (ENV, DB URL, JWT secret, platform key, TTL)
- **DB layer**: `internal/db/connection.go` + repos `internal/repository/*`
- **Service layer**: `internal/service/*`
- **Handlers (HTTP)**: `internal/handlers/*`
- **Middleware**: `internal/middleware/*`
- **Model**: `internal/models/*`
- **Utilitas**: `pkg/utils/*`

## Environment
Contoh `.env`:
```
PORT=3000
ENV=development
DATABASE_URL=postgres://user:pass@localhost:5432/pks-db?sslmode=disable
JWT_SECRET=your-secret-key-min-32-chars
PLATFORM_API_KEY=your-platform-key-min-32-chars
PARTNER_TOKEN_TTL=3600
```

## Alur Utama
1) **Start server**
   - Load config, connect DB, setup routes, listen pada `:PORT`.
2) **Health check**
   - `GET /api/health` → status OK.
3) **Login admin**
   - `POST /api/v1/auth/admin/login`
   - Body: `{"username","password"}`
   - Validasi hash bcrypt; balas JWT HS256 (type=admin, 24h).
4) **Admin area (Bearer JWT admin)**
   - Prefix `/admin/partners`
   - Fitur: create/list/get/update/delete partner, kelola scopes, reveal API key, reset API key.
5) **Partner Checking (API Key)**
   - `POST /api/checking` dengan header `X-API-KEY: <partner_api_key>`
   - Middleware `PartnerAPIKeyAuth`:
     - Cek API key → partner exist
     - Status must be `Y`
     - Validasi kontrak (contract_start ≤ now ≤ contract_end)
     - Muat scopes dari DB → `Locals`
   - Handler `CheckingHandler.CheckTK`:
     - Body: `{"nik","tanggal_lahir(YYYY-MM-DD)"}`
     - Service cek NIK+DOB di `tk_data`, filter field sesuai scopes, tambah `found` flag.
     - Audit log async ke `audit_logs`.

## Data Model (inti)
- `partners`: id, company_name, company_id, api_key, nomor_pks, pic_name/email/phone, status (Y/N), contract_start/end, notes, timestamps.
- `partner_access_scopes`: partner_id, scope_name (`name`, `tanggal_lahir`, `status_bpjs`, `alamat`), enabled.
- `tk_data`: nik (PK), nama, tanggal_lahir, alamat, status_kepesertaan, updated_at.
- `admins`: username, password_hash (bcrypt), role (superadmin/operator), status.
- `audit_logs`: partner_id, user_id nullable, nik, scopes_used JSONB, request_payload JSONB, response_payload JSONB, created_at.

## Endpoints (ringkas)
- `GET /api/health` – health check.
- `POST /api/v1/auth/admin/login` – login admin → JWT.
- `POST /api/checking` – cek TK (header `X-API-KEY`).
- Admin (Authorization: `Bearer <JWT>`):
  - `POST /admin/partners` – buat partner (return API key plaintext sekali).
  - `GET /admin/partners` – list partners.
  - `GET /admin/partners/:id` – detail.
  - `PUT /admin/partners/:id` – update (status Y/N atau active/inactive, kontrak, PIC, notes).
  - `DELETE /admin/partners/:id` – soft delete (status → N).
  - `GET /admin/partners/:id/scopes` – get scopes.
  - `PUT /admin/partners/:id/scopes` – set scopes (upsert).
  - `GET /admin/partners/:id/reveal-api-key` – tampilkan API key aktif (plaintext).
  - `POST /admin/partners/:id/reset-api-key` – ganti API key, kembalikan plaintext sekali.

## Alur Detail per Komponen
- **AuthService**: validasi admin (status active), compare bcrypt, generate JWT HS256 (24h). `ValidateJWT` wrapper.
- **PartnerService**:
  - Generate `company_id` (PT-XXX-XXX), `nomor_pks`, API key UUID, kontrak default hari ini + 1 tahun.
  - Normalisasi phone, set status Y, create partner + scopes default jika kosong.
  - Update: cek unik `company_id` bila diubah.
  - Reset API key: generate baru, update DB, kembalikan plaintext sekali.
- **CheckingService**:
  - Parse DOB, query `tk_data` by NIK+DOB.
  - Filter fields sesuai scopes; `found` true/false.
  - Audit log async (tidak memblokir response).
- **PartnerRepository**:
  - Get by API key/ID/company_id, GetAll adaptif kolom legacy, Create dengan pesan error ramah bila migrasi kurang, Update dinamis (SET hanya field terisi), soft delete (status N), UpdateAPIKey.
- **ScopeRepository**:
  - GetByPartnerID, BulkCreate (transaksi), BulkUpdate upsert, DeleteByPartnerID.
- **TKRepository**:
  - CheckByNIKAndDOB, GetByNIK, list paginasi, create/update/delete.
- **AuditRepository**:
  - Insert JSONB request/response/scopes; query by partner atau NIK.
- **Middleware**:
  - `Logger` (stdout), `CORS` permissive.
  - `PartnerAPIKeyAuth` (cek key, status, kontrak, load scopes).
  - `JWTAuth` (general), `AdminAuth` (claims.Type harus "admin").

## Skema & Migrasi
- Basis migrasi awal: `internal/db/migrations.sql` (enum status/role/tk_status, tables partners/users/admins/tk_data/audit_logs, triggers update timestamp).
- Migrasi tambahan/penyesuaian:
  - `internal/db/migrations_v3_api_key.sql`, `migrations_v4_rename_company_code.sql`
  - Skrip perbaikan: `fix_add_api_key_column.sql`, `add_contract_columns.sql`, `check_and_fix_contract.sql`, `verify_migration.sql`, dll.
- Pastikan menjalankan skrip fix bila error kolom (pesan sudah ditangani di repo layer).

## Respons & Error
- Helper di `pkg/utils/response.go`
  - Sukses: `{success:true, message?, data}`
  - Error: `{success:false, message, error?}`
- Handler checking:
  - `found=false` bila NIK/DOB tidak cocok.
  - Validasi body → 400; kesalahan server → 500.
  - Admin login gagal → 401.

## Scopes
- Nama scope: `name`, `tanggal_lahir`, `status_bpjs`, `alamat`.
- Default untuk partner baru: name, tanggal_lahir, status_bpjs.
- Filtering response TK mengikuti scope yang enabled (NIK selalu dikembalikan, last_update selalu disertakan).

## Keamanan & Catatan
- API key partner disimpan plaintext di DB (fungsi hash API key sudah dihapus karena tidak dipakai). Jaga distribusi kunci.
- API key hanya ditampilkan plaintext saat create/reset/reveal.
- Kontrak wajib aktif; middleware menolak jika belum mulai/berakhir.
- JWT admin HS256, secret wajib kuat.
- CORS saat ini `*`; sesuaikan jika perlu pembatasan origin.

## Menjalankan
```
go run cmd/server/main.go
```
Server di `http://localhost:3000`. Pastikan DB siap dan migrasi sudah jalan.

## Alur Singkat API Checking
1) Admin buat partner → dapat `company_id` + `api_key`.
2) Partner panggil `POST /api/checking` dengan header `X-API-KEY`.
3) Middleware validasi key + kontrak + scopes.
4) Service cek TK (NIK, DOB) → response sesuai scopes + audit log.

## File Referensi Cepat
- Routes: `internal/routes/routes.go`
- Middleware kunci: `internal/middleware/partner_api_key.go`, `internal/middleware/jwt.go`
- Handler utama: `internal/handlers/admin_partner.go`, `internal/handlers/checking.go`, `internal/handlers/auth.go`, `internal/handlers/health.go`
- Services: `internal/service/*`
- Repos: `internal/repository/*`
- Models: `internal/models/*`
- Util: `pkg/utils/*`

## Perubahan Terakhir (konteks pembersihan)
- Middleware tidak terpakai dihapus: partner_jwt, partner_scope, api_key.
- Fungsi usang dihapus: `GeneratePartnerJWT`, `HashAPIKey`.

