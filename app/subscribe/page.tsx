"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Starter",
    price: 0,
    oldPrice: 1.99,
    features: [
      "Free trial",
      "Free Points 28",
    ],
    button: "Get EcomPulse",
    popular: false,
    tier: "starter",
  },
  {
    name: "Standard",
    price: 29.99,
    oldPrice: 39.99,
    features: [
      "Free trial",
      "Free Points 580",
    ],
    button: "Get EcomPulse",
    popular: true,
    tier: "standard",
  },
  {
    name: "Premium",
    price: 49.99,
    oldPrice: 69.99,
    features: [
      "Free trial",
      "Free Points Unlimited",
    ],
    button: "Get EcomPulse",
    popular: false,
    tier: "premium",
  },
];

export default function SubscribePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!selected) return;
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/subscribe");
      return;
    }
    // 调用 Stripe API
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: selected }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("创建支付会话失败，请稍后重试。");
    }
  };

  return (
    <section className="w-full py-12 bg-white flex flex-col items-center min-h-screen">
      <h2 className="text-3xl font-bold mb-8">Choose Your Plan</h2>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {plans.map((plan) => {
          const isSelected = selected === plan.tier;
          return (
            <div
              key={plan.name}
              className={`flex-1 bg-gray-50 rounded-xl shadow-lg p-8 flex flex-col items-center border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-orange-500 ring-4 ring-orange-200 scale-105"
                  : plan.popular
                  ? "border-orange-400"
                  : "border-transparent hover:border-orange-200"
              }`}
              style={plan.popular && !isSelected ? { boxShadow: "0 0 0 3px #fbbf24" } : {}}
              onClick={() => setSelected(plan.tier)}
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
              <ul className="mb-6 text-left w-full">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center mb-2">
                    <span className="text-green-500 mr-2">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 font-bold rounded transition mb-2 ${
                  isSelected
                    ? "bg-orange-400 hover:bg-orange-500 text-white cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSelected) handleSubscribe();
                }}
                disabled={!isSelected}
              >
                {plan.button}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
} 