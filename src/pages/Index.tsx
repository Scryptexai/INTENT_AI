import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import GeneratorDemo from "@/components/landing/GeneratorDemo";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <StatsSection />
    <FeaturesSection />
    <GeneratorDemo />
    <TestimonialsSection />
    <Footer />
  </div>
);

export default Index;
