'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';

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

export default function SocialProof() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!selected) return;
    if (!isLoaded) return;
    if (!isSignedIn) {
      // 使用 Clerk 的内置组件处理登录
      return;
    }
    
    try {
      // 调用 Stripe API
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selected }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error && errorData.error.includes("Stripe not configured")) {
          alert("支付功能暂未配置，请联系管理员。");
          return;
        }
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("创建支付会话失败，请稍后重试。");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      if (error instanceof Error && error.message.includes("No such price")) {
        alert("价格配置错误，请联系管理员。");
      } else {
        alert(`支付处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  return (
    <section 
      id="pricing"
      className="w-full py-12 flex flex-col items-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <h2 
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--color-primary)' }}
      >
        Choose Your Plan
      </h2>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {plans.map((plan) => {
          const isSelected = selected === plan.tier;
          return (
          <div
            key={plan.name}
              className={`flex-1 rounded-xl shadow-lg p-8 flex flex-col items-center border-2 cursor-pointer transition-all duration-200 ${
                isSelected ? "scale-105" : "hover:scale-102"
            }`}
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: isSelected ? 'var(--color-accent)' : 'transparent',
                boxShadow: isSelected 
                  ? '0 0 0 3px var(--color-accent), 0 10px 25px rgba(0,0,0,0.1)' 
                  : '0 10px 25px rgba(0,0,0,0.1)'
              }}
              onClick={() => setSelected(plan.tier)}
          >
              <div 
                className="mb-2 text-lg font-semibold"
                style={{ color: 'var(--color-dark)' }}
              >
                {plan.name}
              </div>
            {plan.popular && (
                <span 
                  className="mb-2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-cta)', 
                    color: 'white' 
                  }}
                >
                  Popular
                </span>
            )}
            <div className="flex items-end mb-4">
                <span 
                  className="text-2xl line-through mr-2"
                  style={{ color: 'var(--color-dark)' }}
                >
                  ${plan.oldPrice}
                </span>
                <span 
                  className="text-5xl font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  ${plan.price}
                </span>
                <span 
                  className="ml-1 text-lg"
                  style={{ color: 'var(--color-dark)' }}
                >
                  USD
                </span>
              </div>
              <ul className="mb-6 text-left w-full">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center mb-2">
                    <span 
                      className="mr-2"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      ✓
                    </span> 
                    <span style={{ color: 'var(--color-dark)' }}>
                      {f}
                    </span>
                </li>
              ))}
            </ul>
              {isSelected ? (
                isSignedIn ? (
                  <button
                    className="w-full py-3 font-bold rounded transition mb-2"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-cta)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe();
                    }}
                  >
                    {plan.button}
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      className="w-full py-3 font-bold rounded transition mb-2"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-cta)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Sign In to Subscribe
                    </button>
                  </SignInButton>
                )
              ) : (
            <button
                  className="w-full py-3 font-bold rounded transition mb-2"
                  style={{
                    backgroundColor: 'var(--color-dark)',
                    color: 'white',
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                  disabled
            >
              {plan.button}
            </button>
              )}
          </div>
          );
        })}
      </div>
    </section>
  );
} 