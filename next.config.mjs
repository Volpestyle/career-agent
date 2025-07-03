/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        'node:crypto': false,
        'node:events': false,
        'node:timers/promises': false,
        'node:tls': false,
      };
      
      // Exclude server-only packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'playwright': 'commonjs playwright',
        'playwright-core': 'commonjs playwright-core',
        'redis': 'commonjs redis',
        '@aws-sdk/client-ecs': 'commonjs @aws-sdk/client-ecs',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
      });
    }
    
    return config;
  },
  
  // Server external packages for better compatibility
  serverExternalPackages: [
    'playwright', 
    'playwright-core', 
    'redis',
    '@aws-sdk/client-ecs',
    '@aws-sdk/client-s3'
  ],
};

export default nextConfig;