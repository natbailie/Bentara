import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Image Configuration: Whitelist Hugging Face to display backend images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'natbailie-bentara-backend.hf.space',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },

  // 2. Build Settings: Preserved from your original script
  typescript: {
    // Allows production builds to complete even if your project has type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows production builds to complete even if your project has ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;