import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./job-alerts.css";
import "./intel-look.css";
import { Inter } from "next/font/google";
import { HeaderScroll } from "@/components/header-scroll";

// The same face BSO Intelligence uses, so the two products read as one site.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.baystreetoracle.ca"),
  title: "BSO Jobs — The Canadian Capital Markets Job Board",
  description: "Curated jobs, firms and career intelligence for Canada's capital-markets community.",
  openGraph: {
    type: "website",
    siteName: "BSO Jobs",
    title: "BSO Jobs — The Canadian Capital Markets Job Board",
    description: "Curated jobs, firms and career intelligence for Canada's capital-markets community.",
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
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
        <HeaderScroll />
        <Analytics />
        {/* Speculation rules: hovering a link to Intelligence (a separate app on this domain) fetches
            it ahead, so the switch feels instant. Prefetch only, so a hover never counts as a visit. */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  where: { href_matches: ["/", "/firms", "/firms/*", "/deals", "/deals/*", "/people", "/people/*", "/primers", "/primers/*"] },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
