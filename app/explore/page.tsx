"use client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeGrowthSection from "../components/HomeGrowthSection";
import { useEffect, useState } from "react";

export default function ExplorePage() {
  const [latestDate, setLatestDate] = useState("");

  useEffect(() => {
    fetch("/api/products-growth?country=US&category=166&type=fastest")
      .then(res => res.json())
      .then(data => {
        let dateStr = "";
        if (typeof data.rank_timestamp === "string" && data.rank_timestamp) {
          dateStr = data.rank_timestamp.slice(0, 10);
        } else if (
          data.rank_timestamp &&
          typeof data.rank_timestamp === "object" &&
          typeof data.rank_timestamp.value === "string"
        ) {
          dateStr = data.rank_timestamp.value.slice(0, 10);
        }
        setLatestDate(dateStr);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">
            Explore Hot Trends Free
            {latestDate && (
              <span className="ml-4 text-lg font-bold text-blue-700 align-middle">{latestDate} update</span>
            )}
          </h1>
          <HomeGrowthSection />
        </div>
      </main>
      <Footer />
    </div>
  );
} 