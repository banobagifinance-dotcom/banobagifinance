/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'supabase.co',
      'drive.google.com',
      'lh3.googleusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
