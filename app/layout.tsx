import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scentwork Corporate Console - Levels 1-5 MLM Programme",
  description: "Corporate console for Scentwork MLM programme with Levels 1-5 payout structure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
