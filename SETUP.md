# Setup Guide - Full Stack Application

Panduan lengkap untuk setup backend Go dan frontend Next.js.

## 📊 Flowchart Alur Kerja Fitur Aplikasi

### 1. Fitur Login Admin

```mermaid
flowchart TD
    Start([Mulai]) --> UI_ShowForm[UI: Tampilkan Login Form]
    
    UI_ShowForm --> UI_Input[UI: User Input Username & Password]
    
    UI_Input --> API_Login[API: POST /api/v1/auth/admin/login]
    
    API_Login --> BE_Validate[BE: Validasi Admin & Generate JWT]
    
    BE_Validate --> BE_Check{BE: Credentials Valid?}
    
    BE_Check -->|No| ERR_Show[ERR: Tampilkan Error di Form]
    ERR_Show --> UI_Input
    
    BE_Check -->|Yes| UI_Receive[UI: Receive JWT Token & Admin Data]
    
    UI_Receive --> UI_Store[UI: Store Token di localStorage]
    
    UI_Store --> UI_Redirect[UI: Redirect ke Dashboard]
    
    UI_Redirect --> BE_CheckToken{BE: Validasi Token}
    
    BE_CheckToken -->|Invalid| ERR_Expired[ERR: Token Expired]
    ERR_Expired --> UI_ShowForm
    
    BE_CheckToken -->|Valid| UI_Dashboard[UI: Tampilkan Dashboard]
    
    UI_Dashboard --> End([Selesai])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style UI_ShowForm fill:#87CEEB
    style UI_Input fill:#87CEEB
    style UI_Receive fill:#87CEEB
    style UI_Store fill:#87CEEB
    style UI_Redirect fill:#87CEEB
    style UI_Dashboard fill:#87CEEB
    style API_Login fill:#FFD580
    style BE_Validate fill:#FFE4B5
    style BE_Check fill:#FFE4B5
    style BE_CheckToken fill:#FFE4B5
    style ERR_Show fill:#FFB6C1
    style ERR_Expired fill:#FFB6C1
```

### 2. Fitur Create Company/Partner

```mermaid
flowchart TD
    Start([Mulai]) --> UI_ShowForm[UI: Tampilkan Add Company Form]
    
    UI_ShowForm --> UI_FillData[UI: Isi Data Company]
    
    UI_FillData --> UI_AutoGen[UI: Auto Generate Company ID & PKS]
    
    UI_AutoGen --> UI_Submit[UI: Submit Form]
    
    UI_Submit --> API_Create[API: POST /admin/partners]
    
    API_Create --> BE_Process[BE: Validasi, Generate Data & Create Partner]
    
    BE_Process --> BE_Check{BE: Valid & Berhasil?}
    
    BE_Check -->|No| ERR_Show[ERR: Tampilkan Error di Form]
    ERR_Show --> UI_FillData
    
    BE_Check -->|Yes| UI_Receive[UI: Receive Partner Data & API Key]
    
    UI_Receive --> UI_ShowModal[UI: Tampilkan Modal API Key]
    
    UI_ShowModal --> UI_Copy[UI: User Copy API Key]
    
    UI_Copy --> UI_Refresh[UI: Refresh Company List]
    
    UI_Refresh --> End([Selesai])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style UI_ShowForm fill:#87CEEB
    style UI_FillData fill:#87CEEB
    style UI_AutoGen fill:#87CEEB
    style UI_Submit fill:#87CEEB
    style UI_Receive fill:#87CEEB
    style UI_ShowModal fill:#87CEEB
    style UI_Copy fill:#87CEEB
    style UI_Refresh fill:#87CEEB
    style API_Create fill:#FFD580
    style BE_Process fill:#FFE4B5
    style BE_Check fill:#FFE4B5
    style ERR_Show fill:#FFB6C1
```

### 3. Fitur View & Edit Company

