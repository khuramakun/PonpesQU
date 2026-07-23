# 🛡️ Blueprint & Panduan Lengkap Keamanan Sistem Anti-Hack PonpesQU

Dokumen ini adalah **Panduan & Blueprint Keamanan Siber (Cybersecurity Blueprint)** komprehensif untuk melindungi aplikasi **PonpesQU** di Hostinger agar terhindar dari peretasan (*hacking*), serangan pencurian data, *malware*, dan penyerangan *server*.

---

## 🎯 1. Ringkasan Vektor Serangan & Strategi Pertahanan

| Jenis Serangan (Threat) | Vektor / Risiko | Strategi Anti-Hack PonpesQU |
| :--- | :--- | :--- |
| **SQL Injection (SQLi)** | Pembacaan/Penghapusan paksa tabel database via kueri jahat. | **Parameterized Queries (`mysql2/promise`)**: Seluruh input user dilewatkan sebagai variabel terikat, menghalangi eksekusi script SQL jahat. |
| **Brute Force Login** | Tebakan kata sandi otomatis berulang-ulang hingga berhasil. | **Rate Limiting & Login Audit Logging**: Setiap percobaan login mencatat IP, Device, Timestamp, dan membatasi percobaan login. |
| **Credential Theft / Exposure** | Kredensial MySQL atau API ter-expose di repositori Git publik. | **Environment Variable Isolation (`.env`) & `.gitignore`**: Seluruh password & rahasia terisolasi di server internal. |
| **Cross-Site Scripting (XSS)** | Injeksi JavaScript jahat ke tampilan user lain/wali santri. | **React Auto-Escaping & Input Sanitization**: React secara otomatis meng-escape teks HTML sebelum di-render ke DOM. |
| **Cross-Site Request Forgery (CSRF)** | Eksekusi tindakan ilegal tanpa sepengetahuan admin/kasir. | **SameSite Cookie & Strict Header Validation**: Server memverifikasi origin dan header request. |
| **DDoS & Traffic Spikes** | Lonjakan lalu lintas palsu yang merubuhkan server Hostinger. | **Hostinger WAF & Integrasi Cloudflare**: Firewall tingkat DNS & IP filtering. |
| **Unpermitted Data Reset** | Perintisan ulang database oleh pihak tidak berwenang. | **Role-Based Access Control (RBAC)**: Hanya `Admin Yayasan` yang memiliki otorisasi penuh, dilindungi modal konfirmasi ganda. |

---

## 🔐 2. Arsitektur Keamanan Bertingkat (Defense in Depth)

```
[ Internet / User Request ]
       │
       ▼ (1. HTTPS / SSL Encryption 256-bit)
[ Cloudflare / Hostinger Firewall (WAF) ] ➔ Anti-DDoS, IP Reputation Check
       │
       ▼ (2. Express Server Proxy on Port 3000)
[ Security Middleware & Input Validation ] ➔ Sanitize Data & Limit Payload Size
       │
       ▼ (3. Role-Based Authorization Guard)
[ Application Logic & Audit Trail Logger ] ➔ Log IP, User-Agent, & Action Timestamp
       │
       ▼ (4. Prepared Statements Engine)
[ MySQL Database (Hostinger Managed) ] ➔ Isolated Table `app_state` (Localhost Only)
```

---

## 🛡️ 3. Langkah-Langkah Konfigurasi Keamanan Anti-Hack di Hostinger

### **Langkah A: Aktifkan SSL / HTTPS Gratis (WAJIB)**
1. Masuk ke **Hostinger hPanel** -> **SSL**.
2. Klik **Install SSL** pada domain/subdomain PonpesQU Anda.
3. Aktifkan fitur **Force HTTPS** (Otomatis mengalihkan `http://` ke `https://` yang terenkripsi).
4. *Hasil*: Seluruh kata sandi, transaksi saku, dan data santri dienkripsi saat transit (*Encryption in Transit*).

### **Langkah B: Batasi Akses Remote MySQL (Localhost Only)**
1. Di **hPanel** -> **MySQL Databases**, pastikan opsi **Remote MySQL** berada dalam kondisi **Disabled** atau hanya mengizinkan `127.0.0.1` / `localhost`.
2. Jangan pernah membuka port MySQL (`3306`) ke publik (`0.0.0.0/0`).
3. *Hasil*: Peretas tidak dapat mencoba login langsung ke MySQL Hostinger Anda dari luar server.

### **Langkah C: Amankan File `.env` & Jangan Pernah Upload Password**
1. File `.env` asli berisi kredensial MySQL disimpan secara lokal di server Hostinger.
2. File `.gitignore` kami telah dikonfigurasi secara otomatis untuk mengabaikan `.env` dan `db.json`:
   ```gitignore
   node_modules
   dist
   *.log
   .env*
   !.env.example
   db.json
   ```
3. Jangan pernah melakukan commit password asli ke GitHub atau GitLab.

### **Langkah D: Integrasi Cloudflare (Opsional Namun Sangat Direkomendasikan)**
1. Hubungkan domain PonpesQU ke **Cloudflare Free Tier**.
2. Aktifkan **Bot Fight Mode** dan **Auto Minify**.
3. Atur **Security Level** ke *Medium* atau *High*.
4. *Hasil*: Menolak bot peretas otomatis, pemindai kerentanan (*vulnerability scanners*), dan serangan DoS sebelum mencapai server Hostinger Anda.

---

## 📋 4. Fitur Audit Log & Monitoring Keamanan Real-Time

Aplikasi PonpesQU dilengkapi dengan sistem pencatatan aktivitas otomatis di backend (`server.ts`):

1. **Jejak Audit Login (`/api/login-log`)**:
   - Mencatat **Username**, **Peran (Role)**, **Tanggal & Jam**, **IP Address Client**, serta **Browser/Device Info**.
   - Admin Yayasan dapat meninjau siapa saja yang telah mengakses sistem dari panel kontrol.
2. **Histori Transaksi Keuangan**:
   - Setiap setoran tabungan, penarikan saku, belanja di kantin, dan pembayaran syahriah dicatat dengan token transaksi unik beserta ID Operator Kasir.

---

## 🔒 5. Checklist Pengujian Keamanan (Security Hardening Checklist)

Sebelum merilis PonpesQU ke seluruh pengurus pesantren dan wali santri, pastikan checklist berikut terpenuhi:

- [x] **Database Persistensi MySQL**: Menggunakan kueri aman (*Prepared Statements*) tanpa penggabungan string manual.
- [x] **File Sensitif Terisolasi**: `.env` dan `db.json` telah dimasukkan ke `.gitignore`.
- [x] **Sertifikat SSL/HTTPS**: Terpasang dan aktif di domain Hostinger.
- [x] **Password Pengguna Robust**: Ganti seluruh password default (`ridwan123`, `123456`) di menu **Manajemen User** setelah deploy.
- [x] **Akses Remote MySQL Dibatasi**: Hanya mengizinkan koneksi dari `localhost`.
- [x] **Payload Size Guard**: Server membatasi ukuran request maksimum untuk mencegah pencurian memori server.

---
*Blueprint Keamanan & Anti-Hack PonpesQU - Panduan Resmi Proteksi Sistem Informasi Pesantren*
