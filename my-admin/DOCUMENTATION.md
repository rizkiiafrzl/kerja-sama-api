# my-admin (Next.js Admin Frontend) – Dokumentasi Lengkap

## Ringkas
Dashboard admin Next.js (App Router) untuk mengelola partner/perusahaan yang terhubung ke backend Go. Fitur utama: login admin (JWT), buat/list/detail/update/hapus partner, kelola scopes, reveal/reset API key. Berjalan di port 3001, proxy API ke backend port 3000.

## Lingkungan & Jalankan
1) Salin `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
2) Jalankan dev server:
```
npm install
npm run dev   # Next.js di http://localhost:3001
```
3) Pastikan backend Go hidup di `NEXT_PUBLIC_API_URL`.

## Arsitektur
- **Framework**: Next.js 16 (App Router), React 19.
- **Entry halaman**: `src/app/page.js` (home) dan `src/app/dashboard/page.js` keduanya memakai `AuthGuard`.
- **Komponen kunci**: `AddCompanyForm`, `CompanyList`, `CompanyActions`, `EditCompanyModal`, `LoginForm`, `AuthGuard`, `LogoutButton`.
- **API client util**: `src/lib/api.js` (token storage + fetch wrapper).
- **Konfigurasi endpoint**: `src/lib/config.js`.
- **Mapping scope**: `src/lib/scopes.js` (lihat_* ↔ backend scope).
- **Next API routes (proxy ke backend)**: `src/app/api/companies/*`, `.../[id]/...` untuk CRUD, scopes, reveal/reset/rotate API key, generate kode lokal.

## Alur Otentikasi
1) **Login**: `LoginForm` memanggil `adminLogin` → `POST /api/v1/auth/admin/login` backend. Token dan user disimpan di `localStorage` (`admin_token`, `admin_user`).
2) **AuthGuard**: cek token di localStorage (interval & storage event). Jika tidak ada, tampilkan halaman login; jika ada, render children.
3) **Proteksi**: semua fetch ke Next API (proxy) menyertakan header `Authorization: Bearer <token>`; jika 401 → redirect/login.

## Alur Data Partner
1) **Tambah partner** (`AddCompanyForm`):
   - Auto-generate `company_id` dan `nomor_pks` via `/api/companies/generate` (client-side generator; untuk produksi sebaiknya backend).
   - Payload ke proxy `/api/companies` (POST) → diteruskan ke backend `/admin/partners`.
   - Scopes frontend (lihat_*) dikonversi ke backend scopes (`name`, `tanggal_lahir`, `status_bpjs`, `alamat`, dll) via `convertScopesToBackend`.
   - Berhasil: tampilkan pesan & reset form; refresh list.
2) **List partner** (`CompanyList`):
   - GET `/api/companies` → backend `/admin/partners`.
   - Normalisasi `id` dari berbagai field (id/ID/partner_id) sebelum render.
   - Tabel dengan aksi detail/edit/delete.
3) **Detail partner** (modal):
   - GET `/api/companies/:id` → backend `/admin/partners/:id`.
   - GET scopes `/api/companies/:id/scopes` → backend `/admin/partners/:id/scopes`.
   - Tombol Reveal API Key (`/reveal-api-key`, GET) dan Reset API Key (`/reset-api-key`, POST). Modal khusus menampilkan API key plaintext sekali.
4) **Update partner** (`EditCompanyModal`, proxy PUT `/api/companies/:id`).
5) **Delete partner** (DELETE `/api/companies/:id`) → backend set status N.

## Next API Routes (proxy)
- `POST /api/companies` → backend `POST /admin/partners`
- `GET /api/companies` → backend `GET /admin/partners`
- `GET /api/companies/[id]` → backend `GET /admin/partners/:id`
- `PUT /api/companies/[id]` → backend `PUT /admin/partners/:id`
- `DELETE /api/companies/[id]` → backend `DELETE /admin/partners/:id`
- `GET /api/companies/[id]/scopes` → backend `GET /admin/partners/:id/scopes`
- `PUT /api/companies/[id]/scopes` → backend `PUT /admin/partners/:id/scopes`
- `GET /api/companies/[id]/reveal-api-key` → backend `GET /admin/partners/:id/reveal-api-key`
- `POST /api/companies/[id]/reset-api-key` → backend `POST /admin/partners/:id/reset-api-key`
- `POST /api/companies/[id]/rotate-secret` → backend `POST /admin/partners/:id/reset-api-key` (alias)
- `GET /api/companies/generate` → generator lokal (demo) untuk `company_id` & `nomor_pks`

## Mapping Scope
`src/lib/scopes.js`
- Frontend → Backend:
  - `lihat_nama` → `name`
  - `lihat_tanggal_lahir` → `tanggal_lahir`
  - `lihat_status_kepesertaan` → `status_bpjs`
  - `lihat_alamat` → `alamat`
  - (lainnya ada di mapping namun backend saat ini fokus empat scope utama)
- Util: `convertScopesToBackend`, `convertScopesFromBackend`, `convertScopesToUpdatePayload`.

## UI/UX Ringkas
- Layout sederhana: header + tombol logout, section Add Company, tabel Companies.
- Add form dengan validasi email/phone (max 13 digit), kontrak start/end, scopes, notes.
- Detail modal menampilkan metadata, kontrak, PIC, status, scopes, dan aksi API key.
- Banyak log/console untuk debugging struktur respons backend.

## Paket & Skrip
- Dependencies: `next@16`, `react@19`, `react-dom@19`.
- Dev deps: `eslint@9`, `eslint-config-next`, `tailwindcss@4`, `@tailwindcss/postcss`, `babel-plugin-react-compiler`.
- Scripts: `npm run dev` (3001), `build`, `start` (3001), `lint`.

## Catatan Penting
- Generator company_id/PKS di frontend hanya demo; gunakan backend untuk unik/berurutan di produksi.
- Token disimpan di localStorage tanpa refresh logic; expired token akan memaksa login ulang (401).
- CORS sudah di-handle di backend; frontend memanggil langsung ke backend via baseURL.
- Error handling di proxy sudah mengembalikan pesan backend; UI menampilkan pesan sederhana.

## Rujukan File
- Konfig & utils: `src/lib/config.js`, `src/lib/api.js`, `src/lib/scopes.js`
- Halaman: `src/app/page.js`, `src/app/dashboard/page.js`
- Komponen: `src/app/components/*` (AuthGuard, LoginForm, AddCompanyForm, CompanyList, EditCompanyModal, CompanyActions, LogoutButton)
- API routes: `src/app/api/companies/...`
- Integrasi ringkas: `INTEGRATION.md`

