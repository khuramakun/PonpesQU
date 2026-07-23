import React, { useState, useEffect } from 'react';
import { K_DB } from './types';
import { LoginView } from './components/LoginView';
import { KiaiPanel } from './components/KiaiPanel';
import { YayasanPanel } from './components/YayasanPanel';
import { TabunganPanel } from './components/TabunganPanel';
import { PengajarPanel } from './components/PengajarPanel';
import { WaliPanel } from './components/WaliPanel';
import { MarketPanel } from './components/MarketPanel';
import { KeamananPanel } from './components/KeamananPanel';
import { HomepageView } from './components/HomepageView';
import { MediaPanel } from './components/MediaPanel';
import { LucideIcon } from './components/LucideIcon';
import { subscribeToCloudDb, saveDbToCloud } from './firebase';

// Ensures all properties in K_DB exist, preventing undefined serialization errors or lost arrays
export function sanitizeAndEnsureDb(raw: any): K_DB {
  if (!raw || typeof raw !== "object") raw = {};

  const defaultHomepage = {
    pesantren_name: "Pesantren Database",
    logo_url: "https://placehold.co/150x150/022c22/f59e0b?text=🕌",
    hero_title: "Database Pondok Pesantren Terpercaya",
    hero_subtitle: "Kelola data santri dengan mudah, cepat, dan akurat.",
    hero_btn_text: "Cari Data Santri",
    hero_image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=1200&auto=format&fit=crop",
    cards: [
      { title: "Pencarian Santri", description: "Cari data santri dengan cepat dan aktual.", icon: "search" },
      { title: "Profil Pesantren", description: "Informasi lengkap tentang pondok pesantren.", icon: "landmark" },
      { title: "Aman & Terpercaya", description: "Sistem yang aman dan terproteksi.", icon: "shield" }
    ],
    about_title: "Tentang Pesantren Kami",
    about_subtitle: "Membangun Generasi Islami yang Berakhlak Mulia",
    about_description: "Pesantren Al-Hikmah. Pondok pesantren kami berkomitmen untuk mendidik santri menjadi generasi yang beriman, berilmu, dan berakhlak mulia.",
    about_stats_1: "500+ Santri Aktif",
    about_stats_2: "25+ Tahun Berdiri",
    about_image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=800&auto=format&fit=crop",
    contact_address: "Bandung, Jawa Barat",
    contact_phone: "6281234567890",
    contact_email: "info@ponpesqu.com",
    news: [
      {
        id: "news-001",
        title: "Penerimaan Santri Baru Tahun Ajaran 2026/2027 Resmi Dibuka",
        content: "Pondok Pesantren kini resmi membuka pendaftaran santri baru dengan program unggulan Tahfidz Quran, Kitab Kuning, dan Madrasah Aliyah Sains.",
        date: "12 Juli 2026",
        category: "PENGUMUMAN",
        image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800&auto=format&fit=crop"
      }
    ]
  };

  const defaultSettings = {
    shop_name: "Koperasi Pesantren Darul Ma'arif",
    owner_name: "Kiai M. Hasan",
    address: "Bandung, Jawa Barat",
    phone: "6281234567890",
    bank_name: "BSI",
    bank_account: "7144028990",
    bank_owner: "YAYASAN DARUL MA'ARIF PONPESQU",
    logo_url: "",
    nama_pesantren: "PONPESQU"
  };

  const cleanObj: K_DB = {
    kas_market: typeof raw.kas_market === "number" ? raw.kas_market : 1250000,
    kas_yayasan: typeof raw.kas_yayasan === "number" ? raw.kas_yayasan : 5800000,
    santri: Array.isArray(raw.santri) ? raw.santri : [],
    keluhan: Array.isArray(raw.keluhan) ? raw.keluhan : [],
    laporan_perkembangan: Array.isArray(raw.laporan_perkembangan) ? raw.laporan_perkembangan : [],
    asatidzah_kontak: Array.isArray(raw.asatidzah_kontak) ? raw.asatidzah_kontak : [],
    kelas_list: Array.isArray(raw.kelas_list) ? raw.kelas_list : [],
    sholat_rules: Array.isArray(raw.sholat_rules) ? raw.sholat_rules : [],
    users_manajemen: Array.isArray(raw.users_manajemen) ? raw.users_manajemen : [],
    yayasan_kas_logs: Array.isArray(raw.yayasan_kas_logs) ? raw.yayasan_kas_logs : [],
    market_kas_logs: Array.isArray(raw.market_kas_logs) ? raw.market_kas_logs : [],
    transaksi_tabungan: Array.isArray(raw.transaksi_tabungan) ? raw.transaksi_tabungan : [],
    tagihan: Array.isArray(raw.tagihan) ? raw.tagihan : [],
    settings: { ...defaultSettings, ...(raw.settings || {}) },
    absensi_kelas: Array.isArray(raw.absensi_kelas) ? raw.absensi_kelas : [],
    absensi_sholat: Array.isArray(raw.absensi_sholat) ? raw.absensi_sholat : [],
    perizinan: Array.isArray(raw.perizinan) ? raw.perizinan : [],
    tutup_absen_kelas: raw.tutup_absen_kelas || {},
    tutup_absen_sholat: raw.tutup_absen_sholat || {},
    produk_market: Array.isArray(raw.produk_market) ? raw.produk_market : [],
    stok_market: Array.isArray(raw.stok_market) ? raw.stok_market : [],
    transaksi_market: Array.isArray(raw.transaksi_market) ? raw.transaksi_market : [],
    pelanggaran_santri: Array.isArray(raw.pelanggaran_santri) ? raw.pelanggaran_santri : [],
    izin_keamanan: Array.isArray(raw.izin_keamanan) ? raw.izin_keamanan : [],
    izin_pulang: Array.isArray(raw.izin_pulang) ? raw.izin_pulang : [],
    izin_merokok: Array.isArray(raw.izin_merokok) ? raw.izin_merokok : [],
    login_logs: Array.isArray(raw.login_logs) ? raw.login_logs : [],
    homepage: { ...defaultHomepage, ...(raw.homepage || {}) }
  };

  // Ensure "Admin Media" user exists
  const hasMediaUser = cleanObj.users_manajemen.some(u => u.role === "Admin Media" || u.username === "media");
  if (!hasMediaUser) {
    cleanObj.users_manajemen.push({
      id_user: "USR-006",
      nama: "Sdr. Fatih",
      role: "Admin Media",
      email: "fatih@ponpesqu.com",
      username: "media",
      pass: "media123",
      wa_number: "628533445566"
    });
  }

  return JSON.parse(JSON.stringify(cleanObj));
}

