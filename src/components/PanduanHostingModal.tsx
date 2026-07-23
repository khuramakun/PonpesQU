import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';

interface PanduanHostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaPesantren?: string;
}

export function PanduanHostingModal({ isOpen, onClose, namaPesantren = "Pondok Pesantren Ponpesqu" }: PanduanHostingModalProps) {
  const [activeMethod, setActiveMethod] = useState<'vercel' | 'cpanel' | 'vps'>('vercel');

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>PANDUAN HOSTING & ONLINE SYSTEM - ${namaPesantren}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; line-height: 1.5; font-size: 11pt; padding: 10px; }
            h1 { font-size: 18pt; color: #047857; border-bottom: 2px solid #d97706; padding-bottom: 6px; margin-bottom: 4px; }
            h2 { font-size: 13pt; color: #0f172a; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            h3 { font-size: 11pt; color: #b45309; margin-top: 12px; margin-bottom: 4px; }
            .subtitle { font-size: 10pt; color: #64748b; margin-bottom: 15px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin: 10px 0; }
            .badge { display: inline-block; background: #d97706; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .step-num { font-weight: bold; color: #047857; margin-right: 4px; }
            code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 10pt; }
            ol, ul { padding-left: 20px; margin-top: 6px; }
            li { margin-bottom: 6px; }
            @media print {
              body { font-size: 10pt; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>PANDUAN CARA HOSTING & ONLINE SISTEM PESANTREN</h1>
          <p class="subtitle">Disusun Khusus Untuk Pengurus & Pengelola Awam ${namaPesantren}</p>
          
          <div class="box">
            <strong>📌 Apa Itu Hosting?</strong><br/>
            Hosting adalah proses meng-online-kan sistem ini ke internet 24 jam non-stop agar Kiai, Yayasan, Wali Santri, Pengajar, dan Kasir bisa mengakses aplikasi dari HP atau Laptop dari mana saja menggunakan domain resmi (misal: <code>www.ponpesqu.com</code>).
          </div>

          <h2>METODE 1: Vercel / Netlify (GRATIS & OTOMATIS) — Paling Direkomendasikan</h2>
          <p>Cocok untuk pemula tanpa biaya bulanan server. Sangat cepat, aman (HTTPS SSL otomatis), dan mudah diupdate.</p>
          <ol>
            <li><span class="step-num">Langkah 1:</span> Buat akun di <code>github.com</code> dan upload kode proyek ini.</li>
            <li><span class="step-num">Langkah 2:</span> Buka <code>vercel.com</code>, buat akun gratis menggunakan GitHub.</li>
            <li><span class="step-num">Langkah 3:</span> Klik <strong>"Add New Project"</strong> → Pilih repository GitHub proyek ini.</li>
            <li><span class="step-num">Langkah 4:</span> Pada menu Framework pilih <strong>Vite</strong>, klik tombol <strong>Deploy</strong>.</li>
            <li><span class="step-num">Langkah 5:</span> Selesai! Web sudah aktif dengan link online gratis dari Vercel.</li>
          </ol>

          <h2>METODE 2: cPanel / Web Hosting Biasa (Shared Hosting)</h2>
          <p>Gunakan jika pesantren sudah memiliki langganan web hosting cPanel (seperti Niagahoster, Rumahweb, DomaiNesia, dll).</p>
          <ol>
            <li><span class="step-num">Langkah 1:</span> Buka terminal di komputer, ketik <code>npm run build</code>.</li>
            <li><span class="step-num">Langkah 2:</span> Buka folder proyek, masuk ke folder <code>dist</code>. Compress semua file di dalam folder <code>dist</code> menjadi <code>dist.zip</code>.</li>
            <li><span class="step-num">Langkah 3:</span> Login ke cPanel web hosting Anda (misal: <code>namapesantren.sch.id/cpanel</code>).</li>
            <li><span class="step-num">Langkah 4:</span> Buka menu <strong>File Manager</strong> → Masuk ke folder <code>public_html</code>.</li>
            <li><span class="step-num">Langkah 5:</span> Upload file <code>dist.zip</code> lalu Klik Kanan & Extrak di dalam <code>public_html</code>.</li>
            <li><span class="step-num">Langkah 6:</span> Buka domain Anda di browser. Web resmi pesantren sudah aktif!</li>
          </ol>

          <h2>MENGHUBUNGKAN DOMAIN PESANTREN (.sch.id / .com)</h2>
          <ul>
            <li>Beli domain di penyedia domain indonesia (contoh: <code>www.ponpesqu.sch.id</code>).</li>
            <li>Atur DNS Name Server atau A Record sesuai petunjuk penyedia hosting/Vercel.</li>
            <li>Tunggu 10 - 30 menit hingga domain terhubung sempurna.</li>
          </ul>

          <div class="box" style="margin-top: 30px; text-align: center;">
            <p><strong>Database Terintegrasi</strong> • Selalu lakukan backup berkala melalui menu Pengaturan Kiai.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="glass-card max-w-4xl w-full rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-5 border-b border-amber-500/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="globe" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-amber-400 leading-tight">
                Panduan Hosting & Web Online (Untuk Awam)
              </h2>
              <p className="text-xs text-emerald-300/80">
                Langkah demi langkah meng-online-kan sistem {namaPesantren} ke internet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="Cetak Panduan Lengkap"
            >
              <LucideIcon name="printer" className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Panduan</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-emerald-900/60 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <LucideIcon name="x" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-gray-200">
          
          {/* Ringkasan Konsep Awam */}
          <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800/60 flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
              <LucideIcon name="help-circle" className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-amber-300 text-sm">Apa itu Hosting & Mengapa Pesantren Membutuhkannya?</h3>
              <p className="text-emerald-300/90 leading-relaxed">
                Secara sederhana, <strong className="text-amber-400">Hosting</strong> adalah menyewa &quot;rumah online&quot; 24 jam untuk aplikasi ini di internet. Tanpa hosting, aplikasi hanya bisa dibuka di laptop operator saja. Dengan hosting, Kiai, Yayasan, Wali Santri, Pengajar, dan Kasir Market bisa membuka sistem ini kapan saja dari HP atau Laptop masing-masing menggunakan alamat web (domain) resmi pesantren.
              </p>
            </div>
          </div>

          {/* Pemilihan Metode Hosting */}
          <div>
            <label className="block text-amber-400 font-extrabold uppercase text-[11px] tracking-wider mb-2">
              Pilih Metode Hosting Yang Ingin Anda Gunakan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => setActiveMethod('vercel')}
                className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  activeMethod === 'vercel'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-500/30'
                    : 'bg-emerald-950/40 border-emerald-900 text-gray-400 hover:bg-emerald-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-amber-300">A. Vercel / Netlify</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">100% GRATIS</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-snug">
                    Paling mudah, otomatis, tanpa biaya bulanan, langsung aktif HTTPS aman.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-400 mt-2 block">⭐ Direkomendasikan Pemula</span>
              </button>

              <button
                onClick={() => setActiveMethod('cpanel')}
                className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  activeMethod === 'cpanel'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-500/30'
                    : 'bg-emerald-950/40 border-emerald-900 text-gray-400 hover:bg-emerald-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-amber-300">B. cPanel Hosting</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">Web Hosting</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-snug">
                    Gunakan jika pesantren sudah punya web cPanel (Niagahoster / Rumahweb / dll).
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-2 block">📁 Upload File Zip</span>
              </button>

              <button
                onClick={() => setActiveMethod('vps')}
                className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  activeMethod === 'vps'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-500/30'
                    : 'bg-emerald-950/40 border-emerald-900 text-gray-400 hover:bg-emerald-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-amber-300">C. Cloud Run / VPS</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">Fullstack</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-snug">
                    Untuk server terpusat Node.js backend dengan database terpisah.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-400 mt-2 block">⚡ Khusus Lanjutan</span>
              </button>
            </div>
          </div>

          {/* DETAIL METODE A: VERCEL */}
          {activeMethod === 'vercel' && (
            <div className="bg-emerald-950/50 p-5 rounded-2xl border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm border-b border-emerald-900 pb-2">
                <LucideIcon name="zap" className="w-5 h-5 text-amber-400" />
                <span>Metode A: Cara Hosting Gratis di Vercel (Langkah demi Langkah)</span>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Unduh & Simpan Kode Proyek (Source Code)</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Pastikan folder proyek aplikasi ini sudah diunduh ke laptop/komputer Anda (berisi folder <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">src</code>, <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">package.json</code>, dan <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">vite.config.ts</code>).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Buat Akun Gratis di GitHub</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      1. Buka website <a href="https://github.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-bold">github.com</a> dari browser.<br/>
                      2. Klik <strong>Sign Up</strong>, masukkan email & buat kata sandi.<br/>
                      3. Buat Repository baru dengan klik tombol hijau <strong>&quot;New Repository&quot;</strong>, beri nama <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">ponpesqu-system</code>, lalu unggah/upload semua file proyek Anda ke sana.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Hubungkan GitHub ke Vercel</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      1. Buka website <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-bold">vercel.com</a>.<br/>
                      2. Pilih <strong>&quot;Continue with GitHub&quot;</strong> untuk login otomatis.<br/>
                      3. Klik tombol hitam <strong>&quot;Add New...&quot;</strong> → Pilih <strong>&quot;Project&quot;</strong>.<br/>
                      4. Pilih repository <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">ponpesqu-system</code> yang dibuat pada Langkah 2.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Klik Deploy & Selesai!</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Pada bagian pengaturan Vercel, pastikan Framework terdeteksi sebagai <strong>Vite</strong>. Klik tombol <strong>&quot;Deploy&quot;</strong>. Tunggu 1 menit, dan selamat! Sistem pesantren Anda sudah ONLINE aktif di internet (misal: <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">https://ponpesqu.vercel.app</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL METODE B: CPANEL */}
          {activeMethod === 'cpanel' && (
            <div className="bg-emerald-950/50 p-5 rounded-2xl border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm border-b border-emerald-900 pb-2">
                <LucideIcon name="folder-archive" className="w-5 h-5 text-amber-400" />
                <span>Metode B: Cara Upload ke Web Hosting cPanel (Biasa Digunakan Pesantren)</span>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Jalankan Perintah Build di Komputer</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Buka Terminal / Command Prompt di laptop Anda, ketik perintah: <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">npm run build</code>.<br/>
                      Proses ini akan menghasilkan satu folder siap pakai bernama <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300 font-bold">dist</code>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Kompres Isi Folder dist Menjadi File Zip</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Buka folder <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">dist</code>, pilih seluruh berkas di dalamnya (<code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">index.html</code>, folder <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">assets</code>, dll), lalu Klik Kanan → <strong>Send to / Compress to ZIP</strong> (beri nama <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">dist.zip</code>).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Login ke cPanel Hosting Pesantren</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Buka browser, masuk ke cPanel hosting Anda (contoh: <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">https://namapesantren.sch.id/cpanel</code>). Masukkan Username & Password cPanel Anda.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3 items-start bg-emerald-900/30 p-3 rounded-xl border border-emerald-800/40">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-100 text-xs">Upload & Ekstrak di public_html</h4>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      1. Buka menu <strong>File Manager</strong> di cPanel.<br/>
                      2. Masuk ke folder <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300 font-bold">public_html</code>.<br/>
                      3. Klik tombol <strong>Upload</strong> di baris atas, upload file <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">dist.zip</code>.<br/>
                      4. Setelah selesai upload, Klik Kanan file <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">dist.zip</code> lalu pilih <strong>Extract</strong>.<br/>
                      5. Buka alamat domain pesantren di browser. Aplikasi siap digunakan!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL METODE C: VPS */}
          {activeMethod === 'vps' && (
            <div className="bg-emerald-950/50 p-5 rounded-2xl border border-blue-500/30 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-extrabold text-sm border-b border-emerald-900 pb-2">
                <LucideIcon name="server" className="w-5 h-5 text-blue-400" />
                <span>Metode C: Hosting Fullstack dengan Cloud Run / Server Node.js Express</span>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-900/50">
                  <h4 className="font-bold text-blue-300 text-xs mb-1">Kapan Menggunakan Metode Ini?</h4>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Gunakan metode ini jika Anda membutuhkan server backend Node.js Express mandiri yang terhubung dengan database cloud terpusat (seperti Cloud SQL PostgreSQL atau Firebase Firestore).
                  </p>
                </div>

                <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-800/40 space-y-2">
                  <h4 className="font-bold text-amber-300 text-xs">Langkah Perintah CLI Server:</h4>
                  <p className="text-[11px] text-emerald-300/90">
                    Jalankan skrip build bundler dan jalankan server produksi di port 3000:
                  </p>
                  <pre className="bg-emerald-950 p-2.5 rounded-lg border border-emerald-900 font-mono text-[10px] text-amber-300 overflow-x-auto">
{`npm run build
NODE_ENV=production npm start`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Panduan Domain Custom */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-500/30 space-y-2">
            <h3 className="font-extrabold text-amber-400 text-xs flex items-center gap-2">
              <LucideIcon name="link" className="w-4 h-4 text-amber-400" />
              <span>Cara Menghubungkan Domain Resmi Pesantren (Contoh: www.ponpesqu.com)</span>
            </h3>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Jika pesantren membeli domain dari penyedia seperti Niagahoster, Rumahweb, atau PANDI (domain <code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">.sch.id</code>):
            </p>
            <ol className="list-decimal list-inside text-[11px] text-emerald-300/90 space-y-1 pl-1">
              <li>Masuk ke Pengaturan DNS (DNS Management) di tempat Anda membeli domain.</li>
              <li>Arahkan <strong>CNAME Record</strong> ke nama server Vercel (<code className="bg-emerald-950 px-1 py-0.5 rounded text-amber-300">cname.vercel-dns.com</code>) atau masukkan <strong>A Record</strong> ke IP Server Hosting Anda.</li>
              <li>Tunggu waktu propagasi sekitar 10–30 menit. Setelah itu domain resmi pesantren Anda langsung aktif!</li>
            </ol>
          </div>

          {/* Tips Perawatan Penting */}
          <div className="bg-emerald-950 p-4 rounded-2xl border border-emerald-800/80 flex items-start gap-3">
            <LucideIcon name="shield-check" className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] space-y-1">
              <span className="font-bold text-emerald-300 block">Saran Penting Setelah Website Online:</span>
              <p className="text-gray-300 leading-relaxed">
                1. Ganti kata sandi Kiai standar (<code className="bg-emerald-900 px-1 py-0.5 rounded text-amber-300">abah123</code>) dari menu Pengaturan.<br/>
                2. Lakukan backup berkala dengan mengunduh database di Panel Kiai.<br/>
                3. Bagikan link website ke grup WhatsApp Wali Santri agar mereka bisa login untuk memantau saku & perkembangan santri.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-emerald-950 p-4 border-t border-emerald-900 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-emerald-500 font-mono">
            {namaPesantren} • Sistem Terintegrasi
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
}
