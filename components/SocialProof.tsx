'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: "Starter",
    price: 199,
    oldPrice: 299,
    features: [
      "NextJS boilerplate",
      "SEO-friendly structure",
      "Blog & CMS",
      "Payment with Stripe",
      "Data storage with Supabase",
      "Google Oauth & One-Tap Login",
      "i18n support",
    ],
    description: "Get started with your first SaaS startup.",
    button: "Get ShipAny ⚡",
    popular: false,
  },
  {
    name: "Standard",
    price: 249,
    oldPrice: 349,
    features: [
      "Everything in Starter, plus",
      "Deploy with Vercel or Cloudflare",
      "Generation of Privacy & Terms",
      "Google Analytics Integration",
      "Google Search Console Integration",
      "Discord community",
      "Technical support for your first ship",
      "Lifetime updates",
    ],
    description: "Ship Fast with your SaaS Startups.",
    button: "Get ShipAny ⚡",
    popular: true,
  },
  {
    name: "Premium",
    price: 299,
    oldPrice: 399,
    features: [
      "Everything in Standard, plus",
      "More Components for choosing",
      "Business Functions & SDK with AI",
      "User Console",
      "Admin System",
      "Credits Management",
      "API Keys Management",
      "Priority Technical Support",
    ],
    description: "Ship Any AI SaaS Startups.",
    button: "Get ShipAny ⚡",
    popular: false,
  },
];

export default function SocialProof() {
  const router = useRouter();
  return (
    <section className="w-full py-12 bg-white flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-8">Choose Your Plan</h2>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex-1 bg-gray-50 rounded-xl shadow-lg p-8 flex flex-col items-center border-2 ${
              plan.popular ? "border-orange-400" : "border-transparent"
            }`}
            style={plan.popular ? { boxShadow: "0 0 0 3px #fbbf24" } : {}}
          >
            <div className="mb-2 text-lg font-semibold text-gray-600">{plan.name}</div>
            {plan.popular && (
              <span className="mb-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">Popular</span>
            )}
            <div className="flex items-end mb-4">
              <span className="text-2xl text-gray-400 line-through mr-2">${plan.oldPrice}</span>
              <span className="text-5xl font-bold">${plan.price}</span>
              <span className="ml-1 text-lg text-gray-500">USD</span>
            </div>
            <div className="mb-4 text-gray-500 text-center">{plan.description}</div>
            <ul className="mb-6 text-left w-full">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center mb-2">
                  <span className="text-green-500 mr-2">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded transition mb-2"
              onClick={() => router.push('/subscribe')}
            >
              {plan.button}
            </button>
            <div className="text-xs text-gray-400">Pay once. Build unlimited projects!</div>
          </div>
        ))}
      </div>
    </section>
  );
} 