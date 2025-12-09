# 📚 Alur Lengkap Backend (Go Fiber) – Complete Flow Guide
Dokumen ini menjelaskan alur kerja lengkap backend: fungsi, file yang terlibat, dan urutan eksekusi untuk admin dan partner.

---
## 🏗️ Arsitektur Umum
```
Request → Routes → Middleware → Handlers → Services → Repositories → Database
                                        ↓
                                   Utils (JWT, Hash, Generator)
```

---
## 1️⃣ SERVER START
**Folder**: `cmd/server/main.go`, `internal/config/config.go`, `internal/db/connection.go`, `internal/routes/routes.go`

**Alur:**
1. **Load Config** (`cmd/server/main.go` → `config.LoadConfig()`):
   - Baca `.env` (jika ada) + env var: `PORT`, `ENV`, `DATABASE_URL`, `JWT_SECRET`, `PLATFORM_API_KEY`, `PARTNER_TOKEN_TTL`.
2. **Connect DB** (`db.ConnectDB`):
   - `sql.Open("postgres", connString)`, set pool (25 open, 5 idle, lifetime 5m), `Ping`.
3. **Setup Routes** (`routes.SetupRoutes`):
   - Init repo: Partner, Scope, Admin, TK, Audit.
   - Init service: Auth, Checking, Partner.
   - Init handler: AuthHandler, CheckingHandler, AdminPartnerHandler.
   - Daftar routes + middleware global (Logger, CORS).
4. **Start Server**: `app.Listen(:PORT)`.

---
## 2️⃣ ADMIN LOGIN
**Endpoint**: `POST /api/v1/auth/admin/login`  
**Files**: `internal/handlers/auth.go`, `internal/service/auth_service.go`, `internal/repository/admin_repo.go`, `pkg/utils/jwt.go`, `pkg/utils/hash.go`, `internal/middleware/jwt.go` (untuk request berikutnya).

**Alur:**
1. **Frontend** kirim JSON `{username, password}`.
2. **Route** memanggil `authHandler.LoginAdmin`.
3. **Handler** parse body → `AuthService.LoginAdmin`.
4. **Service**:
   - `AdminRepo.GetByUsername` (status must `active`).
   - `utils.ComparePassword` bcrypt.
   - `utils.GenerateJWT` (claims: `user_id=adminID`, `role`, `type="admin"`, exp 24h).
5. **Response**: `{token, admin}` → frontend simpan di localStorage.

---
## 3️⃣ ADMIN - PARTNER MANAGEMENT (JWT Admin)
Semua endpoint `/admin/*` pakai middleware `AdminAuth`:
- Ambil header `Authorization: Bearer <JWT>`.
- `ValidateJWT` + cek `claims.Type == "admin"`.
- Simpan `adminID`, `adminRole` di context.

### 3.1 Create Partner
**Endpoint**: `POST /admin/partners`  
**Files**: `internal/handlers/admin_partner.go`, `internal/service/partner_service.go`, `internal/repository/partner_repo.go`, `internal/repository/scope_repo.go`, `pkg/utils/generator.go`.

Alur:
1. Handler parse `CreatePartnerRequest` (company_name, pic_name, pic_email, optional: company_id, pic_phone, notes, scopes, contract_start/end).
2. Service:
   - Generate `company_id` (PT-XXX-###), `nomor_pks`, `api_key` (UUID).
   - Kontrak default: today & +1 tahun jika tidak diisi.
   - Status set `Y`; normalisasi phone.
   - `PartnerRepo.Create`.
   - Scopes: pakai input atau default (`name`, `tanggal_lahir`, `status_bpjs`).
3. Response: partner + `api_key` plaintext (hanya sekali).

### 3.2 List Partner
**Endpoint**: `GET /admin/partners`  
- Repo memuat semua partner; `markExpiredIfNeeded`:
  - Jika `contract_end` < now → status jadi `N`.
  - Jika status `N` tapi kontrak masih valid → status jadi `Y`.
  - Efek disimpan ke DB saat dibaca.

### 3.3 Detail Partner
**Endpoint**: `GET /admin/partners/:id`  
- Sama: status auto disesuaikan kontrak saat load.

### 3.4 Update Partner
**Endpoint**: `PUT /admin/partners/:id`  
- Boleh ubah company_id (cek unik), PIC, status (Y/N atau active/inactive), kontrak start/end, notes, dll.
- Setelah update, status akan mengikuti logika kontrak saat dibaca berikutnya.

### 3.5 Delete Partner (Soft)
**Endpoint**: `DELETE /admin/partners/:id`  
- Set status = `N`.

### 3.6 Scopes
**Endpoints**:
- `GET /admin/partners/:id/scopes`
- `PUT /admin/partners/:id/scopes` body `{scopes:[{scope_name,enabled}]}`
- Scope yang dipakai: `name`, `tanggal_lahir`, `status_bpjs`, `alamat`.

### 3.7 API Key
**Endpoints**:
- Reveal: `GET /admin/partners/:id/reveal-api-key` → kembalikan key aktif plaintext sekali.
- Reset: `POST /admin/partners/:id/reset-api-key` → generate key baru, old key langsung invalid, balas plaintext sekali.

---
## 4️⃣ PARTNER AUTH & CHECKING (API Key)
Partner TIDAK memakai JWT lagi; pakai API Key di header.

### 4.1 Middleware Partner API Key
**File**: `internal/middleware/partner_api_key.go`  
**Endpoint**: `POST /api/checking`

Alur middleware:
1. Ambil `X-API-KEY`.
2. `PartnerRepo.GetByAPIKey`.
3. Cek status harus `Y`.
4. Cek kontrak: `contract_start <= now <= contract_end` (jika diisi), jika gagal → 403.
5. Load scopes dari DB (`ScopeRepo.GetByPartnerID`), simpan `partnerID`, `partnerScopes` di context.

### 4.2 Checking TK
**Handler**: `internal/handlers/checking.go`  
**Service**: `internal/service/checking_service.go`  
**Repo**: `tk_repo.go`, `audit_repo.go`

Alur:
1. Handler parse `{nik, tanggal_lahir}` + ambil `partnerID`, `scopes` dari context.
2. Service:
   - Parse tanggal lahir.
   - `TKRepo.CheckByNIKAndDOB`.
   - Jika ketemu → filter fields via `filterByScopes` (nik selalu ada, last_update selalu ada; nama/tanggal_lahir/status_bpjs/alamat sesuai scope).
   - Jika tidak ketemu → `found=false`.
   - Audit log async ke `audit_logs` (partner_id, nik, scopes_used, request, response).
3. Response sukses berisi data terfilter; jika tidak cocok DOB/NIK, `found=false`.

---
## 5️⃣ STATUS & KONTRAK
- Saat baca partner (GetByID/ByAPIKey/GetAll), repo akan:
  - `contract_end` lewat → status diset `N`.
  - Status `N` tapi kontrak valid → status diset `Y`.
- Middleware partner juga memblokir jika kontrak belum mulai/berakhir, meski status belum tersinkron (safety).

---
## 🔗 Ringkas Alur per Peran
### Admin
- Login → dapat JWT.
- Bawa JWT ke semua `/admin/*`.
- CRUD partner, kelola scopes, reveal/reset API key.
- Status partner otomatis mengikuti kontrak saat di-fetch.

### Partner
- Gunakan `X-API-KEY` di `/api/checking`.
- Middleware cek status+kontrak+scopes → handler checking → service filterByScopes → audit async.

---
## 📄 Referensi Cepat (Files)
- Entry: `cmd/server/main.go`
- Config: `internal/config/config.go`
- Routes: `internal/routes/routes.go`
- Middleware: `internal/middleware/logger.go`, `cors.go`, `jwt.go`, `partner_api_key.go`
- Handlers: `internal/handlers/auth.go`, `checking.go`, `admin_partner.go`, `health.go`
- Services: `internal/service/auth_service.go`, `checking_service.go`, `partner_service.go`
- Repositories: `internal/repository/admin_repo.go`, `partner_repo.go`, `scope_repo.go`, `tk_repo.go`, `audit_repo.go`
- Utils: `pkg/utils/jwt.go`, `hash.go`, `generator.go`, `response.go`, `validator.go`

---
## 📝 Inti Utama
- Admin pakai JWT (HS256) via `AdminAuth`.
- Partner pakai API Key; kontrak divalidasi setiap request; status auto-sync saat fetch.
- Scopes menentukan field yang keluar di response checking.
- Audit log disimpan async pada setiap checking.

