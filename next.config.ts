import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // baystreetoracle.ca opens BSO Intelligence; BSO Jobs lives at /jobs. Temporary while the
      // two-product structure settles.
      { source: "/", destination: "/intelligence", permanent: false },
    ];
  },
};

export default nextConfig;
