# 🚀 Panduan Deploy PonpesQU ke Vercel (Penyimpanan Cloud Database Permanen)

Panduan ini menjelaskan cara melakukan **deploy aplikasi PonpesQU ke Vercel** secara **100% GRATIS** dengan **Firebase Cloud Database** terintegrasi, sehingga **data tidak akan pernah hilang saat Vercel tidur (sleep) / restart**.

---

## 💡 Mengapa Data Dijamin Permanen & Tidak Akan Hilang?

1. **Firebase Firestore Cloud Database Terintegrasi**:
   - Sistem PonpesQU kini sudah terhubung ke **Firebase Cloud Firestore**.
   - Setiap kali Anda menambah santri, mencatat transaksi, atau mengubah data, data tersebut **langsung tersimpan otomatis ke Cloud Server Firebase**.
   - Saat Vercel mengalami *cold start*, tidur (sleep), atau di-access dari HP/Laptop lain, data akan **otomatis tersinkronisasi secara real-time** dari Cloud Firebase.

2. **Penyimpanan Ganda (Cloud + LocalStorage Browser)**:
   - Selain tersimpan di Cloud Firebase, data juga disimpan di `localStorage` browser pengguna sebagai cadangan offline instan.

3. **Fitur Backup & Restore JSON (Cadangan Fisik)**:
   - Aplikasi dilengkapi dengan tombol **Backup JSON** dan **Restore JSON** di bagian header. Anda bisa mengunduh file `.json` cadangan kapan saja.

---

## 🛠️ Cara Deploy ke Vercel (3 Langkah Mudah)

### Langkah 1: Push Kode Proyek ke GitHub
1. Buat repository baru di [GitHub.com](https://github.com).
2. Upload atau *push* seluruh file proyek PonpesQU ini ke repository tersebut.

### Langkah 2: Hubungkan ke Vercel
1. Buka [Vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New"** -> **"Project"**.
3. Pilih repository `PonpesQU` yang baru dibuat.

### Langkah 3: Deploy
1. Pada bagian **Framework Preset**, Vercel akan otomatis mendeteksi **Vite**.
2. Klik tombol **"Deploy"**.
3. Tunggu proses build selesai (sekitar 1-2 menit).
4. Selesai! Aplikasi PonpesQU Anda sudah live online dengan URL Vercel (contoh: `https://ponpesqu.vercel.app`).

---

## 🌐 Menghubungkan Domain Sendiri (.com / .sch.id)

1. Di Dashboard Vercel, masuk ke **Settings** -> **Domains**.
2. Masukkan nama domain pesantren Anda (misal: `ponpesqu.sch.id`).
3. Ikuti petunjuk DNS CNAME / A Record di registrar domain Anda.
4. SSL/HTTPS otomatis aktif secara gratis!

