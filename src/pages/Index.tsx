import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import PricingSection from "@/components/home/PricingSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import ScrollIndicator from "@/components/ScrollIndicator";
import TournamentBanner from "@/components/TournamentBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ScrollIndicator />
      <main>
        <HeroSection />
        {/* Tournament Banner */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <TournamentBanner />
          </div>
        </section>
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
