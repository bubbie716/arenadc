import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/rules", destination: "/fight-rules", permanent: true },
      { source: "/escrow-policy", destination: "/fight-rules?tab=escrow", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.mcheads.org",
        pathname: "/head/**",
      },
    ],
  },
};

export default nextConfig;
