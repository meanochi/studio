
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  disable: true,
  register: true,
  cacheStartUrl: false, // Set to false to avoid auth proxy conflicts
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: '/',
  fallbacks: {
    document: "/offline",
  },
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    // Exclude all Google APIs from Workbox caching, letting Firestore's own persistence handle it.
    exclude: [/^https?:\/\/firestore\.googleapis\.com\/.*/, /^https?:\/\/.*\.googleapis\.com\/.*/],
  },
   
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: [
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-slot"
  ],
  webpack: (config, { isServer }) => {
    // This is to fix a bug with genkit and handlebars
    if (isServer) {
        config.externals.push('handlebars');
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
