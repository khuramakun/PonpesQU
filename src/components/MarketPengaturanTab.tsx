import React, { useState } from 'react';
import { K_DB, Settings } from '../types';
import { LucideIcon } from './LucideIcon';

interface MarketPengaturanTabProps {
  db: K_DB;
  activeUser: { nama: string; role: string } | null;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
  onLogout: () => void;
  onResetDb: () => void;
}

export function MarketPengaturanTab({
  db,
  activeUser,
  syncDbState,
  showToast,
  onResetDb
}: MarketPengaturanTabProps) {
  const settings: Settings = db.settings || { shop_name: "", owner_name: "", address: "", phone: "", bank_name: "", bank_account: "", bank_owner: "", logo_url: "" };

  // --- READ-ONLY KIYAI / YAYASAN DATA ---
  const pesantrenName = settings.nama_pesantren || "Pondok Pesantren Ponpesqu";
  const ownerName = settings.owner_name || "Kiai M. Hasan";
  const nibNumber = settings.nib_number || "NIB-9120101901831";
  const pesantrenAddress = settings.alamat_pesantren || settings.address || "Bandung, Jawa Barat";
  const yayasanPhone = settings.phone || "6281234567890";

  // --- EDITABLE MARKET / KOPERASI SETTINGS (TAMPIL DI STRUK) ---
  const [shopName, setShopName] = useState(settings.shop_name || "Koperasi Pesantren Darul Ma'arif");
  const [slogan, setSlogan] = useState(settings.slogan || "Belanja Berkah, Pondok Kuat, Santri Mandiri!");
  const [koperasiAddress, setKoperasiAddress] = useState(settings.koperasi_address || "Gedung Kantin & Koperasi Pesantren");

  const handleSaveSettings = async () => {
    if (!shopName.trim()) {
      showToast("Nama koperasi tidak boleh kosong!", "error");
      return;
    }

    const updatedDb = { ...db };
    updatedDb.settings = {
      ...updatedDb.settings,
      shop_name: shopName,
      slogan: slogan,
      koperasi_address: koperasiAddress
    };

    await syncDbState(updatedDb);
    showToast("Pengaturan Koperasi & Struk Belanja berhasil disimpan!", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full text-xs text-gray-200">
      {/* Left Column: Editable Koperasi / Struk Settings & Locked Yayasan Settings */}
      <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
        <div className="border-b border-emerald-950 pb-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <LucideIcon name="settings" className="w-5 h-5 text-amber-400" /> 
            Pengaturan Koperasi & Struk Belanja
          </h3>
          <p className="text-[11px] text-emerald-500/70 mt-0.5">
            Admin Market hanya berwenang mengubah profil Koperasi yang dicetak di Struk Belanja.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* EDITABLE 1: Nama Koperasi (Tampil di Struk) */}
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-amber-500/30">
            <label className="block text-amber-300 font-bold mb-1 flex items-center justify-between">
              <span>Nama Koperasi (Tampil di Struk) *</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">✓ Akses Market</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Contoh: Koperasi Pesantren Darul Ma'arif"
              className="w-full bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-emerald-400/60 mt-1">
              Nama ini akan dicetak paling atas di Struk Belanja santri.
            </p>
          </div>

          {/* EDITABLE 2: Slogan Koperasi */}
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-amber-500/30">
            <label className="block text-amber-300 font-bold mb-1 flex items-center justify-between">
              <span>Slogan Koperasi (Tampil di Struk)</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">✓ Akses Market</span>
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Contoh: Belanja Berkah, Pondok Kuat, Santri Mandiri!"
              className="w-full bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* EDITABLE 3: Alamat Koperasi */}
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-amber-500/30">
            <label className="block text-amber-300 font-bold mb-1 flex items-center justify-between">
              <span>Alamat Koperasi (Tampil di Struk)</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">✓ Akses Market</span>
            </label>
            <input
              type="text"
              value={koperasiAddress}
              onChange={(e) => setKoperasiAddress(e.target.value)}
              placeholder="Contoh: Gedung Kantin & Koperasi Pesantren Lantai 1"
              className="w-full bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            <LucideIcon name="save" className="w-4 h-4" />
            <span>Simpan Pengaturan Koperasi</span>
          </button>
        </div>
      </div>

      {/* Right Column: Locked Otoritas Kiai & Account Info */}
      <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
        <div className="border-b border-emerald-950 pb-3">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <LucideIcon name="lock" className="w-5 h-5 text-rose-400" />
            Informasi Otoritas Yayasan & Kiai (Terkunci)
          </h3>
          <p className="text-[11px] text-emerald-500/70 mt-0.5">
            Data identitas pesantren hanya dapat diubah melalui Akun Otoritas Kiai / Pengasuh.
          </p>
        </div>

        <div className="space-y-3">
          {/* READ-ONLY 1: Nama Pondok Pesantren */}
          <div>
            <label className="block text-gray-400 font-medium mb-1 flex items-center justify-between">
              <span>Nama Pondok Pesantren</span>
              <span className="text-[9px] bg-red-950/80 text-rose-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono">🔒 Hanya Kiai</span>
            </label>
            <input
              type="text"
              value={pesantrenName}
              disabled
              className="w-full bg-emerald-950/30 border border-emerald-950 rounded-xl px-3 py-2 text-xs text-gray-400 font-semibold cursor-not-allowed select-none opacity-80"
            />
          </div>

          {/* READ-ONLY 2: Nama Pemilik / Pengasuh (Kiai) */}
          <div>
            <label className="block text-gray-400 font-medium mb-1 flex items-center justify-between">
              <span>Nama Pemilik / Pengasuh (Kiai)</span>
              <span className="text-[9px] bg-red-950/80 text-rose-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono">🔒 Hanya Kiai</span>
            </label>
            <input
              type="text"
              value={ownerName}
              disabled
              className="w-full bg-emerald-950/30 border border-emerald-950 rounded-xl px-3 py-2 text-xs text-gray-400 font-semibold cursor-not-allowed select-none opacity-80"
            />
          </div>

          {/* READ-ONLY 3: NIB / Izin Pondok */}
          <div>
            <label className="block text-gray-400 font-medium mb-1 flex items-center justify-between">
              <span>NIB / Izin Pondok Pesantren</span>
              <span className="text-[9px] bg-red-950/80 text-rose-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono">🔒 Hanya Kiai</span>
            </label>
            <input
              type="text"
              value={nibNumber}
              disabled
              className="w-full bg-emerald-950/30 border border-emerald-950 rounded-xl px-3 py-2 text-xs text-gray-400 font-semibold cursor-not-allowed select-none opacity-80"
            />
          </div>

          {/* READ-ONLY 4: Alamat Lengkap Pesantren */}
          <div>
            <label className="block text-gray-400 font-medium mb-1 flex items-center justify-between">
              <span>Alamat Lengkap Pesantren</span>
              <span className="text-[9px] bg-red-950/80 text-rose-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono">🔒 Hanya Kiai</span>
            </label>
            <input
              type="text"
              value={pesantrenAddress}
              disabled
              className="w-full bg-emerald-950/30 border border-emerald-950 rounded-xl px-3 py-2 text-xs text-gray-400 font-semibold cursor-not-allowed select-none opacity-80"
            />
          </div>

          {/* READ-ONLY 5: Nomor WhatsApp Yayasan */}
          <div>
            <label className="block text-gray-400 font-medium mb-1 flex items-center justify-between">
              <span>Nomor WhatsApp Yayasan</span>
              <span className="text-[9px] bg-red-950/80 text-rose-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono">🔒 Hanya Kiai</span>
            </label>
            <input
              type="text"
              value={yayasanPhone}
              disabled
              className="w-full bg-emerald-950/30 border border-emerald-950 rounded-xl px-3 py-2 text-xs text-gray-400 font-semibold cursor-not-allowed select-none opacity-80"
            />
          </div>

          {/* Active Session Info & Maintenance Reset */}
          <div className="pt-3 border-t border-emerald-950/60 mt-4 space-y-3">
            <div className="bg-emerald-950/50 p-3 rounded-xl border border-emerald-900/50 flex justify-between items-center">
              <div>
                <span className="block text-[10px] text-emerald-500 font-semibold">Sesi Pengguna Aktif</span>
                <span className="font-bold text-gray-200 text-xs">
                  {activeUser ? activeUser.nama : "Ummi Halimah"} ({activeUser ? activeUser.role : "Admin Market"})
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <button
              onClick={onResetDb}
              className="w-full py-2 bg-emerald-950/80 hover:bg-red-950/40 text-red-400 border border-red-900/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LucideIcon name="rotate-ccw" className="w-3.5 h-3.5 text-red-400" />
              <span>Reset Database Market Ke Awal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

