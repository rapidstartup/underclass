import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_URL = "https://whats-next-silk-one.vercel.app";

export const metadata: Metadata = {
  title: "what's next — simulate your AI future",
  description:
    "Paste your LinkedIn URL and watch AI simulate the next 50 years of your career. Platform-accurate notifications, a PUL score tracking your odds, and choices that shape your fate.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "what's next — simulate your AI future",
    description:
      "Paste your LinkedIn URL and watch AI simulate the next 50 years of your career.",
    url: APP_URL,
    siteName: "what's next",
    images: [
      {
        url: `${APP_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "what's next — simulate your AI future",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "what's next — simulate your AI future",
    description:
      "Paste your LinkedIn and watch AI simulate the next 50 years of your career.",
    images: [`${APP_URL}/api/og`],
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
