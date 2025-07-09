import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
// 1. 引入 BigQuery 工具
import { updateUserProfileCreditsAndTier } from '@/lib/bigquery';

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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !webhookSecret || !stripe) {
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 处理不同类型的事件
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment completed for session:', session.id);
        // 获取 Clerk userId 和 tier
        const userId = session.client_reference_id || session.metadata?.userId;
        const tier = session.metadata?.tier;
        let credits: number | null = 20;
        if (tier === 'standard') credits = 580;
        if (tier === 'premium') credits = null;
        if (userId && tier) {
          await updateUserProfileCreditsAndTier(userId, credits, tier);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
} 