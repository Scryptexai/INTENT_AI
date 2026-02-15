import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Auth Page — Structural Monochrome
 * Google OAuth via Supabase, redirect to intent.sbs domain
 */

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || "Gagal login dengan Google");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        {/* Axis line */}
        <div className="absolute left-[10%] md:left-[8%] top-0 bottom-0 w-px bg-border/20" />

        <div className="flex items-center justify-center min-h-screen px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[400px] -mt-16"
          >
            {/* Brand Header */}
            <div className="text-center mb-10">
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <img
                  src="/logo.jpg"
                  alt="INTENT"
                  className="w-10 h-10 object-cover"
                  style={{ imageRendering: "auto" }}
                />
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  INTENT
                </span>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
                Skill Direction System
              </p>
            </div>

            {/* Login Panel */}
            <div className="border border-border">
              {/* Panel Header */}
              <div className="py-3 px-5 border-b border-border">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                  Autentikasi
                </p>
              </div>

              {/* Content */}
              <div className="py-8 px-5">
                <h1 className="text-lg font-semibold text-foreground mb-1">
                  Masuk ke INTENT
                </h1>
                <p className="text-xs text-muted-foreground/60 mb-8 leading-relaxed">
                  Gunakan akun Google untuk masuk atau membuat akun baru secara otomatis.
                </p>

                {/* Google Sign In Button with INTENT brand logo */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-5 border border-foreground/20 hover:border-foreground/40 bg-transparent hover:bg-muted/5 text-foreground transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      {/* INTENT brand icon */}
                      <img
                        src="/logo.jpg"
                        alt="INTENT"
                        className="w-5 h-5 object-cover shrink-0"
                      />
                      {/* Arrow connector */}
                      <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                      {/* Google icon */}
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm font-medium">Masuk dengan Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Features list */}
              <div className="border-t border-border divide-y divide-border/50">
                <div className="flex items-start gap-3 py-3 px-5">
                  <span className="text-[10px] text-muted-foreground/30 mt-0.5">01</span>
                  <div>
                    <p className="text-xs text-foreground/70 font-medium">Login atau buat akun</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">Pertama kali? Akun otomatis dibuat</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 px-5">
                  <span className="text-[10px] text-muted-foreground/30 mt-0.5">02</span>
                  <div>
                    <p className="text-xs text-foreground/70 font-medium">Aman & terenkripsi</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">Data dilindungi Google OAuth 2.0</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 px-5">
                  <span className="text-[10px] text-muted-foreground/30 mt-0.5">03</span>
                  <div>
                    <p className="text-xs text-foreground/70 font-medium">Akses langsung</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">Mulai gunakan INTENT segera</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain badge */}
            <div className="mt-6 text-center">
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/30 border border-border/30 px-2 py-1">
                intent.sbs
              </span>
            </div>

            {/* Privacy */}
            <p className="text-center text-[10px] text-muted-foreground/30 mt-4">
              Dengan masuk, Anda menyetujui{" "}
              <Link to="/terms" className="text-muted-foreground/50 hover:text-foreground transition-colors underline underline-offset-2">
                Ketentuan Layanan
              </Link>
              {" "}dan{" "}
              <Link to="/privacy" className="text-muted-foreground/50 hover:text-foreground transition-colors underline underline-offset-2">
                Kebijakan Privasi
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
