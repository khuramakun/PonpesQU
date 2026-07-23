import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { K_DB, Keluhan, UserManajemen, IzinPulang } from '../types';
import { LucideIcon } from './LucideIcon';
import { PanduanHostingModal } from './PanduanHostingModal';
import { compressImageFile } from '../utils/imageCompressor';

interface KiaiPanelProps {
  db: K_DB;
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, callback: (yes: boolean) => void) => void;
  resetDatabase: () => Promise<void>;
}

export function KiaiPanel({
  db,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  resetDatabase
}: KiaiPanelProps) {
  // Local modal states
  const [isHostingModalOpen, setIsHostingModalOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Keluhan | null>(null);
  const [replyText, setReplyText] = useState("");
  const [complaintFilter, setComplaintFilter] = useState<'ALL' | 'BARU' | 'SELESAI'>('ALL');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nama: "",
    email: "",
    username: "",
    pass: "",
    role: "Admin Yayasan" as any,
    wa_number: ""
  });

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManajemen | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    shop_name: db.settings.shop_name,
    owner_name: db.settings.owner_name,
    bank_name: db.settings.bank_name,
    bank_account: db.settings.bank_account,
    bank_owner: db.settings.bank_owner,
    nama_pesantren: db.settings.nama_pesantren || "PONPESQU",
    kiai_pass: db.settings.kiai_pass || "abah123"
  });

  // Monitoring Izin Pulang Santri state
  const [searchIzinPulangKiai, setSearchIzinPulangKiai] = useState("");
  const [filterIzinPulangKiai, setFilterIzinPulangKiai] = useState<'ALL' | 'DISETUJUI' | 'KEMBALI'>('DISETUJUI');

  const handlePrintSuratIzinPulangKiai = (item: IzinPulang) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>SURAT IZIN PULANG & SLIP KEMBALI - ${item.nama_santri}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Times New Roman', Times, serif; padding: 10px; color: #000; max-width: 800px; margin: 0 auto; line-height: 1.3; }
            .sheet { border: 1px solid #000; padding: 18px; margin-bottom: 20px; background: #fff; }
            .sheet-tag-bar { text-align: right; margin-bottom: 6px; }
            .sheet-tag { font-size: 10px; font-weight: bold; font-family: monospace; border: 1px solid #000; padding: 2px 8px; background: #f8fafc; color: #000; text-transform: uppercase; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
            .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header h3 { margin: 2px 0; font-size: 12px; font-weight: normal; }
            .header p { margin: 0; font-size: 10px; font-style: italic; color: #333; }
            .title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 10px 0 4px 0; text-transform: uppercase; }
            .doc-num { text-align: center; font-size: 11px; margin-bottom: 12px; font-family: monospace; }
            table.info { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
            table.info td { padding: 4px 6px; vertical-align: top; }
            .badge { display: inline-block; padding: 2px 8px; border: 1px solid #000; font-weight: bold; font-size: 11px; background: #f0f0f0; }
            .rules { border: 1px dashed #000; padding: 8px 12px; font-size: 10px; margin-top: 10px; background: #fafafa; }
            .signatures { margin-top: 20px; width: 100%; display: table; }
            .sig-col-4 { display: table-cell; width: 25%; text-align: center; font-size: 10px; vertical-align: top; }
            .sig-col-2 { display: table-cell; width: 50%; text-align: center; font-size: 11px; vertical-align: top; }
            .sig-space { height: 45px; }
            .cut-line { text-align: center; margin: 16px 0; border-top: 2px dashed #000; position: relative; }
            .cut-label { position: relative; top: -11px; background: #fff; padding: 0 12px; font-size: 10px; font-family: monospace; font-weight: bold; }
          </style>
        </head>
        <body>
          <!-- LEMBAR 1: PEGANGAN SANTRI / WALI -->
          <div class="sheet">
            <div class="sheet-tag-bar">
              <span class="sheet-tag">[ LEMBAR 1 : PEGANGAN SANTRI / WALI ]</span>
            </div>
            <div class="header">
              <h2>POS KEAMANAN & KEDISIPLINAN SANTRI</h2>
              <h3>PONDOK PESANTREN AL-HIDAYAH / PONPESQU</h3>
              <p>JL. Pesantren No. 01, Jembrana, Bali • Telp: +62 852-2334-4555</p>
            </div>

            <div class="title">SURAT IZIN PULANG SANTRI (SURAT JALAN)</div>
            <div class="doc-num">No. Dokumen: ${item.id_izin_pulang}</div>

            <table class="info">
              <tr>
                <td width="28%"><strong>Nama Santri</strong></td>
                <td width="4%">:</td>
                <td width="68%"><strong>${item.nama_santri}</strong></td>
              </tr>
              <tr>
                <td><strong>Kelas / Asrama</strong></td>
                <td>:</td>
                <td>${item.kelas}</td>
              </tr>
              <tr>
                <td><strong>Tanggal Keluar</strong></td>
                <td>:</td>
                <td><strong>${item.tanggal_keluar}</strong></td>
              </tr>
              <tr>
                <td><strong>Batas Tiba Kembali</strong></td>
                <td>:</td>
                <td><strong style="color: #991b1b; text-decoration: underline;">${item.tanggal_kembali}</strong></td>
              </tr>
              <tr>
                <td><strong>Alasan / Keperluan</strong></td>
                <td>:</td>
                <td>${item.alasan}</td>
              </tr>
              <tr>
                <td><strong>Penjemput / Wali</strong></td>
                <td>:</td>
                <td>${item.penjemput || 'Wali Santri'}</td>
              </tr>
              <tr>
                <td><strong>Petugas Penerbit</strong></td>
                <td>:</td>
                <td>${item.dicatat_oleh}</td>
              </tr>
            </table>

            <div class="rules">
              <strong>KETENTUAN UTAMA:</strong>
              <ol style="margin: 3px 0 0 15px; padding: 0;">
                <li>Surat ini dibawa selama di jalan dan ditunjukkan kepada petugas saat keluar gerbang.</li>
                <li>Santri WAJIB kembali paling lambat tanggal <strong>${item.tanggal_kembali}</strong>.</li>
                <li>Setiba di pondok, serahkan <strong>LEMBAR 2 (Slip Konfirmasi Kembali)</strong> ke Pos Keamanan.</li>
              </ol>
            </div>

            <div class="signatures">
              <div class="sig-col-4">
                Wali / Penjemput,<br>
                <div class="sig-space"></div>
                ( <strong>${item.penjemput || 'Wali Santri'}</strong> )
              </div>
              <div class="sig-col-4">
                Santri Bersangkutan,<br>
                <div class="sig-space"></div>
                ( <strong>${item.nama_santri}</strong> )
              </div>
              <div class="sig-col-4">
                Petugas Keamanan,<br>
                <div class="sig-space"></div>
                ( <strong>${item.dicatat_oleh}</strong> )
              </div>
              <div class="sig-col-4">
                Mengetahui,<br>
                <strong>Pengasuh / Kiai</strong><br>
                <div class="sig-space"></div>
                ( <strong>${db.settings?.owner_name || 'KH. Achmad Hidayatullah'}</strong> )
              </div>
            </div>
          </div>

          <!-- GARIS POTONG -->
          <div class="cut-line">
            <span class="cut-label">✂ POTONG DI SINI — DISERAHKAN KE POS KEAMANAN SAAT SANTRI TIBA KEMBALI ✂</span>
          </div>

          <!-- LEMBAR 2: BUKTI KEMBALI UNTUK POS KEAMANAN -->
          <div class="sheet" style="background: #fafafa;">
            <div class="sheet-tag-bar">
              <span class="sheet-tag">[ LEMBAR 2 : SLIP SERAH TERIMA KEMBALI - POS KEAMANAN ]</span>
            </div>
            <div class="header" style="border-bottom-style: dashed;">
              <h2>POS KEAMANAN & KEDISIPLINAN SANTRI</h2>
              <h3>SLIP BUKTI KONFIRMASI KEMBALI KE PONDOK</h3>
            </div>

            <div class="doc-num">No. Ref Izin: ${item.id_izin_pulang}</div>

            <p style="font-size: 10px; margin-bottom: 8px; background: #fff; padding: 5px; border: 1px solid #ddd;">
              ⚠️ <strong>Mencegah Santri Lupa Lapor:</strong> Slip ini WAJIB diserahkan oleh Santri/Wali langsung ke Pos Keamanan saat tiba kembali di lingkungan Pondok Pesantren untuk diverifikasi dan di-input status <strong>KEMBALI</strong> pada sistem.
            </p>

            <table class="info">
              <tr>
                <td width="30%"><strong>Nama Santri</strong></td>
                <td width="5%">:</td>
                <td width="65%"><strong>${item.nama_santri}</strong> (${item.kelas})</td>
              </tr>
              <tr>
                <td><strong>Jadwal Rencana Tiba</strong></td>
                <td>:</td>
                <td><strong>${item.tanggal_kembali}</strong></td>
              </tr>
              <tr>
                <td><strong>Tanggal Realisasi Tiba</strong></td>
                <td>:</td>
                <td>[ ..... / ..... / 2026 ] &nbsp; Jam: [ ..... : ..... WITA/WIB ]</td>
              </tr>
              <tr>
                <td><strong>Catatan Keamanan</strong></td>
                <td>:</td>
                <td>( &nbsp; ) Tepat Waktu &nbsp;&nbsp;&nbsp; ( &nbsp; ) Terlambat (Alasan: ...........................................)</td>
              </tr>
            </table>

            <div class="signatures">
              <div class="sig-col-2">
                Santri Yang Kembali,<br>
                <div class="sig-space"></div>
                ( <strong>${item.nama_santri}</strong> )
              </div>
              <div class="sig-col-2">
                Petugas Keamanan Penerima,<br>
                <div class="sig-space"></div>
                ( <strong>${item.dicatat_oleh}</strong> )
              </div>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Local state for clearing history
  const [clearGeneralStart, setClearGeneralStart] = useState("");
  const [clearGeneralEnd, setClearGeneralEnd] = useState("");
  const [clearViolationsStart, setClearViolationsStart] = useState("");
  const [clearViolationsEnd, setClearViolationsEnd] = useState("");

  const handleClearGeneralHistory = async () => {
    const rangeDesc = (clearGeneralStart || clearGeneralEnd)
      ? `periode ${clearGeneralStart || 'Awal'} s/d ${clearGeneralEnd || 'Akhir'}`
      : "Seluruh Periode";

    showConfirm(`⚠️ PERINGATAN KUNING: Apakah Abah yakin ingin menghapus semua riwayat (transaksi market/tabungan, laporan perkembangan, izin belanja/jajan, absensi sholat & kelas, aspirasi/keluhan wali, riwayat sesi login, serta log kas) untuk ${rangeDesc}? Tindakan ini permanen!`, async (yes) => {
      if (yes) {
        const filterFn = (dateStr: string) => {
          if (!dateStr) return false;
          const d = dateStr.slice(0, 10);
          const matchesStart = clearGeneralStart ? d >= clearGeneralStart : true;
          const matchesEnd = clearGeneralEnd ? d <= clearGeneralEnd : true;
          return matchesStart && matchesEnd;
        };

        const updatedDb: K_DB = {
          ...db,
          transaksi_market: (db.transaksi_market || []).filter(tx => !filterFn(tx.tanggal)),
          transaksi_tabungan: (db.transaksi_tabungan || []).filter(tx => !filterFn(tx.tanggal)),
          laporan_perkembangan: (db.laporan_perkembangan || []).filter(rep => !filterFn(rep.tanggal)),
          izin_keamanan: (db.izin_keamanan || []).filter(i => !filterFn(i.tanggal)),
          absensi_kelas: (db.absensi_kelas || []).filter(a => !filterFn(a.tanggal)),
          absensi_sholat: (db.absensi_sholat || []).filter(a => !filterFn(a.tanggal)),
          yayasan_kas_logs: (db.yayasan_kas_logs || []).filter(log => !filterFn(log.tanggal)),
          market_kas_logs: (db.market_kas_logs || []).filter(log => !filterFn(log.tanggal)),
          keluhan: (db.keluhan || []).filter(c => {
            if (c.tanggal) {
              return !filterFn(c.tanggal);
            }
            return !(!clearGeneralStart && !clearGeneralEnd);
          }),
          login_logs: (db.login_logs || []).filter(log => !filterFn(log.tanggal)),
        };

        await syncDbState(updatedDb);
        showToast("Semua riwayat transaksi dan aktivitas berhasil dibersihkan!", "success");
        setClearGeneralStart("");
        setClearGeneralEnd("");
      }
    });
  };

  const handleClearViolationsHistory = async () => {
    const rangeDesc = (clearViolationsStart || clearViolationsEnd)
      ? `periode ${clearViolationsStart || 'Awal'} s/d ${clearViolationsEnd || 'Akhir'}`
      : "Seluruh Periode";

    showConfirm(`⚠️ PERINGATAN KUNING: Apakah Abah yakin ingin menghapus catatan pelanggaran santri untuk ${rangeDesc}? Catatan kedisiplinan & hukuman ini akan dihapus permanen!`, async (yes) => {
      if (yes) {
        const filterFn = (dateStr: string) => {
          if (!dateStr) return false;
          const d = dateStr.slice(0, 10);
          const matchesStart = clearViolationsStart ? d >= clearViolationsStart : true;
          const matchesEnd = clearViolationsEnd ? d <= clearViolationsEnd : true;
          return matchesStart && matchesEnd;
        };

        const updatedDb: K_DB = {
          ...db,
          pelanggaran_santri: (db.pelanggaran_santri || []).filter(v => !filterFn(v.tanggal)),
        };

        await syncDbState(updatedDb);
        showToast("Catatan pelanggaran santri berhasil dibersihkan!", "success");
        setClearViolationsStart("");
        setClearViolationsEnd("");
      }
    });
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const copyBankAccount = () => {
    const accountNum = db.settings.bank_account || "7144028990";
    navigator.clipboard.writeText(accountNum);
    showToast(`Nomor Rekening ${accountNum} disalin ke clipboard!`, "success");
  };

  // Reply to complaint
  const openReply = (klh: Keluhan) => {
    setSelectedComplaint(klh);
    setReplyText("");
    setIsReplyOpen(true);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const updatedKeluhan = db.keluhan.map(c => {
      if (c.id_keluhan === selectedComplaint.id_keluhan) {
        return { ...c, status: "SELESAI" as const, jawaban: replyText };
      }
      return c;
    });

    await syncDbState({
      ...db,
      keluhan: updatedKeluhan
    });

    setIsReplyOpen(false);
    setSelectedComplaint(null);
    showToast("Tanggapan Abah Kiai berhasil dikirimkan!", "success");
  };

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameClean = newUser.username.trim().toLowerCase();
    
    const isDuplicate = db.users_manajemen.some(u => u.username.toLowerCase() === usernameClean) || usernameClean === "kiai";
    if (isDuplicate) {
      showToast("ID Pengguna (username) sudah digunakan!", "error");
      return;
    }

    const created: UserManajemen = {
      id_user: "USR-0" + (db.users_manajemen.length + 1),
      nama: newUser.nama.trim(),
      email: newUser.email.trim(),
      username: usernameClean,
      pass: newUser.pass,
      role: newUser.role,
      wa_number: newUser.wa_number.trim()
    };

    await syncDbState({
      ...db,
      users_manajemen: [...db.users_manajemen, created]
    });

    setIsAddUserOpen(false);
    setNewUser({
      nama: "",
      email: "",
      username: "",
      pass: "",
      role: "Admin Yayasan",
      wa_number: ""
    });
    showToast(`User baru "${created.nama}" sukses dibuat!`, "success");
  };

  const updateUserRole = async (index: number, newRole: any) => {
    const updatedUsers = [...db.users_manajemen];
    updatedUsers[index] = { ...updatedUsers[index], role: newRole };

    await syncDbState({
      ...db,
      users_manajemen: updatedUsers
    });
    showToast(`Otoritas diubah menjadi: ${newRole}`, "success");
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const usernameClean = editingUser.username.trim().toLowerCase();
    
    const isDuplicate = db.users_manajemen.some(u => u.username.toLowerCase() === usernameClean && u.id_user !== editingUser.id_user) || usernameClean === "kiai";
    if (isDuplicate) {
      showToast("ID Pengguna (username) sudah digunakan!", "error");
      return;
    }

    const updatedUsers = db.users_manajemen.map(u => {
      if (u.id_user === editingUser.id_user) {
        return {
          ...editingUser,
          nama: editingUser.nama.trim(),
          email: editingUser.email.trim(),
          username: usernameClean,
          wa_number: editingUser.wa_number?.trim() || ""
        };
      }
      return u;
    });

    await syncDbState({
      ...db,
      users_manajemen: updatedUsers
    });

    setIsEditUserOpen(false);
    setEditingUser(null);
    showToast(`User "${editingUser.nama}" sukses diperbarui!`, "success");
  };

  const handleDeleteUser = async (id_user: string, nama: string) => {
    showConfirm(`Apakah Abah yakin ingin menghapus pengguna "${nama}" dari sistem? Tindakan ini permanen!`, async (yes) => {
      if (yes) {
        const updatedUsers = db.users_manajemen.filter(u => u.id_user !== id_user);
        await syncDbState({
          ...db,
          users_manajemen: updatedUsers
        });
        showToast(`User "${nama}" berhasil dihapus!`, "success");
      }
    });
  };

  // Save Settings
  const saveSettings = async () => {
    await syncDbState({
      ...db,
      settings: {
        ...db.settings,
        ...settingsForm
      }
    });
    showToast("Konfigurasi Pesantren berhasil disimpan!", "success");
  };

  // Upload Logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 250, 0.6);
      await syncDbState({
        ...db,
        settings: {
          ...db.settings,
          logo_url: compressed
        }
      });
      showToast("Logo pesantren berhasil diperbarui & dioptimasi!", "success");
    } catch (e) {
      showToast("Gagal memproses logo pesantren", "error");
    }
  };

  // --- UNDUH SELURUH DATA SISTEM (EXCEL .XLSX BACKUP) ---
  const handleDownloadFullExcelBackup = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Sheet Data Santri
      const santriData = (db.santri || []).map(s => ({
        "NIS": s.id_santri || "",
        "Nama Santri": s.nama_santri || "",
        "Kelas": s.kelas || "",
        "Alamat": s.alamat || "",
        "Wali Santri": s.nama_wali || "",
        "No. WA Wali": s.wa_wali || "",
        "Saldo Utama Saku (Rp)": s.saldo_utama || 0,
        "Limit Jajan Harian (Rp)": s.limit_jajan || 0,
        "Limit Belanja Market (Rp)": s.limit_belanja || 0,
        "Kode Barcode": s.barcode || ""
      }));
      const wsSantri = XLSX.utils.json_to_sheet(santriData.length ? santriData : [{ Info: "Belum Ada Data Santri" }]);
      XLSX.utils.book_append_sheet(workbook, wsSantri, "Data Santri");

      // 2. Sheet Tagihan & Pembayaran SPP
      const tagihanData = (db.tagihan || []).map(t => ({
        "ID Tagihan": t.id_tagihan || "",
        "NIS": t.id_santri || "",
        "Nama Santri": t.nama_santri || "",
        "Kelas": t.kelas || "",
        "Nama Tagihan": t.nama_tagihan || "",
        "Nominal (Rp)": t.nominal || 0,
        "Status Tagihan": t.status_tagihan || "",
        "Metode Pembayaran": t.metode_pembayaran || "-",
        "Tanggal Bayar": t.tanggal_bayar || "-"
      }));
      const wsTagihan = XLSX.utils.json_to_sheet(tagihanData.length ? tagihanData : [{ Info: "Belum Ada Data Tagihan" }]);
      XLSX.utils.book_append_sheet(workbook, wsTagihan, "Tagihan SPP");

      // 3. Sheet Katalog Koperasi / Market
      const produkData = (db.produk_market || []).map(p => ({
        "ID Produk": p.id_produk || "",
        "Kode Barcode": p.barcode || "",
        "Nama Produk": p.nama_produk || "",
        "Kategori": p.kategori || "",
        "Harga Modal (Rp)": p.harga_beli || 0,
        "Harga Jual (Rp)": p.harga_jual || 0,
        "Stok Saat Ini": p.stok || 0,
        "Satuan": p.satuan || "pcs"
      }));
      const wsProduk = XLSX.utils.json_to_sheet(produkData.length ? produkData : [{ Info: "Belum Ada Katalog Produk" }]);
      XLSX.utils.book_append_sheet(workbook, wsProduk, "Katalog Koperasi");

      // 4. Sheet Transaksi Market (Kasir)
      const transaksiMarketData = (db.transaksi_market || []).map(tm => ({
        "ID Transaksi": tm.id_transaksi || "",
        "Waktu / Tanggal": tm.tanggal || "",
        "NIS Santri": tm.id_santri || "-",
        "Nama Pembeli": tm.nama_santri || "Umum",
        "Total Belanja (Rp)": tm.total || 0,
        "Kas Masuk (Rp)": tm.kas_masuk || 0,
        "Metode Bayar": tm.metode_pembayaran || "TUNAI",
        "Rincian Barang": (tm.items || []).map(i => `${i.nama_produk || 'Produk'} (x${i.qty})`).join("; ")
      }));
      const wsMarket = XLSX.utils.json_to_sheet(transaksiMarketData.length ? transaksiMarketData : [{ Info: "Belum Ada Transaksi Market" }]);
      XLSX.utils.book_append_sheet(workbook, wsMarket, "Transaksi Market");

      // 5. Sheet Mutasi Tabungan & Uang Saku
      const mutasiTabunganData = (db.transaksi_tabungan || []).map(tt => ({
        "ID Mutasi": tt.id_transaksi || "",
        "Tanggal / Waktu": tt.tanggal || "",
        "NIS": tt.id_santri || "",
        "Nama Santri": tt.nama_santri || "",
        "Kelas": tt.kelas || "",
        "Tipe Mutasi": tt.tipe || "",
        "Nominal (Rp)": tt.nominal || 0,
        "Keterangan": tt.keterangan || ""
      }));
      const wsTabungan = XLSX.utils.json_to_sheet(mutasiTabunganData.length ? mutasiTabunganData : [{ Info: "Belum Ada Mutasi Tabungan" }]);
      XLSX.utils.book_append_sheet(workbook, wsTabungan, "Mutasi Tabungan");

      // 6. Sheet Perizinan & Absensi
      const izinData = (db.izin_pulang || []).map(iz => ({
        "ID Perizinan": iz.id_izin_pulang || "",
        "NIS": iz.id_santri || "",
        "Nama Santri": iz.nama_santri || "",
        "Kelas": iz.kelas || "",
        "Alasan Izin": iz.alasan || "",
        "Tanggal Keluar": iz.tanggal_keluar || "",
        "Rencana Kembali": iz.tanggal_kembali || "",
        "Penjemput": iz.penjemput || "-",
        "Status": iz.status || "",
        "Dicatat Oleh": iz.dicatat_oleh || ""
      }));
      const wsIzin = XLSX.utils.json_to_sheet(izinData.length ? izinData : [{ Info: "Belum Ada Data Izin Pulang" }]);
      XLSX.utils.book_append_sheet(workbook, wsIzin, "Perizinan Santri");

      // 7. Sheet Kedisiplinan & Pelanggaran
      const pelanggaranData = (db.pelanggaran_santri || []).map(pl => ({
        "ID Record": pl.id_pelanggaran || "",
        "NIS": pl.id_santri || "",
        "Nama Santri": pl.nama_santri || "",
        "Kelas": pl.kelas || "",
        "Kategori Pelanggaran": pl.kategori || "",
        "Detail Pelanggaran": pl.detail_pelanggaran || "",
        "Hukuman / Tindakan": pl.hukuman || "",
        "Tanggal Kejadian": pl.tanggal || "",
        "Petugas Keamanan": pl.dicatat_oleh || ""
      }));
      const wsPelanggaran = XLSX.utils.json_to_sheet(pelanggaranData.length ? pelanggaranData : [{ Info: "Belum Ada Data Pelanggaran" }]);
      XLSX.utils.book_append_sheet(workbook, wsPelanggaran, "Kedisiplinan");

      // 8. Sheet Kas & Keuangan Yayasan
      const kasYayasanData = (db.yayasan_kas_logs || []).map(k => ({
        "Tanggal": k.tanggal || "",
        "Aliran Kas": k.tipe || "",
        "Nominal (Rp)": k.nominal || 0,
        "Keterangan": k.keterangan || "",
        "Sumber Kas": "Yayasan"
      }));
      const kasMarketData = (db.market_kas_logs || []).map(k => ({
        "Tanggal": k.tanggal || "",
        "Aliran Kas": k.tipe || "",
        "Nominal (Rp)": k.nominal || 0,
        "Keterangan": k.keterangan || "",
        "Sumber Kas": "Koperasi Market"
      }));
      const allKasData = [...kasYayasanData, ...kasMarketData];
      const wsKas = XLSX.utils.json_to_sheet(allKasData.length ? allKasData : [{ Info: "Belum Ada Catatan Kas" }]);
      XLSX.utils.book_append_sheet(workbook, wsKas, "Kas Keuangan");

      // 9. Sheet Keluhan Wali Santri
      const keluhanData = (db.keluhan || []).map(kl => ({
        "ID Keluhan": kl.id_keluhan || "",
        "Tanggal": kl.tanggal || "",
        "Wali Santri": kl.nama_wali || "",
        "Isi Pesan / Keluhan": kl.isi || "",
        "Status": kl.status || "",
        "Tanggapan Pengurus": kl.jawaban || "-"
      }));
      const wsKeluhan = XLSX.utils.json_to_sheet(keluhanData.length ? keluhanData : [{ Info: "Belum Ada Keluhan" }]);
      XLSX.utils.book_append_sheet(workbook, wsKeluhan, "Keluhan Wali");

      // 10. Sheet Pengguna & Akses Manajemen
      const usersData = (db.users_manajemen || []).map(u => ({
        "Username": u.username || "",
        "Nama Lengkap": u.nama || "",
        "Role / Otoritas": u.role || "",
        "Email": u.email || "",
        "No WA": u.wa_number || ""
      }));
      const wsUsers = XLSX.utils.json_to_sheet(usersData.length ? usersData : [{ Info: "Kosong" }]);
      XLSX.utils.book_append_sheet(workbook, wsUsers, "Akun Pengguna");

      // 11. Sheet Pengaturan Pesantren
      const settingsArray = [
        { "Parameter": "Nama Pesantren", "Nilai": db.settings.shop_name },
        { "Parameter": "Brand Singkatan", "Nilai": db.settings.nama_pesantren || "PONPESQU" },
        { "Parameter": "Kiai / Owner", "Nilai": db.settings.owner_name },
        { "Parameter": "Alamat Pesantren", "Nilai": db.settings.address },
        { "Parameter": "Alamat Koperasi", "Nilai": db.settings.koperasi_address || db.settings.address },
        { "Parameter": "WhatsApp Yayasan", "Nilai": db.settings.phone },
        { "Parameter": "Slogan Koperasi", "Nilai": db.settings.slogan || "" },
        { "Parameter": "NIB / Izin Pondok", "Nilai": db.settings.nib_number || "" },
        { "Parameter": "Bank", "Nilai": db.settings.bank_name },
        { "Parameter": "No Rekening", "Nilai": db.settings.bank_account },
        { "Parameter": "Atas Nama (A/N)", "Nilai": db.settings.bank_owner },
        { "Parameter": "Saldo Kas Yayasan (Rp)", "Nilai": db.kas_yayasan },
        { "Parameter": "Saldo Kas Koperasi (Rp)", "Nilai": db.kas_market },
        { "Parameter": "Tanggal Export", "Nilai": new Date().toLocaleString('id-ID') }
      ];
      const wsSettings = XLSX.utils.json_to_sheet(settingsArray);
      XLSX.utils.book_append_sheet(workbook, wsSettings, "Pengaturan & Kas");

      // Create workbook buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const namaPonpes = (db.settings.nama_pesantren || db.settings.shop_name || "PONPESQU").replace(/[^a-zA-Z0-9]/g, '_');
      const tgl = new Date().toISOString().split('T')[0];
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `BACKUP_LENGKAP_EXCEL_${namaPonpes}_${tgl}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Berhasil mengunduh seluruh data cadangan lengkap ke format Excel (.xlsx)!", "success");
    } catch (err) {
      console.error("Gagal export Excel:", err);
      showToast("Gagal mengunduh Excel backup: " + (err as Error).message, "error");
    }
  };

  const triggerReset = () => {
    showConfirm("🚨 PERINGATAN KERAS (MERAH): Menyetel ulang seluruh database akan menghapus SEMUA data santri, semua akun keuangan, laporan, perizinan, dan absensi pesantren! Data akan dikembalikan bersih ke setelan bawaan pabrik. Apakah Abah Kiai benar-benar yakin 100%?", async (yes) => {
      if (yes) {
        showConfirm("🚨 APAKAH BENAR-BENAR YAKIN? Sekali lagi, semua data aktif pesantren saat ini akan hilang selamanya!", async (yesAgain) => {
          if (yesAgain) {
            await resetDatabase();
          }
        });
      }
    });
  };

  if (activeTab === 'kiai-dashboard') {
    const unreadCount = db.keluhan.filter(c => c.status === "BARU").length;
    const totalSaku = db.santri.reduce((sum, s) => sum + (Number(s.saldo_utama) || 0), 0);
    const totalKas = db.kas_yayasan + db.kas_market;
    const activeIzinPulangCount = (db.izin_pulang || []).filter(i => i.status === 'DISETUJUI').length;

    const filteredIzinPulang = (db.izin_pulang || []).filter(item => {
      const q = searchIzinPulangKiai.toLowerCase();
      const matchesQ = item.nama_santri.toLowerCase().includes(q) || item.kelas.toLowerCase().includes(q) || (item.alasan || '').toLowerCase().includes(q);
      const matchesStatus = filterIzinPulangKiai === 'ALL' ? true : item.status === filterIzinPulangKiai;
      return matchesQ && matchesStatus;
    });

    return (
      <section id="tab-kiai-dashboard" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-100">Assalamualaikum, <span id="welcome-kiai-name">{db.settings.owner_name}</span></h2>
            <p className="text-xs text-emerald-500/80 mt-1">Laporan makro kondisi spiritual, akademik, dan finansial Pondok Pesantren hari ini.</p>
          </div>
          <button
            onClick={handleDownloadFullExcelBackup}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-emerald-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02] border border-emerald-300/40"
            title="Unduh Seluruh Data Sistem Pesantren Ke Excel (.xlsx)"
          >
            <LucideIcon name="file-spreadsheet" className="w-4 h-4 text-emerald-950" />
            <span>Unduh Backup Excel Data (.xlsx)</span>
          </button>
        </div>

        {/* Grid Statistik Utama */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="users" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Santri Aktif</span>
              <span className="text-lg font-bold text-gray-200 block">{db.santri.length}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <LucideIcon name="log-out" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-purple-400/80 uppercase font-semibold block">Sedang Izin Pulang</span>
              <span className="text-lg font-extrabold text-purple-300 block">{activeIzinPulangCount} Santri</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <LucideIcon name="landmark" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Kas Yayasan</span>
              <span className="text-lg font-bold text-emerald-400 block">{formatRupiah(db.kas_yayasan)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="shopping-bag" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Kas Market</span>
              <span className="text-lg font-bold text-amber-400 block">{formatRupiah(db.kas_market)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4 col-span-2 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <LucideIcon name="message-square" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Keluhan Baru</span>
              <span className="text-lg font-bold text-red-400 block">{unreadCount}</span>
            </div>
          </div>
        </div>

        {/* MONITORING SANTRI SEDANG IZIN PULANG */}
        <div className="glass-card p-5 rounded-2xl border border-purple-500/20 bg-purple-950/10 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-purple-900/30 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <LucideIcon name="door-open" className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">Monitoring Santri Izin Pulang (Kiai / Pengasuh)</h3>
              </div>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Pemantauan santri yang sedang meninggalkan pondok pesantren beserta jadwal kembali & bukti surat jalan resmi.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="flex bg-emerald-950/80 p-1 rounded-xl border border-emerald-900">
                <button
                  onClick={() => setFilterIzinPulangKiai('DISETUJUI')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterIzinPulangKiai === 'DISETUJUI'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sedang Pulang ({activeIzinPulangCount})
                </button>
                <button
                  onClick={() => setFilterIzinPulangKiai('KEMBALI')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterIzinPulangKiai === 'KEMBALI'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sudah Kembali
                </button>
                <button
                  onClick={() => setFilterIzinPulangKiai('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterIzinPulangKiai === 'ALL'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Semua History
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama / kelas / alasan..."
                  value={searchIzinPulangKiai}
                  onChange={(e) => setSearchIzinPulangKiai(e.target.value)}
                  className="bg-emerald-950/80 border border-purple-900/50 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 w-48"
                />
                <LucideIcon name="search" className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-900/40 text-[10px] uppercase tracking-wider text-purple-300/80 bg-purple-950/30">
                  <th className="p-3">Santri & Kelas</th>
                  <th className="p-3">Tanggal Keluar</th>
                  <th className="p-3">Rencana Kembali</th>
                  <th className="p-3">Alasan & Penjemput</th>
                  <th className="p-3">Petugas Keamanan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-xs">
                {filteredIzinPulang.map((item) => {
                  const isSedangPulang = item.status === 'DISETUJUI';
                  return (
                    <tr key={item.id_izin_pulang} className="hover:bg-purple-950/20 transition-colors">
                      <td className="p-3 font-semibold text-gray-100">
                        <span className="block text-white font-bold">{item.nama_santri}</span>
                        <span className="text-[10px] text-emerald-400/80 font-mono">Kelas: {item.kelas}</span>
                      </td>
                      <td className="p-3 text-gray-300 font-mono text-[11px]">{item.tanggal_keluar}</td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isSedangPulang 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'text-gray-400'
                        }`}>
                          {item.tanggal_kembali}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">
                        <span className="block font-medium">{item.alasan}</span>
                        <span className="text-[10px] text-emerald-500/70">Wali/Penjemput: {item.penjemput || 'Wali Santri'}</span>
                      </td>
                      <td className="p-3 text-gray-400 text-[11px]">{item.dicatat_oleh}</td>
                      <td className="p-3">
                        {isSedangPulang ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            SEDANG DI LUAR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ SUDAH KEMBALI
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handlePrintSuratIzinPulangKiai(item)}
                          className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700/50 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1"
                          title="Cetak Surat Izin Pulang (2 Lembar)"
                        >
                          <LucideIcon name="printer" className="w-3 h-3" />
                          <span>Surat Jalan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredIzinPulang.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500 italic text-xs">
                      Tidak ada data izin pulang santri.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Neraca Kas & Likuiditas</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-500/80">Kas Utama Yayasan</span>
                  <span className="font-bold">{formatRupiah(db.kas_yayasan)}</span>
                </div>
                <div className="w-full bg-emerald-950/50 rounded-full h-2.5 border border-emerald-900">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full" 
                    style={{ width: `${totalKas > 0 ? (db.kas_yayasan / totalKas) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-500/80">Kas Unit Koperasi (Market)</span>
                  <span className="font-bold">{formatRupiah(db.kas_market)}</span>
                </div>
                <div className="w-full bg-emerald-950/50 rounded-full h-2.5 border border-emerald-900">
                  <div 
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full" 
                    style={{ width: `${totalKas > 0 ? (db.kas_market / totalKas) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Laporan Perkembangan Terakhir</h3>
            <div className="space-y-3">
              {db.laporan_perkembangan.slice().reverse().slice(0, 3).map((rep) => (
                <div key={rep.id_laporan} className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-200 block">{rep.subjek}</span>
                    <span className="text-[10px] text-emerald-500/60 block">Oleh: {rep.pengirim}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">{rep.tipe}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-keuangan') {
    return (
      <section id="tab-kiai-keuangan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-2">Buku Besar Kas & Log Pembayaran Syahryah</h3>
          <p className="text-xs text-emerald-500/70">Histori mutasi kas terpusat yayasan, syahryah bulanan, serta setoran tunai cashless.</p>
        </div>

        <div id="bank-reference-card" className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Rekening Resmi Pembayaran Pondok</span>
            <h4 className="text-sm font-extrabold text-white mt-1">{db.settings.bank_name} - {db.settings.bank_account}</h4>
            <p className="text-xs text-emerald-500/70">A/N: {db.settings.bank_owner}</p>
          </div>
          <button onClick={copyBankAccount} className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900 text-amber-400 rounded-xl transition-all flex items-center gap-2 text-xs font-bold">
            <LucideIcon name="copy" className="w-4 h-4" />
            <span>Salin Rekening</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-emerald-950/50 pb-3">
              <h4 className="text-xs font-bold uppercase text-emerald-400">Kas Operasional Yayasan</h4>
              <span className="text-sm font-extrabold text-white">{formatRupiah(db.kas_yayasan)}</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              {db.yayasan_kas_logs.slice().reverse().slice(0, 5).map((log, index) => (
                <div key={index} className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/50 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-gray-200 block">{log.keterangan}</strong>
                    <span className="text-[9px] text-emerald-500/50">{log.tanggal}</span>
                  </div>
                  <span className={`font-bold ${log.tipe === "MASUK" ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.tipe === "MASUK" ? "+" : "-"} {formatRupiah(log.nominal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-emerald-950/50 pb-3">
              <h4 className="text-xs font-bold uppercase text-amber-400">Kas Unit Market / Koperasi</h4>
              <span className="text-sm font-extrabold text-white">{formatRupiah(db.kas_market)}</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              {db.market_kas_logs.slice().reverse().slice(0, 5).map((log, index) => (
                <div key={index} className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/50 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-gray-200 block">{log.keterangan}</strong>
                    <span className="text-[9px] text-emerald-500/50">{log.tanggal}</span>
                  </div>
                  <span className={`font-bold ${log.tipe === "MASUK" ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.tipe === "MASUK" ? "+" : "-"} {formatRupiah(log.nominal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-perkembangan') {
    const allViolations = (db.pelanggaran_santri || []).slice().reverse();
    const allAllowances = (db.izin_keamanan || []).slice().reverse();

    return (
      <section id="tab-kiai-perkembangan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-2">Laporan Perkembangan, Kedisiplinan & Dispensasi Santri</h3>
          <p className="text-xs text-emerald-500/70">Catatan perkembangan khusus dari asatidzah serta rekapitulasi pelanggaran dan dispensasi limit oleh tim Keamanan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Academic Progress Reports */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="trending-up" className="w-4 h-4 text-emerald-400" />
              Laporan Perkembangan Akademik & Aktivitas
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {db.laporan_perkembangan.slice().reverse().map((rep) => (
                <div key={rep.id_laporan} className="glass-card p-4 rounded-xl border border-emerald-900/40 flex flex-col gap-2 relative bg-emerald-950/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">{rep.tipe}</span>
                      <h4 className="text-xs font-bold text-gray-100 mt-1.5">{rep.subjek}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 font-semibold">{rep.sasaran}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed bg-emerald-950/30 p-2.5 rounded-xl italic">"{rep.isi}"</p>
                  <div className="flex justify-between items-center text-[9px] text-emerald-500/50 mt-1">
                    <span>Oleh: {rep.pengirim}</span>
                    <span className="font-mono">{rep.tanggal}</span>
                  </div>
                </div>
              ))}
              {db.laporan_perkembangan.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-10 italic">Belum ada laporan perkembangan masuk.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Discipline Violations */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="gavel" className="w-4 h-4 text-red-500" />
              Buku Hitam Pelanggaran Santri (Keamanan)
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {allViolations.map((v) => {
                const sInfo = db.santri.find(s => s.id_santri === v.id_santri);
                return (
                  <div key={v.id_pelanggaran} className="glass-card p-4 rounded-xl border border-red-500/25 flex flex-col gap-2 relative bg-red-500/5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          v.kategori === "BERAT" 
                            ? "bg-red-500/20 text-red-400 border-red-500/30" 
                            : v.kategori === "SEDANG"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}>
                          {v.kategori}
                        </span>
                        <span className="text-xs font-bold text-gray-100">{sInfo?.nama_santri || "Santri"}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono">{v.tanggal}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#1b0a0a]/50 p-2.5 rounded-xl">
                      <strong>Detail:</strong> {v.detail_pelanggaran}
                    </p>
                    <div className="pt-1.5 border-t border-red-950/20 text-xs text-amber-300">
                      <strong>Hukuman/Sanksi:</strong> <span className="underline font-medium text-white">{v.hukuman}</span>
                    </div>
                    <div className="text-[9px] text-emerald-500/50 flex justify-between">
                      <span>ID: {v.id_pelanggaran}</span>
                      <span>Dicatat oleh: {v.dicatat_oleh}</span>
                    </div>
                  </div>
                );
              })}
              {allViolations.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-10 italic">Alhamdulillah, tidak ada catatan pelanggaran keamanan.</p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Active Spending Overrides */}
        <div className="glass-card p-5 rounded-2xl border border-yellow-500/10 mt-2">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-2">
            <LucideIcon name="unlock" className="w-4 h-4 text-yellow-500" />
            Daftar Dispensasi Batas Jajan & Belanja Lebih Santri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allAllowances.map((i) => {
              const sInfo = db.santri.find(s => s.id_santri === i.id_santri);
              const today = new Date().toISOString().slice(0, 10);
              const isActive = i.tanggal === today;
              return (
                <div key={i.id_izin_khusus} className="p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-2.5 relative text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-100 block">{sInfo?.nama_santri}</span>
                      <span className="text-[9px] text-emerald-500/50 font-mono block">Kelas: {sInfo?.kelas}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      isActive 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-gray-800 text-gray-500 border-gray-700"
                    }`}>
                      {isActive ? "AKTIF" : "KADALUARSA"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-yellow-950/20 p-2 rounded-lg border border-yellow-950/30 text-xs">
                    <span className="text-gray-400 font-medium">Tipe: <strong className="text-yellow-400">{i.tipe_izin}</strong></span>
                    <strong className="text-yellow-400 font-mono">
                      {i.is_no_limit ? "BEBAS (NO LIMIT)" : formatRupiah(i.nominal_disetujui)}
                    </strong>
                  </div>

                  <div className="text-[11px] leading-relaxed text-gray-300">
                    <strong>Keterangan:</strong> "{i.keterangan}"
                  </div>

                  <div className="flex justify-between text-[9px] text-emerald-500/50 pt-1.5 border-t border-yellow-950/20">
                    <span>Otorisasi: {i.dicatat_oleh}</span>
                    <span>Tgl: {i.tanggal}</span>
                  </div>
                </div>
              );
            })}
            {allAllowances.length === 0 && (
              <p className="text-xs text-gray-500 text-center col-span-2 py-6 italic">Belum ada dispensasi limit belanja/jajan yang diterbitkan.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-kontak') {
    return (
      <section id="tab-kiai-kontak" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-2">Buku Kontak WhatsApp Pesantren</h3>
          <p className="text-xs text-emerald-500/70">Hubungi pengajar dan penanggung jawab otoritas secara instan langsung via WhatsApp.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asatidzah */}
          {db.asatidzah_kontak.map((tch) => (
            <div key={tch.id_guru} className="glass-card p-4 rounded-2xl border border-emerald-900/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={tch.foto_profil || "https://placehold.co/150x150/022c22/f59e0b?text=Ustadz"} className="w-12 h-12 rounded-xl object-cover border border-amber-500/20 shadow-md" />
                <div>
                  <h5 className="text-xs font-bold text-gray-100 block">{tch.nama}</h5>
                  <span className="text-[10px] text-emerald-400 font-semibold block">{tch.jabatan}</span>
                  <span className="text-[9px] text-emerald-500/60 block mt-0.5">Alamat: {tch.alamat || '-'}</span>
                </div>
              </div>
              <a href={`https://wa.me/${tch.no_wa}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-md">
                <LucideIcon name="message-circle" className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>
            </div>
          ))}

          {/* Users */}
          {db.users_manajemen.map((usr) => {
            if (!usr.wa_number) return null;
            return (
              <div key={usr.id_user} className="glass-card p-4 rounded-2xl border border-amber-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950 flex items-center justify-center text-amber-500 border border-emerald-900 font-bold text-xs uppercase">
                    {usr.nama.charAt(0) + (usr.nama.split(" ")[1]?.charAt(0) || usr.nama.charAt(1))}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-100 block">{usr.nama}</h5>
                    <span className="text-[10px] text-amber-400 font-semibold block">Otoritas: {usr.role}</span>
                    <span className="text-[9px] text-emerald-500/60 block mt-0.5">ID: {usr.username}</span>
                  </div>
                </div>
                <a href={`https://wa.me/${usr.wa_number}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-md">
                  <LucideIcon name="message-circle" className="w-3.5 h-3.5" />
                  <span>Chat WA</span>
                </a>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-manajemen-user') {
    return (
      <section id="tab-kiai-manajemen-user" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <LucideIcon name="shield-alert" className="w-6 h-6" />
                <h3 className="text-base font-bold text-amber-500">Manajemen Pengguna (Otoritas)</h3>
              </div>
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Tentukan penugasan role khusus Admin Yayasan, Admin Tabungan, dan Admin Market di bawah.
              </p>
            </div>
            <button onClick={() => setIsAddUserOpen(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-md">
              <LucideIcon name="user-plus" className="w-4 h-4" /> Tambah Pengguna Baru
            </button>
          </div>
          
          <div className="space-y-4">
            {db.users_manajemen.map((usr, idx) => (
              <div key={usr.id_user} className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center justify-between flex-wrap gap-4 transition-all hover:bg-emerald-950/30 text-xs">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-100">{usr.nama}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {usr.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500/60 font-mono block mt-1">ID: {usr.username} • {usr.email} • WA: +{usr.wa_number || '-'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => {
                      setEditingUser({ ...usr });
                      setIsEditUserOpen(true);
                    }}
                    className="p-2 bg-emerald-900/30 hover:bg-emerald-900/60 text-amber-400 rounded-xl transition-colors border border-emerald-900/40 flex items-center gap-1 font-semibold"
                    title="Edit Pengguna"
                  >
                    <LucideIcon name="pencil" className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(usr.id_user, usr.nama)}
                    className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-xl transition-colors border border-red-900/20 flex items-center gap-1 font-semibold"
                    title="Hapus Pengguna"
                  >
                    <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add User Dialog */}
        {isAddUserOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="user-plus" className="w-4 h-4" /> Tambah Pengguna Baru
                </h3>
                <button onClick={() => setIsAddUserOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.nama}
                    onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                    placeholder="Contoh: Ust. H. Ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">WhatsApp Pengguna</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.wa_number}
                    onChange={(e) => setNewUser({ ...newUser, wa_number: e.target.value })}
                    placeholder="Contoh: 62812345678" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    required 
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ridwan@ponpesqu.com" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">ID Pengguna (Username)</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Kata Sandi (Password)</label>
                  <input 
                    type="password" 
                    required 
                    value={newUser.pass}
                    onChange={(e) => setNewUser({ ...newUser, pass: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Otoritas Penugasan (Role)</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 focus:outline-none"
                  >
                    <option value="Admin Yayasan">Admin Yayasan</option>
                    <option value="Admin Tabungan">Admin Tabungan</option>
                    <option value="Admin Market">Admin Market</option>
                    <option value="Pengajar">Pengajar</option>
                    <option value="Admin Keamanan">Admin Keamanan</option>
                    <option value="Admin Media">Admin Media</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddUserOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Pengguna</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Edit User Dialog */}
        {isEditUserOpen && editingUser && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="pencil" className="w-4 h-4" /> Edit Pengguna
                </h3>
                <button onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.nama}
                    onChange={(e) => setEditingUser({ ...editingUser, nama: e.target.value })}
                    placeholder="Contoh: Ust. H. Ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">WhatsApp Pengguna</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.wa_number || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, wa_number: e.target.value })}
                    placeholder="Contoh: 62812345678" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    required 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="ridwan@ponpesqu.com" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">ID Pengguna (Username)</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    placeholder="ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Kata Sandi (Password)</label>
                  <input 
                    type="password" 
                    required 
                    value={editingUser.pass}
                    onChange={(e) => setEditingUser({ ...editingUser, pass: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Otoritas Penugasan (Role)</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 focus:outline-none"
                  >
                    <option value="Admin Yayasan">Admin Yayasan</option>
                    <option value="Admin Tabungan">Admin Tabungan</option>
                    <option value="Admin Market">Admin Market</option>
                    <option value="Pengajar">Pengajar</option>
                    <option value="Admin Keamanan">Admin Keamanan</option>
                    <option value="Admin Media">Admin Media</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'kiai-keluhan') {
    const complaints = db.keluhan || [];
    const filteredComplaints = complaints.filter(c => {
      if (complaintFilter === 'BARU') return c.status === 'BARU';
      if (complaintFilter === 'SELESAI') return c.status === 'SELESAI';
      return true;
    });

    const handleClearComplaints = () => {
      if (complaints.length === 0) {
        showToast("Daftar aspirasi & keluhan sudah kosong.", "info");
        return;
      }
      showConfirm("Apakah Abah Kiai yakin ingin membersihkan seluruh aspirasi & keluhan wali santri?", (yes) => {
        if (yes) {
          const updatedDb: K_DB = {
            ...db,
            keluhan: []
          };
          syncDbState(updatedDb).then(() => {
            showToast("Seluruh aspirasi & keluhan wali santri berhasil dibersihkan.", "success");
          });
        }
      });
    };

    return (
      <section id="tab-kiai-keluhan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <LucideIcon name="message-square" className="w-6 h-6" />
                <h3 className="text-base font-bold text-amber-500">Aspirasi & Keluhan Wali Santri</h3>
              </div>
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Abah Kiai dapat memantau dan memberikan jawaban langsung atas masukan, keluhan, maupun saran dari wali santri.
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Buttons */}
              <div className="flex items-center gap-2 bg-emerald-950/60 p-1 rounded-xl border border-emerald-900/40 text-xs">
                <button
                  onClick={() => setComplaintFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${complaintFilter === 'ALL' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-500/80 hover:text-emerald-400'}`}
                >
                  Semua ({complaints.length})
                </button>
                <button
                  onClick={() => setComplaintFilter('BARU')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${complaintFilter === 'BARU' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-500/80 hover:text-emerald-400'}`}
                >
                  Baru ({complaints.filter(c => c.status === 'BARU').length})
                </button>
                <button
                  onClick={() => setComplaintFilter('SELESAI')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${complaintFilter === 'SELESAI' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-500/80 hover:text-emerald-400'}`}
                >
                  Selesai ({complaints.filter(c => c.status === 'SELESAI').length})
                </button>
              </div>

              <button
                onClick={handleClearComplaints}
                disabled={complaints.length === 0}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                  complaints.length > 0
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer active:scale-95"
                    : "bg-gray-800/40 text-gray-500 border border-gray-700/30 cursor-not-allowed opacity-50"
                }`}
              >
                <LucideIcon name="trash-2" className="w-4 h-4" />
                <span>Bersihkan Keluhan</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredComplaints.slice().reverse().map((c) => (
              <div key={c.id_keluhan} className="p-5 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex flex-col gap-4 transition-all hover:bg-emerald-950/30 text-xs">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-amber-500 font-bold">
                      {c.nama_wali.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-100 block">{c.nama_wali}</span>
                      <span className="text-[10px] text-emerald-500/50 block mt-0.5">ID Keluhan: {c.id_keluhan}</span>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                    c.status === "BARU" 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {c.status === "BARU" ? "BELUM DITANGGAPI" : "SUDAH DITANGGAPI"}
                  </span>
                </div>

                <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-900/30 text-gray-200 italic leading-relaxed">
                  "{c.isi}"
                </div>

                {c.jawaban ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold">
                      <LucideIcon name="message-square" className="w-3.5 h-3.5" />
                      Tanggapan Abah Kiai:
                    </div>
                    <p className="text-gray-300 leading-relaxed font-medium">
                      {c.jawaban}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => openReply(c)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <LucideIcon name="pen-tool" className="w-3.5 h-3.5" /> Tanggapi Keluhan
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12 text-gray-500 italic">
                Belum ada keluhan wali santri dalam kategori ini.
              </div>
            )}
          </div>
        </div>

        {/* Reply Complaint Dialog */}
        {isReplyOpen && selectedComplaint && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="message-square" className="w-4 h-4" /> Berikan Tanggapan
                </h3>
                <button onClick={() => { setIsReplyOpen(false); setSelectedComplaint(null); }} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-2 text-gray-300">
                <div>
                  <span className="text-emerald-500/70 block">Wali Santri:</span>
                  <span className="font-bold text-gray-100">{selectedComplaint.nama_wali}</span>
                </div>
                <div>
                  <span className="text-emerald-500/70 block">Isi Keluhan:</span>
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/40 italic text-gray-300">
                    "{selectedComplaint.isi}"
                  </div>
                </div>
              </div>

              <form onSubmit={handleReplySubmit} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1 font-bold">Tanggapan / Jawaban Abah Kiai</label>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tulis tanggapan atau solusi di sini..."
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setIsReplyOpen(false); setSelectedComplaint(null); }} className="w-1/2 py-2.5 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
                  <button type="submit" className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md cursor-pointer">Kirim Tanggapan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'kiai-pengaturan') {
    return (
      <section id="tab-kiai-pengaturan" className="tab-content flex flex-col gap-6">
        
        {/* CARD PANDUAN HOSTING KHUSUS AWAM */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-emerald-950 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <LucideIcon name="globe" className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-amber-400 flex items-center gap-2 flex-wrap">
                  Panduan Hosting & Web Online (Khusus Awam)
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Terperinci Step-by-Step
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Panduan langkah demi langkah cara meng-online-kan sistem pesantren ini agar bisa diakses Kiai, Pengajar & Wali Santri dari HP/Laptop.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsHostingModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02]"
            >
              <LucideIcon name="book-open" className="w-4 h-4" />
              <span>Buka Panduan Hosting Lengkap</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-900/60 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Metode 1: Vercel (Gratis)</span>
              <p className="text-[11px] text-gray-300 leading-snug">
                100% Gratis & Otomatis. Hubungkan proyek di GitHub ke Vercel.com. Sangat direkomendasikan untuk pemula.
              </p>
            </div>
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-900/60 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Metode 2: cPanel Hosting</span>
              <p className="text-[11px] text-gray-300 leading-snug">
                Upload file <code className="text-amber-300">dist.zip</code> hasil <code className="text-amber-300">npm run build</code> ke File Manager cPanel (<code className="text-amber-300">public_html</code>).
              </p>
            </div>
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-900/60 space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Domain Custom Pesantren</span>
              <p className="text-[11px] text-gray-300 leading-snug">
                Dukungan domain resmi <code className="text-amber-300">.sch.id</code> / <code className="text-amber-300">.com</code> dengan setup CNAME DNS & SSL HTTPS otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 border-b border-emerald-950/50 pb-3">
              <LucideIcon name="settings-2" className="w-5 h-5" /> Identitas & Atribut Pondok
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Pondok Pesantren</label>
                <input 
                  type="text" 
                  value={settingsForm.shop_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shop_name: e.target.value })}
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Singkat / Brand Pesantren (Contoh: PONPESQU)</label>
                <input 
                  type="text" 
                  value={settingsForm.nama_pesantren}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nama_pesantren: e.target.value })}
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  placeholder="PONPESQU"
                />
              </div>
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Pemilik / Pengasuh (Kiai)</label>
                <input 
                  type="text" 
                  value={settingsForm.owner_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, owner_name: e.target.value })}
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Bank</label>
                  <input 
                    type="text" 
                    value={settingsForm.bank_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nomor Rekening</label>
                  <input 
                    type="text" 
                    value={settingsForm.bank_account}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_account: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Atas Nama (A/N)</label>
                  <input 
                    type="text" 
                    value={settingsForm.bank_owner}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_owner: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-950/30">
                <label className="block text-emerald-500/80 mb-1 font-bold">Sandi Pengaman Akun Kiai (Login Kiai)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={settingsForm.kiai_pass}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kiai_pass: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-200 focus:outline-none font-mono tracking-widest"
                    placeholder="Sandi baru Kiai (contoh: abah123)"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/70 hover:text-emerald-400 cursor-pointer p-1"
                  >
                    <LucideIcon name={showPassword ? "eye-off" : "eye"} className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-500/50 mt-1">Sandi awal/standar adalah <code className="bg-emerald-950/80 px-1 py-0.5 rounded text-amber-400">abah123</code>. Ganti untuk memperkuat keamanan database pesantren.</p>
              </div>
              <button onClick={saveSettings} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors mt-2 shadow-md">
                Simpan Konfigurasi Pesantren
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/50 pb-3">
                <LucideIcon name="image" className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-100">Logo Ikonik Aplikasi</h3>
              </div>
              <p className="text-xs text-emerald-500/70 leading-relaxed">
                Ganti file branding logo aplikasi Android/iOS ponpesqu langsung menggunakan Cloud Uploader pesantren.
              </p>

              <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-900/60 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <img 
                    src={db.settings.logo_url || "https://placehold.co/150x150/022c22/f59e0b?text=🕌"} 
                    alt="Logo Pesantren" 
                    className="w-12 h-12 rounded-xl object-cover border border-amber-500/20 shadow-md shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-200 block">Logo Ikonik Aktif</span>
                    <span className="text-[10px] text-emerald-500/60 font-medium">Ganti berkas logo (.png / .jpg)</span>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  id="logo-uploader-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload}
                />
                <button 
                  onClick={() => document.getElementById('logo-uploader-input')?.click()} 
                  className="px-4 py-2 bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <LucideIcon name="upload" className="w-4 h-4" /> Ganti Logo
                </button>
              </div>
            </div>

            {/* CARD PENCADANGAN DATA LENGKAP SISTEM (EXCEL .XLSX) */}
            <div className="p-5 bg-gradient-to-br from-emerald-950 via-emerald-900/50 to-emerald-950 rounded-2xl border border-amber-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <LucideIcon name="file-spreadsheet" className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2 flex-wrap">
                      Pencadangan Data Lengkap Sistem (Excel .xlsx)
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Multi-Sheet Automatic
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Unduh seluruh database aktif pesantren ke dalam 1 berkas Excel rapi (.xlsx) untuk arsip aman Kiai.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadFullExcelBackup}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02]"
                >
                  <LucideIcon name="download" className="w-4 h-4 text-emerald-950" />
                  <span>Unduh Data Excel (.xlsx)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-emerald-300/80">
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Data Santri & Wali</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Tagihan SPP & Kas</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Katalog Koperasi</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Transaksi Market</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Mutasi Tabungan</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Perizinan & Absensi</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Data Kedisiplinan</span>
                </div>
                <div className="bg-emerald-950/70 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                  <LucideIcon name="check-circle-2" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Akun Pengguna & Setup</span>
                </div>
              </div>
            </div>

            <div className="border-t border-emerald-950/50 pt-5 space-y-5">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <LucideIcon name="settings-2" className="w-4 h-4 text-red-400" />
                Sistem Pemeliharaan & Pembersihan Database
              </h3>

              {/* 1. Pembersihan Riwayat Transaksi & Laporan */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <LucideIcon name="alert-triangle" className="w-4 h-4 text-amber-400" />
                  Pembersihan Riwayat Transaksi & Laporan Umum (Kuning)
                </div>
                <p className="text-[11px] text-amber-500/70 leading-relaxed">
                  Menghapus riwayat transaksi market, transaksi tabungan, laporan perkembangan, izin jajan, absensi sholat & kelas, keluhan wali santri, riwayat sesi login, serta kas log. Akun santri dan saldo saku utama tetap aman dan tidak akan terhapus.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="block text-amber-500/60 mb-1">Dari Tanggal (Mulai)</label>
                    <input
                      type="date"
                      value={clearGeneralStart}
                      onChange={(e) => setClearGeneralStart(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-500/60 mb-1">Sampai Tanggal (Akhir)</label>
                    <input
                      type="date"
                      value={clearGeneralEnd}
                      onChange={(e) => setClearGeneralEnd(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleClearGeneralHistory}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Bersihkan Riwayat Transaksi & Laporan
                </button>
              </div>

              {/* 2. Pembersihan Riwayat Pelanggaran Santri */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <LucideIcon name="shield-alert" className="w-4 h-4 text-amber-400" />
                  Pembersihan Riwayat Pelanggaran Santri (Kuning)
                </div>
                <p className="text-[11px] text-amber-500/70 leading-relaxed">
                  Menghapus riwayat kedisiplinan dan hukuman santri dari database kedisiplinan keamanan secara permanen.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="block text-amber-500/60 mb-1">Dari Tanggal (Mulai)</label>
                    <input
                      type="date"
                      value={clearViolationsStart}
                      onChange={(e) => setClearViolationsStart(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-500/60 mb-1">Sampai Tanggal (Akhir)</label>
                    <input
                      type="date"
                      value={clearViolationsEnd}
                      onChange={(e) => setClearViolationsEnd(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleClearViolationsHistory}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Bersihkan Riwayat Pelanggaran Santri
                </button>
              </div>

              {/* 3. Stel Ulang Seluruh Database */}
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-xs space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-black uppercase tracking-wider animate-pulse">
                  <LucideIcon name="flame" className="w-4 h-4 text-red-500 animate-bounce" />
                  Zona Bahaya Keras: Stel Ulang Database (Merah)
                </div>
                <p className="text-[11px] text-red-300/80 leading-relaxed">
                  Tindakan ini akan memformat seluruh database pondok pesantren dan mengembalikan semua santri, keuangan, tabungan, koperasi, dan konfigurasi ke pengaturan awal bawaan.
                </p>
                <button
                  onClick={triggerReset}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold border border-red-500/30 rounded-xl text-xs transition-all shadow-lg hover:shadow-red-900/30 cursor-pointer"
                >
                  Setel Ulang Seluruh Database Ponpesqu
                </button>
              </div>
            </div>
          </div>

        </div>

        <PanduanHostingModal 
          isOpen={isHostingModalOpen} 
          onClose={() => setIsHostingModalOpen(false)} 
          namaPesantren={db.settings.nama_pesantren || db.settings.shop_name} 
        />
      </section>
    );
  }

  if (activeTab === 'kiai-login-logs') {
    const logs = db.login_logs || [];

    const handleClearLogs = () => {
      if (logs.length === 0) {
        showToast("Riwayat sesi login sudah kosong.", "info");
        return;
      }
      showConfirm("Apakah Abah Kiai yakin ingin membersihkan seluruh riwayat sesi login?", (yes) => {
        if (yes) {
          const updatedDb: K_DB = {
            ...db,
            login_logs: []
          };
          syncDbState(updatedDb).then(() => {
            showToast("Seluruh riwayat sesi login berhasil dibersihkan.", "success");
          });
        }
      });
    };

    return (
      <section id="tab-kiai-login-logs" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <LucideIcon name="history" className="w-6 h-6" />
                <h3 className="text-base font-bold text-amber-500">Riwayat Sesi Login</h3>
              </div>
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Abah Kiai dapat memantau siapa saja yang masuk ke dalam sistem, beserta peran (role), waktu masuk, dan alamat IP perangkat yang digunakan.
              </p>
            </div>

            <button
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                logs.length > 0
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer active:scale-95"
                  : "bg-gray-800/40 text-gray-500 border border-gray-700/30 cursor-not-allowed opacity-50"
              }`}
            >
              <LucideIcon name="trash-2" className="w-4 h-4" />
              <span>Bersihkan Riwayat</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#031d17] text-amber-500 uppercase font-bold border-b border-emerald-900/60">
                <tr>
                  <th className="p-3">Waktu (WIB)</th>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Otoritas / Role</th>
                  <th className="p-3">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/30">
                {logs.slice().reverse().map((log) => (
                  <tr key={log.id_log} className="hover:bg-emerald-950/25 transition-all">
                    <td className="p-3 font-mono">{log.tanggal}</td>
                    <td className="p-3 font-semibold text-gray-100">{log.nama}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{log.ip_address}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                      Belum ada riwayat login tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
