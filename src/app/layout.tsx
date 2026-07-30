import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://blacktax.org.za"),
  title: {
    default: "Black Tax | Small Contributions. Lasting Change.",
    template: "%s | Black Tax",
  },
  description:
    "A premium, transparent, community-driven South African crowdfunding platform where small monthly contributions create large-scale impact across education, healthcare, food security, entrepreneurship and community development.",
  applicationName: "Black Tax",
  keywords: [
    "Black Tax",
    "South Africa",
    "non-profit",
    "crowdfunding",
    "black excellence",
    "community development",
    "education funding",
    "healthcare support",
    "Ubuntu",
    "charity transparency",
  ],
  openGraph: {
    title: "Black Tax",
    description: "Together We Can Carry the Weight.",
    siteName: "Black Tax",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Tax",
    description: "Small Contributions. Lasting Change.",
  },
  category: "nonprofit",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#060606] text-[#f3efe7] antialiased">{children}</body>
    </html>
  );
}