import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack does not infer it
  // from a lockfile in a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
