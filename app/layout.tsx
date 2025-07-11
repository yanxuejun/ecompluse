import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { ClerkProvider } from "@clerk/nextjs";
import ClientWrapper from "@/components/ClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Product Trends & Analytics | EcomPulse",
  description: "Discover trending products, analyze global market trends, and make data-driven decisions with EcomPulse. Powered by Google Merchant Center and BigQuery.",
  keywords: "product trends, trending products, ecommerce trends, product analytics, global product trends, product research, product ranking, product insights, Google Merchant Center, BigQuery, cross-border ecommerce, data-driven product selection, EcomPulse",
  openGraph: {
    title: "Global Product Trends & Analytics | EcomPulse",
    description: "Discover trending products, analyze global market trends, and make data-driven decisions with EcomPulse. Powered by Google Merchant Center and BigQuery.",
    type: "website",
    url: "https://www.ecompulsedata.com/",
    images: [
      {
        url: "https://www.ecompulsedata.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "EcomPulse Open Graph Image"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Product Trends & Analytics | EcomPulse",
    description: "Discover trending products, analyze global market trends, and make data-driven decisions with EcomPulse.",
    images: ["https://www.ecompulsedata.com/og-image.png"]
  },
  robots: "index, follow"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ClientWrapper />
      <html lang="zh-CN">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <I18nProvider>
            {children}
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
