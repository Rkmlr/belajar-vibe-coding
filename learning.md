# 📘 Jurnal Pembelajaran Backend API (Standar Industri)

Dokumen ini berisi rangkuman hasil pembelajaran mengenai konsep dasar backend, arsitektur kode, struktur database, hingga penerapan standar industri (Production-Ready) yang dibahas pada sesi ini.

---

## 1. Pemahaman Proyek Saat Ini (Tech Stack)
Proyek ini menggunakan tumpukan teknologi (Tech Stack) modern dengan performa tinggi:
*   **Bun:** Runtime JavaScript super cepat (pengganti Node.js).
*   **ElysiaJS:** Web framework tercepat yang didesain untuk Bun.
*   **Drizzle ORM:** ORM ringan dan *type-safe* untuk interaksi database.
*   **MySQL:** Database relasional.
*   **TypeScript:** Bahasa pemrograman utama.

### ✨ Fitur & API yang Tersedia Saat Ini
Aplikasi ini menyediakan sistem otentikasi berbasis token dengan endpoint (API) berikut:
*   **Registrasi:** `POST /api/users` - Untuk mendaftarkan pengguna baru.
*   **Login:** `POST /api/users/login` - Untuk masuk dan mendapatkan token otentikasi (sesi).
*   **Profil Pengguna:** `GET /api/users/current` - Untuk mengambil data profil pengguna yang sedang login (membutuhkan Bearer Token).
*   **Logout:** `DELETE /api/users/logout` - Untuk menghapus sesi/token pengguna.
*   **Health Check:** `GET /` dan `GET /test-db` - Untuk mengecek apakah server dan koneksi database berjalan lancar.

### 🗄️ Struktur Database Saat Ini
Proyek ini memiliki struktur database sederhana dengan 3 tabel utama:
*   `users` (Menyimpan id, username, email, password yang di-hash, createdAt, updatedAt)
*   `sessions` (Menyimpan token login pengguna dan userId)
*   `posts` (Tabel postingan yang terhubung ke pengguna melalui userId)

### 📂 Struktur Kode Saat Ini
Aplikasi ini menggunakan pola arsitektur yang terstruktur:
*   `src/routes/`: Berisi pengaturan URL/endpoint API (seperti file `user-routes.ts`).
*   `src/services/`: Berisi *business logic* atau aturan jalannya aplikasi (seperti logika hashing password, pembuatan sesi).
*   `src/db/`: Berisi koneksi database dan skema tabel Drizzle ORM.
*   `tests/`: Berisi kode *unit test* untuk menguji apakah API berjalan dengan benar.

**Alur Registrasi User:**
1. Menerima request & Validasi otomatis (ElysiaJS schema).
2. Mengecek duplikasi email di database (Drizzle).
3. Mengamankan password (Hashing menggunakan `Bun.password.hash` / bcrypt).
4. Menyimpan data pengguna ke database.
5. Mengirimkan respons ke klien (sukses/gagal).

---

## 2. Peningkatan Menuju Standar Industri (Production-Ready)

Meskipun fondasi proyek sudah bagus, aplikasi berskala industri membutuhkan fitur tambahan:

### A. Keamanan & Autentikasi
*   Mengganti token UUID manual dengan **JWT (JSON Web Token)**.
*   Menerapkan **HttpOnly Cookies** untuk mencegah pencurian token via XSS.
*   Menerapkan **Rate Limiter** untuk mencegah serangan *brute-force* atau *spam*.
*   Menerapkan **CORS** agar API aman saat diakses dari domain frontend tertentu.

### B. Siklus Hidup Pengguna (User Lifecycle)
*   **Verifikasi Email:** Mengirimkan link OTP sebelum akun aktif.
*   **Lupa Password (Forgot Password):** Alur reset password menggunakan email.
*   **Soft Delete:** Saat *user* menghapus akun, data tidak di-`DELETE` dari MySQL, melainkan hanya mengisi kolom `deleted_at`.

### C. Infrastruktur & Observabilitas
*   **Pencatatan Log Terstruktur (Structured Logging):** Menggunakan logger seperti Pino, bukan sekadar `console.log`.
*   **Caching (Redis):** Menyimpan data sesi di RAM agar lebih cepat daripada membaca dari MySQL.
*   **Docker:** Membungkus aplikasi ke dalam kontainer agar mudah di-*deploy* ke Cloud.

---

## 3. Desain API yang Ideal & Kekurangan Saat Ini

API yang benar menggunakan metode HTTP yang sesuai (GET, POST, PUT, DELETE) dengan struktur URL kata benda jamak (contoh: `/api/users`). 

### API Manajemen Pengguna (Standar Industri) yang Belum Ada:
Selain API yang Anda miliki saat ini, sistem *User Management* di industri wajib memiliki:
*   `POST /api/users/verify-email`: Konfirmasi email saat pertama daftar menggunakan kode OTP.
*   `POST /api/users/forgot-password`: Meminta link/token reset password via email.
*   `PUT /api/users/reset-password`: Mengubah password menggunakan token dari email.
*   `PUT /api/users/profile`: Mengubah data profil (nama, bio, avatar).
*   `PUT /api/users/change-password`: Mengganti password saat sedang login.
*   `POST /api/users/refresh-token`: Meminta token akses baru tanpa harus login ulang.
*   `DELETE /api/users/account`: Opsi menonaktifkan akun sendiri.

Jika membangun **aplikasi utuh**, berikut adalah contoh rincian Pilar Domain Utama (Core API) berdasarkan studi kasus:

