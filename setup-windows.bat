@echo off
echo ========================================
echo PKS-DB Setup Script for Windows
echo ========================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL tidak ditemukan!
    echo Silakan install PostgreSQL terlebih dahulu.
    pause
    exit /b 1
)

echo [1/6] Checking PostgreSQL...
echo PostgreSQL ditemukan!
echo.

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go tidak ditemukan!
    echo Silakan install Go terlebih dahulu.
    pause
    exit /b 1
)

echo [2/6] Checking Go...
echo Go ditemukan!
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo Silakan install Node.js terlebih dahulu.
    pause
    exit /b 1
)

echo [3/6] Checking Node.js...
echo Node.js ditemukan!
echo.

echo [4/6] Setup Database...
echo Membuat database pks_db...
psql -U postgres -c "CREATE DATABASE pks_db;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database pks_db berhasil dibuat!
) else (
    echo Database mungkin sudah ada atau terjadi error.
    echo Lanjutkan ke migrasi...
)
echo.

echo Menjalankan migrations...
cd GO
psql -U postgres -d pks_db -f internal/db/migrations.sql
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Migrations mungkin sudah dijalankan atau terjadi error.
    echo Silakan cek manual jika perlu.
)
cd ..
echo.

echo [5/6] Setup Backend...
cd GO
if not exist .env (
    echo Membuat file .env dari template...
    copy ENV_TEMPLATE.txt .env >nul
    echo File .env berhasil dibuat!
    echo.
    echo [PENTING] Edit file GO\.env dan isi dengan konfigurasi yang benar:
    echo   - DATABASE_URL dengan credentials PostgreSQL Anda
    echo   - Generate JWT_SECRET dan PLATFORM_API_KEY dengan: go run scripts/generate-secrets.go
) else (
    echo File .env sudah ada, skip...
)
echo.

echo Menginstall Go dependencies...
go mod download
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal menginstall dependencies!
    pause
    exit /b 1
)
cd ..
echo.

echo [6/6] Setup Frontend...
cd my-admin
if not exist .env.local (
    echo Membuat file .env.local dari template...
    copy ENV_TEMPLATE.txt .env.local >nul
    echo File .env.local berhasil dibuat!
) else (
    echo File .env.local sudah ada, skip...
)
echo.

echo Menginstall Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal menginstall dependencies!
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo Setup selesai!
echo ========================================
echo.
echo Langkah selanjutnya:
echo 1. Edit file GO\.env dan isi dengan konfigurasi yang benar
echo 2. Generate secrets: cd GO ^&^& go run scripts/generate-secrets.go
echo 3. Buat admin user: cd GO ^&^& go run scripts/create-admin.go username password superadmin
echo 4. Jalankan backend: cd GO ^&^& go run cmd/server/main.go
echo 5. Jalankan frontend: cd my-admin ^&^& npm run dev
echo.
echo Atau gunakan start-dev.bat untuk menjalankan kedua service sekaligus.
echo.
pause

