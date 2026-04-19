import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoyageAI — Your AI books the trip. You live it.",
  description:
    "Chat with an autonomous AI travel agent. It researches, books, and pays — every dollar traced on-chain via USDC on Base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
