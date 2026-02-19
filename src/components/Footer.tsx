import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      {/* Final CTA — directional, not marketing */}
      <div className="py-16 md:py-20 ml-[10%] md:ml-[15%] pl-8 md:pl-12 border-l border-border/30">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-6">
          Skill Direction System
        </p>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
          Sistem membaca profil Anda — skill, kondisi, sumber daya.
          Menyaring peluang yang tidak relevan.
          Memberikan satu arah yang jelas.
        </p>
        <Link
          to="/onboarding"
          className="cmd-primary group"
        >
          Mulai Kalibrasi
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Company Info & Legal */}
      <div className="border-t border-border py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.jpg" alt="INTENT" className="h-6 w-auto" />
              <span className="text-sm font-semibold text-foreground">INTENT</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Skill Direction System that transforms your skills, interests, and constraints into a clear, actionable career path.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:support@intent.sbs" className="hover:text-foreground transition-colors">
                  support@intent.sbs
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:legal@intent.sbs" className="hover:text-foreground transition-colors">
                  legal@intent.sbs
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Indonesia</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider">
              Product
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <Link to="/onboarding" className="text-muted-foreground hover:text-foreground transition-colors">
                Start Profiling
              </Link>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Workspace
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
            Intent © {new Date().getFullYear()} · All rights reserved
          </div>

          {/* Additional Links */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40">
            <a href="https://intent.sbs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/60 transition-colors">
              intent.sbs
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