### Contoh Kasus 1: API Sosial Media
*   **API Manajemen Konten (Posts)**
    *   `POST /api/posts`: Membuat postingan baru.
    *   `GET /api/posts`: Menampilkan beranda (Feed) dari orang yang di-follow.
    *   `DELETE /api/posts/:id`: Menghapus postingan sendiri.
*   **API Interaksi (Likes & Comments)**
    *   `POST /api/posts/:id/like`: Menyukai atau membatalkan suka (Unlike) postingan.
    *   `POST /api/posts/:id/comments`: Menambahkan komentar.
    *   `GET /api/posts/:id/comments`: Menampilkan semua komentar.
*   **API Relasi (Follows)**
    *   `POST /api/users/:id/follow`: Mengikuti (follow) atau berhenti mengikuti (unfollow) *user* lain.
    *   `GET /api/users/:id/followers`: Melihat daftar pengikut.

### Contoh Kasus 2: API E-Commerce
*   **API Katalog Produk (Publik)**
    *   `GET /api/products`: Menampilkan semua produk dengan fitur filter/pencarian (misal `?category=sepatu&sortBy=cheapest`).
    *   `GET /api/products/:id`: Menampilkan detail produk.
    *   `POST /api/products`: (Khusus Admin/Penjual) Menambah produk baru.
*   **API Keranjang Belanja (Cart)**
    *   `POST /api/cart`: Memasukkan produk ke keranjang.
    *   `GET /api/cart`: Melihat isi keranjang diri sendiri.
    *   `DELETE /api/cart/:itemId`: Menghapus barang dari keranjang.
*   **API Pemesanan (Checkout & Orders)**
    *   `POST /api/orders/checkout`: Mengubah isi keranjang menjadi pesanan resmi (Invoice) dan mengurangi stok produk.
    *   `GET /api/orders/my-orders`: Melihat riwayat pesanan pribadi.
*   **API Pembayaran (Webhooks)**
    *   `POST /api/webhooks/payment`: API unik yang tidak dipanggil oleh *user*, melainkan oleh sistem bank/payment gateway (misal Midtrans) secara otomatis untuk memberi tahu backend bahwa transaksi sudah dibayar lunas.

---

## 4. Desain Database Berdasarkan Studi Kasus

### Kekurangan Tabel Saat Ini (Standar Industri)
*   **`users`**: Kekurangan kolom `role` (admin/user), `is_email_verified` (boolean), dan `deleted_at` (soft delete).
*   **`sessions`**: Kekurangan kolom `expires_at` (kedaluwarsa sesi), `ip_address`, dan `user_agent`.

### A. Struktur Database Sosial Media (Contoh: Mini Twitter)
Fokus pada konten dan relasi sosial.
1.  **`users`**: `id`, `username`, `email`, `password`, `avatar_url`.
2.  **`posts`**: `id`, `user_id` (FK), `content`, `image_url`, `created_at`.
3.  **`comments`**: `id`, `post_id` (FK), `user_id` (FK), `content`, `created_at`.
4.  **`likes`**: `id`, `user_id` (FK), `post_id` (FK). Melacak siapa menyukai apa.
5.  **`follows`**: `id`, `follower_id` (FK), `following_id` (FK). Relasi pengikut.

### B. Struktur Database E-Commerce (Contoh: Mini Tokopedia)
Fokus pada katalog barang dan transaksi keuangan yang sangat ketat.
1.  **`users`**: Ditambah kolom `role` (pembeli/admin) dan `address` (alamat).
2.  **`products`**: `id`, `name`, `description`, `price`, `stock`, `image_url`.
3.  **`carts`**: `id`, `user_id` (FK), `product_id` (FK), `quantity` (keranjang belanja sementara).
4.  **`orders`**: `id`, `user_id` (FK), `total_price`, `status` (menunggu/lunas/dikirim).
5.  **`order_items`**: `id`, `order_id` (FK), `product_id` (FK), `quantity`, **`price_at_buy`** (Sangat penting: mencatat harga final saat dibeli).
6.  **`payments`**: `id`, `order_id` (FK), `payment_method`, `payment_status`.

---

## 5. Arsitektur Folder & Struktur Kode (Layered Architecture)

Untuk aplikasi yang skalanya membesar, kode harus dipisah agar mudah dikelola dan diuji. Pendekatan standar industrinya adalah **Controller-Service-Repository**:

1.  **Routes / Controllers (`src/routes` atau `src/controllers`)**
    *   **Tugas:** Menerima request HTTP, memvalidasi input awal, dan membalas response JSON. Tidak boleh ada logika bisnis database.
2.  **Services (`src/services`)**
    *   **Tugas:** Berisi *business logic* atau "otak" perhitungan aplikasi (misal: hitung diskon, hash password).
3.  **Repositories (`src/repositories`)**
    *   **Tugas:** Secara khusus dan eksklusif hanya untuk menulis perintah koneksi database (Query Drizzle/SQL). Service memanggil Repository, bukan memanggil fungsi DB langsung.
4.  **Middlewares (`src/middlewares`)**
    *   **Tugas:** Penjaga rute. Contoh: Mengecek apakah token Bearer valid sebelum membiarkan *user* masuk ke API tertentu.
5.  **Utils & Config (`src/utils`, `src/config`)**
    *   **Tugas:** Fungsi-fungsi kecil (format tanggal) dan validasi file environment (`.env`).

**Catatan Pembelajaran:** 
Untuk tahap awal/pemula, menggabungkan logika *Repository* ke dalam *Service* (*Fat Service*) seperti yang Anda lakukan saat ini sangat wajar dan dianjurkan agar tidak *over-engineering*. Struktur yang lebih rumit dengan memisahkan `repositories` baru diaplikasikan saat proyek sudah besar (misalnya saat file service mencapai ratusan baris).
