
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import type {
  RuntimeCaching,
} from '@ducanh2912/next-pwa';

const runtimeCaching: RuntimeCaching[] = [
    {
      urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname === '/',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [200],
        },
      },
    },
    {
      urlPattern: ({ url }) => {
        const isApiRoute = url.pathname.startsWith('/api/');
        const isNextData = url.pathname.includes('/_next/data/');
        return url.origin === self.location.origin && (isApiRoute || isNextData);
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-and-data-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        cacheableResponse: {
          statuses: [200],
        },
      },
    },
    {
      urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/_next/static/'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-static-cache',
        expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
            statuses: [200],
        },
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/i,
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
