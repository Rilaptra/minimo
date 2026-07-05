# 🏘️ Minimo — Sistem Jimpitan Digital

> Digitalisasi iuran jimpitan warga RT/RW berbasis QR Code. Satu scan, setoran langsung tercatat.

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Bun-f9f1e1?style=for-the-badge&logo=bun" />
  <img src="https://img.shields.io/badge/Backend-Elysia-7c3aed?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-React%2019-61dafb?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Database-SQLite-003b57?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-c5f74f?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Styling-TailwindCSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss" />
</p>

---

## 📖 Tentang Proyek

**Minimo** adalah aplikasi manajemen jimpitan (iuran warga) berbasis web yang dirancang untuk RT/RW. Setiap rumah mendapat QR Code unik — petugas cukup scan untuk mencatat setoran, tanpa perlu input manual.

### ✨ Fitur Utama

- 🏠 **Manajemen Rumah** — Daftarkan warga dengan kode unik & QR Code
- 📱 **Scan QR Code** — Catat setoran instan lewat scan kamera
- 📊 **Dashboard Laporan** — Ringkasan total rumah, setoran, & nominal terkumpul
- 🖥️ **SSR (Server-Side Rendering)** — Halaman dimuat cepat via React SSR
- 📦 **Single File Executable** — Build jadi satu `.exe` untuk deploy mudah di Windows / Raspberry Pi

---

## 🏗️ Arsitektur

```
minimo/ (Bun Monorepo)
├── apps/
│   ├── api/          # Backend: Elysia server + React SSR
│   └── web/          # Frontend: React 19 + TanStack Router/Query
├── packages/
│   └── db/           # Shared: Drizzle ORM schema & koneksi DB
├── drizzle/          # Migrasi database (auto-generated)
├── build-exe.ts      # Script build ke Single File Executable
└── minimo.db         # Database SQLite (dibuat saat runtime)
```

### Stack Teknologi

| Layer | Teknologi |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Backend | [Elysia](https://elysiajs.com) |
| Frontend | React 19 + TanStack Router + TanStack Query |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team) |
| Styling | TailwindCSS v4 |
| Linting | [Biome](https://biomejs.dev) |

---

## 🚀 Quick Start

### Prasyarat

- **[Bun](https://bun.sh)** `>= 1.3` — wajib, menggantikan Node.js

### Instalasi

```bash
# Clone & install dependensi
git clone https://github.com/username/minimo.git
cd minimo
bun install
```

### Setup Database

```bash
# Generate file migrasi dari schema
bun run db:generate

# Jalankan migrasi ke minimo.db
bun run db:migrate
```

### Development

```bash
# Terminal 1: Jalankan API server (port 3000)
bun run dev:api

# Terminal 2: Watch & compile CSS
bun run watch:css
```

Buka di browser: **http://localhost:3000**

---

## 🗄️ Database Schema

```
houses
├── id          INTEGER  PK autoincrement
├── code        TEXT     UNIQUE (contoh: "JMT-001") — dipakai untuk QR Code
├── ownerName   TEXT     Nama pemilik rumah
├── address     TEXT     Alamat
└── createdAt   TIMESTAMP

contributions
├── id          INTEGER  PK autoincrement
├── houseId     INTEGER  FK → houses.id
├── amount      INTEGER  Nominal (Rupiah)
├── status      TEXT     "pending" | "collected"
└── createdAt   TIMESTAMP
```

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/houses` | Ambil semua data rumah |
| `POST` | `/api/houses` | Tambah rumah baru |
| `GET` | `/api/reports` | Ringkasan statistik (total rumah, setoran, nominal) |
| `GET` | `/api/scan/:code` | Proses scan QR Code → catat setoran otomatis |
| `GET` | `/*` | Serve React app (SSR) |

### Contoh `POST /api/houses`

```json
{
  "code": "JMT-001",
  "ownerName": "Budi Santoso",
  "address": "Jl. Melati No. 5"
}
```

---

## 📦 Build Executable

Minimo bisa dikompilasi menjadi **satu file executable tunggal** — tidak perlu install Bun atau Node di mesin target.

```bash
bun run build-exe.ts
```

Pilih target saat diminta:
- `1` → **Windows x64** → menghasilkan `minimo-win.exe`
- `2` → **Raspberry Pi 3 B (Linux ARM64)** → menghasilkan `minimo-pi`

> ⚠️ Pastikan file `minimo.db` berada di folder yang **sama** dengan executable saat dijalankan.

### Proses Build (4 tahap)

```
[1/4] Build frontend React + minify CSS
[2/4] Embed JS & CSS ke dalam kode backend (sebagai string literal)
[3/4] Kompilasi ke Single File Executable via `bun build --compile`
[4/4] Done 🎉
```

---

## 🛠️ Scripts

| Script | Perintah | Deskripsi |
|---|---|---|
| Dev API | `bun run dev:api` | Jalankan backend dengan hot reload |
| Build Web | `bun run build:web` | Build frontend + minify CSS |
| Watch CSS | `bun run watch:css` | Watch & recompile Tailwind CSS |
| DB Generate | `bun run db:generate` | Generate file migrasi Drizzle |
| DB Migrate | `bun run db:migrate` | Jalankan migrasi ke `minimo.db` |
| Build Exe | `bun run build-exe.ts` | Build single-file executable |

---

## 🔧 Konfigurasi

### Biome (Linter + Formatter)
Konfigurasi ada di [`biome.json`](./biome.json). Jalankan lint:
```bash
bunx biome check .
bunx biome check --write .  # auto-fix
```

### Drizzle ORM
Konfigurasi ada di [`drizzle.config.ts`](./drizzle.config.ts):
- **Schema**: `packages/db/schema.ts`
- **Dialect**: SQLite
- **DB File**: `./minimo.db`

---

## 📁 Struktur Detail

```
apps/api/src/
├── index.ts           # Entry point: Elysia routes + React SSR
├── migrate.ts         # Script migrasi DB
└── embedded-assets.ts # (auto-generated) Berisi JS & CSS sebagai string

apps/web/src/
├── App.tsx            # Root React component
├── components/        # Komponen UI
├── routes/            # TanStack Router pages
└── styles/
    └── globals.css    # Tailwind CSS entry

packages/db/
├── schema.ts          # Definisi tabel Drizzle
└── index.ts           # Export db instance + schema
```

---

## 🤝 Kontribusi

PR dan issue sangat disambut! Pastikan kode lulus lint Biome sebelum submit.

---

## 📄 Lisensi

MIT — bebas dipakai & dimodifikasi untuk keperluan RT/RW kamu. 🏘️
