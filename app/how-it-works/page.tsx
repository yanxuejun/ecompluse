import Link from "next/link";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">How It Works</h1>
        <section className="mb-8 text-lg leading-relaxed">
          <p className="mb-4">
            <strong>EcomPulse</strong> leverages official Google Merchant Center (GMC) BigQuery data to provide you with real-time insights into global product trends. Our platform analyzes millions of product records every week, helping you discover fast-growing products, track market hotspots, and avoid inventory risks.
          </p>
          <ol className="list-decimal list-inside mb-4">
            <li className="mb-2">
              <strong>Data Collection:</strong> We aggregate weekly product performance data from Google Merchant Center's BigQuery datasets, covering multiple countries and categories.
            </li>
            <li className="mb-2">
              <strong>Trend Analysis:</strong> Our algorithms calculate rank changes, demand surges, and identify the fastest-growing products in each category and country.
            </li>
            <li className="mb-2">
              <strong>Visualization:</strong> The platform presents the latest trends in an easy-to-understand dashboard, with filters for country, category, and time.
            </li>
            <li className="mb-2">
              <strong>Actionable Insights:</strong> Use our tools to explore hot trends, spot rising stars, and make data-driven business decisions.
            </li>
          </ol>
          <p>
            Whether you're a seller, analyst, or journalist, EcomPulse empowers you to stay ahead of the market with reliable, up-to-date product intelligence.
          </p>
        </section>
        <div className="flex justify-center">
          <Link href="/">
            <span className="bg-blue-600 text-white px-6 py-3 rounded text-lg font-semibold shadow hover:bg-blue-700 transition cursor-pointer">
              Back to Home
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
} 