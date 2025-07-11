import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DataStats from '@/components/DataStats';
import SocialProof from '@/components/SocialProof';
import Features from '@/components/Features';
import TrendPreview from '@/components/TrendPreview';
import Footer from '@/components/Footer';
import ConfigChecker from '@/components/ConfigChecker';
import HomeGrowthSection from "./components/HomeGrowthSection";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <DataStats />
        <SocialProof />
        <Features />
        <div className="flex justify-center my-8">
          <Link href="/explore">
            <button className="bg-blue-600 text-white px-6 py-3 rounded text-lg font-semibold shadow hover:bg-blue-700 transition">Explore Hot Trends Free</button>
          </Link>
        </div>
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
