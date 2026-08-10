import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OneDrive can leave `.next` as an unreadable reparse point. A dedicated
  // build directory is also understood by `next start` and Vercel.
  distDir: ".next-production",
};

export default nextConfig;
