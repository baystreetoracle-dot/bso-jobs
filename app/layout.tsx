import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BSO Jobs — Canadian Finance Careers",
  description: "Curated opportunities in Canadian investment banking, markets, private capital and corporate finance.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
