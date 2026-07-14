import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack does not infer it
  // from a lockfile in a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['smartix.test', 'app.smartix.test', 'admin.smartix.test', 'demo.smartix.test', 'hilton.smartix.test', 'super.smartix.test'],
};

export default nextConfig;
