# Setup Guide - Full Stack Application

Panduan lengkap untuk setup backend Go dan frontend Next.js.

## 📋 Prerequisites

- **Go** 1.21 atau lebih tinggi
- **PostgreSQL** 12 atau lebih tinggi
- **Node.js** 18 atau lebih tinggi
- **npm** atau **yarn**

## 🔧 Backend Setup (GO)

### 1. Install Dependencies

```bash
cd GO
go mod tidy
```

### 2. Setup Database

```bash
# Create database
createdb pks-db

# Run migrations
psql -d pks-db -f internal/db/migrations.sql
```

Lihat [GO/DATABASE_SETUP.md](GO/DATABASE_SETUP.md) untuk detail setup database dan test data.

### 3. Configure Environment Variables

Buat file `.env` di folder `GO/`:

```env
PORT=3000
ENV=development
DATABASE_URL=postgres://username:password@localhost:5432/pks-db?sslmode=disable
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PLATFORM_API_KEY=your-platform-api-key-for-server-to-server
```

**Penting:**
- Ganti `username`, `password` dengan credentials PostgreSQL Anda
- Ganti `pks-db` dengan nama database Anda (jika berbeda)
- Generate `JWT_SECRET` dan `PLATFORM_API_KEY` (lihat cara di bawah)
- **Jangan commit file `.env` ke repository!**

### Generate Secure Secrets

Anda perlu membuat sendiri `JWT_SECRET` dan `PLATFORM_API_KEY`. Berikut beberapa cara:

#### Option 1: Menggunakan Go Script (Recommended)

```bash
cd GO
go run scripts/generate-secrets.go
```

Script ini akan generate random secure keys yang bisa langsung digunakan.

#### Option 2: Menggunakan OpenSSL

```bash
# Generate JWT_SECRET (base64, 64 bytes)
openssl rand -base64 64

# Generate PLATFORM_API_KEY (hex, 32 bytes)
openssl rand -hex 32
```

#### Option 3: Menggunakan Online Generator

- JWT Secret: https://generate-secret.vercel.app/64 (atau generator serupa)
- API Key: Generate random hex string (32+ karakter)

#### Option 4: Manual (Development Only)

Untuk development/testing saja, bisa menggunakan string random:
- `JWT_SECRET`: Minimal 32 karakter random
- `PLATFORM_API_KEY`: Minimal 32 karakter random

**⚠️ Warning:** Untuk production, HARUS menggunakan cryptographically secure random generator!

### 4. Run Backend

```bash
cd GO
go run cmd/server/main.go
```

Backend akan berjalan di `http://localhost:3000`

## 🎨 Frontend Setup (my-admin)

### 1. Install Dependencies

```bash
cd my-admin
npm install
```

### 2. Configure Environment Variables

Buat file `.env.local` di folder `my-admin/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Catatan:** Pastikan port sesuai dengan backend Go (default: 3000)

### 3. Run Frontend

```bash
cd my-admin
npm run dev
```

Frontend akan berjalan di `http://localhost:3001` (atau port yang tersedia)

## 🚀 Running Both Services

### Option 1: Separate Terminals

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

### Option 2: Using Scripts (Windows)

Buat file `start-dev.bat` di root project:

```batch
@echo off
start "Backend Go" cmd /k "cd GO && go run cmd/server/main.go"
timeout /t 3
start "Frontend Next.js" cmd /k "cd my-admin && npm run dev"
```

Jalankan:
```bash
start-dev.bat
```

## ✅ Verification

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Frontend Access:**
   - Buka browser: `http://localhost:3001`
   - Login dengan admin credentials
   - Test create company

## 🔐 Default Admin Credentials

Setelah setup database, buat admin user melalui SQL atau menggunakan script di `DATABASE_SETUP.md`.

Contoh:
```sql
INSERT INTO admins (id, username, password_hash, role, status)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$10$...', -- bcrypt hash dari password
  'superadmin',
  'active'
);
```

## 🐛 Troubleshooting

### Backend tidak bisa connect ke database
- Check `DATABASE_URL` format: `postgres://user:pass@host:port/db?sslmode=disable`
- Pastikan PostgreSQL service berjalan
- Check firewall/network settings

### Frontend tidak bisa connect ke backend
- Check `NEXT_PUBLIC_API_URL` di `.env.local`
- Pastikan backend berjalan di port yang benar
- Check CORS settings di backend (sudah ada middleware CORS)

### JWT Token Invalid
- Pastikan `JWT_SECRET` sama di backend
- Token mungkin expired, login ulang
- Check browser console untuk error details

### Port Already in Use
- Backend: Ganti `PORT` di `.env`
- Frontend: Next.js akan otomatis menggunakan port lain

## 📚 Additional Documentation

- [Backend README](GO/README.md) - Dokumentasi lengkap backend
- [Frontend Integration Guide](my-admin/INTEGRATION.md) - Panduan integrasi frontend
- [Database Setup](GO/DATABASE_SETUP.md) - Setup database dan test data

## 🔄 Development Workflow

1. **Start Backend** → `cd GO && go run cmd/server/main.go`
2. **Start Frontend** → `cd my-admin && npm run dev`
3. **Make Changes** → Auto-reload (hot reload)
4. **Test** → Login dan test features
5. **Check Logs** → Backend logs di terminal, Frontend di browser console

---

**Happy Coding! 🚀**

