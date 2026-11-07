/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return {
        beforeFiles: [
          {
            source: '/uploads/:path*',
            destination: '/api/uploads/:path*',
          },
        ],
    };
  },
};

export default nextConfig;
