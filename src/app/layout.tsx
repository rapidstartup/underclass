import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_URL = "https://replaceproof.com";

export const metadata: Metadata = {
  title: "ReplaceProof Student Simulator",
  description:
    "Run your ReplaceProof simulation: assess AI displacement risk, explore transition decisions, and build a practical 90-day career pivot plan.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "ReplaceProof Student Simulator",
    description:
      "Assess your AI risk and map your 90-day transition plan with ReplaceProof.",
    url: APP_URL,
    siteName: "ReplaceProof",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ReplaceProof Student Simulator",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplaceProof Student Simulator",
    description:
      "Assess your AI risk and map your 90-day transition plan with ReplaceProof.",
    images: [`${APP_URL}/og-image.png`],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
