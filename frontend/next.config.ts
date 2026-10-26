import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only the Next.js server contacts AppSail. The legacy public variable is
    // accepted here so existing Vercel environments continue to work.
    const backend = (
      process.env.ORBIT_BACKEND_URL ||
      process.env.NEXT_PUBLIC_FASTIFY_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://market-agency-backend-50046841977.development.catalystappsail.in/api/v1"
        : "http://127.0.0.1:9000/api/v1")
    ).replace(/\/+$/, "");
    return [{ source: "/api/v1/:path*", destination: `${backend}/:path*` }];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
