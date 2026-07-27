import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  optimizePackageImports: ["lucide-react", "recharts"],
  serverExternalPackages: ["3dmol"],
};

export default nextConfig;
