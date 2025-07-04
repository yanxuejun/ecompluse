import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DataStats from '@/components/DataStats';
import SocialProof from '@/components/SocialProof';
import Features from '@/components/Features';
import TrendPreview from '@/components/TrendPreview';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <DataStats />
        <SocialProof />
        <Features />
        <TrendPreview />
      </main>
      <Footer />
    </div>
  );
}
