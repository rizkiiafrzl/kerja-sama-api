# 🚀 Quick Start Guide

Panduan cepat untuk menjalankan aplikasi di lokal setelah clone dari Git.

## ⚡ Setup Cepat (5 Menit)

### 1. Clone Repository

```bash
git clone <repository-url>
cd Kerjasama
```

### 2. Setup Database

```bash
# Buat database
createdb pks_db

# Atau menggunakan psql
psql -U postgres -c "CREATE DATABASE pks_db;"

# Jalankan migrations
cd GO
psql -U postgres -d pks_db -f internal/db/migrations.sql
cd ..
```

### 3. Setup Backend

```bash
cd GO

# Install dependencies
go mod download

# Buat file .env dari template
cat ENV_TEMPLATE.txt > .env

# Generate JWT_SECRET dan PLATFORM_API_KEY
go run scripts/generate-secrets.go

# Edit .env dan isi:
# - DATABASE_URL dengan credentials PostgreSQL Anda
# - Copy JWT_SECRET dan PLATFORM_API_KEY dari output di atas

# Test koneksi (Ctrl+C untuk stop)
go run cmd/server/main.go
```

### 4. Setup Frontend

```bash
cd my-admin

# Install dependencies
npm install

# Buat file .env.local dari template
cat ENV_TEMPLATE.txt > .env.local

# Edit .env.local jika perlu (default sudah benar)
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 5. Buat Admin User

```bash
cd GO
go run scripts/create-admin.go
# Masukkan username, password, dan role
```

### 6. Jalankan Aplikasi

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

### 7. Akses Aplikasi

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

Login dengan credentials admin yang sudah dibuat.

## ✅ Checklist Setup

- [ ] PostgreSQL terinstall dan berjalan
- [ ] Database `pks_db` sudah dibuat
- [ ] Migrations sudah dijalankan
- [ ] File `.env` di `GO/` sudah dibuat dan dikonfigurasi
- [ ] File `.env.local` di `my-admin/` sudah dibuat
- [ ] Dependencies backend sudah diinstall (`go mod download`)
- [ ] Dependencies frontend sudah diinstall (`npm install`)
- [ ] Admin user sudah dibuat
- [ ] Backend berjalan di port 3000
- [ ] Frontend berjalan di port 3001

## 🆘 Masalah Umum

### Database tidak bisa diakses
```bash
# Pastikan PostgreSQL berjalan
# Windows: net start postgresql-x64-XX
# Linux: sudo systemctl start postgresql
```

### Port sudah digunakan
```bash
# Ganti PORT di .env atau kill process yang menggunakan port
# Windows: netstat -ano | findstr :3000
# Linux: lsof -ti:3000 | xargs kill -9
```

### Dependencies error
```bash
# Backend: go mod tidy
# Frontend: rm -rf node_modules && npm install
```

## 📖 Dokumentasi Lengkap

Untuk dokumentasi lengkap, lihat [README.md](README.md)

---

**Happy Coding! 🎉**

