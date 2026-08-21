import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — the parent Dragon Suite folder
  // has its own package-lock.json, which otherwise confuses Turbopack's
  // auto-detected root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
