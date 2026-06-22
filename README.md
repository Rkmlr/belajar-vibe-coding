# Belajar Vibe Coding - Backend API

Aplikasi ini merupakan sistem backend RESTful API sederhana yang menyediakan fitur registrasi pengguna, otentikasi (login/logout), dan manajemen profil pengguna. Proyek ini dibangun untuk mendemonstrasikan ekosistem modern menggunakan Bun, ElysiaJS, dan Drizzle ORM dengan database MySQL.

---

## 🛠️ Technology Stack & Library

- **Runtime:** [Bun](https://bun.sh/) - Runtime JavaScript yang sangat cepat, sekaligus berfungsi sebagai package manager dan test runner.
- **Web Framework:** [ElysiaJS](https://elysiajs.com/) - Framework web yang sangat cepat untuk Bun dengan dukungan keamanan tipe (type-safety) bawaan.
- **ORM (Object-Relational Mapping):** [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript yang ringan dan cepat.
- **Database:** [MySQL](https://www.mysql.com/) - Sistem manajemen basis data relasional.
- **Database Driver:** `mysql2` - Driver MySQL untuk Node.js/Bun.
- **Testing Framework:** `bun:test` - Test runner bawaan dari Bun.
- **Bahasa Pemrograman:** TypeScript.

---

## 📂 Arsitektur & Struktur Folder

Aplikasi ini menggunakan pendekatan arsitektur modular sederhana (Controller-Service-Repository logic) yang dibagi ke dalam beberapa folder agar mudah dikelola. Penamaan file menggunakan format *kebab-case* (huruf kecil dipisahkan tanda hubung).

```text
belajar-vibe-coding/
├── .env                  # Variabel lingkungan untuk aplikasi (kredensial DB)
├── package.json          # Konfigurasi dependensi dan script (dev, start, test)
├── tsconfig.json         # Konfigurasi TypeScript compiler
├── drizzle.config.ts     # Konfigurasi untuk Drizzle ORM
├── src/                  # Folder kode utama (Source Code)
│   ├── index.ts          # Entry point aplikasi (Inisialisasi server Elysia)
│   ├── db/               # Konfigurasi Database
│   │   ├── index.ts      # Setup koneksi MySQL & inisialisasi Drizzle client
│   │   └── schema.ts     # Definisi skema tabel database (Users, Sessions, Posts)
│   ├── routes/           # Layer Controller/Route
│   │   └── user-routes.ts # Definisi endpoint API untuk User & skema validasi
│   └── services/         # Layer Business Logic
│       └── user-service.ts# Logika registrasi, hashing password, sesi login, dll.
└── tests/                # Folder Pengujian (Unit Tests)
    └── user-api.test.ts  # Test suite untuk endpoint API menggunakan `bun test`
```

---

## 🗄️ Schema Database

Aplikasi ini menggunakan tiga tabel utama yang didefinisikan dalam Drizzle ORM (`src/db/schema.ts`):

1. **`users`** - Menyimpan data pengguna.
   - `id`: Integer, Primary Key, Auto Increment.
   - `username`: Varchar(255), Not Null, Unique.
   - `email`: Varchar(255), Not Null, Unique.
   - `password`: Varchar(255), Not Null (Hash Bcrypt).
   - `createdAt`: Timestamp.
   - `updatedAt`: Timestamp.

2. **`sessions`** - Menyimpan sesi login pengguna (Token Otentikasi).
   - `id`: Integer, Primary Key, Auto Increment.
   - `token`: Varchar(255), Not Null, Unique (UUID).
   - `userId`: Integer, Foreign Key merujuk ke `users.id`.
   - `createdAt`: Timestamp.
   - `updatedAt`: Timestamp.

3. **`posts`** - Menyimpan postingan pengguna.
   - `id`: Integer, Primary Key, Auto Increment.
   - `title`: Varchar(255), Not Null.
   - `content`: Text, Not Null.
   - `userId`: Integer, Foreign Key merujuk ke `users.id`.
   - `createdAt`: Timestamp.
   - `updatedAt`: Timestamp.

---

## 🌐 API yang Tersedia

Base URL: `http://localhost:<PORT>` (Default port: 3000)

### 1. Registrasi User
- **Endpoint:** `POST /api/users`
- **Fungsi:** Mendaftarkan pengguna baru ke dalam sistem.
- **Body Request (JSON):**
  - `name` (string, max 255): Nama pengguna.
  - `email` (string, format email valid): Email pengguna.
  - `password` (string, min 6, max 72): Kata sandi.

### 2. Login User
- **Endpoint:** `POST /api/users/login`
- **Fungsi:** Mengotentikasi pengguna dan mengembalikan token sesi (Bearer token).
- **Body Request (JSON):**
  - `name` (string): Nama pengguna.
  - `email` (string): Email terdaftar.
  - `password` (string): Kata sandi.
- **Response:** Mengembalikan `token` pada object `data`.

### 3. Mendapatkan Profil User Terkini (Current User)
- **Endpoint:** `GET /api/users/current`
- **Fungsi:** Mengambil data profil dari pengguna yang sedang login.
- **Headers Required:**
  - `Authorization: Bearer <TOKEN_DARI_LOGIN>`

### 4. Logout User
- **Endpoint:** `DELETE /api/users/logout`
- **Fungsi:** Mengakhiri sesi pengguna dengan menghapus token dari database.
- **Headers Required:**
  - `Authorization: Bearer <TOKEN_DARI_LOGIN>`

### 5. Health Check / DB Test
- **Endpoint:** `GET /` - Mengembalikan pesan selamat datang.
- **Endpoint:** `GET /test-db` - Mengecek koneksi aplikasi ke database MySQL.

---

## ⚙️ Cara Setup Project

1. **Clone repositori**
   ```bash
   git clone <url-repository>
   cd belajar-vibe-coding
   ```

2. **Install dependensi**
   Pastikan Anda sudah menginstal [Bun](https://bun.sh/).
   ```bash
   bun install
   ```

3. **Konfigurasi Environment Variables**
   Buat file `.env` di root direktori dengan menyalin dari `.env.example` (atau sesuaikan dengan database MySQL lokal Anda):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password_db_anda
   DB_NAME=belajar_vibe_coding
   PORT=3000
   ```

4. **Siapkan Database**
   - Buat database `belajar_vibe_coding` di server MySQL Anda.
   - Sinkronisasi skema tabel Drizzle ORM ke dalam database MySQL:
     ```bash
     bunx drizzle-kit push
     ```

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi menyediakan dua script utama untuk dijalankan:

- **Mode Development (Hot-Reloading):**
  Akan memonitor perubahan file dan me-restart server secara otomatis.
  ```bash
  bun run dev
  ```

- **Mode Production:**
  Menjalankan aplikasi tanpa hot-reloading untuk performa optimal.
  ```bash
  bun run start
  ```

Server akan menyala di `http://localhost:3000` (atau port yang Anda atur di `.env`).

---

## 🧪 Cara Menjalankan Unit Test

Aplikasi ini menggunakan framework pengujian bawaan dari Bun (`bun:test`). Skenario pengujian (Registrasi, Login, Current User, Logout beserta edge case-nya) sudah dikonfigurasi agar membersihkan data tabel sesi dan pengguna secara otomatis (`beforeEach`) demi menjaga konsistensi data.

Untuk menjalankan seluruh pengujian API:

```bash
bun run test
```

> **Catatan:** Pastikan database sudah dikonfigurasi dan server MySQL sedang berjalan sebelum menjalankan pengujian. Framework `bun test` akan langsung mengeksekusi request ke HTTP handler Elysia tanpa harus membuka *listen port* baru.
