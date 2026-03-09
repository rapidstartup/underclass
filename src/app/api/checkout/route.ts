import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Continue Your Simulation",
              description: "Unlock the rest of your underclass simulation",
            },
            unit_amount: 199, // $1.99
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${req.nextUrl.origin}/simulate?paid=true&sid={CHECKOUT_SESSION_ID}`,
      metadata: {
        simulation_session_id: sessionId || "",
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("[checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
