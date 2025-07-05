import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const priceMap: Record<string, string> = {
  starter: "price_starter_id",
  standard: "price_standard_id",
  premium: "price_premium_id",
};

export async function POST(req: NextRequest) {
  const { tier } = await req.json();
  const priceId = priceMap[tier];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/subscribe?success=1`,
      cancel_url: `${req.nextUrl.origin}/subscribe?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
} 