import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables strict mode for catching potential issues early
  reactStrictMode: true,

  // Log environment for debugging (never logs secrets)
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // Image domains — add Supabase storage domain when needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
