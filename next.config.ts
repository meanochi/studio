
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import type {
  RuntimeCaching,
} from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
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
    // Exclude all Google APIs from Workbox caching, letting Firestore's own persistence handle it.
    exclude: [/^https?:\/\/firestore\.googleapis\.com\/.*/, /^https?:\/\/.*\.googleapis\.com\/.*/],
  },
   manifest: {
    name: "Family Cookbook",
    short_name: "Cookbook",
    description: "A place for all your family recipes",
    background_color: "#F8F5F1",
    theme_color: "#E07A5F",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/icons/iconi.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/iconi.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
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
