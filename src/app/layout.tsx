import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../../style.css"; // Directly import our pristine BurnerDrop styles!

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BurnerDrop — Secure File Sharing",
  description: "BurnerDrop: Zero-trust, end-to-end encrypted file sharing via IPFS. No accounts, no tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
      data-theme="dark"
    >
      <body>{children}</body>
    </html>
  );
}
