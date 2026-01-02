import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const createCheckoutSchema = z.object({
  costItemIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    const body = await request.json();
    const data = createCheckoutSchema.parse(body);

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get cost items
    const costItems = await prisma.tripCostItem.findMany({
      where: { id: { in: data.costItemIds } },
    });

    if (costItems.length === 0) {
      return NextResponse.json(
        { error: "No cost items found" },
        { status: 404 }
      );
    }

    // Create payment records
    const payments = await Promise.all(
      costItems.map((item) =>
        prisma.payment.create({
          data: {
            userProfileId: userProfile.id,
            tripCostItemId: item.id,
            amountCents: item.amountCents,
            status: "PENDING",
          },
        })
      )
    );

    // Calculate total amount
    const totalAmount = costItems.reduce((sum, item) => sum + item.amountCents, 0);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: costItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: item.amountCents,
        },
        quantity: 1,
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
      metadata: {
        paymentIds: payments.map((p) => p.id).join(","),
        userProfileId: userProfile.id,
      },
    });

    // Update payments with session ID
    await Promise.all(
      payments.map((payment) =>
        prisma.payment.update({
          where: { id: payment.id },
          data: { stripeSessionId: session.id },
        })
      )
    );

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
