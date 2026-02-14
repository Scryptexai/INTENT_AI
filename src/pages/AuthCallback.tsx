/**
 * AuthCallback — Handles OAuth redirect from Supabase
 * 
 * Flow: Google → Supabase callback → redirect here with tokens in URL hash
 * 
 * For implicit flow: tokens arrive as #access_token=...&refresh_token=...
 * For PKCE flow: code arrives as ?code=...
 * 
 * This page is NOT protected — it must be accessible without auth
 * so tokens can be processed before redirecting to protected routes.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Memverifikasi akun...");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    // Step 1: Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setStatus("Login berhasil! Mengalihkan...");
          // Small delay to ensure session is persisted
          setTimeout(() => navigate("/dashboard", { replace: true }), 300);
        }
      }
    );

    // Step 2: Try to process tokens
    const processAuth = async () => {
      // Check if we already have a session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        setStatus("Session ditemukan! Mengalihkan...");
        navigate("/dashboard", { replace: true });
        return;
      }

      // Check for hash tokens (implicit flow)
      if (window.location.hash.includes("access_token")) {
        setStatus("Memproses token...");
        // Supabase JS will auto-detect and process hash tokens
        // via detectSessionInUrl: true — just wait for onAuthStateChange
        return;
      }

      // Check for code param (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        setStatus("Menukar kode autentikasi...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setStatus("Login berhasil! Mengalihkan...");
          navigate("/dashboard", { replace: true });
          return;
        }
        console.error("Code exchange failed:", error);
      }

      // Check for error params from OAuth provider
      const error = params.get("error");
      const errorDescription = params.get("error_description");
      if (error) {
        console.error("OAuth error:", error, errorDescription);
        setStatus(`Error: ${errorDescription || error}`);
        timeout = setTimeout(() => navigate("/login", { replace: true }), 3000);
        return;
      }

      // No tokens, no code, no error — wait then redirect
      setStatus("Menunggu respons...");
      timeout = setTimeout(() => {
        setStatus("Tidak ada respons. Mengalihkan ke login...");
        navigate("/login", { replace: true });
      }, 5000);
    };

    processAuth();

    return () => {
      subscription.unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
          {status}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