export default function App() {
  const [db, setDb] = useState<K_DB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth state
  const [activeUser, setActiveUser] = useState<{ nama: string; role: string; id_santri?: string } | null>(null);
  const [currentRole, setCurrentRole] = useState<"KIAI" | "YAYASAN" | "TABUNGAN" | "PENGAJAR" | "WALI" | "MARKET" | "KEAMANAN" | "MEDIA">("KIAI");
  const [activeTab, setActiveTab] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    msg: string;
    onConfirm: (result: boolean) => void;
  }>({
    show: false,
    msg: "",
    onConfirm: () => {}
  });

  // Clock
  const [clockStr, setClockClockStr] = useState("");

  // Live real-time clock integrated directly with device time and date
  useEffect(() => {
    const updateRealtimeClock = () => {
      const now = new Date();
      
      const dateFormatted = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeFormatted = `${hours}:${minutes}:${seconds}`;

      let hijriStr = '';
      try {
        const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        hijriStr = hijriFormatter.format(now) + ' H';
      } catch {
        hijriStr = '';
      }

      setClockClockStr(`${dateFormatted} • ${timeFormatted}${hijriStr ? ` • ${hijriStr}` : ''}`);
    };

    updateRealtimeClock();
    const interval = setInterval(updateRealtimeClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Database on Mount and Listen to Real-time Cloud Firestore
  useEffect(() => {
    fetchDb();

    // Subscribe to Firebase Cloud Firestore for real-time automatic sync across all devices
    const unsubscribeCloud = subscribeToCloudDb((cloudData) => {
      if (cloudData) {
        const cleanCloud = sanitizeAndEnsureDb(cloudData);
        setDb(cleanCloud);
        try {
          localStorage.setItem("ponpesqu_db", JSON.stringify(cleanCloud));
        } catch (e) {
          console.error("Error saving cloud snapshot to localStorage:", e);
        }
      }
    });

    return () => unsubscribeCloud();
  }, []);

  const fetchDb = async () => {
    try {
      let data: K_DB | null = null;

      // 1. Check browser localStorage
      const localStr = localStorage.getItem("ponpesqu_db");
      if (localStr) {
        try {
          data = JSON.parse(localStr);
        } catch (e) {
          console.warn("Failed parsing localStorage db");
        }
      }

      // 2. Fallback to /api/db if localStorage is empty
      if (!data) {
        try {
          const res = await fetch("/api/db");
          if (res.ok) {
            data = await res.json();
          }
        } catch (err) {
          console.warn("Backend API unavailable, initializing default dataset");
        }
      }

      const cleanDb = sanitizeAndEnsureDb(data);

      // Save to localStorage and Cloud Firestore
      try {
        localStorage.setItem("ponpesqu_db", JSON.stringify(cleanDb));
        saveDbToCloud(cleanDb);
      } catch (e) {
        console.error("Failed saving to localStorage/cloud:", e);
      }

      setDb(cleanDb);
    } catch (err) {
      console.error("Error loading database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync state to localStorage & Firebase Cloud Firestore
  const syncDbState = async (updatedDb: K_DB) => {
    const cleanDb = sanitizeAndEnsureDb(updatedDb);
    setDb(cleanDb); // Immediate UI update

    // 1. Store to browser localStorage
    try {
      localStorage.setItem("ponpesqu_db", JSON.stringify(cleanDb));
    } catch (e) {
      console.error("Error writing to localStorage:", e);
    }

    // 2. Save directly to Firebase Firestore Cloud Database (Permanent Data Cloud)
    const savedCloud = await saveDbToCloud(cleanDb);
    if (!savedCloud) {
      console.warn("Retrying saveDbToCloud...");
      await saveDbToCloud(cleanDb);
    }

    // 3. Optional local server sync
    try {
      fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanDb)
      }).catch(() => {});
    } catch (err) {
      // Ignore background server sync failures
    }
  };

  // Export backup JSON file
  const exportBackupJson = () => {
    if (!db) return;
    const jsonStr = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `backup_ponpesqu_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("File backup JSON berhasil diunduh!", "success");
  };

  // Import backup JSON file
  const importBackupJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          syncDbState(parsed);
          showToast("Data backup berhasil diimpor & dipulihkan!", "success");
        } else {
          showToast("Format file JSON backup tidak valid!", "error");
        }
      } catch (err) {
        showToast("Gagal membaca file JSON!", "error");
      }
    };
    reader.readAsText(file);
  };

  // Reset database completely
  const resetDatabase = async () => {
    showConfirm("Apakah Anda yakin ingin mereset seluruh database ke data awal bawaan?", (yes) => {
      if (yes) {
        try {
          localStorage.removeItem("ponpesqu_db");
          fetchDb();
          showToast("Database berhasil disetel ulang!", "info");
        } catch (err) {
          console.error("Error resetting database:", err);
          showToast("Gagal menyetel ulang database!", "error");
        }
      }
    });
  };

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Confirm helper
  const showConfirm = (msg: string, callback: (yes: boolean) => void) => {
    setConfirmModal({
      show: true,
      msg,
      onConfirm: (result: boolean) => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        callback(result);
      }
    });
  };

  // Login verification
  const handleLogin = async (userVal: string, passVal: string): Promise<boolean> => {
    if (!db) return false;

    const userValClean = userVal.trim().toLowerCase();
    let matchedUser = null;
    let matchedRole: "KIAI" | "YAYASAN" | "TABUNGAN" | "PENGAJAR" | "WALI" | "MARKET" | "KEAMANAN" | "MEDIA" = "KIAI";

    if (userValClean === "kiai" && passVal === (db.settings.kiai_pass || "abah123")) {
      matchedUser = { nama: db.settings.owner_name, role: "Kiai" };
      matchedRole = "KIAI";
    } else {
      // Check for Wali Santri / Student Login (e.g. custom username or id_santri)
      const matchedSantri = db.santri.find(s => 
        (s.username && s.username.toLowerCase() === userValClean) || 
        s.id_santri.toLowerCase() === userValClean
      );
      if (matchedSantri && (passVal === matchedSantri.pass || passVal === "santri123")) {
        matchedUser = { nama: `Wali ${matchedSantri.nama_santri}`, role: "Wali Santri", id_santri: matchedSantri.id_santri };
        matchedRole = "WALI";
      } else {
        const dbUser = db.users_manajemen.find(u => u.username.toLowerCase() === userValClean && u.pass === passVal);
        if (dbUser) {
          matchedUser = dbUser;
          if (dbUser.role === "Admin Yayasan") {
            matchedRole = "YAYASAN";
          } else if (dbUser.role === "Admin Tabungan") {
            matchedRole = "TABUNGAN";
          } else if (dbUser.role === "Pengajar") {
            matchedRole = "PENGAJAR";
          } else if (dbUser.role === "Admin Market") {
            matchedRole = "MARKET";
          } else if (dbUser.role === "Admin Keamanan") {
            matchedRole = "KEAMANAN";
          } else if (dbUser.role === "Admin Media") {
            matchedRole = "MEDIA";
          } else {
            matchedRole = "KIAI";
          }
        }
      }
    }

    if (matchedUser) {
      setActiveUser(matchedUser);
      setCurrentRole(matchedRole);
      
      // Catat log login ke server secara async
      fetch("/api/login-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: matchedUser.nama, role: matchedUser.role })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.db) {
            setDb(result.db);
          }
        })
        .catch(err => console.error("Gagal mencatat log login:", err));
      
      // Default tabs
      if (matchedRole === "KIAI") {
        setActiveTab("kiai-dashboard");
      } else if (matchedRole === "YAYASAN") {
        setActiveTab("yayasan-dashboard");
      } else if (matchedRole === "TABUNGAN") {
        setActiveTab("tabungan-dashboard");
      } else if (matchedRole === "PENGAJAR") {
        setActiveTab("pengajar-dashboard");
      } else if (matchedRole === "WALI") {
        setActiveTab("wali-dashboard");
      } else if (matchedRole === "MARKET") {
        setActiveTab("market-dashboard");
      } else if (matchedRole === "KEAMANAN") {
        setActiveTab("keamanan-dashboard");
      } else if (matchedRole === "MEDIA") {
        setActiveTab("media-dashboard");
      }

      showToast(`Sesi login berhasil. Selamat datang ${matchedUser.nama}!`, "success");
      return true;
    } else {
      showToast("Username atau sandi akun salah!", "error");
      return false;
    }
  };

  // Logout
  const handleLogout = () => {
    showConfirm("Abah yakin ingin keluar dari sistem?", (yes) => {
      if (yes) {
        setActiveUser(null);
        setShowLogin(false);
        showToast("Sesi berhasil dikeluarkan.", "info");
      }
    });
  };

  if (isLoading || !db) {
    return (
      <div className="min-h-screen bg-[#02110e] flex flex-col items-center justify-center p-4">
        <div className="relative w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🕌</span>
        </div>
        <p className="text-xs text-emerald-500/80 mt-4 font-semibold tracking-wider uppercase font-mono">Loading {(db?.settings?.nama_pesantren || "PONPESQU").toUpperCase()} Portal...</p>
      </div>
    );
  }

  const logoUrl = db.settings.logo_url || "https://placehold.co/150x150/022c22/f59e0b?text=🕌";

  return (
    <div className="flex flex-col min-h-screen bg-[#02110e] text-white">
      
      {/* TOAST CONTAINER */}
      <div id="toast-container">
        {toasts.map(t => {
          let styleClass = "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 transition-all bg-emerald-950 text-gray-100 border-emerald-900";
          let icon = "check-circle-2";
          let iconColor = "text-emerald-400";

          if (t.type === 'error') {
            styleClass = "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 bg-[#1d0505] text-red-200 border-red-950";
            icon = "alert-triangle";
            iconColor = "text-red-400";
          } else if (t.type === 'info') {
            styleClass = "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 bg-emerald-950 text-amber-200 border-amber-950";
            icon = "info";
            iconColor = "text-amber-400";
          }

          return (
            <div key={t.id} className={styleClass}>
              <LucideIcon name={icon} className={`w-4 h-4 ${iconColor}`} />
              <span className="flex-grow">{t.message}</span>
            </div>
          );
        })}
      </div>

      {/* CUSTOM CONFIRMATION LAYER */}
      {confirmModal.show && (
        <div id="custom-confirm-overlay" className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-amber-500/20 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <LucideIcon name="help-circle" className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-100" id="confirm-modal-title">Konfirmasi Aksi</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">{confirmModal.msg}</p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 bg-emerald-950/50 hover:bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold transition-all" 
                onClick={() => confirmModal.onConfirm(false)}
              >
                Batal
              </button>
              <button 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all" 
                onClick={() => confirmModal.onConfirm(true)}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DECIIDER */}
      {!activeUser ? (
        !showLogin ? (
          <HomepageView db={db} onEnterLogin={() => setShowLogin(true)} />
        ) : (
          <LoginView onLogin={handleLogin} logoUrl={logoUrl} namaPesantren={db?.settings?.nama_pesantren} onBackToHome={() => setShowLogin(false)} />
        )
      ) : (
        <div id="dashboard-view" className="flex-grow flex flex-col max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-36 sm:pb-40 lg:pb-6">
          
          {/* Header Sistem */}
          {currentRole !== "MARKET" && (
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 pb-4 border-b border-emerald-950/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-950/80 border border-emerald-500/30 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-emerald-950/50 p-0.5">
                  <img id="app-logo-img" src={logoUrl} alt="Logo Ponpesqu" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent font-sans">
                      {(db?.settings?.nama_pesantren || "ponpesqu").toLowerCase()}
                    </h1>
                    <span id="role-badge" className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">ROLE: {activeUser.role.toUpperCase()}</span>
                  </div>
                  <p id="role-subtitle" className="text-xs text-emerald-500/70">
                    {currentRole === "KIAI" && "Panel Pengasuh Kiai & Pengasuh Utama"}
                    {currentRole === "YAYASAN" && "Sistem Keuangan & Akademik Santri"}
                    {currentRole === "TABUNGAN" && "Sistem Tabungan Cashless & Uang Saku"}
                    {currentRole === "PENGAJAR" && "Sistem Pembelajaran & Presensi Asatidzah"}
                    {currentRole === "WALI" && "Portal Informasi Wali Santri & Perkembangan Santri"}
                    {currentRole === "KEAMANAN" && "Panel Komando Kedisiplinan & Dispensasi Limit Saku"}
                    {currentRole === "MEDIA" && "Portal Media Hub & Homepage Editor"}
                  </p>
                </div>
              </div>

              {/* Detail Sesi Aktif */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <LucideIcon name="calendar" className="w-4 h-4" />
                  <span>{clockStr}</span>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                  <span className="pulse-dot"></span>
                  <span>Sesi: <strong className="text-amber-400">{activeUser.nama}</strong></span>
                </div>

                <button onClick={handleLogout} className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-900/40 rounded-lg text-xs text-red-400 transition-all flex items-center gap-1 cursor-pointer">
                  <LucideIcon name="log-out" className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </header>
          )}

          <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SIDEBAR NAVIGATION */}
            {currentRole !== "MARKET" && (
              <aside className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto no-scrollbar lg:overflow-visible pb-2 lg:pb-0" id="sidebar-nav">
                {currentRole === "KIAI" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('kiai-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Dashboard</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-keuangan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-keuangan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="landmark" className="w-5 h-5" /> <span>Keuangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-perkembangan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-perkembangan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="trending-up" className="w-5 h-5" /> <span>Perkembangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-keluhan')} 
                      className={`tab-btn flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-keluhan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <LucideIcon name="message-square" className="w-5 h-5" /> <span>Keluhan Wali</span>
                      </div>
                      {db.keluhan.filter(c => c.status === "BARU").length > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'kiai-keluhan' ? 'bg-emerald-950 text-amber-400' : 'bg-red-500 text-white animate-pulse'}`}>
                          {db.keluhan.filter(c => c.status === "BARU").length}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-kontak')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-kontak' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="phone-call" className="w-5 h-5" /> <span>Kontak Staff</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-manajemen-user')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-manajemen-user' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="shield-check" className="w-5 h-5" /> <span>Manajemen User</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-login-logs')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-login-logs' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="history" className="w-5 h-5" /> <span>Riwayat Login</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-pengaturan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-pengaturan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="settings" className="w-5 h-5" /> <span>Sistem Kiai</span>
                    </button>
                  </>
                )}

                {currentRole === "YAYASAN" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('yayasan-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-santri')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-santri' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="users" className="w-5 h-5" /> <span>Data Santri</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-tagihan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-tagihan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="receipt" className="w-5 h-5" /> <span>SPP & Syahryah</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-akademik')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-akademik' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="graduation-cap" className="w-5 h-5" /> <span>Akademik/Staff</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-kas')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-kas' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="landmark" className="w-5 h-5" /> <span>Kas & Transfer</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-kiriman')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-kiriman' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="wallet" className="w-5 h-5" /> <span>Kiriman Santri</span>
                    </button>
                  </>
                )}

                {currentRole === "TABUNGAN" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('tabungan-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tabungan-loket')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-loket' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="wallet" className="w-5 h-5" /> <span>Loket Kasir</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tabungan-riwayat')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-riwayat' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="history" className="w-5 h-5" /> <span>Riwayat Mutasi</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tabungan-limit')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-limit' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="sliders" className="w-5 h-5" /> <span>Limit Jajan</span>
                    </button>
                  </>
                )}

                {currentRole === "PENGAJAR" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('pengajar-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-absensikelas')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-absensikelas' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="scan" className="w-5 h-5" /> <span>Absensi Kelas</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-absensisholat')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-absensisholat' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="activity" className="w-5 h-5" /> <span>Absen Sholat</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-perizinan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-perizinan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="file-text" className="w-5 h-5" /> <span>Izin Santri</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-laporan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-laporan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="send" className="w-5 h-5" /> <span>Lapor Santri</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-rekap')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-rekap' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="trending-up" className="w-5 h-5" /> <span>Rekap Absensi</span>
                    </button>
                  </>
                )}

                {currentRole === "WALI" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('wali-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-izin-pulang')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-izin-pulang' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="door-open" className="w-5 h-5" /> <span>Izin Pulang</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-laporan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-laporan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="trending-up" className="w-5 h-5" /> <span>Perkembangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-absensi')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-absensi' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="scan" className="w-5 h-5" /> <span>Kehadiran</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-aspirasi')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-aspirasi' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="message-square" className="w-5 h-5" /> <span>Aspirasi Wali</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-kontak')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-kontak' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="phone" className="w-5 h-5" /> <span>Kontak Pengurus</span>
                    </button>
                  </>
                )}

                {currentRole === "KEAMANAN" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('keamanan-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'keamanan-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="shield" className="w-5 h-5" /> <span>Pos Keamanan</span>
                    </button>
                  </>
                )}

                {currentRole === "MEDIA" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('media-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'media-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="globe" className="w-5 h-5" /> <span>Edit Homepage</span>
                    </button>
                  </>
                )}
              </aside>
            )}

            {/* MAIN PANEL CONTENT */}
            <main className={`${currentRole === "MARKET" ? "lg:col-span-12" : "lg:col-span-10"} flex flex-col gap-6`} id="main-content-panel">
              {currentRole === "KIAI" && (
                <KiaiPanel 
                  db={db}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  resetDatabase={resetDatabase}
                />
              )}

              {currentRole === "YAYASAN" && (
                <YayasanPanel 
                  db={db}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "TABUNGAN" && (
                <TabunganPanel 
                  db={db}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "PENGAJAR" && (
                <PengajarPanel 
                  db={db}
                  activeUser={activeUser}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "WALI" && (
                <WaliPanel 
                  db={db}
                  activeUser={activeUser as any}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "MARKET" && (
                <MarketPanel
                  db={db}
                  activeUser={activeUser}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "KEAMANAN" && (
                <KeamananPanel
                  db={db}
                  activeUser={activeUser}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {currentRole === "MEDIA" && (
                <MediaPanel
                  db={db}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}
            </main>
          </div>

          {/* BOTTOM MOBILE / TABLET NAV */}
          {currentRole !== "MARKET" && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-emerald-950/95 border-t border-amber-500/30 px-4 py-2.5 flex overflow-x-auto no-scrollbar gap-5 items-center z-40 shadow-2xl" id="mobile-nav">
            {currentRole === "KIAI" && (
              <>
                <button onClick={() => setActiveTab('kiai-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('kiai-keuangan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-keuangan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="landmark" className="w-4 h-4" /><span>Keuangan</span>
                </button>
                <button onClick={() => setActiveTab('kiai-perkembangan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-perkembangan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="trending-up" className="w-4 h-4" /><span>Laporan</span>
                </button>
                <button onClick={() => setActiveTab('kiai-keluhan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all relative ${activeTab === 'kiai-keluhan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <div className="relative">
                    <LucideIcon name="message-square" className="w-4 h-4" />
                    {db.keluhan.filter(c => c.status === "BARU").length > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-extrabold px-1 rounded-full animate-pulse min-w-[12px] text-center">
                        {db.keluhan.filter(c => c.status === "BARU").length}
                      </span>
                    )}
                  </div>
                  <span>Keluhan</span>
                </button>
                <button onClick={() => setActiveTab('kiai-kontak')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-kontak' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="phone-call" className="w-4 h-4" /><span>Kontak</span>
                </button>
                <button onClick={() => setActiveTab('kiai-manajemen-user')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-manajemen-user' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="shield-check" className="w-4 h-4" /><span>User</span>
                </button>
                <button onClick={() => setActiveTab('kiai-login-logs')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-login-logs' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="history" className="w-4 h-4" /><span>Logs</span>
                </button>
                <button onClick={() => setActiveTab('kiai-pengaturan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-pengaturan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="settings" className="w-4 h-4" /><span>Sistem</span>
                </button>
              </>
            )}

            {currentRole === "YAYASAN" && (
              <>
                <button onClick={() => setActiveTab('yayasan-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-santri')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-santri' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="users" className="w-4 h-4" /><span>Santri</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-tagihan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-tagihan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="receipt" className="w-4 h-4" /><span>Syahryah</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-akademik')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-akademik' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="graduation-cap" className="w-4 h-4" /><span>Akademik</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-kiriman')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-kiriman' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="wallet" className="w-4 h-4" /><span>Kiriman</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-kas')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-kas' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="landmark" className="w-4 h-4" /><span>Kas</span>
                </button>
              </>
            )}

            {currentRole === "TABUNGAN" && (
              <>
                <button onClick={() => setActiveTab('tabungan-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('tabungan-loket')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-loket' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="wallet" className="w-4 h-4" /><span>Loket</span>
                </button>
                <button onClick={() => setActiveTab('tabungan-riwayat')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-riwayat' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="history" className="w-4 h-4" /><span>Riwayat</span>
                </button>
                <button onClick={() => setActiveTab('tabungan-limit')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-limit' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="sliders" className="w-4 h-4" /><span>Limit</span>
                </button>
              </>
            )}

            {currentRole === "PENGAJAR" && (
              <>
                <button onClick={() => setActiveTab('pengajar-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-absensikelas')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-absensikelas' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="scan" className="w-4 h-4" /><span>Kelas</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-absensisholat')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-absensisholat' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="activity" className="w-4 h-4" /><span>Sholat</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-perizinan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-perizinan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="file-text" className="w-4 h-4" /><span>Izin</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-laporan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-laporan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="send" className="w-4 h-4" /><span>Lapor</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-rekap')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-rekap' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="trending-up" className="w-4 h-4" /><span>Rekap</span>
                </button>
              </>
            )}

            {currentRole === "WALI" && (
              <>
                <button onClick={() => setActiveTab('wali-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('wali-laporan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-laporan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="trending-up" className="w-4 h-4" /><span>Lapor</span>
                </button>
                <button onClick={() => setActiveTab('wali-absensi')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-absensi' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="scan" className="w-4 h-4" /><span>Absen</span>
                </button>
                <button onClick={() => setActiveTab('wali-aspirasi')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-aspirasi' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="message-square" className="w-4 h-4" /><span>Aspirasi</span>
                </button>
                <button onClick={() => setActiveTab('wali-kontak')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-kontak' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="phone" className="w-4 h-4" /><span>Kontak</span>
                </button>
              </>
            )}

            {currentRole === "KEAMANAN" && (
              <>
                <button onClick={() => setActiveTab('keamanan-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'keamanan-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="shield" className="w-4 h-4" /><span>Pos Keamanan</span>
                </button>
              </>
            )}

            {currentRole === "MEDIA" && (
              <>
                <button onClick={() => setActiveTab('media-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'media-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="globe" className="w-4 h-4" /><span>Homepage</span>
                </button>
              </>
            )}
          </nav>
          )}

        </div>
      )}
    </div>
  );
}
