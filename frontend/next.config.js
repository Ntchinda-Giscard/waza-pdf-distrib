/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the crucial setting for Electron packaging
  // It tells Next.js to create a standalone build that includes
  // all dependencies and can run independently
  output: 'standalone',
  
  // Disable image optimization for Electron builds
  // This prevents issues with the built-in image optimization service
  images: {
    unoptimized: true,
  },
  
  // Configure for production builds
  trailingSlash: false,
  
  // If you're using any external dependencies that might cause issues
  // in the Electron environment, you can configure them here
  experimental: {
    // This helps with some bundling issues in Electron
    esmExternals: false,
  },
  
  // Custom webpack configuration for Electron compatibility
  webpack: (config, { isServer }) => {
    // Handle any Node.js specific modules that might cause issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig