# PKS-DB - Sistem Pengecekan Tenaga Kerja

Sistem full-stack untuk pengecekan data Tenaga Kerja (TK) dengan autentikasi API Key dan panel admin berbasis JWT.

## 📋 Daftar Isi

- [Persyaratan Sistem](#persyaratan-sistem)
- [Quick Start](#quick-start)
- [Struktur Proyek](#struktur-proyek)
- [Setup Database](#setup-database)
- [Setup Backend (Go)](#setup-backend-go)
- [Setup Frontend (Next.js)](#setup-frontend-nextjs)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Membuat Admin User](#membuat-admin-user)
- [Troubleshooting](#troubleshooting)
- [Dokumentasi Tambahan](#dokumentasi-tambahan)

## ⚡ Quick Start

Untuk setup cepat, lihat [QUICKSTART.md](QUICKSTART.md) atau gunakan script otomatis:

**Windows:**
```bash
setup-windows.bat
start-dev.bat
```

**Manual Setup:**
Ikuti panduan lengkap di bawah ini.

## 🔧 Persyaratan Sistem

Sebelum memulai, pastikan Anda telah menginstall:

- **Go** 1.21 atau lebih tinggi ([Download](https://go.dev/dl/))
- **PostgreSQL** 12 atau lebih tinggi ([Download](https://www.postgresql.org/download/))
- **Node.js** 18 atau lebih tinggi ([Download](https://nodejs.org/))
- **npm** atau **yarn** (biasanya sudah termasuk dengan Node.js)
- **Git** ([Download](https://git-scm.com/downloads))

### Verifikasi Instalasi

```bash
# Cek versi Go
go version

# Cek versi PostgreSQL
psql --version

# Cek versi Node.js
node --version

# Cek versi npm
npm --version
```

## 📁 Struktur Proyek

```
Kerjasama/
├── GO/                          # Backend Go (Fiber)
│   ├── cmd/server/              # Entry point aplikasi
│   ├── internal/
│   │   ├── config/              # Konfigurasi aplikasi
│   │   ├── db/                  # Koneksi database & migrations
│   │   ├── handlers/            # HTTP handlers
│   │   ├── middleware/          # Middleware (JWT, CORS, dll)
│   │   ├── models/              # Data models
│   │   ├── repository/          # Database layer
│   │   ├── routes/              # Route definitions
│   │   └── service/             # Business logic
│   ├── pkg/utils/               # Utility functions
│   ├── scripts/                 # Helper scripts
│   └── go.mod                   # Go dependencies
│
├── my-admin/                    # Frontend Next.js
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── api/             # API routes (proxy ke backend)
│   │   │   ├── components/      # React components
│   │   │   └── dashboard/       # Dashboard page
│   │   └── lib/                 # Utilities & config
│   └── package.json             # Node.js dependencies
│
└── README.md                    # File ini
```

## 🗄️ Setup Database

### 1. Buat Database PostgreSQL

```bash
# Login ke PostgreSQL sebagai superuser
psql -U postgres

# Atau jika menggunakan user lain
psql -U your_username
```

Di dalam PostgreSQL shell:

```sql
-- Buat database baru
CREATE DATABASE pks_db;

-- Keluar dari PostgreSQL shell
\q
```

### 2. Jalankan Migrasi Database

Pilih salah satu metode berikut:

#### Metode 1: Menggunakan file migrations.sql (Recommended)

```bash
# Dari root project
cd GO
psql -U postgres -d pks_db -f internal/db/migrations.sql
```

#### Metode 2: Menggunakan file create_database_pks_db_complete.sql

```bash
# Dari root project
cd GO
psql -U postgres -d pks_db -f create_database_pks_db_complete.sql
```

#### Metode 3: Menggunakan psql langsung

```bash
# Masuk ke database
psql -U postgres -d pks_db

# Copy-paste isi file migrations.sql ke terminal
# Atau gunakan \i untuk import
\i internal/db/migrations.sql
```

### 3. Verifikasi Database

```bash
psql -U postgres -d pks_db -c "\dt"
```

Anda seharusnya melihat tabel-tabel berikut:
- `partners`
- `partner_access_scopes`
- `admins`
- `tk_data`
- `audit_logs`

## ⚙️ Setup Backend (Go)

### 1. Install Dependencies

```bash
cd GO
go mod download
```

### 2. Buat File Environment Variables

Buat file `.env` di folder `GO/` (gunakan `ENV_TEMPLATE.txt` sebagai template):

```bash
cd GO
# Copy template ke .env
cat ENV_TEMPLATE.txt > .env
# Atau buat manual file .env dan copy isi dari ENV_TEMPLATE.txt
```

Edit file `.env` dengan konfigurasi berikut:

```env
PORT=3000
ENV=development
DATABASE_URL=postgres://username:password@localhost:5432/pks_db?sslmode=disable
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
PLATFORM_API_KEY=your-platform-api-key-for-server-to-server-min-32-chars
PARTNER_TOKEN_TTL=86400
```

**Penting:**
- Ganti `username` dan `password` dengan credentials PostgreSQL Anda
- Ganti `pks_db` jika nama database Anda berbeda
- Generate `JWT_SECRET` dan `PLATFORM_API_KEY` yang aman (lihat di bawah)

### 3. Generate Secret Keys

Anda perlu membuat `JWT_SECRET` dan `PLATFORM_API_KEY` yang aman. Pilih salah satu metode:

#### Metode 1: Menggunakan Go Script (Recommended)

```bash
cd GO
go run scripts/generate-secrets.go
```

#### Metode 2: Menggunakan OpenSSL

```bash
# Generate JWT_SECRET (base64, 64 bytes)
openssl rand -base64 64

# Generate PLATFORM_API_KEY (hex, 32 bytes)
openssl rand -hex 32
```

#### Metode 3: Online Generator

- JWT Secret: https://generate-secret.vercel.app/64
- API Key: Generate random hex string (minimal 32 karakter)

**⚠️ Peringatan:** Untuk production, HARUS menggunakan cryptographically secure random generator!

### 4. Test Koneksi Database

```bash
cd GO
go run cmd/server/main.go
```

Jika berhasil, Anda akan melihat:
```
✅ Database connected successfully
🚀 Server starting on http://localhost:3000
```

Tekan `Ctrl+C` untuk menghentikan server.

## 🎨 Setup Frontend (Next.js)

### 1. Install Dependencies

```bash
cd my-admin
npm install
```

### 2. Buat File Environment Variables

Buat file `.env.local` di folder `my-admin/` (gunakan `ENV_TEMPLATE.txt` sebagai template):

```bash
cd my-admin
# Copy template ke .env.local
cat ENV_TEMPLATE.txt > .env.local
# Atau buat manual file .env.local dan copy isi dari ENV_TEMPLATE.txt
```

Edit file `.env.local` jika perlu (default sudah benar):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Catatan:** Pastikan port sesuai dengan backend Go (default: 3000)

### 3. Test Frontend

```bash
cd my-admin
npm run dev
```

Frontend akan berjalan di `http://localhost:3001`. Buka browser dan akses URL tersebut.

## 🚀 Menjalankan Aplikasi

### Opsi 1: Terminal Terpisah (Recommended)

**Terminal 1 - Backend:**
```bash
cd GO
go run cmd/server/main.go
```

**Terminal 2 - Frontend:**
```bash
cd my-admin
npm run dev
```

### Opsi 2: Menggunakan Script Otomatis (Windows)

Gunakan script `start-dev.bat` yang sudah disediakan:

```bash
start-dev.bat
```

Script ini akan membuka 2 window terpisah untuk backend dan frontend.

### Opsi 3: Setup Otomatis (Windows)

Untuk setup lengkap secara otomatis, gunakan script `setup-windows.bat`:

```bash
setup-windows.bat
```

Script ini akan:
- Mengecek instalasi PostgreSQL, Go, dan Node.js
- Membuat database `pks_db`
- Menjalankan migrations
- Membuat file `.env` dan `.env.local` dari template
- Menginstall dependencies backend dan frontend

**Catatan:** Setelah setup otomatis, Anda masih perlu:
1. Edit file `GO/.env` dengan konfigurasi yang benar
2. Generate secrets dengan `go run scripts/generate-secrets.go`
3. Buat admin user dengan `go run scripts/create-admin.go`

## 👤 Membuat Admin User

Setelah database setup, Anda perlu membuat admin user untuk login ke dashboard.

### Metode 1: Menggunakan Go Script (Recommended)

```bash
cd GO
go run scripts/create-admin.go
```

Script akan meminta:
- Username
- Password
- Role (superadmin/operator)

### Metode 2: Menggunakan SQL Langsung

```bash
psql -U postgres -d pks_db
```

```sql
-- Generate password hash terlebih dahulu
-- Gunakan script: go run scripts/generate-password-hash.go
-- Atau gunakan bcrypt online generator

INSERT INTO admins (id, username, password_hash, role, status)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$10$...', -- Ganti dengan bcrypt hash dari password Anda
  'superadmin',
  'active'
);
```

### Metode 3: Menggunakan Script Generate Password Hash

```bash
cd GO
go run scripts/generate-password-hash.go
# Masukkan password, copy hash yang dihasilkan
# Gunakan hash tersebut di SQL INSERT di atas
```

## ✅ Verifikasi Setup

### 1. Health Check Backend

```bash
curl http://localhost:3000/api/health
```

Response yang diharapkan:
```json
{"success":true,"message":"Server is healthy"}
```

### 2. Akses Frontend

1. Buka browser: `http://localhost:3001`
2. Login dengan admin credentials yang sudah dibuat
3. Test fitur:
   - Create company/partner
   - View company list
   - Edit company
   - Manage scopes
   - Reveal/Reset API Key

### 3. Test API Checking (Partner API)

```bash
# Dapatkan API key dari dashboard setelah create partner
curl -X POST http://localhost:3000/api/checking \
  -H "X-API-KEY: your-partner-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "1234567890123456",
    "tanggal_lahir": "1990-01-01"
  }'
```

## 🐛 Troubleshooting

### Backend tidak bisa connect ke database

**Masalah:** Error "Failed to connect to database"

**Solusi:**
1. Pastikan PostgreSQL service berjalan:
   ```bash
   # Windows
   net start postgresql-x64-XX
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check format `DATABASE_URL`:
   ```
   postgres://username:password@localhost:5432/pks_db?sslmode=disable
   ```

3. Verifikasi database exists:
   ```bash
   psql -U postgres -l | grep pks_db
   ```

4. Check firewall/network settings

### Frontend tidak bisa connect ke backend

**Masalah:** Error "Failed to fetch" atau "Network error"

**Solusi:**
1. Pastikan backend berjalan di port 3000:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Check `NEXT_PUBLIC_API_URL` di `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. Check CORS settings di backend (sudah ada middleware CORS)

4. Check browser console untuk error details

### JWT Token Invalid atau Expired

**Masalah:** Error 401 Unauthorized

**Solusi:**
1. Pastikan `JWT_SECRET` sama di backend `.env`
2. Token mungkin expired, login ulang
3. Check browser console untuk error details
4. Clear localStorage dan login ulang:
   ```javascript
   // Di browser console
   localStorage.clear()
   ```

### Port Already in Use

**Masalah:** Error "port 3000 already in use"

**Solusi:**
1. **Backend:** Ganti `PORT` di `.env`:
   ```env
   PORT=3001
   ```
   Jangan lupa update `NEXT_PUBLIC_API_URL` di frontend

2. **Frontend:** Next.js akan otomatis menggunakan port lain (3002, 3003, dll)

3. Atau kill process yang menggunakan port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```

### Error "relation does not exist" atau "table does not exist"

**Masalah:** Database migrations belum dijalankan

**Solusi:**
1. Pastikan sudah menjalankan migrations:
   ```bash
   cd GO
   psql -U postgres -d pks_db -f internal/db/migrations.sql
   ```

2. Verifikasi tabel sudah dibuat:
   ```bash
   psql -U postgres -d pks_db -c "\dt"
   ```

### Error saat npm install

**Masalah:** Error dependency atau permission denied

**Solusi:**
1. Clear cache npm:
   ```bash
   npm cache clean --force
   ```

2. Hapus node_modules dan install ulang:
   ```bash
   cd my-admin
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Jika masih error, coba dengan yarn:
   ```bash
   yarn install
   ```

## 📚 Dokumentasi Tambahan

- [SETUP.md](SETUP.md) - Panduan setup lengkap dengan flowchart
- [GO/DOCUMENTATION.md](GO/DOCUMENTATION.md) - Dokumentasi backend Go
- [GO/DATABASE_SCHEMA_README.md](GO/DATABASE_SCHEMA_README.md) - Dokumentasi schema database
- [my-admin/DOCUMENTATION.md](my-admin/DOCUMENTATION.md) - Dokumentasi frontend Next.js

## 🔄 Development Workflow

1. **Start Backend** → `cd GO && go run cmd/server/main.go`
2. **Start Frontend** → `cd my-admin && npm run dev`
3. **Make Changes** → Auto-reload (hot reload)
4. **Test** → Login dan test features
5. **Check Logs** → Backend logs di terminal, Frontend di browser console

## 📝 Catatan Penting

- **Jangan commit file `.env` atau `.env.local` ke repository!**
- File `.env` sudah ada di `.gitignore`
- Untuk production, gunakan environment variables yang aman
- Pastikan `JWT_SECRET` dan `PLATFORM_API_KEY` menggunakan random generator yang aman
- Database migrations harus dijalankan sebelum menjalankan aplikasi

## 🤝 Kontribusi

Jika menemukan bug atau ingin menambahkan fitur, silakan buat issue atau pull request.

## 📄 License

[Tambahkan informasi license jika ada]

---

**Selamat Coding! 🚀**

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

