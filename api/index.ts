import express from "express";

const app = express();
app.use(express.json());

const DEFAULT_K_DB = {
  kas_market: 1250000,
  kas_yayasan: 5800000,
  santri: [
    { id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", kelas: "7A - Salafiyah", barcode: "SNT992211", saldo_utama: 150000, nama_wali: "Bpk. Slamet", wa_wali: "6281234567890", limit_jajan: 25000, limit_belanja: 50000, foto_profil: "", username: "rayhan", pass: "123456" },
    { id_santri: "SNT-002", nama_santri: "Zulfa Azzahra", kelas: "8B - Tahfidz", barcode: "SNT883311", saldo_utama: 320000, nama_wali: "Ibu Aminah", wa_wali: "6285711223344", limit_jajan: 30000, limit_belanja: 60000, foto_profil: "", username: "zulfa", pass: "123456" },
    { id_santri: "SNT-003", nama_santri: "M. Farhan Al-Ghifari", kelas: "9A - Aliyah", barcode: "SNT774411", saldo_utama: 12000, nama_wali: "Bpk. Jaka", wa_wali: "6281987654321", limit_jajan: 20000, limit_belanja: 40000, foto_profil: "", username: "farhan", pass: "123456" }
  ],
  keluhan: [
    { id_keluhan: "KLH-001", nama_wali: "Bpk. Slamet", isi: "Mohon agar sabun mandi santri dipantau terus ketersediaannya di koperasi.", status: "BARU", jawaban: "" }
  ],
  laporan_perkembangan: [
    { id_laporan: "REP-001", tanggal: "2026-07-10", pengirim: "Ustadz Ahmad", tipe: "Individu", sasaran: "Ahmad Rayhan", subjek: "Kelancaran Setoran Baru", isi: "Alhamdulillah, Ahmad hari ini sangat lancar menyetorkan hafalan Juz 6.", status: "AKTIF" }
  ],
  asatidzah_kontak: [
    { id_guru: "GUR-001", nama: "Ustadz Ahmad", jabatan: "Tahfidz", no_wa: "628571234567", alamat: "Ujung Berung, Bandung", username: "ahmad.tahfidz", pass: "ahmad123", foto_profil: "" },
    { id_guru: "GUR-002", nama: "Ustadz Yusuf", jabatan: "Bahasa Arab", no_wa: "628587654321", alamat: "Cibiru, Bandung", username: "yusuf.bahasa", pass: "yusuf123", foto_profil: "" }
  ],
  kelas_list: [
    { id_kelas: "KLS-001", nama_kelas: "7A - Salafiyah", wali_kelas: "Ustadz Yusuf" },
    { id_kelas: "KLS-002", nama_kelas: "8B - Tahfidz", wali_kelas: "Ustadz Ahmad" },
    { id_kelas: "KLS-003", nama_kelas: "9A - Aliyah", wali_kelas: "Ustadz Yusuf" }
  ],
  sholat_rules: [
    { id_sholat: "SLT-001", nama: "Sholat SUBUH", tipe: "WAJIB", waktu: "04:35", toleransi: 15 },
    { id_sholat: "SLT-002", nama: "Sholat DZUHUR", tipe: "WAJIB", waktu: "12:05", toleransi: 15 },
    { id_sholat: "SLT-003", nama: "Sholat ASHAR", tipe: "WAJIB", waktu: "15:25", toleransi: 15 }
  ],
  users_manajemen: [
    { id_user: "USR-001", nama: "Ust. H. Ridwan", role: "Admin Yayasan", email: "ridwan@ponpesqu.com", username: "ridwan", pass: "ridwan123", wa_number: "62812345678" },
    { id_user: "USR-002", nama: "Ust. M. Jafar", role: "Admin Tabungan", email: "jafar@ponpesqu.com", username: "jafar", pass: "jafar123", wa_number: "62856789012" },
    { id_user: "USR-003", nama: "Ust. Ahmad", role: "Pengajar", email: "ahmad@ponpesqu.com", username: "ahmad", pass: "ahmad123", wa_number: "628571234567" },
    { id_user: "USR-004", nama: "Ummi Halimah", role: "Admin Market", email: "halimah@ponpesqu.com", username: "halimah", pass: "halimah123", wa_number: "628511223344" },
    { id_user: "USR-005", nama: "Ust. Syakir", role: "Admin Keamanan", email: "syakir@ponpesqu.com", username: "keamanan", pass: "keamanan123", wa_number: "628522334455" },
    { id_user: "USR-006", nama: "Sdr. Fatih", role: "Admin Media", email: "fatih@ponpesqu.com", username: "media", pass: "media123", wa_number: "628533445566" }
  ],
  yayasan_kas_logs: [],
  market_kas_logs: [],
  transaksi_tabungan: [],
  tagihan: [],
  settings: {
    shop_name: "Koperasi Pesantren Darul Ma'arif",
    owner_name: "Kiai M. Hasan",
    address: "Bandung, Jawa Barat",
    phone: "6281234567890",
    bank_name: "BSI",
    bank_account: "7144028990",
    bank_owner: "YAYASAN DARUL MA'ARIF PONPESQU",
    logo_url: "",
    nama_pesantren: "PONPESQU"
  },
  absensi_kelas: [],
  absensi_sholat: [],
  perizinan: [],
  tutup_absen_kelas: {},
  tutup_absen_sholat: {},
  produk_market: [],
  login_logs: []
};

app.get("/api/db", (_req, res) => {
  res.json(DEFAULT_K_DB);
});

app.post("/api/db", (req, res) => {
  res.json({ success: true, db: req.body });
});

export default app;
