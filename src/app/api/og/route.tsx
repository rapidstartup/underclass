import { ImageResponse } from "next/og";
import { normalizeOutcome } from "@/lib/outcomes";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const pul = searchParams.get("pul") || "47";
  const outcome = searchParams.get("outcome") || "";
  const normalizedOutcome = normalizeOutcome(outcome);

  const pulNum = Number(pul);

  // Result card (when outcome is provided)
  if (outcome) {
    const config = normalizedOutcome === "replaceProof"
      ? { color: "#22c55e", emoji: "🛡️", badge: "REPLACE-PROOF", label: "Durable trajectory." }
      : normalizedOutcome === "transitionInProgress"
        ? { color: "#eab308", emoji: "⚡", badge: "IN TRANSITION", label: "Progress with exposure." }
        : { color: "#ef4444", emoji: "💀", badge: "HIGH RISK", label: "Immediate pivot needed." };

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0e1a",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${config.color}15, transparent 70%)`,
            }}
          />

          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <span style={{ fontSize: 48 }}>{config.emoji}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: config.color, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
              {config.badge}
            </span>
            <span style={{ fontSize: 48 }}>{config.emoji}</span>
          </div>

          {/* Score */}
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 120, fontWeight: 900, fontFamily: "monospace", color: config.color, lineHeight: 1 }}>
              {pul}
            </span>
            <span style={{ fontSize: 36, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>%</span>
          </div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 24 }}>
            ReplaceProof Risk Index
          </div>

          {/* Label */}
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 8 }}>
            {config.label}
          </div>

          {/* Name */}
          {name && (
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", marginBottom: 32 }}>
              {name}&apos;s ReplaceProof simulation
            </div>
          )}

          {/* Progress bar */}
          <div style={{ width: 400, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "flex", marginBottom: 48 }}>
            <div style={{ width: `${pul}%`, height: 12, borderRadius: 6, background: config.color }} />
          </div>

          {/* CTA */}
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>
            replaceproof.com - take your assessment
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Default card (landing page style)
  const pulColor = pulNum <= 30 ? "#22c55e" : pulNum <= 55 ? "#eab308" : pulNum <= 75 ? "#f97316" : "#ef4444";
  const pulLabel = pulNum <= 20 ? "REPLACE-PROOF" : pulNum <= 40 ? "LOW RISK" : pulNum <= 55 ? "TRANSITIONING" : pulNum <= 75 ? "HIGH RISK" : "CRITICAL EXPOSURE";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e1a",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 800, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
          ReplaceProof
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", marginTop: 16, marginBottom: 48 }}>
          {name ? `${name}'s ReplaceProof assessment preview` : "assess your AI risk and plan your pivot"}
        </div>

        {/* Risk index card */}
        <div style={{ display: "flex", flexDirection: "column", width: 560, padding: "20px 28px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: pulColor, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{pulLabel}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginTop: 2 }}>ReplaceProof Risk Index</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: 42, fontWeight: 900, fontFamily: "monospace", color: pulColor, lineHeight: 1 }}>{pul}</span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>%</span>
            </div>
          </div>
          <div style={{ width: "100%", height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", display: "flex" }}>
            <div style={{ width: `${pul}%`, height: 10, borderRadius: 5, background: pulColor }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 9, color: "rgba(34,197,94,0.4)" }}>REPLACE-PROOF</span>
            <span style={{ fontSize: 9, color: "rgba(234,179,8,0.4)" }}>TRANSITIONING</span>
            <span style={{ fontSize: 9, color: "rgba(239,68,68,0.4)" }}>HIGH RISK</span>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 36, fontSize: 16, color: "rgba(255,255,255,0.2)" }}>
          Take the ReplaceProof assessment -&gt; get your roadmap
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
