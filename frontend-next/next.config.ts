import type { NextConfig } from "next";
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // ── Compression & image optimization ──
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.pockethost.io" },
      { protocol: "http",  hostname: "127.0.0.1", port: "8090" },
    ],
  },

  // ── Package import optimization ──
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
    ],
  },

  // ── Security + caching headers ──
  async headers() {
    return [
      // Cache the AI model files for 1 year (they never change between deploys)
      {
        source: "/model/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache icons and static assets
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      // Security headers for all routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "X-XSS-Protection",         value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/index.html",   destination: "/", permanent: true },
      { source: "/:path*.html",  destination: "/:path*", permanent: true },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