```mermaid
flowchart TD
    Start([Mulai]) --> UI_Click[UI: Klik View/Edit Company]
    
    UI_Click --> API_GetDetail[API: GET /admin/partners/:id]
    
    API_GetDetail --> BE_GetData[BE: Get Partner & Scopes Data]
    
    BE_GetData --> UI_ShowModal[UI: Tampilkan Modal Detail]
    
    UI_ShowModal --> UI_Action{UI: User Action?}
    
    UI_Action -->|View| UI_Display[UI: Tampilkan Info Company]
    UI_Display --> End([Selesai])
    
    UI_Action -->|Edit| UI_EditForm[UI: Tampilkan Edit Form]
    
    UI_EditForm --> UI_Submit[UI: Submit Update]
    
    UI_Submit --> API_Update[API: PUT /admin/partners/:id]
    
    API_Update --> BE_Process[BE: Validasi & Update Partner]
    
    BE_Process --> BE_Check{BE: Valid & Berhasil?}
    
    BE_Check -->|No| ERR_Show[ERR: Tampilkan Error di Form]
    ERR_Show --> UI_EditForm
    
    BE_Check -->|Yes| UI_Receive[UI: Receive Success Response]
    
    UI_Receive --> UI_Refresh[UI: Refresh Company List]
    
    UI_Refresh --> End
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style UI_Click fill:#87CEEB
    style UI_ShowModal fill:#87CEEB
    style UI_Display fill:#87CEEB
    style UI_EditForm fill:#87CEEB
    style UI_Submit fill:#87CEEB
    style UI_Receive fill:#87CEEB
    style UI_Refresh fill:#87CEEB
    style API_GetDetail fill:#FFD580
    style API_Update fill:#FFD580
    style BE_GetData fill:#FFE4B5
    style BE_Process fill:#FFE4B5
    style BE_Check fill:#FFE4B5
    style ERR_Show fill:#FFB6C1
```

### 4. Fitur Delete Company

```mermaid
flowchart TD
    Start([Mulai]) --> UI_Click[UI: Klik Delete Company]
    
    UI_Click --> UI_Confirm{UI: Confirm Delete?}
    
    UI_Confirm -->|Cancel| End([Selesai])
    
    UI_Confirm -->|Confirm| API_Delete[API: DELETE /admin/partners/:id]
    
    API_Delete --> BE_Process[BE: Check & Soft Delete Partner]
    
    BE_Process --> BE_Check{BE: Berhasil?}
    
    BE_Check -->|No| ERR_Show[ERR: Tampilkan Error]
    ERR_Show --> End
    
    BE_Check -->|Yes| UI_Receive[UI: Receive Success Response]
    
    UI_Receive --> UI_Refresh[UI: Refresh Company List]
    
    UI_Refresh --> End
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style UI_Click fill:#87CEEB
    style UI_Confirm fill:#87CEEB
    style UI_Receive fill:#87CEEB
    style UI_Refresh fill:#87CEEB
    style API_Delete fill:#FFD580
    style BE_Process fill:#FFE4B5
    style BE_Check fill:#FFE4B5
    style ERR_Show fill:#FFB6C1
```

### 5. Fitur Manage Scopes (Access Permissions)

```mermaid
flowchart TD
    Start([Mulai]) --> UI_Click[UI: Klik Manage Scopes]
    
    UI_Click --> API_GetScopes[API: GET /admin/partners/:id/scopes]
    
    API_GetScopes --> BE_GetScopes[BE: Get Partner Scopes]
    
    BE_GetScopes --> UI_Display[UI: Tampilkan Scopes Status]
    
    UI_Display --> UI_Toggle[UI: User Toggle Scope Enable/Disable]
    
    UI_Toggle --> API_Update[API: PUT /admin/partners/:id/scopes]
    
    API_Update --> BE_Process[BE: Validasi & Update Scopes]
    
    BE_Process --> BE_Check{BE: Berhasil?}
    
    BE_Check -->|No| ERR_Show[ERR: Tampilkan Error]
    ERR_Show --> UI_Display
    
    BE_Check -->|Yes| UI_Receive[UI: Receive Success Response]
    
    UI_Receive --> UI_Refresh[UI: Refresh Scopes Display]
    
    UI_Refresh --> End([Selesai])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style UI_Click fill:#87CEEB
    style UI_Display fill:#87CEEB
    style UI_Toggle fill:#87CEEB
    style UI_Receive fill:#87CEEB
    style UI_Refresh fill:#87CEEB
    style API_GetScopes fill:#FFD580
    style API_Update fill:#FFD580
    style BE_GetScopes fill:#FFE4B5
    style BE_Process fill:#FFE4B5
    style BE_Check fill:#FFE4B5
    style ERR_Show fill:#FFB6C1
```

### 6. Fitur Reveal & Reset API Key

