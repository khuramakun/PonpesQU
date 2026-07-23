import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { K_DB, Santri, PelanggaranSantri, IzinKeamanan, IzinPulang, Perizinan, IzinMerokok } from '../types';
import { LucideIcon } from './LucideIcon';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface KeamananPanelProps {
  db: K_DB;
  activeUser: { nama: string; role: string } | null;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
}

export function KeamananPanel({
  db,
  activeUser,
  syncDbState,
  showToast,
  showConfirm
}: KeamananPanelProps) {
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'izin-khusus' | 'izin-pulang' | 'izin-merokok'>('pelanggaran');

  // --- STUDENT SELECTION (SHARED SCANNER / MANUAL LOOKUP) ---
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // --- VIOLATION FORM STATE ---
  const [violationCategory, setViolationCategory] = useState<'RINGAN' | 'SEDANG' | 'BERAT'>('RINGAN');
  const [violationDetail, setViolationDetail] = useState('');
  const [violationPunishment, setViolationPunishment] = useState('');

  // --- SPECIAL ALLOWANCE FORM STATE ---
  const [allowanceType, setAllowanceType] = useState<'JAJAN' | 'BELANJA'>('JAJAN');
  const [allowanceAmount, setAllowanceAmount] = useState<number | ''>('');
  const [isNoLimit, setIsNoLimit] = useState(false);
  const [allowanceReason, setAllowanceReason] = useState('');

  // --- IZIN PULANG FORM STATE ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const [leaveStartDate, setLeaveStartDate] = useState(todayStr);
  const [leaveEndDate, setLeaveEndDate] = useState(todayStr);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveEscort, setLeaveEscort] = useState('');

  // --- IZIN MEROKOK FORM STATE ---
  const [smokingAge, setSmokingAge] = useState<number | ''>(18);
  const [smokingLetterNo, setSmokingLetterNo] = useState(`SK-IM/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
  const [smokingStartDate, setSmokingStartDate] = useState(todayStr);
  const [smokingExpiry, setSmokingExpiry] = useState(`1 Tahun (31 Des ${new Date().getFullYear()})`);
  const [smokingTtdOrangtua, setSmokingTtdOrangtua] = useState(true);
  const [smokingTtdKeamanan, setSmokingTtdKeamanan] = useState(true);
  const [smokingTtdKiai, setSmokingTtdKiai] = useState(true);
  const [smokingReason, setSmokingReason] = useState('Memenuhi kriteria usia (>=17 tahun), rekomendasi Kiai, dan izin tertulis Orang Tua.');

  const [searchIzinMerokok, setSearchIzinMerokok] = useState('');
  const [filterIzinMerokokStatus, setFilterIzinMerokokStatus] = useState<'ALL' | 'AKTIF' | 'MENUNGGU_TTD' | 'DITOLAK' | 'DICABUT'>('ALL');

  // --- HISTORIC FILTERS ---
  const [searchViolations, setSearchViolations] = useState('');
  const [filterViolationCategory, setFilterViolationCategory] = useState<'ALL' | 'RINGAN' | 'SEDANG' | 'BERAT'>('ALL');
  const [violationStartDate, setViolationStartDate] = useState('');
  const [violationEndDate, setViolationEndDate] = useState('');

  const [searchAllowances, setSearchAllowances] = useState('');
  const [filterAllowanceType, setFilterAllowanceType] = useState<'ALL' | 'JAJAN' | 'BELANJA'>('ALL');
  const [allowanceStartDate, setAllowanceStartDate] = useState('');
  const [allowanceEndDate, setAllowanceEndDate] = useState('');

  const [searchIzinPulang, setSearchIzinPulang] = useState('');
  const [filterIzinPulangStatus, setFilterIzinPulangStatus] = useState<'ALL' | 'DISETUJUI' | 'TERLAMBAT' | 'KEMBALI' | 'MENUNGGU' | 'DITOLAK'>('ALL');
  const [izinPulangStartDate, setIzinPulangStartDate] = useState('');
  const [izinPulangEndDate, setIzinPulangEndDate] = useState('');

  // --- AUTOMATIC OVERDUE LEAVE DETECTION ---
  const overdueIzinList = React.useMemo(() => {
    return (db.izin_pulang || []).filter(item => {
      return item.status === 'DISETUJUI' && item.tanggal_kembali < todayStr;
    });
  }, [db.izin_pulang, todayStr]);

  // --- AUTOMATIC PENDING LEAVE REQUESTS FROM SANTRI/WALI PORTAL ---
  const pendingIzinList = React.useMemo(() => {
    return (db.izin_pulang || []).filter(item => item.status === 'MENUNGGU');
  }, [db.izin_pulang]);

  const handleApprovePendingIzin = (item: IzinPulang) => {
    showConfirm(`Setujui permohonan izin pulang untuk ${item.nama_santri} (${item.tanggal_keluar} s/d ${item.tanggal_kembali})? Presensi Kelas & Sholat Jamaah akan otomatis diset IZIN.`, async (yes) => {
      if (yes) {
        // Compute array of dates in range
        const datesInRange: string[] = [];
        let curr = new Date(item.tanggal_keluar);
        const end = new Date(item.tanggal_kembali);
        curr.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        while (curr <= end) {
          datesInRange.push(curr.toISOString().slice(0, 10));
          curr.setDate(curr.getDate() + 1);
        }

        // Auto update/insert Absensi Kelas
        const updatedAbsensiKelas = [...(db.absensi_kelas || [])];
        datesInRange.forEach(dStr => {
          const existingIdx = updatedAbsensiKelas.findIndex(
            a => a.tanggal === dStr && a.id_santri === item.id_santri
          );
          if (existingIdx > -1) {
            updatedAbsensiKelas[existingIdx] = {
              ...updatedAbsensiKelas[existingIdx],
              status: 'IZIN'
            };
          } else {
            updatedAbsensiKelas.push({
              tanggal: dStr,
              kelas: item.kelas,
              id_santri: item.id_santri,
              status: 'IZIN',
              locked: false
            });
          }
        });

        // Auto update/insert Absensi Sholat
        const updatedAbsensiSholat = [...(db.absensi_sholat || [])];
        const sholatList = db.sholat_rules || [
          { id_sholat: 'SLT-001', nama: 'Sholat SUBUH', tipe: 'WAJIB', waktu: '04:35', toleransi: 15 },
          { id_sholat: 'SLT-002', nama: 'Sholat DZUHUR', tipe: 'WAJIB', waktu: '12:05', toleransi: 15 },
          { id_sholat: 'SLT-003', nama: 'Sholat ASHAR', tipe: 'WAJIB', waktu: '15:25', toleransi: 15 }
        ];

        datesInRange.forEach(dStr => {
          sholatList.forEach(rule => {
            const existingIdx = updatedAbsensiSholat.findIndex(
              a => a.tanggal === dStr && a.sholat === rule.id_sholat && a.id_santri === item.id_santri
            );
            if (existingIdx > -1) {
              updatedAbsensiSholat[existingIdx] = {
                ...updatedAbsensiSholat[existingIdx],
                status: 'IZIN'
              };
            } else {
              updatedAbsensiSholat.push({
                tanggal: dStr,
                sholat: rule.id_sholat,
                id_santri: item.id_santri,
                status: 'IZIN',
                locked: false
              });
            }
          });
        });

        // Update izin_pulang status
        const updatedIzinList = (db.izin_pulang || []).map(i => 
          i.id_izin_pulang === item.id_izin_pulang ? {
            ...i,
            status: 'DISETUJUI' as const,
            dicatat_oleh: activeUser?.nama ? `${activeUser.nama} (Pos Keamanan)` : 'Pos Keamanan (Approval)'
          } : i
        );

        // Update or add perizinan
        const updatedPerizinan = [...(db.perizinan || [])];
        const pIdx = updatedPerizinan.findIndex(p => p.id_santri === item.id_santri && p.tanggal_mulai === item.tanggal_keluar);
        if (pIdx > -1) {
          updatedPerizinan[pIdx] = { ...updatedPerizinan[pIdx], status: 'DISETUJUI' };
        } else {
          updatedPerizinan.unshift({
            id_izin: `IZN-${Date.now().toString().slice(-4)}`,
            id_santri: item.id_santri,
            tipe: 'IZIN',
            tanggal_mulai: item.tanggal_keluar,
            tanggal_selesai: item.tanggal_kembali,
            keterangan: `Izin Pulang (Disetujui Pos Keamanan): ${item.alasan}`,
            status: 'DISETUJUI'
          });
        }

        const updatedDb: K_DB = {
          ...db,
          izin_pulang: updatedIzinList,
          perizinan: updatedPerizinan,
          absensi_kelas: updatedAbsensiKelas,
          absensi_sholat: updatedAbsensiSholat
        };

        await syncDbState(updatedDb);
        showToast(`✓ Permohonan izin pulang ${item.nama_santri} berhasil DISETUJUI! Presensi otomatis diset IZIN.`, 'success');
      }
    });
  };

  const handleRejectPendingIzin = (item: IzinPulang) => {
    showConfirm(`Tolak permohonan izin pulang untuk ${item.nama_santri}?`, async (yes) => {
      if (yes) {
        const updatedIzinList = (db.izin_pulang || []).map(i => 
          i.id_izin_pulang === item.id_izin_pulang ? {
            ...i,
            status: 'DITOLAK' as const,
            dicatat_oleh: activeUser?.nama ? `${activeUser.nama} (Ditolak)` : 'Pos Keamanan (Ditolak)'
          } : i
        );
        await syncDbState({ ...db, izin_pulang: updatedIzinList });
        showToast(`Permohonan izin pulang ${item.nama_santri} telah DITOLAK.`, 'info');
      }
    });
  };

  const handleConfirmReturnOverdue = (item: IzinPulang) => {
    showConfirm(`Konfirmasi santri ${item.nama_santri} telah kembali ke pondok?`, async (yes) => {
      if (yes) {
        const updatedList = (db.izin_pulang || []).map(i => 
          i.id_izin_pulang === item.id_izin_pulang ? { ...i, status: 'KEMBALI' as const } : i
        );
        await syncDbState({ ...db, izin_pulang: updatedList });
        showToast(`✓ Santri ${item.nama_santri} telah dikonfirmasi KEMBALI!`, 'success');
      }
    });
  };

  const handleCatatPelanggaranOverdue = (item: IzinPulang) => {
    const s = db.santri.find(x => x.id_santri === item.id_santri);
    if (s) {
      setSelectedSantri(s);
    } else {
      setSelectedSantri({
        id_santri: item.id_santri,
        nama_santri: item.nama_santri,
        kelas: item.kelas,
        pass: 'santri123',
        status_aktif: true,
        saldo_utama: 0,
        limit_jajan_harian: 15000,
        limit_belanja_harian: 50000,
        barcode: 'BC-' + item.id_santri
      });
    }
    setActiveTab('pelanggaran');
    setViolationCategory('SEDANG');
    setViolationDetail(`Terlambat kembali dari izin pulang. Batas kembali: ${item.tanggal_kembali}, namun hingga ${todayStr} belum melapor.`);
    setViolationPunishment('Sanksi Takzir Kebersihan & Panggilan Wali');
    showToast(`Form takzir pelanggaran telah diisi untuk ${item.nama_santri}`, 'info');
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const handleSelectSantri = (s: Santri) => {
    setSelectedSantri(s);
    setSearchQuery('');
    setShowDropdown(false);
    showToast(`✓ Santri ${s.nama_santri} berhasil dimuat!`, 'success');
  };

  const handleRemoveSelectedSantri = () => {
    setSelectedSantri(null);
  };

  // --- 1. RECORD VIOLATION SUBMIT ---
  const handleSubmitViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    if (!violationDetail.trim()) {
      showToast('Detail pelanggaran tidak boleh kosong!', 'error');
      return;
    }
    if (!violationPunishment.trim()) {
      showToast('Keterangan hukuman wajib diisi!', 'error');
      return;
    }

    const confirmMsg = `Catat pelanggaran ${violationCategory} untuk santri ${selectedSantri.nama_santri}?`;
    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const today = new Date().toISOString().slice(0, 10);
        const newViolation: PelanggaranSantri = {
          id_pelanggaran: `PLG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          kategori: violationCategory,
          detail_pelanggaran: violationDetail.trim(),
          hukuman: violationPunishment.trim(),
          tanggal: today,
          dicatat_oleh: activeUser?.nama || 'Admin Keamanan'
        };

        const updatedDb = {
          ...db,
          pelanggaran_santri: [newViolation, ...(db.pelanggaran_santri || [])]
        };

        await syncDbState(updatedDb);
        showToast(`✓ Pelanggaran ${selectedSantri.nama_santri} berhasil dicatat!`, 'success');

        // Reset Form
        setViolationDetail('');
        setViolationPunishment('');
        setSelectedSantri(null);
      }
    });
  };

  // --- 2. RECORD SPECIAL ALLOWANCE SUBMIT ---
  const handleSubmitAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    if (!isNoLimit && (allowanceAmount === '' || Number(allowanceAmount) <= 0)) {
      showToast('Tentukan nominal izin belanja/jajan yang disetujui!', 'error');
      return;
    }
    if (!allowanceReason.trim()) {
      showToast('Berikan alasan/keterangan pemberian izin khusus!', 'error');
      return;
    }

    const finalAmount = isNoLimit ? 9999999 : Number(allowanceAmount);
    const labelNominal = isNoLimit ? 'NO LIMIT' : formatRupiah(finalAmount);
    const confirmMsg = `Berikan Izin ${allowanceType} sebesar ${labelNominal} untuk ${selectedSantri.nama_santri} hari ini?`;

    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const today = new Date().toISOString().slice(0, 10);
        
        // Remove existing active izin of same type for this student today
        const clearedIzinList = (db.izin_keamanan || []).filter(
          iz => !(iz.id_santri === selectedSantri.id_santri && iz.tipe_izin === allowanceType && iz.tanggal === today)
        );

        const newAllowance: IzinKeamanan = {
          id_izin_khusus: `IZK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          tipe_izin: allowanceType,
          nominal_disetujui: finalAmount,
          is_no_limit: isNoLimit,
          tanggal: today,
          keterangan: allowanceReason.trim(),
          dicatat_oleh: activeUser?.nama || 'Admin Keamanan'
        };

        const updatedDb = {
          ...db,
          izin_keamanan: [newAllowance, ...clearedIzinList]
        };

        await syncDbState(updatedDb);
        showToast(`✓ Izin khusus berhasil diberikan untuk ${selectedSantri.nama_santri}!`, 'success');

        // Reset Form
        setAllowanceAmount('');
        setIsNoLimit(false);
        setAllowanceReason('');
        setSelectedSantri(null);
      }
    });
  };

  // --- 3. RECORD IZIN PULANG SUBMIT (AUTO SYNC TO ABSENSI KELAS & SHOLAT) ---
  const handleSubmitIzinPulang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    if (!leaveStartDate || !leaveEndDate) {
      showToast('Isi tanggal keluar dan rencana kembali!', 'error');
      return;
    }
    if (leaveEndDate < leaveStartDate) {
      showToast('Tanggal kembali tidak boleh lebih awal dari tanggal keluar!', 'error');
      return;
    }
    if (!leaveReason.trim()) {
      showToast('Alasan izin pulang wajib diisi!', 'error');
      return;
    }

    const confirmMsg = `Izinkan ${selectedSantri.nama_santri} pulang (${leaveStartDate} s/d ${leaveEndDate})? Presensi Kelas dan Sholat Jamaah akan otomatis terisi IZIN.`;

    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const today = new Date().toISOString().slice(0, 10);
        const newIzinPulang: IzinPulang = {
          id_izin_pulang: `IZP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          tanggal_keluar: leaveStartDate,
          tanggal_kembali: leaveEndDate,
          alasan: leaveReason.trim(),
          penjemput: leaveEscort.trim() || 'Wali Santri',
          status: 'DISETUJUI',
          dicatat_oleh: activeUser?.nama || 'Admin Keamanan',
          tanggal_dicatat: today
        };

        // Also add to perizinan for general records
        const newPerizinan: Perizinan = {
          id_izin: `IZN-${Date.now().toString().slice(-4)}`,
          id_santri: selectedSantri.id_santri,
          tipe: 'IZIN',
          tanggal_mulai: leaveStartDate,
          tanggal_selesai: leaveEndDate,
          keterangan: `Izin Pulang (Keamanan): ${leaveReason.trim()} [Penjemput: ${leaveEscort.trim() || 'Wali'}]`,
          status: 'DISETUJUI'
        };

        // Compute array of dates in range
        const datesInRange: string[] = [];
        let curr = new Date(leaveStartDate);
        const end = new Date(leaveEndDate);
        curr.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        while (curr <= end) {
          datesInRange.push(curr.toISOString().slice(0, 10));
          curr.setDate(curr.getDate() + 1);
        }

        // Auto update/insert Absensi Kelas
        const updatedAbsensiKelas = [...(db.absensi_kelas || [])];
        datesInRange.forEach(dStr => {
          const existingIdx = updatedAbsensiKelas.findIndex(
            a => a.tanggal === dStr && a.id_santri === selectedSantri.id_santri
          );
          if (existingIdx > -1) {
            updatedAbsensiKelas[existingIdx] = {
              ...updatedAbsensiKelas[existingIdx],
              status: 'IZIN'
            };
          } else {
            updatedAbsensiKelas.push({
              tanggal: dStr,
              kelas: selectedSantri.kelas,
              id_santri: selectedSantri.id_santri,
              status: 'IZIN',
              locked: false
            });
          }
        });

        // Auto update/insert Absensi Sholat
        const updatedAbsensiSholat = [...(db.absensi_sholat || [])];
        const sholatList = db.sholat_rules || [
          { id_sholat: 'SLT-001', nama: 'Sholat SUBUH', tipe: 'WAJIB', waktu: '04:35', toleransi: 15 },
          { id_sholat: 'SLT-002', nama: 'Sholat DZUHUR', tipe: 'WAJIB', waktu: '12:05', toleransi: 15 },
          { id_sholat: 'SLT-003', nama: 'Sholat ASHAR', tipe: 'WAJIB', waktu: '15:25', toleransi: 15 }
        ];

        datesInRange.forEach(dStr => {
          sholatList.forEach(rule => {
            const existingIdx = updatedAbsensiSholat.findIndex(
              a => a.tanggal === dStr && a.sholat === rule.id_sholat && a.id_santri === selectedSantri.id_santri
            );
            if (existingIdx > -1) {
              updatedAbsensiSholat[existingIdx] = {
                ...updatedAbsensiSholat[existingIdx],
                status: 'IZIN'
              };
            } else {
              updatedAbsensiSholat.push({
                tanggal: dStr,
                sholat: rule.id_sholat,
                id_santri: selectedSantri.id_santri,
                status: 'IZIN',
                locked: false
              });
            }
          });
        });

        const updatedDb: K_DB = {
          ...db,
          izin_pulang: [newIzinPulang, ...(db.izin_pulang || [])],
          perizinan: [newPerizinan, ...(db.perizinan || [])],
          absensi_kelas: updatedAbsensiKelas,
          absensi_sholat: updatedAbsensiSholat
        };

        await syncDbState(updatedDb);
        showToast(`✓ Izin pulang berhasil diterbitkan! Status ${selectedSantri.nama_santri} otomatis diset IZIN di Absensi Kelas & Sholat Jamaah (${datesInRange.length} hari).`, 'success');

        // Reset form
        setLeaveReason('');
        setLeaveEscort('');
        setSelectedSantri(null);
      }
    });
  };

  const handleMarkReturned = (id: string, name: string) => {
    showConfirm(`Konfirmasi santri ${name} telah KEMBALI ke pondok?`, async (yes) => {
      if (yes) {
        const updatedList = (db.izin_pulang || []).map(item => {
          if (item.id_izin_pulang === id) {
            return { ...item, status: 'KEMBALI' as const };
          }
          return item;
        });
        await syncDbState({ ...db, izin_pulang: updatedList });
        showToast(`✓ Santri ${name} telah ditandai kembali ke pondok.`, 'success');
      }
    });
  };

  const handleDeleteIzinPulang = (id: string, name: string) => {
    showConfirm(`Hapus data izin pulang untuk ${name}?`, async (yes) => {
      if (yes) {
        const filtered = (db.izin_pulang || []).filter(i => i.id_izin_pulang !== id);
        await syncDbState({ ...db, izin_pulang: filtered });
        showToast('Catatan izin pulang berhasil dihapus.', 'info');
      }
    });
  };

  // --- 4. RECORD IZIN MEROKOK SUBMIT (MIN 17 TAHUN & 3-WAY APPROVAL) ---
  const handleSubmitIzinMerokok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    const ageNum = Number(smokingAge);
    if (!ageNum || ageNum < 17) {
      showToast(`❌ Ditolak! Usia santri (${ageNum || 0} tahun) di bawah syarat minimal 17 tahun.`, 'error');
      return;
    }

    const isAllApproved = smokingTtdOrangtua && smokingTtdKeamanan && smokingTtdKiai;
    const initialStatus = isAllApproved ? 'AKTIF' : 'MENUNGGU_TTD';

    const confirmMsg = `Terbitkan perizinan merokok untuk ${selectedSantri.nama_santri} (${ageNum} Thn)? Status: ${initialStatus}`;

    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const newIzinMerokok: IzinMerokok = {
          id_izin_merokok: `IM-${Date.now().toString().slice(-6)}`,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          umur: ageNum,
          nomor_surat: smokingLetterNo.trim() || `SK-IM/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
          tanggal_izin: smokingStartDate,
          masa_berlaku: smokingExpiry.trim() || '1 Tahun',
          ttd_orangtua: smokingTtdOrangtua,
          ttd_keamanan: smokingTtdKeamanan,
          ttd_kiai: smokingTtdKiai,
          status_izin: initialStatus,
          keterangan: smokingReason.trim(),
          dicatat_oleh: activeUser?.nama || 'Pos Keamanan',
          tanggal_dicatat: todayStr
        };

        const updatedDb: K_DB = {
          ...db,
          izin_merokok: [newIzinMerokok, ...(db.izin_merokok || [])]
        };

        await syncDbState(updatedDb);
        showToast(`✓ Data perizinan merokok ${selectedSantri.nama_santri} berhasil ditambahkan!`, 'success');

        // Reset form
        setSelectedSantri(null);
        setSmokingLetterNo(`SK-IM/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
      }
    });
  };

  const handleToggleTtd = async (item: IzinMerokok, type: 'orangtua' | 'keamanan' | 'kiai') => {
    const updatedList = (db.izin_merokok || []).map(i => {
      if (i.id_izin_merokok === item.id_izin_merokok) {
        const newOrtu = type === 'orangtua' ? !i.ttd_orangtua : i.ttd_orangtua;
        const newKeamanan = type === 'keamanan' ? !i.ttd_keamanan : i.ttd_keamanan;
        const newKiai = type === 'kiai' ? !i.ttd_kiai : i.ttd_kiai;
        const isAllApproved = newOrtu && newKeamanan && newKiai;
        return {
          ...i,
          ttd_orangtua: newOrtu,
          ttd_keamanan: newKeamanan,
          ttd_kiai: newKiai,
          status_izin: isAllApproved ? ('AKTIF' as const) : ('MENUNGGU_TTD' as const)
        };
      }
      return i;
    });
    await syncDbState({ ...db, izin_merokok: updatedList });
    showToast('Status persetujuan/TTD berhasil diperbarui!', 'success');
  };

  const handleRevokeIzinMerokok = (item: IzinMerokok) => {
    showConfirm(`Cabut izin merokok untuk ${item.nama_santri}? Status izin akan diubah menjadi DICABUT.`, async (yes) => {
      if (yes) {
        const updatedList = (db.izin_merokok || []).map(i =>
          i.id_izin_merokok === item.id_izin_merokok ? { ...i, status_izin: 'DICABUT' as const } : i
        );
        await syncDbState({ ...db, izin_merokok: updatedList });
        showToast(`Izin merokok ${item.nama_santri} telah DICABUT.`, 'info');
      }
    });
  };

  const handleDeleteIzinMerokok = (id: string, name: string) => {
    showConfirm(`Hapus permanent data izin merokok untuk ${name}?`, async (yes) => {
      if (yes) {
        const filtered = (db.izin_merokok || []).filter(i => i.id_izin_merokok !== id);
        await syncDbState({ ...db, izin_merokok: filtered });
        showToast('Data perizinan merokok berhasil dihapus.', 'info');
      }
    });
  };

  const handlePrintSuratPermohonanMerokok = (item: IzinMerokok) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pesName = db.settings?.nama_pesantren || 'PONDOK PESANTREN PONPESQU';

    printWindow.document.write(`
      <html>
        <head>
          <title>SURAT PERMOHONAN & PERIZINAN MEROKOK - ${item.nama_santri}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Times New Roman', Times, serif; padding: 15px; color: #000; max-width: 800px; margin: 0 auto; line-height: 1.4; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header h3 { margin: 3px 0; font-size: 13px; font-weight: normal; }
            .header p { margin: 0; font-size: 11px; font-style: italic; color: #333; }
            .title { text-align: center; font-size: 15px; font-weight: bold; text-decoration: underline; margin: 15px 0 5px 0; text-transform: uppercase; }
            .doc-num { text-align: center; font-size: 12px; margin-bottom: 15px; font-family: monospace; }
            table.info { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
            table.info td { padding: 5px 8px; vertical-align: top; }
            .rules-box { border: 1px solid #000; padding: 12px 15px; font-size: 11px; margin: 15px 0; background: #f9fafb; }
            .signatures { margin-top: 30px; width: 100%; display: table; }
            .sig-col { display: table-cell; width: 33.33%; text-align: center; font-size: 11px; vertical-align: top; }
            .sig-space { height: 60px; }
            .check-badge { display: inline-block; font-size: 10px; padding: 2px 6px; border: 1px solid #000; font-weight: bold; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>POS KEAMANAN & DEWAN PENGASUH</h2>
            <h3>${pesName}</h3>
            <p>JL. Pesantren No. 01, Jembrana, Bali • Telp: +62 852-2334-4555</p>
          </div>

          <div class="title">SURAT PERMOHONAN & REKOMENDASI IZIN MEROKOK SANTRI</div>
          <div class="doc-num">Nomor SK: ${item.nomor_surat}</div>

          <p style="font-size: 12px;">Yang bertanda tangan di bawah ini menerangkan permohonan izin merokok untuk santri:</p>

          <table class="info">
            <tr>
              <td width="30%"><strong>Nama Lengkap Santri</strong></td>
              <td width="5%">:</td>
              <td width="65%"><strong>${item.nama_santri}</strong></td>
            </tr>
            <tr>
              <td><strong>NIS / ID Santri</strong></td>
              <td>:</td>
              <td>${item.id_santri}</td>
            </tr>
            <tr>
              <td><strong>Kelas / Asrama</strong></td>
              <td>:</td>
              <td>${item.kelas}</td>
            </tr>
            <tr>
              <td><strong>Usia / Umur Santri</strong></td>
              <td>:</td>
              <td><strong>${item.umur} Tahun</strong> (Ketentuan Syarat Minimal: ≥ 17 Tahun)</td>
            </tr>
            <tr>
              <td><strong>Tanggal Diterbitkan</strong></td>
              <td>:</td>
              <td>${item.tanggal_izin}</td>
            </tr>
            <tr>
              <td><strong>Masa Berlaku</strong></td>
              <td>:</td>
              <td><strong>${item.masa_berlaku}</strong></td>
            </tr>
            <tr>
              <td><strong>Catatan / Keterangan</strong></td>
              <td>:</td>
              <td>${item.keterangan || 'Rekomendasi tertulis dari Wali dan Kiai'}</td>
            </tr>
          </table>

          <div class="rules-box">
            <strong>TATA TERTIB & KETENTUAN KHUSUS IZIN MEROKOK:</strong>
            <ol style="margin: 5px 0 0 18px; padding: 0;">
              <li>Hanya diperbolehkan merokok di <strong>Area Khusus Merokok (Smoking Area)</strong> yang ditentukan oleh Pos Keamanan.</li>
              <li>Dilarang merokok pada saat jam Kegiatan Belajar Mengajar (KBM), Pengajian Kitab, dan Jamaah Sholat.</li>
              <li>Dilarang keras membuang puntung rokok sembarangan dan wajib menjaga kebersihan lingkungan pondok.</li>
              <li>Kartu Izin Merokok Wajib dibawa dan ditunjukkan jika dilakukan penertiban oleh Tim Keamanan.</li>
              <li>Izin ini dapat dicabut sewaktu-waktu apabila santri melanggar tata tertib pesantren.</li>
            </ol>
          </div>

          <p style="font-size: 11px; text-align: justify;">Demikian Surat Permohonan & Rekomendasi Izin Merokok ini dibuat dengan persetujuan 3 (tiga) pihak: Orang Tua/Wali Santri, Divisi Keamanan, dan Pengasuh Pondok Pesantren.</p>

          <!-- SIGNATURES 3 ENTITIES -->
          <div class="signatures">
            <div class="sig-col">
              Orang Tua / Wali Santri,<br>
              <div class="sig-space"></div>
              ( _______________________ )<br>
              <span class="check-badge">${item.ttd_orangtua ? '✓ DISETUJUI WALI' : '⏳ BELUM TTD'}</span>
            </div>
            <div class="sig-col">
              Divisi Keamanan,<br>
              <div class="sig-space"></div>
              ( <strong>${item.dicatat_oleh}</strong> )<br>
              <span class="check-badge">${item.ttd_keamanan ? '✓ DISETUJUI KEAMANAN' : '⏳ BELUM TTD'}</span>
            </div>
            <div class="sig-col">
              Mengetahui,<br>
              <strong>Kiai / Pengasuh Pondok</strong><br>
              <div class="sig-space"></div>
              ( <strong>${db.settings?.owner_name || 'KH. Achmad Hidayatullah'}</strong> )<br>
              <span class="check-badge">${item.ttd_kiai ? '✓ DISETUJUI KIAI' : '⏳ BELUM TTD'}</span>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintKartuIzinMerokok = (item: IzinMerokok) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const santriObj = db.santri.find(s => s.id_santri === item.id_santri);
    const photoUrl = santriObj?.foto_profil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop';
    const pesName = db.settings?.nama_pesantren || 'PONDOK PESANTREN PONPESQU';

    printWindow.document.write(`
      <html>
        <head>
          <title>KARTU IZIN MEROKOK RESMI - ${item.nama_santri}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: #f1f5f9;
              margin: 0;
              padding: 30px 15px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .card-wrapper {
              width: 490px;
              background: #ffffff;
              border: 3px solid #047857;
              outline: 2px solid #d97706;
              border-radius: 16px;
              padding: 0;
              color: #0f172a;
              box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
              position: relative;
              overflow: hidden;
            }
            .card-header {
              background: linear-gradient(135deg, #022c22 0%, #064e3b 60%, #047857 100%);
              color: #ffffff;
              text-align: center;
              padding: 12px 16px 10px 16px;
              border-bottom: 3px solid #d97706;
            }
            .card-header h2 {
              margin: 0;
              font-size: 11px;
              color: #fef08a;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              font-weight: 800;
            }
            .card-header h1 {
              margin: 3px 0 0 0;
              font-size: 18px;
              color: #ffffff;
              font-weight: 900;
              letter-spacing: 1px;
            }
            .card-body {
              padding: 16px 18px 12px 18px;
              display: flex;
              gap: 16px;
              align-items: center;
              background: #ffffff;
            }
            .photo-frame {
              width: 130px;
              height: 165px;
              border: 3px solid #d97706;
              border-radius: 10px;
              overflow: hidden;
              background: #f8fafc;
              flex-shrink: 0;
              box-shadow: 0 3px 8px rgba(0,0,0,0.2);
            }
            .photo-frame img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .santri-info {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            .santri-name {
              font-size: 17px;
              font-weight: 900;
              color: #064e3b;
              line-height: 1.2;
              border-bottom: 2px solid #d1fae5;
              padding-bottom: 5px;
              margin-bottom: 4px;
            }
            .info-row {
              font-size: 11px;
              color: #0f172a;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 2px 0;
            }
            .info-label {
              color: #475569;
              font-weight: 700;
            }
            .info-val {
              font-weight: 800;
              color: #0f172a;
            }
            .age-tag {
              color: #92400e;
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 1px 6px;
              border-radius: 4px;
              font-weight: 800;
            }
            .badge-status {
              margin-top: 8px;
              background: #047857;
              color: #ffffff;
              font-weight: 900;
              font-size: 10px;
              text-align: center;
              padding: 5px 8px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #065f46;
            }
            .card-footer {
              padding: 10px 18px 12px 18px;
              background: #f8fafc;
              border-top: 1px dashed #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .barcode-box {
              background: #ffffff;
              padding: 4px 10px;
              border-radius: 5px;
              border: 1.5px solid #000000;
              color: #000000;
              font-family: 'Courier New', Courier, monospace;
              font-weight: bold;
              font-size: 11px;
              text-align: center;
              letter-spacing: 1px;
            }
            .notice {
              font-size: 8.5px;
              color: #334155;
              font-style: italic;
              max-width: 230px;
              line-height: 1.3;
              font-weight: 600;
            }
            @media print {
              body {
                background: #ffffff !important;
                padding: 0 !important;
              }
              .card-wrapper {
                box-shadow: none !important;
                margin: 0 auto !important;
                border: 3px solid #047857 !important;
                outline: 2px solid #d97706 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="card-wrapper">
            <div class="card-header">
              <h2>${pesName}</h2>
              <h1>KARTU IZIN MEROKOK RESMI</h1>
            </div>
            <div class="card-body">
              <div class="photo-frame">
                <img src="${photoUrl}" alt="${item.nama_santri}" onerror="this.src='https://placehold.co/150x180/000000/ffffff?text=FOTO+SANTRI'" />
              </div>
              <div class="santri-info">
                <div class="santri-name">${item.nama_santri}</div>
                <div class="info-row"><span class="info-label">NIS / ID:</span> <span class="info-val">${item.id_santri}</span></div>
                <div class="info-row"><span class="info-label">Kelas / Kamar:</span> <span class="info-val">${item.kelas}</span></div>
                <div class="info-row"><span class="info-label">Usia Santri:</span> <span class="age-tag">${item.umur} Tahun (≥ 17 Thn)</span></div>
                <div class="info-row"><span class="info-label">No. SK Izin:</span> <span class="info-val">${item.nomor_surat}</span></div>
                <div class="info-row"><span class="info-label">Masa Berlaku:</span> <span class="info-val">${item.masa_berlaku}</span></div>
                <div class="badge-status">
                  ✓ DISETUJUI ORTU, KEAMANAN & KIAI
                </div>
              </div>
            </div>
            <div class="card-footer">
              <div class="barcode-box">
                |||||||||||||||||||||||||<br>
                ${item.id_santri}
              </div>
              <div class="notice">
                * Kartu ini wajib ditunjukkan saat berada di area khusus merokok. Kartu ini sah tanpa tanda tangan basah karena terdaftar resmi di database Pos Keamanan.
              </div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintSuratIzinPulang = (item: IzinPulang) => {
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

  const handlePrintIzinPulangList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = (db.izin_pulang || []).filter(i => {
      const matchesSearch = i.nama_santri.toLowerCase().includes(searchIzinPulang.toLowerCase()) || i.kelas.toLowerCase().includes(searchIzinPulang.toLowerCase());
      const matchesStatus = filterIzinPulangStatus === 'ALL' || i.status === filterIzinPulangStatus;
      const matchesStart = izinPulangStartDate ? i.tanggal_keluar >= izinPulangStartDate : true;
      const matchesEnd = izinPulangEndDate ? i.tanggal_kembali <= izinPulangEndDate : true;
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });

    let tableRows = '';
    filtered.forEach((i, index) => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${i.nama_santri}</strong><br><small>${i.kelas}</small></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i.tanggal_keluar} s/d ${i.tanggal_kembali}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${i.alasan}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${i.penjemput || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><strong>${i.status}</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;"><small>${i.dicatat_oleh}</small></td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>LAPORAN REKAP IZIN PULANG SANTRI</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            h2 { text-align: center; font-size: 12px; font-weight: normal; margin-top: 0; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { border: 1px solid #ddd; padding: 8px; background-color: #f7fafc; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <h1>LAPORAN REKAP IZIN PULANG SANTRI</h1>
          <h2>Pesantren PonpesQu - Dicetak pada ${new Date().toLocaleDateString('id-ID')}</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">No</th>
                <th>Santri & Kelas</th>
                <th style="text-align: center;">Periode Izin</th>
                <th>Alasan / Keperluan</th>
                <th>Penjemput</th>
                <th style="text-align: center;">Status</th>
                <th>Petugas Keamanan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">Tidak ada data izin pulang yang sesuai filter.</td></tr>'}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- DELETE OPERATORS ---
  const handleDeleteViolation = (id: string, name: string) => {
    showConfirm(`Hapus catatan pelanggaran untuk ${name}?`, async (yes) => {
      if (yes) {
        const filtered = (db.pelanggaran_santri || []).filter(v => v.id_pelanggaran !== id);
        await syncDbState({ ...db, pelanggaran_santri: filtered });
        showToast('Catatan pelanggaran berhasil dihapus.', 'info');
      }
    });
  };

  const handleDeleteAllowance = (id: string, name: string) => {
    showConfirm(`Batalkan surat izin khusus untuk ${name}?`, async (yes) => {
      if (yes) {
        const filtered = (db.izin_keamanan || []).filter(i => i.id_izin_khusus !== id);
        await syncDbState({ ...db, izin_keamanan: filtered });
        showToast('Izin khusus berhasil dibatalkan.', 'info');
      }
    });
  };

  // --- PRINT FUNCTIONALITIES ---
  const handlePrintViolations = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = (db.pelanggaran_santri || []).filter(v => {
      const matchesSearch = v.nama_santri.toLowerCase().includes(searchViolations.toLowerCase()) || v.kelas.toLowerCase().includes(searchViolations.toLowerCase());
      const matchesCategory = filterViolationCategory === 'ALL' || v.kategori === filterViolationCategory;
      const matchesStart = violationStartDate ? v.tanggal >= violationStartDate : true;
      const matchesEnd = violationEndDate ? v.tanggal <= violationEndDate : true;
      return matchesSearch && matchesCategory && matchesStart && matchesEnd;
    });

    let tableRows = '';
    filtered.forEach((v, index) => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${v.tanggal}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${v.nama_santri}</strong><br><small>${v.kelas}</small></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            <span style="font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: ${v.kategori === 'BERAT' ? '#fecaca' : v.kategori === 'SEDANG' ? '#feebc8' : '#e6fffa'}; color: ${v.kategori === 'BERAT' ? '#991b1b' : v.kategori === 'SEDANG' ? '#c05621' : '#006d5b'};">
              ${v.kategori}
            </span>
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${v.detail_pelanggaran}</td>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #991b1b;">${v.hukuman}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><small>${v.dicatat_oleh}</small></td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>LAPORAN PELANGGARAN SANTRI</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            h2 { text-align: center; font-size: 12px; font-weight: normal; margin-top: 0; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { border: 1px solid #ddd; padding: 8px; background-color: #f7fafc; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <h1>LAPORAN PELANGGARAN SANTRI</h1>
          <h2>Pesantren PonpesQu - Dicetak pada ${new Date().toLocaleDateString('id-ID')}</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">No</th>
                <th>Tanggal</th>
                <th>Santri & Kelas</th>
                <th style="text-align: center;">Kategori</th>
                <th>Detail Pelanggaran</th>
                <th>Sanksi / Hukuman Keamanan</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">Tidak ada data pelanggaran yang sesuai filter.</td></tr>'}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllowances = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = (db.izin_keamanan || []).filter(i => {
      const matchesSearch = i.nama_santri.toLowerCase().includes(searchAllowances.toLowerCase()) || i.kelas.toLowerCase().includes(searchAllowances.toLowerCase());
      const matchesType = filterAllowanceType === 'ALL' || i.tipe_izin === filterAllowanceType;
      const matchesStart = allowanceStartDate ? i.tanggal >= allowanceStartDate : true;
      const matchesEnd = allowanceEndDate ? i.tanggal <= allowanceEndDate : true;
      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });

    let tableRows = '';
    filtered.forEach((i, index) => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${i.tanggal}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${i.nama_santri}</strong><br><small>${i.kelas}</small></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><strong>${i.tipe_izin}</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #c05621;">
            ${i.is_no_limit ? 'BEBAS LIMIT (NO LIMIT)' : formatRupiah(i.nominal_disetujui)}
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${i.keterangan}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><small>${i.dicatat_oleh}</small></td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>LAPORAN SURAT IZIN KHUSUS KEAMANAN</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            h2 { text-align: center; font-size: 12px; font-weight: normal; margin-top: 0; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { border: 1px solid #ddd; padding: 8px; background-color: #f7fafc; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <h1>LAPORAN SURAT IZIN KHUSUS KEAMANAN (SPENDING OVERRIDES)</h1>
          <h2>Pesantren PonpesQu - Dicetak pada ${new Date().toLocaleDateString('id-ID')}</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">No</th>
                <th>Tanggal</th>
                <th>Santri & Kelas</th>
                <th style="text-align: center;">Tipe Izin</th>
                <th>Nominal Disetujui</th>
                <th>Keterangan / Alasan Override</th>
                <th>Petugas Keamanan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">Tidak ada surat izin khusus yang sesuai filter.</td></tr>'}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter lists
  const query = searchQuery.toLowerCase().trim();
  const matchingSantri = db.santri.filter(s =>
    s.nama_santri.toLowerCase().includes(query) ||
    s.kelas.toLowerCase().includes(query) ||
    s.barcode.toLowerCase().includes(query)
  );

  const displayedViolations = (db.pelanggaran_santri || []).filter(v => {
    const matchesSearch = v.nama_santri.toLowerCase().includes(searchViolations.toLowerCase()) || v.kelas.toLowerCase().includes(searchViolations.toLowerCase());
    const matchesCategory = filterViolationCategory === 'ALL' || v.kategori === filterViolationCategory;
    const matchesStart = violationStartDate ? v.tanggal >= violationStartDate : true;
    const matchesEnd = violationEndDate ? v.tanggal <= violationEndDate : true;
    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });

  const displayedAllowances = (db.izin_keamanan || []).filter(i => {
    const matchesSearch = i.nama_santri.toLowerCase().includes(searchAllowances.toLowerCase()) || i.kelas.toLowerCase().includes(searchAllowances.toLowerCase());
    const matchesType = filterAllowanceType === 'ALL' || i.tipe_izin === filterAllowanceType;
    const matchesStart = allowanceStartDate ? i.tanggal >= allowanceStartDate : true;
    const matchesEnd = allowanceEndDate ? i.tanggal <= allowanceEndDate : true;
    return matchesSearch && matchesType && matchesStart && matchesEnd;
  });

  const displayedIzinPulang = (db.izin_pulang || []).filter(i => {
    const matchesSearch = i.nama_santri.toLowerCase().includes(searchIzinPulang.toLowerCase()) || i.kelas.toLowerCase().includes(searchIzinPulang.toLowerCase());
    const matchesStatus = filterIzinPulangStatus === 'ALL'
      ? true
      : filterIzinPulangStatus === 'TERLAMBAT'
      ? (i.status === 'DISETUJUI' && i.tanggal_kembali < todayStr)
      : i.status === filterIzinPulangStatus;
    const matchesStart = izinPulangStartDate ? i.tanggal_keluar >= izinPulangStartDate : true;
    const matchesEnd = izinPulangEndDate ? i.tanggal_kembali <= izinPulangEndDate : true;
    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  const displayedIzinMerokok = (db.izin_merokok || []).filter(i => {
    const matchesSearch = i.nama_santri.toLowerCase().includes(searchIzinMerokok.toLowerCase()) || i.kelas.toLowerCase().includes(searchIzinMerokok.toLowerCase()) || i.nomor_surat.toLowerCase().includes(searchIzinMerokok.toLowerCase());
    const matchesStatus = filterIzinMerokokStatus === 'ALL' || i.status_izin === filterIzinMerokokStatus;
    return matchesSearch && matchesStatus;
  });

  // --- DASHBOARD DATA FOR IZIN PULANG (LAST 7 DAYS) ---
  const chartDataLast7Days = React.useMemo(() => {
    const days: { dateStr: string; label: string; count: number; dayName: string }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoStr = d.toISOString().slice(0, 10);
      
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      
      const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
      const dayName = dayNames[d.getDay()];

      const activeCount = (db.izin_pulang || []).filter(item => {
        return item.tanggal_keluar <= isoStr && item.tanggal_kembali >= isoStr;
      }).length;

      days.push({
        dateStr: isoStr,
        label: `${dayName}, ${label}`,
        count: activeCount,
        dayName
      });
    }

    return days;
  }, [db.izin_pulang]);

  const totalIzinHariIni = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return (db.izin_pulang || []).filter(item => item.tanggal_keluar <= todayStr && item.tanggal_kembali >= todayStr).length;
  }, [db.izin_pulang]);

  const totalIzinAktif = React.useMemo(() => {
    return (db.izin_pulang || []).filter(item => item.status === 'DISETUJUI').length;
  }, [db.izin_pulang]);

  const totalSudahKembali = React.useMemo(() => {
    return (db.izin_pulang || []).filter(item => item.status === 'KEMBALI').length;
  }, [db.izin_pulang]);

  return (
    <div className="flex flex-col gap-6">
      {/* Upper Welcome Banner */}
      <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <span>👮</span> Assalamualaikum, {activeUser?.nama || 'Admin Keamanan'}
        </h2>
        <p className="text-xs text-emerald-500/80 mt-1">
          Dinas Pos Komando Keamanan Pesantren. Layanan pencatatan kedisiplinan (pelanggaran harian), perizinan pulang santri (otomatis sync absensi), & penerbitan dispensasi limitasi jajan/belanja.
        </p>
      </div>

      {/* NOTIFIKASI OTOMATIS: PERINGATAN SANTRI TERLAMBAT KEMBALI PULANG */}
      {overdueIzinList.length > 0 && (
        <div className="bg-gradient-to-r from-red-950 via-[#2d0a0a] to-red-950 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-red-950/60 text-white space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-red-800/50 pb-3">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-red-500/20 rounded-xl border border-red-500/50 text-red-400">
                <LucideIcon name="alert-triangle" className="w-5 h-5 text-red-400" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-red-200 uppercase tracking-wide flex items-center gap-2 flex-wrap">
                  <span>🚨 NOTIFIKASI KETERLAMBATAN IZIN PULANG</span>
                  <span className="bg-red-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {overdueIzinList.length} Santri Lewat Batas Kembali!
                  </span>
                </h3>
                <p className="text-[11px] text-red-300/80 mt-0.5">
                  Petugas keamanan mohon segera menindaklanjuti santri berikut yang telah melewati tanggal kembali yang ditentukan:
                </p>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('izin-pulang'); setFilterIzinPulangStatus('TERLAMBAT'); }}
              className="px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold border border-red-600/60 shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LucideIcon name="external-link" className="w-3.5 h-3.5" />
              <span>Buka Tab Terlambat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {overdueIzinList.map((item) => {
              const diffDays = Math.max(1, Math.ceil((new Date(todayStr).getTime() - new Date(item.tanggal_kembali).getTime()) / (1000 * 3600 * 24)));
              return (
                <div key={item.id_izin_pulang} className="bg-black/50 border border-red-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-red-400 transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.nama_santri}</span>
                          <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30 font-mono">
                            {item.kelas}
                          </span>
                        </h4>
                        <span className="text-[10px] text-red-300 font-mono block mt-0.5">
                          Izin: {item.tanggal_keluar} ➔ Batas: <strong className="underline text-red-200">{item.tanggal_kembali}</strong>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-red-600/40 text-red-200 border border-red-500/60 rounded-full text-[9px] font-extrabold whitespace-nowrap font-mono">
                        TERLAMBAT {diffDays} HARI
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 mt-1.5 italic line-clamp-1">
                      "{item.alasan}" • Wali/Penjemput: <span className="text-amber-200 font-semibold">{item.penjemput || 'Wali Santri'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-red-900/40 flex-wrap">
                    <button
                      onClick={() => handleConfirmReturnOverdue(item)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Tandai Santri Sudah Tiba/Kembali"
                    >
                      <LucideIcon name="check-circle" className="w-3 h-3" />
                      <span>Konfirmasi Tiba</span>
                    </button>

                    <button
                      onClick={() => handleCatatPelanggaranOverdue(item)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Catat Takzir / Pelanggaran Keterlambatan"
                    >
                      <LucideIcon name="gavel" className="w-3 h-3" />
                      <span>Catat Takzir</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Assalamualaikum Wr. Wb. Kami dari Pos Keamanan Pondok Pesantren mengonfirmasi keberadaan Ananda *${item.nama_santri}* (${item.kelas}). Berdasarkan catatan izin pulang, batas kembali Ananda adalah tanggal *${item.tanggal_kembali}* (terlambat ${diffDays} hari). Mohon info dan tanggapan dari Bapak/Ibu Wali Santri. Terima kasih.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-teal-800 hover:bg-teal-700 text-teal-100 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm ml-auto cursor-pointer"
                    >
                      <LucideIcon name="phone-call" className="w-3 h-3 text-emerald-400" />
                      <span>Hubungi Wali (WA)</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NOTIFIKASI OTOMATIS: PENGAJUAN IZIN PULANG SANTRI/WALI YANG MENUNGGU PERSETUJUAN */}
      {pendingIzinList.length > 0 && (
        <div className="bg-gradient-to-r from-sky-950 via-[#0a233c] to-sky-950 border-2 border-sky-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-sky-950/60 text-white space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-sky-800/50 pb-3">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-sky-500/20 rounded-xl border border-sky-500/50 text-sky-400">
                <LucideIcon name="clock" className="w-5 h-5 text-sky-400" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-sky-200 uppercase tracking-wide flex items-center gap-2 flex-wrap">
                  <span>📩 PERMOHONAN IZIN PULANG BARU (SINKRONISASI PORTAL)</span>
                  <span className="bg-sky-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                    {pendingIzinList.length} Pengajuan Menunggu Persetujuan
                  </span>
                </h3>
                <p className="text-[11px] text-sky-300/80 mt-0.5">
                  Permohonan izin pulang dari santri/wali berikut telah tersinkronisasi otomatis. Tinjau dan berikan persetujuan untuk menerbitkan izin:
                </p>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('izin-pulang'); setFilterIzinPulangStatus('MENUNGGU'); }}
              className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold border border-sky-500/60 shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LucideIcon name="list" className="w-3.5 h-3.5" />
              <span>Tinjau Semua ({pendingIzinList.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {pendingIzinList.map((item) => (
              <div key={item.id_izin_pulang} className="bg-black/40 border border-sky-500/30 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-sky-400 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                      {item.id_izin_pulang}
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      🗓️ {item.tanggal_keluar} s/d {item.tanggal_kembali}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1.5">{item.nama_santri} ({item.kelas})</h4>
                  <p className="text-[11px] text-sky-200/90 italic mt-0.5">"{item.alasan}"</p>
                  <span className="text-[10px] text-sky-400/80 block mt-1">
                    Penjemput: <strong>{item.penjemput || 'Orang Tua / Wali'}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-900/40">
                  <button
                    onClick={() => handleRejectPendingIzin(item)}
                    className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <LucideIcon name="x-circle" className="w-3 h-3" />
                    <span>Tolak</span>
                  </button>
                  <button
                    onClick={() => handleApprovePendingIzin(item)}
                    className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg text-[10px] shadow transition-all cursor-pointer flex items-center gap-1"
                  >
                    <LucideIcon name="check-circle" className="w-3 h-3" />
                    <span>Setujui Izin</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-emerald-950/40 gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('pelanggaran'); setSelectedSantri(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pelanggaran' ? 'bg-emerald-950/40 text-amber-400 border-b-2 border-amber-500' : 'text-emerald-500 hover:text-emerald-400'}`}
        >
          <LucideIcon name="gavel" className="w-4 h-4" />
          <span>Sanksi & Pelanggaran Santri</span>
        </button>
        <button
          onClick={() => { setActiveTab('izin-khusus'); setSelectedSantri(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'izin-khusus' ? 'bg-emerald-950/40 text-amber-400 border-b-2 border-amber-500' : 'text-emerald-500 hover:text-emerald-400'}`}
        >
          <LucideIcon name="unlock" className="w-4 h-4" />
          <span>Izin Belanja & Jajan Lebih</span>
        </button>
        <button
          onClick={() => { setActiveTab('izin-pulang'); setSelectedSantri(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'izin-pulang' ? 'bg-emerald-950/40 text-sky-400 border-b-2 border-sky-500' : 'text-emerald-500 hover:text-emerald-400'}`}
        >
          <LucideIcon name="door-open" className="w-4 h-4 text-sky-400" />
          <span>Izin Pulang Santri</span>
          {pendingIzinList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-sky-500 text-white font-extrabold ml-1 animate-pulse">
              {pendingIzinList.length} Menunggu
            </span>
          )}
          {overdueIzinList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-600 text-white font-extrabold ml-1">
              {overdueIzinList.length} Terlambat
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('izin-merokok'); setSelectedSantri(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'izin-merokok' ? 'bg-emerald-950/40 text-rose-400 border-b-2 border-rose-500' : 'text-emerald-500 hover:text-emerald-400'}`}
        >
          <LucideIcon name="file-text" className="w-4 h-4 text-rose-400" />
          <span>Perizinan Merokok (≥ 17 Thn)</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: BARCODE SCANNER & FORM ENTRY (4 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Card 1: Scanner Input */}
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="scan-line" className="w-4 h-4 text-amber-500" />
              <span>Cari / Scan Kartu Santri</span>
            </h3>

            {/* Always on scanner */}
            <div className="relative group">
              <LiveBarcodeScanner
                title="Pindai Kartu Keamanan"
                subtitle="Dekatkan ID Card santri ke kamera"
                isInline={true}
                onScanSuccess={(decoded) => {
                  const s = db.santri.find(x => x.barcode.toLowerCase() === decoded.trim().toLowerCase());
                  if (s) {
                    handleSelectSantri(s);
                  } else {
                    showToast(`Kartu barcode "${decoded}" tidak dikenali!`, 'error');
                  }
                }}
                dummyOptions={db.santri.map(s => ({
                  label: s.nama_santri,
                  code: s.barcode,
                  subLabel: s.kelas
                }))}
              />
            </div>

            {/* Manual Lookup Input */}
            <div className="relative">
              <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Lookup Nama Santri</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-emerald-500/50 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Ketik nama, kelas, atau barcode..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto bg-emerald-950 border border-emerald-900 rounded-xl p-1 shadow-xl no-scrollbar">
                  {matchingSantri.length === 0 ? (
                    <p className="text-[10px] text-emerald-600 italic text-center py-4">Nama tidak ditemukan.</p>
                  ) : (
                    matchingSantri.map(s => (
                      <div
                        key={s.id_santri}
                        onClick={() => handleSelectSantri(s)}
                        className="p-2 hover:bg-emerald-900/50 cursor-pointer text-xs rounded-lg flex justify-between items-center text-gray-200 transition-colors"
                      >
                        <div>
                          <strong className="block text-white">{s.nama_santri}</strong>
                          <span className="text-[10px] text-emerald-500">{s.kelas}</span>
                        </div>
                        <span className="text-[9px] bg-emerald-900 px-1.5 py-0.5 rounded font-mono text-amber-400">{s.barcode}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Loaded Student Profile Card */}
            {selectedSantri && (
              <div className="bg-emerald-950/60 border border-amber-500/30 p-3.5 rounded-2xl flex flex-col gap-3 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <img
                      src={selectedSantri.foto_profil || "https://placehold.co/150x200/022c22/f59e0b?text=SNT"}
                      alt="Loaded Profile"
                      className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl object-cover border-2 border-amber-500/40 shadow-md shrink-0 bg-emerald-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide truncate">{selectedSantri.nama_santri}</h4>
                      <p className="text-xs text-amber-400 font-semibold">{selectedSantri.kelas}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                          Saku: {formatRupiah(selectedSantri.saldo_utama)}
                        </span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20 font-mono">
                          ID: {selectedSantri.barcode}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveSelectedSantri}
                    className="p-1.5 hover:bg-emerald-900 text-emerald-400 hover:text-red-400 rounded-lg text-sm transition-colors cursor-pointer"
                    title="Hapus / Reset Pilihan"
                  >
                    ✕
                  </button>
                </div>
                
                {/* student violations list */}
                {(() => {
                  const studentViolations = (db.pelanggaran_santri || []).filter(v => v.id_santri === selectedSantri.id_santri);
                  return (
                    <div className="pt-2 border-t border-emerald-900/50 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <LucideIcon name="gavel" className="w-3.5 h-3.5" />
                        <span>Riwayat Pelanggaran & Hukuman ({studentViolations.length})</span>
                      </span>
                      {studentViolations.length === 0 ? (
                        <p className="text-[9px] text-emerald-500/40 italic">Bersih / belum ada catatan pelanggaran.</p>
                      ) : (
                        <div className="max-h-[150px] overflow-y-auto no-scrollbar flex flex-col gap-1.5">
                          {studentViolations.slice().reverse().map(v => (
                            <div key={v.id_pelanggaran} className="p-2 rounded-lg bg-red-950/20 border border-red-900/20 text-[10px] flex flex-col gap-0.5">
                              <div className="flex justify-between text-[8px] font-mono text-emerald-500/50">
                                <span>{v.tanggal}</span>
                                <span className="font-extrabold text-red-400">{v.kategori}</span>
                              </div>
                              <p className="text-gray-200 leading-tight font-medium mt-0.5">{v.detail_pelanggaran}</p>
                              <div className="text-amber-400 font-bold mt-0.5">Hukuman: {v.hukuman}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Card 2: Interactive Form Entry */}
          <div className="glass-card p-5 rounded-2xl">
            {activeTab === 'pelanggaran' ? (
              <form onSubmit={handleSubmitViolation} className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                  <LucideIcon name="gavel" className="w-4 h-4 text-red-500" />
                  <span>Input Laporan Pelanggaran</span>
                </h3>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1.5">Kategori Pelanggaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['RINGAN', 'SEDANG', 'BERAT'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setViolationCategory(cat)}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all border ${
                          violationCategory === cat
                            ? cat === 'BERAT'
                              ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow'
                              : cat === 'SEDANG'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                            : 'bg-emerald-950/30 text-emerald-500 border-emerald-900/40 hover:bg-emerald-950/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Detail Tindakan Pelanggaran</label>
                  <textarea
                    required
                    value={violationDetail}
                    onChange={(e) => setViolationDetail(e.target.value)}
                    placeholder="Contoh: Terlambat sholat berjamaah 3 kali berturut-turut, atau keluar asrama tanpa izin."
                    className="w-full h-20 bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Sanksi & Hukuman Yang Diberikan</label>
                  <input
                    type="text"
                    required
                    value={violationPunishment}
                    onChange={(e) => setViolationPunishment(e.target.value)}
                    placeholder="Contoh: Hafalan Surat Yasin / Piket membersihkan masjid"
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSantri}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all ${
                    selectedSantri
                      ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900/60 cursor-not-allowed'
                  }`}
                >
                  Catat & Laporkan Sanksi
                </button>
              </form>
            ) : activeTab === 'izin-khusus' ? (
              <form onSubmit={handleSubmitAllowance} className="space-y-4">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                  <LucideIcon name="unlock" className="w-4 h-4 text-yellow-500" />
                  <span>Input Izin Belanja / Jajan Lebih</span>
                </h3>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1.5">Tipe Dispensasi Izin</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['JAJAN', 'BELANJA'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setAllowanceType(type);
                          if (type === 'JAJAN') setIsNoLimit(false); // No limit is only for belanja
                        }}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all border ${
                          allowanceType === type
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow'
                            : 'bg-emerald-950/30 text-emerald-500 border-emerald-900/40 hover:bg-emerald-950/60'
                        }`}
                      >
                        IZIN {type}
                      </button>
                    ))}
                  </div>
                </div>

                {allowanceType === 'BELANJA' && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-950/50 rounded-xl border border-emerald-900/40">
                    <input
                      type="checkbox"
                      id="checkbox-no-limit"
                      checked={isNoLimit}
                      onChange={(e) => setIsNoLimit(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 border-emerald-900 focus:ring-amber-500 bg-emerald-950"
                    />
                    <label htmlFor="checkbox-no-limit" className="text-[11px] text-amber-400 font-bold cursor-pointer select-none">
                      Bebas Limit Belanja Hari Ini (No Limit)
                    </label>
                  </div>
                )}

                {!isNoLimit && (
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">
                      Nominal Jatah Hari Ini Disetujui (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={allowanceAmount}
                      onChange={(e) => setAllowanceAmount(Number(e.target.value) || '')}
                      placeholder="Contoh: 75000"
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 text-yellow-400 font-bold font-mono"
                    />
                    <p className="text-[9px] text-emerald-500/50 mt-1 leading-tight">
                      * Nominal ini akan menggantikan limit standar harian santri tersebut khusus untuk hari ini saja.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Alasan Pemberian Izin</label>
                  <input
                    type="text"
                    required
                    value={allowanceReason}
                    onChange={(e) => setAllowanceReason(e.target.value)}
                    placeholder="Contoh: Membeli modul kitab baru / sikat gigi & sabun asrama"
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 text-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSantri}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all ${
                    selectedSantri
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-emerald-950 cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900/60 cursor-not-allowed'
                  }`}
                >
                  Penerbitan Surat Izin Khusus
                </button>
              </form>
            ) : activeTab === 'izin-pulang' ? (
              <form onSubmit={handleSubmitIzinPulang} className="space-y-4">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                  <LucideIcon name="door-open" className="w-4 h-4 text-sky-400" />
                  <span>Input Izin Pulang (Surat Jalan)</span>
                </h3>

                <div className="bg-sky-950/30 border border-sky-900/40 p-2.5 rounded-xl text-[10px] text-sky-300/90 leading-relaxed flex items-start gap-2">
                  <LucideIcon name="info" className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Otomatisasi Presensi:</strong> Menerbitkan izin pulang akan secara otomatis mengisi status presensi <strong>IZIN</strong> pada <strong>Absensi Kelas</strong> & <strong>Sholat Jamaah</strong> santri untuk rentang tanggal tersebut.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Tanggal Keluar</label>
                    <input
                      type="date"
                      required
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-2.5 py-1.5 text-xs text-sky-400 font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Rencana Kembali</label>
                    <input
                      type="date"
                      required
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Alasan / Keperluan Pulang</label>
                  <textarea
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Contoh: Acara keluarga / Pernikahan saudara / Berobat sakit"
                    className="w-full h-16 bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Penjemput / Wali Escort</label>
                  <input
                    type="text"
                    value={leaveEscort}
                    onChange={(e) => setLeaveEscort(e.target.value)}
                    placeholder="Contoh: Bpk. Ahmad (Ayah Santri)"
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSantri}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                    selectedSantri
                      ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900/60 cursor-not-allowed'
                  }`}
                >
                  <LucideIcon name="check-circle" className="w-4 h-4" />
                  <span>Terbitkan Izin Pulang & Sync Absensi</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitIzinMerokok} className="space-y-4">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                  <LucideIcon name="file-text" className="w-4 h-4 text-rose-500" />
                  <span>Permohonan & Data Izin Merokok</span>
                </h3>

                {selectedSantri ? (
                  Number(smokingAge) < 17 ? (
                    <div className="bg-red-950/60 border border-red-500/50 p-2.5 rounded-xl text-[10px] text-red-300 font-bold flex items-center gap-2">
                      <span>❌ SYARAT MINIMAL 17 THN TIDAK TERPENUHI (Usia: {smokingAge || 0} Thn). Izin tidak dapat diterbitkan!</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/60 border border-emerald-500/50 p-2.5 rounded-xl text-[10px] text-emerald-300 font-bold flex items-center gap-2">
                      <span>✅ MEMENUHI SYARAT USIA MINIMAL (Usia: {smokingAge} Thn ≥ 17 Thn)</span>
                    </div>
                  )
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Usia / Umur Santri</label>
                    <input
                      type="number"
                      required
                      min={17}
                      value={smokingAge}
                      onChange={(e) => setSmokingAge(Number(e.target.value) || '')}
                      placeholder="Contoh: 18"
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-2.5 py-1.5 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Nomor Surat SK</label>
                    <input
                      type="text"
                      required
                      value={smokingLetterNo}
                      onChange={(e) => setSmokingLetterNo(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Tanggal Terbit</label>
                    <input
                      type="date"
                      required
                      value={smokingStartDate}
                      onChange={(e) => setSmokingStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Masa Berlaku</label>
                    <input
                      type="text"
                      required
                      value={smokingExpiry}
                      onChange={(e) => setSmokingExpiry(e.target.value)}
                      placeholder="Contoh: 1 Tahun"
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 p-2.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl">
                  <label className="block text-amber-400 text-[10px] uppercase font-bold mb-1">Persetujuan 3 Pihak (TTD Required)</label>
                  
                  <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smokingTtdOrangtua}
                      onChange={(e) => setSmokingTtdOrangtua(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 border-emerald-900 focus:ring-rose-500 bg-emerald-950"
                    />
                    <span>1. Persetujuan & TTD Orang Tua / Wali</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smokingTtdKeamanan}
                      onChange={(e) => setSmokingTtdKeamanan(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 border-emerald-900 focus:ring-rose-500 bg-emerald-950"
                    />
                    <span>2. Persetujuan & TTD Divisi Keamanan</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smokingTtdKiai}
                      onChange={(e) => setSmokingTtdKiai(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 border-emerald-900 focus:ring-rose-500 bg-emerald-950"
                    />
                    <span>3. Persetujuan & TTD Kiai / Pengasuh</span>
                  </label>
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Keterangan / Catatan Tambahan</label>
                  <input
                    type="text"
                    value={smokingReason}
                    onChange={(e) => setSmokingReason(e.target.value)}
                    placeholder="Contoh: Disetujui Pengasuh & Wali"
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSantri || Number(smokingAge) < 17}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                    selectedSantri && Number(smokingAge) >= 17
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900/60 cursor-not-allowed'
                  }`}
                >
                  <LucideIcon name="check-circle" className="w-4 h-4" />
                  <span>Tambahkan Data Izin Merokok</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIST LOGS AND HISTORIES (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {activeTab === 'pelanggaran' ? (
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-emerald-950/50 pb-2 gap-2">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <LucideIcon name="gavel" className="w-4.5 h-4.5" />
                  <span>Daftar Pelanggaran & Hukuman Santri</span>
                </h3>
                <button
                  onClick={handlePrintViolations}
                  className="px-3 py-1 bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <LucideIcon name="printer" className="w-3.5 h-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>

              {/* Filtering bar */}
              <div className="flex flex-col gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={searchViolations}
                    onChange={(e) => setSearchViolations(e.target.value)}
                    placeholder="Cari nama santri / kelas..."
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <select
                    value={filterViolationCategory}
                    onChange={(e) => setFilterViolationCategory(e.target.value as any)}
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-amber-400 focus:outline-none"
                  >
                    <option value="ALL">Semua Kategori Pelanggaran</option>
                    <option value="RINGAN">Pelanggaran Ringan</option>
                    <option value="SEDANG">Pelanggaran Sedang</option>
                    <option value="BERAT">Pelanggaran Berat</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">Dari:</span>
                    <input
                      type="date"
                      value={violationStartDate}
                      onChange={(e) => setViolationStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">S/D:</span>
                    <input
                      type="date"
                      value={violationEndDate}
                      onChange={(e) => setViolationEndDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Log Tables */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Tanggal</th>
                      <th className="py-2.5">Santri</th>
                      <th className="py-2.5 text-center">Tingkat</th>
                      <th className="py-2.5">Keterangan & Sanksi</th>
                      <th className="py-2.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/20">
                    {displayedViolations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-emerald-600/60 italic">Tidak ada catatan pelanggaran terdaftar.</td>
                      </tr>
                    ) : (
                      displayedViolations.slice().reverse().map(v => (
                        <tr key={v.id_pelanggaran} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-all">
                          <td className="py-3 font-mono text-[10px] text-emerald-500/80">{v.tanggal}</td>
                          <td className="py-3">
                            <span className="font-bold text-gray-200 block leading-tight">{v.nama_santri}</span>
                            <span className="text-[10px] text-emerald-500/50">{v.kelas}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border ${
                              v.kategori === 'BERAT'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : v.kategori === 'SEDANG'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {v.kategori}
                            </span>
                          </td>
                          <td className="py-3 leading-relaxed">
                            <p className="text-gray-300 text-[11px]">{v.detail_pelanggaran}</p>
                            <div className="text-[10px] text-red-400 font-bold mt-0.5">
                              Sanksi: <span className="underline">{v.hukuman}</span>
                            </div>
                            <span className="text-[9px] text-emerald-500/40 block mt-0.5">Pencatat: {v.dicatat_oleh}</span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteViolation(v.id_pelanggaran, v.nama_santri)}
                              className="p-1 hover:bg-red-950/30 text-emerald-600 hover:text-red-400 rounded-md transition-colors"
                              title="Hapus Laporan"
                            >
                              <LucideIcon name="trash" className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'izin-khusus' ? (
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-emerald-950/50 pb-2 gap-2">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                  <LucideIcon name="unlock" className="w-4.5 h-4.5" />
                  <span>Daftar Izin Khusus & Spending Overrides</span>
                </h3>
                <button
                  onClick={handlePrintAllowances}
                  className="px-3 py-1 bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <LucideIcon name="printer" className="w-3.5 h-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>

              {/* Filtering bar */}
              <div className="flex flex-col gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={searchAllowances}
                    onChange={(e) => setSearchAllowances(e.target.value)}
                    placeholder="Cari nama santri / kelas..."
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <select
                    value={filterAllowanceType}
                    onChange={(e) => setFilterAllowanceType(e.target.value as any)}
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-yellow-400 focus:outline-none"
                  >
                    <option value="ALL">Semua Tipe Izin</option>
                    <option value="JAJAN">Izin Jajan (Tabungan)</option>
                    <option value="BELANJA">Izin Belanja (Market)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">Dari:</span>
                    <input
                      type="date"
                      value={allowanceStartDate}
                      onChange={(e) => setAllowanceStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">S/D:</span>
                    <input
                      type="date"
                      value={allowanceEndDate}
                      onChange={(e) => setAllowanceEndDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Log Tables */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Tanggal</th>
                      <th className="py-2.5">Santri</th>
                      <th className="py-2.5 text-center">Tipe Izin</th>
                      <th className="py-2.5 text-right">Nominal Baru</th>
                      <th className="py-2.5">Keterangan / Alasan</th>
                      <th className="py-2.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/20">
                    {displayedAllowances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-emerald-600/60 italic">Tidak ada surat izin khusus diterbitkan.</td>
                      </tr>
                    ) : (
                      displayedAllowances.slice().reverse().map(i => {
                        const today = new Date().toISOString().slice(0, 10);
                        const isActiveToday = i.tanggal === today;
                        return (
                          <tr key={i.id_izin_khusus} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-all">
                            <td className="py-3 font-mono text-[10px]">
                              <span className="text-emerald-500 block">{i.tanggal}</span>
                              {isActiveToday ? (
                                <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded border border-amber-500/20 font-bold tracking-wide mt-0.5 inline-block">AKTIF</span>
                              ) : (
                                <span className="text-[8px] bg-emerald-950/40 text-emerald-500/40 px-1 py-0.2 rounded border border-emerald-900/10 font-bold tracking-wide mt-0.5 inline-block">EXPIRED</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="font-bold text-gray-200 block leading-tight">{i.nama_santri}</span>
                              <span className="text-[10px] text-emerald-500/50">{i.kelas}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border ${
                                i.tipe_izin === 'JAJAN'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>
                                {i.tipe_izin}
                              </span>
                            </td>
                            <td className="py-3 text-right font-bold text-amber-400 font-mono">
                              {i.is_no_limit ? (
                                <span className="text-yellow-400 font-extrabold animate-pulse">NO LIMIT</span>
                              ) : (
                                formatRupiah(i.nominal_disetujui)
                              )}
                            </td>
                            <td className="py-3 leading-relaxed">
                              <p className="text-gray-300 text-[11px]">{i.keterangan}</p>
                              <span className="text-[9px] text-emerald-500/40 block mt-0.5">Oleh: {i.dicatat_oleh}</span>
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => handleDeleteAllowance(i.id_izin_khusus, i.nama_santri)}
                                className="p-1 hover:bg-red-950/30 text-emerald-600 hover:text-red-400 rounded-md transition-colors"
                                title="Batalkan Izin"
                              >
                                <LucideIcon name="x-circle" className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'izin-pulang' ? (
            <div className="flex flex-col gap-4">
              {/* Mini KPI Dashboard Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-sky-950/40 border border-sky-900/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Izin Hari Ini</span>
                  <span className="text-xl font-extrabold text-sky-300 mt-0.5">{totalIzinHariIni}</span>
                  <span className="text-[9px] text-sky-500/80">Santri di Luar</span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-900/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Izin Aktif</span>
                  <span className="text-xl font-extrabold text-emerald-300 mt-0.5">{totalIzinAktif}</span>
                  <span className="text-[9px] text-emerald-500/80">Belum Kembali</span>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Sudah Kembali</span>
                  <span className="text-xl font-extrabold text-amber-300 mt-0.5">{totalSudahKembali}</span>
                  <span className="text-[9px] text-amber-500/80">Total Riwayat</span>
                </div>
              </div>

              {/* Recharts Bar Chart Dashboard */}
              <div className="glass-card p-4 rounded-2xl flex flex-col gap-2 border border-sky-900/40 bg-sky-950/20">
                <div className="flex items-center justify-between border-b border-sky-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <LucideIcon name="bar-chart-3" className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                      Grafik Santri Izin Pulang (1 Minggu Terakhir)
                    </h4>
                  </div>
                  <span className="text-[9px] text-sky-400 font-mono bg-sky-900/40 px-2 py-0.5 rounded border border-sky-800/50">
                    Auto-Sync Realtime
                  </span>
                </div>

                <div className="h-44 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataLast7Days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0284c7" opacity={0.15} vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#38bdf8', fontSize: 10 }} 
                        axisLine={{ stroke: '#0369a1' }}
                        tickLine={false}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fill: '#a7f3d0', fontSize: 10 }} 
                        axisLine={{ stroke: '#0369a1' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#022c22', borderColor: '#0284c7', borderRadius: '12px', fontSize: '11px', color: '#f0fdf4' }}
                        formatter={(value: any) => [`${value} Santri`, 'Izin Pulang']}
                        labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {chartDataLast7Days.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#38bdf8' : '#0f172a'} stroke={entry.count > 0 ? '#0284c7' : '#334155'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table Container */}
              <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-emerald-950/50 pb-2 gap-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <LucideIcon name="door-open" className="w-4.5 h-4.5" />
                    <span>Daftar Izin Pulang & Surat Jalan Santri</span>
                  </h3>
                  <button
                    onClick={handlePrintIzinPulangList}
                    className="px-3 py-1 bg-emerald-900 border border-emerald-800 text-sky-400 rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <LucideIcon name="printer" className="w-3.5 h-3.5" />
                    <span>Cetak Rekap</span>
                  </button>
                </div>

              {/* Filtering bar */}
              <div className="flex flex-col gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari nama / kelas..."
                      value={searchIzinPulang}
                      onChange={(e) => setSearchIzinPulang(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1.5 pl-7 rounded-lg text-gray-200 placeholder:text-emerald-600 focus:outline-none"
                    />
                    <LucideIcon name="search" className="w-3.5 h-3.5 text-emerald-600 absolute left-2 top-2" />
                  </div>
                  <div>
                    <select
                      value={filterIzinPulangStatus}
                      onChange={(e) => setFilterIzinPulangStatus(e.target.value as any)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1.5 rounded-lg text-emerald-400 focus:outline-none font-bold"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="MENUNGGU">⏳ MENUNGGU PERSETUJUAN ({pendingIzinList.length})</option>
                      <option value="TERLAMBAT">🚨 TERLAMBAT KEMBALI ({overdueIzinList.length})</option>
                      <option value="DISETUJUI">DISETUJUI (Izin Aktif)</option>
                      <option value="KEMBALI">KEMBALI (Sudah Pulang Pondok)</option>
                      <option value="DITOLAK">DITOLAK</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center text-[10px] text-emerald-500/70">
                  <div className="flex items-center gap-1">
                    <span>Mulai:</span>
                    <input
                      type="date"
                      value={izinPulangStartDate}
                      onChange={(e) => setIzinPulangStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Sampai:</span>
                    <input
                      type="date"
                      value={izinPulangEndDate}
                      onChange={(e) => setIzinPulangEndDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Log Tables */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Santri</th>
                      <th className="py-2.5 text-center">Periode Izin</th>
                      <th className="py-2.5">Alasan / Penjemput</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-center">Aksi / Cetak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/20">
                    {displayedIzinPulang.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-emerald-600/60 italic">Tidak ada catatan izin pulang yang diterbitkan.</td>
                      </tr>
                    ) : (
                      displayedIzinPulang.slice().reverse().map(i => {
                        const isReturned = i.status === 'KEMBALI';
                        const isOverdue = !isReturned && i.status === 'DISETUJUI' && i.tanggal_kembali < todayStr;
                        return (
                          <tr key={i.id_izin_pulang} className={`hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-all ${isOverdue ? 'bg-red-950/20 border-l-2 border-l-red-500' : ''}`}>
                            <td className="py-3">
                              <span className="font-bold text-gray-200 block leading-tight">{i.nama_santri}</span>
                              <span className="text-[10px] text-emerald-500/50">{i.kelas}</span>
                            </td>
                            <td className="py-3 text-center font-mono text-[10px]">
                              <span className="text-sky-400 block font-bold">{i.tanggal_keluar}</span>
                              <span className="text-[9px] text-emerald-500/50">s/d</span>
                              <span className={`block font-bold ${isOverdue ? 'text-red-400 font-extrabold underline' : 'text-amber-400'}`}>{i.tanggal_kembali}</span>
                            </td>
                            <td className="py-3 leading-relaxed">
                              <p className="text-gray-200 text-[11px]">{i.alasan}</p>
                              <span className="text-[9px] text-emerald-400/70 block mt-0.5">Penjemput: {i.penjemput || 'Wali Santri'}</span>
                              <span className="text-[8px] text-emerald-500/40 block">Oleh: {i.dicatat_oleh}</span>
                            </td>
                            <td className="py-3 text-center">
                              {i.status === 'MENUNGGU' ? (
                                <span className="px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse">
                                  ⏳ MENUNGGU
                                </span>
                              ) : i.status === 'DITOLAK' ? (
                                <span className="px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border bg-red-500/20 text-red-400 border-red-500/30">
                                  ✕ DITOLAK
                                </span>
                              ) : isReturned ? (
                                <span className="px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  ✓ KEMBALI
                                </span>
                              ) : isOverdue ? (
                                <span className="px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border bg-red-600/20 text-red-300 border-red-500/50 animate-pulse">
                                  🚨 TERLAMBAT
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border bg-amber-500/10 text-amber-400 border-amber-500/20">
                                  PULANG / AKTIF
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {i.status === 'MENUNGGU' ? (
                                  <>
                                    <button
                                      onClick={() => handleApprovePendingIzin(i)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-[10px] rounded-lg shadow transition-all flex items-center gap-1 cursor-pointer"
                                      title="Setujui Permohonan Izin"
                                    >
                                      <LucideIcon name="check" className="w-3 h-3" />
                                      <span>Setujui</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectPendingIzin(i)}
                                      className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                      title="Tolak Permohonan Izin"
                                    >
                                      <LucideIcon name="x" className="w-3 h-3" />
                                      <span>Tolak</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {!isReturned && i.status === 'DISETUJUI' && (
                                      <button
                                        onClick={() => handleMarkReturned(i.id_izin_pulang, i.nama_santri)}
                                        className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                                        title="Tandai Santri Sudah Kembali"
                                      >
                                        <LucideIcon name="check-square" className="w-3 h-3 text-emerald-400" />
                                        <span>Kembali</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handlePrintSuratIzinPulang(i)}
                                      className="p-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-400 border border-sky-800/40 rounded transition-colors"
                                      title="Cetak Surat Jalan / Izin Pulang"
                                    >
                                      <LucideIcon name="printer" className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteIzinPulang(i.id_izin_pulang, i.nama_santri)}
                                      className="p-1.5 hover:bg-red-950/30 text-emerald-600 hover:text-red-400 rounded transition-colors"
                                      title="Hapus Izin"
                                    >
                                      <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ) : activeTab === 'izin-merokok' ? (
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-emerald-950/50 pb-2 gap-2">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <LucideIcon name="file-text" className="w-4.5 h-4.5" />
                  <span>Daftar Perizinan Merokok (Santri ≥ 17 Tahun)</span>
                </h3>
              </div>

              {/* Filtering bar */}
              <div className="flex flex-col sm:flex-row gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                <input
                  type="text"
                  value={searchIzinMerokok}
                  onChange={(e) => setSearchIzinMerokok(e.target.value)}
                  placeholder="Cari nama santri, kelas, atau nomor SK..."
                  className="flex-1 bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-rose-500/50"
                />
                <select
                  value={filterIzinMerokokStatus}
                  onChange={(e) => setFilterIzinMerokokStatus(e.target.value as any)}
                  className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-rose-400 focus:outline-none"
                >
                  <option value="ALL">Semua Status Izin</option>
                  <option value="AKTIF">AKTIF (Penuh 3 TTD)</option>
                  <option value="MENUNGGU_TTD">Menunggu TTD</option>
                  <option value="DICABUT">DICABUT</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-emerald-900/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-950/80 border-b border-emerald-900 text-emerald-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-3">Santri & SK</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">Usia</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">Persetujuan TTD (3 Pihak)</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">Status Izin</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap">Aksi & Cetak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/40 bg-emerald-950/20">
                    {displayedIzinMerokok.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-emerald-600/70 italic">
                          Belum ada data perizinan merokok.
                        </td>
                      </tr>
                    ) : (
                      displayedIzinMerokok.map(i => (
                        <tr key={i.id_izin_merokok} className="hover:bg-emerald-900/20 border-b border-emerald-950/30 transition-colors">
                          <td className="py-3 px-3 align-middle">
                            <span className="font-bold text-gray-100 text-xs block leading-snug">{i.nama_santri}</span>
                            <span className="text-[11px] text-emerald-400 font-medium block">{i.kelas}</span>
                            <span className="text-[10px] text-amber-300 font-mono bg-emerald-950/90 px-2 py-0.5 rounded border border-amber-800/40 inline-block mt-1 whitespace-nowrap">
                              SK: {i.nomor_surat}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-800/80 text-rose-300 font-bold rounded-lg text-xs whitespace-nowrap inline-flex items-center gap-1 shadow-sm">
                              🔞 {i.umur} Thn
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleTtd(i, 'orangtua')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                  i.ttd_orangtua
                                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/60 hover:bg-emerald-800/50'
                                    : 'bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
                                }`}
                                title="Klik untuk ubah persetujuan Orang Tua / Wali"
                              >
                                {i.ttd_orangtua ? '✓ Wali' : '⏳ Wali'}
                              </button>
                              <button
                                onClick={() => handleToggleTtd(i, 'keamanan')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                  i.ttd_keamanan
                                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/60 hover:bg-emerald-800/50'
                                    : 'bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
                                }`}
                                title="Klik untuk ubah persetujuan Divisi Keamanan"
                              >
                                {i.ttd_keamanan ? '✓ Keamanan' : '⏳ Keamanan'}
                              </button>
                              <button
                                onClick={() => handleToggleTtd(i, 'kiai')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                  i.ttd_kiai
                                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/60 hover:bg-emerald-800/50'
                                    : 'bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
                                }`}
                                title="Klik untuk ubah persetujuan Kiai / Pengasuh"
                              >
                                {i.ttd_kiai ? '✓ Kiai' : '⏳ Kiai'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                            {i.status_izin === 'AKTIF' ? (
                              <span className="px-2.5 py-1 text-[10px] rounded-lg font-extrabold uppercase inline-flex items-center gap-1 border bg-emerald-500/20 text-emerald-300 border-emerald-500/50 whitespace-nowrap">
                                ✓ AKTIF
                              </span>
                            ) : i.status_izin === 'MENUNGGU_TTD' ? (
                              <span className="px-2.5 py-1 text-[10px] rounded-lg font-bold uppercase inline-flex items-center gap-1 border bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse whitespace-nowrap">
                                ⏳ MENUNGGU TTD
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-[10px] rounded-lg font-bold uppercase inline-flex items-center gap-1 border bg-red-500/20 text-red-400 border-red-500/40 whitespace-nowrap">
                                ✕ DICABUT
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              {/* CETAK SURAT PERMOHONAN */}
                              <button
                                onClick={() => handlePrintSuratPermohonanMerokok(i)}
                                className="px-2.5 py-1.5 bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                title="Cetak Surat Permohonan & Rekomendasi (3 TTD)"
                              >
                                <LucideIcon name="file-text" className="w-3.5 h-3.5 text-amber-300" />
                                <span>Surat Permohonan</span>
                              </button>
                              
                              {/* CETAK KARTU IZIN */}
                              <button
                                onClick={() => handlePrintKartuIzinMerokok(i)}
                                className="px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                title="Cetak Kartu Izin Merokok Resmi (Foto Besar, Tanpa TTD)"
                              >
                                <LucideIcon name="printer" className="w-3.5 h-3.5 text-rose-300" />
                                <span>Cetak Kartu</span>
                              </button>

                              {i.status_izin === 'AKTIF' && (
                                <button
                                  onClick={() => handleRevokeIzinMerokok(i)}
                                  className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
                                  title="Cabut Izin"
                                >
                                  <LucideIcon name="x-circle" className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteIzinMerokok(i.id_izin_merokok, i.nama_santri)}
                                className="p-1.5 bg-emerald-950/60 hover:bg-red-950 text-gray-400 hover:text-red-300 border border-emerald-900 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <LucideIcon name="trash-2" className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
