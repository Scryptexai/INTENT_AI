import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Mulai", path: "/onboarding" },
  { label: "Dashboard", path: "/dashboard" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border"
          : "bg-transparent"
      }`}
    >
      {/* Thin status strip */}
      <div className="h-12 flex items-center justify-between px-6 md:px-10 max-w-[1400px] mx-auto">
        {/* Mark — not a logo, a system identifier */}
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <img src="/logo.jpg" alt="INTENT" className="h-8 w-auto" />
          <span className="text-sm font-semibold tracking-wider uppercase text-foreground/60">
            INTENT
          </span>
        </Link>

        {/* Desktop — contextual links, not a menu bar */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs tracking-wide uppercase transition-all duration-150 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { textDecoration: "underline", textUnderlineOffset: "4px" } : {}}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="w-6 h-6 bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <div className="w-6 h-6 border border-foreground/20 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                    {getInitials()}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-sm border-border bg-card">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium">{profile?.name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer text-xs">
                    <User className="w-3.5 h-3.5 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-xs text-destructive">
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-xs font-medium text-foreground border border-foreground/20 px-4 py-1.5 hover:border-foreground/50 transition-all"
              >
                Mulai
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground/60 p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile menu — clean panel, not dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="px-6 py-4 flex flex-col">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between py-3 text-xs uppercase tracking-wide transition-colors ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                    <ChevronRight className="w-3 h-3 opacity-20" />
                  </Link>
                );
              })}

              <div className="h-px bg-border my-3" />

              {user ? (
                <>
                  <div className="flex items-center gap-3 py-3">
                    <div className="w-6 h-6 border border-foreground/20 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                      {getInitials()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{profile?.name || "User"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-xs text-muted-foreground py-3 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to="/login"
                    className="text-xs text-muted-foreground py-3 text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-xs font-medium text-foreground border border-foreground/20 py-2.5 text-center"
                  >
                    Mulai
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
