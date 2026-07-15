import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack does not infer it
  // from a lockfile in a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['bronit.test', 'app.bronit.test', 'admin.bronit.test', 'demo.bronit.test', 'hilton.bronit.test', 'super.bronit.test'],
};

export default nextConfig;
