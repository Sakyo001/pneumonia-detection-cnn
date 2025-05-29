/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configuration for Vercel deployment
  swcMinify: true,
  reactStrictMode: true,
  // Make sure all dependencies are properly traced
  output: 'standalone',
  outputFileTracing: true,
  // Configure image domains if needed
  images: {
    domains: ['localhost', 'pneumonia-detection-bi09.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Enable base64 image support
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Optimize compiled output
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
