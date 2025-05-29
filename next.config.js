/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable output tracing to optimize serverless function size
  output: 'standalone',

  // Modify images configuration
  images: {
    domains: ['res.cloudinary.com', 'pneumonia-detection-bi09.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', 
        hostname: 'pneumonia-detection-bi09.onrender.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  
  // Disable source maps in production to reduce size
  productionBrowserSourceMaps: false,
  
  // Moved from experimental to the new location
  serverExternalPackages: ['sharp', '@prisma/client', 'bcrypt'],
  
  // Compiler options to reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Additional optimizations
  webpack: (config, { isServer }) => {
    // Only keep webpack stats minimal
    config.stats = 'minimal';
    
    // Specific optimizations for production
    if (process.env.NODE_ENV === 'production') {
      // Configure cache settings with absolute path
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(process.cwd(), '.next', 'cache', 'webpack'),
        maxAge: 86400000, // 1 day
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 