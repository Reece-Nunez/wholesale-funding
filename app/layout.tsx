import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wholesale Funding Solutions | Direct Business Capital",
  description:
    "Fast, direct access to working capital for business owners. Same-day approvals, funding in 24-48 hours. No brokers, no delays.",
  openGraph: {
    title: "Wholesale Funding Solutions | Direct Business Capital",
    description:
      "Fast, direct access to working capital for business owners. Same-day approvals, funding in 24-48 hours. No brokers, no delays.",
    url: "https://wholesalefundingsolutions.com",
    siteName: "Wholesale Funding Solutions",
    images: [
      {
        url: "/logo.png",
        width: 940,
        height: 400,
        alt: "Wholesale Funding Solutions",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale Funding Solutions | Direct Business Capital",
    description:
      "Fast, direct access to working capital for business owners. Same-day approvals, funding in 24-48 hours.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
