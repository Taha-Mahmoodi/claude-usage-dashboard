import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise misleads inference.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
