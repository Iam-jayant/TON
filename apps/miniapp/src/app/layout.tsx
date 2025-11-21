import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inheritor – TON Deadman Switch",
  description: "Telegram mini app for TON inheritance automation with Razorpay payouts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#030712] text-white">{children}</body>
    </html>
  );
}

