import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DataStats from '@/components/DataStats';
import SocialProof from '@/components/SocialProof';
import Features from '@/components/Features';
import TrendPreview from '@/components/TrendPreview';
import Footer from '@/components/Footer';
import HomeGrowthSection from "./components/HomeGrowthSection";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <DataStats />
        <SocialProof />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
