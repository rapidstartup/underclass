import { NextResponse } from "next/server";
import { researchPerson } from "@/lib/exa";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const profile = await researchPerson(url);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Failed to research profile" },
      { status: 500 }
    );
  }
}
