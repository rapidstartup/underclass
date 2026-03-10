import type { Metadata } from "next";
import { getSession } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const APP_URL = "https://replaceproof.com";

  try {
    const session = await getSession(id);
    if (!session) {
      return { title: "Session not found — ReplaceProof" };
    }

    const name = session.personName || "Someone";
    const pul = session.finalPul ?? 50;
    const outcome = pul <= 20 ? "replaceProof" : pul <= 60 ? "transitionInProgress" : "highRisk";
    const outcomeText = outcome === "replaceProof"
      ? `mapped a replace-proof trajectory (risk: ${pul}%)`
      : outcome === "transitionInProgress"
        ? `is in transition with moderate risk (${pul}%)`
        : `remains high risk in the AI shift (${pul}%)`;

    const title = `${name} ${outcomeText} — ReplaceProof`;
    const description = `${name}'s ReplaceProof simulation. Final score: ${pul}% ReplaceProof Risk Index.`;
    const ogImage = `${APP_URL}/api/og?name=${encodeURIComponent(name)}&pul=${pul}&outcome=${outcome}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/s/${id}`,
        siteName: "ReplaceProof",
        images: [{ url: ogImage, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "ReplaceProof Student Simulator",
    };
  }
}

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
