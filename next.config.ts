
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import type {
  RuntimeCaching,
} from '@ducanh2912/next-pwa';

const runtimeCaching: RuntimeCaching[] = [
    {
      urlPattern: ({request, url}) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [200],
        },
      },
    },
    {
      urlPattern: ({request, url}) => request.destination === 'script' || request.destination === 'style',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-cache',
        expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
            statuses: [200],
        },
      }
    },
    {
      urlPattern: ({request}) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200], // Cache opaque responses for cross-origin images
        },
      },
    },
    {
       urlPattern: new RegExp('^https://fonts.(?:googleapis|gstatic).com/(.*)'),
       handler: 'CacheFirst',
       options: {
         cacheName: 'google-fonts-cache',
         expiration: {
           maxEntries: 20,
           maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
         },
         cacheableResponse: {
           statuses: [0, 200],
         },
       },
    }
  ];

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
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
};

export default withPWA(nextConfig);
