import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Auth Page - Google OAuth Only
 * 
 * Data Flow:
 * 1. User clicks "Sign in with Google"
 * 2. signInWithGoogle() called in AuthContext
 * 3. Supabase OAuth redirects to Google login
 * 4. User authenticates with Google
 * 5. Google redirects back to app with auth session
 * 6. AuthContext onAuthStateChange listener detects session
 * 7. fetchProfile() queries profiles table for user data
 * 8. User redirected to /dashboard
 */

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
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
        toast.error(error.message || "Failed to sign in with Google");
      } else {
        toast.success("Redirecting to Google...");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4 glass rounded-2xl p-8 mt-16"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <img src="/logo.jpg" alt="IntentAI" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-bold text-foreground tracking-tight">
              Intent<span className="text-primary">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold">Sign In or Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Use your Google account to get started with IntentAI
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center gap-3 group mb-6 hover:brightness-110 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Easy and secure sign in
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-foreground space-y-2">
          <div className="flex gap-3">
            <div className="text-primary mt-0.5">✓</div>
            <div>
              <p className="font-medium">Sign in or Create Account</p>
              <p className="text-muted-foreground text-xs">First time? We'll create an account for you</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-primary mt-0.5">✓</div>
            <div>
              <p className="font-medium">Safe & Secure</p>
              <p className="text-muted-foreground text-xs">Your data is protected by Google OAuth</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-primary mt-0.5">✓</div>
            <div>
              <p className="font-medium">Instant Access</p>
              <p className="text-muted-foreground text-xs">Start using IntentAI immediately</p>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
