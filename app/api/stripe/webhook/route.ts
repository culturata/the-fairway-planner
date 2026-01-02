import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Checkout session completed:", session.id);

        // Get payment IDs from metadata
        const paymentIdsStr = session.metadata?.paymentIds;
        if (!paymentIdsStr) {
          console.error("No payment IDs in session metadata");
          break;
        }

        const paymentIds = paymentIdsStr.split(",");

        // Update payment status
        await prisma.payment.updateMany({
          where: {
            id: { in: paymentIds },
            stripeSessionId: session.id,
          },
          data: {
            status: "PAID",
            stripePaymentIntentId: session.payment_intent as string,
          },
        });

        console.log(`Updated ${paymentIds.length} payments to PAID`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Checkout session expired:", session.id);

        const paymentIdsStr = session.metadata?.paymentIds;
        if (paymentIdsStr) {
          const paymentIds = paymentIdsStr.split(",");
          await prisma.payment.updateMany({
            where: {
              id: { in: paymentIds },
              stripeSessionId: session.id,
            },
            data: {
              status: "FAILED",
            },
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        console.log("Charge refunded:", charge.id);

        await prisma.payment.updateMany({
          where: {
            stripePaymentIntentId: charge.payment_intent as string,
          },
          data: {
            status: "REFUNDED",
          },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
