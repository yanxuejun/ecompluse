import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// 检查环境变量
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set");
}

// 只有在有密钥时才初始化 Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
    })
  : null;

// 价格映射 - 使用实际的价格 ID 或动态创建
const priceMap: Record<string, { amount: number; currency: string; name: string }> = {
  starter: { amount: 19900, currency: "usd", name: "Starter Plan" },
  standard: { amount: 24900, currency: "usd", name: "Standard Plan" },
  premium: { amount: 29900, currency: "usd", name: "Premium Plan" },
};

export async function POST(req: NextRequest) {
  try {
  const { tier } = await req.json();
    
    if (!tier) {
      return NextResponse.json({ error: "Tier is required" }, { status: 400 });
    }
    
    const priceInfo = priceMap[tier];
    if (!priceInfo) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        error: "Stripe not configured. Please set STRIPE_SECRET_KEY environment variable." 
      }, { status: 500 });
    }

    // 动态创建产品而不是使用预定义的价格 ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: priceInfo.currency,
            product_data: {
              name: priceInfo.name,
              description: `One-time payment for ${priceInfo.name}`,
            },
            unit_amount: priceInfo.amount, // 金额以分为单位
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/payment-cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
} 