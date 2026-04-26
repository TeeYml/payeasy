import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@/lib/env";
import { AppShell } from "@/components/ui/app-shell";
import { StellarAuthProvider } from "@/contexts/StellarAuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://payeasy.dev"),
  title: "PayEasy — Blockchain-Powered Rent Sharing for Roommates",
  description:
    "Find roommates, split rent, and pay securely through Stellar blockchain escrow. PayEasy makes rent sharing transparent, trustless, and effortless.",
  keywords: [
    "rent sharing",
    "roommate finder",
    "blockchain payments",
    "stellar",
    "escrow",
    "rent splitting",
  ],
  openGraph: {
    title: "PayEasy — Blockchain-Powered Rent Sharing",
    description:
      "Find roommates, split rent, and pay securely through Stellar blockchain escrow.",
    type: "website",
    url: "https://payeasy.dev",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} font-sans`}
      >
        <StellarAuthProvider>
          <AppShell>{children}</AppShell>
        </StellarAuthProvider>
      </body>
    </html>
  );
}
