import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe checkout is currently disabled. Use the member upsell flow instead." },
    { status: 410 }
  );
}

/*
Stripe checkout implementation intentionally disabled for now.
Keep this route shell so Stripe can be restored later without recreating the endpoint.
*/
