/**
 * Hybrid Onboarding Page
 * =======================
 * Split-screen profiling form
 * Form (left) + Live Preview (right)
 */

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { HybridProfiling } from "@/components/HybridProfiling";

const HybridOnboarding = () => {
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();

  // ─────── REDIRECT IF ALREADY PROFILED ───────

  useEffect(() => {
    if (authProfile) {
      navigate("/dashboard");
    }
  }, [authProfile, navigate]);

  // ─────── RENDER ───────

  return <HybridProfiling />;
};

export default HybridOnboarding;
