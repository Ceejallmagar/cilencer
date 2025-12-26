import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled to prevent double-invocation issues with Firebase Auth in dev
};

export default nextConfig;
