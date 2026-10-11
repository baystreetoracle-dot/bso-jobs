import type { NextConfig } from "next";

/** The domain's own hostnames. Once BSO Intelligence serves them, "/" never reaches this app there. */
const SITE_HOSTS = ["www.baystreetoracle.ca", "baystreetoracle.ca"];

/**
 * www.baystreetoracle.ca is BSO Intelligence (repo bso-intelligence). This app is BSO Jobs, a second
 * Next.js app on the same domain (multi-zones): Intelligence hands it /jobs, /companies, /employers,
 * its public folders and its few API routes (JOBS_ZONE in that repo's next.config.ts). Links from
 * here to Intelligence are plain <a> tags, never <Link>.
 */
const nextConfig: NextConfig = {
  // This app's JS and CSS live under /jobs-static/_next/…, so they never collide with Intelligence's /_next.
  assetPrefix: "/jobs-static",
  async rewrites() {
    // The sitemap moved to /jobs/sitemap.xml (the domain's /sitemap.xml is Intelligence's). Until the
    // switch, this app still answers the domain's /sitemap.xml with it.
    return [{ source: "/sitemap.xml", destination: "/jobs/sitemap.xml" }];
  },
  async redirects() {
    return [
      // Before the switch the domain's home is still served here and opens the Intelligence waitlist.
      ...SITE_HOSTS.map((value) => ({
        source: "/",
        has: [{ type: "host" as const, value }],
        destination: "/intelligence",
        permanent: false,
      })),
      // Anywhere else (bso-jobs.vercel.app), this app's home is the job board.
      { source: "/", destination: "/jobs", permanent: false },
    ];
  },
};

export default nextConfig;
