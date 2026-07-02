import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise misleads inference.
  turbopack: { root: import.meta.dirname },
  // Static export — the app has no server runtime (client-side fetch, no API routes),
  // so `next build` emits a static `out/` served by any web server (nginx on the VPS).
  output: "export",
  trailingSlash: true, // emit dir/index.html so nginx serves clean paths without config
};

export default nextConfig;
