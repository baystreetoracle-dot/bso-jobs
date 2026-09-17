import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.baystreetoracle.ca"),
  title: "BSO Jobs — The Canadian Capital Markets Job Board",
  description: "Curated jobs, firms and career intelligence for Canada's capital-markets community.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "BSO Jobs",
    title: "BSO Jobs — The Canadian Capital Markets Job Board",
    description: "Curated jobs, firms and career intelligence for Canada's capital-markets community.",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
