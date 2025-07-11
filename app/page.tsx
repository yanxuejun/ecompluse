import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DataStats from '@/components/DataStats';
import SocialProof from '@/components/SocialProof';
import Features from '@/components/Features';
import TrendPreview from '@/components/TrendPreview';
import Footer from '@/components/Footer';
import ConfigChecker from '@/components/ConfigChecker';
import HomeGrowthSection from "./components/HomeGrowthSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <DataStats />
        <SocialProof />
        <Features />
        <HomeGrowthSection />
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <ConfigChecker />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
