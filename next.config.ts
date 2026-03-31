import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "govcert-web.vercel.app" }],
        destination: "https://govcert.ai/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
