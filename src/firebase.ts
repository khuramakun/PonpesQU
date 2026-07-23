import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  getDocs 
} from "firebase/firestore";
import firebaseConfigJson from "../firebase-applet-config.json";

// Config with fallback for seamless Vercel deployment
const firebaseConfig = {
  projectId: firebaseConfigJson?.projectId || "zippy-avatar-v3bk6",
  appId: firebaseConfigJson?.appId || "1:442506369057:web:a4cf43a924c95018bb2b60",
  apiKey: firebaseConfigJson?.apiKey || "AIzaSyDD5ZwqiQ9-1G3xJtOwlZ4NfsVeMEnQW4c",
  authDomain: firebaseConfigJson?.authDomain || "zippy-avatar-v3bk6.firebaseapp.com",
  firestoreDatabaseId: firebaseConfigJson?.firestoreDatabaseId || "ai-studio-percobaanvercelv-2418a874-4800-4389-bcd6-63db46ee8cab",
  storageBucket: firebaseConfigJson?.storageBucket || "zippy-avatar-v3bk6.firebasestorage.app",
  messagingSenderId: firebaseConfigJson?.messagingSenderId || "442506369057"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using configured database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const DATA_COLLECTION_REF = collection(db, "ponpesqu_data");
const MAIN_DOC_REF = doc(db, "ponpesqu_data", "main_db");
const LOGS_DOC_REF = doc(db, "ponpesqu_data", "logs_db");

/**
 * Subscribe to real-time database updates from Firebase Firestore Cloud.
 * Listens to all documents in 'ponpesqu_data' and merges them together seamlessly.
 */
export function subscribeToCloudDb(onDataChange: (data: any) => void) {
  try {
    return onSnapshot(
      DATA_COLLECTION_REF,
      (snapshot) => {
        if (!snapshot.empty) {
          const mergedData: any = {};
          // Combine fields from main_db, logs_db, and any other sub-documents
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (data) {
              Object.assign(mergedData, data);
            }
          });
          onDataChange(mergedData);
        } else {
          onDataChange(null);
        }
      },
      (error) => {
        console.error("Firestore real-time listener error:", error);
      }
    );
  } catch (err) {
    console.error("Failed setting up Firestore listener:", err);
    return () => {};
  }
}

/**
 * Save / sync updated database state to Firebase Firestore Cloud.
 * Splits heavy state across main_db and logs_db to ensure documents stay well below Firestore's 1MB limit.
 */
export async function saveDbToCloud(data: any): Promise<boolean> {
  try {
    if (!data || typeof data !== "object") return false;

    // Deep clone & sanitize
    const cleanData = JSON.parse(JSON.stringify(data));

    // Cap excessive log lengths to prevent endless growth
    if (Array.isArray(cleanData.login_logs) && cleanData.login_logs.length > 200) {
      cleanData.login_logs = cleanData.login_logs.slice(0, 200);
    }
    if (Array.isArray(cleanData.transaksi_market) && cleanData.transaksi_market.length > 500) {
      cleanData.transaksi_market = cleanData.transaksi_market.slice(0, 500);
    }
    if (Array.isArray(cleanData.transaksi_tabungan) && cleanData.transaksi_tabungan.length > 500) {
      cleanData.transaksi_tabungan = cleanData.transaksi_tabungan.slice(0, 500);
    }
    if (Array.isArray(cleanData.yayasan_kas_logs) && cleanData.yayasan_kas_logs.length > 500) {
      cleanData.yayasan_kas_logs = cleanData.yayasan_kas_logs.slice(0, 500);
    }
    if (Array.isArray(cleanData.market_kas_logs) && cleanData.market_kas_logs.length > 500) {
      cleanData.market_kas_logs = cleanData.market_kas_logs.slice(0, 500);
    }
    if (Array.isArray(cleanData.absensi_kelas) && cleanData.absensi_kelas.length > 500) {
      cleanData.absensi_kelas = cleanData.absensi_kelas.slice(0, 500);
    }
    if (Array.isArray(cleanData.absensi_sholat) && cleanData.absensi_sholat.length > 500) {
      cleanData.absensi_sholat = cleanData.absensi_sholat.slice(0, 500);
    }

    // Partition fields into core data and historical logs/secondary collections
    const mainData: any = {
      kas_market: cleanData.kas_market ?? 0,
      kas_yayasan: cleanData.kas_yayasan ?? 0,
      santri: cleanData.santri || [],
      asatidzah_kontak: cleanData.asatidzah_kontak || [],
      users_manajemen: cleanData.users_manajemen || [],
      kelas_list: cleanData.kelas_list || [],
      sholat_rules: cleanData.sholat_rules || [],
      settings: cleanData.settings || {},
      homepage: cleanData.homepage || {},
      keluhan: cleanData.keluhan || [],
      tutup_absen_kelas: cleanData.tutup_absen_kelas || {},
      tutup_absen_sholat: cleanData.tutup_absen_sholat || {}
    };

    const logsData: any = {
      yayasan_kas_logs: cleanData.yayasan_kas_logs || [],
      market_kas_logs: cleanData.market_kas_logs || [],
      transaksi_tabungan: cleanData.transaksi_tabungan || [],
      tagihan: cleanData.tagihan || [],
      absensi_kelas: cleanData.absensi_kelas || [],
      absensi_sholat: cleanData.absensi_sholat || [],
      produk_market: cleanData.produk_market || [],
      stok_market: cleanData.stok_market || [],
      transaksi_market: cleanData.transaksi_market || [],
      pelanggaran_santri: cleanData.pelanggaran_santri || [],
      izin_keamanan: cleanData.izin_keamanan || [],
      perizinan: cleanData.perizinan || [],
      laporan_perkembangan: cleanData.laporan_perkembangan || [],
      izin_pulang: cleanData.izin_pulang || [],
      izin_merokok: cleanData.izin_merokok || [],
      login_logs: cleanData.login_logs || []
    };

    // Save both documents in parallel
    await Promise.all([
      setDoc(MAIN_DOC_REF, mainData, { merge: true }),
      setDoc(LOGS_DOC_REF, logsData, { merge: true })
    ]);

    return true;
  } catch (err) {
    console.error("Failed saving to Firestore:", err);
    return false;
  }
}

/**
 * One-time fetch from Firestore Cloud.
 * Fetches all documents in 'ponpesqu_data' and merges them.
 */
export async function fetchDbFromCloud(): Promise<any | null> {
  try {
    const snaps = await getDocs(DATA_COLLECTION_REF);
    if (!snaps.empty) {
      const mergedData: any = {};
      snaps.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          Object.assign(mergedData, data);
        }
      });
      return mergedData;
    }
  } catch (err) {
    console.error("Failed fetching from Firestore:", err);
  }
  return null;
}
