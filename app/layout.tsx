import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BSO Jobs — The Canadian Capital Markets Job Board",
  description: "Curated jobs, firms and career intelligence for Canada's capital-markets community.",
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
