
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import type {
  runtimeCaching,
} from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: false,
  register: true,
  cacheStartUrl: false, // Set to false to avoid auth proxy conflicts
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: '/',
  fallbacks: {
    document: "/_offline",
  },
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    // Exclude all Google APIs from Workbox caching, letting Firestore's own persistence handle it.
    exclude: [/^https?:\/\/firestore\.googleapis\.com\/.*/, /^https?:\/\/.*\.googleapis\.com\/.*/],
  },
   
});

const nextConfig: NextConfig = {
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
};

export default withPWA(nextConfig);
