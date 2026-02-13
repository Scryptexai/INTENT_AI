/**
 * AuthCallback — Handles OAuth redirect from Supabase
 * 
 * Supabase redirects here after Google OAuth completes.
 * This page detects the session from URL hash/params and redirects to /dashboard.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically picks up the auth tokens from URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/login", { replace: true });
          return;
        }

        if (session) {
          // Successfully authenticated — go to dashboard
          navigate("/dashboard", { replace: true });
        } else {
          // No session found — might still be loading, wait a moment
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              navigate("/dashboard", { replace: true });
            } else {
              navigate("/login", { replace: true });
            }
          }, 1500);
        }
      } catch {
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
          Memverifikasi akun...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
