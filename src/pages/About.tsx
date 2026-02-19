import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <div className="max-w-3xl mx-auto px-6 py-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <h1 className="text-4xl font-bold text-foreground mb-4">
        About INTENT
      </h1>

      <p className="text-sm text-muted-foreground mb-12">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-8">
        {/* What is INTENT */}
        <section className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            What is INTENT?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            INTENT is a skill direction system that helps you discover the most viable career path based on your unique profile. We combine deep profiling, AI-powered analysis, and real-world market data to provide you with a clear, actionable blueprint — not generic advice.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Unlike courses that teach you skills or platforms that list job opportunities, INTENT analyzes who you are, what you have, and where you want to go — then filters through thousands of possibilities to find the one direction that makes sense for you.
          </p>
        </section>

        {/* How It Works */}
        <section className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            How It Works
          </h2>
          <div className="text-muted-foreground space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <strong className="text-foreground">Deep Profiling:</strong> We ask 11 detailed questions about your skills, experience, goals, timeline, and constraints.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <strong className="text-foreground">AI Analysis:</strong> Our system analyzes your profile against market opportunities, trends, and feasibility factors.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <strong className="text-foreground">Your Blueprint:</strong> You receive a personalized weekly roadmap with specific tasks, milestones, and AI-generated guidance.
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Our Mission
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe everyone deserves clarity in their career journey. Too many people waste time and money pursuing paths that aren't aligned with their reality. INTENT exists to eliminate that confusion and provide direction based on who you actually are — not who generic advice tells you to be.
          </p>
        </section>

        {/* Contact */}
        <section className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Contact Us
          </h2>
          <div className="text-muted-foreground space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-500" />
              <div>
                <div className="text-xs uppercase tracking-wider mb-1">Support</div>
                <a href="mailto:support@intent.sbs" className="text-teal-600 hover:underline">
                  support@intent.sbs
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-500" />
              <div>
                <div className="text-xs uppercase tracking-wider mb-1">Legal & Privacy</div>
                <a href="mailto:legal@intent.sbs" className="text-teal-600 hover:underline">
                  legal@intent.sbs
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-teal-500" />
              <div>
                <div className="text-xs uppercase tracking-wider mb-1">Location</div>
                <span>Indonesia</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-teal-500" />
              <div>
                <div className="text-xs uppercase tracking-wider mb-1">Website</div>
                <a href="https://intent.sbs" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                  intent.sbs
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Links */}
        <section className="pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/privacy" className="text-teal-600 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/terms" className="text-teal-600 hover:underline">
              Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </div>

    <Footer />
  </div>
);

export default About;
