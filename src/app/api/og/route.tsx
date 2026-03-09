import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const pul = searchParams.get("pul") || "";

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
          background: "linear-gradient(135deg, #0a0e1a 0%, #0f1629 50%, #0a0e1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #22d3ee, #a78bfa)",
          }}
        />

        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(34,211,238,0.06), transparent)",
          }}
        />

        {/* Chevron icon */}
        <div style={{ display: "flex", marginBottom: 24 }}>
          <svg width="80" height="60" viewBox="0 0 160 110">
            <polyline
              points="30,20 80,55 30,90"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            <polyline
              points="80,20 130,55 80,90"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          what&apos;s next
        </div>

        {/* Subtitle / personalized */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 40,
          }}
        >
          {name
            ? `${name}'s AI future simulation`
            : "simulate the next 50 years of your life through AI"}
        </div>

        {/* PUL bar if provided */}
        {pul && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 500,
              padding: "16px 24px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Permanent Underclass Likelihood
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: "monospace",
                  color:
                    Number(pul) <= 30
                      ? "#22c55e"
                      : Number(pul) <= 55
                        ? "#eab308"
                        : Number(pul) <= 75
                          ? "#f97316"
                          : "#ef4444",
                }}
              >
                {pul}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 4,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: `${pul}%`,
                  height: 8,
                  borderRadius: 4,
                  background:
                    Number(pul) <= 30
                      ? "#22c55e"
                      : Number(pul) <= 55
                        ? "#eab308"
                        : Number(pul) <= 75
                          ? "#f97316"
                          : "#ef4444",
                }}
              />
            </div>
          </div>
        )}

        {/* Mock notification pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { icon: "💬", text: "iMessage from CEO", color: "#22d3ee" },
            { icon: "🐦", text: "Your tweet went viral", color: "#a78bfa" },
            { icon: "📰", text: "Breaking: AGI achieved", color: "#f97316" },
          ].map((pill) => (
            <div
              key={pill.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 13,
                color: pill.color,
              }}
            >
              {pill.icon} {pill.text}
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Paste your LinkedIn → see your future
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