```mermaid
flowchart TD
    Start([Mulai]) --> UI_Click[UI: Klik Reveal/Reset API Key]
    
    UI_Click --> UI_Choice{UI: Pilih Action?}
    
    UI_Choice -->|Reveal| API_Reveal[API: GET /admin/partners/:id/reveal-api-key]
    UI_Choice -->|Reset| UI_Confirm{UI: Confirm Reset?}
    
    UI_Confirm -->|Cancel| End([Selesai])
    UI_Confirm -->|Confirm| API_Reset[API: POST /admin/partners/:id/reset-api-key]
    
    API_Reveal --> BE_Get[BE: Get Partner & Current API Key]
    API_Reset --> BE_Generate[BE: Generate New API Key & Update]
    
    BE_Get --> BE_Check1{BE: Berhasil?}
    BE_Generate --> BE_Check2{BE: Berhasil?}
    
    BE_Check1 -->|No| ERR_Show[ERR: Tampilkan Error]
    BE_Check2 -->|No| ERR_Show
    
    ERR_Show --> End
    
    BE_Check1 -->|Yes| UI_Receive1[UI: Receive Current API Key]
    BE_Check2 -->|Yes| UI_Receive2[UI: Receive New API Key]
    
    UI_Receive1 --> UI_ShowModal[UI: Tampilkan Modal API Key]
    UI_Receive2 --> UI_ShowModal
    
    UI_ShowModal --> UI_Copy[UI: User Copy API Key]
    
    UI_Copy --> End
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style UI_Click fill:#87CEEB
    style UI_Choice fill:#87CEEB
    style UI_Confirm fill:#87CEEB
    style UI_Receive1 fill:#87CEEB
    style UI_Receive2 fill:#87CEEB
    style UI_ShowModal fill:#87CEEB
    style UI_Copy fill:#87CEEB
    style API_Reveal fill:#FFD580
    style API_Reset fill:#FFD580
    style BE_Get fill:#FFE4B5
    style BE_Generate fill:#FFE4B5
    style BE_Check1 fill:#FFE4B5
    style BE_Check2 fill:#FFE4B5
    style ERR_Show fill:#FFB6C1
```

### 7. Fitur TK Checking (Partner API) - Level 1: Overview

```mermaid
flowchart TD
    Start([Mulai]) --> API_Request[API: POST /api/checking<br/>Header: X-API-KEY<br/>Body: NIK, TanggalLahir]
    
    API_Request --> BE_ValidateAuth[BE: Validasi API Key, Status & Contract]
    
    BE_ValidateAuth --> BE_CheckAuth{BE: Authorized?}
    
    BE_CheckAuth -->|No| ERR_Auth[ERR: Return 401/403]
    ERR_Auth --> End([End])
    
    BE_CheckAuth -->|Yes| BE_ValidateReq[BE: Validasi Request Body]
    
    BE_ValidateReq --> BE_CheckReq{BE: Request Valid?}
    
    BE_CheckReq -->|No| ERR_400[ERR: Return 400]
    ERR_400 --> End
    
    BE_CheckReq -->|Yes| BE_Process[BE: Query TK Data & Filter by Scopes]
    
    BE_Process --> BE_Log[BE: Log to Audit Table]
    
    BE_Log --> UI_Return[UI: Return JSON Response]
    
    UI_Return --> End
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style API_Request fill:#FFD580
    style UI_Return fill:#87CEEB
    style BE_ValidateAuth fill:#FFE4B5
    style BE_CheckAuth fill:#FFE4B5
    style BE_ValidateReq fill:#FFE4B5
    style BE_CheckReq fill:#FFE4B5
    style BE_Process fill:#FFE4B5
    style BE_Log fill:#FFE4B5
    style ERR_Auth fill:#FFB6C1
    style ERR_400 fill:#FFB6C1
```

### 7. Fitur TK Checking (Partner API) - Level 2: Detail Process

```mermaid
flowchart TD
    Start([Detail Process]) --> BE_GetPartner[BE: Get Partner by API Key]
    
    BE_GetPartner --> BE_CheckStatus[BE: Check Status Active & Contract Period]
    
    BE_CheckStatus --> BE_LoadScopes[BE: Load Partner Scopes]
    
    BE_LoadScopes --> BE_Parse[BE: Parse NIK & TanggalLahir]
    
    BE_Parse --> BE_QueryTK[BE: Query TK Data by NIK & DOB]
    
    BE_QueryTK --> BE_Found{TK Found?}
    
    BE_Found -->|No| BE_PrepareNotFound[BE: Prepare Response found: false]
    
    BE_Found -->|Yes| BE_Filter[BE: Filter by Enabled Scopes<br/>name, tanggal_lahir, status_bpjs, alamat]
    
    BE_Filter --> BE_PrepareFound[BE: Prepare Response found: true]
    
    BE_PrepareNotFound --> BE_LogAudit[BE: Log Request & Response to Audit]
    BE_PrepareFound --> BE_LogAudit
    
    BE_LogAudit --> End([Return Response])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style BE_GetPartner fill:#FFE4B5
    style BE_CheckStatus fill:#FFE4B5
    style BE_LoadScopes fill:#FFE4B5
    style BE_Parse fill:#FFE4B5
    style BE_QueryTK fill:#FFE4B5
    style BE_Found fill:#FFE4B5
    style BE_Filter fill:#FFE4B5
    style BE_PrepareNotFound fill:#FFE4B5
    style BE_PrepareFound fill:#FFE4B5
    style BE_LogAudit fill:#FFE4B5
```

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

