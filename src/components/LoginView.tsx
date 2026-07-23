import React, { useState, useEffect } from 'react';
import { LucideIcon } from './LucideIcon';

interface LoginViewProps {
  onLogin: (userVal: string, passVal: string) => Promise<boolean>;
  logoUrl?: string;
  namaPesantren?: string;
  onBackToHome?: () => void;
}

export function LoginView({ onLogin, logoUrl, namaPesantren = "PONPESQU", onBackToHome }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("ponpes_remember_me") === "true";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved credentials if 'Ingat Saya' was enabled
  useEffect(() => {
    const isRemember = localStorage.getItem("ponpes_remember_me") === "true";
    if (isRemember) {
      const savedUser = localStorage.getItem("ponpes_saved_user") || "";
      const savedPass = localStorage.getItem("ponpes_saved_pass") || "";
      if (savedUser) setUsername(savedUser);
      if (savedPass) setPassword(savedPass);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (rememberMe) {
      localStorage.setItem("ponpes_remember_me", "true");
      localStorage.setItem("ponpes_saved_user", username);
      localStorage.setItem("ponpes_saved_pass", password);
    } else {
      localStorage.removeItem("ponpes_remember_me");
      localStorage.removeItem("ponpes_saved_user");
      localStorage.removeItem("ponpes_saved_pass");
    }

    const success = await onLogin(username, password);
    setIsSubmitting(false);
    if (!success) {
      setPassword("");
    }
  };

  return (
    <div id="login-view" className="flex-grow flex items-center justify-center p-4 min-h-screen">
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[800px] h-[800px] border-[1px] border-emerald-500/30 rounded-full absolute animate-[spin_60s_linear_infinite]"></div>
        <div className="w-[600px] h-[600px] border-[1px] border-amber-500/20 rounded-full absolute animate-[spin_40s_linear_reverse_infinite]"></div>
      </div>
      
      <div className="glass-card w-full max-w-md p-8 pt-12 rounded-3xl z-10 gold-glow relative overflow-hidden border-t-4 border-t-emerald-500">
        {onBackToHome && (
          <button 
            onClick={onBackToHome} 
            className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>← Kembali ke Beranda</span>
          </button>
        )}

        <div className="text-center mb-6 mt-2">
          <div className="mb-4">
            <img 
              id="login-logo-img" 
              src={logoUrl || "https://placehold.co/150x150/022c22/f59e0b?text=🕌"} 
              alt="Logo Ponpesqu" 
              className="w-20 h-20 mx-auto object-cover rounded-full border border-emerald-500/30 shadow-lg shadow-emerald-900/50 p-1 bg-emerald-950/80"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{namaPesantren}</h1>
          <p className="text-xs text-emerald-500/80 mt-1 font-medium">Sistem Manajemen Terpadu Pesantren</p>
        </div>
        
        <form id="loginForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-emerald-500/80 mb-1 uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-emerald-500/50 text-xs">
                <LucideIcon name="user" className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                id="username" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#02110e]/50 border border-emerald-900/50 rounded-xl px-4 py-2.5 pl-11 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-600" 
                placeholder="Masukkan ID Pengguna"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-semibold text-emerald-500/80 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-emerald-500/50 text-xs">
                <LucideIcon name="lock" className="w-4 h-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#02110e]/50 border border-emerald-900/50 rounded-xl px-4 py-2.5 pl-11 pr-11 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-600" 
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-emerald-500/60 hover:text-emerald-300 p-1 rounded transition-colors cursor-pointer"
                title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
              >
                <LucideIcon name={showPassword ? "eye-off" : "eye"} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-emerald-800 bg-[#02110e] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-500"
              />
              <span className="text-[11px] font-semibold text-emerald-400/90 group-hover:text-emerald-300 transition-colors">
                Ingat Saya
              </span>
            </label>
            <span className="text-[10px] text-emerald-600 italic">Simpan Login</span>
          </div>
          
          <button 
            type="submit" 
            id="submitBtn" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/50 active:scale-[0.98] flex items-center justify-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
          >
            <span id="btnText">{isSubmitting ? "Memverifikasi..." : "Masuk Sistem"}</span>
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-1">
          <p className="text-[11px] text-amber-500/80 font-medium">
            Hubungi Yayasan untuk Login Santri
          </p>
          <p className="text-[9px] text-emerald-500/40 uppercase tracking-widest font-semibold">
            © {namaPesantren} IT Team
          </p>
        </div>
      </div>
    </div>
  );
}

