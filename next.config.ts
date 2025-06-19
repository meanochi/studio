
import type {NextConfig} from 'next';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

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
    ],
  },
  webpack: (config, { isServer }) => {
    // Copy the pdf.worker.min.js to the public directory
    // so it can be served statically by Next.js.
    // This is necessary for pdfjs-dist to work correctly in the browser.
    if (!isServer) { // Only run for client-side builds
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(
                path.dirname(require.resolve('pdfjs-dist/package.json')),
                'build/pdf.worker.min.js' // Use the .js worker as per error message
              ),
              // Copy to the root of the public folder. __dirname is the project root here.
              to: path.resolve(__dirname, 'public/pdf.worker.min.js'),
            },
          ],
        })
      );
    }

    // Required for pdfjs-dist to work with webpack
    config.resolve.alias['pdfjs-dist'] = path.resolve(__dirname, './node_modules/pdfjs-dist');

    return config;
  },
};

export default nextConfig;
