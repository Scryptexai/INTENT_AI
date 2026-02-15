import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      {/* Final CTA — directional, not marketing */}
      <div className="py-16 md:py-20 ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/30">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-6">
          Adaptive Direction System
        </p>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
          Sistem menyaring peluang yang relevan dengan profil Anda.
          Anda tahu harus mulai dari mana.
          Anda tidak lagi browsing acak.
        </p>
        <Link
          to="/onboarding"
          className="cmd-primary group"
        >
          Mulai Kalibrasi
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-border py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* System mark */}
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="INTENT" className="h-5 w-auto" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
            Intent © {new Date().getFullYear()}
          </span>
        </div>

        {/* Links — minimal */}
        <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider text-muted-foreground/30">
          <Link to="/onboarding" className="hover:text-foreground/60 transition-colors">Mulai</Link>
          <Link to="/dashboard" className="hover:text-foreground/60 transition-colors">Dashboard</Link>
          <Link to="/terms" className="hover:text-foreground/60 transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground/60 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
